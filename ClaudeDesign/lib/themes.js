/* Skadoush — 3 directions visuelles.
   Chaque thème porte TOUS les tokens : couleurs, typo, formes, ambiance, scène 3D.
   Exposé sur window.SKAD_THEMES + helpers. */
(function () {
  const THEMES = {
    /* ─────────────────────────  JELLY  ───────────────────────── */
    jelly: {
      id: "jelly",
      name: "Jelly",
      emoji: "🍬",
      tagline: "Pastel gourmand & rebondi",
      // ambiance / fond
      bg: "linear-gradient(165deg,#fff6ef 0%,#ffe9f1 55%,#e9f3ff 100%)",
      bgSolid: "#fff3ec",
      texture: "bubbles",
      // surfaces
      surface: "#ffffff",
      surfaceAlt: "#fff3f6",
      glass: false,
      // texte
      text: "#4b3a55",
      textSoft: "#9a8aa3",
      textOnAccent: "#ffffff",
      // accents
      primary: "#ff5d8f",
      primaryGrad: ["#ff9bbb", "#ff4f86"],
      accents: ["#ff5d8f", "#5ec5ff", "#56d6a0", "#ffce4d"],
      heroGrad: ["#ff8fb1", "#5ec5ff"],
      // type
      fontTitle: "Baloo 2",
      fontBody: "Nunito",
      titleUpper: false,
      titleItalic: false,
      titleWeight: 800,
      // formes
      radius: 26,
      stroke: 0,
      strokeColor: "transparent",
      shadow: "0 18px 40px -18px rgba(255,93,143,.45)",
      shadowSoft: "0 8px 22px -12px rgba(120,80,140,.25)",
      glossy: true,
      // scène 3D
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
      fontTitle: "Luckiest Guy",
      fontBody: "Baloo 2",
      titleUpper: true,
      titleItalic: false,
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
      fontTitle: "Fredoka",
      fontBody: "Quicksand",
      titleUpper: false,
      titleItalic: false,
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

  // toutes les polices à charger
  const FONTS = [
    "Baloo 2:wght@400;500;600;700;800",
    "Nunito:wght@400;600;700;800;900",
    "Luckiest Guy",
    "Fredoka:wght@400;500;600;700",
    "Quicksand:wght@400;500;600;700",
    "Comfortaa:wght@400;500;600;700",
  ];

  // choix de polices proposés dans les tweaks
  const TITLE_FONTS = ["Baloo 2", "Luckiest Guy", "Fredoka", "Comfortaa", "Nunito"];
  const BODY_FONTS = ["Nunito", "Quicksand", "Baloo 2", "Fredoka", "Comfortaa"];

  window.SKAD_THEMES = THEMES;
  window.SKAD_FONTS = FONTS;
  window.SKAD_TITLE_FONTS = TITLE_FONTS;
  window.SKAD_BODY_FONTS = BODY_FONTS;
  window.SKAD_ORDER = ["jelly", "arcade", "cosmic"];

  // personnages : changent le blob ET la déco du coffre
  window.SKAD_CHARACTERS = {
    pirate: { id: "pirate", name: "Pirate", emoji: "🏴‍☠️", hatColor: "#272233", trim: "#ffd23d" },
    chevalier: { id: "chevalier", name: "Chevalier", emoji: "🛡️", hatColor: "#aeb6c4", trim: "#7c869a" },
    princesse: { id: "princesse", name: "Princesse", emoji: "👑", hatColor: "#ffd23d", trim: "#ff6ec7" },
  };
  window.SKAD_CHAR_ORDER = ["pirate", "chevalier", "princesse"];
})();
