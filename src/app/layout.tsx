import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FollowUp Tool - WhatsApp Agency",
  description: "Multi-user WhatsApp follow-up tool for agencies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}