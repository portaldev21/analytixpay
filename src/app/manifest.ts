import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/budget",
    name: "ControleFatura",
    short_name: "Financeiro",
    description:
      "Controle de gasto diario. Veja quanto pode gastar hoje e lance o gasto na hora.",
    // Straight to the budget screen: logging an expense has to cost less
    // effort than not logging it.
    start_url: "/budget",
    display: "standalone",
    background_color: "#0F3B57",
    theme_color: "#0F3B57",
    icons: [
      // Static files, not a generated route: the old one ignored the size it
      // was asked for and always answered 32x32, so Chrome refused to install
      // the app and made a plain shortcut instead.
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
