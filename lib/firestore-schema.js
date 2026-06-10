/**
 * STRUCTURE FIRESTORE — Skadoush
 * ================================
 *
 * Collection: users/{parentId}
 * ├── uid: string            (= Firebase Auth UID)
 * ├── email: string
 * ├── displayName: string
 * ├── photoURL: string
 * ├── createdAt: timestamp
 *
 * Sous-collection: users/{parentId}/children/{childId}
 * ├── name: string           (prénom de l'enfant)
 * ├── avatar: string         (emoji ou URL)
 * ├── totalPoints: number    (cumul des récompenses obtenues)
 * ├── createdAt: timestamp
 *
 * Sous-collection: users/{parentId}/children/{childId}/missions/{missionId}
 * ├── title: string
 * ├── description: string
 * ├── points: number         (points gagnés si complétée)
 * ├── order: number          (1 à 6 — ordre d'affichage le matin)
 * ├── status: "pending" | "done" | "skipped"
 * ├── resetDaily: boolean    (toujours true)
 * ├── lastResetAt: timestamp (date du dernier reset)
 * ├── createdAt: timestamp
 *
 * Sous-collection: users/{parentId}/children/{childId}/rewards/{rewardId}
 * ├── title: string
 * ├── description: string
 * ├── pointsCost: number     (points nécessaires pour débloquer)
 * ├── icon: string           (emoji ou URL)
 * ├── isUnlocked: boolean
 * ├── unlockedAt: timestamp | null
 * ├── createdAt: timestamp
 */

import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// ─── Créer ou mettre à jour le profil parent après connexion ───
export async function upsertParent(user) {
  const ref = doc(db, "users", user.uid);
  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName ?? "",
    photoURL: user.photoURL ?? "",
    createdAt: serverTimestamp(),
  }, { merge: true });
}

// ─── Ajouter un enfant ───
export async function addChild(parentId, { name, avatar = "🧒" }) {
  const ref = collection(db, "users", parentId, "children");
  return addDoc(ref, {
    name,
    avatar,
    totalPoints: 0,
    createdAt: serverTimestamp(),
  });
}

// ─── Ajouter une mission (max 6) ───
export async function addMission(parentId, childId, { title, description = "", points = 10, order = 1, icon = "🎯" }) {
  const ref = collection(db, "users", parentId, "children", childId, "missions");
  return addDoc(ref, {
    title,
    description,
    points,
    order,
    icon,
    status: "pending",
    resetDaily: true,
    lastResetAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

// ─── Ajouter une récompense ───
export async function addReward(parentId, childId, { title, description = "", pointsCost, icon = "🎁" }) {
  const ref = collection(db, "users", parentId, "children", childId, "rewards");
  return addDoc(ref, {
    title,
    description,
    pointsCost,
    icon,
    isUnlocked: false,
    unlockedAt: null,
    createdAt: serverTimestamp(),
  });
}

// ─── Reset quotidien des missions (à appeler chaque matin) ───
export async function resetDailyMissions(parentId, childId, missions) {
  const updates = missions.map((mission) => {
    const ref = doc(db, "users", parentId, "children", childId, "missions", mission.id);
    return setDoc(ref, { status: "pending", lastResetAt: serverTimestamp() }, { merge: true });
  });
  return Promise.all(updates);
}
