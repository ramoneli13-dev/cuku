import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cúku | Compra por mí en Cúcuta",
  description:
    "Cúku conecta compras, diligencias y entregas en Cúcuta y sus alrededores con aprobación antes de pagar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
