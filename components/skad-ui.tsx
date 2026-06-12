"use client";

// Skadoush — primitives UI pilotées par le thème (KidTheme).
// Portées depuis le prototype Claude Design : chaque composant lit ses
// tokens (couleurs, rayon, ombres, glass, glossy) dans l'objet `ui`.

import { useEffect, useRef, useState } from "react";
import { mix, rgba, type KidTheme } from "@/lib/themes";

export const CARD_PAD = 22;
export const STACK_GAP = 18;

interface PillProps {
  ui: KidTheme;
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}

export function Pill({ ui, children, color, style }: PillProps) {
  const c = color ?? ui.primary;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: ui.fontBody,
        fontWeight: 800,
        fontSize: 11,
        letterSpacing: ".09em",
        textTransform: "uppercase",
        color: c,
        background: rgba(c, ui.glass ? 0.22 : 0.13),
        padding: "5px 11px",
        borderRadius: 999,
        lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

interface ProgressBarProps {
  ui: KidTheme;
  value: number;
  max: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ ui, value, max, color, height = 12 }: ProgressBarProps) {
  const c = color ?? ui.primary;
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      style={{
        height,
        borderRadius: 999,
        background: rgba(ui.text, ui.glass ? 0.18 : 0.1),
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${pct}%`,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${c}, ${mix(c, "#ffffff", 0.35)})`,
          boxShadow: `0 0 14px ${rgba(c, 0.6)}`,
          transition: "width .6s cubic-bezier(.34,1.56,.64,1)",
        }}
      />
    </div>
  );
}

interface IconTileProps {
  ui: KidTheme;
  glyph?: string;
  node?: React.ReactNode;
  color?: string;
  size?: number;
  radius?: number;
}

// Tuile icône : emoji (ou nœud SVG) dans une pastille colorée bombée.
export function IconTile({ ui, glyph, node, color, size = 48, radius }: IconTileProps) {
  const c = color ?? ui.primary;
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: radius ?? ui.radius * 0.55,
        display: "grid",
        placeItems: "center",
        fontSize: size * 0.5,
        lineHeight: 1,
        background: `linear-gradient(150deg, ${mix(c, "#ffffff", 0.25)}, ${c})`,
        boxShadow: ui.glossy
          ? `inset 0 2px 4px rgba(255,255,255,.6), 0 6px 14px -6px ${rgba(c, 0.7)}`
          : `0 6px 14px -6px ${rgba(c, 0.7)}`,
        border: ui.stroke ? `${ui.stroke}px solid ${ui.strokeColor}` : "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,.18))",
          display: "grid",
          placeItems: "center",
        }}
      >
        {node ?? glyph}
      </span>
    </div>
  );
}

interface CardProps {
  ui: KidTheme;
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function Card({ ui, children, style, accent, onClick, interactive }: CardProps) {
  const [press, setPress] = useState(false);
  return (
    <div
      onClick={onClick}
      onPointerDown={interactive ? () => setPress(true) : undefined}
      onPointerUp={interactive ? () => setPress(false) : undefined}
      onPointerLeave={interactive ? () => setPress(false) : undefined}
      style={{
        background: ui.surface,
        backdropFilter: ui.glass ? "blur(18px) saturate(160%)" : "none",
        WebkitBackdropFilter: ui.glass ? "blur(18px) saturate(160%)" : "none",
        borderRadius: ui.radius,
        padding: CARD_PAD,
        boxShadow: ui.shadowSoft,
        border: ui.glass
          ? `1px solid ${rgba(ui.text, 0.14)}`
          : ui.stroke
            ? `${ui.stroke}px solid ${ui.strokeColor}`
            : `1px solid ${rgba(ui.text, 0.05)}`,
        color: ui.text,
        position: "relative",
        transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s",
        cursor: interactive ? "pointer" : "default",
        transform: press ? "scale(.975)" : "none",
        ...style,
      }}
    >
      {accent ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            background: `linear-gradient(150deg, ${rgba(accent, 0.14)}, transparent 60%)`,
          }}
        />
      ) : null}
      {children}
    </div>
  );
}

interface BtnProps {
  ui: KidTheme;
  children: React.ReactNode;
  onClick?: () => void;
  kind?: "primary" | "ghost";
  color?: string;
  full?: boolean;
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
  ariaLabel?: string;
}

export function Btn({
  ui,
  children,
  onClick,
  kind = "primary",
  color,
  full,
  size = "md",
  glow,
  style,
  disabled,
  ariaLabel,
}: BtnProps) {
  const c = color ?? ui.primary;
  const [press, setPress] = useState(false);
  const pad = size === "lg" ? "16px 26px" : size === "sm" ? "9px 16px" : "13px 22px";
  const fs = size === "lg" ? 19 : size === "sm" ? 14 : 16;

  let bg: string;
  let col: string;
  let bd: string;
  let sh: string;
  if (kind === "primary") {
    bg = `linear-gradient(160deg, ${mix(c, "#ffffff", 0.22)}, ${c})`;
    col = ui.textOnAccent;
    bd = ui.stroke ? `${ui.stroke}px solid ${ui.strokeColor}` : "none";
    sh = disabled
      ? "none"
      : ui.glossy
        ? `inset 0 2px 3px rgba(255,255,255,.55), 0 10px 20px -8px ${rgba(c, 0.8)}`
        : ui.stroke
          ? `4px 4px 0 ${ui.strokeColor}`
          : `0 12px 22px -8px ${rgba(c, 0.7)}`;
  } else {
    bg = rgba(c, ui.glass ? 0.18 : 0.12);
    col = c;
    bd = `1.5px solid ${rgba(c, 0.35)}`;
    sh = "none";
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerDown={() => setPress(true)}
      onPointerUp={() => setPress(false)}
      onPointerLeave={() => setPress(false)}
      className="skad-focus"
      style={{
        appearance: "none",
        border: bd,
        background: disabled ? rgba(ui.text, 0.12) : bg,
        color: disabled ? rgba(ui.text, 0.4) : col,
        fontFamily: ui.fontBody,
        fontWeight: 800,
        fontSize: fs,
        letterSpacing: ".01em",
        padding: pad,
        borderRadius: ui.radius * 0.7,
        cursor: disabled ? "not-allowed" : "pointer",
        width: full ? "100%" : "auto",
        boxShadow: sh,
        transform: press && !disabled ? "scale(.95) translateY(1px)" : "none",
        transition: "transform .12s cubic-bezier(.34,1.56,.64,1), box-shadow .15s, filter .15s",
        filter: glow && !disabled ? "saturate(1.1)" : "none",
        animation: glow && !disabled ? "skadPulse 1.6s ease-in-out infinite" : "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

interface CounterProps {
  value: number;
  style?: React.CSSProperties;
}

// Compteur animé : interpole vers la nouvelle valeur (snap si onglet caché).
export function Counter({ value, style }: CounterProps) {
  const [disp, setDisp] = useState(value);
  const fromRef = useRef(value);
  const raf = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    const t0 = performance.now();
    const dur = 600;
    cancelAnimationFrame(raf.current);
    const tick = (t: number) => {
      // Onglet caché : pas d'animation possible, on saute à la valeur finale.
      const k = document.hidden ? 1 : Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const next = Math.round(from + (to - from) * e);
      fromRef.current = next;
      setDisp(next);
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <span style={style}>{disp}</span>;
}

interface SectionTitleProps {
  ui: KidTheme;
  kicker: string;
  title: string;
  right?: React.ReactNode;
  color?: string;
}

export function SectionTitle({ ui, kicker, title, right, color }: SectionTitleProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 14,
      }}
    >
      <div>
        <Pill ui={ui} color={color}>
          {kicker}
        </Pill>
        <h2
          style={{
            margin: "8px 0 0",
            fontFamily: ui.fontTitle,
            fontWeight: ui.titleWeight,
            textTransform: ui.titleUpper ? "uppercase" : "none",
            fontSize: "clamp(24px,3.4vw,34px)",
            color: ui.text,
            lineHeight: 1,
            letterSpacing: ui.titleUpper ? ".01em" : "-.01em",
          }}
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

// Texture plein écran derrière le contenu (bulles / grille néon / étoiles).
export function TextureOverlay({ ui }: { ui: KidTheme }) {
  if (ui.texture === "grid") {
    return (
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.5,
          backgroundImage: `linear-gradient(${rgba(ui.scene.groundEdge, 0.12)} 1px,transparent 1px),linear-gradient(90deg,${rgba(ui.scene.groundEdge, 0.12)} 1px,transparent 1px)`,
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(circle at 50% 0%,#000,transparent 75%)",
        }}
      />
    );
  }
  if (ui.texture === "stars") {
    return (
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `radial-gradient(${rgba("#ffffff", 0.5)} 1px,transparent 1px),radial-gradient(${rgba(ui.scene.sparkle, 0.4)} 1px,transparent 1px)`,
          backgroundSize: "120px 120px,180px 180px",
          backgroundPosition: "0 0,60px 90px",
        }}
      />
    );
  }
  // bubbles
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.6,
        backgroundImage: `radial-gradient(circle at 12% 22%,${rgba(ui.accents[1], 0.1)} 0 60px,transparent 61px),radial-gradient(circle at 86% 14%,${rgba(ui.accents[2], 0.1)} 0 90px,transparent 91px),radial-gradient(circle at 72% 82%,${rgba(ui.primary, 0.08)} 0 120px,transparent 121px)`,
      }}
    />
  );
}
