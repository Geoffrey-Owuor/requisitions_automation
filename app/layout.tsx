import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Merriweather, Lora } from "next/font/google";
import "../css/globals.css";
import QueryProvider from "@/components/QueryProvider";
import LoadingLine from "@/components/LoadingLine";
import Alert from "@/components/Modules/Alert";
import { FONT_STORAGE_KEY } from "@/store/useFontStore";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

// Applies the user's saved font preference before hydration to avoid a flash of the wrong font.
const fontInitScript = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(
  FONT_STORAGE_KEY,
)});var font=raw&&JSON.parse(raw).state&&JSON.parse(raw).state.font;if(font)document.documentElement.setAttribute("data-font",font);}catch(e){}})();`;

export const metadata: Metadata = {
  title: {
    default: "Hotpoint Apps Hub",
    template: `%s - Hotpoint Apps Hub`,
  },
  description:
    "Hotpoint's hub for accessing online requisition forms and internal applications",
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
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${merriweather.variable} ${lora.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="Requisition" />
        <script dangerouslySetInnerHTML={{ __html: fontInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-[#fafafa]">
        <LoadingLine />
        <Alert />
        {/* Page Content */}
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
