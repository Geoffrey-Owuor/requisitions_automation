import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../css/globals.css";
import QueryProvider from "@/components/QueryProvider";
import LoadingLine from "@/components/LoadingLine";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Requisition Hub",
    template: `%s - Requisition Hub`,
  },
  description: "Hotpoint's hub for submitting internal requisition forms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="Requisition" />
      </head>
      <body className="flex min-h-screen flex-col bg-[#fafafa]">
        <LoadingLine />
        {/* Page Content */}
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
