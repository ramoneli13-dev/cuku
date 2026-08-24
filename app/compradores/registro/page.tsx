import type { Metadata } from "next";
import { BuyerAuthForm } from "@/components/BuyerAuthForm";

export const metadata: Metadata = {
  title: "Registro de compradores | Cúku",
  description: "Regístrate para trabajar como comprador local de Cúku en Cúcuta.",
};

export default function BuyerRegistrationPage() {
  return <BuyerAuthForm mode="register" />;
}
