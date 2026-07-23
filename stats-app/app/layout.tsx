/**
 * app/layout.tsx
 *
 * Why it exists: Required by Next.js App Router as the root layout.
 * The stats-app has no UI pages — it only serves SVG via API routes —
 * but Next.js still requires a root layout to compile.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GitHub Stats Cards",
  description: "Animated SVG GitHub statistics cards for Yashmalik2004",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
