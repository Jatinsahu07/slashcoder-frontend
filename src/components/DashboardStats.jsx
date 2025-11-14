import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getBadgeProgress } from '@/utils/ranks';

export default function DashboardStats({ userId }) {
  const [loading, setLoading] = useState(true);
  const [you, setYou] = useState(null);
  const [rank, setRank] = useState(null);
  const [totalUsers, setTotalUsers] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // 1) Fetch your user doc
      const youRef = doc(db, 'users', userId);
      const snap = await getDoc(youRef);
      if (!snap.exists()) { setLoading(false); return; }
      const data = { id: snap.id, ...snap.data() };
      setYou(data);

      // 2) Count how many have strictly more points (your rank = countGreater + 1)
      const greaterQ = query(collection(db, 'users'), where('totalPoints', '>', data.totalPoints));
      const greaterCount = await getCountFromServer(greaterQ);
      const r = (greaterCount.data().count || 0) + 1;
      setRank(r);

      // 3) Total users (optional, looks nice)
      const allCount = await getCountFromServer(collection(db, 'users'));
      setTotalUsers(allCount.data().count || r);

      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <div className="p-4 rounded-xl bg-neutral-900/40">Loading your stats…</div>;
  if (!you) return null;

  const { tier, emoji, progress } = getBadgeProgress(you.totalPoints || 0);

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-400">Your Rank</div>
          <div className="text-3xl font-semibold text-white">
            #{rank}{totalUsers ? <span className="text-neutral-400 text-base"> / {totalUsers}</span> : null}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-neutral-400">Points</div>
          <div className="text-3xl font-semibold text-white">{you.totalPoints ?? 0}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-neutral-400">Badge</div>
        <div className="flex items-center gap-2 text-white text-lg">
          <span>{emoji}</span>
          <span className="font-medium">{tier}</span>
        </div>
        <div className="mt-2 h-2 w-full bg-neutral-700 rounded-full overflow-hidden">
          <div className="h-full bg-white/80" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1 text-xs text-neutral-400">{progress}% to next tier</div>
      </div>

      <div className="mt-5">
        <a href="/leaderboard" className="text-sm text-sky-400 hover:underline">View Full Leaderboard →</a>
      </div>
    </div>
  );
}
