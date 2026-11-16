import type { Metadata, Viewport } from "next";
import { Cairo, Nunito } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

const title = "Story Machine · آلة الحكايات";
const description =
  "Magical bedtime stories for children, starring your child, in Arabic or English. حكايات نوم سحرية بطلها طفلك، بالعربية أو الإنجليزية.";

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "Story Machine",
    locale: "ar_AR",
    alternateLocale: ["en_US"],
  },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = { themeColor: "#0f1536" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
