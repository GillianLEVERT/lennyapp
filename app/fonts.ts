import { Baloo_2, Bangers } from "next/font/google";

export const bodyFont = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-body-family",
});

export const displayFont = Bangers({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display-family",
});
