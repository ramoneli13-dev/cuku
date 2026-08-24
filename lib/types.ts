export const serviceTypes = [
  "FOOD",
  "GROCERIES",
  "PHARMACY",
  "BUY_FOR_ME",
  "PACKAGE",
  "ERRAND",
  "PICKUP_DELIVERY",
  "OTHER",
] as const;

export type ServiceType = (typeof serviceTypes)[number];
export type UserRole = "CUSTOMER" | "BUYER" | "ADMIN";
export type PurchaseStatus =
  | "OPEN"
  | "ACCEPTED"
  | "OPTIONS_SENT"
  | "OPTION_APPROVED"
  | "PURCHASED"
  | "PICKED_UP"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";
export type OptionDecision = "PENDING" | "APPROVED" | "REJECTED";

export interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface ZoneConfig {
  id: string;
  name: string;
  active: boolean;
  baseFee: number;
  perKmFee: number;
  remoteSurcharge: number;
  serviceStart: string;
  serviceEnd: string;
}

export interface CostBreakdown {
  productCost: number;
  buyerFee: number;
  deliveryFee: number;
  platformFee: number;
  tip: number;
  total: number;
}

export interface ProductOption {
  id: string;
  businessName: string;
  productName: string;
  price: number;
  details: string;
  imageUrl?: string;
  decision: OptionDecision;
  createdAt: string;
}

export interface OrderMessage {
  id: string;
  senderId: string;
  senderRole: UserRole;
  text: string;
  imageUrl?: string;
  type: "TEXT" | "IMAGE" | "PRICE_UPDATE" | "APPROVAL_REQUEST" | "SYSTEM";
  createdAt: string;
}

export interface PurchaseRequest {
  id: string;
  customerId: string;
  buyerId?: string;
  serviceType: ServiceType;
  status: PurchaseStatus;
  title: string;
  description: string;
  businessName?: string;
  businessAddress?: string;
  doesNotKnowStore: boolean;
  product: string;
  size?: string;
  color?: string;
  brand?: string;
  quantity: number;
  maxBudget: number;
  specialInstructions?: string;
  referenceImages: string[];
  deliveryAddress: string;
  zoneId: string;
  distanceKm: number;
  options: ProductOption[];
  messages: OrderMessage[];
  costs: CostBreakdown;
  selectedOptionId?: string;
  receipt?: {
    businessName: string;
    finalPrice: number;
    purchasedAt: string;
    imageUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminMetrics {
  purchaseRequests: number;
  completedPurchases: number;
  totalProductValue: number;
  feeRevenue: number;
  commissionRevenue: number;
  activeBuyers: number;
  demandByZone: Array<{ zone: string; count: number }>;
  demandByCategory: Array<{ category: ServiceType; count: number }>;
}

export interface CreatePurchaseInput {
  serviceType: ServiceType;
  title: string;
  description: string;
  businessName?: string;
  businessAddress?: string;
  doesNotKnowStore: boolean;
  product: string;
  size?: string;
  color?: string;
  brand?: string;
  quantity: number;
  maxBudget: number;
  specialInstructions?: string;
  referenceImages: string[];
  deliveryAddress: string;
  zoneId: string;
  distanceKm: number;
  tip: number;
}
