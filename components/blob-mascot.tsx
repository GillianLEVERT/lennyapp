"use client";

// Mascotte blob Skadoush : SVG animé (respiration, clignement, bras,
// coucou à l'arrivée) + chapeau et accessoire du personnage choisi.
// Porté depuis le prototype Claude Design.

import { useId } from "react";
import {
  mix,
  rgba,
  type CharacterId,
  type KidTheme,
  type SceneTokens,
} from "@/lib/themes";

function CharacterHat({ character, s }: { character: CharacterId; s: SceneTokens }) {
  if (character === "pirate") {
    return (
      <g>
        {/* plume */}
        <path d="M72 22 Q96 4 88 -12" stroke={s.cheek} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M72 22 Q90 8 86 -7" stroke={s.blobLit} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
        {/* tricorne : large bord, pointes relevées */}
        <path d="M15 33 Q60 12 105 33 Q96 25 80 24 Q60 20 40 24 Q24 25 15 33 Z" fill="#241f30" />
        <path d="M15 33 Q60 25 105 33" fill="none" stroke="#3a3450" strokeWidth="2.5" />
        {/* dôme plein */}
        <path d="M33 27 Q41 4 60 4 Q79 4 87 27 Q60 18 33 27 Z" fill="#2e2740" />
        <path d="M33 27 Q41 4 60 4 Q79 4 87 27" fill="none" stroke="#3a3450" strokeWidth="1.5" />
        {/* petit crâne */}
        <circle cx="60" cy="24" r="5.5" fill="#fff" />
        <circle cx="58" cy="23.5" r="1.1" fill="#241f30" />
        <circle cx="62" cy="23.5" r="1.1" fill="#241f30" />
        <rect x="57.5" y="27" width="5" height="2" rx="1" fill="#fff" />
      </g>
    );
  }
  if (character === "chevalier") {
    return (
      <g>
        {/* plumet */}
        <path d="M60 16 Q66 0 74 6" stroke={s.cheek} strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* casque */}
        <path d="M28 34 Q28 12 60 12 Q92 12 92 34 Z" fill="#aeb6c4" />
        <path d="M28 34 Q28 12 60 12 Q92 12 92 34 Z" fill="none" stroke="#8b94a6" strokeWidth="2" />
        <rect x="34" y="29" width="52" height="6" rx="3" fill="#7c869a" />
      </g>
    );
  }
  // princesse
  return (
    <g>
      <path
        d="M32 32 L39 15 L49 26 L60 11 L71 26 L81 15 L88 32 Z"
        fill="#ffd23d"
        stroke="#e3a900"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="39" cy="15" r="3" fill={s.cheek} />
      <circle cx="60" cy="11" r="3.4" fill={s.gem} />
      <circle cx="81" cy="15" r="3" fill={s.cheek} />
      <rect x="32" y="30" width="56" height="4" rx="2" fill="#e3a900" />
    </g>
  );
}

// Accessoire tenu en main (dessiné vers le haut depuis la main gauche).
function HandProp({ character }: { character: CharacterId }) {
  if (character === "pirate") {
    return (
      <g transform="translate(0,-34)">
        <rect x="-7.5" y="-7" width="15" height="12" rx="5" fill="#5b4636" />
        <path d="M0 -7 q0 -15 10 -16 q8 -1 6.5 8" fill="none" stroke="#cbd5e1" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M0 -7 q0 -15 10 -16" fill="none" stroke="#eef2f7" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    );
  }
  if (character === "chevalier") {
    return (
      <g transform="translate(0,-34)">
        <rect x="-2.6" y="-42" width="5.2" height="34" rx="2" fill="#cbd5e1" />
        <rect x="-2.6" y="-42" width="2" height="34" rx="1" fill="#eef2f7" />
        <path d="M-2.6 -42 L0 -48 L2.6 -42 Z" fill="#cbd5e1" />
        <rect x="-10" y="-12" width="20" height="5" rx="2.5" fill="#ffd23d" />
        <rect x="-3" y="-9" width="6" height="11" rx="3" fill="#5b4636" />
      </g>
    );
  }
  // princesse : baguette magique
  return (
    <g transform="translate(0,-34)">
      <rect x="-1.8" y="-40" width="3.6" height="36" rx="1.8" fill="#ffd23d" />
      <path
        d="M0 -54 l2.5 5 5.5 .8 -4 3.9 .9 5.5 -4.9 -2.6 -4.9 2.6 .9 -5.5 -4 -3.9 5.5 -.8 Z"
        fill="#ff6ec7"
        stroke="#fff"
        strokeWidth=".7"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="-50" r="1.4" fill="#fff" />
      <circle cx="-8" cy="-44" r="1.1" fill="#fff" />
    </g>
  );
}

interface BlobMascotProps {
  ui: KidTheme;
  size?: number;
  mood?: "happy" | "oh";
  character?: CharacterId;
  wave?: boolean;
  // Change cette clé pour rejouer le coucou (ex : au changement de perso).
  waveKey?: string | number;
}

export function BlobMascot({
  ui,
  size = 120,
  mood = "happy",
  character,
  wave = true,
  waveKey = 0,
}: BlobMascotProps) {
  const s = ui.scene;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const hero = character ?? ui.character;

  return (
    <div style={{ width: size, height: size, animation: "skadFloat 3s ease-in-out infinite" }}>
      <svg viewBox="0 0 120 120" width={size} height={size} style={{ overflow: "visible" }} aria-hidden="true">
        <defs>
          <radialGradient id={id} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor={s.blobLit} />
            <stop offset="100%" stopColor={s.blob} />
          </radialGradient>
          <filter id={`${id}sh`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor={rgba(s.blob, 0.5)} />
          </filter>
        </defs>
        {/* ombre au sol */}
        <ellipse cx="60" cy="112" rx="30" ry="7" fill="rgba(0,0,0,.12)">
          <animate attributeName="rx" values="30;26;30" dur="3s" repeatCount="indefinite" />
        </ellipse>

        {/* corps qui respire */}
        <g filter={`url(#${id}sh)`}>
          <path
            fill={`url(#${id})`}
            d="M60 16 C84 16 100 36 100 62 C100 92 82 106 60 106 C38 106 20 92 20 62 C20 36 36 16 60 16 Z"
          >
            <animate
              attributeName="d"
              dur="2.4s"
              repeatCount="indefinite"
              values="M60 16 C84 16 100 36 100 62 C100 92 82 106 60 106 C38 106 20 92 20 62 C20 36 36 16 60 16 Z;
                      M60 20 C86 18 98 40 98 64 C98 90 80 104 60 104 C40 104 22 90 22 64 C22 40 34 22 60 20 Z;
                      M60 16 C84 16 100 36 100 62 C100 92 82 106 60 106 C38 106 20 92 20 62 C20 36 36 16 60 16 Z"
            />
          </path>
        </g>
        {/* joues */}
        <circle cx="40" cy="68" r="7" fill={rgba(s.cheek, 0.55)} />
        <circle cx="80" cy="68" r="7" fill={rgba(s.cheek, 0.55)} />
        {/* yeux qui clignent */}
        <g fill="#1f1638">
          <ellipse cx="47" cy="56" rx="6" ry="8">
            <animate attributeName="ry" values="8;8;1;8;8" keyTimes="0;.45;.5;.55;1" dur="4s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="73" cy="56" rx="6" ry="8">
            <animate attributeName="ry" values="8;8;1;8;8" keyTimes="0;.45;.5;.55;1" dur="4s" repeatCount="indefinite" />
          </ellipse>
          <circle cx="49" cy="53" r="2" fill="#fff" />
          <circle cx="75" cy="53" r="2" fill="#fff" />
        </g>
        {/* bouche */}
        {mood === "happy" ? (
          <path d="M52 76 Q60 86 68 76" stroke="#1f1638" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        ) : (
          <circle cx="60" cy="80" r="4" fill="#1f1638" />
        )}

        {/* bras gauche (tient l'accessoire, écarté vers l'extérieur) */}
        <g transform="translate(30,84)">
          <g>
            <animateTransform attributeName="transform" type="rotate" values="-26;-33;-26" dur="3.4s" repeatCount="indefinite" />
            <rect x="-7" y="-30" width="14" height="36" rx="7" fill={s.blob} />
            <circle cx="0" cy="-30" r="9" fill={s.blobLit} />
            <HandProp character={hero} />
          </g>
        </g>

        {/* bras droit : fait coucou à l'arrivée puis se repose */}
        <g transform="translate(95,74)">
          <g>
            <animateTransform
              key={waveKey}
              attributeName="transform"
              type="rotate"
              begin={wave ? "0.3s" : "indefinite"}
              dur="2.2s"
              repeatCount="1"
              fill="remove"
              keyTimes="0;0.1;0.26;0.42;0.58;0.74;0.9;1"
              values="6;-118;-98;-120;-98;-120;-30;6"
            />
            <animateTransform attributeName="transform" type="rotate" additive="sum" values="0;-8;0" dur="3.2s" repeatCount="indefinite" />
            <rect x="-7" y="-2" width="14" height="33" rx="7" fill={s.blob} />
            <circle cx="0" cy="31" r="9" fill={s.blobLit} />
          </g>
        </g>

        {/* chapeau du personnage (au-dessus de tout) */}
        <CharacterHat character={hero} s={s} />
      </svg>
    </div>
  );
}

interface ChestIconProps {
  ui: KidTheme;
  color?: string;
  size?: number;
  character?: CharacterId;
}

// Petite icône coffre dessinée (remplace l'emoji), aux couleurs du thème
// et frappée de l'emblème du personnage.
export function ChestIcon({ ui, color, size = 30, character }: ChestIconProps) {
  const c = color ?? ui.primary;
  const wood = mix(c, "#2a1a0c", 0.12);
  const dark = mix(c, "#000000", 0.32);
  const band = ui.scene.chestMetal;
  const gold = "#ffd23d";
  const hero = character ?? ui.character;

  return (
    <svg
      width={size}
      height={size * 0.82}
      viewBox="0 0 32 26"
      style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.22))" }}
      aria-hidden="true"
    >
      {/* couvercle */}
      <path d="M3 12 Q16 1 29 12 L29 13 L3 13 Z" fill={dark} />
      <path d="M3 12 Q16 1 29 12" fill="none" stroke={band} strokeWidth="1.6" />
      {/* corps */}
      <rect x="3" y="12.5" width="26" height="11.5" rx="2.4" fill={wood} />
      <rect x="3" y="12.5" width="26" height="11.5" rx="2.4" fill="none" stroke={dark} strokeWidth="1" />
      {/* bande */}
      <rect x="14" y="9" width="4" height="15" fill={band} rx="1" />
      {/* serrure */}
      <rect x="14.4" y="13.6" width="3.2" height="4.4" rx="1" fill={gold} stroke={dark} strokeWidth=".6" />
      {/* emblème personnage */}
      {hero === "pirate" ? <circle cx="9" cy="18" r="2.1" fill="#fff" /> : null}
      {hero === "chevalier" ? (
        <path d="M22 14 l3 1 v3 l-3 2 l-3-2 v-3 Z" fill={band} stroke={dark} strokeWidth=".5" />
      ) : null}
      {hero === "princesse" ? (
        <path d="M9 16.4 a1.6 1.6 0 0 1 3 1 a1.6 1.6 0 0 1 3 -1 q0 2-3 3.4 q-3-1.4-3-3.4 Z" fill="#ff6ec7" />
      ) : null}
    </svg>
  );
}
