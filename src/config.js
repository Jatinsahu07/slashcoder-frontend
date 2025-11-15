// -----------------------------------------
// BACKEND BASE URL (FastAPI on Railway)
// -----------------------------------------
export const API_BASE = (() => {
  // Prefer env variable (Vercel)
  const url = process.env.REACT_APP_BACKEND_URL;

  if (url && url.trim() !== "") {
    return url.replace(/\/+$/, "");   // remove trailing slashes
  }

  // Fallback for local development
  return "http://localhost:8000";
})();


// -----------------------------------------
// SOCKET.IO BASE URL (WebSockets)
// -----------------------------------------
export const SOCKET_BASE = (() => {
  const url = process.env.REACT_APP_SOCKET_URL;

  if (url && url.trim() !== "") {
    return url.replace(/\/+$/, "");
  }

  // Default = backend URL
  return API_BASE;
})();


// -----------------------------------------
// Gemini API Key (Frontend — rarely used)
// -----------------------------------------
export const GEMINI_API_KEY =
  process.env.REACT_APP_GEMINI_API_KEY?.trim() || "";
