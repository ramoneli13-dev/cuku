import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Cúku | Tu ciudad, a tu alcance",
  description:
    "Compra productos y resuelve diligencias en Cúcuta con ayuda de un comprador local. Tú eliges, apruebas y recibes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
