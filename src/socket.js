// src/socket.js
import { io } from "socket.io-client";
import { SOCKET_BASE } from "./config";

// -----------------------------------------
// 🚀 Production Socket.io Client
// Backend ASGI root = socket.io.ASGIApp
// socketio_path="/socket.io"
// → Final WS URL: /socket.io
// -----------------------------------------

const socket = io(SOCKET_BASE, {
  path: "/socket.io",          // ✔ FIXED (no /ws)
  transports: ["websocket"],   // Railway requires WS-only
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

export default socket;

// -----------------------------------------
// 🔔 GLOBAL LISTENERS
// -----------------------------------------
socket.on("connect", () => {
  console.log("🔗 Connected to SlashCoder socket server:", SOCKET_BASE);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connection failed:", err.message);
});

socket.on("battle_result", (data) => {
  console.log("🔥 GLOBAL battle_result received:", data);
  localStorage.setItem("pending_battle_result", JSON.stringify(data));
});

socket.on("disconnect", (reason) => {
  console.warn("⚠️ Socket disconnected:", reason);
});
