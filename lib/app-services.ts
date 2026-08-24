import { MemoryPurchaseRepository } from "@/lib/repositories/memory-purchase-repository";
import { PurchaseService } from "@/lib/services/purchase-service";

export const purchaseRepository = new MemoryPurchaseRepository();
export const purchaseService = new PurchaseService(purchaseRepository);
