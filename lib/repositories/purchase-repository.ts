import type { PurchaseRequest, ZoneConfig } from "@/lib/types";

export interface PurchaseRepository {
  listPurchases(): Promise<PurchaseRequest[]>;
  getPurchase(id: string): Promise<PurchaseRequest | undefined>;
  savePurchase(purchase: PurchaseRequest): Promise<PurchaseRequest>;
  listZones(): Promise<ZoneConfig[]>;
  saveZone(zone: ZoneConfig): Promise<ZoneConfig>;
}
