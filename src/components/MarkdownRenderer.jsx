import { Suspense, lazy, useState } from "react";
import remarkGfm from "remark-gfm";
import markdownComponents from "../markdownComponents";
import { Copy, CopyCheck } from "lucide-react";

const ReactMarkdown = lazy(() => import("react-markdown"));
const SyntaxHighlighter = lazy(() => import("react-syntax-highlighter").then(mod => ({ default: mod.Prism })));
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";


export default function MarkdownRenderer({ content }) {
    const [copied, setCopied] = useState(false);
    function sanitizeMarkdown(text) {
        if (!text) return "";
        return (
            text
                // Escape nested triple backticks so they don't break rendering
                .replace(/```(\w*)\n/g, "```$1\n\n")
                // Prevent unclosed fences
                .replace(/```$/g, "```\n")
                // Normalize line breaks
                .replace(/\r\n/g, "\n")
        );
    }
    const safeContent = sanitizeMarkdown(content);
    return (
        <Suspense fallback={<p>Loading content...</p>}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    ...markdownComponents,
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");

                        const handleCopy = () => {
                            navigator.clipboard.writeText(children);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        };

                        return !inline && match ? (
                            <div className="relative overflow-x-auto rounded-lg">
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-4 right-2 flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition"
                                >
                                    {copied ? (
                                        <>
                                            <CopyCheck size={16} className="text-green-500" />
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                        </>
                                    )}
                                </button>
                                <div className="overflow-x-auto">
                                    <Suspense fallback={<pre>{children}</pre>}>
                                        <SyntaxHighlighter
                                            style={oneDark}
                                            language={match[1]}
                                            PreTag="div"
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, "")}
                                        </SyntaxHighlighter>
                                    </Suspense>
                                </div>
                            </div>
                        ) : (
                            <code {...props} >{children}</code>
                        );
                    },
                }}
            >
                {safeContent}
            </ReactMarkdown>
        </Suspense>
    );
}