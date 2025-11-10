import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Almeida Editor Pró",
  description:
    "Editor completo de documentos e PDFs, inspirado nos layouts clássicos que o público já conhece.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-transparent text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
