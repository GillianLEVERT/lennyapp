/* Skadoush — composants UI partagés. Tout est piloté par l'objet `ui`
   (thème fusionné avec les tweaks). Exporté sur window. */

/* ---------- utilitaires couleur ---------- */
function hexToRgb(hex) {
  let h = String(hex).replace("#", "");
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const n = parseInt(h.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgba(hex, a) {
  if (!hex || hex[0] !== "#") return hex;
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const r = Math.round(A.r + (B.r - A.r) * t);
  const g = Math.round(A.g + (B.g - A.g) * t);
  const bl = Math.round(A.b + (B.b - A.b) * t);
  return `rgb(${r},${g},${bl})`;
}

/* ---------- densité ---------- */
const DENSITY = {
  compact: { pad: 16, gap: 12, cardPad: 16, scale: 0.92 },
  regular: { pad: 22, gap: 18, cardPad: 22, scale: 1 },
  comfy: { pad: 30, gap: 26, cardPad: 28, scale: 1.08 },
};

/* ---------- petites briques ---------- */
function Pill({ ui, children, color, style }) {
  const c = color || ui.primary;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontFamily: ui.fontBody, fontWeight: 800, fontSize: 11, letterSpacing: ".09em",
      textTransform: "uppercase", color: c,
      background: rgba(c, ui.glass ? 0.22 : 0.13),
      padding: "5px 11px", borderRadius: 999, lineHeight: 1,
      ...style,
    }}>{children}</span>
  );
}

function ProgressBar({ ui, value, max, color, height = 12 }) {
  const c = color || ui.primary;
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{
      height, borderRadius: 999, background: rgba(ui.text, ui.glass ? 0.18 : 0.1),
      overflow: "hidden", position: "relative",
    }}>
      <div style={{
        position: "absolute", inset: 0, width: pct + "%",
        borderRadius: 999,
        background: `linear-gradient(90deg, ${c}, ${mix(c, "#ffffff", 0.35)})`,
        boxShadow: `0 0 14px ${rgba(c, 0.6)}`,
        transition: `width ${.6 * ui.animSpeed}s cubic-bezier(.34,1.56,.64,1)`,
      }} />
    </div>
  );
}

/* tuile icône (emoji dans une pastille colorée) */
function IconTile({ ui, glyph, node, color, size = 48, r }) {
  const c = color || ui.primary;
  return (
    <div style={{
      width: size, height: size, flex: "none",
      borderRadius: r ?? ui.radius * 0.55,
      display: "grid", placeItems: "center",
      fontSize: size * 0.5, lineHeight: 1,
      background: `linear-gradient(150deg, ${mix(c, "#ffffff", 0.25)}, ${c})`,
      boxShadow: ui.glossy
        ? `inset 0 2px 4px rgba(255,255,255,.6), 0 6px 14px -6px ${rgba(c, .7)}`
        : `0 6px 14px -6px ${rgba(c, .7)}`,
      border: ui.stroke ? `${ui.stroke}px solid ${ui.strokeColor}` : "none",
    }}>
      <span style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.18))", display: "grid", placeItems: "center" }}>{node || glyph}</span>
    </div>
  );
}

/* carte générique */
function Card({ ui, children, style, accent, onClick, interactive }) {
  const base = {
    background: ui.glass ? ui.surface : ui.surface,
    backdropFilter: ui.glass ? "blur(18px) saturate(160%)" : "none",
    WebkitBackdropFilter: ui.glass ? "blur(18px) saturate(160%)" : "none",
    borderRadius: ui.radius,
    padding: ui.cardPad,
    boxShadow: ui.showShadow ? ui.shadowSoft : "none",
    border: ui.glass
      ? `1px solid ${rgba(ui.text, .14)}`
      : ui.stroke ? `${ui.stroke}px solid ${ui.strokeColor}` : `1px solid ${rgba(ui.text, .05)}`,
    color: ui.text,
    position: "relative",
    transition: `transform ${.18}s cubic-bezier(.34,1.56,.64,1), box-shadow .18s`,
    cursor: interactive ? "pointer" : "default",
    ...style,
  };
  const [press, setPress] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onPointerDown={interactive ? () => setPress(true) : undefined}
      onPointerUp={interactive ? () => setPress(false) : undefined}
      onPointerLeave={interactive ? () => setPress(false) : undefined}
      style={{
        ...base,
        transform: press ? "scale(.975)" : "none",
      }}
    >
      {accent && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none",
          background: `linear-gradient(150deg, ${rgba(accent, .14)}, transparent 60%)`,
        }} />
      )}
      {children}
    </div>
  );
}

/* bouton */
function Btn({ ui, children, onClick, kind = "primary", color, full, size = "md", glow, style, disabled }) {
  const c = color || ui.primary;
  const [press, setPress] = React.useState(false);
  const pad = size === "lg" ? "16px 26px" : size === "sm" ? "9px 16px" : "13px 22px";
  const fs = size === "lg" ? 19 : size === "sm" ? 14 : 16;
  let bg, col, bd, sh;
  if (kind === "primary") {
    bg = `linear-gradient(160deg, ${mix(c, "#ffffff", 0.22)}, ${c})`;
    col = ui.textOnAccent;
    bd = ui.stroke ? `${ui.stroke}px solid ${ui.strokeColor}` : "none";
    sh = disabled ? "none" : (ui.glossy
      ? `inset 0 2px 3px rgba(255,255,255,.55), 0 10px 20px -8px ${rgba(c, .8)}`
      : ui.stroke ? `4px 4px 0 ${ui.strokeColor}` : `0 12px 22px -8px ${rgba(c, .7)}`);
  } else {
    bg = rgba(c, ui.glass ? 0.18 : 0.12);
    col = c;
    bd = `1.5px solid ${rgba(c, .35)}`;
    sh = "none";
  }
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => setPress(true)}
      onPointerUp={() => setPress(false)}
      onPointerLeave={() => setPress(false)}
      style={{
        appearance: "none", border: bd, background: disabled ? rgba(ui.text, .12) : bg,
        color: disabled ? rgba(ui.text, .4) : col,
        fontFamily: ui.fontBody, fontWeight: 800, fontSize: fs, letterSpacing: ".01em",
        padding: pad, borderRadius: ui.radius * 0.7, cursor: disabled ? "not-allowed" : "pointer",
        width: full ? "100%" : "auto", boxShadow: sh,
        transform: press && !disabled ? "scale(.95) translateY(1px)" : "none",
        transition: "transform .12s cubic-bezier(.34,1.56,.64,1), box-shadow .15s, filter .15s",
        filter: glow && !disabled ? "saturate(1.1)" : "none",
        animation: glow && !disabled ? `skadPulse ${1.6 * ui.animSpeed}s ease-in-out infinite` : "none",
        ...style,
      }}
    >{children}</button>
  );
}

/* badge étoile de points (avec rebond quand ça change) */
function StarBadge({ ui, points, size = 132 }) {
  const c = ui.accents[3] || "#ffce4d";
  const [bump, setBump] = React.useState(false);
  const prev = React.useRef(points);
  React.useEffect(() => {
    if (points !== prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 420);
      prev.current = points;
      return () => clearTimeout(t);
    }
  }, [points]);
  return (
    <div style={{ display: "grid", placeItems: "center", gap: 6 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `radial-gradient(circle at 38% 30%, ${mix(c, "#ffffff", .4)}, ${c} 62%, ${mix(c, "#ff7a3d", .5)})`,
        display: "grid", placeItems: "center",
        boxShadow: `inset 0 4px 8px rgba(255,255,255,.6), inset 0 -8px 16px ${rgba("#ff7a3d", .4)}, 0 16px 30px -10px ${rgba(c, .8)}`,
        transform: bump ? "scale(1.12)" : "scale(1)",
        transition: "transform .42s cubic-bezier(.34,1.8,.5,1)",
        position: "relative",
      }}>
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,.2))" }}>
          <path fill="#fff" d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.9l-5.8 3.05 1.1-6.45-4.7-4.6 6.5-.95z" />
        </svg>
      </div>
    </div>
  );
}

/* compteur animé */
function Counter({ value, style }) {
  const [disp, setDisp] = React.useState(value);
  const raf = React.useRef(0);
  React.useEffect(() => {
    if (document.hidden) { setDisp(value); return; }  // pas d'anim possible → snap
    const from = disp, to = value, t0 = performance.now(), dur = 600;
    cancelAnimationFrame(raf.current);
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setDisp(Math.round(from + (to - from) * e));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line
  }, [value]);
  return <span style={style}>{disp}</span>;
}

/* ---------- chapeau / accessoire selon le personnage ---------- */
function CharacterHat({ character, s }) {
  if (character === "pirate") {
    return (
      <g>
        {/* plume */}
        <path d="M72 22 Q96 4 88 -12" stroke={s.cheek} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M72 22 Q90 8 86 -7" stroke={s.blobLit} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
        {/* tricorne : large bord, pointes relevées */}
        <path d="M15 33 Q60 12 105 33 Q96 25 80 24 Q60 20 40 24 Q24 25 15 33 Z" fill="#241f30" />
        <path d="M15 33 Q60 25 105 33" fill="none" stroke="#3a3450" strokeWidth="2.5" />
        {/* crown rempli (dome plein) */}
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
  if (character === "princesse") {
    return (
      <g>
        {/* couronne */}
        <path d="M32 32 L39 15 L49 26 L60 11 L71 26 L81 15 L88 32 Z" fill="#ffd23d" stroke="#e3a900" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="39" cy="15" r="3" fill={s.cheek} />
        <circle cx="60" cy="11" r="3.4" fill={s.gem || s.cheek} />
        <circle cx="81" cy="15" r="3" fill={s.cheek} />
        <rect x="32" y="30" width="56" height="4" rx="2" fill="#e3a900" />
      </g>
    );
  }
  return null;
}

/* ---------- accessoire tenu en main (dessiné vers le haut depuis la main) ---------- */
function HandProp({ character, s }) {
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
  if (character === "princesse") {
    return (
      <g transform="translate(0,-34)">
        <rect x="-1.8" y="-40" width="3.6" height="36" rx="1.8" fill="#ffd23d" />
        <path d="M0 -54 l2.5 5 5.5 .8 -4 3.9 .9 5.5 -4.9 -2.6 -4.9 2.6 .9 -5.5 -4 -3.9 5.5 -.8 Z" fill="#ff6ec7" stroke="#fff" strokeWidth=".7" strokeLinejoin="round" />
        <circle cx="9" cy="-50" r="1.4" fill="#fff" />
        <circle cx="-8" cy="-44" r="1.1" fill="#fff" />
      </g>
    );
  }
  return null;
}

/* ---------- Mascotte blob 2D (bras, coucou à l'arrivée, perso) ---------- */
function BlobMascot({ ui, size = 120, mood = "happy", character, wave = true, waveKey = 0 }) {
  const s = ui.scene;
  const id = React.useMemo(() => "blob" + Math.random().toString(36).slice(2, 7), []);
  const spd = ui.animSpeed;
  return (
    <div style={{ width: size, height: size, animation: `skadFloat ${3 * spd}s ease-in-out infinite` }}>
      <svg viewBox="0 0 120 120" width={size} height={size} style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id={id} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor={s.blobLit} />
            <stop offset="100%" stopColor={s.blob} />
          </radialGradient>
          <filter id={id + "sh"} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor={rgba(s.blob, .5)} />
          </filter>
        </defs>
        {/* ombre au sol */}
        <ellipse cx="60" cy="112" rx="30" ry="7" fill={rgba("#000000", .12)}>
          <animate attributeName="rx" values="30;26;30" dur={`${3 * spd}s`} repeatCount="indefinite" />
        </ellipse>

        {/* corps qui respire */}
        <g filter={`url(#${id}sh)`}>
          <path fill={`url(#${id})`} d="M60 16 C84 16 100 36 100 62 C100 92 82 106 60 106 C38 106 20 92 20 62 C20 36 36 16 60 16 Z">
            <animate attributeName="d"
              dur={`${2.4 * spd}s`} repeatCount="indefinite"
              values="M60 16 C84 16 100 36 100 62 C100 92 82 106 60 106 C38 106 20 92 20 62 C20 36 36 16 60 16 Z;
                      M60 20 C86 18 98 40 98 64 C98 90 80 104 60 104 C40 104 22 90 22 64 C22 40 34 22 60 20 Z;
                      M60 16 C84 16 100 36 100 62 C100 92 82 106 60 106 C38 106 20 92 20 62 C20 36 36 16 60 16 Z" />
          </path>
        </g>
        {/* joues */}
        <circle cx="40" cy="68" r="7" fill={rgba(s.cheek, .55)} />
        <circle cx="80" cy="68" r="7" fill={rgba(s.cheek, .55)} />
        {/* yeux qui clignent */}
        <g fill="#1f1638">
          <ellipse cx="47" cy="56" rx="6" ry="8">
            <animate attributeName="ry" values="8;8;1;8;8" keyTimes="0;.45;.5;.55;1" dur={`${4 * spd}s`} repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="73" cy="56" rx="6" ry="8">
            <animate attributeName="ry" values="8;8;1;8;8" keyTimes="0;.45;.5;.55;1" dur={`${4 * spd}s`} repeatCount="indefinite" />
          </ellipse>
          <circle cx="49" cy="53" r="2" fill="#fff" />
          <circle cx="75" cy="53" r="2" fill="#fff" />
        </g>
        {/* bouche */}
        {mood === "happy"
          ? <path d="M52 76 Q60 86 68 76" stroke="#1f1638" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          : <circle cx="60" cy="80" r="4" fill="#1f1638" />}

        {/* bras gauche (tient l'accessoire, écarté vers l'extérieur et plus bas) */}
        <g transform="translate(30,84)">
          <g>
            <animateTransform attributeName="transform" type="rotate" values="-26;-33;-26" dur={`${3.4 * spd}s`} repeatCount="indefinite" />
            <rect x="-7" y="-30" width="14" height="36" rx="7" fill={s.blob} />
            <circle cx="0" cy="-30" r="9" fill={s.blobLit} />
            {character && <HandProp character={character} s={s} />}
          </g>
        </g>

        {/* bras droit (devant le corps : fait coucou à l'arrivée puis se repose) */}
        <g transform="translate(95,74)">
          <g>
            <animateTransform key={waveKey} attributeName="transform" type="rotate"
              begin={wave ? "0.3s" : "indefinite"} dur={`${2.2 * spd}s`} repeatCount="1" fill="remove"
              keyTimes="0;0.1;0.26;0.42;0.58;0.74;0.9;1"
              values="6;-118;-98;-120;-98;-120;-30;6" />
            <animateTransform attributeName="transform" type="rotate" additive="sum"
              values="0;-8;0" dur={`${3.2 * spd}s`} repeatCount="indefinite" />
            <rect x="-7" y="-2" width="14" height="33" rx="7" fill={s.blob} />
            <circle cx="0" cy="31" r="9" fill={s.blobLit} />
          </g>
        </g>

        {/* chapeau du personnage (au-dessus de tout) */}
        <CharacterHat character={character} s={s} />
      </svg>
    </div>
  );
}

/* ---------- petite icône coffre dessinée (remplace l'emoji valise) ---------- */
function ChestIcon({ ui, color, size = 30, character }) {
  const c = color || (ui && ui.primary) || "#c98a4a";
  const wood = mix(c, "#2a1a0c", 0.12);
  const dark = mix(c, "#000000", 0.32);
  const band = ui ? (ui.scene ? ui.scene.chestMetal : "#ffe7a3") : "#ffe7a3";
  const gold = "#ffd23d";
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 32 26" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.22))" }}>
      {/* couvercle */}
      <path d="M3 12 Q16 1 29 12 L29 13 L3 13 Z" fill={dark} />
      <path d="M3 12 Q16 1 29 12" fill="none" stroke={band} strokeWidth="1.6" />
      {/* corps */}
      <rect x="3" y="12.5" width="26" height="11.5" rx="2.4" fill={wood} />
      <rect x="3" y="12.5" width="26" height="11.5" rx="2.4" fill="none" stroke={dark} strokeWidth="1" />
      {/* bandes */}
      <rect x="14" y="9" width="4" height="15" fill={band} rx="1" />
      {/* serrure */}
      <rect x="14.4" y="13.6" width="3.2" height="4.4" rx="1" fill={gold} stroke={dark} strokeWidth=".6" />
      {/* emblème personnage */}
      {character === "pirate" && <circle cx="9" cy="18" r="2.1" fill="#fff" />}
      {character === "chevalier" && <path d="M22 14 l3 1 v3 l-3 2 l-3-2 v-3 Z" fill={band} stroke={dark} strokeWidth=".5" />}
      {character === "princesse" && <path d="M9 16.4 a1.6 1.6 0 0 1 3 1 a1.6 1.6 0 0 1 3 -1 q0 2-3 3.4 q-3-1.4-3-3.4 Z" fill="#ff6ec7" />}
    </svg>
  );
}

window.ChestIcon = ChestIcon;

Object.assign(window, {
  hexToRgb, rgba, mix, DENSITY,
  Pill, ProgressBar, IconTile, Card, Btn, StarBadge, Counter, BlobMascot, ChestIcon, CharacterHat,
});
