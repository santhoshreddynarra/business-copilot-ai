import "./globals.css";

export const metadata = {
  title: "Business Copilot AI - GitHub Dashboard",
  description: "Supercharge your GitHub workflows with AI-powered code audits and project analytics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
