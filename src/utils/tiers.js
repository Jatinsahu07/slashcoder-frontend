export function getTier(points = 0){
  if(points >= 1200) return { tier:"Mythic", emoji:"🔥", color:"#ff3b3b" };
  if(points >= 800)  return { tier:"Diamond", emoji:"💎", color:"#9df3ff" };
  if(points >= 500)  return { tier:"Platinum", emoji:"🔷", color:"#6fd3ff" };
  if(points >= 300)  return { tier:"Gold", emoji:"🥇", color:"#f7c948" };
  if(points >= 150)  return { tier:"Silver", emoji:"🥈", color:"#c9ced6" };
  if(points >= 50)   return { tier:"Bronze", emoji:"🥉", color:"#c08752" };
  return { tier:"Rookie", emoji:"🎮", color:"#bbb" };
}
export function tierProgress(points=0){
  const bands=[0,50,150,300,500,800,1200]; // upper open
  let i=0; while(i<bands.length && points>=bands[i]) i++;
  const min=bands[Math.max(0,i-1)], max=bands[i] ?? (points+100);
  const span=Math.max(1,(max-min)); const progress=Math.min(100, Math.round(((points-min)/span)*100));
  return { ...getTier(points), progress };
}
