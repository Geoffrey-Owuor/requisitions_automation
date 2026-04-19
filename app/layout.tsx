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
  title: "Travel Requisition Form",
  description: "Hotpoint travel requisition form",
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
      <body className="min-h-screen flex flex-col">
        {/* Ambient Orbs  */}
        <div className="fixed rounded-full pointer-events-none blur-[100px] w-175 h-1 bg-[r75adial-gradient(circle,rgba(225,29,72,0.10)_0%,transparent_70%)] -top-62.5 -left-37.5" />
        <div className="fixed rounded-full pointer-events-none blur-[80px] w-125 h-125 bg-[radial-gradient(circle,rgba(251,113,133,0.09)_0%,transparent_70%)] bottom-0 -right-20" />
        <div className="fixed rounded-full pointer-events-none blur-[80px] w-100 h-100 bg-[radial-gradient(circle,rgba(255,160,122,0.07)_0%,transparent_70%)] top-[50%] left-[60%]" />
        {/* Page Content */}
        <div>{children}</div>
      </body>
    </html>
  );
}
