import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Matchmaking from "./pages/Matchmaking";
import MatchPage from "./pages/MatchPage";
import LeaderboardPage from "./pages/Leaderboard";
import TeamsPage from "./pages/Teams";

import Navbar from "./components/Navbar";
import FloatingTeamChat from "./components/chat/FloatingTeamChat";

import ErrorBoundary from "./components/_ErrorBoundary";
import useAppStore from "./store/useAppStore";

function App() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  const setUserId = useAppStore((s) => s.setUserId);
  const startAll  = useAppStore((s) => s.startAll);
  const stopAll   = useAppStore((s) => s.stopAll);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      try {
        if (fbUser) {
          setUserId(fbUser.uid);
          startAll && startAll(fbUser.uid);
          setAuthed(true);
        } else {
          stopAll && stopAll();
          setUserId(null);
          setAuthed(false);
        }
      } catch (e) {
        console.error("Auth wiring error:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [setUserId, startAll, stopAll]);

  if (loading) return <div style={{ padding: 20, color: "#666" }}>Loading…</div>;

  return (
    <ErrorBoundary>
      <Router>
        <Navbar />

        <Routes>
          <Route path="/" element={authed ? <Navigate to="/dashboard" /> : <Signup />} />
          <Route path="/signup" element={authed ? <Navigate to="/dashboard" /> : <Signup />} />
          <Route path="/login" element={authed ? <Navigate to="/dashboard" /> : <Login />} />

          <Route path="/dashboard" element={authed ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/match" element={<Matchmaking />} />
          <Route path="/matchpage" element={<MatchPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/teams" element={<TeamsPage />} />
        </Routes>

        {/* Re-enable after the app loads */}
        {/* {authed && <FloatingTeamChat />} */}
      </Router>
    </ErrorBoundary>
  );
}

export default App;
