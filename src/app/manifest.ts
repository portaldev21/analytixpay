import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ControleFatura - Controle suas faturas com inteligencia",
    short_name: "ControleFatura",
    description:
      "Gestao inteligente de faturas de cartao de credito. Acompanhe gastos, categorize transacoes e tenha controle total das suas financas.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F3B57",
    theme_color: "#0F3B57",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
