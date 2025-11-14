// src/socket.js
import { io } from "socket.io-client";
import { SOCKET_BASE } from "./config";

// ✔ Backend uses app.mount("/ws")
// ✔ Backend uses socketio_path="/socket.io"
// Final socket URL: /ws/socket.io
const socket = io(SOCKET_BASE, {
  path: "/ws/socket.io",
  transports: ["websocket"],
  autoConnect: true,
});

export default socket;

// 🔥 GLOBAL listener — persists through refresh
socket.on("battle_result", (data) => {
  console.log("🔥 GLOBAL battle_result received:", data);
  localStorage.setItem("pending_battle_result", JSON.stringify(data));
});
