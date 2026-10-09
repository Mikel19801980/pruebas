"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Info } from "lucide-react";
import { api, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useAppConfig } from "@/config/context";

export default function LoginPage() {
  const router = useRouter();
  const { empresa } = useAppConfig();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isDemoMode =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    (!isSupabaseConfigured && process.env.NODE_ENV !== "production");
  const isMissingProdConfig = !isSupabaseConfigured && process.env.NODE_ENV === "production" && !isDemoMode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMissingProdConfig) {
      setError("Error de instalación: Las variables de entorno de Supabase no están configuradas en este servidor.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Introduce correo y contraseña.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.loginTitular(email.trim(), password);
      router.push("/");
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err);
      setError(
        err?.message ||
          "Credenciales incorrectas o cuenta no autorizada como titular de esta instalación."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4 py-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-6">
        {/* Cabecera */}
        <div className="text-center space-y-2">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
            style={{ backgroundColor: empresa.colorPrimario || "#f97316" }}
          >
            <ShieldCheck className="h-8 w-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Acceso Titular
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {empresa.nombreComercial} • Instalación Privada
          </p>
        </div>

        {/* Error si falta configuración de producción */}
        {isMissingProdConfig && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>Instalación No Configurada</span>
            </div>
            <p>
              Faltan las credenciales de Supabase en producción. Por seguridad, el acceso automático en modo demostración está bloqueado. Contacta al administrador para provisionar la instalación.
            </p>
          </div>
        )}

        {/* Aviso de modo demo / local si no hay Supabase en desarrollo */}
        {!isSupabaseConfigured && !isMissingProdConfig && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <Info className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Modo Demostración Local Activo</span>
            </div>
            <p>
              Supabase no está configurado en las variables de entorno. Los datos se guardan
              en la memoria local de este navegador.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full text-xs font-bold"
            >
              Acceder a la aplicación directamente
            </Button>
          </div>
        )}

        {/* SELECTOR RÁPIDO PARA PROBAR LOS 2 ROLES (SOLO EN MODO DEMO EXPLÍCITO / DESARROLLO) */}
        {isDemoMode && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 dark:border-indigo-900/60 dark:bg-indigo-950/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                Accesos de Demostración Local
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-200/80 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                Demo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const adminUser = { email: "admin@tuempresa.es", rol: "administrador" };
                  localStorage.setItem("imanox_simulated_user", JSON.stringify(adminUser));
                  window.location.href = "/configuracion";
                }}
                className="p-2.5 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 text-left hover:border-indigo-500 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 group-hover:underline">
                    Administrador
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">admin@tuempresa.es</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-300 font-medium mt-1">
                  Configura niveles y temas
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  const titularUser = { email: "titular@empresa-reformas.es", rol: "titular" };
                  localStorage.setItem("imanox_simulated_user", JSON.stringify(titularUser));
                  window.location.href = "/";
                }}
                className="p-2.5 rounded-xl border border-orange-300 dark:border-orange-800 bg-white dark:bg-slate-900 text-left hover:border-orange-500 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-orange-700 dark:text-orange-400 group-hover:underline">
                    Titular
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">titular@empresa-reformas.es</p>
                <p className="text-[10px] text-orange-600 dark:text-orange-300 font-medium mt-1">
                  Opera presupuestos y obras
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Mensaje de error si falla el acceso */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Email del Titular *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="ejemplo@autonomo.es"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl font-bold text-white shadow-lg gap-2 text-sm"
            style={{ backgroundColor: empresa.colorPrimario || "#f97316" }}
          >
            {loading ? (
              "Verificando credenciales..."
            ) : (
              <>
                Entrar al Sistema
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Nota informativa de seguridad */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Esta plantilla no admite registro abierto. Solo la cuenta asignada como titular
            tiene autorización para acceder a los datos de clientes, presupuestos y fotos.
          </p>
        </div>
      </div>
    </div>
  );
}
