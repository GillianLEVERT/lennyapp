import type { Metadata, Viewport } from "next";
import "./globals.css";
import { bodyFont, displayFont } from "./fonts";
import { AuthProvider } from "@/components/auth-provider";
import { PwaRegistration } from "@/components/pwa-registration";

export const metadata: Metadata = {
  title: "Skadoush",
  description:
    "Skadoush transforme la routine du matin en missions à points et récompenses à débloquer.",
  applicationName: "Skadoush",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Skadoush",
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
        <AuthProvider>{children}</AuthProvider>
        <PwaRegistration />
      </body>
    </html>
  );
}
