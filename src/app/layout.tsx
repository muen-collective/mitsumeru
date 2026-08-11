import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mitsu",
  description: "Mitsu (Mitsumeru) — BYOK creative tool. Web + Electron, same account.",
};

// Clerk wiring is parked until Block #2 (epic 10 §9): ClerkProvider + sign-in
// routes + middleware were removed because they crash an unkeyed deploy
// (MIDDLEWARE_INVOCATION_FAILED / Missing publishableKey). Block 2 restores
// them with real keys.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
