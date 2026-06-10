"use client";

import dynamic from "next/dynamic";

// Chargé uniquement côté client : tout le code Firebase reste hors du serveur.
const ParentDashboard = dynamic(
  () =>
    import("@/components/parent/parent-dashboard").then(
      (mod) => mod.ParentDashboard
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-black text-[color:var(--ink-soft)]">
          Chargement…
        </p>
      </div>
    ),
  }
);

export default function ParentPage() {
  return <ParentDashboard />;
}
