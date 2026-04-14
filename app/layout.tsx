import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import ZhModeInit from "@/components/ZhModeInit";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-chinese",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "WuXue — by Infinite Wushu",
  description:
    "A progressive wushu learning app by Infinite Wushu. From stances to forms, beginner to advanced.",
};

export const viewport: Viewport = {
  themeColor: "#080c1a",
  width: "device-width",
  initialScale: 1,
};

// Force dark theme; no light mode toggle in Phase 1.
const themeScript = `document.documentElement.classList.add('dark');`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${notoSerifSC.variable} font-sans antialiased`}
      >
        <ZhModeInit />
        {children}
      </body>
    </html>
  );
}
