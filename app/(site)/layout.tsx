import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CustomizeSheet } from "@/components/menu/customize-sheet";
import { getPublicStoreData } from "@/lib/data/public-data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const storeData = await getPublicStoreData();
  return (
    <Providers initialData={storeData}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-cream"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <CustomizeSheet />
    </Providers>
  );
}
