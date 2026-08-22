import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aviary Pro",
  description: "Bird breeding, inventory, sales and financial management.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
