import type { Availability, Category, FulfillmentWindow, Product, StoreSettings } from "@/lib/types";
import { defaultSettings } from "./settings";

/**
 * Turns Supabase rows into the app's types. Shared by the server (initial render)
 * and the browser (live refresh), so both always agree.
 */

export interface PublicStoreData {
  categories: Category[];
  products: Product[];
  availability: Availability;
  settings: StoreSettings;
}

export interface CategoryRow {
  id: string;
  name: string;
  blurb: string;
  sort: number;
}

export interface OptionRow {
  key: string;
  label: string;
  price_delta_cents: number;
  linked_product_id: string | null;
  sort: number;
}

export interface OptionGroupRow {
  key: string;
  label: string;
  hint: string | null;
  required: boolean;
  max_select: number;
  included_count: number | null;
  extra_each_cents: number;
  sort: number;
  options: OptionRow[];
}

export interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  image_alt: string | null;
  image_is_placeholder: boolean;
  popular: boolean;
  sort: number;
  archived: boolean;
  option_groups: OptionGroupRow[];
}

export interface SettingsRow {
  ordering_paused: boolean;
  pause_message: string;
  order_cutoff: string;
  enforce_cutoff: boolean;
  timezone: string;
  pickup_enabled: boolean;
  pickup_location: string;
  delivery_enabled: boolean;
  delivery_fee_cents: number;
  require_room: boolean;
  hours: StoreSettings["hours"];
  hours_note: string;
  contact: Partial<StoreSettings["contact"]>;
}

export interface WindowRow {
  id: string;
  label: string;
  detail: string;
  pickup: boolean;
  delivery: boolean;
  capacity: number | null;
  sort: number;
  active: boolean;
}

/** Select string for products with their option groups and options. */
export const PRODUCT_SELECT =
  "id, category_id, name, description, price_cents, image_url, image_alt, image_is_placeholder, popular, sort, archived, option_groups(key, label, hint, required, max_select, included_count, extra_each_cents, sort, options(key, label, price_delta_cents, linked_product_id, sort))";

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    priceCents: row.price_cents,
    description: row.description ?? undefined,
    image: row.image_url ? { src: row.image_url, alt: row.image_alt ?? row.name, isPlaceholder: row.image_is_placeholder } : null,
    popular: row.popular,
    optionGroups: [...(row.option_groups ?? [])].sort(bySort).map((g) => ({
      id: g.key,
      label: g.label,
      hint: g.hint ?? undefined,
      required: g.required,
      max: g.max_select,
      includedCount: g.included_count ?? undefined,
      extraEachCents: g.extra_each_cents || undefined,
      options: [...(g.options ?? [])].sort(bySort).map((o) => ({
        id: o.key,
        label: o.label,
        priceDeltaCents: o.price_delta_cents,
        productId: o.linked_product_id ?? undefined,
      })),
    })),
  };
}

export function mapWindow(row: WindowRow): FulfillmentWindow {
  return {
    id: row.id,
    label: row.label,
    detail: row.detail,
    pickup: row.pickup,
    delivery: row.delivery,
    capacity: row.capacity,
  };
}

export function mapSettings(row: SettingsRow | null, windows: WindowRow[]): StoreSettings {
  if (!row) return defaultSettings;
  return {
    orderingPaused: row.ordering_paused,
    pauseMessage: row.pause_message,
    orderCutoff: row.order_cutoff,
    enforceCutoff: row.enforce_cutoff,
    timezone: row.timezone,
    hours: row.hours ?? [],
    hoursNote: row.hours_note,
    pickup: { enabled: row.pickup_enabled, location: row.pickup_location },
    windows: windows.filter((w) => w.active).sort(bySort).map(mapWindow),
    delivery: {
      enabled: row.delivery_enabled,
      feeCents: row.delivery_fee_cents,
      requireRoom: row.require_room,
      eligibleRooms: null,
    },
    contact: { ...defaultSettings.contact, ...row.contact },
  };
}

export function mapCategories(rows: CategoryRow[]): Category[] {
  return [...rows].sort(bySort).map((c) => ({ id: c.id, name: c.name, blurb: c.blurb }));
}

export function mapAvailability(rows: { product_id: string; is_available: boolean }[]): Availability {
  return Object.fromEntries(rows.map((r) => [r.product_id, r.is_available]));
}

/** Loads everything the public site needs in four parallel queries. Works with any Supabase client. */
export async function fetchPublicStoreData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (table: string) => any },
): Promise<PublicStoreData> {
  const [cats, prods, avail, settings, windows] = await Promise.all([
    supabase.from("categories").select("id, name, blurb, sort"),
    supabase.from("products").select(PRODUCT_SELECT).eq("archived", false).order("sort"),
    supabase.from("product_availability").select("product_id, is_available"),
    supabase.from("store_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("fulfillment_windows").select("*"),
  ]);
  const error = cats.error ?? prods.error ?? avail.error ?? settings.error ?? windows.error;
  if (error) throw new Error(`Couldn't load the menu: ${error.message}`);

  return {
    categories: mapCategories(cats.data as CategoryRow[]),
    products: (prods.data as ProductRow[]).map(mapProduct),
    availability: mapAvailability(avail.data as { product_id: string; is_available: boolean }[]),
    settings: mapSettings(settings.data as SettingsRow | null, windows.data as WindowRow[]),
  };
}
