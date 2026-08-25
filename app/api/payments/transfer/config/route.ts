import { directTransferConfiguration } from "@/lib/direct-transfer";
import { whatsappOperationsConfigured } from "@/lib/whatsapp-operations";

export const dynamic = "force-dynamic";

export async function GET() {
  const configuration = directTransferConfiguration();
  return Response.json({
    configured:
      configuration.configured &&
      configuration.aiReview &&
      configuration.bankConfirmation &&
      whatsappOperationsConfigured(),
    dynamicQr: configuration.dynamicQr,
    aiReview: configuration.aiReview,
    bankConfirmation: configuration.bankConfirmation,
    operationsNotification: whatsappOperationsConfigured(),
  });
}
