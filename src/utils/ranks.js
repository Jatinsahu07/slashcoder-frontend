export function getBadge(points = 0) {
  if (points >= 600) return { tier: 'Platinum', emoji: '💎', min: 600, max: 1000, color: '#00F5FF' };
  if (points >= 300) return { tier: 'Gold', emoji: '🥇', min: 300, max: 600, color: '#FFD54A' };
  if (points >= 150) return { tier: 'Silver', emoji: '🥈', min: 150, max: 300, color: '#C9CED6' };
  if (points >= 50)  return { tier: 'Bronze', emoji: '🥉', min: 50,  max: 150, color: '#C08752' };
  return { tier: 'Rookie', emoji: '🟦', min: 0, max: 50, color: '#7AA0FF' };
}

export function getBadgeProgress(points = 0) {
  const b = getBadge(points);
  const span = Math.max(1, b.max - b.min);
  const progress = Math.min(100, Math.round(((points - b.min) / span) * 100));
  return { ...b, progress };
}
