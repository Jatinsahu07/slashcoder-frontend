import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import socket from "../socket";
import { Users, Trash2, Send } from "lucide-react";

const DEFAULT_ROOMS = [
  { id: "python-room", name: "🐍 Programming Room" },
  { id: "bug-room", name: "🪲 Bug Room" },
  { id: "fun-room", name: "🎉 Fun Room" },
  { id: "programming-room", name: "💻 Code Room" },
];

export default function ChatRooms() {
  const user = auth.currentUser;
  const [currentRoom, setCurrentRoom] = useState("python-room");
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [status, setStatus] = useState("Connecting...");
  const [activeUsers, setActiveUsers] = useState([]);
  const bottomRef = useRef(null);

  // 🧠 Join a room
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const username = user?.displayName || user?.email || "Anonymous";

    socket.emit("join_room", { roomId: currentRoom, username });
    socket.emit("get_active_users", { roomId: currentRoom });

    socket.on("system_message", (msg) => console.log("System:", msg));
    socket.on("receive_message", (data) => addMessageToFirestore(data.roomId, data));
    socket.on("active_users", (users) => setActiveUsers(users));

    setStatus(`💬 Joined ${currentRoom}`);

    return () => {
      socket.off("receive_message");
      socket.off("system_message");
      socket.off("active_users");
    };
  }, [currentRoom]);

  // 🔥 Listen to Firestore for messages
  useEffect(() => {
    const q = query(collection(db, "rooms", currentRoom, "messages"), orderBy("ts", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = [];
      snap.forEach((d) => msgs.push({ id: d.id, ...d.data() }));
      setMessages(msgs);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => unsub();
  }, [currentRoom]);

  // 📩 Add message to Firestore
  const addMessageToFirestore = async (roomId, data) => {
    try {
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        senderId: data.senderId || user?.uid,
        senderName: data.senderName || user?.displayName || "Anonymous",
        text: data.text,
        ts: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error saving message:", err);
    }
  };

  // 🧾 Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const msgData = {
      roomId: currentRoom,
      senderId: user?.uid,
      senderName: user?.displayName || user?.email || "Anonymous",
      text: newMsg.trim(),
    };
    socket.emit("send_message", msgData);
    await addMessageToFirestore(currentRoom, msgData);
    setNewMsg("");
  };

  // ❌ Delete message (only by sender)
  const handleDelete = async (id, senderId) => {
    if (senderId !== user?.uid) return alert("You can only delete your own messages!");
    try {
      await deleteDoc(doc(db, "rooms", currentRoom, "messages", id));
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{
        backgroundImage: `url(/assets/SLASH_BACKGROUND.jpeg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[#0A0A0F]/85 backdrop-blur-[2px]" />

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white/5 border-r border-white/10 p-5 flex flex-col">
          <h2 className="text-xl font-extrabold text-[#ff4655] mb-4">💬 Slashcoder Rooms</h2>

          <div className="flex flex-col space-y-2">
            {DEFAULT_ROOMS.map((r) => (
              <button
                key={r.id}
                onClick={() => setCurrentRoom(r.id)}
                className={`px-4 py-2 text-left rounded-lg transition font-medium ${
                  currentRoom === r.id
                    ? "bg-[#ff4655]/80 text-white shadow-[0_0_15px_rgba(255,70,85,0.5)]"
                    : "hover:bg-white/10 text-white/80"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* Active Users */}
          <div className="mt-6 border-t border-white/10 pt-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2 text-sm text-white/60">
              <Users className="w-4 h-4" /> Active Users ({activeUsers.length})
            </div>
            <ul className="space-y-1 text-sm text-white/80">
              {activeUsers.map((u, i) => (
                <li
                  key={i}
                  className="bg-white/5 px-2 py-1.5 rounded-md border border-white/10 truncate"
                >
                  {u}
                </li>
              ))}
              {activeUsers.length === 0 && (
                <li className="text-white/50 text-xs">No active users.</li>
              )}
            </ul>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md flex justify-between items-center">
            <h3 className="text-lg font-semibold tracking-wide text-[#ff4655]">
              {DEFAULT_ROOMS.find((r) => r.id === currentRoom)?.name}
            </h3>
            <span className="text-xs text-white/60">{status}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-white/60 mt-10">
                No messages yet. Start the conversation! 🚀
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.senderId === user?.uid;
                return (
                  <div
                    key={m.id}
                    className={`group relative max-w-[70%] px-4 py-2 rounded-lg transition ${
                      mine
                        ? "ml-auto bg-[#ff4655]/30 text-right"
                        : "bg-white/10 text-left"
                    }`}
                  >
                    {!mine && (
                      <div className="text-xs text-white/70 mb-1">{m.senderName}</div>
                    )}
                    <div className="text-sm leading-relaxed">{m.text}</div>

                    {/* Delete Button */}
                    {mine && (
                      <button
                        onClick={() => handleDelete(m.id, m.senderId)}
                        className="absolute hidden group-hover:flex top-1 right-1 text-white/50 hover:text-[#ff4655]"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-white/10 flex gap-3 bg-white/5">
            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-[#ff4655]"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#ff4655]/90 hover:bg-[#ff4655] px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
