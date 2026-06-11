"use client";

import { useEffect, useRef, useState } from "react";
import {
  PiMicrophoneFill,
  PiPlayFill,
  PiStopFill,
} from "react-icons/pi";
import {
  CUSTOM_SOUND_ID,
  previewTaskSound,
  TASK_SOUND_PRESETS,
} from "@/lib/feedback";
import { blobToDataUrl } from "@/lib/media";

const MAX_RECORDING_MS = 4000;

type SoundPickerProps = {
  soundId: string | null;
  customSound: string | null;
  onChange: (next: { soundId: string; customSound: string | null }) => void;
};

export function SoundPicker({ soundId, customSound, onChange }: SoundPickerProps) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeId = soundId ?? "default";

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Micro non disponible sur cet appareil.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size === 0) {
          return;
        }
        const dataUrl = await blobToDataUrl(blob);
        onChange({ soundId: CUSTOM_SOUND_ID, customSound: dataUrl });
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);

      // Garde-fou : enregistrement court pour rester léger en base.
      timeoutRef.current = setTimeout(() => {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      }, MAX_RECORDING_MS);
    } catch {
      setError("Autorise le micro pour enregistrer un son.");
      setRecording(false);
    }
  }

  function stopRecording() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="section-kicker">Son de validation</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TASK_SOUND_PRESETS.map((preset) => {
          const selected = activeId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                previewTaskSound({ id: preset.id });
                onChange({ soundId: preset.id, customSound });
              }}
              aria-pressed={selected}
              className={`flex items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3 text-sm font-extrabold transition ${
                selected
                  ? "border-[color:var(--primary)] bg-[color:var(--shell)] text-foreground"
                  : "border-[color:var(--shell)] bg-[color:var(--surface)] text-[color:var(--ink-soft)]"
              }`}
            >
              <PiPlayFill aria-hidden="true" className="text-xs" />
              {preset.label}
            </button>
          );
        })}
      </div>

      {customSound ? (
        <button
          type="button"
          onClick={() => {
            previewTaskSound({ id: CUSTOM_SOUND_ID, customUrl: customSound });
            onChange({ soundId: CUSTOM_SOUND_ID, customSound });
          }}
          aria-pressed={activeId === CUSTOM_SOUND_ID}
          className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-sm font-extrabold transition ${
            activeId === CUSTOM_SOUND_ID
              ? "border-[color:var(--primary)] bg-[color:var(--shell)] text-foreground"
              : "border-[color:var(--shell)] bg-[color:var(--surface)] text-[color:var(--ink-soft)]"
          }`}
        >
          <PiPlayFill aria-hidden="true" /> Mon enregistrement
        </button>
      ) : null}

      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold text-white transition ${
          recording ? "bg-[color:var(--secondary)]" : "bg-[color:var(--primary)]"
        }`}
      >
        {recording ? (
          <>
            <PiStopFill aria-hidden="true" /> Stop
          </>
        ) : (
          <>
            <PiMicrophoneFill aria-hidden="true" /> Enregistrer un son
          </>
        )}
      </button>

      {recording ? (
        <p className="text-center text-xs font-bold text-[color:var(--secondary)]">
          Enregistrement… fais ton plus beau bruit !
        </p>
      ) : null}
      {error ? (
        <p className="text-center text-xs font-bold text-[color:var(--secondary)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
