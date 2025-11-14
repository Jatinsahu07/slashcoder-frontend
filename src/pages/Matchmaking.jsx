// src/pages/Matchmaking.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Clock, Sword } from "lucide-react";

const QUEUE_TIMEOUT = 30;

export default function Matchmaking() {
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid;

  const [username, setUsername] = useState(auth.currentUser?.displayName || "");
  const [profile, setProfile] = useState(null);
  const [connected, setConnected] = useState(false);

  const [searching, setSearching] = useState(false);
  const [findingText, setFindingText] = useState("Searching for opponent...");
  const [timeLeft, setTimeLeft] = useState(QUEUE_TIMEOUT);
  const timerRef = useRef(null);

  // ----------------------------------------------------------
  // Load profile (XP etc.)
  // ----------------------------------------------------------
  useEffect(() => {
    let cancel = false;

    async function load() {
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!cancel && snap.exists()) setProfile(snap.data());
      } catch {}
    }

    load();
    return () => (cancel = true);
  }, [uid]);

  // ----------------------------------------------------------
  // Socket event setup
  // ----------------------------------------------------------
  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      console.log("[socket] connected:", socket.id);
    };

    const handleDisconnect = () => {
      setConnected(false);
      console.log("[socket] disconnected");
    };

    const handleWaiting = (data) => {
      console.log("[socket] waiting:", data);
      setFindingText(data.msg || "Waiting for opponent...");
      setSearching(true);
      startTimer(QUEUE_TIMEOUT);
    };

    const handleMatchFound = (data) => {
      console.log("🔥[socket] MATCH FOUND:", data);

      clearTimer();
      setSearching(false);

      // Save match info for MatchPage
      localStorage.setItem("match_found_data", JSON.stringify(data));

      // ------------------------------------------------------
      // 🔥 FIX: navigate to match page
      // ------------------------------------------------------
      navigate("/matchpage", { state: data });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("waiting", handleWaiting);
    socket.on("match_found", handleMatchFound);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("waiting", handleWaiting);
      socket.off("match_found", handleMatchFound);
      clearTimer();
    };
  }, [navigate]);

  // ----------------------------------------------------------
  // Timer
  // ----------------------------------------------------------
  const startTimer = (sec) => {
    clearTimer();
    setTimeLeft(sec);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          cancelSearch();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ----------------------------------------------------------
  // Join queue
  // ----------------------------------------------------------
  const startSearch = () => {
    if (!uid || !username.trim()) return;

    setSearching(true);
    setFindingText("Searching match for " + username + "...");

    console.log("[emit] join_queue:", { uid, name: username });
    socket.emit("join_queue", { uid, name: username });

    startTimer(QUEUE_TIMEOUT);
  };

  // ----------------------------------------------------------
  // Cancel search
  // ----------------------------------------------------------
  const cancelSearch = () => {
    clearTimer();
    setSearching(false);
    setFindingText("Cancelled.");
  };

  const formatTime = (sec) => sec.toString().padStart(2, "0");

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{
        background:
          "radial-gradient(circle at center, rgba(255,70,85,0.1) 0%, rgba(10,10,15,1) 75%)",
      }}
    >
      {/* Header */}
      <div className="z-20 relative max-w-5xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-wider text-[#ff4655] drop-shadow-[0_0_20px_#ff4655]">
            Slashcoder Arena ⚔️
          </h1>
        </div>

        {/* mini user info */}
        <div className="text-sm text-white/70">
          <div className="font-semibold">
            {profile?.username || username || "Player"}
          </div>
          <div className="text-xs text-white/50">
            Level {Math.floor((profile?.xp || 0) / 100)}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 w-full">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(255,70,85,0.15)]">
          <div className="flex items-center gap-3">
            <Sword className="w-7 h-7 text-[#ff4655]" />
            <h2 className="text-2xl font-bold">Slashcoder Matchmaking</h2>
          </div>

          <p className="text-white/60 mt-2">
            Quick 1v1 coding duels — first to pass all hidden tests wins.
          </p>

          {/* Username */}
          <div className="mt-6">
            <label className="text-white/60 text-sm">Enter username</label>
            <input
              type="text"
              disabled={searching}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 mt-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none"
            />
          </div>

          {/* Status */}
          {searching ? (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-[#ff9aaa]">
                  {findingText}
                </div>
                <div className="flex items-center gap-2 text-[#ff4655] font-semibold">
                  <Clock className="w-5 h-5" />
                  {formatTime(timeLeft)}s
                </div>
              </div>

              <button
                onClick={cancelSearch}
                className="mt-6 w-full py-3 bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 rounded-xl"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              disabled={!username}
              onClick={startSearch}
              className="mt-6 w-full py-3 bg-[#ff4655] hover:bg-[#ff2f40] rounded-xl text-white font-semibold text-lg shadow-[0_0_20px_#ff4655]"
            >
              Join Queue
            </button>
          )}

          {/* Info */}
          <div className="text-xs text-white/40 mt-6">
            Tip: Do NOT refresh or switch tabs during a battle — that will
            forfeit the match.
          </div>
        </div>
      </div>

      {/* Connection indicator */}
      <div className="fixed bottom-4 left-4">
        {!connected ? (
          <div className="bg-red-900/60 px-3 py-2 rounded text-sm">
            Disconnected
          </div>
        ) : (
          <div className="bg-[#0b1115]/80 px-3 py-2 rounded text-sm border border-white/5">
            Connected
          </div>
        )}
      </div>
    </div>
  );
}
