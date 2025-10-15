import React, { useEffect, useMemo, useRef, useState, Suspense, lazy } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, CopyCheck, Download, Trash2 } from "lucide-react";
import markdownComponents from "../markdownComponents";
import { useInput } from "../context/useInput";
import { useOutput } from "../context/useOutput";
import { useFollowup } from "../context/useFollowup";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import Breadcrumbs from "../components/Breadcrumbs";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useAuth } from "../context/useAuth";
import { useGeminiContext } from "../context/useGeminiContext";
import MarkdownRenderer from "../components/MarkdownRenderer";
const PdfDocument = lazy(() => import('../components/PdfDocument'));

export default function History() {
    const { inputs } = useInput();
    const { outputs, setOutputs } = useOutput();
    const { followUps, fetchFollowUps, saveFollowUp } = useFollowup();
    const [copied, setCopied] = useState(false);
    const { data } = useGeminiContext();

    const { user, setUsage, session } = useAuth();
    const [selectedOutput, setSelectedOutput] = useState(null);
    const [selectedInput, setSelectedInput] = useState(null);
    const [messages, setMessages] = useState([]); // local chat state (mirrors followUps)
    const [questionInput, setQuestionInput] = useState("");
    const [loadingAI, setLoadingAI] = useState(false);
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [openClearHistoryModal, setOpenClearHistoryModal] = useState(false);
    const pdfRef = useRef(null);
    // pick first output on mount (if any)
    useEffect(() => {
        if (outputs?.length && !selectedOutput) {
            setSelectedOutput(outputs[0]);
        }
    }, [outputs]);

    // when selectedOutput changes, find its input and load follow-ups
    useEffect(() => {
        if (!selectedOutput) {
            setSelectedInput(null);
            setMessages([]);
            return;
        }
        if (!inputs || inputs.length === 0) return;
        const inputRow = inputs?.find((i) => i.id === selectedOutput.input_id) || null;
        setSelectedInput(inputRow);

        // load follow-ups from DB
        fetchFollowUps(selectedOutput.id);
    }, [selectedOutput, inputs]);

    // when followUps in context update, reflect them locally
    useEffect(() => {
        if (!selectedOutput) return;
        // only map followUps that belong to the selected output
        const mapped = (followUps || []).filter((f) => f.output_id === selectedOutput.id).map((f) => ({ role: f.role, content: f.content, id: f.id }));
        setMessages(mapped);
    }, [followUps, selectedOutput]);

    // Filtered outputs list for sidebar
    const filteredOutputs = useMemo(() => {
        if (!outputs) return [];
        const q = query.trim().toLowerCase();
        if (!q) return outputs;

        return outputs.filter((o) => {
            const inputRow = inputs?.find((i) => i.id === o.input_id);
            const link = inputRow?.api_link || "";
            const text = o.simplified_text || "";
            return (link + " " + text).toLowerCase().includes(q);
        });
    }, [outputs, inputs, query]);

    // copy simplified markdown to clipboard
    const copyMarkdown = async () => {
        if (!selectedOutput?.simplified_text) return;
        await navigator.clipboard.writeText(selectedOutput.simplified_text);
        toast.success("Copied to clipboard");
    };

    // download as markdown file

    const formatTxt = () => {
        if (!selectedOutput?.simplified_text) return "";

        return selectedOutput.simplified_text
            .replace(/```/g, "\n") // Remove ``` markers
            .replace(/#+\s/g, "")   // Remove headings markers
            .replace(/\*\*(.*?)\*\*/g, "$1") // Bold -> plain
            .replace(/\*(.*?)\*/g, "$1");    // Italic -> plain
    };

    const handleDownload = (type) => {
        if (!selectedOutput) return;

        let content = selectedOutput.simplified_text;

        if (type === "txt") {
            content = formatTxt();
        }

        const blob = new Blob([content], {
            type: type === "md" ? "text/markdown" : "text/plain",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `docunpack-${selectedOutput.id}.${type}`;
        a.click();
        URL.revokeObjectURL(url);
        setOpen(false);
    };



    // delete an output (and its follow-ups via cascade)
    const deleteOutput = async (id) => {
        const { error } = await supabase.from("outputs").delete().eq("id", id);
        if (error) {
            toast.error("Failed to delete output: " + error.message);
            return;
        }

        setOutputs((prev) => prev.filter((p) => p.id !== id));
        toast.success("Deleted output");

        // pick a new selected output
        setSelectedOutput((prev) =>
            prev && prev.id === id ? outputs?.find((o) => o.id !== id) || null : prev
        );
    };
    const clearAllHistory = async (userId) => {
        try {
            const { error } = await supabase
                .from("outputs")
                .delete()
                .eq("user_id", userId);

            if (error) {
                toast.error("Failed to clear history");
                return;
            }

            setOutputs([]); // clear state
            setSelectedOutput(null); // reset selection
            toast.success("All history cleared");
        } catch (err) {
            console.error(err);
            toast.error("Unexpected error while clearing history");
        }
    };

    // Ask Gemini a follow-up question using the selected output as context
    async function askFollowUp(question) {
        console.log("working");
        console.log(question);

        // if (!data) return;
        if (!selectedOutput) return "";
        const context = selectedOutput.simplified_text || "";
        setLoadingAI(true);
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
                body: JSON.stringify({ question, context })
            })

            resp = await res.json();

            console.log(resp);
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


    // send question -> save user message -> call AI -> save assistant message
    const handleSend = async () => {
        const q = questionInput.trim();
        if (!q || !selectedOutput) return;

        // optimistic local add
        setMessages((prev) => [...prev, { role: "user", content: q }]);

        // save user message
        await saveFollowUp(selectedOutput.id, "user", q);

        setQuestionInput("");
        setLoadingAI(true);

        try {
            const reply = await askFollowUp(q);
            setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
            await saveFollowUp(selectedOutput.id, "assistant", reply);
        } catch (err) {
            setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
            console.error(err);
        } finally {
            setLoadingAI(false);
        }
    };

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-gray-50 mb-2">
            <div className="flex items-center justify-end">
                <div className="mb-2">
                    {filteredOutputs.length > 0 && <button onClick={() => setOpenClearHistoryModal(true)} className="text-red-500 bg-red-100 py-2 px-4 rounded-lg hover:bg-red-200 text-xs sm:text-sm">Clear History</button>}
                </div>
                <Modal
                    open={openClearHistoryModal}
                    onClose={() => setOpenClearHistoryModal(false)}
                    onConfirm={() => clearAllHistory(user.id)}
                    title="Clear History?"
                    description="Are you sure you want to clear your history? This action will permanently delete all your simplified docs and follow-up answers. You won’t be able to recover them."
                    btnName="Clear History"
                />
            </div>
            <div className="max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar */}
                <aside className="lg:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow
                  lg:sticky lg:top-5 lg:self-start lg:h-screen lg:max-h-[95vh] ">
                    <Breadcrumbs current="History" />
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search history..."
                            className="w-full p-2 border rounded"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[60vh] lg:max-h-[70vh]">
                        {filteredOutputs.length === 0 ? (
                            <p className="text-sm text-gray-500">No history yet.</p>
                        ) : (
                            filteredOutputs.map((o) => {
                                const inputRow = inputs?.find((i) => i.id === o.input_id);
                                const preview = o.simplified_text?.slice(0, 120).replace(/\n/g, " ") || "-";
                                return (
                                    <div
                                        key={o.id}
                                        className={`p-3 rounded cursor-pointer border ${selectedOutput?.id === o.id
                                            ? "border-blue-400 bg-blue-50"
                                            : "border-transparent hover:border-gray-200"
                                            }`}
                                        onClick={() => setSelectedOutput(o)}
                                    >
                                        <div className="flex flex-col">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {inputRow?.api_link ? new URL(inputRow.api_link).hostname : inputRow?.api_text?.slice(0,20) + ".." }
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(o.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2">{preview}...</p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* Main */}
                <main className="lg:col-span-9 bg-white dark:bg-gray-800 rounded-lg p-1 sm:p-6 shadow">
                    {filteredOutputs.length == 0 ? (<div className="flex flex-col gap-2 items-center justify-center py-10 px-4">
                        <h3 className="text-2xl font-semibold text-gray-700">No History yet</h3>
                        <p className="text-md text-gray-500 mt-2">
                            You haven’t simplified any docs or asked any follow-up questions yet.
                            Start by pasting a doc or typing some text to get started!
                        </p>
                    </div>) :
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                            <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedInput?.api_link ? new URL(selectedInput.api_link).hostname : "Selected Doc"}</h2>
                                    <p className="text-xs text-gray-500 break-all  whitespace-normal ">{selectedInput?.api_link || (selectedInput?.api_text?.slice(0, 120) + "...")}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={copyMarkdown} className="cursor-pointer px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"><Copy size={16} /></button>
                                    <div className="relative inline-block">
                                        <button
                                            onClick={() => setOpen(!open)}
                                            className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                        >
                                            <Download />
                                        </button>
                                        {open && (
                                            <div className="absolute mt-2 bg-white border rounded shadow z-10">
                                                <button onClick={() => handleDownload("md")} className="cursor-pointer block px-4 py-2 w-full text-left">.md</button>
                                                <button onClick={() => handleDownload("txt")} className="cursor-pointer block px-4 py-2 w-full text-left">.txt</button>
                                                <Suspense fallback={<div className="block px-4 py-2">Loading PDF...</div>}>
                                                    <PDFDownloadLink
                                                        document={<PdfDocument output={selectedOutput} />}
                                                        fileName={`docunpack-${selectedOutput?.id}.pdf`}
                                                        className="block px-4 py-2 w-full text-left"
                                                    >
                                                        {({ loading }) => (loading ? "Generating PDF..." : ".pdf")}
                                                    </PDFDownloadLink>
                                                </Suspense>
                                            </div>
                                        )}
                                    </div>
                                    {selectedOutput && <button onClick={() => setOpenModal(true)} className="cursor-pointer px-3 py-2 rounded bg-red-100 hover:bg-red-200" ><Trash2 size={16} color="red" /></button>}
                                </div>
                            </div>
                            <Modal
                                open={openModal}
                                onClose={() => setOpenModal(false)}
                                onConfirm={() => deleteOutput(selectedOutput.id)}
                                title="Delete history item?"
                                description="This action cannot be undone. The input, output, and follow-ups will be permanently deleted."
                                btnName="Delete"
                            />
                            <div className="mt-6 prose max-w-none bg-white text-black" id="output-container" ref={pdfRef}>
                                {!selectedOutput ? (
                                    <p className="text-gray-500">Select a history item to view the simplified docs.</p>
                                ) : (
                                    // <ReactMarkdown
                                    //     remarkPlugins={[remarkGfm]}
                                    //     components={{
                                    //         ...markdownComponents,
                                    //         code({ node, inline, className, children, ...props }) {
                                    //             const match = /language-(\w+)/.exec(className || "");

                                    //             const handleCopy = () => {
                                    //                 navigator.clipboard.writeText(children);
                                    //                 setCopied(true);
                                    //                 setTimeout(() => setCopied(false), 2000);
                                    //             };

                                    //             return !inline && match ? (
                                    //                 <div className="relative overflow-x-auto rounded-lg">
                                    //                     <button
                                    //                         onClick={handleCopy}
                                    //                         className="absolute top-4 right-2 flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition"
                                    //                     >
                                    //                         {copied ? (
                                    //                             <>
                                    //                                 <CopyCheck size={16} className="text-green-500" />
                                    //                             </>
                                    //                         ) : (
                                    //                             <>
                                    //                                 <Copy size={16} />
                                    //                             </>
                                    //                         )}
                                    //                     </button>
                                    //                     <SyntaxHighlighter
                                    //                         style={oneDark}
                                    //                         language={match[1]}
                                    //                         PreTag="div"
                                    //                         {...props}
                                    //                     >
                                    //                         {String(children).replace(/\n$/, "")}
                                    //                     </SyntaxHighlighter>
                                    //                 </div>
                                    //             ) : (
                                    //                 <code {...props} >{children}</code>
                                    //             );
                                    //         },
                                    //     }}
                                    // >
                                    //     {selectedOutput.simplified_text}
                                    // </ReactMarkdown>
                                    <MarkdownRenderer content={selectedOutput.simplified_text} />
                                )}
                            </div>

                            {/* Follow-up chat area */}
                            <div className="mt-6 bg-blue-100 p-4 rounded-xl border-2 border-blue-500">
                                <h3 className="text-xl font-semibold mb-3">DocUnpack Assistant</h3>
                                {followUps.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No follow-ups yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {followUps.map((f) => (
                                            <div
                                                key={f.id}
                                                className={`flex ${f.role === "user" ? "justify-end" : "justify-start"
                                                    }`}
                                            >
                                                <div
                                                    style={{ wordBreak: "break-word" }}
                                                    className={`max-w-[75%] p-3 rounded-lg shadow-sm text-sm break-words whitespace-pre-wrap overflow-hidden
                                                ${f.role === "user"
                                                            ? "bg-blue-500 text-white rounded-br-none"
                                                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
                                                        }`}
                                                >

                                                    <ReactMarkdown
                                                        components={{
                                                            code({ inline, className, children, ...props }) {
                                                                const match = /language-(\w+)/.exec(className || "");
                                                                return !inline && match ? (
                                                                    <SyntaxHighlighter
                                                                        style={oneDark}
                                                                        language={match[1]}
                                                                        PreTag="div"
                                                                        {...props}
                                                                    >
                                                                        {String(children).replace(/\n$/, "")}
                                                                    </SyntaxHighlighter>
                                                                ) : (
                                                                    <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded text-sm">
                                                                        {children}
                                                                    </code>
                                                                );
                                                            },
                                                        }}
                                                    >
                                                        {f.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {loadingAI && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg rounded-bl-none shadow-sm text-sm">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                            </span>
                                        </div>
                                    </div>)}
                                <div className="flex flex-col sm:flex-row gap-2 mt-5">
                                    <input value={questionInput} onChange={(e) => setQuestionInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Ask question"
                                        className="flex-1 p-2 outline-none border border-gray-300 rounded-xl bg-white" />
                                    <button onClick={handleSend} className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">Ask</button>
                                </div>
                            </div>
                        </div>
                    }
                </main>
            </div >
        </div >
    );
}