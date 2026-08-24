import { assertDomain } from "@/lib/domain/errors";
import type { PurchaseRepository } from "@/lib/repositories/purchase-repository";
import type {
  AdminMetrics,
  CreatePurchaseInput,
  DemoUser,
  OrderMessage,
  ProductOption,
  PurchaseRequest,
  ServiceType,
} from "@/lib/types";

const BUYER_FEE = 8_000;
const PLATFORM_FEE = 3_000;

function now(): string {
  return new Date().toISOString();
}

function systemMessage(text: string): OrderMessage {
  return {
    id: crypto.randomUUID(),
    senderId: "system",
    senderRole: "ADMIN",
    text,
    type: "SYSTEM",
    createdAt: now(),
  };
}

export class PurchaseService {
  constructor(private readonly repository: PurchaseRepository) {}

  async listFor(user: DemoUser): Promise<PurchaseRequest[]> {
    const purchases = await this.repository.listPurchases();
    if (user.role === "ADMIN") return purchases;
    if (user.role === "BUYER") {
      return purchases.filter(
        (purchase) => purchase.status === "OPEN" || purchase.buyerId === user.id,
      );
    }
    return purchases.filter((purchase) => purchase.customerId === user.id);
  }

  async create(customer: DemoUser, input: CreatePurchaseInput): Promise<PurchaseRequest> {
    assertDomain(customer.role === "CUSTOMER", "Solo un cliente puede crear solicitudes.", 403);
    const zone = (await this.repository.listZones()).find((item) => item.id === input.zoneId);
    assertDomain(zone?.active, "La zona seleccionada no está disponible.");

    const deliveryFee =
      zone.baseFee + Math.round(zone.perKmFee * input.distanceKm) + zone.remoteSurcharge;
    const timestamp = now();
    const purchase: PurchaseRequest = {
      id: crypto.randomUUID(),
      customerId: customer.id,
      serviceType: input.serviceType,
      status: "OPEN",
      title: input.title,
      description: input.description,
      businessName: input.businessName || undefined,
      businessAddress: input.businessAddress || undefined,
      doesNotKnowStore: input.doesNotKnowStore,
      product: input.product,
      size: input.size || undefined,
      color: input.color || undefined,
      brand: input.brand || undefined,
      quantity: input.quantity,
      maxBudget: input.maxBudget,
      specialInstructions: input.specialInstructions || undefined,
      referenceImages: input.referenceImages,
      deliveryAddress: input.deliveryAddress,
      zoneId: input.zoneId,
      distanceKm: input.distanceKm,
      options: [],
      messages: [systemMessage("Solicitud creada y disponible para compradores.")],
      costs: {
        productCost: 0,
        buyerFee: BUYER_FEE,
        deliveryFee,
        platformFee: PLATFORM_FEE,
        tip: input.tip,
        total: BUYER_FEE + deliveryFee + PLATFORM_FEE + input.tip,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return this.repository.savePurchase(purchase);
  }

  async accept(buyer: DemoUser, id: string): Promise<PurchaseRequest> {
    assertDomain(buyer.role === "BUYER", "Solo un comprador puede aceptar solicitudes.", 403);
    const purchase = await this.requirePurchase(id);
    assertDomain(purchase.status === "OPEN", "La solicitud ya no está disponible.", 409);
    purchase.buyerId = buyer.id;
    purchase.status = "ACCEPTED";
    purchase.updatedAt = now();
    purchase.messages.push(systemMessage(`${buyer.name} aceptó la solicitud.`));
    return this.repository.savePurchase(purchase);
  }

  async addOption(
    buyer: DemoUser,
    id: string,
    input: Omit<ProductOption, "id" | "decision" | "createdAt">,
  ): Promise<PurchaseRequest> {
    const purchase = await this.requireAssignedBuyer(buyer, id);
    assertDomain(
      ["ACCEPTED", "OPTIONS_SENT"].includes(purchase.status),
      "No se pueden enviar opciones en este estado.",
      409,
    );
    const option: ProductOption = {
      ...input,
      imageUrl: input.imageUrl || undefined,
      id: crypto.randomUUID(),
      decision: "PENDING",
      createdAt: now(),
    };
    purchase.options.push(option);
    purchase.status = "OPTIONS_SENT";
    purchase.updatedAt = now();
    const overage = Math.max(0, option.price - purchase.maxBudget);
    purchase.messages.push({
      ...systemMessage(
        overage > 0
          ? `Nueva opción por ${formatCop(option.price)}. Supera el presupuesto en ${formatCop(overage)} y requiere aprobación expresa.`
          : `Nueva opción enviada por ${formatCop(option.price)}.`,
      ),
      type: overage > 0 ? "APPROVAL_REQUEST" : "PRICE_UPDATE",
    });
    return this.repository.savePurchase(purchase);
  }

  async decideOption(
    customer: DemoUser,
    id: string,
    optionId: string,
    decision: "APPROVE" | "REJECT" | "SEARCH_ANOTHER",
    approveOverage: boolean,
  ): Promise<PurchaseRequest> {
    const purchase = await this.requireCustomer(customer, id);
    assertDomain(purchase.status === "OPTIONS_SENT", "No hay opciones pendientes de aprobación.", 409);
    const option = purchase.options.find((item) => item.id === optionId);
    assertDomain(option?.decision === "PENDING", "La opción ya fue respondida.", 409);

    if (decision === "APPROVE") {
      const overage = option.price - purchase.maxBudget;
      assertDomain(
        overage <= 0 || approveOverage,
        `El precio supera tu presupuesto en ${formatCop(overage)}. Debes aprobar expresamente el excedente.`,
        409,
        "BUDGET_APPROVAL_REQUIRED",
      );
      purchase.options.forEach((item) => {
        if (item.decision === "PENDING") item.decision = item.id === optionId ? "APPROVED" : "REJECTED";
      });
      option.decision = "APPROVED";
      purchase.selectedOptionId = option.id;
      purchase.status = "OPTION_APPROVED";
      purchase.costs.productCost = option.price;
      purchase.costs.total =
        option.price +
        purchase.costs.buyerFee +
        purchase.costs.deliveryFee +
        purchase.costs.platformFee +
        purchase.costs.tip;
      purchase.messages.push(systemMessage(`El cliente aprobó ${option.productName} por ${formatCop(option.price)}.`));
    } else {
      option.decision = "REJECTED";
      purchase.messages.push(
        systemMessage(
          decision === "SEARCH_ANOTHER"
            ? "El cliente pidió buscar otra opción."
            : "El cliente rechazó esta opción.",
        ),
      );
    }
    purchase.updatedAt = now();
    return this.repository.savePurchase(purchase);
  }

  async recordPurchase(
    buyer: DemoUser,
    id: string,
    receipt: { businessName: string; finalPrice: number; imageUrl: string },
  ): Promise<PurchaseRequest> {
    const purchase = await this.requireAssignedBuyer(buyer, id);
    assertDomain(purchase.status === "OPTION_APPROVED", "Primero debe aprobarse una opción.", 409);
    const approved = purchase.options.find((option) => option.id === purchase.selectedOptionId);
    assertDomain(approved, "No existe una opción aprobada.", 409);
    assertDomain(
      receipt.finalPrice <= approved.price,
      "El precio final supera el monto aprobado. Envía una nueva opción para autorización.",
      409,
      "FINAL_PRICE_NOT_APPROVED",
    );
    purchase.receipt = { ...receipt, purchasedAt: now() };
    purchase.costs.productCost = receipt.finalPrice;
    purchase.costs.total =
      receipt.finalPrice +
      purchase.costs.buyerFee +
      purchase.costs.deliveryFee +
      purchase.costs.platformFee +
      purchase.costs.tip;
    purchase.status = "PURCHASED";
    purchase.updatedAt = now();
    purchase.messages.push(systemMessage(`Compra realizada en ${receipt.businessName}. Recibo adjuntado.`));
    return this.repository.savePurchase(purchase);
  }

  async markPickedUp(buyer: DemoUser, id: string): Promise<PurchaseRequest> {
    const purchase = await this.requireAssignedBuyer(buyer, id);
    assertDomain(purchase.status === "PURCHASED", "Primero registra la compra y el recibo.", 409);
    purchase.status = "PICKED_UP";
    purchase.updatedAt = now();
    purchase.messages.push(systemMessage("Producto recogido. Va en camino al cliente."));
    return this.repository.savePurchase(purchase);
  }

  async markDelivered(buyer: DemoUser, id: string): Promise<PurchaseRequest> {
    const purchase = await this.requireAssignedBuyer(buyer, id);
    assertDomain(purchase.status === "PICKED_UP", "El producto debe marcarse como recogido.", 409);
    purchase.status = "DELIVERED";
    purchase.updatedAt = now();
    purchase.messages.push(systemMessage("Entrega realizada. Esperando confirmación del cliente."));
    return this.repository.savePurchase(purchase);
  }

  async confirmDelivery(customer: DemoUser, id: string): Promise<PurchaseRequest> {
    const purchase = await this.requireCustomer(customer, id);
    assertDomain(purchase.status === "DELIVERED", "La entrega todavía no puede confirmarse.", 409);
    purchase.status = "COMPLETED";
    purchase.updatedAt = now();
    purchase.messages.push(systemMessage("El cliente confirmó la recepción. Servicio completado."));
    return this.repository.savePurchase(purchase);
  }

  async addMessage(
    user: DemoUser,
    id: string,
    input: Pick<OrderMessage, "text" | "imageUrl" | "type">,
  ): Promise<PurchaseRequest> {
    const purchase = await this.requirePurchase(id);
    const participates =
      user.role === "ADMIN" ||
      purchase.customerId === user.id ||
      (purchase.buyerId && purchase.buyerId === user.id);
    assertDomain(participates, "No perteneces a esta solicitud.", 403);
    purchase.messages.push({
      id: crypto.randomUUID(),
      senderId: user.id,
      senderRole: user.role,
      text: input.text,
      imageUrl: input.imageUrl || undefined,
      type: input.type,
      createdAt: now(),
    });
    purchase.updatedAt = now();
    return this.repository.savePurchase(purchase);
  }

  async metrics(admin: DemoUser): Promise<AdminMetrics> {
    assertDomain(admin.role === "ADMIN", "Solo el administrador puede ver métricas.", 403);
    const [purchases, zones] = await Promise.all([
      this.repository.listPurchases(),
      this.repository.listZones(),
    ]);
    const completed = purchases.filter((purchase) => purchase.status === "COMPLETED");
    return {
      purchaseRequests: purchases.length,
      completedPurchases: completed.length,
      totalProductValue: completed.reduce((sum, purchase) => sum + purchase.costs.productCost, 0),
      feeRevenue: completed.reduce(
        (sum, purchase) => sum + purchase.costs.buyerFee + purchase.costs.deliveryFee,
        0,
      ),
      commissionRevenue: completed.reduce((sum, purchase) => sum + purchase.costs.platformFee, 0),
      activeBuyers: new Set(
        purchases
          .filter((purchase) => purchase.buyerId && !["COMPLETED", "CANCELLED"].includes(purchase.status))
          .map((purchase) => purchase.buyerId),
      ).size,
      demandByZone: zones
        .map((zone) => ({
          zone: zone.name,
          count: purchases.filter((purchase) => purchase.zoneId === zone.id).length,
        }))
        .sort((a, b) => b.count - a.count),
      demandByCategory: countByServiceType(purchases),
    };
  }

  private async requirePurchase(id: string): Promise<PurchaseRequest> {
    const purchase = await this.repository.getPurchase(id);
    assertDomain(purchase, "Solicitud no encontrada.", 404, "NOT_FOUND");
    return purchase;
  }

  private async requireCustomer(customer: DemoUser, id: string): Promise<PurchaseRequest> {
    const purchase = await this.requirePurchase(id);
    assertDomain(
      customer.role === "CUSTOMER" && purchase.customerId === customer.id,
      "Solo el cliente propietario puede realizar esta acción.",
      403,
    );
    return purchase;
  }

  private async requireAssignedBuyer(buyer: DemoUser, id: string): Promise<PurchaseRequest> {
    const purchase = await this.requirePurchase(id);
    assertDomain(
      buyer.role === "BUYER" && purchase.buyerId === buyer.id,
      "Solo el comprador asignado puede realizar esta acción.",
      403,
    );
    return purchase;
  }
}

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function countByServiceType(
  purchases: PurchaseRequest[],
): Array<{ category: ServiceType; count: number }> {
  const counts = new Map<ServiceType, number>();
  purchases.forEach((purchase) => counts.set(purchase.serviceType, (counts.get(purchase.serviceType) ?? 0) + 1));
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}
