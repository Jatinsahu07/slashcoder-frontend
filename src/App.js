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

  // ✅ Listen for Firebase auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ✅ Show loading state while checking auth
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
        // 🔒 Public (Unauthenticated) Routes
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        // 🔓 Private (Authenticated) Routes with Navigation Shell
        <NavShell user={user}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/match" element={<Matchmaking />} />
            <Route path="/matchpage" element={<MatchPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/slashai" element={<SlashAI />} />
            <Route path="/chatrooms" element={<ChatRooms />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
            <Route path="/tournament" element={<TournamentPage />} />
            <Route path="/practice" element={<PracticeList />} />
            <Route path="/practice/:pid" element={<PracticeSolve />} />
          </Routes>
        </NavShell>
      )}
    </Router>
  );
}

export default App;
