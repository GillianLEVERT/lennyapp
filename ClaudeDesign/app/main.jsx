/* Skadoush — écrans + orchestrateur + tweaks. */

/* ---------------- son (WebAudio léger) ---------------- */
const Sound = (() => {
  let ctx = null, on = true;
  const ac = () => (ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)()));
  function blip(freq = 440, dur = 0.12, type = "sine", gain = 0.08) {
    if (!on) return;
    try {
      const c = ac(); const o = c.createOscillator(); const g = c.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(gain, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + dur);
    } catch (e) {}
  }
  return {
    set(v) { on = v; },
    tap() { blip(520, 0.08, "triangle", 0.05); },
    done() { blip(660, 0.1, "sine", 0.06); setTimeout(() => blip(880, 0.12, "sine", 0.06), 90); },
    win() {[523,659,784,1046].forEach((f,i)=>setTimeout(()=>blip(f,0.16,"triangle",0.07),i*110));},
    open() { blip(300, 0.18, "sawtooth", 0.05); setTimeout(() => blip(700, 0.25, "triangle", 0.06), 160); },
  };
})();

/* ---------------- overlay texture de fond ---------------- */
function TextureOverlay({ ui }) {
  const c = rgba(ui.text, ui.glass ? 0.06 : 0.045);
  if (ui.texture === "grid") {
    return <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", opacity: 0.5,
      backgroundImage: `linear-gradient(${rgba(ui.scene.groundEdge,.12)} 1px,transparent 1px),linear-gradient(90deg,${rgba(ui.scene.groundEdge,.12)} 1px,transparent 1px)`,
      backgroundSize: "44px 44px", maskImage: "radial-gradient(circle at 50% 0%,#000,transparent 75%)",
    }} />;
  }
  if (ui.texture === "stars") {
    return <div style={{
      position: "fixed", inset: 0, pointerEvents: "none",
      backgroundImage: `radial-gradient(${rgba("#ffffff",.5)} 1px,transparent 1px),radial-gradient(${rgba(ui.scene.sparkle,.4)} 1px,transparent 1px)`,
      backgroundSize: "120px 120px,180px 180px", backgroundPosition: "0 0,60px 90px",
    }} />;
  }
  // bubbles
  return <div style={{
    position: "fixed", inset: 0, pointerEvents: "none", opacity: 0.6,
    backgroundImage: `radial-gradient(circle at 12% 22%,${rgba(ui.accents[1],.1)} 0 60px,transparent 61px),radial-gradient(circle at 86% 14%,${rgba(ui.accents[2],.1)} 0 90px,transparent 91px),radial-gradient(circle at 72% 82%,${rgba(ui.primary,.08)} 0 120px,transparent 121px)`,
  }} />;
}

/* ---------------- en-tête persistant ---------------- */
function TopBar({ ui, points, tab, setTab, character }) {
  const tabs = [["home", "Accueil"], ["missions", "Missions"], ["chest", "Coffre"]];
  return (
    <div style={{ display: "grid", gap: 12, padding: "4px 2px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 52, height: 52 }}><BlobMascot ui={ui} size={52} character={character} waveKey={character} /></div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: ui.fontBody, fontWeight: 800, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: ui.textSoft }}>Salut</div>
            <div style={{ fontFamily: ui.fontTitle, fontWeight: ui.titleWeight, fontSize: 20, color: ui.text }}>Lenny</div>
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "7px 14px 7px 10px",
          borderRadius: 999, background: rgba(ui.accents[3], ui.glass ? 0.22 : 0.16),
        }}>
          <span style={{ fontSize: 18 }}>⭐</span>
          <Counter value={points} style={{ fontFamily: ui.fontTitle, fontWeight: ui.titleWeight, fontSize: 20, color: ui.text, fontVariantNumeric: "tabular-nums" }} />
          <span style={{ fontFamily: ui.fontBody, fontWeight: 700, fontSize: 12, color: ui.textSoft }}>pts</span>
        </div>
      </div>

      <div style={{
        display: "flex", gap: 4, padding: 4, justifySelf: "center",
        borderRadius: 999, background: rgba(ui.text, ui.glass ? 0.12 : 0.06),
        backdropFilter: ui.glass ? "blur(10px)" : "none",
      }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => { Sound.tap(); setTab(id); }} style={{
            appearance: "none", border: "none", cursor: "pointer",
            fontFamily: ui.fontBody, fontWeight: 800, fontSize: 14,
            padding: "9px 18px", borderRadius: 999,
            color: tab === id ? ui.textOnAccent : ui.textSoft,
            background: tab === id ? `linear-gradient(160deg,${mix(ui.primary,"#fff",.2)},${ui.primary})` : "transparent",
            boxShadow: tab === id && ui.showShadow ? `0 6px 14px -6px ${rgba(ui.primary,.7)}` : "none",
            transition: "all .2s",
          }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- titre de section ---------------- */
function SectionTitle({ ui, kicker, title, right, color }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
      <div>
        <Pill ui={ui} color={color}>{kicker}</Pill>
        <h2 style={{
          margin: "8px 0 0", fontFamily: ui.fontTitle, fontWeight: ui.titleWeight,
          fontStyle: ui.titleItalic ? "italic" : "normal",
          textTransform: ui.titleUpper ? "uppercase" : "none",
          fontSize: "clamp(24px,3.4vw,34px)", color: ui.text, lineHeight: 1, letterSpacing: ui.titleUpper ? ".01em" : "-.01em",
        }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}

/* ---------------- carte mission ---------------- */
function MissionCard({ ui, m, onDone, color }) {
  const c = color || ui.primary;
  return (
    <Card ui={ui} accent={c} style={{
      background: m.done ? rgba(c, ui.glass ? 0.2 : 0.1) : ui.surface,
      opacity: 1, overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <IconTile ui={ui} glyph={m.glyph} color={c} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Pill ui={ui} color={c} style={{ marginBottom: 6 }}>+{m.pts} pts</Pill>
          <div style={{
            fontFamily: ui.fontBody, fontWeight: 800, fontSize: 19, color: ui.text,
            textDecoration: m.done ? "line-through" : "none", textDecorationColor: rgba(ui.text, .35),
          }}>{m.label}</div>
        </div>
        {m.done && <div style={{
          width: 34, height: 34, borderRadius: "50%", background: c, display: "grid", placeItems: "center",
          color: ui.textOnAccent, fontWeight: 900, animation: "skadPop .4s cubic-bezier(.34,1.8,.5,1)",
        }}>✓</div>}
      </div>
      <Btn ui={ui} color={c} full disabled={m.done} onClick={() => { Sound.done(); onDone(m.id); }}>
        {m.done ? "Bravo ! ✨" : "C'est fait !"}
      </Btn>
    </Card>
  );
}

/* ---------------- DASHBOARD ---------------- */
function Dashboard({ ui, points, missions, doneCount, trophies, chestReady, goMissions, goChest, rewardChests, character, setCharacter }) {
  const allDone = doneCount === missions.length;
  return (
    <div style={{ display: "grid", gap: ui.gap, animation: "skadIn .45s ease both" }}>
      {/* HERO */}
      <Card ui={ui} style={{
        background: `linear-gradient(150deg, ${ui.heroGrad[0]}, ${ui.heroGrad[1]})`,
        color: "#fff", padding: ui.cardPad + 6, overflow: "hidden", border: ui.stroke ? `${ui.stroke}px solid ${ui.strokeColor}` : "none",
      }}>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "stretch" }}>
          <div style={{ flex: "1 1 320px", minWidth: 0 }}>
            <span style={{
              display: "inline-flex", gap: 6, alignItems: "center", fontFamily: ui.fontBody, fontWeight: 800,
              fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", whiteSpace: "nowrap",
              background: "rgba(255,255,255,.22)", color: "#fff", padding: "6px 12px", borderRadius: 999,
            }}>🦊 Salut Lenny</span>
            <h1 style={{
              margin: "14px 0 0", fontFamily: ui.fontTitle, fontWeight: ui.titleWeight,
              fontStyle: ui.titleItalic ? "italic" : "normal", textTransform: ui.titleUpper ? "uppercase" : "none",
              fontSize: "clamp(40px,7vw,72px)", lineHeight: .92, color: "#fff",
              textShadow: "0 4px 16px rgba(0,0,0,.18)", letterSpacing: ui.titleUpper ? "0" : "-.02em",
            }}>Skadoush</h1>
            <p style={{ margin: "12px 0 18px", fontFamily: ui.fontBody, fontWeight: 600, fontSize: 16, color: "rgba(255,255,255,.92)", maxWidth: 360 }}>
              Termine tes missions du matin et gagne des points.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: ui.fontBody, fontWeight: 800, fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(255,255,255,.85)", marginBottom: 8 }}>
              <span>Missions</span><span>{doneCount}/{missions.length}</span>
            </div>
            <div style={{ background: "rgba(255,255,255,.28)", borderRadius: 999, height: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", width: (doneCount / missions.length * 100) + "%", background: "#fff", borderRadius: 999, transition: "width .6s cubic-bezier(.34,1.56,.64,1)", boxShadow: "0 0 12px rgba(255,255,255,.7)" }} />
            </div>
            <div style={{ marginTop: 20 }}>
              <Btn ui={ui} kind="primary" size="lg" color="#fff" style={{ color: ui.primary }} glow={!allDone}
                onClick={() => { Sound.tap(); allDone ? goChest() : goMissions(); }}>
                {allDone ? "🎁 Ouvrir le coffre !" : "Faire mes missions →"}
              </Btn>
            </div>
          </div>
          <div style={{
            flex: "0 0 240px", display: "grid", placeItems: "center", gap: 8,
            background: "rgba(255,255,255,.14)", borderRadius: ui.radius, padding: "18px 16px", minWidth: 210,
          }}>
            <div style={{ position: "relative", width: 150, height: 150, display: "grid", placeItems: "center" }}>
              <BlobMascot ui={ui} size={150} character={character} waveKey={character} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 22 }}>⭐</span>
              <Counter value={points} style={{ fontFamily: ui.fontTitle, fontWeight: ui.titleWeight, fontSize: 40, color: "#fff", lineHeight: 1 }} />
              <span style={{ fontFamily: ui.fontBody, fontWeight: 800, fontSize: 13, color: "rgba(255,255,255,.85)" }}>pts</span>
            </div>
            <CharacterPicker ui={ui} character={character} setCharacter={setCharacter} />
          </div>
        </div>
        {/* sous-tuiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
          <div style={{ background: "rgba(255,255,255,.16)", borderRadius: ui.radius * .8, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div><div style={{ fontFamily: ui.fontBody, fontWeight: 800, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.8)", whiteSpace: "nowrap" }}>Trophées</div><div style={{ fontFamily: ui.fontTitle, fontWeight: ui.titleWeight, fontSize: 28, color: "#fff" }}>{trophies}</div></div>
            <span style={{ fontSize: 30 }}>🏆</span>
          </div>
          <div style={{ background: "rgba(255,255,255,.16)", borderRadius: ui.radius * .8, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div><div style={{ fontFamily: ui.fontBody, fontWeight: 800, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.8)", whiteSpace: "nowrap" }}>Coffre du jour</div><div style={{ fontFamily: ui.fontTitle, fontWeight: ui.titleWeight, fontSize: 22, color: "#fff" }}>{chestReady ? "Prêt !" : "Verrouillé"}</div></div>
            <span style={{ fontSize: 30, display: "grid", placeItems: "center" }}>{chestReady ? "🎉" : <ChestIcon ui={ui} color={ui.accents[0]} size={34} character={character} />}</span>
          </div>
        </div>
      </Card>

      {/* TES CARTES (aperçu) */}
      <Card ui={ui}>
        <SectionTitle ui={ui} kicker="Missions" title="Tes cartes" color={ui.accents[1]}
          right={<Pill ui={ui} color={ui.accents[1]}>{doneCount}/{missions.length}</Pill>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
          {missions.map((m, i) => (
            <div key={m.id} onClick={() => { Sound.tap(); goMissions(); }} style={{ cursor: "pointer" }}>
              <Card ui={ui} interactive accent={ui.accents[i % ui.accents.length]} style={{ background: rgba(ui.accents[i % ui.accents.length], ui.glass ? 0.16 : 0.08) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <IconTile ui={ui} glyph={m.glyph} color={ui.accents[i % ui.accents.length]} size={44} />
                  <div>
                    <div style={{ fontFamily: ui.fontBody, fontWeight: 800, fontSize: 16, color: ui.text }}>{m.label}</div>
                    <div style={{ fontFamily: ui.fontBody, fontWeight: 700, fontSize: 12, color: ui.textSoft }}>{m.done ? "✓ Terminé" : `+${m.pts} pts`}</div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </Card>

      {/* COFFRES À OUVRIR */}
      <Card ui={ui}>
        <SectionTitle ui={ui} kicker="Récompenses" title="Coffres à ouvrir" color={ui.accents[2]}
          right={<Pill ui={ui} color={ui.accents[2]}>{points} pts</Pill>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
          {rewardChests.map((rc) => {
            const pct = Math.min(100, (points / rc.cost) * 100);
            const ready = points >= rc.cost;
            return (
              <Card ui={ui} key={rc.id} accent={rc.color} style={{ background: rgba(rc.color, ui.glass ? 0.14 : 0.07) }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <IconTile ui={ui} node={<ChestIcon ui={ui} color={rc.color} size={30} character={character} />} color={rc.color} size={48} />
                  <Pill ui={ui} color={rc.color}>{rc.cost} pts</Pill>
                </div>
                <div style={{ fontFamily: ui.fontTitle, fontWeight: ui.titleWeight, fontSize: 20, color: ui.text, margin: "14px 0 4px" }}>{rc.name}</div>
                <div style={{ fontFamily: ui.fontBody, fontWeight: 600, fontSize: 13, color: ui.textSoft, marginBottom: 12 }}>{ready ? "Prêt à ouvrir !" : rc.desc}</div>
                <ProgressBar ui={ui} value={Math.min(points, rc.cost)} max={rc.cost} color={rc.color} height={10} />
                <div style={{ fontFamily: ui.fontBody, fontWeight: 800, fontSize: 11, color: ui.textSoft, textAlign: "right", marginTop: 6 }}>{Math.min(points, rc.cost)}/{rc.cost}</div>
              </Card>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ---------------- MISSIONS ---------------- */
function Missions({ ui, missions, onDone, doneCount, goChest }) {
  const allDone = doneCount === missions.length;
  return (
    <div style={{ display: "grid", gap: ui.gap, animation: "skadIn .45s ease both" }}>
      <Card ui={ui}>
        <SectionTitle ui={ui} kicker="Routine du matin" title="Tes missions"
          right={<Pill ui={ui}>{doneCount}/{missions.length}</Pill>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
          {missions.map((m, i) => (
            <MissionCard key={m.id} ui={ui} m={m} color={ui.accents[i % ui.accents.length]} onDone={onDone} />
          ))}
        </div>
      </Card>

      <Card ui={ui} style={{
        background: allDone ? `linear-gradient(150deg,${ui.heroGrad[0]},${ui.heroGrad[1]})` : ui.surface,
        textAlign: "center", color: allDone ? "#fff" : ui.text,
        transition: "background .4s",
      }}>
        <div style={{ fontSize: 44, marginBottom: 8, animation: allDone ? "skadFloat 1.6s ease-in-out infinite" : "none" }}>{allDone ? "🎉" : "🧰"}</div>
        <h3 style={{ margin: "0 0 6px", fontFamily: ui.fontTitle, fontWeight: ui.titleWeight, fontSize: 26, color: allDone ? "#fff" : ui.text }}>
          {allDone ? "Tout est terminé !" : "Le coffre est verrouillé"}
        </h3>
        <p style={{ margin: "0 0 18px", fontFamily: ui.fontBody, fontWeight: 600, fontSize: 15, color: allDone ? "rgba(255,255,255,.9)" : ui.textSoft }}>
          {allDone ? "Ton coffre du jour est prêt à être ouvert." : "Termine toutes tes missions pour le débloquer."}
        </p>
        <Btn ui={ui} size="lg" disabled={!allDone} glow={allDone}
          color={allDone ? "#fff" : ui.primary} style={allDone ? { color: ui.primary } : {}}
          onClick={() => { Sound.win(); goChest(); }}>
          {allDone ? "🎁 Ouvrir le coffre !" : "Pas encore…"}
        </Btn>
      </Card>
    </div>
  );
}

/* ---------------- COFFRE (scène 3D) ---------------- */
function ChestScreen({ ui, reduced, intensity, chestReady, reward, character, onCollected }) {
  const [play, setPlay] = React.useState(false);
  const [opened, setOpened] = React.useState(false);
  React.useEffect(() => { setPlay(false); setOpened(false); }, [chestReady]);
  return (
    <Card ui={ui} style={{ padding: 0, overflow: "hidden", position: "relative", height: "min(64vh,560px)", animation: "skadIn .45s ease both" }}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg,${ui.scene.bgTop},${ui.scene.bgBottom})` }} />
      <ChestScene ui={ui} play={play} reduced={reduced} intensity={intensity} character={character} onOpened={() => { Sound.open(); setOpened(true); }} />

      {/* libellé haut */}
      <div style={{ position: "absolute", top: 18, left: 18, right: 18, display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none" }}>
        <span style={{ fontFamily: ui.fontBody, fontWeight: 800, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", whiteSpace: "nowrap", color: "#fff", background: "rgba(0,0,0,.25)", padding: "7px 14px", borderRadius: 999, backdropFilter: "blur(8px)" }}>Coffre du jour</span>
        <span style={{ fontFamily: ui.fontTitle, fontWeight: ui.titleWeight, fontSize: 22, whiteSpace: "nowrap", color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.4)" }}>{ui.emoji} {ui.name}</span>
      </div>

      {/* CTA / état */}
      {!chestReady && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", background: "rgba(0,0,0,.35)", backdropFilter: "blur(3px)" }}>
          <div>
            <div style={{ fontSize: 50, marginBottom: 10 }}>🔒</div>
            <div style={{ fontFamily: ui.fontTitle, fontWeight: ui.titleWeight, fontSize: 24, color: "#fff", marginBottom: 6 }}>Coffre verrouillé</div>
            <div style={{ fontFamily: ui.fontBody, fontWeight: 600, color: "rgba(255,255,255,.8)" }}>Termine tes missions pour le débloquer.</div>
          </div>
        </div>
      )}
      {chestReady && !play && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, display: "grid", placeItems: "center" }}>
          <Btn ui={ui} size="lg" glow color={ui.primary} onClick={() => { Sound.tap(); setPlay(true); }}>
            ✨ Ouvrir le coffre !
          </Btn>
        </div>
      )}

      {/* récompense révélée */}
      {opened && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", animation: "skadIn .4s ease both", background: "rgba(0,0,0,.25)" }}>
          <Card ui={ui} style={{ width: "min(360px,86%)", textAlign: "center", animation: "skadPop .5s cubic-bezier(.34,1.8,.5,1) both" }}>
            <div style={{ fontSize: 56, marginBottom: 8, animation: "skadFloat 2s ease-in-out infinite" }}>{reward.glyph}</div>
            <Pill ui={ui} style={{ marginBottom: 8 }}>Récompense débloquée</Pill>
            <h3 style={{ margin: "6px 0 4px", fontFamily: ui.fontTitle, fontWeight: ui.titleWeight, fontSize: 26, color: ui.text }}>{reward.name}</h3>
            <p style={{ margin: "0 0 18px", fontFamily: ui.fontBody, fontWeight: 600, color: ui.textSoft }}>+{reward.bonus} points bonus · +1 trophée 🏆</p>
            <Btn ui={ui} full size="lg" onClick={() => { Sound.win(); onCollected(reward); }}>Génial ! 🎈</Btn>
          </Card>
        </div>
      )}
    </Card>
  );
}

/* ---------------- sélecteur de personnage (in-app, pour l'enfant) ---------------- */
function CharacterPicker({ ui, character, setCharacter }) {
  const chars = window.SKAD_CHAR_ORDER;
  const C = window.SKAD_CHARACTERS;
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
      {chars.map((id) => {
        const c = C[id]; const on = id === character;
        return (
          <button key={id} onClick={() => setCharacter(id)} title={c.name} style={{
            appearance: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            padding: "7px 9px", borderRadius: 14, minWidth: 60,
            background: on ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.18)",
            color: on ? ui.primary : "#fff",
            fontFamily: ui.fontBody, fontWeight: 800, fontSize: 11,
            boxShadow: on ? "0 6px 14px -6px rgba(0,0,0,.45)" : "none",
            transform: on ? "translateY(-1px)" : "none",
            transition: "all .2s",
          }}>
            <span style={{ fontSize: 18 }}>{c.emoji}</span>{c.name}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- sélecteur de direction (3 prototypes) ---------------- */
function DirectionSwitcher({ current, onPick }) {
  const order = window.SKAD_ORDER;
  const themes = window.SKAD_THEMES;
  const T = themes[current];
  return (
    <div style={{
      display: "inline-flex", gap: 4, padding: 5, borderRadius: 999,
      background: rgba(T.text, T.glass ? 0.16 : 0.08),
      backdropFilter: "blur(12px)", border: `1px solid ${rgba(T.text, .12)}`,
      boxShadow: "0 8px 24px -10px rgba(0,0,0,.35)",
    }}>
      {order.map((id) => {
        const th = themes[id];
        const on = id === current;
        return (
          <button key={id} onClick={() => { Sound.tap(); onPick(id); }} title={th.tagline} style={{
            appearance: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7,
            fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 13,
            padding: "8px 15px", borderRadius: 999,
            color: on ? "#fff" : T.textSoft,
            background: on ? `linear-gradient(150deg,${th.heroGrad[0]},${th.heroGrad[1]})` : "transparent",
            boxShadow: on ? "0 6px 16px -6px rgba(0,0,0,.4)" : "none",
            transition: "all .22s",
          }}>
            <span style={{ fontSize: 15 }}>{th.emoji}</span>
            <span>{th.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================ APP ============================ */
const J = window.SKAD_THEMES.jelly;
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "jelly",
  "primary": "#ff5d8f",
  "fontTitle": "Baloo 2",
  "fontBody": "Nunito",
  "radius": 26,
  "speed": 100,
  "intensity": 100,
  "blobColor": "#ff7aa8",
  "shadows": true,
  "glass": false,
  "sounds": true,
  "reduced": false,
  "density": "regular",
  "character": "pirate",
  "mission1": "Se laver les dents",
  "mission2": "Boire de l'eau",
  "mission3": "Ranger sa chambre"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const reducedSys = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reduced = t.reduced || reducedSys;

  React.useEffect(() => { Sound.set(t.sounds); }, [t.sounds]);

  // thème fusionné
  const base = window.SKAD_THEMES[t.direction] || J;
  const dens = DENSITY[t.density] || DENSITY.regular;
  const ui = React.useMemo(() => ({
    ...base,
    primary: t.primary,
    fontTitle: t.fontTitle,
    fontBody: t.fontBody,
    radius: Number(t.radius),
    showShadow: t.shadows,
    glass: t.glass,
    cardPad: dens.cardPad,
    gap: dens.gap,
    animSpeed: 100 / Math.max(30, t.speed),
    scene: { ...base.scene, blob: t.blobColor, blobLit: mix(t.blobColor, "#ffffff", .4) },
  }), [t, base, dens]);

  // applique une direction (réinitialise les tokens liés au thème)
  const applyDirection = (id) => {
    const th = window.SKAD_THEMES[id];
    setTweak({
      direction: id, primary: th.primary, fontTitle: th.fontTitle, fontBody: th.fontBody,
      radius: th.radius, glass: th.glass, blobColor: th.scene.blob,
    });
  };

  // ---- état du jeu ----
  const [points, setPoints] = React.useState(0);
  const [trophies, setTrophies] = React.useState(0);
  const [tab, setTab] = React.useState("home");
  const [doneIds, setDoneIds] = React.useState([]);
  const [collected, setCollected] = React.useState(false);

  const missions = [
    { id: "m1", label: t.mission1, glyph: "🪥", pts: 10 },
    { id: "m2", label: t.mission2, glyph: "💧", pts: 10 },
    { id: "m3", label: t.mission3, glyph: "🧸", pts: 10 },
  ].map((m) => ({ ...m, done: doneIds.includes(m.id) }));
  const doneCount = missions.filter((m) => m.done).length;
  const chestReady = doneCount === missions.length;

  const rewardChests = [
    { id: "b", name: "Coffre bronze", cost: 20, color: ui.accents[0], desc: "2 surprises dedans" },
    { id: "a", name: "Coffre argent", cost: 50, color: ui.accents[1], desc: "À débloquer" },
    { id: "o", name: "Coffre doré", cost: 80, color: ui.accents[3], desc: "À débloquer" },
  ];
  const reward = { glyph: "📚", name: "Une histoire en plus", bonus: 15 };

  const doMission = (id) => {
    if (doneIds.includes(id)) return;
    const m = missions.find((x) => x.id === id);
    setDoneIds((d) => [...d, id]);
    setPoints((p) => p + (m ? m.pts : 0));
  };
  const collect = (r) => {
    if (collected) return;
    setCollected(true);
    setPoints((p) => p + r.bonus);
    setTrophies((x) => x + 1);
    setTab("home");
  };
  const resetDay = () => { setDoneIds([]); setCollected(false); };

  return (
    <div style={{
      minHeight: "100vh", background: base.bg, color: ui.text,
      fontFamily: ui.fontBody + ", system-ui, sans-serif",
      transition: "background .5s",
    }}>
      <TextureOverlay ui={ui} />

      {/* barre direction (les 3 prototypes) */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", justifyContent: "center", padding: "12px 12px 0", pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto" }}>
          <DirectionSwitcher current={t.direction} onPick={applyDirection} />
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: `14px clamp(14px,3vw,${dens.pad}px) 60px`, position: "relative", zIndex: 1 }}>
        <TopBar ui={ui} points={points} tab={tab} setTab={setTab} character={t.character} />
        <div style={{ height: 18 }} />
        {tab === "home" && <Dashboard ui={ui} points={points} missions={missions} doneCount={doneCount} trophies={trophies} chestReady={chestReady && !collected} goMissions={() => setTab("missions")} goChest={() => setTab("chest")} rewardChests={rewardChests} character={t.character} setCharacter={(id) => { Sound.tap(); setTweak("character", id); }} />}
        {tab === "missions" && <Missions ui={ui} missions={missions} onDone={doMission} doneCount={doneCount} goChest={() => setTab("chest")} />}
        {tab === "chest" && <ChestScreen ui={ui} reduced={reduced} intensity={t.intensity / 100} chestReady={chestReady && !collected} reward={reward} character={t.character} onCollected={collect} />}

        {/* reset jour discret */}
        {collected && tab === "home" && (
          <div style={{ textAlign: "center", marginTop: 22 }}>
            <Btn ui={ui} kind="ghost" onClick={() => { Sound.tap(); resetDay(); }}>↻ Recommencer une journée</Btn>
          </div>
        )}
      </div>

      {/* ---------------- TWEAKS ---------------- */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Direction (prototype)" />
        <TweakRadio label="Style" value={t.direction}
          options={[{ value: "jelly", label: "🍬" }, { value: "arcade", label: "🕹️" }, { value: "cosmic", label: "🌌" }]}
          onChange={applyDirection} />

        <TweakSection label="Personnage" />
        <TweakRadio label="Héros" value={t.character}
          options={[{ value: "pirate", label: "🏴‍☠️" }, { value: "chevalier", label: "🛡️" }, { value: "princesse", label: "👑" }]}
          onChange={(v) => setTweak("character", v)} />

        <TweakSection label="Couleurs" />
        <TweakColor label="Couleur clé" value={t.primary} options={base.accents}
          onChange={(v) => setTweak("primary", v)} />
        <TweakColor label="Couleur du blob" value={t.blobColor} options={base.accents}
          onChange={(v) => setTweak("blobColor", v)} />

        <TweakSection label="Typographie" />
        <TweakSelect label="Police titre" value={t.fontTitle} options={window.SKAD_TITLE_FONTS}
          onChange={(v) => setTweak("fontTitle", v)} />
        <TweakSelect label="Police texte" value={t.fontBody} options={window.SKAD_BODY_FONTS}
          onChange={(v) => setTweak("fontBody", v)} />

        <TweakSection label="Animation" />
        <TweakSlider label="Vitesse" value={t.speed} min={50} max={180} step={5} unit="%"
          onChange={(v) => setTweak("speed", v)} />
        <TweakSlider label="Particules" value={t.intensity} min={0} max={150} step={10} unit="%"
          onChange={(v) => setTweak("intensity", v)} />
        <TweakToggle label="Animations réduites" value={t.reduced} onChange={(v) => setTweak("reduced", v)} />

        <TweakSection label="Formes & ambiance" />
        <TweakSlider label="Arrondi" value={t.radius} min={6} max={40} step={2} unit="px"
          onChange={(v) => setTweak("radius", v)} />
        <TweakRadio label="Densité" value={t.density} options={["compact", "regular", "comfy"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakToggle label="Ombres" value={t.shadows} onChange={(v) => setTweak("shadows", v)} />
        <TweakToggle label="Glassmorphism" value={t.glass} onChange={(v) => setTweak("glass", v)} />
        <TweakToggle label="Sons" value={t.sounds} onChange={(v) => setTweak("sounds", v)} />

        <TweakSection label="Textes des missions" />
        <TweakText label="Mission 1" value={t.mission1} onChange={(v) => setTweak("mission1", v)} />
        <TweakText label="Mission 2" value={t.mission2} onChange={(v) => setTweak("mission2", v)} />
        <TweakText label="Mission 3" value={t.mission3} onChange={(v) => setTweak("mission3", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
