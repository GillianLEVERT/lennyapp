"use client";

// Vue enfant Skadoush — adaptation du prototype Claude Design :
// 3 thèmes (Jelly / Arcade / Cosmic), mascotte blob personnalisable
// (personnage + couleur), onglets Accueil / Missions / Coffre et
// scène 3D d'ouverture du coffre du jour. Toute la logique Firestore
// (missions, points, série, coffres) est conservée.

import Link from "next/link";
import nextDynamic from "next/dynamic";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  PiGearSixFill,
  PiLockFill,
  PiSpeakerHighFill,
  PiSpeakerSlashFill,
} from "react-icons/pi";
import { ConfettiBurst } from "@/components/confetti-burst";
import { useAuth } from "@/components/auth-provider";
import { ChildAvatar } from "@/components/child-avatar";
import { BlobMascot, ChestIcon } from "@/components/blob-mascot";
import {
  Btn,
  Card,
  Counter,
  IconTile,
  Pill,
  ProgressBar,
  SectionTitle,
  STACK_GAP,
  TextureOverlay,
} from "@/components/skad-ui";
import {
  CHEST_COSTS,
  DAILY_CHEST_BONUS,
  claimDailyChest,
  openChest,
  resetDailyMissions,
  REWARD_TIERS,
  setMissionStatus,
  subscribeChildren,
  subscribeMissions,
  subscribeRewards,
  tierForStreak,
  todayKey,
  updateChild,
  yesterdayKey,
  type Child,
  type Mission,
  type Reward,
  type RewardTier,
} from "@/lib/firestore-data";
import {
  getServerSoundSnapshot,
  getSoundSnapshot,
  playCue,
  setActiveTaskSound,
  subscribeToSound,
  toggleSound,
} from "@/lib/feedback";
import {
  CHARACTER_ORDER,
  CHARACTERS,
  CHEST_TIER_COLORS,
  mix,
  resolveKidTheme,
  rgba,
  THEME_ORDER,
  THEMES,
  type CharacterId,
  type KidTheme,
  type ThemeId,
} from "@/lib/themes";

// Three.js n'est chargé que lorsque la vue enfant s'affiche.
const ChestScene = nextDynamic(
  () => import("@/components/chest-scene").then((mod) => mod.ChestScene),
  { ssr: false }
);

const ACTIVE_CHILD_KEY = "lennyapp-kid-child";

type Tab = "home" | "missions" | "chest";

function subscribeReducedMotion(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/* ---------------- écrans d'attente (thème Jelly par défaut) ---------------- */
function CenteredCard({ children }: { children: React.ReactNode }) {
  const ui = resolveKidTheme(null, null, null);
  return (
    <main
      style={{
        minHeight: "100vh",
        background: ui.bg,
        display: "grid",
        placeItems: "center",
        padding: "32px 16px",
        fontFamily: `${ui.fontBody}, system-ui, sans-serif`,
      }}
    >
      <Card ui={ui} style={{ width: "100%", maxWidth: 420, textAlign: "center", padding: 28 }}>
        {children}
      </Card>
    </main>
  );
}

/* ---------------- en-tête persistant ---------------- */
function TopBar({
  ui,
  child,
  tab,
  setTab,
  soundEnabled,
}: {
  ui: KidTheme;
  child: Child;
  tab: Tab;
  setTab: (tab: Tab) => void;
  soundEnabled: boolean;
}) {
  const tabs: Array<[Tab, string, string]> = [
    ["home", "Accueil", "🏠"],
    ["missions", "Missions", "🎯"],
    ["chest", "Coffre", "🎁"],
  ];
  return (
    <div style={{ display: "grid", gap: 12, padding: "4px 2px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 52, height: 52 }}>
            <BlobMascot ui={ui} size={52} waveKey={ui.character} />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div
              style={{
                fontFamily: ui.fontBody,
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: ui.textSoft,
              }}
            >
              Salut
            </div>
            <div
              style={{
                fontFamily: ui.fontTitle,
                fontWeight: ui.titleWeight,
                fontSize: 20,
                color: ui.text,
              }}
            >
              {child.name}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px 7px 10px",
              borderRadius: 999,
              background: rgba(ui.accents[3], ui.glass ? 0.22 : 0.16),
            }}
          >
            <span style={{ fontSize: 18 }} aria-hidden="true">
              ⭐
            </span>
            <Counter
              value={child.totalPoints}
              style={{
                fontFamily: ui.fontTitle,
                fontWeight: ui.titleWeight,
                fontSize: 20,
                color: ui.text,
                fontVariantNumeric: "tabular-nums",
              }}
            />
            <span
              style={{
                fontFamily: ui.fontBody,
                fontWeight: 700,
                fontSize: 12,
                color: ui.textSoft,
              }}
            >
              pts
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleSound()}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? "Couper le son" : "Activer le son"}
            className="skad-focus"
            style={{
              appearance: "none",
              border: "none",
              cursor: "pointer",
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
              color: soundEnabled ? ui.text : ui.textSoft,
              background: rgba(ui.text, ui.glass ? 0.14 : 0.07),
            }}
          >
            {soundEnabled ? (
              <PiSpeakerHighFill aria-hidden="true" />
            ) : (
              <PiSpeakerSlashFill aria-hidden="true" />
            )}
          </button>
          <Link
            href="/parent"
            aria-label="Espace parent"
            className="skad-focus"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
              color: ui.textSoft,
              background: rgba(ui.text, ui.glass ? 0.14 : 0.07),
            }}
          >
            <PiGearSixFill aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          justifySelf: "center",
          borderRadius: 999,
          background: rgba(ui.text, ui.glass ? 0.12 : 0.06),
          backdropFilter: ui.glass ? "blur(10px)" : "none",
        }}
      >
        {tabs.map(([id, label, emoji]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              playCue("task");
              setTab(id);
            }}
            aria-pressed={tab === id}
            className="skad-focus"
            style={{
              appearance: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: ui.fontBody,
              fontWeight: 800,
              fontSize: 14,
              padding: "9px 16px",
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: tab === id ? ui.textOnAccent : ui.textSoft,
              background:
                tab === id
                  ? `linear-gradient(160deg,${mix(ui.primary, "#fff", 0.2)},${ui.primary})`
                  : "transparent",
              boxShadow: tab === id ? `0 6px 14px -6px ${rgba(ui.primary, 0.7)}` : "none",
              transition: "all .2s",
            }}
          >
            <span aria-hidden="true">{emoji}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- personnalisation (thème / héros / couleur) ---------------- */
function ThemeSwitcher({
  current,
  onPick,
}: {
  current: ThemeId;
  onPick: (id: ThemeId) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {THEME_ORDER.map((id) => {
        const theme = THEMES[id];
        const on = id === current;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            aria-pressed={on}
            title={theme.tagline}
            className="skad-focus"
            style={{
              appearance: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "7px 9px",
              borderRadius: 14,
              minWidth: 60,
              background: on
                ? "rgba(255,255,255,.92)"
                : "rgba(255,255,255,.18)",
              color: on ? theme.primary : "#fff",
              fontFamily: "var(--font-nunito)",
              fontWeight: 800,
              fontSize: 11,
              boxShadow: on ? "0 6px 14px -6px rgba(0,0,0,.45)" : "none",
              transform: on ? "translateY(-1px)" : "none",
              transition: "all .2s",
            }}
          >
            <span style={{ fontSize: 18 }} aria-hidden="true">
              {theme.emoji}
            </span>
            {theme.name}
          </button>
        );
      })}
    </div>
  );
}

function CharacterPicker({
  ui,
  character,
  onPick,
}: {
  ui: KidTheme;
  character: CharacterId;
  onPick: (id: CharacterId) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {CHARACTER_ORDER.map((id) => {
        const c = CHARACTERS[id];
        const on = id === character;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            aria-pressed={on}
            title={c.name}
            className="skad-focus"
            style={{
              appearance: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "7px 9px",
              borderRadius: 14,
              minWidth: 60,
              background: on ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.18)",
              color: on ? ui.primary : "#fff",
              fontFamily: ui.fontBody,
              fontWeight: 800,
              fontSize: 11,
              boxShadow: on ? "0 6px 14px -6px rgba(0,0,0,.45)" : "none",
              transform: on ? "translateY(-1px)" : "none",
              transition: "all .2s",
            }}
          >
            <span style={{ fontSize: 18 }} aria-hidden="true">
              {c.emoji}
            </span>
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

function BlobColorPicker({
  themeId,
  blobColor,
  onPick,
}: {
  themeId: ThemeId;
  blobColor: string | null;
  onPick: (color: string | null) => void;
}) {
  const base = THEMES[themeId];
  // null = couleur d'origine du thème, puis les 4 accents du thème.
  const options: Array<{ key: string; color: string; value: string | null }> = [
    { key: "default", color: base.scene.blob, value: null },
    ...base.accents.map((accent) => ({ key: accent, color: accent, value: accent })),
  ];
  const current = blobColor ?? null;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }} role="group" aria-label="Couleur du blob">
      {options.map((option) => {
        const on = current === option.value;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onPick(option.value)}
            aria-pressed={on}
            aria-label={option.value === null ? "Couleur d'origine" : `Couleur ${option.color}`}
            className="skad-focus"
            style={{
              appearance: "none",
              cursor: "pointer",
              width: on ? 28 : 22,
              height: on ? 28 : 22,
              borderRadius: "50%",
              border: on ? "3px solid rgba(255,255,255,.95)" : "2px solid rgba(255,255,255,.4)",
              background: `radial-gradient(circle at 35% 30%, ${mix(option.color, "#ffffff", 0.4)}, ${option.color})`,
              boxShadow: on ? `0 4px 10px -2px ${rgba(option.color, 0.8)}` : "none",
              transition: "all .2s",
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------------- carte mission ----------------
   Icône en grand et centrée : beaucoup d'enfants ne lisent pas encore,
   c'est l'image qui sert de repère. Hauteur 100% pour des rangées
   alignées (pas d'effet escalier). */
function MissionCard({
  ui,
  mission,
  color,
  onToggle,
}: {
  ui: KidTheme;
  mission: Mission;
  color: string;
  onToggle: (mission: Mission) => void;
}) {
  const done = mission.status === "done";
  const c = color;
  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={() => onToggle(mission)}
      className="skad-focus"
      style={{
        appearance: "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100%",
        background: done ? rgba(c, ui.glass ? 0.2 : 0.1) : ui.surface,
        backdropFilter: ui.glass ? "blur(18px) saturate(160%)" : "none",
        borderRadius: ui.radius,
        padding: 20,
        boxShadow: ui.shadowSoft,
        border: ui.glass
          ? `1px solid ${rgba(ui.text, 0.14)}`
          : ui.stroke
            ? `${ui.stroke}px solid ${ui.strokeColor}`
            : `1px solid ${rgba(ui.text, 0.05)}`,
        color: ui.text,
        position: "relative",
        overflow: "hidden",
        transition: "transform .18s cubic-bezier(.34,1.56,.64,1), background .3s",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `linear-gradient(150deg, ${rgba(c, 0.14)}, transparent 60%)`,
        }}
      />
      {done ? (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: c,
            display: "grid",
            placeItems: "center",
            color: ui.textOnAccent,
            fontWeight: 900,
            animation: "skadPop .4s cubic-bezier(.34,1.8,.5,1)",
          }}
          aria-hidden="true"
        >
          ✓
        </div>
      ) : null}

      <div style={{ position: "relative", marginTop: 4 }}>
        <IconTile ui={ui} glyph={mission.icon} color={c} size={84} />
      </div>
      <Pill ui={ui} color={c} style={{ marginTop: 12 }}>
        {done ? "Fait" : `+${mission.points} pts`}
      </Pill>
      <div
        style={{
          position: "relative",
          marginTop: 8,
          fontFamily: ui.fontBody,
          fontWeight: 800,
          fontSize: 19,
          lineHeight: 1.25,
          color: ui.text,
          textAlign: "center",
          textWrap: "balance",
          textDecoration: done ? "line-through" : "none",
          textDecorationColor: rgba(ui.text, 0.35),
        }}
      >
        {mission.title}
      </div>
      {mission.description ? (
        <div
          style={{
            position: "relative",
            marginTop: 4,
            fontFamily: ui.fontBody,
            fontWeight: 600,
            fontSize: 13,
            color: ui.textSoft,
            textAlign: "center",
            textWrap: "balance",
          }}
        >
          {mission.description}
        </div>
      ) : null}

      <div
        style={{
          position: "relative",
          marginTop: "auto",
          paddingTop: 16,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            placeItems: "center",
            fontFamily: ui.fontBody,
            fontWeight: 800,
            fontSize: 16,
            padding: "13px 22px",
            borderRadius: ui.radius * 0.7,
            background: done
              ? rgba(c, ui.glass ? 0.25 : 0.16)
              : `linear-gradient(160deg, ${mix(c, "#ffffff", 0.22)}, ${c})`,
            color: done ? c : ui.textOnAccent,
            boxShadow: done
              ? "none"
              : ui.glossy
                ? `inset 0 2px 3px rgba(255,255,255,.55), 0 10px 20px -8px ${rgba(c, 0.8)}`
                : ui.stroke
                  ? `4px 4px 0 ${ui.strokeColor}`
                  : `0 12px 22px -8px ${rgba(c, 0.7)}`,
            border: !done && ui.stroke ? `${ui.stroke}px solid ${ui.strokeColor}` : "none",
          }}
        >
          {done ? "Bravo ! ✨" : "C'est fait !"}
        </div>
      </div>
    </button>
  );
}

/* ---------------- ACCUEIL ---------------- */
function Dashboard({
  ui,
  child,
  kids,
  missions,
  doneCount,
  chestReady,
  chestClaimedToday,
  dailyTier,
  rewards,
  goMissions,
  goChest,
  onOpenRewardChest,
  onSelectChild,
  onPickTheme,
  onPickCharacter,
  onPickBlobColor,
}: {
  ui: KidTheme;
  child: Child;
  kids: Child[];
  missions: Mission[];
  doneCount: number;
  chestReady: boolean;
  chestClaimedToday: boolean;
  dailyTier: RewardTier;
  rewards: Reward[];
  goMissions: () => void;
  goChest: () => void;
  onOpenRewardChest: (tier: RewardTier) => void;
  onSelectChild: (childId: string) => void;
  onPickTheme: (id: ThemeId) => void;
  onPickCharacter: (id: CharacterId) => void;
  onPickBlobColor: (color: string | null) => void;
}) {
  const allDone = missions.length > 0 && doneCount === missions.length;
  const streak = child.streak;
  // Couleurs des 3 coffres récompenses, reprises des accents du thème.
  const chestColors: Record<RewardTier, string> = {
    bronze: ui.accents[0],
    silver: ui.accents[1],
    gold: ui.accents[3],
  };

  return (
    <div style={{ display: "grid", gap: STACK_GAP, animation: "skadIn .45s ease both" }}>
      {/* HERO */}
      <Card
        ui={ui}
        style={{
          background: `linear-gradient(150deg, ${ui.heroGrad[0]}, ${ui.heroGrad[1]})`,
          color: "#fff",
          padding: 28,
          overflow: "hidden",
          border: ui.stroke ? `${ui.stroke}px solid ${ui.strokeColor}` : "none",
        }}
      >
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "stretch" }}>
          <div style={{ flex: "1 1 320px", minWidth: 0 }}>
            <span
              style={{
                display: "inline-flex",
                gap: 8,
                alignItems: "center",
                fontFamily: ui.fontBody,
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                background: "rgba(255,255,255,.22)",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: 999,
              }}
            >
              <ChildAvatar
                avatar={child.avatar}
                photoURL={child.photoURL}
                name={child.name}
                size={22}
              />
              Ta journée de héros
            </span>
            <h1
              style={{
                margin: "14px 0 0",
                fontFamily: ui.fontTitle,
                fontWeight: ui.titleWeight,
                textTransform: ui.titleUpper ? "uppercase" : "none",
                fontSize: "clamp(40px,7vw,72px)",
                lineHeight: 0.92,
                color: "#fff",
                textShadow: "0 4px 16px rgba(0,0,0,.18)",
                letterSpacing: ui.titleUpper ? "0" : "-.02em",
              }}
            >
              Skadoush
            </h1>
            <p
              style={{
                margin: "12px 0 18px",
                fontFamily: ui.fontBody,
                fontWeight: 600,
                fontSize: 16,
                color: "rgba(255,255,255,.92)",
                maxWidth: 360,
              }}
            >
              Termine tes missions du matin et gagne des points.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: ui.fontBody,
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.85)",
                marginBottom: 8,
              }}
            >
              <span>Missions</span>
              <span>
                {doneCount}/{missions.length}
              </span>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,.28)",
                borderRadius: 999,
                height: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${missions.length ? (doneCount / missions.length) * 100 : 0}%`,
                  background: "#fff",
                  borderRadius: 999,
                  transition: "width .6s cubic-bezier(.34,1.56,.64,1)",
                  boxShadow: "0 0 12px rgba(255,255,255,.7)",
                }}
              />
            </div>
            <div style={{ marginTop: 20 }}>
              {allDone && !chestReady ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: ui.fontBody,
                    fontWeight: 800,
                    fontSize: 16,
                    background: "rgba(255,255,255,.22)",
                    color: "#fff",
                    padding: "13px 22px",
                    borderRadius: ui.radius * 0.7,
                  }}
                >
                  ✅ Coffre ouvert ! Reviens demain ✨
                </span>
              ) : (
                <Btn
                  ui={ui}
                  size="lg"
                  color="#ffffff"
                  style={{ color: ui.primary }}
                  glow
                  onClick={() => {
                    playCue("task");
                    if (chestReady) {
                      goChest();
                    } else {
                      goMissions();
                    }
                  }}
                >
                  {chestReady ? "🎁 Ouvrir le coffre !" : "Faire mes missions →"}
                </Btn>
              )}
            </div>
          </div>

          <div
            style={{
              flex: "0 0 240px",
              display: "grid",
              placeItems: "center",
              gap: 8,
              background: "rgba(255,255,255,.14)",
              borderRadius: ui.radius,
              padding: "18px 16px",
              minWidth: 210,
            }}
          >
            <div
              style={{
                position: "relative",
                width: 150,
                height: 150,
                display: "grid",
                placeItems: "center",
              }}
            >
              <BlobMascot ui={ui} size={150} waveKey={`${ui.character}-${ui.scene.blob}`} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 22 }} aria-hidden="true">
                ⭐
              </span>
              <Counter
                value={child.totalPoints}
                style={{
                  fontFamily: ui.fontTitle,
                  fontWeight: ui.titleWeight,
                  fontSize: 40,
                  color: "#fff",
                  lineHeight: 1,
                }}
              />
              <span
                style={{
                  fontFamily: ui.fontBody,
                  fontWeight: 800,
                  fontSize: 13,
                  color: "rgba(255,255,255,.85)",
                }}
              >
                pts
              </span>
            </div>
            <CharacterPicker ui={ui} character={ui.character} onPick={onPickCharacter} />
            <BlobColorPicker
              themeId={ui.id}
              blobColor={child.blobColor}
              onPick={onPickBlobColor}
            />
          </div>
        </div>

        {/* sous-tuiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
          <div
            style={{
              background: "rgba(255,255,255,.16)",
              borderRadius: ui.radius * 0.8,
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: ui.fontBody,
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,.8)",
                  whiteSpace: "nowrap",
                }}
              >
                Trophées
              </div>
              <div
                style={{
                  fontFamily: ui.fontTitle,
                  fontWeight: ui.titleWeight,
                  fontSize: 28,
                  color: "#fff",
                }}
              >
                {streak}
              </div>
              <div
                style={{
                  fontFamily: ui.fontBody,
                  fontWeight: 700,
                  fontSize: 11,
                  color: "rgba(255,255,255,.75)",
                }}
              >
                1 matin réussi = 1 trophée
              </div>
            </div>
            <span style={{ fontSize: 30 }} aria-hidden="true">
              🏆
            </span>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,.16)",
              borderRadius: ui.radius * 0.8,
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: ui.fontBody,
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,.8)",
                  whiteSpace: "nowrap",
                }}
              >
                Coffre du jour
              </div>
              <div
                style={{
                  fontFamily: ui.fontTitle,
                  fontWeight: ui.titleWeight,
                  fontSize: 22,
                  color: "#fff",
                }}
              >
                {chestClaimedToday ? "Ouvert !" : chestReady ? "Prêt !" : "Verrouillé"}
              </div>
            </div>
            <span style={{ fontSize: 30, display: "grid", placeItems: "center" }} aria-hidden="true">
              {chestReady ? "🎉" : chestClaimedToday ? "✅" : <ChestIcon ui={ui} color={chestColors[dailyTier]} size={34} />}
            </span>
          </div>
        </div>

        {/* mon style : choix du thème */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            background: "rgba(255,255,255,.14)",
            borderRadius: ui.radius * 0.8,
            padding: "12px 16px",
          }}
        >
          <span
            style={{
              fontFamily: ui.fontBody,
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.85)",
            }}
          >
            ✨ Mon style
          </span>
          <ThemeSwitcher current={ui.id} onPick={onPickTheme} />
        </div>

        {/* sélecteur d'enfant */}
        {kids.length > 1 ? (
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {kids.map((kid) => {
              const active = kid.id === child.id;
              return (
                <button
                  key={kid.id}
                  type="button"
                  onClick={() => onSelectChild(kid.id)}
                  aria-pressed={active}
                  className="skad-focus"
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    padding: "6px 14px 6px 8px",
                    fontFamily: ui.fontBody,
                    fontWeight: 800,
                    fontSize: 13,
                    border: active ? "2px solid #fff" : "2px solid rgba(255,255,255,.3)",
                    background: active ? "rgba(255,255,255,.2)" : "transparent",
                    color: active ? "#fff" : "rgba(255,255,255,.7)",
                    transition: "all .2s",
                  }}
                >
                  <ChildAvatar avatar={kid.avatar} photoURL={kid.photoURL} name={kid.name} size={24} />
                  {kid.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </Card>

      {/* TES CARTES (aperçu missions) */}
      <Card ui={ui}>
        <SectionTitle
          ui={ui}
          kicker="Missions"
          title="Tes cartes"
          color={ui.accents[1]}
          right={
            <Pill ui={ui} color={ui.accents[1]}>
              {doneCount}/{missions.length}
            </Pill>
          }
        />
        {missions.length === 0 ? (
          <p
            style={{
              margin: 0,
              borderRadius: ui.radius * 0.7,
              background: rgba(ui.text, ui.glass ? 0.1 : 0.05),
              padding: 20,
              textAlign: "center",
              fontFamily: ui.fontBody,
              fontWeight: 700,
              color: ui.textSoft,
            }}
          >
            Aucune mission pour le moment. Un parent peut les préparer dans l&apos;espace parent.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 14,
            }}
          >
            {missions.map((mission, index) => {
              const c = ui.accents[index % ui.accents.length];
              const done = mission.status === "done";
              return (
                <Card
                  key={mission.id}
                  ui={ui}
                  interactive
                  accent={c}
                  onClick={() => {
                    playCue("task");
                    goMissions();
                  }}
                  style={{
                    background: rgba(c, ui.glass ? 0.16 : 0.08),
                    padding: 16,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    textAlign: "center",
                  }}
                >
                  <IconTile ui={ui} glyph={mission.icon} color={c} size={64} />
                  <div
                    style={{
                      fontFamily: ui.fontBody,
                      fontWeight: 800,
                      fontSize: 16,
                      lineHeight: 1.25,
                      color: ui.text,
                      textWrap: "balance",
                    }}
                  >
                    {mission.title}
                  </div>
                  <div
                    style={{
                      marginTop: "auto",
                      fontFamily: ui.fontBody,
                      fontWeight: 800,
                      fontSize: 12,
                      color: done ? c : ui.textSoft,
                    }}
                  >
                    {done ? "✓ Terminé" : `+${mission.points} pts`}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* COFFRES À OUVRIR (récompenses contre points) */}
      <Card ui={ui}>
        <SectionTitle
          ui={ui}
          kicker="Récompenses"
          title="Coffres à ouvrir"
          color={ui.accents[2]}
          right={
            <Pill ui={ui} color={ui.accents[2]}>
              {child.totalPoints} pts
            </Pill>
          }
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 14,
          }}
        >
          {REWARD_TIERS.map((chest) => {
            const c = chestColors[chest.tier];
            const cost = CHEST_COSTS[chest.tier];
            const pool = rewards.filter((reward) => reward.tier === chest.tier);
            const affordable = child.totalPoints >= cost;
            const openable = affordable && pool.length > 0;
            return (
              <Card
                key={chest.tier}
                ui={ui}
                accent={c}
                interactive={openable}
                onClick={openable ? () => onOpenRewardChest(chest.tier) : undefined}
                style={{ background: rgba(c, ui.glass ? 0.14 : 0.07), padding: 18 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <IconTile ui={ui} node={<ChestIcon ui={ui} color={c} size={30} />} color={c} size={48} />
                  <Pill ui={ui} color={c}>
                    {cost} pts
                  </Pill>
                </div>
                <div
                  style={{
                    fontFamily: ui.fontTitle,
                    fontWeight: ui.titleWeight,
                    textTransform: ui.titleUpper ? "uppercase" : "none",
                    fontSize: 20,
                    color: ui.text,
                    margin: "14px 0 4px",
                  }}
                >
                  {chest.chestName}
                </div>
                <div
                  style={{
                    fontFamily: ui.fontBody,
                    fontWeight: 600,
                    fontSize: 13,
                    color: ui.textSoft,
                    marginBottom: 12,
                  }}
                >
                  {pool.length === 0
                    ? "Coffre vide pour l'instant"
                    : openable
                      ? "Prêt à ouvrir ! Touche-moi"
                      : `${pool.length} surprise${pool.length > 1 ? "s" : ""} dedans`}
                </div>
                <ProgressBar ui={ui} value={Math.min(child.totalPoints, cost)} max={cost} color={c} height={10} />
                <div
                  style={{
                    fontFamily: ui.fontBody,
                    fontWeight: 800,
                    fontSize: 11,
                    color: ui.textSoft,
                    textAlign: "right",
                    marginTop: 6,
                  }}
                >
                  {Math.min(child.totalPoints, cost)}/{cost}
                </div>
              </Card>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ---------------- MISSIONS ---------------- */
function MissionsScreen({
  ui,
  childName,
  missions,
  doneCount,
  chestClaimedToday,
  onToggle,
  goChest,
}: {
  ui: KidTheme;
  childName: string;
  missions: Mission[];
  doneCount: number;
  chestClaimedToday: boolean;
  onToggle: (mission: Mission) => void;
  goChest: () => void;
}) {
  const allDone = missions.length > 0 && doneCount === missions.length;
  const chestReady = allDone && !chestClaimedToday;
  return (
    <div style={{ display: "grid", gap: STACK_GAP, animation: "skadIn .45s ease both" }}>
      <Card ui={ui}>
        <SectionTitle
          ui={ui}
          kicker="Routine du matin"
          title="Tes missions"
          right={
            <Pill ui={ui}>
              {doneCount}/{missions.length}
            </Pill>
          }
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 14,
          }}
        >
          {missions.map((mission, index) => (
            <MissionCard
              key={mission.id}
              ui={ui}
              mission={mission}
              color={ui.accents[index % ui.accents.length]}
              onToggle={onToggle}
            />
          ))}
        </div>
      </Card>

      <Card
        ui={ui}
        style={{
          background: chestReady
            ? `linear-gradient(150deg,${ui.heroGrad[0]},${ui.heroGrad[1]})`
            : ui.surface,
          textAlign: "center",
          color: chestReady ? "#fff" : ui.text,
          transition: "background .4s",
        }}
      >
        <div
          style={{
            fontSize: 44,
            marginBottom: 8,
            animation: chestReady ? "skadFloat 1.6s ease-in-out infinite" : "none",
          }}
          aria-hidden="true"
        >
          {chestReady ? "🎉" : allDone ? "🌙" : "🧰"}
        </div>
        <h3
          style={{
            margin: "0 0 6px",
            fontFamily: ui.fontTitle,
            fontWeight: ui.titleWeight,
            textTransform: ui.titleUpper ? "uppercase" : "none",
            fontSize: 26,
            color: chestReady ? "#fff" : ui.text,
          }}
        >
          {chestReady
            ? "Tout est terminé !"
            : allDone
              ? "Coffre du jour déjà ouvert !"
              : "Le coffre est verrouillé"}
        </h3>
        <p
          style={{
            margin: chestReady || !allDone ? "0 0 18px" : 0,
            fontFamily: ui.fontBody,
            fontWeight: 600,
            fontSize: 15,
            color: chestReady ? "rgba(255,255,255,.9)" : ui.textSoft,
            textWrap: "balance",
          }}
        >
          {chestReady
            ? "Ton coffre du jour est prêt à être ouvert."
            : allDone
              ? `Bravo ${childName}, reviens demain pour un nouveau trésor ! ✨`
              : "Termine toutes tes missions pour le débloquer."}
        </p>
        {chestReady ? (
          <Btn
            ui={ui}
            size="lg"
            glow
            color="#ffffff"
            style={{ color: ui.primary }}
            onClick={() => {
              playCue("unlock");
              goChest();
            }}
          >
            🎁 Ouvrir le coffre !
          </Btn>
        ) : !allDone ? (
          <Btn ui={ui} size="lg" disabled>
            Pas encore…
          </Btn>
        ) : null}
      </Card>
    </div>
  );
}

/* ---------------- COFFRE (scène 3D) ----------------
   L'enfant choisit quel coffre ouvrir : le coffre du jour (missions) ou
   un coffre récompense (points). Le coffre 3D prend la couleur du palier. */
type ChestPick = "daily" | RewardTier;

const CHEST_PICK_LABELS: Record<ChestPick, { emoji: string; label: string }> = {
  daily: { emoji: "🎁", label: "Jour" },
  bronze: { emoji: "🥉", label: "Bronze" },
  silver: { emoji: "🥈", label: "Argent" },
  gold: { emoji: "🥇", label: "Doré" },
};

function ChestScreen({
  ui,
  reduced,
  child,
  rewards,
  chestReady,
  chestClaimedToday,
  dailyTier,
  nextStreak,
  onDailyCollected,
  drawTierReward,
  onCelebrate,
}: {
  ui: KidTheme;
  reduced: boolean;
  child: Child;
  rewards: Reward[];
  chestReady: boolean;
  chestClaimedToday: boolean;
  dailyTier: RewardTier;
  nextStreak: number;
  onDailyCollected: () => void;
  drawTierReward: (tier: RewardTier) => Promise<Reward | null>;
  onCelebrate: () => void;
}) {
  const [selected, setSelected] = useState<ChestPick>("daily");
  const [play, setPlay] = useState(false);
  const [opened, setOpened] = useState(false);
  const [pendingReward, setPendingReward] = useState<Reward | null>(null);
  const [busy, setBusy] = useState(false);

  // Le coffre 3D prend les couleurs du palier sélectionné.
  const sceneUi = useMemo<KidTheme>(
    () =>
      selected === "daily"
        ? ui
        : { ...ui, scene: { ...ui.scene, ...CHEST_TIER_COLORS[selected] } },
    [ui, selected]
  );

  const dailyChestName =
    REWARD_TIERS.find((reward) => reward.tier === dailyTier)?.chestName ?? "Coffre";
  const dailyBonus = DAILY_CHEST_BONUS[dailyTier];

  const tierInfo =
    selected === "daily"
      ? null
      : {
          chest: REWARD_TIERS.find((entry) => entry.tier === selected)!,
          cost: CHEST_COSTS[selected],
          pool: rewards.filter((reward) => reward.tier === selected),
        };
  const tierAffordable = tierInfo ? child.totalPoints >= tierInfo.cost : false;
  const tierOpenable = tierInfo ? tierAffordable && tierInfo.pool.length > 0 : false;

  function resetAnim() {
    setPlay(false);
    setOpened(false);
    setPendingReward(null);
  }

  function pickChest(pick: ChestPick) {
    if (pick === selected || play) {
      return;
    }
    playCue("task");
    setSelected(pick);
    resetAnim();
  }

  async function handleOpen() {
    if (busy || play) {
      return;
    }
    if (selected === "daily") {
      if (!chestReady) {
        return;
      }
      playCue("task");
      setPlay(true);
      return;
    }
    if (!tierOpenable) {
      return;
    }
    setBusy(true);
    // Le tirage (et la dépense de points) se fait avant l'animation :
    // la surprise est connue quand le coffre s'ouvre.
    const reward = await drawTierReward(selected);
    setBusy(false);
    if (!reward) {
      return;
    }
    playCue("task");
    setPendingReward(reward);
    setPlay(true);
  }

  const showOpenButton =
    !play &&
    ((selected === "daily" && chestReady) || (selected !== "daily" && tierOpenable));

  // Message d'état quand on ne peut pas ouvrir le coffre sélectionné.
  let statusMessage: string | null = null;
  if (!play) {
    if (selected === "daily") {
      if (chestClaimedToday) {
        statusMessage = `✅ Coffre ouvert ! Reviens demain, ${child.name} !`;
      } else if (!chestReady) {
        statusMessage = "🔒 Termine tes missions pour le débloquer.";
      }
    } else if (tierInfo) {
      if (tierInfo.pool.length === 0) {
        statusMessage = "Ce coffre est vide pour l'instant.";
      } else if (!tierAffordable) {
        statusMessage = `Encore ${tierInfo.cost - child.totalPoints} points et il est à toi !`;
      }
    }
  }

  return (
    <Card
      ui={ui}
      style={{
        padding: 0,
        overflow: "hidden",
        position: "relative",
        height: "min(68vh,600px)",
        animation: "skadIn .45s ease both",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg,${ui.scene.bgTop},${ui.scene.bgBottom})`,
        }}
      />
      <ChestScene
        ui={sceneUi}
        play={play}
        reduced={reduced}
        intensity={1}
        onOpened={() => {
          playCue("open");
          setOpened(true);
        }}
      />

      {/* libellé haut */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          right: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: ui.fontBody,
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            color: "#fff",
            background: "rgba(0,0,0,.25)",
            padding: "7px 14px",
            borderRadius: 999,
            backdropFilter: "blur(8px)",
          }}
        >
          {selected === "daily" ? "Coffre du jour" : tierInfo?.chest.chestName}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: ui.fontBody,
            fontWeight: 800,
            fontSize: 14,
            whiteSpace: "nowrap",
            color: "#fff",
            background: "rgba(0,0,0,.25)",
            padding: "7px 14px",
            borderRadius: 999,
            backdropFilter: "blur(8px)",
          }}
        >
          ⭐ {child.totalPoints} pts
        </span>
      </div>

      {/* sélecteur + CTA en bas */}
      {!opened ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 20,
            display: "grid",
            gap: 12,
            justifyItems: "center",
            padding: "0 16px",
          }}
        >
          {showOpenButton ? (
            <Btn ui={ui} size="lg" glow color={ui.primary} disabled={busy} onClick={handleOpen}>
              {selected === "daily"
                ? "✨ Ouvrir le coffre !"
                : `✨ Ouvrir ! (${tierInfo?.cost} pts)`}
            </Btn>
          ) : statusMessage ? (
            <span
              style={{
                fontFamily: ui.fontBody,
                fontWeight: 800,
                fontSize: 14,
                textAlign: "center",
                textWrap: "balance",
                color: "#fff",
                background: "rgba(0,0,0,.3)",
                padding: "10px 20px",
                borderRadius: 999,
                backdropFilter: "blur(8px)",
              }}
            >
              {statusMessage}
            </span>
          ) : null}

          {!play ? (
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: 5,
                borderRadius: 999,
                background: "rgba(0,0,0,.3)",
                backdropFilter: "blur(10px)",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {(Object.keys(CHEST_PICK_LABELS) as ChestPick[]).map((pick) => {
                const on = pick === selected;
                const meta = CHEST_PICK_LABELS[pick];
                const sub =
                  pick === "daily"
                    ? chestClaimedToday
                      ? "Demain"
                      : chestReady
                        ? "Prêt !"
                        : "🔒"
                    : `${CHEST_COSTS[pick]} pts`;
                return (
                  <button
                    key={pick}
                    type="button"
                    onClick={() => pickChest(pick)}
                    aria-pressed={on}
                    className="skad-focus"
                    style={{
                      appearance: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      fontFamily: ui.fontBody,
                      fontWeight: 800,
                      fontSize: 13,
                      padding: "7px 14px",
                      borderRadius: 999,
                      color: on ? ui.textOnAccent : "rgba(255,255,255,.8)",
                      background: on
                        ? `linear-gradient(160deg,${mix(ui.primary, "#fff", 0.2)},${ui.primary})`
                        : "transparent",
                      transition: "all .2s",
                    }}
                  >
                    <span>
                      <span aria-hidden="true">{meta.emoji}</span> {meta.label}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>{sub}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* récompense révélée */}
      {opened ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            animation: "skadIn .4s ease both",
            background: "rgba(0,0,0,.25)",
          }}
        >
          <Card
            ui={ui}
            style={{
              width: "min(360px,86%)",
              textAlign: "center",
              background: ui.glass ? "rgba(30,22,70,.85)" : ui.surface,
              animation: "skadPop .5s cubic-bezier(.34,1.8,.5,1) both",
            }}
          >
            <div
              style={{ fontSize: 56, marginBottom: 8, animation: "skadFloat 2s ease-in-out infinite" }}
              aria-hidden="true"
            >
              {selected === "daily" ? "🏆" : pendingReward?.icon ?? "🎁"}
            </div>
            <Pill ui={ui} style={{ marginBottom: 8 }}>
              {selected === "daily" ? dailyChestName : tierInfo?.chest.chestName}
            </Pill>
            <h3
              style={{
                margin: "6px 0 4px",
                fontFamily: ui.fontTitle,
                fontWeight: ui.titleWeight,
                textTransform: ui.titleUpper ? "uppercase" : "none",
                fontSize: 26,
                color: ui.text,
                textWrap: "balance",
              }}
            >
              {selected === "daily" ? "Trophée gagné !" : pendingReward?.title}
            </h3>
            <p
              style={{
                margin: "0 0 18px",
                fontFamily: ui.fontBody,
                fontWeight: 600,
                color: ui.textSoft,
                textWrap: "balance",
              }}
            >
              {selected === "daily"
                ? `+${dailyBonus} points bonus · ${nextStreak} matin${nextStreak > 1 ? "s" : ""} de suite !`
                : "Tu as gagné cette récompense. Bravo !"}
            </p>
            <Btn
              ui={ui}
              full
              size="lg"
              onClick={() => {
                if (selected === "daily") {
                  onDailyCollected();
                } else {
                  onCelebrate();
                  resetAnim();
                }
              }}
            >
              Génial ! 🎈
            </Btn>
          </Card>
        </div>
      ) : null}
    </Card>
  );
}

/* ============================ APP ============================ */
export function KidQuest() {
  const { user, loading } = useAuth();
  const parentId = user?.uid ?? null;
  const reduced = usePrefersReducedMotion();

  const [children, setChildren] = useState<Child[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [storedChildId, setStoredChildId] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(ACTIVE_CHILD_KEY)
  );
  const [tab, setTab] = useState<Tab>("home");
  const [burstKey, setBurstKey] = useState(0);
  const [wonPrize, setWonPrize] = useState<{ tier: RewardTier; reward: Reward } | null>(null);

  const soundEnabled = useSyncExternalStore(
    subscribeToSound,
    getSoundSnapshot,
    getServerSoundSnapshot
  );

  useEffect(() => {
    if (!parentId) {
      return;
    }
    const unsubscribe = subscribeChildren(parentId, setChildren);
    return () => {
      unsubscribe();
      setChildren([]);
    };
  }, [parentId]);

  const activeChildId = useMemo(() => {
    if (storedChildId && children.some((child) => child.id === storedChildId)) {
      return storedChildId;
    }
    return children[0]?.id ?? null;
  }, [storedChildId, children]);

  const activeChild = useMemo(
    () => children.find((child) => child.id === activeChildId) ?? null,
    [children, activeChildId]
  );

  // Le son de validation suit l'enfant actif (preset ou enregistrement perso).
  useEffect(() => {
    setActiveTaskSound({
      id: activeChild?.soundId ?? "default",
      customUrl: activeChild?.customSound ?? null,
    });
  }, [activeChild?.soundId, activeChild?.customSound]);

  useEffect(() => {
    if (!parentId || !activeChildId) {
      return;
    }
    const unsubMissions = subscribeMissions(parentId, activeChildId, setMissions);
    const unsubRewards = subscribeRewards(parentId, activeChildId, setRewards);
    return () => {
      unsubMissions();
      unsubRewards();
      setMissions([]);
      setRewards([]);
    };
  }, [parentId, activeChildId]);

  // Reset quotidien : une fois par jour et par enfant sur cet appareil.
  useEffect(() => {
    if (!parentId || !activeChildId || missions.length === 0) {
      return;
    }
    const guardKey = `lennyapp-reset-${activeChildId}`;
    const today = todayKey();
    if (window.localStorage.getItem(guardKey) === today) {
      return;
    }
    const needsReset = missions.some((mission) => mission.status !== "pending");
    if (!needsReset) {
      window.localStorage.setItem(guardKey, today);
      return;
    }
    void resetDailyMissions(
      parentId,
      activeChildId,
      missions.map((mission) => ({ id: mission.id }))
    ).then(() => window.localStorage.setItem(guardKey, today));
  }, [parentId, activeChildId, missions]);

  // Thème résolu pour l'enfant actif (style + personnage + couleur de blob).
  const ui = useMemo(
    () =>
      resolveKidTheme(
        activeChild?.theme ?? null,
        activeChild?.character ?? null,
        activeChild?.blobColor ?? null
      ),
    [activeChild?.theme, activeChild?.character, activeChild?.blobColor]
  );

  const doneCount = useMemo(
    () => missions.filter((mission) => mission.status === "done").length,
    [missions]
  );
  const allDone = missions.length > 0 && doneCount === missions.length;

  // Gamification : série de matins et coffre du jour.
  const streak = activeChild?.streak ?? 0;
  const chestClaimedToday = activeChild?.lastStreakDay === todayKey();
  const canClaimChest = allDone && !chestClaimedToday;
  // Série que vaudrait le prochain coffre (pour afficher son palier avant ouverture).
  const nextStreak = chestClaimedToday
    ? streak
    : activeChild?.lastStreakDay === yesterdayKey()
      ? streak + 1
      : 1;
  const dailyTier = tierForStreak(nextStreak);

  function selectChild(childId: string) {
    window.localStorage.setItem(ACTIVE_CHILD_KEY, childId);
    setStoredChildId(childId);
  }

  async function handleToggleMission(mission: Mission) {
    if (!parentId || !activeChildId) {
      return;
    }
    const nextStatus = mission.status === "done" ? "pending" : "done";
    await setMissionStatus(parentId, activeChildId, mission.id, nextStatus);

    if (nextStatus === "done") {
      const willBeAllDone = doneCount + 1 === missions.length;
      playCue(willBeAllDone ? "unlock" : "task");
      setBurstKey((value) => value + 1);
    }
  }

  // Tire une récompense dans un coffre à points (dépense atomique).
  // Utilisé par la modale de l'accueil ET par la scène 3D de l'onglet Coffre.
  async function drawTierReward(tier: RewardTier): Promise<Reward | null> {
    if (!parentId || !activeChildId || !activeChild) {
      return null;
    }
    const pool = rewards.filter((reward) => reward.tier === tier);
    if (activeChild.totalPoints < CHEST_COSTS[tier] || pool.length === 0) {
      return null;
    }
    const result = await openChest(
      parentId,
      activeChildId,
      tier,
      pool.map((reward) => reward.id)
    );
    if (!result) {
      return null;
    }
    return pool.find((entry) => entry.id === result.rewardId) ?? null;
  }

  function celebrate() {
    playCue("reward");
    setBurstKey((value) => value + 1);
  }

  async function handleOpenRewardChest(tier: RewardTier) {
    const reward = await drawTierReward(tier);
    if (!reward) {
      return;
    }
    setWonPrize({ tier, reward });
    celebrate();
  }

  async function handleDailyChestCollected() {
    if (!parentId || !activeChildId || !canClaimChest) {
      return;
    }
    const result = await claimDailyChest(parentId, activeChildId);
    if (result) {
      celebrate();
    }
    setTab("home");
  }

  // Personnalisation (persistée sur le profil de l'enfant).
  function pickTheme(theme: ThemeId) {
    if (!parentId || !activeChildId) return;
    playCue("task");
    // Changer de thème remet la couleur du blob à celle du nouveau thème.
    void updateChild(parentId, activeChildId, { theme, blobColor: null });
  }
  function pickCharacter(character: CharacterId) {
    if (!parentId || !activeChildId) return;
    playCue("task");
    void updateChild(parentId, activeChildId, { character });
  }
  function pickBlobColor(blobColor: string | null) {
    if (!parentId || !activeChildId) return;
    playCue("task");
    void updateChild(parentId, activeChildId, { blobColor });
  }

  if (loading) {
    return (
      <CenteredCard>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 17 }}>Chargement…</p>
      </CenteredCard>
    );
  }

  if (!user) {
    return (
      <CenteredCard>
        <PiLockFill
          aria-hidden="true"
          style={{ margin: "0 auto", width: 48, height: 48, color: "#ff5d8f" }}
        />
        <h1
          style={{
            margin: "16px 0 0",
            fontFamily: "var(--font-baloo)",
            fontWeight: 800,
            fontSize: 34,
            lineHeight: 1,
          }}
        >
          Bonjour !
        </h1>
        <p style={{ margin: "12px 0 0", fontWeight: 700, lineHeight: 1.7, color: "#9a8aa3" }}>
          Demande à un parent de se connecter pour préparer tes missions.
        </p>
        <Link
          href="/parent"
          className="skad-focus"
          style={{
            display: "inline-block",
            marginTop: 24,
            background: "linear-gradient(160deg,#ff9bbb,#ff4f86)",
            color: "#fff",
            fontWeight: 800,
            padding: "13px 26px",
            borderRadius: 18,
            boxShadow: "0 10px 20px -8px rgba(255,93,143,.8)",
          }}
        >
          Espace parent
        </Link>
      </CenteredCard>
    );
  }

  if (!activeChild) {
    return (
      <CenteredCard>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-baloo)",
            fontWeight: 800,
            fontSize: 34,
            lineHeight: 1,
          }}
        >
          Presque prêt
        </h1>
        <p style={{ margin: "12px 0 0", fontWeight: 700, lineHeight: 1.7, color: "#9a8aa3" }}>
          Ajoute un enfant et ses missions dans l&apos;espace parent.
        </p>
        <Link
          href="/parent"
          className="skad-focus"
          style={{
            display: "inline-block",
            marginTop: 24,
            background: "linear-gradient(160deg,#ff9bbb,#ff4f86)",
            color: "#fff",
            fontWeight: 800,
            padding: "13px 26px",
            borderRadius: 18,
            boxShadow: "0 10px 20px -8px rgba(255,93,143,.8)",
          }}
        >
          Espace parent
        </Link>
      </CenteredCard>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: ui.bg,
        color: ui.text,
        fontFamily: `${ui.fontBody}, system-ui, sans-serif`,
        transition: "background .5s",
      }}
    >
      <TextureOverlay ui={ui} />
      <ConfettiBurst burstKey={burstKey} />

      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "14px clamp(14px,3vw,22px) 60px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <TopBar
          ui={ui}
          child={activeChild}
          tab={tab}
          setTab={setTab}
          soundEnabled={soundEnabled}
        />
        <div style={{ height: 18 }} />

        {tab === "home" ? (
          <Dashboard
            ui={ui}
            child={activeChild}
            kids={children}
            missions={missions}
            doneCount={doneCount}
            chestReady={canClaimChest}
            chestClaimedToday={chestClaimedToday}
            dailyTier={dailyTier}
            rewards={rewards}
            goMissions={() => setTab("missions")}
            goChest={() => setTab("chest")}
            onOpenRewardChest={handleOpenRewardChest}
            onSelectChild={selectChild}
            onPickTheme={pickTheme}
            onPickCharacter={pickCharacter}
            onPickBlobColor={pickBlobColor}
          />
        ) : null}
        {tab === "missions" ? (
          <MissionsScreen
            ui={ui}
            childName={activeChild.name}
            missions={missions}
            doneCount={doneCount}
            chestClaimedToday={chestClaimedToday}
            onToggle={handleToggleMission}
            goChest={() => setTab("chest")}
          />
        ) : null}
        {tab === "chest" ? (
          <ChestScreen
            key={`${activeChild.id}-${canClaimChest}`}
            ui={ui}
            reduced={reduced}
            child={activeChild}
            rewards={rewards}
            chestReady={canClaimChest}
            chestClaimedToday={chestClaimedToday}
            dailyTier={dailyTier}
            nextStreak={nextStreak}
            onDailyCollected={handleDailyChestCollected}
            drawTierReward={drawTierReward}
            onCelebrate={celebrate}
          />
        ) : null}
      </div>

      {/* récompense gagnée (coffre à points) */}
      {wonPrize ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "grid",
            placeItems: "center",
            background: "rgba(10,8,30,.5)",
            backdropFilter: "blur(4px)",
            padding: 16,
          }}
          onClick={() => setWonPrize(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="kid-prize-title"
            onClick={(event) => event.stopPropagation()}
            style={{ width: "min(380px,100%)" }}
          >
            <Card
              ui={ui}
              style={{
                textAlign: "center",
                background: ui.glass ? "rgba(30,22,70,.92)" : ui.surface,
                animation: "skadPop .5s cubic-bezier(.34,1.8,.5,1) both",
                padding: 28,
              }}
            >
              <div
                style={{
                  fontSize: 64,
                  marginBottom: 8,
                  animation: "skadFloat 2s ease-in-out infinite",
                }}
                aria-hidden="true"
              >
                {wonPrize.reward.icon}
              </div>
              <Pill ui={ui} style={{ marginBottom: 8 }}>
                {REWARD_TIERS.find((chest) => chest.tier === wonPrize.tier)?.chestName}
              </Pill>
              <h2
                id="kid-prize-title"
                style={{
                  margin: "6px 0 4px",
                  fontFamily: ui.fontTitle,
                  fontWeight: ui.titleWeight,
                  textTransform: ui.titleUpper ? "uppercase" : "none",
                  fontSize: 28,
                  color: ui.text,
                }}
              >
                {wonPrize.reward.title}
              </h2>
              <p
                style={{
                  margin: "0 0 18px",
                  fontFamily: ui.fontBody,
                  fontWeight: 600,
                  color: ui.textSoft,
                }}
              >
                Tu as gagné cette récompense. Bravo !
              </p>
              <Btn ui={ui} full size="lg" onClick={() => setWonPrize(null)}>
                Trop bien ! 🎈
              </Btn>
            </Card>
          </div>
        </div>
      ) : null}
    </main>
  );
}
