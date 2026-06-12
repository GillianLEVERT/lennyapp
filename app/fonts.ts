import {
  Baloo_2,
  Fredoka,
  Luckiest_Guy,
  Nunito,
  Quicksand,
} from "next/font/google";

// Polices de l'espace parent : Baloo 2 partout (corps + titres) pour rester
// cohérent avec la vue enfant (le thème Jelly utilise aussi Baloo 2).
export const bodyFont = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-body-family",
});

export const displayFont = Baloo_2({
  subsets: ["latin"],
  weight: "800",
  display: "swap",
  variable: "--font-display-family",
});

// Polices des 3 thèmes Skadoush (Jelly / Arcade / Cosmic).
// Chaque thème référence ces variables via lib/themes.ts.
export const balooFont = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-baloo",
});

export const nunitoFont = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-nunito",
});

export const luckiestFont = Luckiest_Guy({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-luckiest",
});

export const fredokaFont = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-fredoka",
});

export const quicksandFont = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-quicksand",
});
