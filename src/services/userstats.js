import { doc, increment, serverTimestamp, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getBadge } from "@/utils/badges";   // you already created this

// Call applyMatchResult({ uid, didWin, didForfeit })
export async function applyMatchResult({
  userId,
  result,                       // 'win' | 'loss' | 'forfeit'
  winXP = 25,
  lossXP = 10,
  forfeitPenalty = 5,
}) {

  const userRef = doc(db, "users", userId);

  // XP logic
  let xpDelta = 0;
  if (result === "win") xpDelta = winXP;
  else if (result === "loss") xpDelta = lossXP;
  else xpDelta = -Math.abs(forfeitPenalty);

  // Log the match
  await addDoc(collection(db, "users", userId, "matches"), {
    result,
    xpGained: xpDelta,
    time: serverTimestamp()
  });

  // Ensure XP never goes negative
  const uSnap = await userRef.get?.() || null;

  let currentXP = 0;
  if (uSnap && uSnap.exists()) {
    const data = uSnap.data();
    currentXP = data.xp || 0;
  }

  const newXP = Math.max(0, currentXP + xpDelta);
  const newLevel = 1 + Math.floor(newXP / 100);

  // Badge
  const badge = getBadge(newXP);

  const updates = {
    lastMatchAt: serverTimestamp(),
    xp: newXP,
    level: newLevel,
    badge: badge.tier,
    totalPoints: increment(xpDelta),     // optional: for ranking
  };

  // wins/losses
  if (result === "win") {
    updates.wins = increment(1);
  } else {
    updates.losses = increment(1);
  }

  // apply updates
  await updateDoc(userRef, updates);

  return { newXP, newLevel, badge };
}
