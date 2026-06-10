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
  upsertParent,
} from "./firestore-schema";

export { addChild, addMission, addReward, resetDailyMissions, upsertParent };

export type MissionStatus = "pending" | "done" | "skipped";

export type Child = {
  id: string;
  name: string;
  avatar: string;
  totalPoints: number;
};

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
        };
      })
    );
  });
}

export function updateChild(
  parentId: string,
  childId: string,
  data: Partial<Pick<Child, "name" | "avatar">>
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
  data: Partial<Pick<Reward, "title" | "description" | "pointsCost" | "icon">>
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
