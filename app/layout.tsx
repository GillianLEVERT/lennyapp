import type { Metadata, Viewport } from "next";
import "./globals.css";
import { bodyFont, displayFont } from "./fonts";
import { PwaRegistration } from "@/components/pwa-registration";

export const metadata: Metadata = {
  title: "Mission Héros du Matin",
  description:
    "Une mini app mobile et ludique pour transformer la routine du matin en missions, puis débloquer le temps de jeu et un coffre.",
  applicationName: "Mission Héros du Matin",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mission Héros",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#2E5BFF",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
