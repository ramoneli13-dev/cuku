import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { messageSchema } from "@/lib/domain/schemas";
import { purchaseService } from "@/lib/app-services";
import { apiError } from "@/lib/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [user, { id }] = await Promise.all([
      requireUser(["CUSTOMER", "BUYER", "ADMIN"]),
      params,
    ]);
    const input = messageSchema.parse(await request.json());
    return NextResponse.json({ purchase: await purchaseService.addMessage(user, id, input) });
  } catch (error) {
    return apiError(error);
  }
}
