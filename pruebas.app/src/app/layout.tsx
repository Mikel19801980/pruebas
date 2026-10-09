import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { PwaRegister } from "@/components/ui/PwaRegister";
import { AppConfigProvider } from "@/config/context";
import { ConfigSwitcher } from "@/components/ui/ConfigSwitcher";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Imanox Reformas | Presupuestos y Control de Obras",
  description: "App móvil para albañilería, fontanería, pladur y cerrajería. Presupuestos con fotos, compras y agenda.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Imanox",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Imanox" />
        <meta name="application-name" content="Imanox Reformas" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__deferredPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__deferredPrompt = e;
                window.dispatchEvent(new CustomEvent('imanox:prompt-ready'));
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <AppConfigProvider>
          <AuthGuard>
            <PwaRegister />
            <Navbar />
            <ConfigSwitcher />
            <main className="flex-1 pt-10 pb-20">{children}</main>
            <FloatingActionButton />
          </AuthGuard>
        </AppConfigProvider>
      </body>
    </html>
  );
}
