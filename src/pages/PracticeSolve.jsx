// src/pages/PracticeSolve.jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { API_BASE } from "../config";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function PracticeSolve() {
  const { pid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Problem Data
  const [problem, setProblem] = useState(location.state || null);
  const [loadingProblem, setLoadingProblem] = useState(!location.state);

  // Code State
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(getStarterTemplate("python"));

  // Run & Submit Results
  const [runOutput, setRunOutput] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const [xpAwarded, setXpAwarded] = useState(0);
  const [countdown, setCountdown] = useState(5);

  // Completed Problem Blocking
  const [completedProblems, setCompletedProblems] = useState([]);

  // Fetch completed problems
  useEffect(() => {
    if (!auth.currentUser) return;

    const ref = doc(db, "users", auth.currentUser.uid);
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setCompletedProblems(snap.data().practiceCompleted || []);
      }
    });
  }, []);

  const isCompleted = completedProblems.includes(pid);

  // Load problem data on direct URL visit
  useEffect(() => {
    if (problem || !pid) return;

    fetch(`${API_BASE}/api/practice/problems`)
      .then((res) => res.json())
      .then((list) => {
        setProblem(list.find((p) => p.id === pid));
      })
      .finally(() => setLoadingProblem(false));
  }, [pid]);

  if (isCompleted) {
    return (
      <div className="p-8 text-center text-white">
        <h1 className="text-2xl font-bold text-green-400">✔ Problem Already Completed</h1>
        <button
          onClick={() => navigate("/practice")}
          className="mt-4 px-4 py-2 bg-[#ff4655] rounded-lg text-white"
        >
          Back
        </button>
      </div>
    );
  }

  if (!problem)
    return <div className="text-white p-8">Loading problem…</div>;

  // Extract sample input from example
  function extractSampleInput(example) {
    if (!example) return "";
    const lines = example.split("\n");

    let reading = false;
    let inputLines = [];

    for (let line of lines) {
      line = line.trim();

      if (line.toLowerCase().startsWith("input")) {
        reading = true;
        continue;
      }
      if (line.toLowerCase().startsWith("output")) {
        break;
      }

      if (reading && line !== "") inputLines.push(line);
    }

    return inputLines.join("\n");
  }

  const handleRun = async () => {
    const sampleInput = extractSampleInput(problem.example);

    const res = await fetch(`${API_BASE}/api/practice/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        code,
        stdin: sampleInput
      })
    });

    const data = await res.json();
    setRunOutput(data.stdout || data.error);
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return alert("Login required.");

    const payload = {
      uid: auth.currentUser.uid,
      pid: problem.id,
      language,
      code
    };

    const res = await fetch(`${API_BASE}/api/practice/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    setSubmitResult(data);
    setXpAwarded(data.xp_gain || 0);

    if (data.completed) {
      let t = 5;
      setCountdown(t);
      const timer = setInterval(() => {
        t--;
        setCountdown(t);
        if (t <= 0) clearInterval(timer);
      }, 1000);

      setTimeout(() => navigate("/practice"), 5000);
    }
  };

  return (
    <div className="min-h-screen text-white p-6 bg-[#111]">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">

        {/* LEFT PANEL */}
        <div className="col-span-12 lg:col-span-4 bg-white/5 p-4 rounded-xl border border-white/10">
          <h1 className="text-xl font-bold">{problem.title}</h1>
          <div className="text-white/60">{problem.difficulty}</div>

          <Section label="Description">{problem.description_full}</Section>
          <Section label="Input">{problem.input}</Section>
          <Section label="Output">{problem.output}</Section>

          <Section label="Sample">
            <pre className="whitespace-pre-wrap">{problem.example}</pre>
          </Section>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-12 lg:col-span-8 space-y-4">

          {/* Controls */}
          <div className="flex items-center gap-4">
            <select
              className="bg-black/20 p-2 rounded"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setCode(getStarterTemplate(e.target.value));
              }}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>

            <button
              className="px-3 py-1 bg-white/10 rounded"
              onClick={() => setCode(getStarterTemplate(language))}
            >
              Reset
            </button>

            <button className="px-3 py-1 bg-[#ff4655] rounded" onClick={handleRun}>
              Run Sample
            </button>

            <button className="px-3 py-1 bg-[#2b7cff] rounded" onClick={handleSubmit}>
              Submit
            </button>
          </div>

          {/* Editor */}
          <div className="border border-white/10 rounded overflow-hidden" style={{ height: 450 }}>
            <Editor
              height="100%"
              language={getMonacoLang(language)}
              value={code}
              onChange={(v) => setCode(v)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true
              }}
            />
          </div>

          {/* Run Output */}
          {runOutput && (
            <ResultBox title="Run Sample Output">
              <pre>{runOutput}</pre>
            </ResultBox>
          )}

          {/* Submit Result */}
          {submitResult && (
            <ResultBox title="Submission Results">
              <div>
                Passed {submitResult.passed} / {submitResult.total}
              </div>
              <div>Failed {submitResult.total - submitResult.passed}</div>
              <div className="mt-1">
                XP Earned: <span className="text-red-400">{xpAwarded}</span>
              </div>

              {/* Testcases */}
              {submitResult.results?.map((t, i) => (
                <TestCase key={i} t={t} />
              ))}

              {submitResult.completed && (
                <div className="text-green-400 mt-3">
                  All tests passed! Redirecting in {countdown} seconds…
                </div>
              )}
            </ResultBox>
          )}

        </div>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className="mt-4">
      <div className="text-sm text-white/60">{label}</div>
      <div className="bg-black/20 p-3 rounded mt-1">{children}</div>
    </div>
  );
}

function ResultBox({ title, children }) {
  return (
    <div className="bg-black/30 p-4 rounded">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function TestCase({ t }) {
  return (
    <div className="bg-black/20 p-3 rounded mt-2">
      <div className={`font-bold ${t.passed ? "text-green-400" : "text-red-400"}`}>
        Test {t.index}: {t.passed ? "PASSED" : "FAILED"}
      </div>

      {!t.passed && (
        <div className="text-sm text-white/70 mt-2">
          <div><strong>Input:</strong> {t.input}</div>
          <div><strong>Expected:</strong> {t.expected}</div>
          <div><strong>Got:</strong> {t.got}</div>
        </div>
      )}
    </div>
  );
}

/* =============== CODE TEMPLATES =============== */
function getStarterTemplate(lang) {
  if (lang === "python")
    return `# Python starter\nif __name__ == "__main__":\n    pass\n`;
  if (lang === "javascript")
    return `// JS starter\nprocess.stdin.resume();\nprocess.stdin.setEncoding('utf8');\nlet data='';\nprocess.stdin.on('data', c => data += c);\nprocess.stdin.on('end', () => {});\n`;
  if (lang === "cpp")
    return `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    return 0;\n}\n`;
  if (lang === "java")
    return `import java.util.*;\nclass Main { public static void main(String[] args) { Scanner sc = new Scanner(System.in); }}\n`;
  return "";
}

function getMonacoLang(lang) {
  if (lang === "python") return "python";
  if (lang === "javascript") return "javascript";
  if (lang === "cpp") return "cpp";
  if (lang === "java") return "java";
  return "plaintext";
}
