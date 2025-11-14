// src/config.js

// -----------------------------------------
// 🌍 BACKEND BASE URL
// Priority:
// 1. Vite/React env variable
// 2. Production (Railway)
// 3. Local development
// -----------------------------------------

export const API_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:8000";


// -----------------------------------------
// 🔥 SOCKET.IO BASE URL
// Must be same as backend URL
// -----------------------------------------

export const SOCKET_BASE =
  import.meta.env.VITE_SOCKET_URL ||
  process.env.REACT_APP_SOCKET_URL ||
  API_BASE;


// -----------------------------------------
// 🤖 Gemini API Key (Frontend Safe)
// -----------------------------------------

export const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ||
  process.env.REACT_APP_GEMINI_API_KEY ||
  "";

