export type TaskId = "dress" | "breakfast" | "water" | "move";
export type TaskIconName = "shirt" | "plate" | "drop" | "jump";
export type RewardTier = "bronze" | "silver" | "gold";
export type CelebrationType = "none" | "task" | "unlock" | "reward";

type LegacyRewardTier = RewardTier | "daily" | "two" | "seven";

export type TaskDefinition = {
  id: TaskId;
  icon: TaskIconName;
  title: string;
  badge: string;
  description: string;
  confirmCopy: string;
  gradient: string;
  iconSurface: string;
  accent: string;
  chipSurface: string;
  chipText: string;
  buttonSurface: string;
  buttonText: string;
};

export type RewardDefinition = {
  tier: RewardTier;
  chestName: string;
  label: string;
  title: string;
  note: string;
  accent: string;
  threshold: number;
};

export type PendingReward = {
  id: string;
  tier: RewardTier;
  date: string;
};

export type PendingRewardView = PendingReward & RewardDefinition;

export type RewardHistoryEntry = RewardDefinition & {
  rewardId: string;
  claimedAt: string;
  date: string;
};

export type MorningHistoryEntry = {
  date: string;
  taskCount: number;
  unlockedGame: boolean;
};

export type MorningQuestState = {
  version: number;
  activeDate: string;
  completedTaskIds: TaskId[];
  pendingRewards: PendingReward[];
  todayVictoryRecorded: boolean;
  history: MorningHistoryEntry[];
  rewardHistory: RewardHistoryEntry[];
};

const DEV_PREVIEW_REWARDS = process.env.NODE_ENV === "development";

export const STORAGE_KEY = "mission-heros-du-matin-v10";
export const STORAGE_EVENT_NAME = "mission-heros-du-matin-updated";
const LEGACY_STORAGE_KEYS = [
  "mission-heros-du-matin",
  "mission-heros-du-matin-v4",
  "mission-heros-du-matin-v5",
  "mission-heros-du-matin-v6",
  "mission-heros-du-matin-v7",
  "mission-heros-du-matin-v8",
  "mission-heros-du-matin-v9",
];

const SERVER_STATE_SNAPSHOT = DEV_PREVIEW_REWARDS
  ? createPreviewChestState()
  : createInitialState();

let cachedClientRawValue: string | null | undefined;
let cachedClientDateKey: string | undefined;
let cachedClientSnapshot: MorningQuestState | undefined;

export const TASKS: TaskDefinition[] = [
  {
    id: "dress",
    icon: "shirt",
    title: "Habillé",
    badge: "Mission 1",
    description: "Tenue prête.",
    confirmCopy: "La tenue est complète ?",
    gradient: "linear-gradient(145deg, #fff5f7 0%, #ffe0e7 100%)",
    iconSurface: "#FFE1E7",
    accent: "#FF4D63",
    chipSurface: "#FFD4DD",
    chipText: "#7C1D2A",
    buttonSurface: "#FF4D63",
    buttonText: "#FFFFFF",
  },
  {
    id: "breakfast",
    icon: "plate",
    title: "Mangé",
    badge: "Mission 2",
    description: "Ventre plein.",
    confirmCopy: "Le petit-déjeuner est terminé ?",
    gradient: "linear-gradient(145deg, #fffdf4 0%, #ffeaa1 100%)",
    iconSurface: "#FFF2BC",
    accent: "#D89A00",
    chipSurface: "#FFE8A6",
    chipText: "#6D4E00",
    buttonSurface: "#FFD447",
    buttonText: "#15254B",
  },
  {
    id: "water",
    icon: "drop",
    title: "Eau",
    badge: "Mission 3",
    description: "Verre bu.",
    confirmCopy: "Le verre d'eau est bu ?",
    gradient: "linear-gradient(145deg, #f4f8ff 0%, #cfe1ff 100%)",
    iconSurface: "#DCEBFF",
    accent: "#2E5BFF",
    chipSurface: "#D6E6FF",
    chipText: "#193689",
    buttonSurface: "#2E5BFF",
    buttonText: "#FFFFFF",
  },
  {
    id: "move",
    icon: "jump",
    title: "Bouger",
    badge: "Mission 4",
    description: "10 sauts.",
    confirmCopy: "Le mini sport est fait ?",
    gradient: "linear-gradient(145deg, #fff7ef 0%, #ffd2a6 100%)",
    iconSurface: "#FFE2BF",
    accent: "#F06C00",
    chipSurface: "#FFD9B4",
    chipText: "#7A3C00",
    buttonSurface: "#F06C00",
    buttonText: "#FFFFFF",
  },
];

export const REWARD_OPTIONS: RewardDefinition[] = [
  {
    tier: "bronze",
    chestName: "Coffre bronze",
    label: "Chaque jour",
    title: "Bonbon au choix",
    note: "Un petit bonbon choisi avec papa ou maman.",
    accent: "#C9783F",
    threshold: 1,
  },
  {
    tier: "silver",
    chestName: "Coffre argent",
    label: "2 réussites",
    title: "Jeu vidéo 1h",
    note: "Une heure de jeu dans la journée.",
    accent: "#7893C7",
    threshold: 2,
  },
  {
    tier: "gold",
    chestName: "Coffre doré",
    label: "7 réussites",
    title: "Gros cadeau",
    note: "Jouet ou repas préféré.",
    accent: "#D69B00",
    threshold: 7,
  },
];

export function createInitialState(today = getTodayKey()): MorningQuestState {
  return {
    version: 3,
    activeDate: today,
    completedTaskIds: [],
    pendingRewards: [],
    todayVictoryRecorded: false,
    history: [],
    rewardHistory: [],
  };
}

export function createPreviewChestState(
  today = getTodayKey()
): MorningQuestState {
  const bronzeDateOlder = getPreviousDate(
    getPreviousDate(getPreviousDate(getPreviousDate(today)))
  );
  const silverDate = getPreviousDate(
    getPreviousDate(getPreviousDate(today))
  );
  const goldDate = getPreviousDate(getPreviousDate(today));
  const bronzeDateRecent = getPreviousDate(today);

  return {
    ...createInitialState(today),
    pendingRewards: [
      createPendingReward("bronze", bronzeDateOlder),
      createPendingReward("silver", silverDate),
      createPendingReward("gold", goldDate),
      createPendingReward("bronze", bronzeDateRecent),
    ],
  };
}

function sanitizeCompletedTasks(value: unknown): TaskId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowed = new Set<TaskId>(TASKS.map((task) => task.id));
  return Array.from(
    new Set(
      value.filter(
        (taskId): taskId is TaskId =>
          typeof taskId === "string" && allowed.has(taskId as TaskId)
      )
    )
  );
}

function mapLegacyRewardTier(value: unknown): RewardTier | null {
  const legacyMap: Record<LegacyRewardTier, RewardTier> = {
    bronze: "bronze",
    silver: "silver",
    gold: "gold",
    daily: "bronze",
    two: "silver",
    seven: "gold",
  };

  if (typeof value !== "string") {
    return null;
  }

  return legacyMap[value as LegacyRewardTier] ?? null;
}

function createPendingReward(tier: RewardTier, date: string): PendingReward {
  return {
    id: `${date}-${tier}`,
    tier,
    date,
  };
}

function mergePendingRewards(rewards: PendingReward[]): PendingReward[] {
  const rewardMap = new Map<string, PendingReward>();

  for (const reward of rewards) {
    if (!rewardMap.has(reward.id)) {
      rewardMap.set(reward.id, reward);
    }
  }

  return Array.from(rewardMap.values());
}

function sanitizePendingRewards(
  value: unknown,
  fallbackDate: string
): PendingReward[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return mergePendingRewards(
    value
      .map((entry): PendingReward | null => {
        if (typeof entry === "string") {
          const tier = mapLegacyRewardTier(entry);
          return tier ? createPendingReward(tier, fallbackDate) : null;
        }

        if (!entry || typeof entry !== "object") {
          return null;
        }

        const tier = mapLegacyRewardTier((entry as PendingReward).tier);
        const date =
          typeof (entry as PendingReward).date === "string"
            ? (entry as PendingReward).date
            : fallbackDate;

        return tier ? createPendingReward(tier, date) : null;
      })
      .filter((reward): reward is PendingReward => Boolean(reward))
  );
}

function sanitizeLegacyPendingRewardTiers(
  value: unknown,
  fallbackDate: string
): PendingReward[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return mergePendingRewards(
    value
      .map((tier) => mapLegacyRewardTier(tier))
      .filter((tier): tier is RewardTier => Boolean(tier))
      .map((tier) => createPendingReward(tier, fallbackDate))
  );
}

function sanitizeHistory(value: unknown): MorningHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry): entry is MorningHistoryEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as MorningHistoryEntry).date === "string" &&
        typeof (entry as MorningHistoryEntry).taskCount === "number" &&
        typeof (entry as MorningHistoryEntry).unlockedGame === "boolean"
    )
    .slice(0, 8);
}

function sanitizeRewardHistory(value: unknown): RewardHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): RewardHistoryEntry | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const claimedAt = (entry as RewardHistoryEntry).claimedAt;
      const tier = mapLegacyRewardTier((entry as RewardHistoryEntry).tier);
      const definition = tier
        ? REWARD_OPTIONS.find((reward) => reward.tier === tier)
        : null;

      if (typeof claimedAt !== "string" || !definition) {
        return null;
      }

      const date =
        typeof (entry as RewardHistoryEntry).date === "string"
          ? (entry as RewardHistoryEntry).date
          : getDateKeyFromIso(claimedAt) ?? getTodayKey();

      return {
        ...definition,
        rewardId:
          typeof (entry as RewardHistoryEntry).rewardId === "string"
            ? (entry as RewardHistoryEntry).rewardId
            : `${date}-${definition.tier}`,
        claimedAt,
        date,
      };
    })
    .filter((entry): entry is RewardHistoryEntry => Boolean(entry))
    .slice(0, 8);
}

function coerceState(input: unknown, today = getTodayKey()): MorningQuestState {
  if (!input || typeof input !== "object") {
    return createInitialState(today);
  }

  const state = input as Partial<MorningQuestState> & {
    availableRewards?: unknown;
    pendingRewardTiers?: unknown;
  };
  const activeDate =
    typeof state.activeDate === "string" ? state.activeDate : today;
  const legacyAvailableRewards =
    typeof state.availableRewards === "number"
      ? Math.max(0, Math.floor(state.availableRewards))
      : 0;
  const legacyAvailablePendingRewards = Array.from(
    { length: legacyAvailableRewards },
    () => createPendingReward("bronze", activeDate)
  );

  return {
    version: 3,
    activeDate,
    completedTaskIds: sanitizeCompletedTasks(state.completedTaskIds),
    pendingRewards: mergePendingRewards([
      ...sanitizePendingRewards(state.pendingRewards, activeDate),
      ...sanitizeLegacyPendingRewardTiers(
        state.pendingRewardTiers,
        activeDate
      ),
      ...legacyAvailablePendingRewards,
    ]),
    todayVictoryRecorded: Boolean(state.todayVictoryRecorded),
    history: sanitizeHistory(state.history),
    rewardHistory: sanitizeRewardHistory(state.rewardHistory),
  };
}

function mergeHistory(
  history: MorningHistoryEntry[],
  entry: MorningHistoryEntry
): MorningHistoryEntry[] {
  const next = [entry, ...history.filter((item) => item.date !== entry.date)];
  return next.slice(0, 8);
}

function getEarnedRewardTiers(streak: number): RewardTier[] {
  const rewardTiers: RewardTier[] = ["bronze"];

  if (streak > 0 && streak % 2 === 0) {
    rewardTiers.push("silver");
  }

  if (streak > 0 && streak % 7 === 0) {
    rewardTiers.push("gold");
  }

  return rewardTiers;
}

function hasRewardForDate(
  state: MorningQuestState,
  tier: RewardTier,
  date: string
): boolean {
  return (
    state.pendingRewards.some(
      (reward) => reward.tier === tier && reward.date === date
    ) ||
    state.rewardHistory.some(
      (reward) => reward.tier === tier && reward.date === date
    )
  );
}

function syncEarnedRewards(state: MorningQuestState): MorningQuestState {
  const completedToday = state.completedTaskIds.length === TASKS.length;
  const baseState =
    completedToday && !state.todayVictoryRecorded
      ? { ...state, todayVictoryRecorded: true }
      : state;

  if (!completedToday) {
    return baseState;
  }

  const earnedRewardTiers = getEarnedRewardTiers(getStreak(baseState));
  const missingRewards = earnedRewardTiers
    .filter(
      (tier) => !hasRewardForDate(baseState, tier, baseState.activeDate)
    )
    .map((tier) => createPendingReward(tier, baseState.activeDate));

  if (missingRewards.length < 1) {
    return baseState;
  }

  return {
    ...baseState,
    pendingRewards: mergePendingRewards([
      ...baseState.pendingRewards,
      ...missingRewards,
    ]),
  };
}

export function syncStateToToday(
  input: MorningQuestState | unknown,
  today = getTodayKey()
): MorningQuestState {
  const state = syncEarnedRewards(coerceState(input, today));

  if (state.activeDate === today) {
    return state;
  }

  const taskCount = state.completedTaskIds.length;
  const nextHistory =
    taskCount > 0
      ? mergeHistory(state.history, {
          date: state.activeDate,
          taskCount,
          unlockedGame: state.todayVictoryRecorded || taskCount === TASKS.length,
        })
      : state.history;

  return {
    ...state,
    activeDate: today,
    completedTaskIds: [],
    todayVictoryRecorded: false,
    history: nextHistory,
  };
}

export function hydrateState(
  rawValue: string | null,
  today = getTodayKey()
): MorningQuestState {
  if (!rawValue) {
    return DEV_PREVIEW_REWARDS
      ? createPreviewChestState(today)
      : createInitialState(today);
  }

  try {
    return syncStateToToday(JSON.parse(rawValue), today);
  } catch {
    return createInitialState(today);
  }
}

export function completeTask(
  state: MorningQuestState,
  taskId: TaskId
): {
  nextState: MorningQuestState;
  celebration: CelebrationType;
} {
  if (state.completedTaskIds.includes(taskId)) {
    const repairedState = syncEarnedRewards(state);

    return {
      nextState: repairedState,
      celebration:
        repairedState.pendingRewards.length > state.pendingRewards.length
          ? "reward"
          : "none",
    };
  }

  const nextCompletedTaskIds = [...state.completedTaskIds, taskId];
  const unlockedGame = nextCompletedTaskIds.length === TASKS.length;
  const baseNextState: MorningQuestState = {
    ...state,
    completedTaskIds: nextCompletedTaskIds,
    todayVictoryRecorded: state.todayVictoryRecorded || unlockedGame,
  };
  const nextState = syncEarnedRewards(baseNextState);

  return {
    nextState,
    celebration:
      unlockedGame && nextState.pendingRewards.length > state.pendingRewards.length
        ? "reward"
        : "task",
  };
}

export function toggleTask(
  state: MorningQuestState,
  taskId: TaskId
): {
  nextState: MorningQuestState;
  celebration: CelebrationType;
} {
  if (!state.completedTaskIds.includes(taskId)) {
    return completeTask(state, taskId);
  }

  return {
    nextState: {
      ...state,
      completedTaskIds: state.completedTaskIds.filter(
        (completedTaskId) => completedTaskId !== taskId
      ),
      pendingRewards: state.pendingRewards.filter(
        (reward) => reward.date !== state.activeDate
      ),
      todayVictoryRecorded: false,
    },
    celebration: "none",
  };
}

export function claimReward(
  state: MorningQuestState,
  rewardId?: string
): {
  nextState: MorningQuestState;
  reward: RewardHistoryEntry | null;
} {
  const syncedState = syncEarnedRewards(state);
  const pendingRewards = getPendingRewards(syncedState);
  const reward = rewardId
    ? pendingRewards.find((pendingReward) => pendingReward.id === rewardId)
    : pendingRewards[0];

  if (!reward) {
    return {
      nextState: syncedState,
      reward: null,
    };
  }

  const rewardEntry: RewardHistoryEntry = {
    ...reward,
    rewardId: reward.id,
    claimedAt: new Date().toISOString(),
  };

  return {
    nextState: {
      ...syncedState,
      pendingRewards: syncedState.pendingRewards.filter(
        (pendingReward) => pendingReward.id !== reward.id
      ),
      rewardHistory: [rewardEntry, ...syncedState.rewardHistory].slice(0, 8),
    },
    reward: rewardEntry,
  };
}

export function getTodayKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getCompletedCount(state: MorningQuestState): number {
  return state.completedTaskIds.length;
}

export function isGameUnlocked(state: MorningQuestState): boolean {
  return getCompletedCount(state) === TASKS.length;
}

export function getStreak(state: MorningQuestState): number {
  const unlockedDates = new Set(
    state.history.filter((entry) => entry.unlockedGame).map((entry) => entry.date)
  );

  if (state.todayVictoryRecorded) {
    unlockedDates.add(state.activeDate);
  }

  let streak = 0;
  let cursor = state.activeDate;

  while (unlockedDates.has(cursor)) {
    streak += 1;
    cursor = getPreviousDate(cursor);
  }

  return streak;
}

export function getLongDateLabel(dateKey: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateKey}T12:00:00`));
}

export function getShortDateLabel(dateKey: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${dateKey}T12:00:00`));
}

export function getPendingRewards(
  state: MorningQuestState
): PendingRewardView[] {
  const priority: Record<RewardTier, number> = {
    gold: 0,
    silver: 1,
    bronze: 2,
  };

  return state.pendingRewards
    .map((pendingReward) => {
      const definition = REWARD_OPTIONS.find(
        (reward) => reward.tier === pendingReward.tier
      );

      return definition ? { ...pendingReward, ...definition } : null;
    })
    .filter((reward): reward is PendingRewardView => Boolean(reward))
    .sort((left, right) => {
      const priorityDelta = priority[left.tier] - priority[right.tier];

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return left.date.localeCompare(right.date);
    });
}

export function getRewardProgress(
  state: MorningQuestState,
  reward: RewardDefinition
): number {
  if (reward.tier === "bronze") {
    return isGameUnlocked(state) ? 1 : getCompletedCount(state) / TASKS.length;
  }

  const streak = getStreak(state);
  const cycleProgress = streak % reward.threshold;
  const progress =
    streak > 0 && cycleProgress === 0 ? reward.threshold : cycleProgress;

  return Math.min(1, progress / reward.threshold);
}

export function getStoredStateSnapshot(): MorningQuestState {
  if (typeof window === "undefined") {
    return SERVER_STATE_SNAPSHOT;
  }

  cleanupLegacyStorageKeys();

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  const today = getTodayKey();

  if (
    cachedClientSnapshot &&
    cachedClientRawValue === rawValue &&
    cachedClientDateKey === today
  ) {
    return cachedClientSnapshot;
  }

  cachedClientRawValue = rawValue;
  cachedClientDateKey = today;
  cachedClientSnapshot = hydrateState(rawValue, today);

  return cachedClientSnapshot;
}

export function getServerStoredStateSnapshot(): MorningQuestState {
  return SERVER_STATE_SNAPSHOT;
}

export function subscribeToMorningQuest(
  onStoreChange: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== STORAGE_KEY) {
      return;
    }

    onStoreChange();
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      onStoreChange();
    }
  };

  const handleInternalUpdate = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", onStoreChange);
  window.addEventListener(STORAGE_EVENT_NAME, handleInternalUpdate);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", onStoreChange);
    window.removeEventListener(STORAGE_EVENT_NAME, handleInternalUpdate);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}

export function writeStoredState(state: MorningQuestState): void {
  if (typeof window === "undefined") {
    return;
  }

  cleanupLegacyStorageKeys();

  const syncedState = syncStateToToday(state);
  const rawValue = JSON.stringify(syncedState);

  cachedClientRawValue = rawValue;
  cachedClientDateKey = syncedState.activeDate;
  cachedClientSnapshot = syncedState;

  window.localStorage.setItem(STORAGE_KEY, rawValue);
  window.dispatchEvent(new Event(STORAGE_EVENT_NAME));
}

function cleanupLegacyStorageKeys(): void {
  for (const key of LEGACY_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

function getPreviousDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return getTodayKey(date);
}

function getDateKeyFromIso(value: string): string | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return getTodayKey(date);
}
