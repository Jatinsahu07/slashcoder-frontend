import React from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar({ user }) {
  const { pathname } = useLocation();

  const isActive = (path) =>
    pathname === path
      ? "bg-[#ff4655] text-white shadow-[0_0_12px_rgba(255,70,85,0.6)]"
      : "text-white/80";

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <nav className="w-full bg-[#0A0A0F]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between fixed top-0 z-50">
      
      {/* Logo / App Name */}
      <Link to="/" className="text-xl font-bold text-white tracking-wide">
        Slashcoder
      </Link>

      {/* Menu Items */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-md text-sm font-medium ${isActive("/dashboard")}`}
            >
              Dashboard
            </Link>

            <Link
              to="/match"
              className={`px-4 py-2 rounded-md text-sm font-medium ${isActive("/match")}`}
            >
              Find Match
            </Link>

            <Link
              to="/leaderboard"
              className={`px-4 py-2 rounded-md text-sm font-medium ${isActive("/leaderboard")}`}
            >
              Leaderboard
            </Link>

            <Link
              to="/teams"
              className={`px-4 py-2 rounded-md text-sm font-medium ${isActive("/teams")}`}
            >
              Teams
            </Link>
            <Link to="/slashai" className="hover:text-indigo-400">Slash AI</Link>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md text-sm font-medium text-white/80 border border-white/20"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className={`px-4 py-2 rounded-md text-sm font-medium ${isActive("/login")}`}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className={`px-4 py-2 rounded-md text-sm font-medium ${isActive("/signup")}`}
            >
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
