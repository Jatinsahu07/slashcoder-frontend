// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Pages
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Matchmaking from "./pages/Matchmaking";
import SlashAI from "./pages/SlashAI";
import MatchPage from "./pages/MatchPage";
import LeaderboardPage from "./pages/Leaderboard";
import TeamsPage from "./pages/Teams";
import ChatRooms from "./pages/ChatRooms";
import TournamentPage from "./pages/Tournament";
import PracticeList from "./pages/PracticeList";
import PracticeSolve from "./pages/PracticeSolve";

// Layout
import NavShell from "./components/NavShell";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Listen for auth changes + store token
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      if (u) {
        // save initial token
        const token = await u.getIdToken();
        localStorage.setItem("idToken", token);

        // auto-refresh token every 5 min
        const refresh = setInterval(async () => {
          const newToken = await u.getIdToken(true);
          localStorage.setItem("idToken", newToken);
        }, 5 * 60 * 1000);

        return () => clearInterval(refresh);
      } else {
        localStorage.removeItem("idToken");
      }
    });

    return () => unsub();
  }, []);

  // Show loading screen
  if (loading) {
    return (
      <div className="bg-black text-white h-screen flex items-center justify-center">
        <h1 className="text-2xl font-semibold animate-pulse">Loading Slashcoder...</h1>
      </div>
    );
  }

  return (
    <Router>
      {!user ? (
        // PUBLIC ROUTES
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        // PRIVATE ROUTES
        <NavShell user={user}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* FIXED ROUTES */}
            <Route path="/find-match" element={<Matchmaking />} />
            <Route path="/match" element={<MatchPage />} />

            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/slashai" element={<SlashAI />} />
            <Route path="/chatrooms" element={<ChatRooms />} />
            <Route path="/tournament" element={<TournamentPage />} />
            <Route path="/practice" element={<PracticeList />} />
            <Route path="/practice/:pid" element={<PracticeSolve />} />

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </NavShell>
      )}
    </Router>
  );
}

export default App;
