import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { optionDecisionSchema } from "@/lib/domain/schemas";
import { purchaseService } from "@/lib/app-services";
import { apiError } from "@/lib/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; optionId: string }> },
) {
  try {
    const [user, { id, optionId }] = await Promise.all([
      requireUser(["CUSTOMER"]),
      params,
    ]);
    const input = optionDecisionSchema.parse(await request.json());
    return NextResponse.json({
      purchase: await purchaseService.decideOption(
        user,
        id,
        optionId,
        input.decision,
        input.approveOverage,
      ),
    });
  } catch (error) {
    return apiError(error);
  }
}
