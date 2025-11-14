// -----------------------------------------
// BACKEND BASE URL
// -----------------------------------------
export const API_BASE =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

// -----------------------------------------
// SOCKET.IO BASE URL
// -----------------------------------------
export const SOCKET_BASE =
  process.env.REACT_APP_SOCKET_URL || API_BASE;

// -----------------------------------------
// Gemini API Key
// -----------------------------------------
export const GEMINI_API_KEY =
  process.env.REACT_APP_GEMINI_API_KEY || "";
