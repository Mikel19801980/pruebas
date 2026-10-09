"use client";

import * as React from "react";
import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";
import { Button } from "./button";

declare global {
  interface Window {
    __deferredPrompt: any;
  }
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showBanner, setShowBanner] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [showIOSModal, setShowIOSModal] = React.useState(false);

  React.useEffect(() => {
    // 1. Detectar si ya está en modo app / standalone
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 2. Detectar si es iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 3. Registrar Service Worker nativo
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("PWA Service Worker registrado con éxito:", reg.scope);
        })
        .catch((err) => {
          console.warn("Fallo al registrar Service Worker:", err);
        });
    }

    // 4. Si el prompt ya fue capturado antes de que React montara
    if (window.__deferredPrompt) {
      setDeferredPrompt(window.__deferredPrompt);
      setShowBanner(true);
    }

    // 5. Escuchar evento nativo 'beforeinstallprompt' (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__deferredPrompt = e;
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handlePromptReady = () => {
      if (window.__deferredPrompt) {
        setDeferredPrompt(window.__deferredPrompt);
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("imanox:prompt-ready", handlePromptReady);

    // Si es iOS, mostrar banner para que puedan añadirlo a pantalla de inicio
    if (isIosDevice) {
      setShowBanner(true);
    }

    // 6. Escuchar cuando pulsan "Instalar" desde el Navbar
    const handleNavbarTrigger = () => {
      executeInstall();
    };
    window.addEventListener("imanox:trigger-pwa-install", handleNavbarTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("imanox:prompt-ready", handlePromptReady);
      window.removeEventListener("imanox:trigger-pwa-install", handleNavbarTrigger);
    };
  }, []);

  const executeInstall = async () => {
    const prompt = deferredPrompt || window.__deferredPrompt;

    if (prompt) {
      // Android / Chromium: Disparo 100% nativo directo sin modales ni pasos extras
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        console.log(`Instalación resultado: ${outcome}`);
        setDeferredPrompt(null);
        window.__deferredPrompt = null;
        setShowBanner(false);
      } catch (err) {
        console.error("Error al ejecutar prompt de instalación:", err);
      }
      return;
    }

    // Si es dispositivo iOS (Apple no tiene prompt nativo por API)
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // En Android, si por algún motivo el evento tardó un segundo en registrarse, intentamos forzar re-chequeo
    if (window.__deferredPrompt) {
      try {
        window.__deferredPrompt.prompt();
        setShowBanner(false);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Banner de instalación directo */}
      {showBanner && (
        <div className="fixed top-18 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white shrink-0 shadow-md">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">Instalar Imanox Reformas</h4>
                <p className="text-[11px] text-slate-300">Añade la app a tu pantalla de inicio</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="orange"
                size="sm"
                onClick={executeInstall}
                className="h-8 px-3 text-xs font-bold gap-1 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Instalar
              </Button>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Solo para iOS (iPhone) si pulsan instalar, ya que Safari no tiene API nativa */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Instalar en iPhone (Safari)</h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Pulsa el botón <strong>Compartir</strong> (<Share className="h-3.5 w-3.5 inline text-blue-400" />) en la barra inferior de Safari y luego selecciona <strong>&ldquo;Añadir a pantalla de inicio&rdquo;</strong> (<PlusSquare className="h-3.5 w-3.5 inline text-orange-400" />).
            </p>
            <Button
              type="button"
              variant="orange"
              className="w-full h-9 text-xs font-bold rounded-xl cursor-pointer"
              onClick={() => setShowIOSModal(false)}
            >
              Entendido
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
