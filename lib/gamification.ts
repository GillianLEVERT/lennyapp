// Logique de gamification pure (sans dépendance Firebase) : paliers de coffres,
// série de matins, tirage anti-répétition. Testable en isolation.

export type RewardTier = "bronze" | "silver" | "gold";

// Paliers des coffres bonus de série :
// bronze chaque matin, argent tous les 2, doré tous les 7.
export const REWARD_TIERS = [
  { tier: "bronze", chestName: "Coffre bronze", label: "Chaque matin", threshold: 1, accent: "#C9783F" },
  { tier: "silver", chestName: "Coffre argent", label: "Tous les 2", threshold: 2, accent: "#8FA4CC" },
  { tier: "gold", chestName: "Coffre doré", label: "Tous les 7", threshold: 7, accent: "#E2A90F" },
] as const;

export function tierForStreak(streak: number): RewardTier {
  if (streak > 0 && streak % 7 === 0) return "gold";
  if (streak > 0 && streak % 2 === 0) return "silver";
  return "bronze";
}

// Coût d'ouverture d'un coffre récompense, par palier (points dépensés).
export const CHEST_COSTS: Record<RewardTier, number> = {
  bronze: 20,
  silver: 50,
  gold: 80,
};

// Points bonus gagnés en ouvrant le coffre du jour, par palier.
// C'est ce qui rend la série utile : chaque matin réussi alimente les
// points qui servent ensuite à ouvrir les coffres récompenses.
export const DAILY_CHEST_BONUS: Record<RewardTier, number> = {
  bronze: 10,
  silver: 20,
  gold: 40,
};

// Palier déduit d'un coût en points : <40 bronze, 40-60 argent, >60 or.
// Sert de repli pour les récompenses sans tier (presets / anciennes données).
export function tierFromPointsCost(pointsCost: number): RewardTier {
  if (pointsCost > 60) return "gold";
  if (pointsCost >= 40) return "silver";
  return "bronze";
}

// Historique de tirage par palier, pour l'anti-répétition (jamais 3× de suite).
export type ChestDraw = { lastId: string; repeats: number };
export type ChestHistory = Partial<Record<RewardTier, ChestDraw>>;

// Tirage aléatoire d'une récompense dans un pool, avec garde anti-répétition :
// si la dernière a déjà été tirée 2 fois d'affilée, on l'exclut (sauf pool d'un seul).
// Fonction pure pour rester testable et réutilisable dans la transaction.
export function pickChestReward(
  poolIds: string[],
  history: ChestDraw | undefined,
  random: () => number = Math.random
): { rewardId: string; repeats: number } | null {
  if (poolIds.length === 0) {
    return null;
  }

  let eligible = poolIds;
  if (history && history.lastId && history.repeats >= 2) {
    const filtered = poolIds.filter((id) => id !== history.lastId);
    if (filtered.length > 0) {
      eligible = filtered;
    }
  }

  const rewardId = eligible[Math.floor(random() * eligible.length)];
  const repeats =
    history && history.lastId === rewardId ? history.repeats + 1 : 1;

  return { rewardId, repeats };
}

function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(now = new Date()): string {
  return dayKey(now);
}

export function yesterdayKey(now = new Date()): string {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return dayKey(yesterday);
}
