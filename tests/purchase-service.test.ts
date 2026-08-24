import { describe, expect, it } from "vitest";
import { MemoryPurchaseRepository } from "@/lib/repositories/memory-purchase-repository";
import { PurchaseService } from "@/lib/services/purchase-service";
import type { CreatePurchaseInput, DemoUser } from "@/lib/types";

const customer: DemoUser = { id: "customer-1", name: "Cliente", role: "CUSTOMER" };
const buyer: DemoUser = { id: "buyer-1", name: "Comprador", role: "BUYER" };
const otherBuyer: DemoUser = { id: "buyer-2", name: "Otro", role: "BUYER" };
const admin: DemoUser = { id: "admin-1", name: "Admin", role: "ADMIN" };

const input: CreatePurchaseInput = {
  serviceType: "BUY_FOR_ME",
  title: "Camisa blanca talla M",
  description: "Buscar una camisa blanca para un evento familiar.",
  doesNotKnowStore: true,
  product: "Camisa blanca",
  size: "M",
  color: "Blanco",
  quantity: 1,
  maxBudget: 120_000,
  referenceImages: [],
  deliveryAddress: "Barrio Caobos, Cúcuta",
  zoneId: "cucuta",
  distanceKm: 5,
  tip: 2_000,
};

function setup() {
  const repository = MemoryPurchaseRepository.isolated();
  return { repository, service: new PurchaseService(repository) };
}

describe("flujo Compra por mí", () => {
  it("completa solicitud, aceptación, opción, compra, recogida y entrega", async () => {
    const { service } = setup();
    const created = await service.create(customer, input);
    const accepted = await service.accept(buyer, created.id);
    expect(accepted.status).toBe("ACCEPTED");

    const withOption = await service.addOption(buyer, created.id, {
      businessName: "Almacén local",
      productName: "Camisa blanca M",
      price: 110_000,
      details: "Algodón, disponible",
    });
    const option = withOption.options[0];
    const approved = await service.decideOption(customer, created.id, option.id, "APPROVE", false);
    expect(approved.status).toBe("OPTION_APPROVED");
    expect(approved.costs.productCost).toBe(110_000);

    const purchased = await service.recordPurchase(buyer, created.id, {
      businessName: "Almacén local",
      finalPrice: 108_000,
      imageUrl: "data:image/jpeg;base64,receipt",
    });
    expect(purchased.receipt?.finalPrice).toBe(108_000);
    await service.markPickedUp(buyer, created.id);
    await service.markDelivered(buyer, created.id);
    const completed = await service.confirmDelivery(customer, created.id);
    expect(completed.status).toBe("COMPLETED");

    const metrics = await service.metrics(admin);
    expect(metrics.completedPurchases).toBe(1);
    expect(metrics.totalProductValue).toBe(108_000);
  });

  it("exige aprobación expresa cuando una opción supera el presupuesto", async () => {
    const { service } = setup();
    const created = await service.create(customer, input);
    await service.accept(buyer, created.id);
    const withOption = await service.addOption(buyer, created.id, {
      businessName: "Tienda",
      productName: "Camisa premium",
      price: 135_000,
      details: "Supera el presupuesto",
    });

    await expect(
      service.decideOption(customer, created.id, withOption.options[0].id, "APPROVE", false),
    ).rejects.toMatchObject({ code: "BUDGET_APPROVAL_REQUIRED" });

    const approved = await service.decideOption(
      customer,
      created.id,
      withOption.options[0].id,
      "APPROVE",
      true,
    );
    expect(approved.costs.productCost).toBe(135_000);
  });

  it("impide que otro comprador intervenga en una solicitud asignada", async () => {
    const { service } = setup();
    const created = await service.create(customer, input);
    await service.accept(buyer, created.id);
    await expect(
      service.addOption(otherBuyer, created.id, {
        businessName: "Tienda",
        productName: "Camisa",
        price: 100_000,
        details: "Intento no autorizado",
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("impide comprar por encima del precio aprobado", async () => {
    const { service } = setup();
    const created = await service.create(customer, input);
    await service.accept(buyer, created.id);
    const withOption = await service.addOption(buyer, created.id, {
      businessName: "Tienda",
      productName: "Camisa",
      price: 110_000,
      details: "Precio autorizado",
    });
    await service.decideOption(customer, created.id, withOption.options[0].id, "APPROVE", false);
    await expect(
      service.recordPurchase(buyer, created.id, {
        businessName: "Tienda",
        finalPrice: 115_000,
        imageUrl: "data:image/jpeg;base64,receipt",
      }),
    ).rejects.toMatchObject({ code: "FINAL_PRICE_NOT_APPROVED" });
  });
});
