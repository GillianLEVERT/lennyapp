// Retours sensoriels de l'app : sons synthétisés (Web Audio, aucun asset, marche
// offline) + vibration haptique, le tout derrière un unique réglage "son & vibrations"
// persistant dans localStorage et partageable via useSyncExternalStore.

export type FeedbackCue = "task" | "unlock" | "reward";

const SOUND_PREF_KEY = "mission-heros-sound-v1";
const SOUND_EVENT_NAME = "mission-heros-sound-updated";

let audioContext: AudioContext | null = null;
let cachedSoundEnabled: boolean | undefined;

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioCtor =
    window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;

  if (!AudioCtor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioCtor();
  }

  // Les navigateurs créent le contexte en "suspended" tant qu'il n'y a pas de
  // geste utilisateur. Un tap sur une carte est un geste valide : on relance.
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  if (cachedSoundEnabled === undefined) {
    cachedSoundEnabled =
      window.localStorage.getItem(SOUND_PREF_KEY) !== "off";
  }

  return cachedSoundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  cachedSoundEnabled = enabled;
  window.localStorage.setItem(SOUND_PREF_KEY, enabled ? "on" : "off");
  window.dispatchEvent(new Event(SOUND_EVENT_NAME));
}

export function toggleSound(): boolean {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  return next;
}

export function subscribeToSound(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => {
    cachedSoundEnabled = undefined;
    onChange();
  };

  window.addEventListener(SOUND_EVENT_NAME, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(SOUND_EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getSoundSnapshot(): boolean {
  return isSoundEnabled();
}

export function getServerSoundSnapshot(): boolean {
  return true;
}

type Note = {
  freq: number;
  start: number;
  duration: number;
  peak?: number;
  type?: OscillatorType;
};

// Mélodies volontairement douces et joyeuses (pas une machine à sucre sonore).
const CUE_NOTES: Record<FeedbackCue, Note[]> = {
  // Petit "bloup-blip" de validation.
  task: [
    { freq: 659.25, start: 0, duration: 0.12 },
    { freq: 987.77, start: 0.08, duration: 0.16 },
  ],
  // Arpège ascendant majeur : les 4 missions sont faites, le jeu s'ouvre.
  unlock: [
    { freq: 523.25, start: 0, duration: 0.16 },
    { freq: 659.25, start: 0.1, duration: 0.16 },
    { freq: 783.99, start: 0.2, duration: 0.16 },
    { freq: 1046.5, start: 0.3, duration: 0.32, peak: 0.16 },
  ],
  // Fanfare de coffre : arpège + accord brillant final.
  reward: [
    { freq: 523.25, start: 0, duration: 0.14 },
    { freq: 659.25, start: 0.1, duration: 0.14 },
    { freq: 783.99, start: 0.2, duration: 0.14 },
    { freq: 1046.5, start: 0.3, duration: 0.4, peak: 0.16 },
    { freq: 1318.51, start: 0.32, duration: 0.4, peak: 0.1 },
    { freq: 1567.98, start: 0.34, duration: 0.4, peak: 0.08 },
  ],
};

const VIBRATION_PATTERNS: Record<FeedbackCue, number | number[]> = {
  task: 15,
  unlock: [0, 35, 40, 35],
  reward: [0, 30, 30, 30, 30, 90],
};

function playNote(ctx: AudioContext, note: Note, baseTime: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const startTime = baseTime + note.start;
  const peak = note.peak ?? 0.14;

  osc.type = note.type ?? "triangle";
  osc.frequency.setValueAtTime(note.freq, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + note.duration + 0.05);
}

function vibrate(cue: FeedbackCue): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  try {
    navigator.vibrate(VIBRATION_PATTERNS[cue]);
  } catch {
    // navigator.vibrate peut lever selon les permissions/contexte : on ignore.
  }
}

export function playCue(cue: FeedbackCue): void {
  if (!isSoundEnabled()) {
    return;
  }

  vibrate(cue);

  const ctx = getAudioContext();

  if (!ctx) {
    return;
  }

  const baseTime = ctx.currentTime + 0.01;

  for (const note of CUE_NOTES[cue]) {
    playNote(ctx, note, baseTime);
  }
}
