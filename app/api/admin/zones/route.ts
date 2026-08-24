import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { zoneUpdateSchema } from "@/lib/domain/schemas";
import { apiError } from "@/lib/http";
import { purchaseRepository } from "@/lib/app-services";

export async function GET() {
  try {
    await requireUser(["CUSTOMER", "BUYER", "ADMIN"]);
    return NextResponse.json({ zones: await purchaseRepository.listZones() });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireUser(["ADMIN"]);
    const input = zoneUpdateSchema.parse(await request.json());
    const existing = (await purchaseRepository.listZones()).find((zone) => zone.id === input.id);
    if (!existing) {
      return NextResponse.json({ error: "Zona no encontrada.", code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ zone: await purchaseRepository.saveZone({ ...existing, ...input }) });
  } catch (error) {
    return apiError(error);
  }
}
