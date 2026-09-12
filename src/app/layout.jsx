import { Inter, Plus_Jakarta_Sans, Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata = {
  title: "ZTDPP — Zero Trust Digital Provenance Platform",
  description:
    "Register content provenance, anchor it in the ZTD ledger and verify images with combined metadata + AI deepfake analysis.",
  openGraph: {
    title: "ZTDPP — Zero Trust Digital Provenance Platform",
    description:
      "C2PA-style provenance, blockchain anchoring and AI-assisted trust scoring for images.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${inter.variable} ${jakarta.variable} ${tajawal.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
