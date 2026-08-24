import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { purchaseService } from "@/lib/app-services";
import { apiError } from "@/lib/http";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [user, { id }] = await Promise.all([requireUser(["CUSTOMER"]), params]);
    return NextResponse.json({ purchase: await purchaseService.confirmDelivery(user, id) });
  } catch (error) {
    return apiError(error);
  }
}
