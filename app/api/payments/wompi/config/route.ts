import { wompiConfigurationStatus } from "@/lib/wompi";
import { whatsappOperationsConfigured } from "@/lib/whatsapp-operations";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = wompiConfigurationStatus();
  const whatsappNotifications = whatsappOperationsConfigured();
  return Response.json({
    configured: status.configured && whatsappNotifications,
    environment: status.environment,
    whatsappNotifications,
  });
}
