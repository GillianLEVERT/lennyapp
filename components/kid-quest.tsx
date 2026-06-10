"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  PiGearSixFill,
  PiLockFill,
  PiSpeakerHighFill,
  PiSpeakerSlashFill,
  PiStarFill,
} from "react-icons/pi";
import { ConfettiBurst } from "@/components/confetti-burst";
import { useAuth } from "@/components/auth-provider";
import {
  claimReward,
  resetDailyMissions,
  setMissionStatus,
  subscribeChildren,
  subscribeMissions,
  subscribeRewards,
  type Child,
  type Mission,
  type Reward,
} from "@/lib/firestore-data";
import {
  getServerSoundSnapshot,
  getSoundSnapshot,
  playCue,
  subscribeToSound,
  toggleSound,
} from "@/lib/feedback";

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

function todayKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
  const [openedReward, setOpenedReward] = useState<Reward | null>(null);

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

  async function handleClaimReward(reward: Reward) {
    if (!parentId || !activeChildId || !activeChild) {
      return;
    }
    if (reward.isUnlocked || activeChild.totalPoints < reward.pointsCost) {
      return;
    }
    await claimReward(parentId, activeChildId, reward.id);
    playCue("reward");
    setBurstKey((value) => value + 1);
    setOpenedReward(reward);
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
                <span aria-hidden="true">{activeChild.avatar}</span> Salut{" "}
                {activeChild.name}
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
                  <span aria-hidden="true">{child.avatar}</span>
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

        <section className="panel-card p-5 sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker">Récompenses</p>
              <h2 className="mt-3 font-display text-4xl leading-none text-foreground">
                À débloquer
              </h2>
            </div>
            <div className="count-pill">{activeChild.totalPoints} pts</div>
          </div>

          {rewards.length === 0 ? (
            <p className="rounded-2xl bg-[color:var(--surface-soft)] p-5 text-center text-base font-bold text-[color:var(--ink-soft)]">
              Pas encore de récompense. Demande à un parent d&apos;en créer.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => {
                const reached = activeChild.totalPoints >= reward.pointsCost;
                const claimable = reached && !reward.isUnlocked;
                const ratio = reward.pointsCost
                  ? Math.min(1, activeChild.totalPoints / reward.pointsCost)
                  : 1;

                return (
                  <button
                    type="button"
                    key={reward.id}
                    disabled={!claimable}
                    onClick={() => handleClaimReward(reward)}
                    className={`reward-card reward-card-button ${reward.isUnlocked ? "reward-card--ready" : ""}`}
                  >
                    <div className="reward-card-head">
                      <span className="text-4xl" aria-hidden="true">
                        {reward.icon}
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-black text-foreground">
                      {reward.title}
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-[color:var(--ink-soft)]">
                      {reward.isUnlocked
                        ? "Débloquée !"
                        : claimable
                          ? "Prête à débloquer"
                          : `${reward.pointsCost} points`}
                    </p>
                    <div className="mt-4">
                      <div className="reward-progress-head">
                        <span>Progression</span>
                        <span>
                          {Math.min(activeChild.totalPoints, reward.pointsCost)}/
                          {reward.pointsCost}
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

      {openedReward ? (
        <div className="modal-backdrop" onClick={() => setOpenedReward(null)}>
          <div
            className="chest-modal-card chest-modal-card--gold chest-modal-card--revealed p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kid-reward-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="reward-prize-card text-center text-6xl">
              <span aria-hidden="true">{openedReward.icon}</span>
            </div>
            <h2
              id="kid-reward-title"
              className="mt-4 text-center text-3xl font-black text-foreground"
            >
              {openedReward.title}
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-center text-base font-bold leading-7 text-[color:var(--ink-soft)]">
              Récompense débloquée. Bravo !
            </p>
            <button
              type="button"
              onClick={() => setOpenedReward(null)}
              className="task-button mt-6 w-full bg-[color:var(--primary)] text-white"
            >
              Trop bien
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
