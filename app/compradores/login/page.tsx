import type { Metadata } from "next";
import { BuyerAuthForm } from "@/components/BuyerAuthForm";

export const metadata: Metadata = {
  title: "Acceso de compradores | Cúku",
  description: "Inicia sesión en tu cuenta de comprador de Cúku.",
};

export default function BuyerLoginPage() {
  return <BuyerAuthForm mode="login" />;
}
