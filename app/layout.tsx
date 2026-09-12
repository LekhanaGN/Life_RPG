import type { Metadata } from "next";
import "./globals.css";
import { WorldTransitionProvider } from "@/components/world/WorldInversionTransition";

export const metadata: Metadata = {
  title: "THE OTHER SIDE — 80s Supernatural Life RPG",
  description: "A mysterious game world where your real life exists across two dimensions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#030104]">
      <body className="min-h-screen relative overflow-x-hidden antialiased selection:bg-red-900 selection:text-white">
        <WorldTransitionProvider>
          {/* CRT Scanline & Phosphor Overlay */}
          <div
            id="crt-global-overlay"
            className="fixed inset-0 crt-overlay crt-flicker pointer-events-none z-30 opacity-75"
            aria-hidden="true"
          />

          {/* CRT Vignette Depth */}
          <div
            className="fixed inset-0 crt-vignette pointer-events-none z-30"
            aria-hidden="true"
          />

          {/* Main App Canvas */}
          <div className="relative z-10 min-h-screen flex flex-col">
            {children}
          </div>
        </WorldTransitionProvider>
      </body>
    </html>
  );
}
