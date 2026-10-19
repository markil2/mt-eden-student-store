import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { getPublicStoreData } from "@/lib/data/public-data";

export const metadata: Metadata = {
  title: { default: "Staff dashboard", template: "%s · Staff · Mt. Eden Student Store" },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const storeData = await getPublicStoreData();
  return <Providers initialData={storeData}>{children}</Providers>;
}
