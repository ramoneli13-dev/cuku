import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { purchaseService } from "@/lib/app-services";
import { apiError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser(["ADMIN"]);
    return NextResponse.json({ metrics: await purchaseService.metrics(user) });
  } catch (error) {
    return apiError(error);
  }
}
