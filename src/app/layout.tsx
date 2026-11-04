import type { Metadata } from "next";
import { Baloo_Bhaijaan_2, Tajawal, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";

const display = Baloo_Bhaijaan_2({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  weight: ["700"],
});

const sans = Tajawal({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
});

const story = Noto_Naskh_Arabic({
  variable: "--font-story",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "آلة الحكايات",
  description: "قصص عربية تفاعلية للأطفال وأسرهم",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${display.variable} ${sans.variable} ${story.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
