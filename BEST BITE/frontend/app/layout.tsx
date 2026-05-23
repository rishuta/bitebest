import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BiteBest | Premium Food Price Comparison",
  description: "Compare platform prices, offers, and delivery fees with a premium food-tech experience.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-32x32.svg", type: "image/svg+xml", sizes: "32x32" },
      { url: "/icon-128x128.svg", type: "image/svg+xml", sizes: "128x128" },
      { url: "/icon-512x512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
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
