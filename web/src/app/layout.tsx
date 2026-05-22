import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GovSBN — Government Inspection Platform",
  description: "Modern government inspection and operational reporting platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
