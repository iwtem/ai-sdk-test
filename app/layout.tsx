import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "~/components/header";
import { TooltipProvider } from "~/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Assistant",
  description: "A personal assistant powered by AI SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <main className="flex flex-col h-full">
            <Header />
            {children}
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
