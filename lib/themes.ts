// Skadoush — 3 directions visuelles (Jelly / Arcade / Cosmic).
// Chaque thème porte TOUS les tokens : couleurs, typo, formes, ambiance,
// couleurs de la scène 3D. Porté depuis le prototype Claude Design
// (valeurs conservées à l'identique).

export type ThemeId = "jelly" | "arcade" | "cosmic";
export type CharacterId = "pirate" | "chevalier" | "princesse" | "dragon";
export type TextureId = "bubbles" | "grid" | "stars";

export interface SceneTokens {
  bgTop: string;
  bgBottom: string;
  ground: string;
  groundEdge: string;
  fog: string;
  blob: string;
  blobLit: string;
  cheek: string;
  chestBody: string;
  chestLid: string;
  chestBand: string;
  chestMetal: string;
  gem: string;
  gemGlow: string;
  light: string;
  particles: readonly string[];
  sparkle: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  emoji: string;
  tagline: string;
  // ambiance / fond
  bg: string;
  bgSolid: string;
  texture: TextureId;
  // surfaces
  surface: string;
  surfaceAlt: string;
  glass: boolean;
  // texte
  text: string;
  textSoft: string;
  textOnAccent: string;
  // accents
  primary: string;
  primaryGrad: readonly [string, string];
  accents: readonly [string, string, string, string];
  heroGrad: readonly [string, string];
  // type (références CSS var posées par next/font)
  fontTitle: string;
  fontBody: string;
  titleUpper: boolean;
  titleWeight: number;
  // formes
  radius: number;
  stroke: number;
  strokeColor: string;
  shadow: string;
  shadowSoft: string;
  glossy: boolean;
  // scène 3D + mascotte
  scene: SceneTokens;
}

export const THEMES: Record<ThemeId, Theme> = {
  /* ─────────────────────────  JELLY  ───────────────────────── */
  jelly: {
    id: "jelly",
    name: "Jelly",
    emoji: "🍬",
    tagline: "Pastel gourmand & rebondi",
    bg: "linear-gradient(165deg,#fff6ef 0%,#ffe9f1 55%,#e9f3ff 100%)",
    bgSolid: "#fff3ec",
    texture: "bubbles",
    surface: "#ffffff",
    surfaceAlt: "#fff3f6",
    glass: false,
    text: "#4b3a55",
    textSoft: "#9a8aa3",
    textOnAccent: "#ffffff",
    primary: "#ff5d8f",
    primaryGrad: ["#ff9bbb", "#ff4f86"],
    accents: ["#ff5d8f", "#5ec5ff", "#56d6a0", "#ffce4d"],
    heroGrad: ["#ff8fb1", "#5ec5ff"],
    fontTitle: "var(--font-baloo)",
    fontBody: "var(--font-nunito)",
    titleUpper: false,
    titleWeight: 800,
    radius: 26,
    stroke: 0,
    strokeColor: "transparent",
    shadow: "0 18px 40px -18px rgba(255,93,143,.45)",
    shadowSoft: "0 8px 22px -12px rgba(120,80,140,.25)",
    glossy: true,
    scene: {
      bgTop: "#fff1f6",
      bgBottom: "#ffe3ec",
      ground: "#ffd9e4",
      groundEdge: "#ffc2d6",
      fog: "#ffe3ec",
      blob: "#ff7aa8",
      blobLit: "#ffb3cd",
      cheek: "#ff5d8f",
      chestBody: "#ffb27a",
      chestLid: "#ff9b5e",
      chestBand: "#ffd86b",
      chestMetal: "#ffe7a3",
      gem: "#ff5d8f",
      gemGlow: "#ff9bbb",
      light: "#fff4e8",
      particles: ["#ff5d8f", "#5ec5ff", "#56d6a0", "#ffce4d", "#ffffff"],
      sparkle: "#ffffff",
    },
  },

  /* ─────────────────────────  ARCADE  ───────────────────────── */
  arcade: {
    id: "arcade",
    name: "Arcade",
    emoji: "🕹️",
    tagline: "Néon, contraste & énergie",
    bg: "radial-gradient(120% 90% at 28% -10%,#3a2fae 0%,#211a63 45%,#100f33 100%)",
    bgSolid: "#171545",
    texture: "grid",
    surface: "#221c5e",
    surfaceAlt: "#2c2470",
    glass: false,
    text: "#ffffff",
    textSoft: "#a7a3e0",
    textOnAccent: "#15123f",
    primary: "#ff3da6",
    primaryGrad: ["#ff6ec7", "#ff2e95"],
    accents: ["#ff3da6", "#29e0ff", "#b6ff3d", "#ffd23d"],
    heroGrad: ["#ff3da6", "#7a3dff"],
    fontTitle: "var(--font-luckiest)",
    fontBody: "var(--font-baloo)",
    titleUpper: true,
    titleWeight: 400,
    radius: 16,
    stroke: 3,
    strokeColor: "#15123f",
    shadow: "6px 6px 0 rgba(13,11,46,.55)",
    shadowSoft: "4px 4px 0 rgba(13,11,46,.4)",
    glossy: false,
    scene: {
      bgTop: "#1b1654",
      bgBottom: "#0c0a2c",
      ground: "#241d6b",
      groundEdge: "#29e0ff",
      fog: "#100e36",
      blob: "#29e0ff",
      blobLit: "#9cf3ff",
      cheek: "#ff3da6",
      chestBody: "#3a2fae",
      chestLid: "#5b46e0",
      chestBand: "#ffd23d",
      chestMetal: "#b6ff3d",
      gem: "#ff3da6",
      gemGlow: "#ff6ec7",
      light: "#bfe0ff",
      particles: ["#ff3da6", "#29e0ff", "#b6ff3d", "#ffd23d", "#ffffff"],
      sparkle: "#b6ff3d",
    },
  },

  /* ─────────────────────────  COSMIC  ───────────────────────── */
  cosmic: {
    id: "cosmic",
    name: "Cosmic",
    emoji: "🌌",
    tagline: "Nuit magique & lueurs douces",
    bg: "linear-gradient(180deg,#221a5e 0%,#33256f 45%,#140f3a 100%)",
    bgSolid: "#1c1550",
    texture: "stars",
    surface: "rgba(255,255,255,0.08)",
    surfaceAlt: "rgba(255,255,255,0.13)",
    glass: true,
    text: "#f3efff",
    textSoft: "#b9aee8",
    textOnAccent: "#0f0a30",
    primary: "#3ad6c5",
    primaryGrad: ["#7af0e0", "#34c9b6"],
    accents: ["#3ad6c5", "#a78bfa", "#f472b6", "#fcd34d"],
    heroGrad: ["#3ad6c5", "#a78bfa"],
    fontTitle: "var(--font-fredoka)",
    fontBody: "var(--font-quicksand)",
    titleUpper: false,
    titleWeight: 600,
    radius: 24,
    stroke: 0,
    strokeColor: "rgba(255,255,255,.18)",
    shadow: "0 22px 60px -24px rgba(58,214,197,.5)",
    shadowSoft: "0 12px 34px -16px rgba(0,0,0,.45)",
    glossy: false,
    scene: {
      bgTop: "#2a1f66",
      bgBottom: "#0f0a30",
      ground: "#241a5c",
      groundEdge: "#3ad6c5",
      fog: "#160f42",
      blob: "#7af0e0",
      blobLit: "#c7fff6",
      cheek: "#f472b6",
      chestBody: "#3a2d7a",
      chestLid: "#4c3a9c",
      chestBand: "#fcd34d",
      chestMetal: "#a78bfa",
      gem: "#3ad6c5",
      gemGlow: "#7af0e0",
      light: "#d9cfff",
      particles: ["#3ad6c5", "#a78bfa", "#f472b6", "#fcd34d", "#ffffff"],
      sparkle: "#fcd34d",
    },
  },
};

export const THEME_ORDER: readonly ThemeId[] = ["jelly", "arcade", "cosmic"];

export const BLOB_COLOR_PRESETS: readonly string[] = [
  "#8b5cf6",
  "#ff8a3d",
  "#ef4444",
  "#84cc16",
];

// Personnages : changent le blob (chapeau + accessoire) ET la déco du coffre.
export interface Character {
  id: CharacterId;
  name: string;
  emoji: string;
  hatColor: string;
  trim: string;
}

export const CHARACTERS: Record<CharacterId, Character> = {
  pirate: { id: "pirate", name: "Pirate", emoji: "🏴‍☠️", hatColor: "#272233", trim: "#ffd23d" },
  chevalier: { id: "chevalier", name: "Chevalier", emoji: "🛡️", hatColor: "#aeb6c4", trim: "#7c869a" },
  princesse: { id: "princesse", name: "Princesse", emoji: "👑", hatColor: "#ffd23d", trim: "#ff6ec7" },
  dragon: { id: "dragon", name: "Dragon", emoji: "🐉", hatColor: "#3f7f42", trim: "#ff8a3d" },
};

export const CHARACTER_ORDER: readonly CharacterId[] = [
  "pirate",
  "chevalier",
  "princesse",
  "dragon",
];

// Couleurs du coffre 3D selon le palier choisi (bronze / argent / doré).
// Remplacent les couleurs de coffre du thème quand l'enfant ouvre un
// coffre récompense plutôt que le coffre du jour.
export type ChestTierColors = Pick<
  SceneTokens,
  "chestBody" | "chestLid" | "chestBand" | "chestMetal"
>;

export const CHEST_TIER_COLORS: Record<"bronze" | "silver" | "gold", ChestTierColors> = {
  bronze: {
    chestBody: "#c9783f",
    chestLid: "#a85f2e",
    chestBand: "#7b3d20",
    chestMetal: "#ffd27a",
  },
  silver: {
    chestBody: "#a9b6cc",
    chestLid: "#8fa4cc",
    chestBand: "#52678f",
    chestMetal: "#f3f7ff",
  },
  gold: {
    chestBody: "#f0b429",
    chestLid: "#d89a00",
    chestBand: "#a87400",
    chestMetal: "#ffe066",
  },
};

export function isThemeId(value: unknown): value is ThemeId {
  return value === "jelly" || value === "arcade" || value === "cosmic";
}

export function isCharacterId(value: unknown): value is CharacterId {
  return value === "pirate" || value === "chevalier" || value === "princesse" || value === "dragon";
}

/* ---------- utilitaires couleur ---------- */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const n = parseInt(h.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgba(hex: string, alpha: number): string {
  if (!hex || hex[0] !== "#") return hex;
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const r = Math.round(A.r + (B.r - A.r) * t);
  const g = Math.round(A.g + (B.g - A.g) * t);
  const bl = Math.round(A.b + (B.b - A.b) * t);
  return `rgb(${r},${g},${bl})`;
}

// Thème "résolu" pour un enfant : thème de base + personnalisation blob.
// C'est l'objet `ui` passé à tous les composants visuels de la vue enfant.
export interface KidTheme extends Theme {
  character: CharacterId;
}

export function resolveKidTheme(
  themeId: ThemeId | null,
  character: CharacterId | null,
  blobColor: string | null
): KidTheme {
  const base = THEMES[themeId ?? "jelly"];
  const blob = blobColor && blobColor.startsWith("#") ? blobColor : base.scene.blob;
  return {
    ...base,
    character: character ?? "pirate",
    scene: {
      ...base.scene,
      blob,
      blobLit: blob === base.scene.blob ? base.scene.blobLit : mix(blob, "#ffffff", 0.4),
    },
  };
}
