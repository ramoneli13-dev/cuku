import { headers } from "next/headers";
import { DomainError } from "@/lib/domain/errors";
import type { DemoUser, UserRole } from "@/lib/types";

export const demoUsers: DemoUser[] = [
  { id: "customer-1", name: "Cliente demo", role: "CUSTOMER" },
  { id: "buyer-1", name: "Comprador demo", role: "BUYER" },
  { id: "admin-1", name: "Administrador", role: "ADMIN" },
];

export async function requireUser(allowedRoles: UserRole[]): Promise<DemoUser> {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("x-demo-user-id");
  const user = demoUsers.find((candidate) => candidate.id === userId);

  if (!user) {
    throw new DomainError("Debes identificarte para continuar.", 401, "UNAUTHENTICATED");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new DomainError("No tienes permiso para realizar esta acción.", 403, "FORBIDDEN");
  }
  return user;
}
