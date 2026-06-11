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
 * ├── pointsCost: number     (legacy — coût indicatif, l'ouverture coûte CHEST_COSTS[tier])
 * ├── tier: "bronze" | "silver" | "gold"  (coffre choisi par le parent)
 * ├── icon: string           (emoji ou URL)
 * ├── isUnlocked: boolean
 * ├── unlockedAt: timestamp | null
 * ├── createdAt: timestamp
 *
 * Champs enfant additionnels (gamification) :
 * ├── streak: number              (matins consécutifs tout-validé)
 * ├── lastStreakDay: string|null  (clé YYYY-MM-DD du dernier coffre du jour)
 * ├── chestHistory: { [tier]: { lastId, repeats } }  (anti-répétition des tirages)
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

// ─── Ajouter une récompense (rangée dans un coffre bronze/silver/gold) ───
export async function addReward(parentId, childId, { title, description = "", pointsCost = 0, icon = "🎁", tier = "bronze" }) {
  const ref = collection(db, "users", parentId, "children", childId, "rewards");
  return addDoc(ref, {
    title,
    description,
    pointsCost,
    icon,
    tier,
    isUnlocked: false,
    unlockedAt: null,
    createdAt: serverTimestamp(),
  });
}

// ─── Kit de démarrage : missions + récompenses par défaut à la création ───
// Évite l'écran vide : l'app enfant fonctionne dès le premier profil créé.
// Le parent peut ensuite supprimer, suggérer ou créer du sur-mesure.
const DEFAULT_MISSIONS = [
  { title: "Se laver les dents", icon: "🪥", points: 10 },
  { title: "Boire de l'eau", icon: "💧", points: 10 },
  { title: "S'habiller tout seul", icon: "👕", points: 10 },
  { title: "Prendre le petit-déjeuner", icon: "🥣", points: 10 },
];

const DEFAULT_REWARDS = [
  { title: "Une histoire en plus", icon: "📚", tier: "bronze" },
  { title: "Temps de jeu vidéo", icon: "🎮", tier: "silver" },
];

export async function seedStarterKit(parentId, childId) {
  // allSettled : un échec ponctuel n'empêche pas les autres écritures.
  const results = await Promise.allSettled([
    ...DEFAULT_MISSIONS.map((mission, index) =>
      addMission(parentId, childId, { ...mission, order: index + 1 })
    ),
    ...DEFAULT_REWARDS.map((reward) => addReward(parentId, childId, reward)),
  ]);

  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length > 0) {
    console.error("seedStarterKit : écritures échouées", failed.map((r) => r.reason));
  }
}

// ─── Reset quotidien des missions (à appeler chaque matin) ───
export async function resetDailyMissions(parentId, childId, missions) {
  const updates = missions.map((mission) => {
    const ref = doc(db, "users", parentId, "children", childId, "missions", mission.id);
    return setDoc(ref, { status: "pending", lastResetAt: serverTimestamp() }, { merge: true });
  });
  return Promise.all(updates);
}
