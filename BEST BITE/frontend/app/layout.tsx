import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BiteBest | Premium Food Price Comparison",
  description: "Compare platform prices, offers, and delivery fees with a premium food-tech experience.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
