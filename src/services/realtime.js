// src/services/realtime.js
import {
  doc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

/** User profile listener */
export function listenToUser(userId, cb) {
  const ref = doc(db, "users", userId);

  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

/** Leaderboard (top N by XP) */
export function listenToLeaderboard(cb, top = 100) {
  const q = query(
    collection(db, "users"),
    orderBy("xp", "desc"),       // FIXED: match Zustand & backend
    limit(top)
  );

  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d, index) => ({
        id: d.id,
        rank: index + 1,
        ...d.data(),
      }))
    );
  });
}

/** Team listener (team + embedded members inside doc) */
export function listenToTeam(teamId, cb) {
  const teamRef = doc(db, "teams", teamId);

  return onSnapshot(teamRef, (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }

    const team = { id: snap.id, ...snap.data() };
    cb(team);
  });
}

/** User match history */
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
