import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { SearchProvider } from "@/components/SearchContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Korean Translator",
  description: "Translate Korean songs to English",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      
      <SearchProvider>
        {children}
      </SearchProvider>
      </body>
    </html>
  );
}
