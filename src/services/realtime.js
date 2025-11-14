// src/services/realtime.js
import {
  doc, collection, query, orderBy, limit, onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";


/** User profile listener */
export function listenToUser(userId, cb) {
  const ref = doc(db, "users", userId);
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

/** Leaderboard (top N by totalPoints) */
export function listenToLeaderboard(cb, top = 100) {
  const q = query(collection(db, "users"), orderBy("totalPoints", "desc"), limit(top));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/** Team doc + members (two listeners; returns a combined unsubscribe) */
export function listenToTeam(teamId, cbTeam, cbMembers) {
  const teamRef = doc(db, "teams", teamId);
  const membersRef = collection(db, "teams", teamId, "members");

  const offTeam = onSnapshot(teamRef, (snap) => {
    cbTeam(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });

  const offMembers = onSnapshot(membersRef, (snap) => {
    cbMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });

  return () => { offTeam(); offMembers(); };
}

/** User match history (latest 20) */
export function listenToUserMatches(userId, cb, take = 20) {
  const q = query(
    collection(db, "users", userId, "matches"),
    orderBy("endedAt", "desc"),
    limit(take)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
