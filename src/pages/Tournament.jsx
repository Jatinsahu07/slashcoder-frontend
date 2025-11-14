// src/pages/Tournament.jsx
import React from "react";
import { Trophy } from "lucide-react";
import bgSlash from "../assets/SLASH_BACKGROUND.jpeg"; // ✅ your background image

export default function TournamentPage() {
  return (
    <div
      className="relative min-h-[100vh] flex flex-col items-center justify-center text-center overflow-hidden"
      style={{
        backgroundImage: `url(${bgSlash})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* 🔸 Overlay for readability */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      {/* 🔸 Glow animation layer */}
      <div className="absolute -inset-10 bg-gradient-to-r from-[#ff4655]/40 via-[#ff4655]/10 to-transparent blur-3xl opacity-70 animate-pulse" />

      {/* 🔸 Content */}
      <div className="relative z-10 flex flex-col items-center gap-5 p-6 text-white">
        <div className="p-6 rounded-full bg-white/10 ring-2 ring-[#ff4655]/60 shadow-[0_0_30px_#ff4655aa] animate-pulse">
          <Trophy className="w-16 h-16 text-[#ff4655]" />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mt-4 drop-shadow-[0_0_20px_#ff4655aa]">
          Slashcoder Tournament Arena
        </h1>

        <p className="text-white/80 max-w-lg text-sm md:text-base mt-2 leading-relaxed">
          The **ultimate coding championship** is on its way!  
          Battle real developers, climb ranks, and earn rewards in the Slashcoder Arena.
        </p>

        <div className="mt-6">
          <button
            disabled
            className="px-8 py-3 rounded-full bg-[#ff4655]/90 text-white font-semibold text-sm md:text-base shadow-lg shadow-[#ff4655]/40 cursor-not-allowed hover:scale-105 transition-transform"
          >
            ⚙️ Coming Soon 🚀
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 text-xs text-white/40 z-10">
        ⚡ Slashcoder Arena · Tournaments Feature Under Development ⚡
      </div>
    </div>
  );
}
