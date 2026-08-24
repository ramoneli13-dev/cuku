import { z } from "zod";
import { serviceTypes } from "@/lib/types";

const optionalShortText = z.string().trim().max(160).optional().or(z.literal(""));
const imageValue = z.string().max(4_000_000);

export const createPurchaseSchema = z
  .object({
    serviceType: z.enum(serviceTypes),
    title: z.string().trim().min(4).max(100),
    description: z.string().trim().min(10).max(1200),
    businessName: optionalShortText,
    businessAddress: optionalShortText,
    doesNotKnowStore: z.boolean(),
    product: z.string().trim().min(2).max(240),
    size: optionalShortText,
    color: optionalShortText,
    brand: optionalShortText,
    quantity: z.number().int().min(1).max(50),
    maxBudget: z.number().int().min(1_000).max(50_000_000),
    specialInstructions: z.string().trim().max(800).optional().or(z.literal("")),
    referenceImages: z.array(imageValue).max(3),
    deliveryAddress: z.string().trim().min(5).max(240),
    zoneId: z.string().min(1),
    distanceKm: z.number().min(0).max(150),
    tip: z.number().int().min(0).max(5_000_000),
  })
  .superRefine((value, context) => {
    if (!value.doesNotKnowStore && !value.businessName) {
      context.addIssue({
        code: "custom",
        path: ["businessName"],
        message: "Indica el negocio o selecciona ‘No sé dónde comprarlo’.",
      });
    }
  });

export const productOptionSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  productName: z.string().trim().min(2).max(240),
  price: z.number().int().min(1_000).max(50_000_000),
  details: z.string().trim().min(2).max(600),
  imageUrl: imageValue.optional().or(z.literal("")),
});

export const optionDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "SEARCH_ANOTHER"]),
  approveOverage: z.boolean().default(false),
});

export const receiptSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  finalPrice: z.number().int().min(1_000).max(50_000_000),
  imageUrl: imageValue.min(1),
});

export const messageSchema = z.object({
  text: z.string().trim().max(1000).default(""),
  imageUrl: imageValue.optional().or(z.literal("")),
  type: z
    .enum(["TEXT", "IMAGE", "PRICE_UPDATE", "APPROVAL_REQUEST"])
    .default("TEXT"),
}).refine((value) => value.text || value.imageUrl, {
  message: "El mensaje debe incluir texto o imagen.",
});

export const zoneUpdateSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
  baseFee: z.number().int().min(0).max(1_000_000),
  perKmFee: z.number().int().min(0).max(100_000),
  remoteSurcharge: z.number().int().min(0).max(1_000_000),
  serviceStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  serviceEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});
