// Bibliothèque de missions et récompenses prêtes à l'emploi, proposées au
// parent pendant l'onboarding (ajout en un tap). L'ajout de custom reste possible.

export type MissionPreset = {
  title: string;
  icon: string;
  points: number;
};

export type RewardPreset = {
  title: string;
  icon: string;
  pointsCost: number;
};

export const MISSION_PRESETS: MissionPreset[] = [
  { title: "Se laver les dents", icon: "🪥", points: 10 },
  { title: "Boire de l'eau", icon: "💧", points: 10 },
  { title: "S'habiller tout seul", icon: "👕", points: 10 },
  { title: "Prendre le petit-déjeuner", icon: "🥣", points: 10 },
  { title: "Faire du sport / bouger", icon: "🤸", points: 15 },
  { title: "Faire son lit", icon: "🛏️", points: 10 },
  { title: "Ranger sa chambre", icon: "🧸", points: 15 },
  { title: "Se coiffer", icon: "💇", points: 5 },
  { title: "Mettre ses chaussures", icon: "👟", points: 5 },
  { title: "Préparer son cartable", icon: "🎒", points: 10 },
];

export const REWARD_PRESETS: RewardPreset[] = [
  { title: "Une histoire en plus", icon: "📚", pointsCost: 20 },
  { title: "Choisir le dessert", icon: "🍦", pointsCost: 30 },
  { title: "Match de foot", icon: "⚽", pointsCost: 40 },
  { title: "Temps de jeu vidéo", icon: "🎮", pointsCost: 50 },
  { title: "Choisir le repas", icon: "🍕", pointsCost: 60 },
  { title: "Film en famille", icon: "🎬", pointsCost: 80 },
  { title: "Sortie au parc", icon: "🏞️", pointsCost: 100 },
  { title: "Petit cadeau surprise", icon: "🎁", pointsCost: 150 },
];
