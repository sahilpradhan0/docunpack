import { useEffect, useRef, useState, Suspense, lazy } from "react";
import { useGeminiContext } from "../context/useGeminiContext";
import { Copy, CopyCheck, Download, MessageCircle, SendHorizonal, Trash2, X } from "lucide-react";
import remarkGfm from "remark-gfm";
import markdownComponents from "../markdownComponents";
import TypingLoader from "./TypingLoader";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import { useFollowup } from "../context/useFollowup";
import { useOutput } from "../context/useOutput";
import { useAuth } from "../context/useAuth";

const ReactMarkdown = lazy(() => import("react-markdown"));
const SyntaxHighlighter = lazy(() => import("react-syntax-highlighter").then(mod => ({ default: mod.Prism })));
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import MarkdownRenderer from "./MarkdownRenderer";

// --- Local CodeBlock component to fix scroll issue ---
function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 flex items-center gap-1 text-xs 
                   bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 z-10"
      >
        {copied ? <CopyCheck size={16} className="text-green-500" /> : <Copy size={16} />}
      </button>

      {/* Wrapping in pre with overflow-x-auto */}
      <pre className="overflow-x-auto rounded-lg">
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"  // keep as div inside pre
          customStyle={{ margin: 0, padding: "1rem", minWidth: "max-content" }} // important for horizontal scroll
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </pre>
    </div>
  );
}

export default function Output() {
  const { data } = useGeminiContext();
  const [copyOutput, setCopyOutput] = useState(false);
  const [showToolTip, setShowToolTip] = useState(false);
  const [questionInput, setQuestionInput] = useState("");
  const [showChatBot, setShowChatBot] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef();
  const chatEndRef = useRef();
  const { followUps, fetchFollowUps, saveFollowUp } = useFollowup();
  const { currentOutputId } = useOutput();
  const { user, session, usage, setUsage, profile } = useAuth();

  const limits = {
    free: { simplify: 10, followup: 5 },
    basic: { simplify: 100, followup: 50 },
    pro: { simplify: Infinity, followup: Infinity },
  };
  const userPlan = profile?.subscription_type || "free";
  const currentLimit = limits[userPlan];
  const followupCount = usage?.followup_count || 0;

  useEffect(() => {
    if (!currentOutputId) {
      setMessages([
        {
          role: "assistant",
          content: "👋 Hi! I can help explain this documentation or the output above. What would you like me to clarify?",
        },
      ]);
      return;
    }

    fetchFollowUps(currentOutputId).then(() => {
      if (followUps.length > 0) {
        setMessages(
          followUps.map((f) => ({
            role: f.role,
            content: f.content,
          }))
        );
      } else {
        setMessages([
          {
            role: "assistant",
            content: "👋 Hi! I can help explain this documentation or the output above. What would you like me to clarify?",
          },
        ]);
      }
    });
  }, [currentOutputId, followUps]);

  function toggleChat() {
    setShowChatBot((prev) => !prev);
  }

  function isNearBottom(el) {
    return el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  }

  useEffect(() => {
    if (!chatRef.current) return;
    if (isNearBottom(chatRef.current)) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleCopyButton = () => {
    navigator.clipboard.writeText(data);
    setCopyOutput(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopyOutput(false), 2000);
  };
  async function askFollowUp(question) {
    console.log("working");
    console.log(question);

    if (!data) return;
    const context = data;
    const token = session?.access_token;
    let resp;
    try {
      if (!session) {
        toast.error("You must be logged in to track usage.");
        return;
      }

      if (!user) return;

      // 2️⃣ Call Gemini API
      const res = await fetch("https://uhkbyfmvgnsbeltanizg.functions.supabase.co/askFollowUp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ question, context: data })
      })

      resp = await res.json();

      console.log(resp.answer);
      const answer = resp?.answer;

      if (!answer) {
        toast.error("No response.");
        return "No response";
      }

      // ✅ Track usage ONLY if an answer exists
      const trackResponse = await fetch(
        "https://uhkbyfmvgnsbeltanizg.functions.supabase.co/trackUsage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            action: "followup",
          }),
        }
      );

      const trackResult = await trackResponse.json();
      if (!trackResponse.ok) {
        toast.error(trackResult?.error || "Failed to track followup usage.");
      } else if (trackResult.ok) {
        setUsage(trackResult.usage);
      }

      return answer;

    } catch (err) {
      console.error("Error in followup:", err);
      toast.error("Error getting followup response.");
      return "Error";
    }
  }
  async function handleSend() {
    if (!questionInput.trim()) return;
    if (!user) {
      toast.error("Please Login First!");
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: questionInput }]);
    setQuestionInput("");

    if (currentOutputId) {
      await saveFollowUp(currentOutputId, "user", questionInput);
    }

    setLoading(true);
    try {
      // Call your Gemini API here as before
      const reply = await askFollowUp(questionInput); // replace with real API call
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (currentOutputId) {
        await saveFollowUp(currentOutputId, "assistant", reply);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  }

  function clearChatHistory() {
    setMessages([]);
    setShowChatBot(false);
  }

  return (
    <>
      <div className="prose prose-lg max-w-none p-6 rounded-2xl bg-white/90 shadow-xl border border-gray-200 w-[100%] mx-auto backdrop-blur-sm
                      prose-headings:font-bold prose-headings:text-gray-900
                      prose-li:font-semibold prose-ol:font-semibold prose-ul:font-semibold
                      prose-code:font-mono prose-code:bg-gray-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded relative">
        {!data ? (
          <p className="text-gray-500 italic text-center">Your simplified docs will appear here...</p>
        ) : (
          <div>
            <section className="flex justify-end mb-2">
              <button className={`cursor-pointer ${copyOutput ? "bg-green-200" : "bg-gray-200"} hover:bg-gray-300 rounded-md p-2`} onClick={handleCopyButton}>
                {copyOutput ? <CopyCheck color="green" /> : <Copy className="text-gray-500 hover:text-purple-600 transition" />}
              </button>
            </section>

            <MarkdownRenderer content={data} />
          </div>
        )}
      </div>

      {/* Chat Button */}
      {data && (
        <button className="fixed bottom-5 right-5 bg-blue-200 hover:bg-blue-300 p-2 rounded-full cursor-pointer" onClick={toggleChat}>
          <MessageCircle color="blue" size={30} />
        </button>
      )}
      {showToolTip && <h6 className="fixed bottom-18 right-14 text-sm bg-blue-200 hover:bg-blue-300 p-2 rounded-full italic w-fit">Still Confused? Ask Questions</h6>}

      {/* ChatBot */}
      {showChatBot && (
        <div className="fixed bottom-20 right-10 w-[75%] sm:w-[450px] md:w-[500px] max-w-[90%] h-[450px] max-h-[70vh] bg-white flex flex-col gap-10 shadow-lg rounded-xl z-50">
          <div className="bg-blue-500 w-full flex justify-between px-2 py-1 h-10 items-center rounded-t-xl">
            <h1 className="text-white font-semibold text-sm md:text-[16px]">DocUnpack Assistant</h1>
            <div className="flex items-center gap-2">
              <button className="hover:bg-red-200 p-1 rounded-md" onClick={clearChatHistory}><Trash2 color="red" className="w-5 h-5 sm:w-6 sm:h-6" /></button>
              <button className="hover:bg-blue-800 p-1 rounded-md" onClick={() => setShowChatBot(false)}><X color="white" className="w-5 h-5 sm:w-6 sm:h-6" /></button>
            </div>
          </div>
          <div ref={chatRef} className="flex-grow overflow-y-auto px-2 py-1 space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`p-2 max-w-[90%] ${m.role === "user" ? "ml-auto bg-blue-100 text-blue-900 rounded-t-2xl rounded-bl-2xl" : "mr-auto bg-gray-100 text-gray-800 rounded-t-2xl rounded-br-2xl"}`}>
                {m.role === "assistant" ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{m.content}</ReactMarkdown> : m.content}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg rounded-bl-none shadow-sm text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="border border-gray-200 flex items-center mb-2 px-1 rounded-lg ml-1 mr-1">
            <input
              type="text"
              className="p-2 w-full outline-none"
              disabled={followupCount >= currentLimit?.followup}
              placeholder="Enter your questions"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              disabled={followupCount >= currentLimit?.followup}
              className={`p-2 rounded-full ${followupCount >= currentLimit?.followup ? "bg-gray-400 text-black cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
              onClick={handleSend}
            >
              <SendHorizonal color="white" size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
