import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createPurchaseSchema } from "@/lib/domain/schemas";
import { apiError } from "@/lib/http";
import { purchaseService } from "@/lib/app-services";

export async function GET() {
  try {
    const user = await requireUser(["CUSTOMER", "BUYER", "ADMIN"]);
    return NextResponse.json({ purchases: await purchaseService.listFor(user) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["CUSTOMER"]);
    const input = createPurchaseSchema.parse(await request.json());
    return NextResponse.json(
      { purchase: await purchaseService.create(user, input) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
