import type { PurchaseRepository } from "@/lib/repositories/purchase-repository";
import type { PurchaseRequest, ZoneConfig } from "@/lib/types";

interface MemoryDatabase {
  purchases: Map<string, PurchaseRequest>;
  zones: Map<string, ZoneConfig>;
}

const defaultZones: ZoneConfig[] = [
  {
    id: "cucuta",
    name: "Cúcuta",
    active: true,
    baseFee: 7_000,
    perKmFee: 1_200,
    remoteSurcharge: 0,
    serviceStart: "07:00",
    serviceEnd: "21:00",
  },
  {
    id: "los-patios",
    name: "Los Patios",
    active: true,
    baseFee: 8_000,
    perKmFee: 1_300,
    remoteSurcharge: 2_000,
    serviceStart: "07:00",
    serviceEnd: "20:00",
  },
  {
    id: "villa-del-rosario",
    name: "Villa del Rosario",
    active: true,
    baseFee: 8_000,
    perKmFee: 1_300,
    remoteSurcharge: 2_000,
    serviceStart: "07:00",
    serviceEnd: "20:00",
  },
  {
    id: "el-zulia",
    name: "El Zulia",
    active: true,
    baseFee: 10_000,
    perKmFee: 1_500,
    remoteSurcharge: 5_000,
    serviceStart: "08:00",
    serviceEnd: "19:00",
  },
];

function createDatabase(): MemoryDatabase {
  return {
    purchases: new Map(),
    zones: new Map(defaultZones.map((zone) => [zone.id, zone])),
  };
}

const globalDatabase = globalThis as typeof globalThis & {
  compraPorMiDb?: MemoryDatabase;
};

export class MemoryPurchaseRepository implements PurchaseRepository {
  private readonly database: MemoryDatabase;

  constructor(database?: MemoryDatabase) {
    this.database = database ?? (globalDatabase.compraPorMiDb ??= createDatabase());
  }

  static isolated(): MemoryPurchaseRepository {
    return new MemoryPurchaseRepository(createDatabase());
  }

  async listPurchases(): Promise<PurchaseRequest[]> {
    return [...this.database.purchases.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async getPurchase(id: string): Promise<PurchaseRequest | undefined> {
    return this.database.purchases.get(id);
  }

  async savePurchase(purchase: PurchaseRequest): Promise<PurchaseRequest> {
    const nextPurchase = structuredClone(purchase);
    this.database.purchases.set(purchase.id, nextPurchase);
    return structuredClone(nextPurchase);
  }

  async listZones(): Promise<ZoneConfig[]> {
    return [...this.database.zones.values()].map((zone) => ({ ...zone }));
  }

  async saveZone(zone: ZoneConfig): Promise<ZoneConfig> {
    this.database.zones.set(zone.id, { ...zone });
    return { ...zone };
  }
}
