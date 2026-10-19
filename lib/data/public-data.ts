import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getPublicServerSupabase } from "@/lib/supabase/server";
import { fetchPublicStoreData, type PublicStoreData } from "./catalog-mapper";
import { categories, products } from "./menu";
import { defaultAvailability } from "./availability";
import { defaultSettings } from "./settings";

export const STORE_DATA_TAG = "store-data";

/** Built-in menu used until Supabase is connected (browse-only). */
export const localStoreData: PublicStoreData = {
  categories,
  products,
  availability: defaultAvailability,
  settings: defaultSettings,
};

/**
 * Menu + stock + settings for the public site. Cached on the server and
 * refreshed immediately when staff change something (updateTag in admin actions);
 * the browser also listens for live changes.
 */
export async function getPublicStoreData(): Promise<PublicStoreData> {
  "use cache";
  cacheTag(STORE_DATA_TAG);
  cacheLife("minutes");
  if (!isSupabaseConfigured) return localStoreData;
  try {
    return await fetchPublicStoreData(getPublicServerSupabase());
  } catch (err) {
    // Keep the site browsable if Supabase is unreachable or misconfigured (e.g. a wrong key in
    // Vercel). Orders are still validated against the live database, so nothing can be bought
    // from this copy. Don't shorten the cache life here: that makes the page dynamic and fails the build.
    console.error("[store-data] Falling back to the built-in menu:", err);
    return localStoreData;
  }
}
