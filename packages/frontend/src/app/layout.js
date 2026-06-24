import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Business Copilot AI | Enterprise Knowledge Platform",
  description: "Unlock your enterprise knowledge and empower every decision. Secure, intelligent, and fast document analysis and semantic search.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
