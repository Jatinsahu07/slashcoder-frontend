import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { API_BASE } from "../config";


/* 🛡️ Function to disable copy/paste/cut and right-click inside Monaco editor */
const preventEditorCopyPaste = (editor) => {
  editor.onKeyDown((e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      ["KeyC", "KeyV", "KeyX", "KeyA"].includes(e.code)
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  editor.onDidPaste(() => {
    alert("🚫 Copy-paste is disabled during coding sessions!");
  });

  editor.onContextMenu((e) => {
    e.event.preventDefault();
  });

  editor.onDidBlurEditorText(() => {
    window.getSelection()?.removeAllRanges();
  });
};

/* 🧩 CodeEditor Component */
const CodeEditor = ({ onRun }) => {
  const [code, setCode] = useState("print('Hello Slashcoder!')");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  // 🧱 Optional: Block copy/paste globally across page (set true if needed)
  const blockGlobally = false;

  useEffect(() => {
    if (!blockGlobally) return;

    const blockCopyPaste = (e) => e.preventDefault();
    const blockContextMenu = (e) => e.preventDefault();
    const blockKeys = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "v", "x", "a"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("copy", blockCopyPaste);
    document.addEventListener("paste", blockCopyPaste);
    document.addEventListener("cut", blockCopyPaste);
    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("copy", blockCopyPaste);
      document.removeEventListener("paste", blockCopyPaste);
      document.removeEventListener("cut", blockCopyPaste);
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockKeys);
    };
  }, [blockGlobally]);

  /* ⚙️ Run code through backend (Judge0 or FastAPI endpoint) */
  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/code/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id:
            language === "python"
              ? 71
              : language === "cpp"
              ? 54
              : language === "java"
              ? 62
              : 63, // javascript (Node)
        }),
      });

      const result = await res.json();
      setOutput(result.stdout || result.stderr || result.compile_output || "No output");
      onRun?.(result);
    } catch (err) {
      setOutput("Error running code: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#0b0f1a] flex flex-col p-4 text-white">
      {/* Top Controls */}
      <div className="flex gap-2 mb-3 items-center">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border border-white/20 bg-[#11182c] text-white p-2 rounded-lg focus:outline-none"
        >
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="javascript">JavaScript</option>
        </select>

        <button
          onClick={handleRun}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold text-sm transition"
        >
          {loading ? "Running..." : "▶ Run Code"}
        </button>
      </div>

      {/* Main Split */}
      <div className="flex flex-row gap-4 h-full">
        {/* Editor */}
        <div className="w-1/2 border border-white/10 rounded-lg overflow-hidden shadow-lg">
          <Editor
            height="100%"
            theme="vs-dark"
            language={language}
            value={code}
            onMount={(editor) => preventEditorCopyPaste(editor)} // 👈 Protection applied
            onChange={(value) => setCode(value)}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              smoothScrolling: true,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Output */}
        <div className="w-1/2 border border-white/10 rounded-lg bg-black text-green-400 p-4 overflow-auto font-mono text-sm">
          <h3 className="font-bold text-white mb-2">🧩 Output</h3>
          <pre>{output}</pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
