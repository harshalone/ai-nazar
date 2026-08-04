import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SlidePanelProvider } from "@/lib/slide-panel-context";
import { GlobalSlidePanel } from "@/components/ui/global-slide-panel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Nazar",
  description: "Open-source AI observability — track cost, latency, tokens, and errors.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SlidePanelProvider>
          {children}
          <GlobalSlidePanel />
        </SlidePanelProvider>
      </body>
    </html>
  );
}
