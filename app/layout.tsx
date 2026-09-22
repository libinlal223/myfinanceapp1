import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0f1117",
};

export const metadata: Metadata = {
  title: "Money Tracker — Personal Finance",
  description:
    "Track your income, expenses, savings and investments. Simple. Fast. Private.",
  keywords: ["personal finance", "money tracker", "expense tracker", "budget"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
