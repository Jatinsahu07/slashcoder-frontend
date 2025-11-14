// src/services/team.js
import { db } from "../firebase";
import {
  addDoc, arrayUnion, arrayRemove,
  collection, deleteDoc, doc,
  getDoc, updateDoc, serverTimestamp
} from "firebase/firestore";

// Generate 6-char code
export function generateTeamCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// ------------------------------------------------------
// 🚀 CREATE TEAM
// ------------------------------------------------------
export async function createTeam(user, teamName) {
  if (!user?.id) throw new Error("Invalid user");

  const code = generateTeamCode();
  const username = user.username || "Player";

  const ref = await addDoc(collection(db, "teams"), {
    name: teamName,
    code,
    createdAt: serverTimestamp(),
    totalPoints: 0,
    members: [{ userId: user.id, username }],
    memberIds: [user.id],
  });

  await updateDoc(doc(db, "users", user.id), { teamId: ref.id });

  return ref.id;
}

// ------------------------------------------------------
// 🚀 JOIN TEAM
// ------------------------------------------------------
export async function joinTeam(user, teamId) {
  if (!user?.id) throw new Error("Invalid user");

  const username = user.username || "Player";
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) throw new Error("Team not found");

  const team = teamSnap.data();
  const ids = team.memberIds || [];

  if (ids.includes(user.id)) {
    // Already inside the team → just update user
    await updateDoc(doc(db, "users", user.id), { teamId });
    return;
  }

  if (ids.length >= 10) throw new Error("Team is full (10/10)");

  await updateDoc(teamRef, {
    members: arrayUnion({ userId: user.id, username }),
    memberIds: arrayUnion(user.id),
  });

  await updateDoc(doc(db, "users", user.id), { teamId });
}

// ------------------------------------------------------
// 🚀 LEAVE TEAM (delete if last member)
// ------------------------------------------------------
export async function leaveTeam(user) {
  if (!user?.teamId) return;

  const teamId = user.teamId;
  const username = user.username || "Player";

  const teamRef = doc(db, "teams", teamId);
  const snap = await getDoc(teamRef);

  if (!snap.exists()) {
    await updateDoc(doc(db, "users", user.id), { teamId: null });
    return;
  }

  const team = snap.data();
  const memberIds = team.memberIds || [];
  const members = team.members || [];

  // Remove
  await updateDoc(teamRef, {
    memberIds: memberIds.filter((id) => id !== user.id),
    members: members.filter((m) => m.userId !== user.id),
  });

  await updateDoc(doc(db, "users", user.id), { teamId: null });

  // Delete team if empty
  if (memberIds.length === 1) {
    await deleteDoc(teamRef);
  }
}
