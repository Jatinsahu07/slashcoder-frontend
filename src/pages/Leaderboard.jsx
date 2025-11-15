// src/pages/Leaderboard.jsx
import React, { useMemo, useState } from "react";
import useAppStore from "../store/useAppStore";
import { auth } from "../firebase";
import { Trophy, Medal, Star } from "lucide-react";

const PAGE_SIZE = 10;

// Badge styles remain same (unchanged logic)
const BADGE_STYLES = {
  iron: { bg: "bg-zinc-700/40", text: "text-zinc-200", ring: "ring-zinc-500" },
  bronze: { bg: "bg-amber-900/30", text: "text-amber-200", ring: "ring-amber-700" },
  silver: { bg: "bg-slate-500/30", text: "text-slate-200", ring: "ring-slate-400" },
  gold: { bg: "bg-yellow-700/30", text: "text-yellow-200", ring: "ring-yellow-500" },
  platinum: { bg: "bg-cyan-800/30", text: "text-cyan-200", ring: "ring-cyan-500" },
  diamond: { bg: "bg-sky-800/30", text: "text-sky-200", ring: "ring-sky-500" },
  master: { bg: "bg-fuchsia-800/30", text: "text-fuchsia-200", ring: "ring-fuchsia-500" },
  legend: { bg: "bg-rose-800/30", text: "text-rose-200", ring: "ring-rose-500" },
};

function Badge({ name }) {
  const key = (name || "iron").toLowerCase();
  const s = BADGE_STYLES[key] || BADGE_STYLES.iron;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-75" />
      {name || "Iron"}
    </span>
  );
}

function Avatar({ username, url }) {
  if (url)
    return (
      <img src={url} alt={username} className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10" />
    );
  const letter = (username || "P").charAt(0).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full grid place-items-center bg-white/10 ring-1 ring-white/10">
      <span className="text-sm font-semibold">{letter}</span>
    </div>
  );
}

function ProgressBar({ level = 0, xpPercent = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round(xpPercent)));
  return (
    <div className="min-w-[160px]">
      <div className="flex items-center justify-between text-[10px] text-white/70 mb-1">
        <span>Level {level}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#ff4655] to-pink-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const leaderboardState = useAppStore((s) => s.leaderboard);
  const [page, setPage] = useState(0);
  const currentUid = auth.currentUser?.uid;

  // FIXED: raw fallback happens inside useMemo → no eslint warning
  const data = useMemo(() => {
    const raw = leaderboardState || [];
    const clone = [...raw];
    clone.sort((a, b) => (b?.xp ?? 0) - (a?.xp ?? 0));
    return clone;
  }, [leaderboardState]);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const rows = data.slice(start, start + PAGE_SIZE);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  const getBadgeByXP = (xp) => {
    if (xp >= 1000) return "Legend";
    if (xp >= 700) return "Master";
    if (xp >= 500) return "Diamond";
    if (xp >= 300) return "Platinum";
    if (xp >= 200) return "Gold";
    if (xp >= 100) return "Silver";
    if (xp >= 50) return "Bronze";
    return "Iron";
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Star className="w-6 h-6 text-amber-500" />;
    return <span className="text-white/70 font-semibold">{rank}</span>;
  };

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

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-wide drop-shadow-[0_0_20px_#ff4655aa]">
            🏆 Leaderboard
          </h1>
          <p className="text-white/70 mt-2">
            Top coders of the <span className="text-[#ff4655]">Slashcoder Arena</span>
          </p>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(255,70,85,0.15)] overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-12 items-center px-4 py-3 text-xs uppercase tracking-wide text-white/50 border-b border-white/10">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2">Badge</div>
            <div className="col-span-2">Progress</div>
            <div className="col-span-1 text-right">W/L</div>
            <div className="col-span-1 text-right">Win%</div>
            <div className="col-span-1 text-right">XP</div>
          </div>

          {/* Rows */}
          {rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-white/60 bg-white/5">
              No players yet — climb to the top!
            </div>
          ) : (
            rows.map((u, idx) => {
              const rank = start + idx + 1;
              const username = u?.username || "Player";
              const wins = Number(u?.wins ?? 0);
              const losses = Number(u?.losses ?? 0);
              const played = wins + losses;
              const winRate = played ? Math.round((wins / played) * 100) : 0;

              const xp = Number(u?.xp ?? 0);
              const level = Math.floor(xp / 100);
              const xpPercent = xp % 100;
              const badgeName = getBadgeByXP(xp);

              return (
                <div
                  key={u.id || username + rank}
                  className={`grid grid-cols-12 items-center gap-3 px-4 py-4 border-b border-white/10 hover:bg-white/[0.08] transition ${
                    u.id === currentUid
                      ? "bg-[#ff4655]/10 shadow-[0_0_20px_rgba(255,70,85,0.3)]"
                      : ""
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">{getRankIcon(rank)}</div>

                  {/* Player */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <Avatar username={username} url={u?.avatarUrl} />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{username}</div>
                      <div className="text-xs text-white/50">
                        {played > 0 ? `${played} matches` : "New player"}
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="col-span-2">
                    <Badge name={badgeName} />
                  </div>

                  {/* Progress */}
                  <div className="col-span-2">
                    <ProgressBar level={level} xpPercent={xpPercent} />
                  </div>

                  {/* W/L */}
                  <div className="col-span-1 text-right">
                    <span className="text-green-300">{wins}</span>
                    <span className="text-white/40"> / </span>
                    <span className="text-red-300">{losses}</span>
                  </div>

                  {/* Win% */}
                  <div className="col-span-1 text-right tabular-nums text-blue-300">
                    {winRate}%
                  </div>

                  {/* XP */}
                  <div className="col-span-1 text-right font-bold text-[#ff4655] tabular-nums">
                    {xp}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={goPrev}
            disabled={page === 0}
            className="px-4 py-2 rounded-md bg-white/10 border border-white/15 disabled:opacity-40 hover:bg-white/20 text-sm"
          >
            Prev
          </button>
          <span className="text-white/70 text-sm">
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={goNext}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-md bg-white/10 border border-white/15 disabled:opacity-40 hover:bg-white/20 text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
