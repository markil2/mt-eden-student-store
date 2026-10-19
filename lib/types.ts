/** Category ids come from the database (seeded: breakfast, snacks, beverages, coffee). */
export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
}

export interface ProductImage {
  src: string;
  alt: string;
  /** True for temporary stock photography — swap for a real cafe photo before launch. */
  isPlaceholder: boolean;
}

export interface Option {
  id: string;
  label: string;
  /** Extra cost in cents (0 for included choices). */
  priceDeltaCents: number;
  /** Links an option to a product so its availability applies (e.g. combo drink). */
  productId?: string;
}

export interface OptionGroup {
  id: string;
  label: string;
  hint?: string;
  required: boolean;
  /** Max number of selections. 1 renders as a radio group. */
  max: number;
  options: Option[];
}

export interface Product {
  id: string;
  name: string;
  categoryId: CategoryId;
  /** Base price in integer cents. */
  priceCents: number;
  description?: string;
  image: ProductImage | null;
  optionGroups: OptionGroup[];
  popular?: boolean;
}

export type Catalog = Record<string, Product>;

/** Staff edits layered over the base menu (Phase 2 moves products into Supabase). */
export type ProductOverride = Partial<Pick<Product, "name" | "description" | "priceCents">>;

export interface StaffMember {
  userId: string;
  email: string;
  displayName: string;
  role: "staff" | "manager";
}

/** productId → available. Kept apart from product info so staff can flip it anytime. */
export type Availability = Record<string, boolean>;

/** groupId → selected optionIds */
export type Selections = Record<string, string[]>;

export interface CartLine {
  /** Stable identity: product + selections. Identical lines merge. */
  key: string;
  productId: string;
  quantity: number;
  selections: Selections;
}

export interface ServiceHours {
  label: string;
  hours: string;
}

export interface StoreSettings {
  orderingPaused: boolean;
  pauseMessage: string;
  /** "HH:MM" 24h, from the printed menu: "Last order @ 8am" */
  orderCutoff: string;
  /** Stop taking orders after the cutoff (staff can switch off for testing). */
  enforceCutoff: boolean;
  /** IANA time zone used for the cutoff and order dates, e.g. "America/Los_Angeles" */
  timezone: string;
  hours: ServiceHours[];
  /** Shown under the hours, e.g. that times vary day to day */
  hoursNote: string;
  pickup: {
    enabled: boolean;
    location: string;
  };
  /** Shared by pickup and delivery. capacity null = no limit. */
  windows: FulfillmentWindow[];
  delivery: {
    enabled: boolean;
    feeCents: number;
    requireRoom: boolean;
    eligibleRooms: string[] | null;
  };
  contact: {
    instagram: string;
    instagramUrl: string;
  };
}

export interface FulfillmentWindow {
  id: string;
  label: string;
  detail: string;
  pickup: boolean;
  delivery: boolean;
  capacity: number | null;
}

/* ── Orders ─────────────────────────────────────────────────────── */

export type FulfillmentMethod = "pickup" | "delivery";

export type OrderStatus =
  | "received"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "delivered"
  | "canceled";

/** Orders start "pending" (pay in person); staff mark them "paid". "mock_paid" = early test orders. */
export type PaymentStatus = "mock_paid" | "pending" | "paid" | "failed" | "refunded";

/** How customers pay in person (confirmed: cash or Zelle). */
export type PaymentMethod = "cash" | "zelle";

/** Snapshot of what was bought, so later menu/price edits never change past orders. */
export interface OrderLine {
  productId: string;
  name: string;
  options: string[];
  unitPriceCents: number;
  quantity: number;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  customerName: string;
  method: FulfillmentMethod;
  windowId: string;
  windowLabel: string;
  room: string | null;
  notes: string | null;
  lines: OrderLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: string }[];
}

/** What a customer's browser receives about their own order. */
export type CustomerOrder = Omit<Order, "id">;
