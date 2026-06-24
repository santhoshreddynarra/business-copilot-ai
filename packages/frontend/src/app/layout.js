import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: {
    default: "Business Copilot AI | Enterprise Knowledge Platform",
    template: "%s | Business Copilot AI",
  },
  description:
    "Transform your business documents into actionable intelligence. AI-powered search, analysis, and insights for enterprise teams.",
  keywords: ["enterprise AI", "document intelligence", "semantic search", "RAG", "knowledge base"],
  openGraph: {
    title: "Business Copilot AI | Enterprise Knowledge Platform",
    description: "Your Company's Brain. Instantly Accessible.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
