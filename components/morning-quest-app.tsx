"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { PiTreasureChestFill } from "react-icons/pi";
import { ConfettiBurst } from "@/components/confetti-burst";
import { TaskIcon } from "@/components/task-icons";
import {
  claimReward,
  getCompletedCount,
  getLongDateLabel,
  getPendingRewards,
  getRewardProgress,
  getServerStoredStateSnapshot,
  getStoredStateSnapshot,
  getStreak,
  isGameUnlocked,
  REWARD_OPTIONS,
  subscribeToMorningQuest,
  syncStateToToday,
  TASKS,
  toggleTask,
  type RewardDefinition,
  type RewardHistoryEntry,
  type RewardTier,
  type TaskDefinition,
  type TaskId,
  writeStoredState,
} from "@/lib/morning-quest";

function getRewardProgressLabel(
  reward: RewardDefinition,
  completedCount: number,
  streak: number,
  isReady: boolean
) {
  if (isReady) {
    return "Prêt";
  }

  if (reward.tier === "bronze") {
    return `${completedCount}/4`;
  }

  const cycleProgress = streak % reward.threshold;
  const progress =
    streak > 0 && cycleProgress === 0 ? reward.threshold : cycleProgress;

  return `${progress}/${reward.threshold}`;
}

function TrophyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
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

function ChestGlyph({
  tier,
  className,
}: {
  tier: RewardTier;
  className?: string;
}) {
  return (
    <PiTreasureChestFill
      aria-hidden="true"
      className={`chest-glyph chest-glyph--${tier} ${className ?? ""}`.trim()}
    />
  );
}

function getRewardCelebrationCopy(reward: RewardHistoryEntry): string {
  if (reward.tier === "bronze") {
    return "Bonbon gagné !";
  }

  if (reward.tier === "silver") {
    return "1 heure gagnée !";
  }

  return "Gros cadeau gagné !";
}

function RewardPrize({ tier }: { tier: RewardTier }) {
  if (tier === "bronze") {
    return (
      <div className="prize-art prize-art--candy" aria-hidden="true">
        <span className="candy-stick" />
        <span className="candy-shell" />
        <span className="candy-swirl candy-swirl--one" />
        <span className="candy-swirl candy-swirl--two" />
        <span className="candy-swirl candy-swirl--three" />
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

export function MorningQuestApp() {
  const [burstKey, setBurstKey] = useState(0);
  const [lastTappedTaskId, setLastTappedTaskId] = useState<TaskId | null>(null);
  const [openedReward, setOpenedReward] = useState<RewardHistoryEntry | null>(
    null
  );
  const [rewardRevealReady, setRewardRevealReady] = useState(false);
  const state = useSyncExternalStore(
    subscribeToMorningQuest,
    getStoredStateSnapshot,
    getServerStoredStateSnapshot
  );

  const completedCount = getCompletedCount(state);
  const progressPercent = (completedCount / TASKS.length) * 100;
  const unlockedGame = isGameUnlocked(state);
  const streak = getStreak(state);
  const todayLabel = getLongDateLabel(state.activeDate);
  const pendingRewards = useMemo(() => getPendingRewards(state), [state]);
  const pendingCountsByTier = useMemo(
    () =>
      pendingRewards.reduce<Record<RewardTier, number>>(
        (counts, reward) => {
          counts[reward.tier] += 1;
          return counts;
        },
        { bronze: 0, silver: 0, gold: 0 }
      ),
    [pendingRewards]
  );
  const nextReward = pendingRewards[0] ?? null;
  const trophySlots = useMemo(
    () =>
      Array.from(
        { length: Math.max(6, Math.min(12, Math.max(streak, 6))) },
        (_, index) => index < streak
      ),
    [streak]
  );

  function triggerTaskTap(taskId: TaskId) {
    setLastTappedTaskId(null);
    window.requestAnimationFrame(() => setLastTappedTaskId(taskId));
  }

  function handleToggleTask(task: TaskDefinition) {
    const syncedState = syncStateToToday(state);
    const result = toggleTask(syncedState, task.id);

    writeStoredState(result.nextState);
    triggerTaskTap(task.id);

    if (result.celebration !== "none") {
      setBurstKey((value) => value + 1);
    }
  }

  function handleClaimReward(rewardId?: string) {
    const result = claimReward(state, rewardId);

    if (!result.reward) {
      return;
    }

    writeStoredState(result.nextState);
    setRewardRevealReady(false);
    setOpenedReward(result.reward);
    setBurstKey((value) => value + 1);
  }

  function handleCloseReward() {
    setOpenedReward(null);
    setRewardRevealReady(false);
  }

  return (
    <main className="page-stage min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <ConfettiBurst burstKey={burstKey} />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="hero-panel p-5 text-white sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr] lg:items-center">
            <div>
              <div className="hero-kicker">{todayLabel}</div>
              <h1 className="mt-5 font-display text-[clamp(3.6rem,9vw,6.6rem)] leading-[0.9] tracking-[0.02em]">
                Mission du matin
              </h1>

              <p className="mt-4 text-2xl font-black leading-tight text-white">
                4 images à toucher.
              </p>

              <div className="mt-7 space-y-3">
                <div className="flex items-center justify-between text-sm font-extrabold uppercase tracking-[0.08em] text-white">
                  <span>Images</span>
                  <span>
                    {completedCount}/{TASKS.length}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="hero-console p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-white/80">
                    Jeu
                  </p>
                  <p className="mt-2 text-xl font-black">
                    {unlockedGame ? "Débloqué" : "Fermé"}
                  </p>
                </div>
                <div className="hero-console p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-white/80">
                    Trophées
                  </p>
                  <p className="mt-2 text-xl font-black">
                    {streak}
                  </p>
                </div>
                <div className="hero-console p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-white/80">
                    Coffres
                  </p>
                  <p className="mt-2 text-xl font-black">
                    {pendingRewards.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="status-lock p-5 text-center">
              <div className="relative z-10 flex flex-col items-center">
                <div className="hero-mini-pill">
                  {unlockedGame ? "Jeu ouvert" : "Jeu fermé"}
                </div>
                <div className="mt-5 rounded-[1.7rem] bg-white/16 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
                  <div className="text-4xl font-black tracking-[0.08em]">
                    {unlockedGame ? "PRÊT" : "FERMÉ"}
                  </div>
                  <p className="mt-3 max-w-xs text-sm font-extrabold leading-6 text-white">
                    {unlockedGame
                      ? "Tu peux jouer."
                      : `${TASKS.length - completedCount} image${TASKS.length - completedCount > 1 ? "s" : ""} manque${TASKS.length - completedCount > 1 ? "nt" : ""}.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel-card p-5 sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker">Missions</p>
              <h2 className="mt-3 font-display text-4xl leading-none text-foreground">
                Les images
              </h2>
            </div>
            <div className="count-pill">{completedCount}/4</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {TASKS.map((task) => {
              const done = state.completedTaskIds.includes(task.id);

              return (
                <button
                  type="button"
                  key={task.id}
                  aria-pressed={done}
                  onClick={() => handleToggleTask(task)}
                  className={`task-card task-card-button ${done ? "task-card--done" : ""} ${lastTappedTaskId === task.id ? "task-card--tap" : ""}`}
                  style={{ background: done ? undefined : task.gradient }}
                >
                  <div className="relative z-10 flex h-full flex-col p-5">
                    <div className="flex items-center gap-5">
                      <div
                        className="task-visual"
                        style={{
                          backgroundColor: task.iconSurface,
                          color: task.accent,
                          ["--task-icon-main" as string]: task.accent,
                          ["--task-icon-glow" as string]: `${task.accent}33`,
                          ["--task-icon-soft" as string]: `${task.accent}1A`,
                        }}
                      >
                        <TaskIcon icon={task.icon} className="h-16 w-16" />
                        <span className="task-visual-check">✓</span>
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div
                          className="task-chip"
                          style={{
                            backgroundColor: done
                              ? "#D9F7E4"
                              : task.chipSurface,
                            color: done ? "#14653B" : task.chipText,
                          }}
                        >
                          {done ? "OK" : task.badge}
                        </div>
                        <h3 className="mt-3 text-2xl font-black leading-tight text-foreground">
                          {task.title}
                        </h3>
                        <p className="mt-2 text-base leading-7 text-[color:var(--ink-soft)]">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className="task-action-pill mt-5"
                      style={{
                        backgroundColor: done ? "#E8F7EE" : task.buttonSurface,
                        color: done ? "#14653B" : task.buttonText,
                      }}
                    >
                      {done ? "Annuler" : "Valider"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="panel-card overflow-hidden p-5 sm:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-kicker">Coffres</p>
                  <h2 className="mt-3 font-display text-4xl leading-none text-foreground">
                    Les gains
                  </h2>
                </div>
                <div className="count-pill">
                  {pendingRewards.length} prêt
                  {pendingRewards.length > 1 ? "s" : ""}
                </div>
              </div>

              <div className="treasure-claim p-5">
                <div className="treasure-claim-head">
                  <div>
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-white/80">
                    Coffre
                  </p>
                  <h3 className="mt-2 text-3xl font-black text-white">
                    {nextReward
                      ? `${nextReward.chestName} prêt`
                      : unlockedGame
                        ? "Ouvert"
                        : "Fermé"}
                  </h3>
                  <p className="mt-2 text-base font-bold leading-7 text-white/86">
                    {nextReward
                      ? nextReward.title
                      : unlockedGame
                        ? "Demain, nouveau coffre."
                        : "Fais les 4 images."}
                  </p>
                  </div>
                  <div className="treasure-claim-glyph">
                    <ChestGlyph
                      tier={nextReward?.tier ?? "bronze"}
                      className="treasure-claim-icon"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!nextReward}
                  onClick={() => handleClaimReward(nextReward?.id)}
                  className="task-button mt-5 w-full bg-white text-[color:var(--primary)] disabled:bg-white/70 disabled:text-[color:var(--primary)]"
                >
                  {nextReward
                    ? "Ouvrir"
                    : unlockedGame
                      ? "Déjà ouvert"
                      : "Pas encore"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {REWARD_OPTIONS.map((reward) => {
                const readyReward = pendingRewards.find(
                  (pendingReward) => pendingReward.tier === reward.tier
                );
                const readyCount = pendingCountsByTier[reward.tier];
                const isReady = readyCount > 0;
                const progress = isReady ? 1 : getRewardProgress(state, reward);
                const progressLabel = isReady
                  ? `${readyCount} prêt${readyCount > 1 ? "s" : ""}`
                  : getRewardProgressLabel(
                      reward,
                      completedCount,
                      streak,
                      false
                    );

                return (
                  <button
                    type="button"
                    key={reward.tier}
                    disabled={!readyReward}
                    onClick={() => handleClaimReward(readyReward?.id)}
                    className={`reward-card reward-card-button reward-card--${reward.tier} ${isReady ? "reward-card--ready" : ""}`}
                  >
                    <div className="reward-card-head">
                      <div
                        className={`mini-chest mini-chest--${reward.tier}`}
                        aria-hidden="true"
                      >
                        <ChestGlyph
                          tier={reward.tier}
                          className="mini-chest-icon"
                        />
                      </div>
                      {isReady ? (
                        <div className="reward-stack-count">
                          x{readyCount}
                        </div>
                      ) : null}
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
                    <p className="mt-2 text-sm font-bold leading-6 text-[color:var(--ink-soft)]">
                      {reward.title}
                    </p>
                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">
                        <span>Progression</span>
                        <span>{progressLabel}</span>
                      </div>
                      <div className="reward-progress">
                        <span style={{ width: `${progress * 100}%` }} />
                      </div>
                    </div>
                  </button>
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
              <div className="count-pill">
                {streak}
              </div>
            </div>

            <div className="trophy-hero mt-5">
              <div className="trophy-hero-icon">
                <TrophyMark className="h-14 w-14" />
              </div>
              <div>
                <p className="text-4xl font-black text-foreground">
                  {streak}
                </p>
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
      </div>

      {openedReward ? (
        <div className="modal-backdrop" onClick={handleCloseReward}>
          <div
            className={`chest-modal-card chest-modal-card--${openedReward.tier} ${rewardRevealReady ? "chest-modal-card--revealed" : "chest-modal-card--opening"} p-6`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-title"
            onClick={(event) => event.stopPropagation()}
          >
            <RewardChest
              tier={openedReward.tier}
              revealed={rewardRevealReady}
              onOpened={() => setRewardRevealReady(true)}
            />

            <div
              className={`reward-reveal ${rewardRevealReady ? "reward-reveal--ready" : ""}`}
              aria-live="polite"
            >
              {rewardRevealReady ? (
                <>
                  <div className="reward-prize-card">
                    <RewardPrize tier={openedReward.tier} />
                  </div>

                  <p className="mx-auto mt-4 w-fit rounded-full bg-[color:var(--surface-soft)] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.08em] text-foreground">
                    {openedReward.chestName}
                  </p>
                  <h2
                    id="reward-title"
                    className="mt-4 text-center text-3xl font-black text-foreground"
                  >
                    {getRewardCelebrationCopy(openedReward)}
                  </h2>
                  <p className="mx-auto mt-3 max-w-sm text-center text-base font-bold leading-7 text-[color:var(--ink-soft)]">
                    {openedReward.note}
                  </p>

                  <button
                    type="button"
                    onClick={handleCloseReward}
                    className="task-button mt-6 w-full bg-[color:var(--primary)] text-white"
                  >
                    Trop bien
                  </button>
                </>
              ) : (
                <p
                  id="reward-title"
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
