import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../css/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Requisition Hub",
  description: "Hotpoint Requisition hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="Requisition" />
      </head>
      <body className="mx-auto flex min-h-screen max-w-7xl flex-col">
        {/* Page Content */}
        <div>{children}</div>
      </body>
    </html>
  );
}
