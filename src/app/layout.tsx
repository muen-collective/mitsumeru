import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mitsu",
  description: "Mitsu (Mitsumeru) — BYOK creative tool. Web + Electron, same account.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* ClerkProvider inside <body> (Core 3 convention); shared account layer Web + Electron */}
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
