import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mission Héros du Matin",
    short_name: "Mission Héros",
    description:
      "La routine du matin devient un mini jeu mobile pour débloquer le temps de jeu et gagner des récompenses famille.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F8FBFF",
    theme_color: "#2E5BFF",
    lang: "fr-FR",
    categories: ["games", "lifestyle", "education"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
