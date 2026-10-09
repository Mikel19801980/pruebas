"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAppConfig } from "@/config/context";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { puede } = useAppConfig();
  const [checking, setChecking] = React.useState(isSupabaseConfigured);
  const [authenticated, setAuthenticated] = React.useState(!isSupabaseConfigured);

  const isPublicRoute = pathname === "/login" || pathname === "/web" || pathname?.startsWith("/web");

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setChecking(false);
      setAuthenticated(true);
      return;
    }

    let isMounted = true;

    // Comprobar sesión actual estrictamente en Supabase Auth (sin bypass de localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        if (!isPublicRoute) {
          router.replace("/login");
        }
      }
      setChecking(false);
    });

    // Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setAuthenticated(true);
        if (pathname === "/login") {
          router.replace("/");
        }
      } else {
        setAuthenticated(false);
        if (!isPublicRoute) {
          router.replace("/login");
        }
      }
      setChecking(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router, isPublicRoute]);

  // Si falta configuración en entorno de producción, mostrar pantalla de error de instalación
  if (!isSupabaseConfigured) {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Error de Instalación</h1>
            <p className="text-xs text-slate-300">
              Falta la configuración de Supabase en producción. Configura <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            </p>
            <p className="text-[11px] text-slate-400">
              Consulta la guía en <code>INSTRUCCIONES_INSTALACION.md</code> para aprovisionar tu base de datos.
            </p>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  // Si estamos en una ruta pública, renderizarla directamente
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Mientras se valida la sesión al arrancar
  if (checking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <p className="mt-4 text-xs font-semibold text-slate-500">Verificando acceso del titular...</p>
      </div>
    );
  }

  // Si no está autenticado y no está en /login, no mostrar el contenido protegido
  if (!authenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <p className="mt-4 text-xs font-semibold text-slate-500">Redirigiendo a inicio de sesión...</p>
      </div>
    );
  }

  // Protección de acceso directo a módulos deshabilitados
  const routeCapMap: Record<string, import("@/config/types").Capacidad> = {
    "/presupuestos": "presupuestos",
    "/informes": "informes",
    "/proyectos": "obras",
    "/agenda": "agenda",
    "/compras": "compras",
    "/albaranes": "albaranes",
    "/clientes": "clientes",
  };

  const matchedPrefix = Object.keys(routeCapMap).find(
    (prefix) => pathname === prefix || pathname?.startsWith(prefix + "/")
  );

  if (matchedPrefix) {
    const requiredCap = routeCapMap[matchedPrefix];
    if (!puede(requiredCap)) {
      return (
        <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Módulo No Habilitado</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Esta sección ha sido desactivada en la configuración de la instalación por el administrador.
            Tus datos registrados siguen conservados íntegramente en la base de datos.
          </p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-800 hover:opacity-90 transition-opacity"
            >
              Volver al Inicio
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
