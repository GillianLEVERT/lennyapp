import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  balooFont,
  bodyFont,
  displayFont,
  fredokaFont,
  luckiestFont,
  nunitoFont,
  quicksandFont,
} from "./fonts";
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
      className={`${bodyFont.variable} ${displayFont.variable} ${balooFont.variable} ${nunitoFont.variable} ${luckiestFont.variable} ${fredokaFont.variable} ${quicksandFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
        <PwaRegistration />
      </body>
    </html>
  );
}
