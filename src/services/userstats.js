import { doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Call with { userId, result: 'win'|'loss'|'forfeit', baseWin=10, lossBonus=2, forfeitPenalty=5 }
export async function applyMatchResult({ userId, result, baseWin = 10, lossBonus = 2, forfeitPenalty = 5 }) {
  const ref = doc(db, 'users', userId);
  const updates = { matchesPlayed: increment(1), lastMatchAt: serverTimestamp() };

  if (result === 'win') {
    updates.totalWins = increment(1);
    updates.totalPoints = increment(baseWin);
  } else if (result === 'loss') {
    updates.totalLosses = increment(1);
    if (lossBonus > 0) updates.totalPoints = increment(lossBonus);
  } else if (result === 'forfeit') {
    updates.totalLosses = increment(1);
    updates.totalPoints = increment(-Math.abs(forfeitPenalty));
  }

  await updateDoc(ref, updates);
}
