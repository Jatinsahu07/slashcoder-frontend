import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { streamGemini } from "../utils/geminiProxy";
import { Bot, SendHorizontal, Sparkles } from "lucide-react";

export default function SlashAI() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streamingChunk, setStreamingChunk] = useState("");
  const bottomRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingChunk]);

  // Send AI message
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const text = input.trim();
    setInput("");

    const userMsg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    setStreamingChunk("");
    let accumulated = "";

    try {
      await streamGemini(text, (chunk) => {
        accumulated += chunk;
        setStreamingChunk(accumulated);
      });

      setMessages((prev) => [...prev, { role: "bot", text: accumulated }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            "⚠️ Slash ran into a glitch connecting to the AI core. Try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
      setStreamingChunk("");
    }
  };

  // Enter key send
  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Markdown renderer
  const renderMarkdown = (text) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code({ inline, node, children, ...props }) {
          const match = /language-(\w+)/.exec(node?.properties?.className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              customStyle={{
                borderRadius: "0.75rem",
                backgroundColor: "#14141f",
                fontSize: "0.9rem",
                padding: "1rem",
                marginTop: "0.5rem",
                marginBottom: "0.5rem",
              }}
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code
              style={{
                background: "rgba(255,255,255,0.1)",
                padding: "2px 6px",
                borderRadius: "4px",
                color: "#ff7480",
              }}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );

  const ThinkingDots = () => {
    const [dots, setDots] = useState(".");
    useEffect(() => {
      const i = setInterval(() => {
        setDots((d) => (d.length < 3 ? d + "." : "."));
      }, 400);
      return () => clearInterval(i);
    }, []);
    return <span>{dots}</span>;
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center overflow-hidden text-white"
      style={{
        backgroundImage: `url(/assets/SLASH_BACKGROUND.jpeg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[#0A0A0F]/85" />

      <header className="relative z-10 w-full max-w-6xl mx-auto text-center py-10">
        <h1 className="text-4xl font-extrabold flex items-center justify-center gap-3 text-[#ff4655]">
          <Sparkles className="w-8 h-8" /> Slash AI
        </h1>
        <p className="text-white/70 text-sm mt-2">
          Your AI coding companion — fast, structured, and powerful.
        </p>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-5xl px-6 pb-32 overflow-y-auto space-y-6">
        {messages.length === 0 && !loading && (
          <div className="text-center text-white/60 mt-24">
            💬 Ask Slash AI anything about coding, debugging, or concepts!
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="flex flex-col">
            <div
              className={`p-4 rounded-xl text-sm max-w-[75%] break-words whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-[#ff4655]/20 border border-[#ff4655]/30 self-end ml-auto"
                  : "bg-white/5 border border-white/10 self-start mr-auto"
              }`}
            >
              {m.role === "bot" ? renderMarkdown(m.text) : m.text}
            </div>
          </div>
        ))}

        {streamingChunk && (
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm max-w-[75%] self-start mr-auto">
            {renderMarkdown(streamingChunk)}
          </div>
        )}

        {loading && !streamingChunk && (
          <div className="text-white/60 text-sm flex items-center gap-1">
            <Bot className="w-4 h-4 text-[#ff4655]" /> Slash is thinking
            <ThinkingDots />
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <div className="fixed bottom-0 left-0 right-0 flex justify-center bg-[#0A0A0F]/90 p-4 border-t border-white/10 z-20">
        <div className="flex w-full max-w-5xl gap-3">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Slash AI anything…"
            className="flex-1 resize-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 bg-[#ff4655]/90 hover:bg-[#ff4655] px-5 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50"
          >
            <SendHorizontal className="w-4 h-4" />
            {loading ? "Thinking…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
