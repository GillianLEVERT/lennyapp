import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skadoush",
    short_name: "Skadoush",
    description:
      "Skadoush transforme la routine du matin en missions à points et récompenses à débloquer.",
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
