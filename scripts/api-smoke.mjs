const baseUrl = process.env.APP_URL ?? "http://127.0.0.1:3000";

async function request(path, userId, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "content-type": "application/json",
      "x-demo-user-id": userId,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${data.error}`);
  return data;
}

const created = await request("/api/purchases", "customer-1", {
  serviceType: "BUY_FOR_ME",
  title: "Prueba integral de compra",
  description: "Buscar una camisa blanca talla M en un comercio local.",
  doesNotKnowStore: true,
  product: "Camisa blanca",
  size: "M",
  color: "Blanco",
  quantity: 1,
  maxBudget: 120000,
  referenceImages: [],
  deliveryAddress: "Barrio Caobos, Cúcuta",
  zoneId: "cucuta",
  distanceKm: 5,
  tip: 2000,
});

const id = created.purchase.id;
await request(`/api/purchases/${id}/accept`, "buyer-1", {});
const withOption = await request(`/api/purchases/${id}/options`, "buyer-1", {
  businessName: "Comercio de prueba",
  productName: "Camisa blanca talla M",
  price: 135000,
  details: "Disponible para entrega inmediata",
  imageUrl: "data:image/jpeg;base64,b3B0aW9u",
});
const optionId = withOption.purchase.options[0].id;
await request(`/api/purchases/${id}/options/${optionId}/decision`, "customer-1", {
  decision: "APPROVE",
  approveOverage: true,
});
await request(`/api/purchases/${id}/purchase`, "buyer-1", {
  businessName: "Comercio de prueba",
  finalPrice: 134000,
  imageUrl: "data:image/jpeg;base64,cmVjZWlwdA==",
});
await request(`/api/purchases/${id}/pickup`, "buyer-1", {});
await request(`/api/purchases/${id}/deliver`, "buyer-1", {});
const completed = await request(`/api/purchases/${id}/confirm`, "customer-1", {});
const { metrics } = await request("/api/admin/metrics", "admin-1");

if (completed.purchase.status !== "COMPLETED") {
  throw new Error("El pedido no terminó en estado COMPLETED.");
}
if (metrics.completedPurchases < 1) {
  throw new Error("Las métricas no registraron la compra completada.");
}

console.log(
  JSON.stringify(
    {
      status: completed.purchase.status,
      receipt: completed.purchase.receipt.finalPrice,
      total: completed.purchase.costs.total,
      completedPurchases: metrics.completedPurchases,
    },
    null,
    2,
  ),
);
