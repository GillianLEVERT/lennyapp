"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  PiGearSixFill,
  PiLockFill,
  PiSpeakerHighFill,
  PiSpeakerSlashFill,
  PiStarFill,
  PiTreasureChestFill,
} from "react-icons/pi";
import { ConfettiBurst } from "@/components/confetti-burst";
import { useAuth } from "@/components/auth-provider";
import {
  CHEST_COSTS,
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
import { ChildAvatar } from "@/components/child-avatar";

const ACTIVE_CHILD_KEY = "lennyapp-kid-child";

// Habillage visuel des cartes mission (jusqu'à 6), repris de l'ADN couleur.
const MISSION_THEMES = [
  { gradient: "linear-gradient(145deg, #fff5f7 0%, #ffe0e7 100%)", accent: "#FF4D63", button: "#FF4D63", buttonText: "#FFFFFF" },
  { gradient: "linear-gradient(145deg, #fffdf4 0%, #ffeaa1 100%)", accent: "#D89A00", button: "#FFD447", buttonText: "#15254B" },
  { gradient: "linear-gradient(145deg, #f4f8ff 0%, #cfe1ff 100%)", accent: "#2E5BFF", button: "#2E5BFF", buttonText: "#FFFFFF" },
  { gradient: "linear-gradient(145deg, #fff7ef 0%, #ffd2a6 100%)", accent: "#F06C00", button: "#F06C00", buttonText: "#FFFFFF" },
  { gradient: "linear-gradient(145deg, #f3fdf6 0%, #c8f4d8 100%)", accent: "#2CCB73", button: "#2CCB73", buttonText: "#FFFFFF" },
  { gradient: "linear-gradient(145deg, #faf5ff 0%, #e7d6ff 100%)", accent: "#7C4DFF", button: "#7C4DFF", buttonText: "#FFFFFF" },
] as const;

function TrophyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <path
        d="M22 10h20v9c0 10-4 17-10 22-6-5-10-12-10-22v-9Z"
        fill="currentColor"
      />
      <path
        d="M18 14H10v4c0 7 4 11 11 13M46 14h8v4c0 7-4 11-11 13"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 42h12v5a6 6 0 0 0 6 6H20a6 6 0 0 0 6-6v-5Z"
        fill="currentColor"
      />
      <rect x="18" y="53" width="28" height="6" rx="3" fill="currentColor" />
    </svg>
  );
}

function ChestGlyph({ tier, className }: { tier: RewardTier; className?: string }) {
  return (
    <PiTreasureChestFill
      aria-hidden="true"
      className={`chest-glyph chest-glyph--${tier} ${className ?? ""}`.trim()}
    />
  );
}

function RewardPrize({ tier }: { tier: RewardTier }) {
  if (tier === "bronze") {
    return (
      <div className="prize-art prize-art--badge" aria-hidden="true">
        <span className="badge-star" />
        <span className="badge-ribbon badge-ribbon--left" />
        <span className="badge-ribbon badge-ribbon--right" />
      </div>
    );
  }

  if (tier === "silver") {
    return (
      <div className="prize-art prize-art--gamepad" aria-hidden="true">
        <span className="gamepad-pad" />
        <span className="gamepad-button gamepad-button--one" />
        <span className="gamepad-button gamepad-button--two" />
      </div>
    );
  }

  return (
    <div className="prize-art prize-art--gift" aria-hidden="true">
      <span className="gift-ribbon gift-ribbon--vertical" />
      <span className="gift-ribbon gift-ribbon--horizontal" />
      <span className="gift-bow gift-bow--left" />
      <span className="gift-bow gift-bow--right" />
    </div>
  );
}

function RewardChest({
  tier,
  revealed,
  onOpened,
}: {
  tier: RewardTier;
  revealed: boolean;
  onOpened: () => void;
}) {
  return (
    <div
      className={`chest-scene chest-scene--${tier} ${revealed ? "chest-scene--revealed" : ""}`}
      aria-hidden="true"
    >
      <div className="chest-rays" />
      <span className="chest-spark chest-spark--one" />
      <span className="chest-spark chest-spark--two" />
      <span className="chest-spark chest-spark--three" />
      <div className="mobile-chest">
        <div className="chest-emblem">
          <ChestGlyph tier={tier} className="chest-emblem-icon" />
        </div>
        <div className="chest-lid" onAnimationEnd={onOpened} />
        <div className="chest-body" />
        <div className="chest-lock" />
      </div>
      <div className={`prize-pop ${revealed ? "prize-pop--visible" : ""}`}>
        <RewardPrize tier={tier} />
      </div>
    </div>
  );
}

const CHEST_CELEBRATION: Record<RewardTier, string> = {
  bronze: "Coffre ouvert !",
  silver: "Bonus gagné !",
  gold: "Grand coffre gagné !",
};

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="page-stage flex min-h-screen items-center justify-center px-4 py-8">
      <section className="panel-card mx-auto w-full max-w-md p-7 text-center">
        {children}
      </section>
    </main>
  );
}

export function KidQuest() {
  const { user, loading } = useAuth();
  const parentId = user?.uid ?? null;

  const [children, setChildren] = useState<Child[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [storedChildId, setStoredChildId] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(ACTIVE_CHILD_KEY)
  );
  const [burstKey, setBurstKey] = useState(0);
  const [lastTappedId, setLastTappedId] = useState<string | null>(null);
  const [openedChest, setOpenedChest] = useState<RewardTier | null>(null);
  const [chestRevealReady, setChestRevealReady] = useState(false);
  const [wonPrize, setWonPrize] = useState<{
    tier: RewardTier;
    reward: Reward;
  } | null>(null);
  const [prizeRevealReady, setPrizeRevealReady] = useState(false);

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

  const doneCount = useMemo(
    () => missions.filter((mission) => mission.status === "done").length,
    [missions]
  );
  const allDone = missions.length > 0 && doneCount === missions.length;
  const progressPercent = missions.length
    ? (doneCount / missions.length) * 100
    : 0;

  // Gamification : série de matins, coffre du jour et grille de trophées.
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
  const trophyCount = Math.max(6, Math.min(12, Math.max(streak, 6)));
  const trophySlots = useMemo(
    () =>
      Array.from({ length: trophyCount }, (_, index) => index < streak),
    [trophyCount, streak]
  );

  function selectChild(childId: string) {
    window.localStorage.setItem(ACTIVE_CHILD_KEY, childId);
    setStoredChildId(childId);
  }

  async function handleToggleMission(mission: Mission) {
    if (!parentId || !activeChildId) {
      return;
    }
    const nextStatus = mission.status === "done" ? "pending" : "done";
    setLastTappedId(null);
    window.requestAnimationFrame(() => setLastTappedId(mission.id));

    await setMissionStatus(parentId, activeChildId, mission.id, nextStatus);

    if (nextStatus === "done") {
      const willBeAllDone = doneCount + 1 === missions.length;
      playCue(willBeAllDone ? "unlock" : "task");
      setBurstKey((value) => value + 1);
    }
  }

  async function handleOpenRewardChest(tier: RewardTier) {
    if (!parentId || !activeChildId || !activeChild) {
      return;
    }
    const pool = rewards.filter((reward) => reward.tier === tier);
    if (activeChild.totalPoints < CHEST_COSTS[tier] || pool.length === 0) {
      return;
    }
    const result = await openChest(
      parentId,
      activeChildId,
      tier,
      pool.map((reward) => reward.id)
    );
    if (!result) {
      return;
    }
    const reward = pool.find((entry) => entry.id === result.rewardId);
    if (!reward) {
      return;
    }
    setPrizeRevealReady(false);
    setWonPrize({ tier, reward });
    playCue("reward");
    setBurstKey((value) => value + 1);
  }

  function handleCloseWonPrize() {
    setWonPrize(null);
    setPrizeRevealReady(false);
  }

  async function handleOpenDailyChest() {
    if (!parentId || !activeChildId || !canClaimChest) {
      return;
    }
    const result = await claimDailyChest(parentId, activeChildId);
    if (!result) {
      return;
    }
    setChestRevealReady(false);
    setOpenedChest(result.tier);
    playCue("reward");
    setBurstKey((value) => value + 1);
  }

  function handleCloseChest() {
    setOpenedChest(null);
    setChestRevealReady(false);
  }

  if (loading) {
    return (
      <CenteredCard>
        <p className="text-lg font-black text-[color:var(--ink-soft)]">
          Chargement…
        </p>
      </CenteredCard>
    );
  }

  if (!user) {
    return (
      <CenteredCard>
        <PiLockFill
          aria-hidden="true"
          className="mx-auto h-12 w-12 text-[color:var(--primary)]"
        />
        <h1 className="mt-4 font-display text-4xl leading-none text-foreground">
          Bonjour !
        </h1>
        <p className="mt-3 text-base font-bold leading-7 text-[color:var(--ink-soft)]">
          Demande à un parent de se connecter pour préparer tes missions.
        </p>
        <Link
          href="/parent"
          className="task-button mt-6 inline-block bg-[color:var(--primary)] text-white"
        >
          Espace parent
        </Link>
      </CenteredCard>
    );
  }

  if (!activeChild) {
    return (
      <CenteredCard>
        <h1 className="font-display text-4xl leading-none text-foreground">
          Presque prêt
        </h1>
        <p className="mt-3 text-base font-bold leading-7 text-[color:var(--ink-soft)]">
          Ajoute un enfant et ses missions dans l&apos;espace parent.
        </p>
        <Link
          href="/parent"
          className="task-button mt-6 inline-block bg-[color:var(--primary)] text-white"
        >
          Espace parent
        </Link>
      </CenteredCard>
    );
  }

  return (
    <main className="page-stage min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <ConfettiBurst burstKey={burstKey} />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="hero-panel p-5 text-white sm:p-7">
          <div className="hero-actions">
            <button
              type="button"
              onClick={() => toggleSound()}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? "Couper le son" : "Activer le son"}
              className="sound-toggle"
            >
              {soundEnabled ? (
                <PiSpeakerHighFill aria-hidden="true" className="sound-toggle-icon" />
              ) : (
                <PiSpeakerSlashFill aria-hidden="true" className="sound-toggle-icon" />
              )}
            </button>
            <Link href="/parent" aria-label="Espace parent" className="sound-toggle">
              <PiGearSixFill aria-hidden="true" className="sound-toggle-icon" />
            </Link>
          </div>

          <div className="hero-grid">
            <div>
              <div className="hero-kicker">
                <ChildAvatar
                  avatar={activeChild.avatar}
                  photoURL={activeChild.photoURL}
                  name={activeChild.name}
                  size={28}
                />
                Salut {activeChild.name}
              </div>
              <h1 className="mt-5 font-display text-[clamp(3.4rem,9vw,6rem)] leading-[0.9] tracking-[0.02em]">
                Skadoush
              </h1>
              <p className="hero-subcopy mt-4">
                Termine tes missions du matin et gagne des points.
              </p>

              <div className="mt-7 space-y-3">
                <div className="flex items-center justify-between text-sm font-extrabold uppercase tracking-[0.08em] text-white">
                  <span>Missions</span>
                  <span>
                    {doneCount}/{missions.length}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div
              className={`game-status game-status--${allDone ? "ready" : "locked"}`}
              aria-live="polite"
            >
              <div className="game-status-orbit">
                <PiStarFill aria-hidden="true" className="game-status-icon" />
              </div>
              <p className="game-status-kicker">Points</p>
              <h2 className="game-status-title">{activeChild.totalPoints}</h2>
              <p className="game-status-copy">
                {allDone
                  ? "Toutes les missions sont faites. Bravo !"
                  : "Termine tes missions pour gagner des points."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="hero-console p-4">
              <div className="hero-console-line">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-white/80">
                  Trophées
                </p>
                <span className="hero-console-icon-badge">
                  <TrophyMark className="hero-console-icon hero-console-icon--trophy" />
                </span>
              </div>
              <p className="mt-2 text-xl font-black">{streak}</p>
            </div>
            <div className="hero-console p-4">
              <div className="hero-console-line">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-white/80">
                  Coffre du jour
                </p>
                <span className="hero-console-icon-badge">
                  <ChestGlyph
                    tier={dailyTier}
                    className="hero-console-icon hero-console-icon--chest"
                  />
                </span>
              </div>
              <p className="mt-2 text-xl font-black">
                {chestClaimedToday ? "Ouvert" : canClaimChest ? "Prêt !" : "Verrouillé"}
              </p>
            </div>
          </div>

          {children.length > 1 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => selectChild(child.id)}
                  aria-pressed={child.id === activeChildId}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition ${
                    child.id === activeChildId
                      ? "border-white bg-white/20 text-white"
                      : "border-white/30 text-white/70"
                  }`}
                >
                  <ChildAvatar
                    avatar={child.avatar}
                    photoURL={child.photoURL}
                    name={child.name}
                    size={24}
                  />
                  {child.name}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="panel-card p-5 sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker">Missions</p>
              <h2 className="mt-3 font-display text-4xl leading-none text-foreground">
                Tes cartes
              </h2>
            </div>
            <div className="count-pill">
              {doneCount}/{missions.length}
            </div>
          </div>

          {missions.length === 0 ? (
            <p className="rounded-2xl bg-[color:var(--surface-soft)] p-5 text-center text-base font-bold text-[color:var(--ink-soft)]">
              Aucune mission pour le moment. Un parent peut les ajouter dans
              l&apos;espace parent.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {missions.map((mission, index) => {
                const theme = MISSION_THEMES[index % MISSION_THEMES.length];
                const done = mission.status === "done";

                return (
                  <button
                    type="button"
                    key={mission.id}
                    aria-pressed={done}
                    onClick={() => handleToggleMission(mission)}
                    className={`task-card task-card-button ${done ? "task-card--done" : ""} ${lastTappedId === mission.id ? "task-card--tap" : ""}`}
                    style={{ background: done ? undefined : theme.gradient }}
                  >
                    <div className="relative z-10 flex h-full flex-col p-5">
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl"
                          style={{ backgroundColor: done ? "#D9F7E4" : `${theme.accent}1F` }}
                        >
                          <span aria-hidden="true">{mission.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div
                            className="task-chip"
                            style={{
                              backgroundColor: done ? "#D9F7E4" : `${theme.accent}22`,
                              color: done ? "#14653B" : theme.accent,
                            }}
                          >
                            {done ? "Fait" : `+${mission.points} pts`}
                          </div>
                          <h3 className="mt-3 text-2xl font-black leading-tight text-foreground">
                            {mission.title}
                          </h3>
                          {mission.description ? (
                            <p className="mt-2 text-base leading-7 text-[color:var(--ink-soft)]">
                              {mission.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div
                        className="task-action-pill mt-5"
                        style={{
                          backgroundColor: done ? "#E8F7EE" : theme.button,
                          color: done ? "#14653B" : theme.buttonText,
                        }}
                      >
                        {done ? "Fait !" : "C'est fait"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <section className="panel-card overflow-hidden p-5 sm:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-kicker">Coffres</p>
                  <h2 className="mt-3 font-display text-4xl leading-none text-foreground">
                    Coffres bonus
                  </h2>
                </div>
                <div className="count-pill">
                  {chestClaimedToday ? "Ouvert" : canClaimChest ? "1 coffre" : "Aucun"}
                </div>
              </div>

              <div className="treasure-claim p-5">
                <div className="treasure-claim-head">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-white/80">
                      Coffre du jour
                    </p>
                    <h3 className="mt-2 text-3xl font-black text-white">
                      {canClaimChest
                        ? `${REWARD_TIERS.find((reward) => reward.tier === dailyTier)?.chestName} prêt`
                        : chestClaimedToday
                          ? "Coffre ouvert"
                          : "Coffre verrouillé"}
                    </h3>
                    <p className="mt-2 text-base font-bold leading-7 text-white/86">
                      {canClaimChest
                        ? "Bravo, ouvre ton coffre !"
                        : chestClaimedToday
                          ? "Demain, un nouveau coffre t'attend."
                          : "Termine toutes tes missions pour le gagner."}
                    </p>
                  </div>
                  <div className="treasure-claim-glyph">
                    <ChestGlyph tier={dailyTier} className="treasure-claim-icon" />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!canClaimChest}
                  onClick={handleOpenDailyChest}
                  className="task-button mt-5 w-full bg-white text-[color:var(--primary)] disabled:bg-white/70 disabled:text-[color:var(--primary)]"
                >
                  {canClaimChest
                    ? "Ouvrir"
                    : chestClaimedToday
                      ? "Déjà ouvert"
                      : "Pas encore"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {REWARD_TIERS.map((reward) => {
                const isReady = canClaimChest && dailyTier === reward.tier;
                const cycleProgress = streak % reward.threshold;
                const ratio = isReady
                  ? 1
                  : reward.tier === "bronze"
                    ? missions.length
                      ? doneCount / missions.length
                      : 0
                    : streak > 0 && cycleProgress === 0
                      ? 1
                      : cycleProgress / reward.threshold;
                const progressLabel = isReady
                  ? "Prêt"
                  : reward.tier === "bronze"
                    ? `${doneCount}/${missions.length || 0}`
                    : `${streak > 0 && cycleProgress === 0 ? reward.threshold : cycleProgress}/${reward.threshold}`;

                return (
                  <div
                    key={reward.tier}
                    className={`reward-card reward-card--${reward.tier} ${isReady ? "reward-card--ready" : ""}`}
                  >
                    <div className="reward-card-head">
                      <div
                        className={`mini-chest mini-chest--${reward.tier}`}
                        aria-hidden="true"
                      >
                        <ChestGlyph tier={reward.tier} className="mini-chest-icon" />
                      </div>
                    </div>
                    <div
                      className="reward-label"
                      style={{
                        backgroundColor: `${reward.accent}22`,
                        color: reward.accent,
                      }}
                    >
                      {reward.label}
                    </div>
                    <h3 className="mt-4 text-xl font-black text-foreground">
                      {reward.chestName}
                    </h3>
                    <div className="mt-4">
                      <div className="reward-progress-head">
                        <span>Progression</span>
                        <span>{progressLabel}</span>
                      </div>
                      <div className="reward-progress">
                        <span style={{ width: `${Math.min(1, ratio) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel-card p-5 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Trophées</p>
                <h2 className="mt-3 font-display text-4xl leading-none text-foreground">
                  Tes trophées
                </h2>
              </div>
              <div className="count-pill">{streak}</div>
            </div>

            <div className="trophy-hero mt-5">
              <div className="trophy-hero-icon">
                <TrophyMark className="h-14 w-14" />
              </div>
              <div>
                <p className="text-4xl font-black text-foreground">{streak}</p>
                <p className="mt-1 text-sm font-bold text-[color:var(--ink-soft)]">
                  1 trophée = 1 matin de suite
                </p>
              </div>
            </div>

            <div className="trophy-grid mt-5">
              {trophySlots.map((earned, index) => (
                <div
                  key={`trophy-${index}`}
                  className={`trophy-slot ${earned ? "trophy-slot--earned" : ""}`}
                >
                  <TrophyMark className="h-10 w-10" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="panel-card p-5 sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker">Récompenses</p>
              <h2 className="mt-3 font-display text-4xl leading-none text-foreground">
                Coffres à ouvrir
              </h2>
            </div>
            <div className="count-pill">{activeChild.totalPoints} pts</div>
          </div>

          {rewards.length === 0 ? (
            <p className="rounded-2xl bg-[color:var(--surface-soft)] p-5 text-center text-base font-bold text-[color:var(--ink-soft)]">
              Pas encore de récompense. Demande à un parent d&apos;en glisser dans
              les coffres.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {REWARD_TIERS.map((chest) => {
                const pool = rewards.filter(
                  (reward) => reward.tier === chest.tier
                );
                const cost = CHEST_COSTS[chest.tier];
                const affordable = activeChild.totalPoints >= cost;
                const openable = affordable && pool.length > 0;
                const ratio = Math.min(1, activeChild.totalPoints / cost);

                return (
                  <button
                    type="button"
                    key={chest.tier}
                    disabled={!openable}
                    onClick={() => handleOpenRewardChest(chest.tier)}
                    className={`reward-card reward-card-button reward-card--${chest.tier} ${openable ? "reward-card--ready" : ""}`}
                  >
                    <div className="reward-card-head">
                      <div
                        className={`mini-chest mini-chest--${chest.tier}`}
                        aria-hidden="true"
                      >
                        <ChestGlyph
                          tier={chest.tier}
                          className="mini-chest-icon"
                        />
                      </div>
                      <div className="reward-stack-count">{cost} pts</div>
                    </div>
                    <h3 className="mt-4 text-xl font-black text-foreground">
                      {chest.chestName}
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-[color:var(--ink-soft)]">
                      {pool.length === 0
                        ? "Coffre vide"
                        : openable
                          ? "Prêt à ouvrir !"
                          : `${pool.length} surprise${pool.length > 1 ? "s" : ""} dedans`}
                    </p>
                    <div className="mt-4">
                      <div className="reward-progress-head">
                        <span>Progression</span>
                        <span>
                          {Math.min(activeChild.totalPoints, cost)}/{cost}
                        </span>
                      </div>
                      <div className="reward-progress">
                        <span style={{ width: `${ratio * 100}%` }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {openedChest ? (
        <div className="modal-backdrop" onClick={handleCloseChest}>
          <div
            className={`chest-modal-card chest-modal-card--${openedChest} ${chestRevealReady ? "chest-modal-card--revealed" : "chest-modal-card--opening"} p-6`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="kid-chest-title"
            onClick={(event) => event.stopPropagation()}
          >
            <RewardChest
              tier={openedChest}
              revealed={chestRevealReady}
              onOpened={() => setChestRevealReady(true)}
            />

            <div
              className={`reward-reveal ${chestRevealReady ? "reward-reveal--ready" : ""}`}
              aria-live="polite"
            >
              {chestRevealReady ? (
                <>
                  <div className="reward-prize-card">
                    <RewardPrize tier={openedChest} />
                  </div>
                  <p className="mx-auto mt-4 w-fit rounded-full bg-[color:var(--surface-soft)] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.08em] text-foreground">
                    {REWARD_TIERS.find((reward) => reward.tier === openedChest)?.chestName}
                  </p>
                  <h2
                    id="kid-chest-title"
                    className="mt-4 text-center text-3xl font-black text-foreground"
                  >
                    {CHEST_CELEBRATION[openedChest]}
                  </h2>
                  <p className="mx-auto mt-3 max-w-sm text-center text-base font-bold leading-7 text-[color:var(--ink-soft)]">
                    Série de {streak} matin{streak > 1 ? "s" : ""} de suite. Continue !
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseChest}
                    className="task-button mt-6 w-full bg-[color:var(--primary)] text-white"
                  >
                    Trop bien
                  </button>
                </>
              ) : (
                <p
                  id="kid-chest-title"
                  className="chest-opening-copy text-center text-2xl font-black text-foreground"
                >
                  Ça arrive...
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {wonPrize ? (
        <div className="modal-backdrop" onClick={handleCloseWonPrize}>
          <div
            className={`chest-modal-card chest-modal-card--${wonPrize.tier} ${prizeRevealReady ? "chest-modal-card--revealed" : "chest-modal-card--opening"} p-6`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="kid-prize-title"
            onClick={(event) => event.stopPropagation()}
          >
            <RewardChest
              tier={wonPrize.tier}
              revealed={prizeRevealReady}
              onOpened={() => setPrizeRevealReady(true)}
            />

            <div
              className={`reward-reveal ${prizeRevealReady ? "reward-reveal--ready" : ""}`}
              aria-live="polite"
            >
              {prizeRevealReady ? (
                <>
                  <div className="reward-prize-card text-center text-6xl">
                    <span aria-hidden="true">{wonPrize.reward.icon}</span>
                  </div>
                  <p className="mx-auto mt-4 w-fit rounded-full bg-[color:var(--surface-soft)] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.08em] text-foreground">
                    {REWARD_TIERS.find((chest) => chest.tier === wonPrize.tier)?.chestName}
                  </p>
                  <h2
                    id="kid-prize-title"
                    className="mt-4 text-center text-3xl font-black text-foreground"
                  >
                    {wonPrize.reward.title}
                  </h2>
                  <p className="mx-auto mt-3 max-w-sm text-center text-base font-bold leading-7 text-[color:var(--ink-soft)]">
                    Tu as gagné cette récompense. Bravo !
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseWonPrize}
                    className="task-button mt-6 w-full bg-[color:var(--primary)] text-white"
                  >
                    Trop bien
                  </button>
                </>
              ) : (
                <p
                  id="kid-prize-title"
                  className="chest-opening-copy text-center text-2xl font-black text-foreground"
                >
                  Ça arrive...
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
