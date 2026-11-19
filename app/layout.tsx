import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: "FRACTALE Sport Management · El éxito está en el sur",
  description:
    "Plataforma integral de gestión y marketing deportivo en el sur de Chile. Acompañamiento 360° al atleta, eventos de alto estándar y alianzas de marca con retorno medible. Puerto Montt, Región de Los Lagos.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "FRACTALE Sport Management · El éxito está en el sur",
    description: "Gestión y marketing deportivo desde el sur de Chile. Atletas, eventos y marcas.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
