import { create } from "zustand";
import {
  doc, onSnapshot, collection, query, orderBy, limit,
  addDoc, updateDoc, getDoc, serverTimestamp,
  arrayUnion, arrayRemove
} from "firebase/firestore";
import { db } from "../firebase";

// helper: 6-char alphanumeric team code
const genCode = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const useAppStore = create((set, get) => ({

  /* ---------- AUTH / CORE STATE ---------- */
  userId: null,          // firebase uid
  user: null,            // firestore user doc {id, username, teamId, ...}

  setUserId: (uid) => set({ userId: uid }),

  /* ---------- APP DATA ---------- */
  team: null,            // current team doc
  teamMembers: [],       // from team.members
  leaderboard: [],       // top users by points
  userMatches: [],       // recent matches for this user
  teamsPublic: [],       // public list to browse/join

  /* ---------- INTERNAL UNSUBS ---------- */
  _offUser: null,
  _offLb: null,
  _offTeamDoc: null,
  _offTeamsPublic: null,
  _offMatches: null,

  /* ---------- LIFECYCLE ---------- */
  startAll: (uid) => {
    const { stopAll, _attachUser, _attachLeaderboard, _attachMatches, startTeamsPublic } = get();
    stopAll();
    set({
      userId: uid,
      user: null,
      team: null,
      teamMembers: [],
      leaderboard: [],
      userMatches: [],
      teamsPublic: [],
    });
    _attachUser(uid);
    _attachLeaderboard();
    _attachMatches(uid);
    startTeamsPublic();
  },

  stopAll: () => {
    const { _offUser, _offLb, _offTeamDoc, _offTeamsPublic, _offMatches } = get();
    [_offUser, _offLb, _offTeamDoc, _offTeamsPublic, _offMatches].forEach(off => off && off());
    set({
      _offUser: null, _offLb: null, _offTeamDoc: null, _offTeamsPublic: null, _offMatches: null,
      userId: null,
      user: null,
      team: null,
      teamMembers: [],
      leaderboard: [],
      userMatches: [],
      teamsPublic: [],
    });
  },

  /* ---------- LISTENERS ---------- */
  _attachUser: (uid) => {
    const ref = doc(db, "users", uid);
    const off = onSnapshot(ref, (snap) => {
      const u = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      set({ user: u });

      const currentTeamId = get().team?.id || null;
      const nextTeamId = u?.teamId || null;
      if (currentTeamId !== nextTeamId) {
        // rewire team listener
        const { _offTeamDoc } = get();
        if (_offTeamDoc) _offTeamDoc();
        set({ _offTeamDoc: null, team: null, teamMembers: [] });
        if (nextTeamId) get()._attachTeam(nextTeamId);
      }
    });
    set({ _offUser: off });
  },

  _attachTeam: (teamId) => {
    const offDoc = onSnapshot(doc(db, "teams", teamId), (snap) => {
      if (!snap.exists()) {
        set({ team: null, teamMembers: [] });
        return;
      }
      const t = { id: snap.id, ...snap.data() };
      set({ team: t, teamMembers: t.members || [] });
    });
    set({ _offTeamDoc: offDoc });
  },

  startTeamsPublic: () => {
    const off = onSnapshot(
      query(collection(db, "teams"), orderBy("createdAt", "desc"), limit(50)),
      (snap) => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        set(rows ? { teamsPublic: rows.map(t => ({ ...t, memberCount: (t.memberIds || []).length })) } : { teamsPublic: [] });
      }
    );
    set({ _offTeamsPublic: off });
  },

   _attachLeaderboard: () => {
  // Listen to Firestore users ordered by XP
  const qLb = query(collection(db, "users"), orderBy("xp", "desc"), limit(100));
  const off = onSnapshot(qLb, (snap) => {
    const leaderboardData = snap.docs.map((d, index) => ({
      id: d.id,
      rank: index + 1,
      username: d.data().username || "Anonymous",
      xp: d.data().xp || 0,
      wins: d.data().wins || 0,
      losses: d.data().losses || 0,
    }));
    set({ leaderboard: leaderboardData });
  });
  set({ _offLb: off });
},


  

  _attachMatches: (uid) => {
    const qM = query(collection(db, "users", uid, "matches"), orderBy("endedAt", "desc"), limit(20));
    const off = onSnapshot(qM, (snap) => {
      set({ userMatches: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    });
    set({ _offMatches: off });
  },

  /* ---------- TEAM ACTIONS (no chat) ---------- */
  createTeam: async (teamName) => {
    const u = get().user;
    if (!u?.id) throw new Error("Not logged in");
    if (u.teamId) throw new Error("You are already in a team");

    const code = genCode();
    const ref = await addDoc(collection(db, "teams"), {
      name: teamName,
      code,
      totalPoints: 0,
      createdAt: serverTimestamp(),
      members: [{ userId: u.id, username: u.username || "Player" }],
      memberIds: [u.id],
    });

    await updateDoc(doc(db, "users", u.id), { teamId: ref.id });
    return ref.id;
  },

  joinTeamById: async (teamId) => {
    const u = get().user;
    if (!u?.id) throw new Error("Not logged in");
    if (u.teamId) throw new Error("Leave your current team first");

    const snap = await getDoc(doc(db, "teams", teamId));
    if (!snap.exists()) throw new Error("Team not found");
    const t = snap.data();
    const memberIds = t.memberIds || [];
    if (memberIds.includes(u.id)) {
      await updateDoc(doc(db, "users", u.id), { teamId });
      return;
    }
    if (memberIds.length >= 10) throw new Error("Team is full (10/10)");

    await updateDoc(doc(db, "teams", teamId), {
      members: arrayUnion({ userId: u.id, username: u.username || "Player" }),
      memberIds: arrayUnion(u.id),
    });
    await updateDoc(doc(db, "users", u.id), { teamId });
  },

  leaveTeam: async () => {
    const u = get().user;
    if (!u?.id || !u?.teamId) return;
    const teamId = u.teamId;

    const snap = await getDoc(doc(db, "teams", teamId));
    if (!snap.exists()) {
      await updateDoc(doc(db, "users", u.id), { teamId: null });
      return;
    }
    const memberObj = { userId: u.id, username: u.username || "Player" };

    await updateDoc(doc(db, "teams", teamId), {
      members: arrayRemove(memberObj),
      memberIds: arrayRemove(u.id),
    });
    await updateDoc(doc(db, "users", u.id), { teamId: null });
  },
}));

export default useAppStore;
