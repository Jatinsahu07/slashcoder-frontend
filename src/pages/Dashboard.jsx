// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  onSnapshot,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { API_BASE } from "../config";
import { Trophy, Sword, Flame, Zap } from "lucide-react";

export default function Dashboard() {
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [backendStats, setBackendStats] = useState(null);

  // ✅ Track Firebase user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserId(u?.uid || null);
    });
    return () => unsub();
  }, []);

  // ✅ Listen to Firestore profile changes
  useEffect(() => {
    if (!userId) return;
    const ref = doc(db, "users", userId);

    const unsub = onSnapshot(ref, (snap) => {
      setProfile(snap.exists() ? snap.data() : {});
      setLoadingProfile(false);
    });

    // Fetch once for immediate load
    getDoc(ref).then((snap) => {
      if (snap.exists()) setProfile(snap.data());
      setLoadingProfile(false);
    });

    return () => unsub();
  }, [userId]);

  // ✅ Listen to last 10 matches
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "users", userId, "matches"),
      orderBy("endedAt", "desc"),
      limit(10)
    );

    const unsub = onSnapshot(q, (qs) => {
      const arr = [];
      qs.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setMatches(arr);
      setLoadingMatches(false);
    });

    getDocs(q).then((qs) => {
      const arr = [];
      qs.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setMatches(arr);
      setLoadingMatches(false);
    });

    return () => unsub();
  }, [userId]);

  // ✅ Optional: Fetch backend stats
  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/api/user-stats/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setBackendStats(data))
      .catch(() => {});
  }, [userId]);

  // 🧮 Derived stats
  const wins = Number(profile?.wins || 0);
  const losses = Number(profile?.losses || 0);
  const played = wins + losses;
  const winRate = played ? ((wins / played) * 100).toFixed(1) : 0;
  const xp = Number(profile?.xp || 0);
  const level = Math.floor(xp / 100);
  const xpProgress = xp % 100;

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{
        backgroundImage: `url(/assets/SLASH_BACKGROUND.jpeg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#0A0A0F]/85 backdrop-blur-[2px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-wide drop-shadow-[0_0_20px_#ff4655aa]">
            🏠 Dashboard
          </h1>
          <p className="text-white/70 mt-2">
            Welcome,{" "}
            <span className="text-[#ff4655] font-semibold">
              {profile?.username || auth.currentUser?.displayName || "Player"}
            </span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <StatCard
            title="Matches"
            value={played}
            icon={<Sword className="w-7 h-7 text-[#ff4655]" />}
          />
          <StatCard
            title="Wins"
            value={wins}
            color="text-green-400"
            icon={<Trophy className="w-7 h-7 text-yellow-400" />}
          />
          <StatCard
            title="Losses"
            value={losses}
            color="text-red-400"
            icon={<Flame className="w-7 h-7 text-red-400" />}
          />
          <StatCard
            title="Win Rate"
            value={`${winRate}%`}
            color="text-blue-400"
            icon={<Zap className="w-7 h-7 text-blue-400" />}
          />
        </div>

        {/* XP Progress Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_0_25px_rgba(255,70,85,0.1)]">
          <div className="flex justify-between text-sm text-white/70 mb-2">
            <span>Level {level}</span>
            <span>{xpProgress}% to next level</span>
          </div>
          <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#ff4655] to-pink-400 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-white/70 text-xs mt-2">
            Total XP: <span className="text-[#ff4655] font-semibold">{xp}</span>
          </p>
        </div>

        {/* Profile */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          {loadingProfile ? (
            <p className="text-center text-white/60">Loading profile...</p>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-1">
                {profile?.username || auth.currentUser?.displayName || "Player"}
              </h2>
              <p className="text-white/60 text-sm">
                {auth.currentUser?.email || "No email"}
              </p>
            </>
          )}
        </div>

        {/* Backend Stats */}
        {backendStats && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold mb-3 text-[#ff4655]">Server Stats</h3>
            <pre className="text-xs text-white/70 overflow-x-auto">
              {JSON.stringify(backendStats, null, 2)}
            </pre>
          </div>
        )}

        {/* Recent Matches */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_0_25px_rgba(255,70,85,0.1)]">
          <h3 className="text-lg font-semibold mb-4 text-[#ff4655]">
            Recent Matches
          </h3>
          {loadingMatches ? (
            <p className="text-white/60 text-sm">Loading matches...</p>
          ) : matches.length === 0 ? (
            <p className="text-white/60 text-sm italic">
              No matches played yet — start your first battle!
            </p>
          ) : (
            <ul className="space-y-2">
              {matches.map((m) => (
                <li
                  key={m.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 flex justify-between hover:bg-white/[0.08] transition"
                >
                  <span>
                    {m.problem || "Unknown Problem"}{" "}
                    <span className="text-white/50 text-xs ml-2">
                      ({m.difficulty || "?"})
                    </span>
                  </span>
                  <span
                    className={
                      m.winnerId === userId
                        ? "text-green-400 font-semibold"
                        : "text-red-400 font-semibold"
                    }
                  >
                    {m.winnerId === userId ? "Win" : "Loss"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color = "text-white", icon }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(255,70,85,0.1)] hover:shadow-[0_0_25px_rgba(255,70,85,0.3)] transition-all duration-300">
      <div className="p-3 bg-[#ff4655]/20 rounded-xl mb-3">{icon}</div>
      <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
      <p className="text-white/60 text-sm mt-1">{title}</p>
    </div>
  );
}
