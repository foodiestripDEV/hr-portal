import type { ReactNode } from "react";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Private HR Portal",
  description: "Internal HR portal for leave, documents, invoices, and approvals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <Script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" strategy="beforeInteractive" />
        <style type="text/tailwindcss">{`
          @theme inline {
            --color-background: #ffffff;
            --color-foreground: #171717;
            --font-sans: Arial, Helvetica, sans-serif;
            --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --color-background: #0a0a0a;
              --color-foreground: #ededed;
            }
          }

          body {
            background: var(--color-background);
            color: var(--color-foreground);
            font-family: Arial, Helvetica, sans-serif;
          }

          button,
          a {
            -webkit-tap-highlight-color: transparent;
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
