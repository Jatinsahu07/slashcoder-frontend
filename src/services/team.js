import { db } from "../firebase";
import {
  addDoc, arrayUnion, arrayRemove, collection, deleteDoc, doc,
  getDocs, query, updateDoc, where, serverTimestamp
} from "firebase/firestore";

// Generate 6-char alphanumeric code
export function generateTeamCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Create a new team
export async function createTeam(user, teamName) {
  const code = generateTeamCode();
  const teamRef = await addDoc(collection(db, "teams"), {
    name: teamName,
    code,
    totalPoints: 0,
    createdAt: serverTimestamp(),
    members: [{ userId: user.id, username: user.username }],
  });

  // update user profile teamId
  await updateDoc(doc(db, "users", user.id), { teamId: teamRef.id });
  return teamRef.id;
}

// Join an existing team
export async function joinTeam(user, teamId) {
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDocs(query(collection(db, "teams"), where("__name__", "==", teamId)));
  if (teamSnap.empty) throw new Error("Team not found");

  const data = teamSnap.docs[0].data();
  if (data.members.length >= 10) throw new Error("Team is full");

  await updateDoc(teamRef, { members: arrayUnion({ userId: user.id, username: user.username }) });
  await updateDoc(doc(db, "users", user.id), { teamId });
}

// Leave team — delete if last member
export async function leaveTeam(user) {
  if (!user.teamId) return;

  const teamRef = doc(db, "teams", user.teamId);
  const teamSnap = await getDocs(query(collection(db, "teams"), where("__name__", "==", user.teamId)));
  const teamData = teamSnap.docs[0].data();

  // remove from members
  await updateDoc(teamRef, { members: arrayRemove({ userId: user.id, username: user.username }) });
  await updateDoc(doc(db, "users", user.id), { teamId: null });

  // if last one, delete team
  if (teamData.members.length === 1) await deleteDoc(teamRef);
}
