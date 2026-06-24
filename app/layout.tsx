import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Nutribela AI — Receitas Reais Para Sua Saúde",
  description: "Diga o que tem em casa e receba receitas reais da Nutri Bela com calorias, macros e índice glicêmico.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#E84C3D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <div className="pagina">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
