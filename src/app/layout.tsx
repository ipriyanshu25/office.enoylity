// src/app/layout.tsx
import "./globals.css";
import { Lexend } from "next/font/google";
import type { Metadata } from "next";
import ClientWrapper from "./Components/ClientWrapper";

const lexend = Lexend({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Enoylity Panel",
  description: "Manage your office dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${lexend.className} antialiased`}>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
