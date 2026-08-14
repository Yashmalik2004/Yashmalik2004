
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
