import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { productOptionSchema } from "@/lib/domain/schemas";
import { purchaseService } from "@/lib/app-services";
import { apiError } from "@/lib/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [user, { id }] = await Promise.all([
      requireUser(["BUYER"]),
      params,
    ]);
    const input = productOptionSchema.parse(await request.json());
    return NextResponse.json({ purchase: await purchaseService.addOption(user, id, input) });
  } catch (error) {
    return apiError(error);
  }
}
