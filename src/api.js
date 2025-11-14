// src/api.js
import axios from "axios";
import { API_BASE } from "./config.js";

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
// 🔐 Auto-Attach Firebase Token (for protected routes)
// ----------------------------------------------------
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("idToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

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
// 🔹 AUTH ENDPOINTS
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
// 🤖 AI Tutor Endpoints
// ----------------------------------------------------
export const aiTutor = async (prompt) => {
  const res = await api.post("/ai/tutor", { prompt });
  return res.data;
};

export const aiTutorStream = (prompt) => {
  return `${API_BASE}/ai/tutor/stream?prompt=${encodeURIComponent(prompt)}`;
};

// ----------------------------------------------------
// 🧠 PRACTICE Endpoints
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
// 🏆 STATS Endpoints
// ----------------------------------------------------
export const updateStats = async (payload) => {
  const res = await api.post("/api/update-stats", payload);
  return res.data;
};

// ----------------------------------------------------
// 🧑‍💼 PROFILE Endpoints
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

// ----------------------------------------------------
export default api;
