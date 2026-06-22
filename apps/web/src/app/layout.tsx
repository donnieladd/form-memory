import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Form Memory",
  description: "Your personal brain — shared across every Form platform.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
