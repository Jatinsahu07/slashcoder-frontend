// src/pages/Teams.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "../firebase";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Users, Trophy, MessageSquare, Crown } from "lucide-react";

const levelFromPoints = (pts = 0) => 1 + Math.floor(pts / 1000);

function Stat({ label, value }) {
  return (
    <div className="flex flex-col items-center bg-white/5 p-3 rounded-xl border border-white/10">
      <div className="text-xl font-bold text-[#ff4655]">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}

function AvatarFallback({ name = "P" }) {
  const initials = (name || "P").slice(0, 2).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-[#ff4655]/20 text-[#ff4655] flex items-center justify-center font-semibold">
      {initials}
    </div>
  );
}

export default function TeamsPage() {
  const fbUser = auth.currentUser;
  const uid = fbUser?.uid || null;

  const [me, setMe] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [team, setTeam] = useState(null);
  const [teamsPublic, setTeamsPublic] = useState([]);
  const [members, setMembers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");
  const bottomRef = useRef(null);
  const [matches, setMatches] = useState([]);

  // 🔹 User listener
  useEffect(() => {
    if (!uid) return;
    const off = onSnapshot(doc(db, "users", uid), (snap) => {
      const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      setMe(data);
      setTeamId(data?.teamId || null);
    });
    return () => off();
  }, [uid]);

  // 🔹 Public teams
  useEffect(() => {
    const qPub = query(collection(db, "teams"), orderBy("createdAt", "desc"), limit(50));
    const off = onSnapshot(qPub, (qs) => {
      const arr = [];
      qs.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setTeamsPublic(arr);
    });
    return () => off();
  }, []);

  // 🔹 Current team + chat + matches
  useEffect(() => {
    if (!teamId) {
      setTeam(null);
      setMembers([]);
      setMessages([]);
      setMatches([]);
      return;
    }

    const offTeam = onSnapshot(doc(db, "teams", teamId), (snap) => {
      if (!snap.exists()) {
        setTeam(null);
        setMembers([]);
        return;
      }
      const t = { id: snap.id, ...snap.data() };
      setTeam(t);
      setMembers(t.members || []);
    });

    const qMsg = query(
      collection(db, "teams", teamId, "messages"),
      orderBy("ts", "asc"),
      limit(200)
    );
    const offMsgs = onSnapshot(qMsg, (qs) => {
      const arr = [];
      qs.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setMessages(arr);
      if (chatOpen && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    });

    const qMatches = query(
      collection(db, "teams", teamId, "matches"),
      orderBy("endedAt", "desc"),
      limit(10)
    );
    const offMatches = onSnapshot(qMatches, (qs) => {
      const arr = [];
      qs.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setMatches(arr);
    });

    return () => {
      offTeam && offTeam();
      offMsgs && offMsgs();
      offMatches && offMatches();
    };
  }, [teamId, chatOpen, db]);

  // 🔹 Actions (create/join/leave/send)
  async function createTeam() {
    if (!uid) return setErr("Login required");
    const name = newTeamName.trim();
    if (!name) return;
    setBusy(true);
    setErr("");
    try {
      const meName = me?.username || fbUser?.displayName || "Player";
      const meAvatar = me?.avatarUrl || fbUser?.photoURL || "";
      const ref = await addDoc(collection(db, "teams"), {
        name,
        createdAt: serverTimestamp(),
        ownerId: uid,
        totalPoints: 0,
        members: [{ userId: uid, username: meName, avatar: meAvatar }],
      });
      await updateDoc(doc(db, "users", uid), { teamId: ref.id });
      setNewTeamName("");
    } catch (e) {
      setErr(e.message || "Failed to create team");
    } finally {
      setBusy(false);
    }
  }

  async function joinTeam() {
    if (!uid) return setErr("Login required");
    const id = joinId.trim();
    if (!id) return;
    setBusy(true);
    setErr("");
    try {
      const tSnap = await getDoc(doc(db, "teams", id));
      if (!tSnap.exists()) throw new Error("Team not found");
      const t = tSnap.data();
      const arr = t.members || [];
      const already = arr.some((m) => m.userId === uid);
      if (already) {
        await updateDoc(doc(db, "users", uid), { teamId: id });
        setJoinId("");
        return;
      }
      if (arr.length >= 10) throw new Error("Team is full (10/10)");

      const meName = me?.username || fbUser?.displayName || "Player";
      const meAvatar = me?.avatarUrl || fbUser?.photoURL || "";
      await updateDoc(doc(db, "teams", id), {
        members: arrayUnion({ userId: uid, username: meName, avatar: meAvatar }),
      });
      await updateDoc(doc(db, "users", uid), { teamId: id });
      setJoinId("");
    } catch (e) {
      setErr(e.message || "Failed to join team");
    } finally {
      setBusy(false);
    }
  }

  async function leaveTeam() {
    if (!uid || !teamId || !team) return;
    setBusy(true);
    setErr("");
    try {
      const meName = me?.username || fbUser?.displayName || "Player";
      const meAvatar = me?.avatarUrl || fbUser?.photoURL || "";
      const memberObj = { userId: uid, username: meName, avatar: meAvatar };
      await updateDoc(doc(db, "teams", teamId), {
        members: arrayRemove(memberObj),
      });
      await updateDoc(doc(db, "users", uid), { teamId: null });
    } catch (e) {
      setErr(e.message || "Failed to leave team");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!uid || !teamId) return;
    const text = msgText.trim();
    if (!text) return;
    try {
      const meName = me?.username || fbUser?.displayName || "Player";
      await addDoc(collection(db, "teams", teamId, "messages"), {
        senderId: uid,
        senderName: meName,
        text: text.slice(0, 500),
        ts: serverTimestamp(),
      });
      setMsgText("");
      if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setErr(e.message || "Failed to send");
    }
  }

  function copyInvite() {
    if (!team?.id) return;
    navigator.clipboard.writeText(team.id).catch(() => {});
  }

  // 🔹 Derived
  const memberCount = members.length;
  const teamPoints = team?.totalPoints || 0;
  const teamLevel = levelFromPoints(teamPoints);
  const iAmMember = !!teamId && !!members.find((m) => m.userId === uid);
  const iAmOwner = team?.ownerId === uid;
  const sortedMembers = useMemo(() => (members || []).slice(), [members]);

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

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-wide drop-shadow-[0_0_20px_#ff4655aa]">
            🎮 Teams
          </h1>
          <p className="text-white/70 mt-2">
            Form teams, compete, and chat in the <span className="text-[#ff4655]">Slashcoder Arena</span>
          </p>
        </div>

        {err && <div className="bg-[#ff4655]/20 border border-[#ff4655]/40 p-3 rounded-xl text-sm text-center">{err}</div>}

        {/* Team dashboard or creation */}
        {iAmMember && team ? (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_0_25px_rgba(255,70,85,0.1)]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#ff4655]">{team.name}</h2>
                  <p className="text-sm text-white/70 mt-1">
                    Level {teamLevel} • {memberCount} members
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={copyInvite} className="px-3 py-1.5 text-sm rounded-md bg-[#ff4655]/90 hover:bg-[#ff4655]">
                    Copy ID
                  </button>
                  <button onClick={leaveTeam} disabled={busy} className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20">
                    Leave Team
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Stat label="Members" value={memberCount} />
              <Stat label="Team Points" value={teamPoints} />
              <Stat label="Level" value={teamLevel} />
            </div>

            {/* Members */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_0_25px_rgba(255,70,85,0.1)]">
              <h3 className="text-lg font-semibold text-[#ff4655] mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" /> Members
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {sortedMembers.length === 0 ? (
                  <p className="text-white/60">No members loaded.</p>
                ) : (
                  sortedMembers.map((m, idx) => (
                    <div
                      key={m.userId || idx}
                      className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-lg hover:bg-white/[0.08] transition"
                    >
                      <div className="flex items-center gap-3">
                        <AvatarFallback name={m.username} />
                        <div>
                          <div className="font-semibold">
                            {m.username} {m.userId === uid && <span className="text-xs text-[#ff4655]">(you)</span>}
                          </div>
                          <div className="text-xs text-white/50">{m.userId}</div>
                        </div>
                      </div>
                      <div className="text-xs text-white/60">{idx === 0 ? "Owner" : "Member"}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_0_25px_rgba(255,70,85,0.1)]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-[#ff4655] flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Team Chat
                </h3>
                <button onClick={() => setChatOpen(!chatOpen)} className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md">
                  {chatOpen ? "Hide" : "Show"}
                </button>
              </div>

              {chatOpen && (
                <>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {messages.map((m) => {
                      const mine = m.senderId === uid;
                      return (
                        <div
                          key={m.id}
                          className={`p-2 rounded-md max-w-[70%] ${
                            mine
                              ? "ml-auto bg-[#ff4655]/30 text-right"
                              : "bg-white/10"
                          }`}
                        >
                          {!mine && <div className="text-xs text-white/70">{m.senderName}</div>}
                          <div className="text-sm">{m.text}</div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                  <form onSubmit={sendMessage} className="flex mt-3 gap-2">
                    <input
                      className="flex-1 bg-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/50 outline-none"
                      placeholder="Type a message…"
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                    />
                    <button className="px-4 py-2 bg-[#ff4655]/90 hover:bg-[#ff4655] rounded-md text-sm">
                      Send
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Team Matches */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_0_25px_rgba(255,70,85,0.1)]">
              <h3 className="text-lg font-semibold text-[#ff4655] mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5" /> Recent Team Matches
              </h3>
              {matches.length === 0 ? (
                <p className="text-white/60 text-sm">No team matches yet.</p>
              ) : (
                <ul className="space-y-2">
                  {matches.map((m) => (
                    <li
                      key={m.id}
                      className="flex justify-between bg-white/5 border border-white/10 p-3 rounded-md hover:bg-white/[0.08] transition"
                    >
                      <div>
                        <div className="font-medium">{m.result || "-"}</div>
                        <div className="text-xs text-white/60">{m.id}</div>
                      </div>
                      {typeof m.pointsEarned === "number" && (
                        <div className="text-sm text-[#ff4655] font-semibold">
                          {m.pointsEarned > 0 ? "+" : ""}
                          {m.pointsEarned} pts
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Not in a team → Create/Join */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-[#ff4655] mb-3">Create a Team</h3>
                <input
                  className="w-full bg-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/50 outline-none mb-3"
                  placeholder="Enter team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
                <button
                  onClick={createTeam}
                  disabled={busy || !uid}
                  className="w-full py-2 bg-[#ff4655]/90 hover:bg-[#ff4655] rounded-md text-sm"
                >
                  {uid ? "Create Team" : "Login required"}
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-[#ff4655] mb-3">Join a Team</h3>
                <input
                  className="w-full bg-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/50 outline-none mb-3"
                  placeholder="Enter team ID"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                />
                <button
                  onClick={joinTeam}
                  disabled={busy || !uid}
                  className="w-full py-2 bg-[#ff4655]/90 hover:bg-[#ff4655] rounded-md text-sm"
                >
                  {uid ? "Join Team" : "Login required"}
                </button>
              </div>
            </div>

            {/* Public Teams */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_0_25px_rgba(255,70,85,0.1)]">
              <h3 className="text-lg font-semibold text-[#ff4655] mb-3 flex items-center gap-2">
                <Crown className="w-5 h-5" /> Public Teams
              </h3>
              {teamsPublic.length === 0 ? (
                <p className="text-white/60 text-sm">No teams yet.</p>
              ) : (
                <ul className="space-y-2">
                  {teamsPublic.map((t) => (
                    <li
                      key={t.id}
                      className="flex justify-between bg-white/5 border border-white/10 p-3 rounded-md hover:bg-white/[0.08] transition"
                    >
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-white/60">
                          {(t.members || []).length}/10 members
                        </div>
                      </div>
                      <button
                        onClick={() => setJoinId(t.id)}
                        className="text-sm bg-[#ff4655]/80 hover:bg-[#ff4655] px-3 py-1 rounded-md"
                      >
                        Use ID
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
