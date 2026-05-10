import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "xLib Portal - Official Wiki & Studio",
  description: "Advanced dashboard for managing xFoods, xCrops and RPX ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16 bg-[#0b0f19]">
          {children}
        </main>
      </body>
    </html>
  );
}
