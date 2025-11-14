import { create } from "zustand";
import {
  doc, onSnapshot, collection, query, orderBy, limit,
  addDoc, updateDoc, getDoc, serverTimestamp,
  arrayUnion, arrayRemove
} from "firebase/firestore";
import { db } from "../firebase";

// Generate 6-char team code
const genCode = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const useAppStore = create((set, get) => ({

  /* ---------- AUTH STATES ---------- */
  userId: null,
  user: null,

  setUserId: (uid) => set({ userId: uid }),

  /* ---------- APP STATES ---------- */
  team: null,
  teamMembers: [],
  leaderboard: [],
  userMatches: [],
  teamsPublic: [],

  /* ---------- INTERNAL UNSUBS ---------- */
  _offUser: null,
  _offLb: null,
  _offTeamDoc: null,
  _offTeamsPublic: null,
  _offMatches: null,

  /* ---------- START LISTENERS ---------- */
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

  /* ---------- STOP ALL LISTENERS ---------- */
  stopAll: () => {
    const { _offUser, _offLb, _offTeamDoc, _offTeamsPublic, _offMatches } = get();
    [_offUser, _offLb, _offTeamDoc, _offTeamsPublic, _offMatches].forEach(off => off && off());

    set({
      _offUser: null,
      _offLb: null,
      _offTeamDoc: null,
      _offTeamsPublic: null,
      _offMatches: null,
      userId: null,
      user: null,
      team: null,
      teamMembers: [],
      leaderboard: [],
      userMatches: [],
      teamsPublic: [],
    });
  },

  /* ---------- FIRESTORE LISTENERS ---------- */

  // User Listener
  _attachUser: (uid) => {
    const off = onSnapshot(doc(db, "users", uid), (snap) => {
      const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      set({ user: data });

      // sync team listener
      const currentTeamId = get().team?.id || null;
      const newTeamId = data?.teamId || null;

      if (currentTeamId !== newTeamId) {
        const { _offTeamDoc } = get();
        if (_offTeamDoc) _offTeamDoc();
        set({ _offTeamDoc: null, team: null, teamMembers: [] });

        if (newTeamId) get()._attachTeam(newTeamId);
      }
    });

    set({ _offUser: off });
  },

  // Team Listener
  _attachTeam: (teamId) => {
    const offDoc = onSnapshot(doc(db, "teams", teamId), (snap) => {
      if (!snap.exists()) {
        set({ team: null, teamMembers: [] });
        return;
      }

      const teamData = { id: snap.id, ...snap.data() };
      set({
        team: teamData,
        teamMembers: teamData.members || []
      });
    });

    set({ _offTeamDoc: offDoc });
  },

  // Public Teams List
  startTeamsPublic: () => {
    const off = onSnapshot(
      query(collection(db, "teams"), orderBy("createdAt", "desc"), limit(50)),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            memberCount: (data.memberIds || []).length,
          };
        });

        set({ teamsPublic: list });
      }
    );
    set({ _offTeamsPublic: off });
  },

  // Leaderboard (Ordered by XP)
  _attachLeaderboard: () => {
    const qLb = query(collection(db, "users"), orderBy("xp", "desc"), limit(100));
    const off = onSnapshot(qLb, (snap) => {
      const lb = snap.docs.map((d, index) => ({
        id: d.id,
        rank: index + 1,
        username: d.data().username || "Anonymous",
        xp: d.data().xp || 0,
        wins: d.data().wins || 0,
        losses: d.data().losses || 0,
      }));

      set({ leaderboard: lb });
    });

    set({ _offLb: off });
  },

  // Recent Matches
  _attachMatches: (uid) => {
    const qM = query(
      collection(db, "users", uid, "matches"),
      orderBy("endedAt", "desc"),
      limit(20)
    );

    const off = onSnapshot(qM, (snap) => {
      const matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      set({ userMatches: matches });
    });

    set({ _offMatches: off });
  },

  /* ---------- TEAM ACTIONS ---------- */

  createTeam: async (teamName) => {
    const u = get().user;
    if (!u?.id) throw new Error("Not logged in");
    if (u.teamId) throw new Error("You're already in a team");

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

    const teamData = snap.data();
    const memberIds = teamData.memberIds || [];

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
    if (!u?.id || !u.teamId) return;

    const teamId = u.teamId;
    const snap = await getDoc(doc(db, "teams", teamId));

    const memberObj = { userId: u.id, username: u.username || "Player" };

    if (snap.exists()) {
      await updateDoc(doc(db, "teams", teamId), {
        members: arrayRemove(memberObj),
        memberIds: arrayRemove(u.id),
      });
    }

    await updateDoc(doc(db, "users", u.id), { teamId: null });
  },

}));

export default useAppStore;
