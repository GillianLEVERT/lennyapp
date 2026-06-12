// Couche d'accès Firestore typée pour l'espace parent.
// Complète les helpers d'écriture de ./firestore-schema avec les lectures
// temps réel (onSnapshot) et les mutations manquantes (update/delete + points).

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  addChild,
  addMission,
  addReward,
  resetDailyMissions,
  seedStarterKit,
  upsertParent,
} from "./firestore-schema";

export {
  addChild,
  addMission,
  addReward,
  resetDailyMissions,
  seedStarterKit,
  upsertParent,
};

export type MissionStatus = "pending" | "done" | "skipped";

export type Child = {
  id: string;
  name: string;
  avatar: string;
  totalPoints: number;
  // Série gamification : nombre de matins consécutifs où tout est validé,
  // et la date (clé YYYY-MM-DD) du dernier coffre du jour ouvert.
  streak: number;
  lastStreakDay: string | null;
  // Dernier tirage par coffre récompense (anti-répétition).
  chestHistory: ChestHistory;
  // Personnalisation : photo (dataURL) et son de validation choisi/enregistré.
  photoURL: string | null;
  soundId: string | null;
  customSound: string | null;
  // Style Skadoush : thème visuel, personnage du blob et couleur du blob.
  theme: ThemeId | null;
  character: CharacterId | null;
  blobColor: string | null;
};

// Helpers de gamification purs (sans Firebase), re-exportés ici pour que les
// composants gardent un point d'import unique.
import {
  CHEST_COSTS,
  DAILY_CHEST_BONUS,
  pickChestReward,
  tierForStreak,
  tierFromPointsCost,
  todayKey,
  yesterdayKey,
  type ChestHistory,
  type RewardTier,
} from "./gamification";
import { isCharacterId, isThemeId, type CharacterId, type ThemeId } from "./themes";

export {
  CHEST_COSTS,
  DAILY_CHEST_BONUS,
  REWARD_TIERS,
  pickChestReward,
  tierForStreak,
  tierFromPointsCost,
  todayKey,
  yesterdayKey,
} from "./gamification";
export type { ChestDraw, ChestHistory, RewardTier } from "./gamification";

export type Mission = {
  id: string;
  title: string;
  description: string;
  points: number;
  order: number;
  icon: string;
  status: MissionStatus;
};

export type Reward = {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  icon: string;
  isUnlocked: boolean;
  // Coffre dans lequel le parent range cette récompense.
  tier: RewardTier;
};

export const MAX_MISSIONS = 6;

function childrenRef(parentId: string) {
  return collection(db, "users", parentId, "children");
}

function missionsRef(parentId: string, childId: string) {
  return collection(db, "users", parentId, "children", childId, "missions");
}

function rewardsRef(parentId: string, childId: string) {
  return collection(db, "users", parentId, "children", childId, "rewards");
}

export function subscribeChildren(
  parentId: string,
  onChange: (children: Child[]) => void
): Unsubscribe {
  const childrenQuery = query(childrenRef(parentId), orderBy("createdAt", "asc"));

  return onSnapshot(childrenQuery, (snapshot) => {
    onChange(
      snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          name: typeof data.name === "string" ? data.name : "",
          avatar: typeof data.avatar === "string" ? data.avatar : "🧒",
          totalPoints:
            typeof data.totalPoints === "number" ? data.totalPoints : 0,
          streak: typeof data.streak === "number" ? data.streak : 0,
          lastStreakDay:
            typeof data.lastStreakDay === "string" ? data.lastStreakDay : null,
          chestHistory:
            data.chestHistory && typeof data.chestHistory === "object"
              ? (data.chestHistory as ChestHistory)
              : {},
          photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
          soundId: typeof data.soundId === "string" ? data.soundId : null,
          customSound:
            typeof data.customSound === "string" ? data.customSound : null,
          theme: isThemeId(data.theme) ? data.theme : null,
          character: isCharacterId(data.character) ? data.character : null,
          blobColor: typeof data.blobColor === "string" ? data.blobColor : null,
        };
      })
    );
  });
}

export function subscribeMissions(
  parentId: string,
  childId: string,
  onChange: (missions: Mission[]) => void
): Unsubscribe {
  const missionsQuery = query(
    missionsRef(parentId, childId),
    orderBy("order", "asc")
  );

  return onSnapshot(missionsQuery, (snapshot) => {
    onChange(
      snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          title: typeof data.title === "string" ? data.title : "",
          description:
            typeof data.description === "string" ? data.description : "",
          points: typeof data.points === "number" ? data.points : 0,
          order: typeof data.order === "number" ? data.order : 0,
          icon: typeof data.icon === "string" ? data.icon : "🎯",
          status:
            data.status === "done" || data.status === "skipped"
              ? data.status
              : "pending",
        };
      })
    );
  });
}

export function subscribeRewards(
  parentId: string,
  childId: string,
  onChange: (rewards: Reward[]) => void
): Unsubscribe {
  const rewardsQuery = query(
    rewardsRef(parentId, childId),
    orderBy("pointsCost", "asc")
  );

  return onSnapshot(rewardsQuery, (snapshot) => {
    onChange(
      snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          title: typeof data.title === "string" ? data.title : "",
          description:
            typeof data.description === "string" ? data.description : "",
          pointsCost:
            typeof data.pointsCost === "number" ? data.pointsCost : 0,
          icon: typeof data.icon === "string" ? data.icon : "🎁",
          isUnlocked: Boolean(data.isUnlocked),
          tier:
            data.tier === "bronze" ||
            data.tier === "silver" ||
            data.tier === "gold"
              ? data.tier
              : tierFromPointsCost(
                  typeof data.pointsCost === "number" ? data.pointsCost : 0
                ),
        };
      })
    );
  });
}

export function updateChild(
  parentId: string,
  childId: string,
  data: Partial<
    Pick<
      Child,
      | "name"
      | "avatar"
      | "photoURL"
      | "soundId"
      | "customSound"
      | "theme"
      | "character"
      | "blobColor"
    >
  >
) {
  return updateDoc(doc(db, "users", parentId, "children", childId), data);
}

export function deleteChild(parentId: string, childId: string) {
  return deleteDoc(doc(db, "users", parentId, "children", childId));
}

export function updateMission(
  parentId: string,
  childId: string,
  missionId: string,
  data: Partial<Pick<Mission, "title" | "description" | "points" | "order">>
) {
  return updateDoc(
    doc(db, "users", parentId, "children", childId, "missions", missionId),
    data
  );
}

export function deleteMission(
  parentId: string,
  childId: string,
  missionId: string
) {
  return deleteDoc(
    doc(db, "users", parentId, "children", childId, "missions", missionId)
  );
}

export function updateReward(
  parentId: string,
  childId: string,
  rewardId: string,
  data: Partial<
    Pick<Reward, "title" | "description" | "pointsCost" | "icon" | "tier">
  >
) {
  return updateDoc(
    doc(db, "users", parentId, "children", childId, "rewards", rewardId),
    data
  );
}

export function deleteReward(
  parentId: string,
  childId: string,
  rewardId: string
) {
  return deleteDoc(
    doc(db, "users", parentId, "children", childId, "rewards", rewardId)
  );
}

// Change le statut d'une mission et ajuste les points de l'enfant de façon
// atomique (idempotent : pending→done crédite une fois, done→pending débite).
export async function setMissionStatus(
  parentId: string,
  childId: string,
  missionId: string,
  status: MissionStatus
): Promise<void> {
  const missionDoc = doc(
    db,
    "users",
    parentId,
    "children",
    childId,
    "missions",
    missionId
  );
  const childDoc = doc(db, "users", parentId, "children", childId);

  await runTransaction(db, async (transaction) => {
    const missionSnapshot = await transaction.get(missionDoc);

    if (!missionSnapshot.exists()) {
      return;
    }

    // Toutes les lectures avant toute écriture (contrainte des transactions).
    const childSnapshot = await transaction.get(childDoc);
    const missionData = missionSnapshot.data();
    const previousStatus = missionData.status as MissionStatus;
    const points =
      typeof missionData.points === "number" ? missionData.points : 0;

    let pointsDelta = 0;
    if (previousStatus !== "done" && status === "done") {
      pointsDelta = points;
    } else if (previousStatus === "done" && status !== "done") {
      pointsDelta = -points;
    }

    transaction.update(missionDoc, { status });

    if (pointsDelta !== 0 && childSnapshot.exists()) {
      const current = childSnapshot.data().totalPoints;
      const total = (typeof current === "number" ? current : 0) + pointsDelta;
      transaction.update(childDoc, { totalPoints: Math.max(0, total) });
    }
  });
}

// Ouvre le coffre du jour : incrémente la série une seule fois par jour
// et crédite les points bonus du palier (ce qui alimente les coffres
// récompenses). Renvoie série + palier + bonus, ou null si déjà ouvert.
export async function claimDailyChest(
  parentId: string,
  childId: string
): Promise<{ streak: number; tier: RewardTier; bonus: number } | null> {
  const childDoc = doc(db, "users", parentId, "children", childId);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(childDoc);
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    const today = todayKey();
    const last =
      typeof data.lastStreakDay === "string" ? data.lastStreakDay : null;

    // Déjà ouvert aujourd'hui : pas de double comptage.
    if (last === today) {
      return null;
    }

    const previousStreak = typeof data.streak === "number" ? data.streak : 0;
    // Série continue si le dernier coffre datait d'hier, sinon on repart à 1.
    const newStreak = last === yesterdayKey() ? previousStreak + 1 : 1;
    const tier = tierForStreak(newStreak);
    const bonus = DAILY_CHEST_BONUS[tier];
    const points = typeof data.totalPoints === "number" ? data.totalPoints : 0;

    transaction.update(childDoc, {
      streak: newStreak,
      lastStreakDay: today,
      totalPoints: points + bonus,
    });

    return { streak: newStreak, tier, bonus };
  });
}

// Ouvre un coffre récompense : dépense le coût en points et tire une
// récompense aléatoire (anti-répétition) dans le pool fourni. Atomique.
// Renvoie l'id de la récompense gagnée, ou null si points insuffisants / pool vide.
export async function openChest(
  parentId: string,
  childId: string,
  tier: RewardTier,
  poolIds: string[]
): Promise<{ rewardId: string } | null> {
  const cost = CHEST_COSTS[tier];
  const childDoc = doc(db, "users", parentId, "children", childId);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(childDoc);
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    const points = typeof data.totalPoints === "number" ? data.totalPoints : 0;
    if (points < cost || poolIds.length === 0) {
      return null;
    }

    const history: ChestHistory =
      data.chestHistory && typeof data.chestHistory === "object"
        ? (data.chestHistory as ChestHistory)
        : {};

    const draw = pickChestReward(poolIds, history[tier]);
    if (!draw) {
      return null;
    }

    transaction.update(childDoc, {
      totalPoints: Math.max(0, points - cost),
      [`chestHistory.${tier}`]: { lastId: draw.rewardId, repeats: draw.repeats },
    });

    return { rewardId: draw.rewardId };
  });
}

export function claimReward(
  parentId: string,
  childId: string,
  rewardId: string
) {
  return updateDoc(
    doc(db, "users", parentId, "children", childId, "rewards", rewardId),
    { isUnlocked: true, unlockedAt: serverTimestamp() }
  );
}
