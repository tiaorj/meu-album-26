import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Meu Álbum 26",
    short_name: "Álbum 26",

    description:
      "Organize suas figurinhas da Copa 2026, acompanhe as coladas, faltantes e repetidas.",

    start_url: "/painel",
    scope: "/",

    display: "standalone",
    orientation: "portrait",

    background_color: "#f1f5f9",
    theme_color: "#15803d",

    lang: "pt-BR",

    categories: [
      "sports",
      "entertainment",
      "utilities",
    ],

    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}