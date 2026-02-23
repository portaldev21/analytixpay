import type { Metadata, Viewport } from "next";
import { Merriweather, Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ControleFatura - Controle suas faturas com inteligência",
  description:
    "Gestão inteligente de faturas de cartão de crédito. Acompanhe gastos, categorize transações e tenha controle total das suas finanças.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0F3B57",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${merriweather.variable} ${inter.variable} ${robotoMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground)",
            },
          }}
        />
      </body>
    </html>
  );
}
