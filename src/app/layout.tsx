import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Tajawal } from "next/font/google";
import { Toaster } from "react-hot-toast";
import FacebookPixel from "@/components/pixel/FacebookPixel";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const tajawal = Tajawal({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

// NOTE: Replace https://example.com with your real production domain once deployed
export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "الهدية الفاخرة | اطلب ساعتك الآن مع توصيل سريع", // default root title
    template: "%s | ساعات فاخرة في الجزائر", // used if child pages set a title
  },
  description:
    "أقوى عرض ساعات رجالية فاخرة في الجزائر – تصميم أنيق، جودة عالية، سعر ترويجي محدود + دفع عند الاستلام وتوصيل سريع لجميع الولايات.",
  keywords: [
    "ساعات",
    "ساعات رجالية",
    "ساعة فاخرة",
    "شراء ساعة",
    "ساعة ذكية",
    "توصيل سريع",
    "الدفع عند الاستلام",
    "الجزائر",
    "عرض خاص",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ar_DZ",
    url: "https://example.com/",
    siteName: "عروض الساعات الفاخرة",
    title: "ساعات فاخرة بعرض خاص في الجزائر | اطلب ساعتك الآن مع توصيل سريع",
    description:
      "اكتشف تشكيلة من 20 ساعة فاخرة بسعر ترويجي محدود – اطلب الآن والدفع عند الاستلام مع خدمة توصيل سريعة لكل الولايات.",
    images: [
      {
        url: "/images/watches/1.webp",
        width: 800,
        height: 800,
        alt: "عرض ساعات فاخرة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ساعات فاخرة بعرض خاص في الجزائر",
    description:
      "20 موديل مميز + توصيل سريع + الدفع عند الاستلام. احجز الآن قبل انتهاء العرض!",
    images: ["/images/watches/1.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: { icon: "/favicon.ico" },
  other: {
    "theme-color": "#0f172a",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${tajawal.variable} antialiased`}
      >
        {/* Structured Data (JSON-LD) */}
        <Script
          id="ld-json"
          type="application/ld+json"
          strategy="afterInteractive"
        >{`
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "عروض الساعات الفاخرة",
            "url": "https://example.com/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://example.com/?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
        `}</Script>
        {/* Facebook Meta Pixel */}
        <FacebookPixel />
        {children}
        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#1f2937",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
