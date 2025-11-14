// src/pages/PracticeList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function PracticeList() {
  const [problems, setProblems] = useState([]);
  const [completed, setCompleted] = useState([]);  // 👈 NEW
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch Completed Problems from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const ref = doc(db, "users", auth.currentUser.uid);
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setCompleted(snap.data().practiceCompleted || []);
      }
    });
  }, []);

  // 🔥 Fetch Practice Problem List
  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/api/practice/problems`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setProblems(data);
      })
      .catch((err) => {
        console.error("Error loading problems:", err);
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  // Group by difficulty
  const grouped = problems.reduce((acc, p) => {
    (acc[p.difficulty] = acc[p.difficulty] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-[#ff4655]">Practice Problems</h1>
        <p className="text-white/70 mt-2">
          Solve problems for practice — each completion awards XP.
        </p>

        {loading ? (
          <div className="mt-8 text-white/60">Loading problems…</div>
        ) : (
          <div className="mt-6 space-y-6">
            {["Very Easy", "Easy", "Medium"].map((diff) =>
              grouped[diff] ? (
                <div key={diff}>
                  <h2 className="text-xl font-semibold text-white/90 mb-3">{diff}</h2>

                  <div className="grid gap-3">
                    {grouped[diff].map((p) => {
                      const isDone = completed.includes(p.id);

                      return (
                        <div
                          key={p.id}
                          className={`p-4 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between transition
                            ${isDone ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"}
                          `}
                        >
                          {isDone ? (
                            // DONE — cannot click
                            <div className="flex justify-between w-full">
                              <div>
                                <div className="font-medium">{p.title}</div>
                                <div className="text-xs text-white/60">{p.description}</div>
                              </div>

                              <div className="text-green-400 text-sm font-bold">✔ Done</div>
                            </div>
                          ) : (
                            // NOT DONE — clickable link
                            <Link
                              to={`/practice/${p.id}`}
                              state={p}
                              className="flex justify-between w-full"
                            >
                              <div>
                                <div className="font-medium">{p.title}</div>
                                <div className="text-xs text-white/60">{p.description}</div>
                              </div>

                              <div className="text-xs px-3 py-1 rounded bg-black/20">
                                {p.difficulty}
                              </div>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
