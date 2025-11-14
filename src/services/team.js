// src/services/team.js
import { db } from "../firebase";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

// Generate 6-char team code
export function generateTeamCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// ------------------------------------------------------
// ✅ CREATE TEAM
// ------------------------------------------------------
export async function createTeam(user, teamName) {
  if (!user?.id) throw new Error("Invalid user");

  const username = user.username || "Player";
  const code = generateTeamCode();

  const teamRef = await addDoc(collection(db, "teams"), {
    name: teamName,
    code,
    totalPoints: 0,
    createdAt: serverTimestamp(),
    members: [{ userId: user.id, username }],
    memberIds: [user.id],
  });

  await updateDoc(doc(db, "users", user.id), { teamId: teamRef.id });
  return teamRef.id;
}

// ------------------------------------------------------
// ✅ JOIN TEAM
// ------------------------------------------------------
export async function joinTeam(user, teamId) {
  if (!user?.id) throw new Error("Invalid user");

  const username = user.username || "Player";
  const teamRef = doc(db, "teams", teamId);
  const snap = await getDoc(teamRef);

  if (!snap.exists()) throw new Error("Team not found");

  const team = snap.data();
  const ids = team.memberIds || [];

  if (ids.includes(user.id)) {
    // Already in team — just update profile
    await updateDoc(doc(db, "users", user.id), { teamId });
    return;
  }

  if (ids.length >= 10) throw new Error("Team is full (10/10)");

  // SAFE atomic adds
  await updateDoc(teamRef, {
    memberIds: [...ids, user.id],
    members: [...(team.members || []), { userId: user.id, username }],
  });

  await updateDoc(doc(db, "users", user.id), { teamId });
}

// ------------------------------------------------------
// ✅ LEAVE TEAM (delete if last member)
// ------------------------------------------------------
export async function leaveTeam(user) {
  if (!user?.teamId) return;

  const teamId = user.teamId;
  const teamRef = doc(db, "teams", teamId);
  const snap = await getDoc(teamRef);

  if (!snap.exists()) {
    await updateDoc(doc(db, "users", user.id), { teamId: null });
    return;
  }

  const team = snap.data();
  const members = team.members || [];
  const memberIds = team.memberIds || [];

  // SAFELY remove user
  const newMembers = members.filter((m) => m.userId !== user.id);
  const newMemberIds = memberIds.filter((id) => id !== user.id);

  await updateDoc(teamRef, {
    members: newMembers,
    memberIds: newMemberIds,
  });

  // Update user profile
  await updateDoc(doc(db, "users", user.id), { teamId: null });

  // DELETE team if empty (after removal)
  if (newMemberIds.length === 0) {
    await deleteDoc(teamRef);
  }
}
