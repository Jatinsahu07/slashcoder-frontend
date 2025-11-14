// src/pages/MatchPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import socket from "../socket";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Clock } from "lucide-react";

const STORAGE_KEY = "sc_active_match";
const EDITOR_HEIGHT = 420;

export default function MatchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const uid = auth.currentUser?.uid;

  // connection & profile
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState(null);

  // match state
  const [room, setRoom] = useState(null);
  const [problem, setProblem] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [inBattle, setInBattle] = useState(false);

  // editor & io
  const [language, setLanguage] = useState("python");
  const [editorValue, setEditorValue] = useState(getStarterTemplate("python"));
  const [stdinValue, setStdinValue] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [submissionResult, setSubmissionResult] = useState(null);
  const [battleResult, setBattleResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [lastSubmissionTs, setLastSubmissionTs] = useState(null);

  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const [connectedId, setConnectedId] = useState(null);

  // load profile
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!cancelled && snap.exists()) setProfile(snap.data());
      } catch (e) {}
    })();
    return () => (cancelled = true);
  }, [uid]);

  // socket listeners + restore logic
  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      setConnectedId(socket.id || null);
    };
    const onDisconnect = () => {
      setConnected(false);
      setConnectedId(null);
    };

    const onMatchFound = (payload) => {
      if (!payload) return;
      setRoom(payload.room);
      setProblem(payload.problem);
      setOpponent(payload.opponent);
      setTimeLimit(payload.timeLimit ?? 600);
      setStartTime(payload.startTime ?? Math.floor(Date.now()/1000));
      setInBattle(true);
      setSubmissionResult(null);
      setBattleResult(null);
      setRunOutput("");
      setLastSubmissionTs(null);

      // persist for refresh
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          room: payload.room,
          problem: payload.problem,
          opponent: payload.opponent,
          timeLimit: payload.timeLimit ?? 600,
          startTime: payload.startTime ?? Math.floor(Date.now()/1000)
        }));
      } catch (e) {}

      startTimerFromStart(payload.timeLimit ?? 600, payload.startTime ?? Math.floor(Date.now()/1000));
    };

    const onRunResult = (data) => setRunOutput(data?.stdout ?? "");
    const onSubmissionResult = (data) => {
      setSubmissionResult(data);
      setLastSubmissionTs(Date.now());
      setCalculating(true);
    };
    const onBattleResult = (data) => {
      setBattleResult(data);
      setCalculating(false);
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      setTimeout(() => navigate("/dashboard"), 2200);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("match_found", onMatchFound);
    socket.on("run_result", onRunResult);
    socket.on("submission_result", onSubmissionResult);
    socket.on("battle_result", onBattleResult);

    // restore from navigation state (priority)
    if (location.state && location.state.room) {
      const nav = location.state;
      setRoom(nav.room);
      setProblem(nav.problem);
      setOpponent(nav.opponent);
      setTimeLimit(nav.timeLimit ?? 600);
      setStartTime(nav.startTime ?? Math.floor(Date.now()/1000));
      setInBattle(true);
      startTimerFromStart(nav.timeLimit ?? 600, nav.startTime ?? Math.floor(Date.now()/1000));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          room: nav.room, problem: nav.problem, opponent: nav.opponent,
          timeLimit: nav.timeLimit ?? 600, startTime: nav.startTime ?? Math.floor(Date.now()/1000)
        }));
      } catch (e) {}
    } else {
      // attempt restore from localStorage (refresh case)
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw);
          if (stored && stored.room) {
            setRoom(stored.room);
            setProblem(stored.problem);
            setOpponent(stored.opponent);
            setTimeLimit(stored.timeLimit ?? 600);
            setStartTime(stored.startTime ?? Math.floor(Date.now()/1000));
            setInBattle(true);
            startTimerFromStart(stored.timeLimit ?? 600, stored.startTime ?? Math.floor(Date.now()/1000));
          }
        }
      } catch (e) { /* ignore */ }
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("match_found", onMatchFound);
      socket.off("run_result", onRunResult);
      socket.off("submission_result", onSubmissionResult);
      socket.off("battle_result", onBattleResult);
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, location.state]);

  // Timer utils
  function startTimerFromStart(limitSeconds, startSec) {
    clearTimer();
    const nowSec = Math.floor(Date.now() / 1000);
    const elapsed = Math.max(0, nowSec - (startSec || nowSec));
    const remaining = Math.max(0, limitSeconds - elapsed);
    setTimeLeft(remaining);
    setTimeLimit(limitSeconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }
  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // minimal copy/paste suppression
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "c" || e.key === "x")) e.preventDefault();
    };
    document.addEventListener("copy", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("contextmenu", prevent);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("contextmenu", prevent);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // editor mount
  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    editor.onContextMenu((e) => e.preventDefault());
    try {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_V, ()=>{}, "");
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_C, ()=>{}, "");
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_X, ()=>{}, "");
    } catch (e) {}
  }

  // Run -> backend run_code
  const handleRun = () => {
    socket.emit("run_code", { room, language, source_code: editorValue, stdin: stdinValue });
    setRunOutput("Running...");
  };

  // Submit -> backend submit_code
  const handleSubmit = () => {
    if (!room) return;
    setLastSubmissionTs(Date.now());
    setSubmissionResult(null);
    setCalculating(true);
    socket.emit("submit_code", { language, source_code: editorValue });
  };

  // Forfeit explicit
  const handleForfeit = () => {
    if (!room) {
      navigate("/dashboard");
      return;
    }
    socket.emit("forfeit", {});
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    setTimeout(()=>navigate("/dashboard"), 200);
  };

  // cleanup persisted match on battleResult
  useEffect(()=> {
    if (battleResult) {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }
  }, [battleResult]);

  const formatTime = (s) => {
    const mm = Math.floor(s / 60).toString().padStart(2,"0");
    const ss = Math.floor(s % 60).toString().padStart(2,"0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="min-h-screen text-white flex flex-col" style={{
      background: "radial-gradient(ellipse at center, rgba(255,70,85,0.06) 0%, rgba(10,10,15,1) 40%), url('/assets/SLASH_BACKGROUND.jpeg')",
      backgroundSize: "cover", backgroundPosition: "center"
    }}>
      {/* top */}
      <div className="max-w-7xl mx-auto px-6 py-6 w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-extrabold text-[#ff4655] tracking-wider">Slash</div>
          <div className="text-sm text-white/60">Coder — Match Arena</div>
        </div>
        <div className="flex items-center gap-4">
          {profile ? (
            <div className="text-sm text-white/70">
              <div className="font-semibold">{profile.username || auth.currentUser?.displayName}</div>
              <div className="text-xs text-white/50">Level {Math.floor((profile?.xp||0)/100)}</div>
            </div>
          ) : <div className="text-sm text-white/50">Loading profile...</div>}
        </div>
      </div>

      {/* main card */}
      <div className="max-w-7xl mx-auto px-6 pb-10 flex-1">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-12 gap-4">
          {/* left: problem */}
          <div className="col-span-12 lg:col-span-5 p-4 rounded-lg border border-white/5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{problem?.title ?? "Waiting for match..."}</h2>
                <div className="text-sm text-white/60 mt-1">{problem?.description ?? ""}</div>
                {problem?.difficulty && <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-black/20">{problem.difficulty}</span>}
              </div>
              <div className="text-right">
                <div className="text-xs text-white/60">Status</div>
                <div className="text-sm font-semibold text-[#ff4655]">{inBattle ? "Battle Live" : "Waiting"}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-white/60 mb-2">Problem Statement</div>
              <div className="bg-black/30 p-3 rounded text-sm text-white/80 whitespace-pre-wrap">{problem?.description_full ?? problem?.description ?? "-"}</div>

              <div className="text-xs text-white/60 mt-4 mb-2">Input Format</div>
              <div className="bg-black/30 p-3 rounded text-sm text-white/80">{problem?.input ?? "-"}</div>

              <div className="text-xs text-white/60 mt-4 mb-2">Output Format</div>
              <div className="bg-black/30 p-3 rounded text-sm text-white/80">{problem?.output ?? "-"}</div>

              {problem?.constraints && <>
                <div className="text-xs text-white/60 mt-4 mb-2">Constraints</div>
                <div className="bg-black/30 p-3 rounded text-sm text-white/80">{problem.constraints}</div>
              </>}

              <div className="text-xs text-white/60 mt-4 mb-2">Sample</div>
              <div className="bg-black/30 p-3 rounded text-sm text-white/80"><pre className="whitespace-pre-wrap">{problem?.example ?? "-"}</pre></div>

              {problem?.explanation && <>
                <div className="text-xs text-white/60 mt-4 mb-2">Explanation</div>
                <div className="bg-black/30 p-3 rounded text-sm text-white/80">{problem.explanation}</div>
              </>}

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full grid place-items-center bg-white/8 ring-1 ring-white/10">
                    {opponent?.name ? opponent.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{opponent?.name ?? "Waiting..."}</div>
                    <div className="text-xs text-white/60">{opponent?.uid ? `UID: ${opponent.uid}` : ""}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-white/60">Time left</div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#ff4655]" />
                    <div className="text-lg font-semibold">{formatTime(timeLeft)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-white/50 italic">
                Tip: Use <strong>Run</strong> to test with custom input. Use <strong>Submit</strong> to run hidden tests and finish the battle.
              </div>
            </div>
          </div>

          {/* right: editor */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-3">
            {/* toolbar */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <select value={language} onChange={(e)=>{ setLanguage(e.target.value); setEditorValue(getStarterTemplate(e.target.value)); }} className="bg-black/20 text-white px-3 py-1 rounded">
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>

                <button onClick={()=>setEditorValue(getStarterTemplate(language))} className="px-3 py-1 rounded bg-white/3 border border-white/10 text-sm">Reset Template</button>

                <button onClick={handleRun} className="px-3 py-1 rounded bg-[#ff4655] text-white font-semibold">Run</button>

                <button onClick={handleSubmit} className="px-3 py-1 rounded bg-[#2b7cff] text-white font-semibold">Submit</button>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-xs text-white/60">Last run</div>
                <div className="text-sm text-white/80">{lastSubmissionTs ? new Date(lastSubmissionTs).toLocaleTimeString() : "—"}</div>
              </div>
            </div>

            {/* Monaco editor fixed container */}
            {/* MONACO EDITOR */}
<div
  className="rounded border border-white/10 mb-4"
  style={{ height: "500px", overflow: "hidden" }}
>
  <Editor
    height="100%"
    language={getMonacoLang(language)}
    value={editorValue}
    onChange={(v) => setEditorValue(v)}
    onMount={handleEditorDidMount}
    options={{
      minimap: { enabled: false },
      fontSize: 14,
      automaticLayout: true,
      contextmenu: false,
    }}
  />
</div>

            {/* IO & results */}
            <div className="bg-white/3 border border-white/8 rounded p-3 grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-6">
                <div className="text-sm font-semibold">Custom Input (stdin)</div>
                <textarea value={stdinValue} onChange={(e)=>setStdinValue(e.target.value)} rows={6} className="w-full mt-2 p-2 rounded bg-black/20 text-sm" placeholder="Type custom input for Run here..." />
              </div>

              <div className="col-span-12 md:col-span-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Output (Run)</div>
                  <div className="text-xs text-white/60">Hidden tests: {problem ? (problem.id ? "3 (hidden)" : "3") : "—"}</div>
                </div>
                <pre className="mt-2 p-3 bg-black/20 rounded h-full min-h-[120px] text-sm whitespace-pre-wrap overflow-auto">{runOutput || "Run output will appear here..."}</pre>
              </div>

              {/* submission area */}
              <div className="col-span-12 md:col-span-8">
                <div className="mt-2">
                  <div className="text-sm font-semibold">Submission</div>
                  <div className="mt-1 text-xs text-white/60">Hidden tests are run on Submit. Both players must submit; results are compared.</div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="text-sm">Passed:</div>
                    <div className="text-lg font-bold text-green-300">{submissionResult?.passed ?? 0}</div>
                    <div className="text-white/50">/</div>
                    <div className="text-lg font-bold text-white/80">{submissionResult?.total ?? (problem ? 3 : "-")}</div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 md:col-span-4 flex flex-col items-end gap-2">
                <div className="w-full flex items-center justify-end gap-2">
                  <button onClick={handleForfeit} className="px-3 py-1 rounded bg-white/6 border border-white/10 text-sm">Forfeit</button>
                </div>

                {calculating ? (
                  <div className="w-full p-3 rounded bg-black/30 text-sm text-center">
                    <div className="font-semibold">Calculating results…</div>
                    <div className="text-xs text-white/60 mt-2">Waiting for opponent. This takes a couple seconds.</div>
                  </div>
                ) : battleResult ? (
                  <div className="w-full p-3 rounded bg-black/30 text-sm">
                    <div className="font-semibold">{battleResult.summary || "Battle finished"}</div>
                    <div className="text-xs text-white/60 mt-2">Check Dashboard for updated XP & rank.</div>
                  </div>
                ) : (
                  <div className="w-full p-3 rounded bg-black/20 text-xs text-white/60">Waiting for result...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* status */}
      <div className="fixed bottom-4 right-4">
        {!connected ? (
          <div className="bg-red-900/60 px-3 py-2 rounded text-sm">Socket disconnected</div>
        ) : (
          <div className="bg-[#0b1115]/80 px-3 py-2 rounded text-sm border border-white/5 flex items-center gap-2">
            <div className="text-xs text-white/60">Connected</div>
            <div className="font-semibold text-[#ff4655]">{connectedId ? connectedId.slice(0,6) : "—"}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Utilities */
function getStarterTemplate(lang) {
  if (lang === "python") return `# Python starter\nif __name__ == "__main__":\n    pass\n`;
  if (lang === "javascript") return `// JS starter\nprocess.stdin.resume();\nprocess.stdin.setEncoding('utf8');\nlet data='';\nprocess.stdin.on('data',c=>data+=c);\nprocess.stdin.on('end',()=>{});\n`;
  if (lang === "cpp") return `#include <bits/stdc++.h>\nusing namespace std;\nint main(){ios::sync_with_stdio(false);cin.tie(nullptr);\n    return 0;\n}\n`;
  if (lang === "java") return `import java.util.*;\nclass Main{ public static void main(String[]args){ Scanner sc = new Scanner(System.in); }}\n`;
  return "";
}
function getMonacoLang(lang) {
  if (lang === "python") return "python";
  if (lang === "javascript") return "javascript";
  if (lang === "cpp") return "cpp";
  if (lang === "java") return "java";
  return "plaintext";
}
