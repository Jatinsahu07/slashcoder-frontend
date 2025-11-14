// src/socket.js
import { io } from "socket.io-client";
import { SOCKET_BASE } from "./config.js";

// -----------------------------------------
// 🚀 Production-Ready Socket.io Client
// -----------------------------------------
// Backend uses:
//    app.mount("/ws", socketio.ASGIApp(...))
//    socketio_path="/socket.io"
// → Final URL: /ws/socket.io
//
// Railway requires WebSocket-only transport!
// -----------------------------------------

const socket = io(SOCKET_BASE, {
  path: "/ws/socket.io",
  transports: ["websocket"],      // 🚀 Prevents polling issues on Railway
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

// -----------------------------------------
// 🌐 GLOBAL Socket Export
// -----------------------------------------
export default socket;

// -----------------------------------------
// 🔔 GLOBAL LISTENERS (stay alive forever)
// -----------------------------------------

// 🔗 Successful connection
socket.on("connect", () => {
  console.log("🔗 Connected to SlashCoder socket server:", SOCKET_BASE);
});

// ❌ Connection error
socket.on("connect_error", (err) => {
  console.error("❌ Socket connection failed:", err.message);
});

// 🔥 Match result (shared across all pages)
socket.on("battle_result", (data) => {
  console.log("🔥 GLOBAL battle_result received:", data);

  // Store result so MatchPage can pick it up even after a reload
  localStorage.setItem("pending_battle_result", JSON.stringify(data));
});

// 📡 Optional: Debug disconnection
socket.on("disconnect", (reason) => {
  console.warn("⚠️ Socket disconnected:", reason);
});

