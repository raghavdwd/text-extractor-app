import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://extractor.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Extractor — AI Text Extraction",
    template: "%s | Extractor",
  },
  description:
    "Upload any PDF or image and extract all text instantly using Gemini 2.0 Flash AI. Supports PDF, JPEG, PNG, WEBP, GIF, and HEIC — up to 10 MB.",
  keywords: [
    "text extraction",
    "OCR",
    "PDF to text",
    "image to text",
    "AI",
    "Gemini",
    "document scanner",
    "extract text from PDF",
    "extract text from image",
  ],
  authors: [{ name: "Extractor" }],
  creator: "Extractor",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Extractor",
    title: "Extractor — AI Text Extraction",
    description:
      "Upload any PDF or image and extract all text instantly using Gemini 2.0 Flash AI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Extractor — AI Text Extraction",
    description:
      "Upload any PDF or image and extract all text instantly using Gemini 2.0 Flash AI.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
