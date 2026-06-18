"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PiArrowLeftBold,
  PiCameraFill,
  PiCheckBold,
  PiPencilSimpleBold,
  PiPlusBold,
  PiSignOutBold,
  PiSparkleFill,
  PiTrashBold,
  PiTreasureChestFill,
  PiXBold,
} from "react-icons/pi";
import { useAuth } from "@/components/auth-provider";
import { ChildAvatar } from "@/components/child-avatar";
import { SoundPicker } from "@/components/sound-picker";
import { compressImage } from "@/lib/media";
import {
  addChild,
  addMission,
  addReward,
  CHEST_COSTS,
  deleteChild,
  deleteMission,
  deleteReward,
  MAX_MISSIONS,
  REWARD_TIERS,
  seedStarterKit,
  subscribeChildren,
  subscribeMissions,
  subscribeRewards,
  tierFromPointsCost,
  updateChild,
  type Child,
  type Mission,
  type Reward,
  type RewardTier,
} from "@/lib/firestore-data";
import {
  MISSION_PRESETS,
  REWARD_PRESETS,
  type MissionPreset,
  type RewardPreset,
} from "@/lib/presets";
import { BlobMascot } from "@/components/blob-mascot";
import {
  BLOB_COLOR_PRESETS,
  CHARACTER_ORDER,
  CHARACTERS,
  resolveKidTheme,
  THEME_ORDER,
  THEMES,
  type CharacterId,
  type ThemeId,
} from "@/lib/themes";

const CHILD_AVATARS = [
  "🧒", "👦", "👧", "🦸", "🦸‍♀️", "🧚", "🧜‍♀️", "🥷",
  "🐯", "🦊", "🐼", "🦄", "🐸", "🐱", "🐶", "🦖",
  "🚀", "🤖", "👾", "⚽",
];
const MISSION_ICONS = [
  "🎯", "🪥", "💧", "👕", "🥣", "🤸", "🛏️", "🧸",
  "👟", "🎒", "🧦", "🚿", "🪮", "🐕", "🌱", "📖",
  "🍎", "🧹", "🚽", "😴",
];
const REWARD_ICONS = [
  "🎁", "🎮", "🍦", "🏞️", "📚", "⚽", "🎬", "🍕",
  "🎨", "🧩", "🚲", "🏊", "🍿", "🎵", "🛝", "🧁",
];

const inputClass =
  "w-full rounded-2xl border-2 border-[color:var(--shell)] px-4 py-3 text-base font-bold text-foreground outline-none transition focus-visible:border-[color:var(--primary)]";

function AvatarPicker({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition ${
            value === option
              ? "bg-[color:var(--shell)] ring-2 ring-[color:var(--primary)]"
              : "bg-[color:var(--surface-soft)] hover:bg-[color:var(--shell)]"
          }`}
        >
          <span aria-hidden="true">{option}</span>
        </button>
      ))}
    </div>
  );
}

// Choix de l'univers visuel, du héros et de la couleur du compagnon.
// L'enfant peut aussi changer ces réglages depuis son écran : ici, le parent
// prépare simplement un point de départ qui plaira à son enfant.
function StyleHeroPicker({
  theme,
  character,
  blobColor,
  onTheme,
  onCharacter,
  onBlobColor,
}: {
  theme: ThemeId | null;
  character: CharacterId | null;
  blobColor: string | null;
  onTheme: (theme: ThemeId | null) => void;
  onCharacter: (character: CharacterId | null) => void;
  onBlobColor: (color: string | null) => void;
}) {
  const effectiveTheme = theme ?? "jelly";
  const base = THEMES[effectiveTheme];
  const previewUi = resolveKidTheme(theme, character, blobColor);
  const colorOptions: Array<{ key: string; color: string; value: string | null }> = [
    { key: "default", color: base.scene.blob, value: null },
    ...base.accents.map((accent) => ({ key: accent, color: accent, value: accent })),
    ...BLOB_COLOR_PRESETS.map((preset) => ({ key: preset, color: preset, value: preset })),
  ];

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-[color:var(--surface-soft)] p-4">
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <BlobMascot ui={previewUi} size={72} wave={false} />
        </div>
        <p className="text-sm font-bold leading-6 text-[color:var(--ink-soft)]">
          Choisis l&apos;univers et le héros qui feront briller les yeux de ton
          enfant. Il pourra aussi les changer depuis son écran.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">
          Univers
        </p>
        <div className="flex flex-wrap gap-2">
          {THEME_ORDER.map((id) => {
            const entry = THEMES[id];
            const active = effectiveTheme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTheme(id)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left transition ${
                  active
                    ? "border-[color:var(--primary)] bg-[color:var(--shell)]"
                    : "border-transparent bg-[color:var(--surface)]"
                }`}
              >
                <span className="text-xl" aria-hidden="true">
                  {entry.emoji}
                </span>
                <span>
                  <span className="block text-sm font-black text-foreground">
                    {entry.name}
                  </span>
                  <span className="block text-xs font-bold text-[color:var(--ink-soft)]">
                    {entry.tagline}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">
          Héros
        </p>
        <div className="flex flex-wrap gap-2">
          {CHARACTER_ORDER.map((id) => {
            const entry = CHARACTERS[id];
            const active = (character ?? "pirate") === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onCharacter(id)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2 transition ${
                  active
                    ? "border-[color:var(--primary)] bg-[color:var(--shell)]"
                    : "border-transparent bg-[color:var(--surface)]"
                }`}
              >
                <span className="text-xl" aria-hidden="true">
                  {entry.emoji}
                </span>
                <span className="text-sm font-black text-foreground">
                  {entry.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">
          Couleur du compagnon
        </p>
        <div className="flex items-center gap-2">
          {colorOptions.map((option) => {
            const active = (blobColor ?? null) === option.value;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onBlobColor(option.value)}
                aria-pressed={active}
                aria-label={
                  option.value === null
                    ? "Couleur d'origine de l'univers"
                    : `Couleur ${option.color}`
                }
                className={`rounded-full transition ${
                  active ? "ring-2 ring-[color:var(--primary)] ring-offset-2" : ""
                }`}
                style={{
                  width: 28,
                  height: 28,
                  background: option.color,
                  border: "2px solid rgba(255,255,255,.8)",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

type PresetItem = {
  id: string;
  title: string;
  icon: string;
  sub: string;
  alreadyAdded: boolean;
};

function PresetSheet({
  title,
  subtitle,
  items,
  limit,
  onClose,
  onConfirm,
}: {
  title: string;
  subtitle: string;
  items: PresetItem[];
  limit?: number;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const atLimit = typeof limit === "number" && selected.length >= limit;

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((value) => value !== id);
      }
      if (typeof limit === "number" && current.length >= limit) {
        return current;
      }
      return [...current, id];
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="preset-sheet flex max-h-[calc(100dvh-1.5rem)] w-[min(100%,calc(100vw-1.5rem))] max-w-lg min-w-0 flex-col rounded-[1.5rem] bg-[color:var(--surface)] p-4 sm:max-h-[85vh] sm:rounded-[2rem] sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h2 className="preset-sheet-title break-words font-display text-3xl leading-none text-foreground">
              {title}
            </h2>
            <p className="preset-sheet-subtitle mt-2 text-sm font-bold text-[color:var(--ink-soft)]">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="preset-sheet-close flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--surface-soft)] text-[color:var(--ink-soft)]"
          >
            <PiXBold aria-hidden="true" />
          </button>
        </div>

        <div className="preset-grid mt-5 grid min-h-0 flex-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {items.map((item) => {
            const isSelected = selected.includes(item.id);
            const disabled =
              item.alreadyAdded || (!isSelected && atLimit);

            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => toggle(item.id)}
                aria-pressed={isSelected}
                className={`preset-item flex min-w-0 items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
                  isSelected
                    ? "border-[color:var(--primary)] bg-[color:var(--shell)]"
                    : "border-transparent bg-[color:var(--surface-soft)]"
                } ${item.alreadyAdded ? "opacity-50" : ""} ${disabled && !item.alreadyAdded ? "opacity-40" : ""}`}
              >
                <span className="preset-item-icon text-2xl" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="preset-item-title block break-words text-base font-black leading-tight text-foreground">
                    {item.title}
                  </span>
                  <span className="preset-item-sub block text-xs font-bold text-[color:var(--ink-soft)]">
                    {item.alreadyAdded ? "Déjà ajoutée" : item.sub}
                  </span>
                </span>
                <span
                  className={`preset-item-check flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                    isSelected
                      ? "bg-[color:var(--primary)] text-white"
                      : "bg-white/0 text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  <PiCheckBold />
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="task-button flex-1 bg-[color:var(--surface-soft)] text-[color:var(--ink-soft)]"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => onConfirm(selected)}
            className="task-button flex-1 bg-[color:var(--primary)] text-white disabled:opacity-60"
          >
            Ajouter {selected.length > 0 ? `(${selected.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({
  name,
  onSignOut,
}: {
  name: string;
  onSignOut: () => void;
}) {
  // Prénom seul (ou partie avant @ pour un e-mail) : plus chaleureux.
  const firstName = name.split("@")[0].split(" ")[0];
  const initial = (firstName[0] ?? "P").toUpperCase();
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Retour au jeu"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--surface-soft)] text-[color:var(--ink-soft)]"
        >
          <PiArrowLeftBold aria-hidden="true" />
        </Link>
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--primary)] text-lg font-black text-white shadow-md"
        >
          {initial}
        </span>
        <div>
          <p className="section-kicker">Espace parent</p>
          <p className="text-base font-black text-foreground sm:text-lg">
            Bonjour {firstName} 👋
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--surface-soft)] px-3 py-2 text-sm font-extrabold text-[color:var(--ink-soft)] sm:px-4"
      >
        <PiSignOutBold aria-hidden="true" />
        <span className="hidden sm:inline">Déconnexion</span>
      </button>
    </header>
  );
}

function ChildCreation({
  parentId,
  onCreated,
}: {
  parentId: string;
  onCreated: (childId: string) => void;
}) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(CHILD_AVATARS[0]);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    try {
      const ref = await addChild(parentId, { name: trimmed, avatar });
      await seedStarterKit(parentId, ref.id);
      onCreated(ref.id);
    } catch (error) {
      console.error("Création de l'enfant échouée", error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel-card mx-auto w-full max-w-lg p-6 text-center sm:p-8">
      <span className="text-5xl" aria-hidden="true">
        👋
      </span>
      <h1 className="mt-4 font-display text-4xl leading-none text-foreground sm:text-5xl">
        Bienvenue !
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-base font-bold leading-7 text-[color:var(--ink-soft)]">
        Crée le profil de ton enfant. Tu pourras ensuite choisir ses missions et
        ses récompenses en un clic.
      </p>

      <div className="mt-7 flex flex-col items-center gap-5 text-left">
        <div className="w-full">
          <p className="section-kicker mb-3">Avatar</p>
          <AvatarPicker
            options={CHILD_AVATARS}
            value={avatar}
            onChange={setAvatar}
          />
        </div>
        <div className="w-full">
          <p className="section-kicker mb-3">Prénom</p>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex : Lenny"
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={!name.trim() || busy}
          className="task-button w-full bg-[color:var(--success)] text-white disabled:opacity-60"
        >
          Créer le profil
        </button>
      </div>
    </section>
  );
}

function FirstSetup({
  parentId,
  child,
  missions,
  rewards,
  onDone,
}: {
  parentId: string;
  child: Child;
  missions: Mission[];
  rewards: Reward[];
  onDone: () => void;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4 overflow-hidden sm:gap-5">
      <div className="panel-card min-w-0 p-4 text-center sm:p-6">
        <span className="text-5xl" aria-hidden="true">
          {child.avatar}
        </span>
        <p className="section-kicker mt-4">Premier paramétrage</p>
        <h1 className="mt-2 font-display text-4xl leading-none text-foreground sm:text-5xl">
          Prépare les coffres de {child.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base font-bold leading-7 text-[color:var(--ink-soft)]">
          Ajuste les missions et glisse les récompenses dans les coffres avant
          de lancer l&apos;aventure.
        </p>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <MissionsCard
          parentId={parentId}
          childId={child.id}
          missions={missions}
        />
        <RewardsCard parentId={parentId} childId={child.id} rewards={rewards} />
      </div>

      <button
        type="button"
        onClick={onDone}
        className="task-button self-center bg-[color:var(--success)] px-8 text-white"
      >
        Terminer la préparation
      </button>
    </section>
  );
}

function ChildBar({
  parentId,
  kids,
  activeChildId,
  onSelect,
}: {
  parentId: string;
  kids: Child[];
  activeChildId: string | null;
  onSelect: (childId: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(CHILD_AVATARS[0]);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState(CHILD_AVATARS[0]);
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [editSoundId, setEditSoundId] = useState<string | null>(null);
  const [editCustomSound, setEditCustomSound] = useState<string | null>(null);
  const [editTheme, setEditTheme] = useState<ThemeId | null>(null);
  const [editCharacter, setEditCharacter] = useState<CharacterId | null>(null);
  const [editBlobColor, setEditBlobColor] = useState<string | null>(null);
  // Compteur d'enregistrements : chaque sauvegarde réussie affiche le toast
  // « Modification enregistrée » (auto-masqué par animation CSS).
  const [savedTick, setSavedTick] = useState(0);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  function startEdit(child: Child) {
    setAdding(false);
    setEditingId(child.id);
    setEditName(child.name);
    setEditAvatar(child.avatar);
    setEditPhoto(child.photoURL);
    setEditSoundId(child.soundId);
    setEditCustomSound(child.customSound);
    setEditTheme(child.theme);
    setEditCharacter(child.character);
    setEditBlobColor(child.blobColor);
  }

  // Sauvegarde immédiate d'un champ (auto-save : pas de bouton Enregistrer).
  async function persistEdit(
    childId: string,
    data: Partial<
      Pick<
        Child,
        | "name"
        | "avatar"
        | "photoURL"
        | "soundId"
        | "customSound"
        | "theme"
        | "character"
        | "blobColor"
      >
    >
  ) {
    try {
      await updateChild(parentId, childId, data);
      setSavedTick((tick) => tick + 1);
    } catch (error) {
      console.error("Sauvegarde échouée", error);
    }
  }

  // Le prénom est sauvegardé avec un léger délai pour ne pas écrire
  // à chaque frappe.
  useEffect(() => {
    if (!editingId) {
      return;
    }
    const trimmed = editName.trim();
    if (!trimmed) {
      return;
    }
    const current = kids.find((kid) => kid.id === editingId);
    if (!current || current.name === trimmed) {
      return;
    }
    const childId = editingId;
    const timer = setTimeout(() => {
      void updateChild(parentId, childId, { name: trimmed })
        .then(() => setSavedTick((tick) => tick + 1))
        .catch((error) => console.error("Sauvegarde du prénom échouée", error));
    }, 700);
    return () => clearTimeout(timer);
  }, [editName, editingId, kids, parentId]);

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editingId) {
      return;
    }
    try {
      const photo = await compressImage(file);
      setEditPhoto(photo);
      void persistEdit(editingId, { photoURL: photo });
    } catch (error) {
      console.error("Photo illisible", error);
    }
  }

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    try {
      const ref = await addChild(parentId, { name: trimmed, avatar });
      await seedStarterKit(parentId, ref.id);
      setName("");
      setAvatar(CHILD_AVATARS[0]);
      setAdding(false);
    } catch (error) {
      console.error("Ajout de l'enfant échoué", error);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(child: Child) {
    if (!window.confirm(`Supprimer ${child.name} et toutes ses données ?`)) {
      return;
    }
    await deleteChild(parentId, child.id);
  }

  return (
    <section className="panel-card p-4 sm:p-5">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {kids.map((child) => {
          const active = child.id === activeChildId;
          return (
            <div
              key={child.id}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 p-2 pr-3 transition ${
                active
                  ? "border-[color:var(--primary)] bg-[color:var(--shell)]"
                  : "border-transparent bg-[color:var(--surface-soft)]"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(child.id)}
                className="flex items-center gap-2 text-left"
              >
                <ChildAvatar
                  avatar={child.avatar}
                  photoURL={child.photoURL}
                  name={child.name}
                  size={36}
                />
                <span>
                  <span className="block text-sm font-black leading-tight text-foreground">
                    {child.name}
                  </span>
                  <span className="block text-xs font-bold text-[color:var(--ink-soft)]">
                    {child.totalPoints} pts
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => startEdit(child)}
                aria-label={`Modifier ${child.name}`}
                className="text-[color:var(--ink-soft)] transition hover:text-[color:var(--primary)]"
              >
                <PiPencilSimpleBold aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(child)}
                aria-label={`Supprimer ${child.name}`}
                className="text-[color:var(--ink-soft)] transition hover:text-[color:var(--secondary)]"
              >
                <PiTrashBold aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setAdding((value) => !value)}
          className="flex h-12 shrink-0 items-center gap-2 rounded-2xl border-2 border-dashed border-[color:var(--shell)] px-4 text-sm font-extrabold text-[color:var(--ink-soft)]"
        >
          <PiPlusBold aria-hidden="true" /> Enfant
        </button>
      </div>

      {editingId ? (
        <div className="mt-4 flex flex-col gap-4 border-t border-[color:var(--shell)] pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="section-kicker">Modifier l&apos;enfant</p>
            <p className="text-xs font-bold text-[color:var(--ink-soft)]">
              Tout est enregistré automatiquement
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ChildAvatar
              avatar={editAvatar}
              photoURL={editPhoto}
              name={editName || "Enfant"}
              size={64}
            />
            <div className="flex flex-wrap gap-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--surface-soft)] px-3 py-2 text-sm font-extrabold text-[color:var(--ink-soft)]"
              >
                <PiCameraFill aria-hidden="true" />
                {editPhoto ? "Changer la photo" : "Ajouter une photo"}
              </button>
              {editPhoto ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditPhoto(null);
                    void persistEdit(editingId, { photoURL: null });
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--surface-soft)] px-3 py-2 text-sm font-extrabold text-[color:var(--ink-soft)]"
                >
                  <PiTrashBold aria-hidden="true" /> Retirer
                </button>
              ) : null}
            </div>
          </div>

          <AvatarPicker
            options={CHILD_AVATARS}
            value={editAvatar}
            onChange={(value) => {
              setEditAvatar(value);
              void persistEdit(editingId, { avatar: value });
            }}
          />

          <input
            type="text"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            placeholder="Prénom de l'enfant"
            className={inputClass}
          />

          <SoundPicker
            soundId={editSoundId}
            customSound={editCustomSound}
            onChange={({ soundId, customSound }) => {
              setEditSoundId(soundId);
              setEditCustomSound(customSound);
              void persistEdit(editingId, { soundId, customSound });
            }}
          />

          <div>
            <p className="section-kicker mb-3">Univers &amp; héros</p>
            <StyleHeroPicker
              theme={editTheme}
              character={editCharacter}
              blobColor={editBlobColor}
              onTheme={(value) => {
                setEditTheme(value);
                // Nouvel univers = couleur de compagnon d'origine.
                setEditBlobColor(null);
                void persistEdit(editingId, { theme: value, blobColor: null });
              }}
              onCharacter={(value) => {
                setEditCharacter(value);
                void persistEdit(editingId, { character: value });
              }}
              onBlobColor={(value) => {
                setEditBlobColor(value);
                void persistEdit(editingId, { blobColor: value });
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setEditingId(null)}
            className="task-button self-start bg-[color:var(--surface-soft)] px-6 text-[color:var(--ink-soft)]"
          >
            Fermer
          </button>
        </div>
      ) : null}

      {/* Toast auto-save : réapparaît à chaque sauvegarde, se masque en CSS. */}
      {savedTick > 0 ? (
        <div key={savedTick} className="save-toast" role="status">
          ✓ Modification enregistrée
        </div>
      ) : null}

      {adding ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-[color:var(--shell)] pt-4">
          <AvatarPicker options={CHILD_AVATARS} value={avatar} onChange={setAvatar} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Prénom de l'enfant"
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!name.trim() || busy}
              className="task-button bg-[color:var(--success)] text-white disabled:opacity-60"
            >
              Ajouter
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MissionsCard({
  parentId,
  childId,
  missions,
}: {
  parentId: string;
  childId: string;
  missions: Mission[];
}) {
  const [showPresets, setShowPresets] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [title, setTitle] = useState("");
  const [points, setPoints] = useState(10);
  const [icon, setIcon] = useState(MISSION_ICONS[0]);
  const [busy, setBusy] = useState(false);

  const remaining = MAX_MISSIONS - missions.length;
  const atLimit = remaining <= 0;
  const existingTitles = useMemo(
    () => new Set(missions.map((mission) => mission.title.toLowerCase())),
    [missions]
  );

  const presetItems: PresetItem[] = MISSION_PRESETS.map((preset) => ({
    id: preset.title,
    title: preset.title,
    icon: preset.icon,
    sub: `${preset.points} pts`,
    alreadyAdded: existingTitles.has(preset.title.toLowerCase()),
  }));

  async function addPresets(ids: string[]) {
    const chosen = MISSION_PRESETS.filter((preset) => ids.includes(preset.title));
    const toAdd = chosen.slice(0, Math.max(0, remaining));
    await Promise.all(
      toAdd.map((preset: MissionPreset, index) =>
        addMission(parentId, childId, {
          title: preset.title,
          points: preset.points,
          icon: preset.icon,
          order: missions.length + index + 1,
        })
      )
    );
    setShowPresets(false);
  }

  async function addCustom() {
    const trimmed = title.trim();
    if (!trimmed || busy || atLimit) {
      return;
    }
    setBusy(true);
    try {
      await addMission(parentId, childId, {
        title: trimmed,
        points,
        icon,
        order: missions.length + 1,
      });
      setTitle("");
      setPoints(10);
      setIcon(MISSION_ICONS[0]);
      setShowCustom(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel-card flex min-w-0 flex-col overflow-hidden p-4 sm:p-6">
      <div className="flex min-w-0 items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--primary)]/15 text-2xl"
          >
            🎯
          </span>
          <div className="min-w-0">
            <p className="section-kicker">Routine du matin</p>
            <h2 className="parent-section-title mt-2 break-words font-display text-3xl leading-none text-foreground">
              Missions
            </h2>
          </div>
        </div>
        <div className="count-pill">
          {missions.length}/{MAX_MISSIONS}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowPresets(true)}
          disabled={atLimit}
          className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--primary)] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
        >
          <PiSparkleFill aria-hidden="true" /> Suggestions
        </button>
        <button
          type="button"
          onClick={() => setShowCustom((value) => !value)}
          disabled={atLimit}
          className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--surface-soft)] px-4 py-2 text-sm font-extrabold text-[color:var(--ink-soft)] disabled:opacity-60"
        >
          <PiPlusBold aria-hidden="true" /> Sur-mesure
        </button>
      </div>

      {showCustom ? (
        <div className="mt-4 flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl bg-[color:var(--surface-soft)] p-4">
          <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
            {MISSION_ICONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setIcon(option)}
                aria-pressed={icon === option}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition ${
                  icon === option ? "bg-[color:var(--shell)]" : "bg-[color:var(--surface)]"
                }`}
              >
                <span aria-hidden="true">{option}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex : Nourrir le chat"
            className={inputClass}
          />
          <div className="grid min-w-0 gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <label className="flex min-w-0 items-center gap-2 text-sm font-extrabold text-[color:var(--ink-soft)]">
              Points
              <input
                type="number"
                min={1}
                value={points}
                onChange={(event) =>
                  setPoints(Math.max(1, Number(event.target.value)))
                }
                className="w-20 rounded-2xl border-2 border-[color:var(--shell)] px-3 py-2 text-base font-bold text-foreground outline-none focus-visible:border-[color:var(--primary)]"
              />
            </label>
            <button
              type="button"
              onClick={addCustom}
              disabled={!title.trim() || busy}
              className="task-button w-full min-w-0 bg-[color:var(--primary)] text-white disabled:opacity-60"
            >
              Ajouter
            </button>
          </div>
        </div>
      ) : null}

      <ul className="mt-4 flex flex-1 flex-col gap-2">
        {missions.map((mission) => (
          <li
            key={mission.id}
            className="mission-row flex min-w-0 items-center gap-3 rounded-2xl bg-[color:var(--surface-soft)] p-3"
          >
            <span className="mission-row-icon text-2xl" aria-hidden="true">
              {mission.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="parent-item-title mission-row-title text-base font-black text-foreground">
                {mission.title}
              </p>
              <p className="text-xs font-bold text-[color:var(--ink-soft)]">
                {mission.points} points
              </p>
            </div>
            <button
              type="button"
              onClick={() => deleteMission(parentId, childId, mission.id)}
              aria-label={`Supprimer ${mission.title}`}
              className="text-[color:var(--ink-soft)] transition hover:text-[color:var(--secondary)]"
            >
              <PiTrashBold aria-hidden="true" />
            </button>
          </li>
        ))}
        {missions.length === 0 ? (
          <li className="rounded-2xl border-2 border-dashed border-[color:var(--shell)] p-5 text-center text-sm font-bold text-[color:var(--ink-soft)]">
            Touche « Suggestions » pour ajouter des missions en un clic.
          </li>
        ) : null}
      </ul>

      {showPresets ? (
        <PresetSheet
          title="Missions suggérées"
          subtitle={`Choisis-en jusqu'à ${remaining} (max ${MAX_MISSIONS}).`}
          items={presetItems}
          limit={remaining}
          onClose={() => setShowPresets(false)}
          onConfirm={addPresets}
        />
      ) : null}
    </section>
  );
}

// Un coffre = une section : son palier, ses récompenses, et ses propres
// actions « Suggérer » (presets adaptés au palier) + « Sur-mesure ».
function ChestGroup({
  parentId,
  childId,
  tier,
  rewards,
}: {
  parentId: string;
  childId: string;
  tier: RewardTier;
  rewards: Reward[];
}) {
  const chest = REWARD_TIERS.find((entry) => entry.tier === tier)!;
  const cost = CHEST_COSTS[tier];
  const items = rewards.filter((reward) => reward.tier === tier);

  const [showPresets, setShowPresets] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState(REWARD_ICONS[0]);
  const [busy, setBusy] = useState(false);

  const existingTitles = useMemo(
    () => new Set(rewards.map((reward) => reward.title.toLowerCase())),
    [rewards]
  );

  // Presets dont le coût correspond à ce coffre (bronze < 40, argent 40-60, or > 60).
  const tierPresets = REWARD_PRESETS.filter(
    (preset) => tierFromPointsCost(preset.pointsCost) === tier
  );
  const presetItems: PresetItem[] = tierPresets.map((preset) => ({
    id: preset.title,
    title: preset.title,
    icon: preset.icon,
    sub: chest.chestName,
    alreadyAdded: existingTitles.has(preset.title.toLowerCase()),
  }));

  async function addPresets(ids: string[]) {
    const chosen = tierPresets.filter((preset) => ids.includes(preset.title));
    await Promise.all(
      chosen.map((preset: RewardPreset) =>
        addReward(parentId, childId, {
          title: preset.title,
          tier,
          icon: preset.icon,
        })
      )
    );
    setShowPresets(false);
  }

  async function addCustom() {
    const trimmed = title.trim();
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    try {
      await addReward(parentId, childId, { title: trimmed, tier, icon });
      setTitle("");
      setIcon(REWARD_ICONS[0]);
      setShowCustom(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chest-group min-w-0 overflow-hidden rounded-[1.5rem] border-2 border-[color:var(--shell)] p-3 sm:p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="chest-group-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl"
          style={{ backgroundColor: `${chest.accent}22`, color: chest.accent }}
        >
          <PiTreasureChestFill aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="chest-group-title text-base font-black text-foreground">
            {chest.chestName}
          </p>
          <p className="chest-group-sub text-xs font-bold text-[color:var(--ink-soft)]">
            {cost} pts · {items.length} récompense{items.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="chest-group-actions mt-3 grid grid-cols-2 gap-2">
        {tierPresets.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowPresets(true)}
            className="chest-action-button inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-2xl bg-[color:var(--tertiary)] px-3 py-2 text-xs font-extrabold text-[color:var(--ink)]"
          >
            <PiSparkleFill aria-hidden="true" /> Suggérer
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setShowCustom((value) => !value)}
          className="chest-action-button inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-2xl bg-[color:var(--surface-soft)] px-3 py-2 text-xs font-extrabold text-[color:var(--ink-soft)]"
        >
          <PiPlusBold aria-hidden="true" /> Sur-mesure
        </button>
      </div>

      {showCustom ? (
        <div className="mt-3 flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl bg-[color:var(--surface-soft)] p-4">
          <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
            {REWARD_ICONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setIcon(option)}
                aria-pressed={icon === option}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition ${
                  icon === option ? "bg-[color:var(--shell)]" : "bg-[color:var(--surface)]"
                }`}
              >
                <span aria-hidden="true">{option}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex : Soirée pyjama"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!title.trim() || busy}
            className="task-button w-full bg-[color:var(--primary)] text-white disabled:opacity-60"
          >
            Ajouter au {chest.chestName.toLowerCase()}
          </button>
        </div>
      ) : null}

      <ul className="mt-3 flex flex-col gap-2">
        {items.map((reward) => (
          <li
            key={reward.id}
            className="reward-row flex min-w-0 items-center gap-3 rounded-2xl bg-[color:var(--surface-soft)] p-3"
          >
            <span className="reward-row-icon text-2xl" aria-hidden="true">
              {reward.icon}
            </span>
            <p className="parent-item-title reward-row-title min-w-0 flex-1 text-base font-black text-foreground">
              {reward.title}
            </p>
            <button
              type="button"
              onClick={() => deleteReward(parentId, childId, reward.id)}
              aria-label={`Supprimer ${reward.title}`}
              className="text-[color:var(--ink-soft)] transition hover:text-[color:var(--secondary)]"
            >
              <PiTrashBold aria-hidden="true" />
            </button>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="rounded-2xl border-2 border-dashed border-[color:var(--shell)] p-4 text-center text-xs font-bold text-[color:var(--ink-soft)]">
            Coffre vide — ajoute une surprise.
          </li>
        ) : null}
      </ul>

      {showPresets ? (
        <PresetSheet
          title={`Suggestions ${chest.chestName.toLowerCase()}`}
          subtitle="Choisis les surprises à glisser dans ce coffre."
          items={presetItems}
          onClose={() => setShowPresets(false)}
          onConfirm={addPresets}
        />
      ) : null}
    </div>
  );
}

function RewardsCard({
  parentId,
  childId,
  rewards,
}: {
  parentId: string;
  childId: string;
  rewards: Reward[];
}) {
  return (
    <section className="panel-card flex min-w-0 flex-col overflow-hidden p-4 sm:p-6">
      <div className="rewards-card-header grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="rewards-card-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--tertiary)]/25 text-2xl"
          >
            🎁
          </span>
          <div className="min-w-0">
            <p className="section-kicker rewards-card-kicker">À débloquer</p>
            <h2 className="parent-section-title mt-2 break-words font-display text-3xl leading-none text-foreground">
              Récompenses
            </h2>
          </div>
        </div>
        <div className="count-pill">{rewards.length}</div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {REWARD_TIERS.map((chest) => (
          <ChestGroup
            key={chest.tier}
            parentId={parentId}
            childId={childId}
            tier={chest.tier}
            rewards={rewards}
          />
        ))}
      </div>
    </section>
  );
}

export function ParentDashboard() {
  const { user, loading, signOut } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [firstSetup, setFirstSetup] = useState<{
    parentId: string;
    childId: string;
  } | null>(null);

  const parentId = user?.uid ?? null;
  const firstSetupChildId =
    firstSetup?.parentId === parentId ? firstSetup.childId : null;

  const activeChildId = useMemo(() => {
    if (
      firstSetupChildId &&
      children.some((child) => child.id === firstSetupChildId)
    ) {
      return firstSetupChildId;
    }
    if (selectedChildId && children.some((child) => child.id === selectedChildId)) {
      return selectedChildId;
    }
    return children[0]?.id ?? null;
  }, [firstSetupChildId, selectedChildId, children]);

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

  const activeChild = useMemo(
    () => children.find((child) => child.id === activeChildId) ?? null,
    [children, activeChildId]
  );

  const firstSetupChild = useMemo(
    () => children.find((child) => child.id === firstSetupChildId) ?? null,
    [children, firstSetupChildId]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-black text-[color:var(--ink-soft)]">
          Chargement…
        </p>
      </div>
    );
  }

  if (!user || !parentId) {
    return <SignInScreen />;
  }

  return (
    <main className="page-stage min-h-screen overflow-x-hidden px-2 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-5">
        <Header
          name={user.displayName ?? user.email ?? "Parent"}
          onSignOut={() => {
            setFirstSetup(null);
            setSelectedChildId(null);
            void signOut();
          }}
        />

        {firstSetupChildId ? (
          firstSetupChild ? (
            <FirstSetup
              parentId={parentId}
              child={firstSetupChild}
              missions={missions}
              rewards={rewards}
              onDone={() => setFirstSetup(null)}
            />
          ) : (
            <section className="panel-card mx-auto w-full max-w-lg p-6 text-center sm:p-8">
              <p className="text-base font-black text-[color:var(--ink-soft)]">
                Préparation du profil...
              </p>
            </section>
          )
        ) : children.length === 0 ? (
          <ChildCreation
            parentId={parentId}
            onCreated={(childId) => {
              setSelectedChildId(childId);
              setFirstSetup({ parentId, childId });
            }}
          />
        ) : (
          <>
            <ChildBar
              parentId={parentId}
              kids={children}
              activeChildId={activeChildId}
              onSelect={setSelectedChildId}
            />

            {activeChild ? (
              <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                <MissionsCard
                  parentId={parentId}
                  childId={activeChild.id}
                  missions={missions}
                />
                <RewardsCard
                  parentId={parentId}
                  childId={activeChild.id}
                  rewards={rewards}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

type AuthMode = "signin" | "signup" | "reset";

function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  if (code.includes("email-already-in-use")) {
    return "Ce compte existe déjà. Essaie plutôt de te connecter.";
  }
  if (code.includes("invalid-email")) {
    return "Cette adresse e-mail a l'air bizarre. Vérifie vite fait.";
  }
  if (code.includes("invalid-credential") || code.includes("wrong-password")) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (code.includes("weak-password")) {
    return "Choisis un mot de passe d'au moins 6 caractères.";
  }
  if (code.includes("user-not-found")) {
    return "Aucun compte trouvé avec cette adresse.";
  }
  if (code.includes("too-many-requests")) {
    return "Trop d'essais d'un coup. Attends un petit moment puis réessaie.";
  }
  if (code.includes("popup-closed-by-user")) {
    return "Connexion annulée. Rien de grave.";
  }

  return "Ça n'a pas marché. Réessaie dans un instant.";
}

function SignInScreen() {
  const { resetPassword, signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignup = mode === "signup";
  const isReset = mode === "reset";
  const title = isReset
    ? "On récupère l'accès"
    : isSignup
      ? "Créer ton compte"
      : "Content de te revoir";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setNotice(null);
  }

  async function handleGoogleSignIn() {
    setError(null);
    setNotice(null);
    try {
      await signIn();
    } catch (nextError) {
      setError(authErrorMessage(nextError));
    }
  }

  async function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();

    setError(null);
    setNotice(null);

    if (!trimmedEmail) {
      setError("Ajoute ton e-mail pour continuer.");
      return;
    }

    if (isReset) {
      setBusy(true);
      try {
        await resetPassword(trimmedEmail);
        setNotice("Lien envoyé. Regarde ta boîte mail quand tu as deux minutes.");
      } catch (nextError) {
        setError(authErrorMessage(nextError));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!password) {
      setError("Ajoute ton mot de passe.");
      return;
    }

    setBusy(true);
    try {
      if (isSignup) {
        await signUpWithEmail(trimmedEmail, password, name, remember);
      } else {
        await signInWithEmail(trimmedEmail, password, remember);
      }
    } catch (nextError) {
      setError(authErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-stage flex min-h-screen flex-col items-center justify-start gap-4 px-3 py-4 sm:justify-center sm:gap-5 sm:px-5 sm:py-8">
      <section className="panel-card mx-auto grid w-full max-w-4xl gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <div className="flex flex-col justify-between rounded-[1.35rem] bg-[color:var(--primary)] p-5 text-white sm:rounded-[1.5rem] sm:p-6">
          <div className="text-center">
            <h1 className="font-display text-5xl leading-none sm:text-7xl">
              Skadoush
            </h1>
            <h2 className="mt-5 font-display text-3xl leading-none sm:mt-7 sm:text-4xl">
              Bienvenue dans le cockpit du matin.
            </h2>
            <p className="mt-4 text-base font-bold leading-7 text-white/90">
              L&apos;app qui transforme les petites routines en grandes victoires,
              sans mettre toute la famille au garde-à-vous.
            </p>
          </div>

          <div className="mt-6 grid gap-2 text-sm font-extrabold text-white/90 sm:mt-8 sm:gap-3">
            <span className="rounded-2xl bg-white/15 px-4 py-3">
              Missions simples
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-3">
              Coffres et récompenses
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-3">
              Un compte, toute la tribu
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex rounded-2xl bg-[color:var(--surface-soft)] p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 rounded-xl px-3 py-3 text-sm font-black transition ${
                mode === "signin"
                  ? "bg-[color:var(--surface)] text-foreground shadow-sm"
                  : "text-[color:var(--ink-soft)]"
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded-xl px-3 py-3 text-sm font-black transition ${
                mode === "signup"
                  ? "bg-[color:var(--surface)] text-foreground shadow-sm"
                  : "text-[color:var(--ink-soft)]"
              }`}
            >
              Créer un compte
            </button>
          </div>

          <div className="mt-5 sm:mt-7">
            <p className="section-kicker">Compte adulte</p>
            <h2 className="mt-3 font-display text-3xl leading-none text-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-base font-bold leading-7 text-[color:var(--ink-soft)]">
              {isReset
                ? "Entre ton e-mail, on t'envoie un lien pour repartir tranquille."
                : "Google ou e-mail classique, choisis ce qui t'arrange."}
            </p>
          </div>

          {!isReset ? (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="task-button mt-6 w-full bg-[color:var(--foreground)] text-white disabled:opacity-60"
            >
              Continuer avec Google
            </button>
          ) : null}

          <div className="my-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.08em] text-[color:var(--ink-soft)]">
            <span className="h-px flex-1 bg-[color:var(--shell)]" />
            {isReset ? "Reset" : "ou"}
            <span className="h-px flex-1 bg-[color:var(--shell)]" />
          </div>

          <form className="flex flex-col gap-3" onSubmit={handleEmailAuth}>
            {isSignup ? (
              <label className="text-left text-sm font-black text-[color:var(--ink-soft)]">
                Ton prénom
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="given-name"
                  placeholder="Ex : Camille"
                  className={`${inputClass} mt-2`}
                />
              </label>
            ) : null}

            <label className="text-left text-sm font-black text-[color:var(--ink-soft)]">
              E-mail
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="toi@email.com"
                className={`${inputClass} mt-2`}
              />
            </label>

            {!isReset ? (
              <label className="text-left text-sm font-black text-[color:var(--ink-soft)]">
                Mot de passe
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="Au moins 6 caractères"
                  className={`${inputClass} mt-2`}
                />
              </label>
            ) : null}

            {!isReset ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-sm font-extrabold text-[color:var(--ink-soft)]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 accent-[color:var(--primary)]"
                  />
                  Rester connecté
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="text-sm font-extrabold text-[color:var(--primary)]"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="task-button mt-2 w-full bg-[color:var(--primary)] text-white disabled:opacity-60"
            >
              {busy
                ? "Deux secondes..."
                : isReset
                  ? "Envoyer le lien"
                  : isSignup
                    ? "Créer le compte"
                    : "Se connecter"}
            </button>
          </form>

          {error ? (
            <p className="mt-4 rounded-2xl bg-[color:var(--secondary)]/10 px-4 py-3 text-sm font-bold text-[color:var(--secondary)]">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="mt-4 rounded-2xl bg-[color:var(--success)]/12 px-4 py-3 text-sm font-bold text-[color:var(--success)]">
              {notice}
            </p>
          ) : null}

          {isReset ? (
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="mt-5 text-sm font-extrabold text-[color:var(--ink-soft)]"
            >
              Retour à la connexion
            </button>
          ) : null}

          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center gap-2 text-sm font-extrabold text-[color:var(--ink-soft)]"
          >
            <PiArrowLeftBold aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-4xl flex-wrap justify-center gap-2 px-1 text-center text-xs font-bold text-[color:var(--ink-soft)] sm:justify-between sm:gap-3 sm:text-left">
        <a href="mailto:gillian.levert.dev@gmail.com">
          gillian.levert.dev@gmail.com
        </a>
        <a href="https://www.gillianlevert.fr" target="_blank" rel="noreferrer">
          www.gillianlevert.fr
        </a>
      </footer>
    </main>
  );
}
