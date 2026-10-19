import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mt. Eden Student Store — Your Campus Cafe",
    template: "%s · Mt. Eden Student Store",
  },
  description:
    "Fresh breakfast, your favorite drinks, and everything in between. Order ahead for pickup or classroom delivery at Mt. Eden.",
};

export const viewport: Viewport = {
  themeColor: "#FFF9ED",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${fraunces.variable} ${manrope.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
