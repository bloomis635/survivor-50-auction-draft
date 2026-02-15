import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loomis Frenduto Brown Mooney Survivor 50 Draft",
  description: "Live auction draft for Survivor 50",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
