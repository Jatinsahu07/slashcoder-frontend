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
  const [streamingText, setStreamingText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreamingText("");
    let fullText = "";

    try {
      await streamGemini(userMsg.text, (partial) => {
        fullText = partial;
        setStreamingText(partial);
      });
      setMessages((prev) => [...prev, { role: "bot", text: fullText }]);
    } catch (err) {
      console.error("Slash AI error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            "⚠️ Slash ran into a glitch connecting to the AI core. Try again in a few seconds.",
        },
      ]);
    } finally {
      setStreamingText("");
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

 // ✨ Markdown Renderer (ReactMarkdown v9+)
const renderMarkdown = (text) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeRaw]}
    components={{
      // Code block support
      code({ inline, node, children, ...props }) {
        const match = /language-(\w+)/.exec(node?.properties?.class || "");
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
              fontSize: "0.9rem",
            }}
          >
            {children}
          </code>
        );
      },

      // Text elements
      strong: ({ children }) => (
        <strong style={{ color: "#ff4655" }}>{children}</strong>
      ),
      h1: ({ children }) => (
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#ff4655",
            marginTop: "0.75rem",
          }}
        >
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: "600",
            color: "#ff7480",
            marginTop: "0.5rem",
          }}
        >
          {children}
        </h2>
      ),
      ul: ({ children }) => (
        <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol style={{ listStyleType: "decimal", paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
          {children}
        </ol>
      ),
      blockquote: ({ children }) => (
        <blockquote
          style={{
            borderLeft: "4px solid rgba(255,70,85,0.5)",
            paddingLeft: "0.75rem",
            fontStyle: "italic",
            color: "rgba(255,255,255,0.8)",
            margin: "0.75rem 0",
          }}
        >
          {children}
        </blockquote>
      ),
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#ff7480",
            textDecoration: "underline",
          }}
        >
          {children}
        </a>
      ),
      p: ({ children }) => (
        <p style={{ marginBottom: "0.5rem", lineHeight: "1.7" }}>{children}</p>
      ),
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
      <div className="absolute inset-0 bg-[#0A0A0F]/85 backdrop-blur-[2px]" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto text-center py-10">
        <h1 className="text-4xl font-extrabold flex items-center justify-center gap-3 text-[#ff4655] drop-shadow-[0_0_20px_#ff4655aa]">
          <Sparkles className="w-8 h-8 text-[#ff4655]" /> Slash AI
        </h1>
        <p className="text-white/70 text-sm mt-2">
          Your AI coding companion — structured, clear, and fast ⚡
        </p>
      </header>

      {/* Chat Messages */}
      <main className="relative z-10 flex-1 w-full max-w-5xl px-6 pb-32 overflow-y-auto space-y-6">
        {messages.length === 0 && !loading && (
          <div className="text-center text-white/60 mt-24">
            💬 Ask Slash AI anything about code, debugging, or logic!
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="flex flex-col">
            <div
              className={`p-4 rounded-xl text-sm whitespace-pre-wrap break-words max-w-[75%] ${
                m.role === "user"
                  ? "bg-[#ff4655]/20 border border-[#ff4655]/30 self-end ml-auto shadow-[0_0_10px_rgba(255,70,85,0.3)]"
                  : "bg-white/5 border border-white/10 self-start mr-auto"
              }`}
            >
              {m.role === "bot" ? renderMarkdown(m.text) : m.text}
            </div>
          </div>
        ))}

        {streamingText && (
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm max-w-[75%] self-start mr-auto animate-pulse">
            {renderMarkdown(streamingText)}
          </div>
        )}

        {loading && !streamingText && (
          <div className="text-white/60 text-sm flex items-center gap-1 animate-pulse">
            <Bot className="w-4 h-4 text-[#ff4655]" /> Slash is thinking
            <ThinkingDots />
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center bg-[#0A0A0F]/90 backdrop-blur-md border-t border-white/10 p-4 z-20">
        <div className="flex w-full max-w-5xl gap-3">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Slash AI anything…"
            className="flex-1 resize-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#ff4655]"
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
