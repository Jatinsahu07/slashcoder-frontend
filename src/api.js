// src/api.js
import axios from "axios";
import { API_BASE } from "./config";

// ----------------------------------------------------
// 🌍 Axios Instance — Unified API client
// ----------------------------------------------------
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// ----------------------------------------------------
// 🔐 Auto-Attach Firebase Token
// ----------------------------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("idToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ----------------------------------------------------
// ⚠️ Global Error Handler
// ----------------------------------------------------
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("🔥 API Error:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);

// ----------------------------------------------------
// 🔹 AUTH
// ----------------------------------------------------
export const signupUser = async (email, password) => {
  const response = await api.post("/auth/signup", { email, password });
  return response.data;
};

export const verifyToken = async () => {
  const res = await api.get("/auth/verify");
  return res.data;
};

// ----------------------------------------------------
// 🤖 AI Tutor (normal response)
// ----------------------------------------------------
export const aiTutor = async (prompt) => {
  const res = await api.post("/ai/tutor", { prompt });
  return res.data;
};

// ❗ Removed aiTutorStream URL builder (wrong for POST).
// Use geminiProxy.js for streaming.

// ----------------------------------------------------
// 🧠 PRACTICE
// ----------------------------------------------------
export const getPracticeProblems = async () => {
  const res = await api.get("/api/practice/problems");
  return res.data;
};

export const runPracticeCode = async (payload) => {
  const res = await api.post("/api/practice/run", payload);
  return res.data;
};

export const submitPracticeCode = async (payload) => {
  const res = await api.post("/api/practice/submit", payload);
  return res.data;
};

// ----------------------------------------------------
// 🏆 STATS
// ----------------------------------------------------
export const updateStats = async (payload) => {
  const res = await api.post("/api/update-stats", payload);
  return res.data;
};

// ----------------------------------------------------
// 🧑‍💼 PROFILE
// ----------------------------------------------------
export const getProfile = async (uid) => {
  const res = await api.get(`/profile/${uid}`);
  return res.data;
};

// ----------------------------------------------------
// ⚡ Code Runner (Judge0)
// ----------------------------------------------------
export const runJudgeCode = async (payload) => {
  const res = await api.post("/code/run", payload);
  return res.data;
};

export default api;
