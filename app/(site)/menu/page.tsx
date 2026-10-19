import type { Metadata } from "next";
import { MenuView } from "@/components/menu/menu-view";

export const metadata: Metadata = {
  title: "Order Online",
  description: "Breakfast sandwiches, bagels, parfaits, snacks, coffee and drinks from the Mt. Eden Student Store.",
};

export default function MenuPage() {
  return <MenuView />;
}
