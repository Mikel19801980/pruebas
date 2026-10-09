"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hammer,
  FolderKanban,
  FileSpreadsheet,
  Calendar,
  ShoppingCart,
  Database,
  Download,
  Zap,
  Home,
  Users,
  Camera,
  FileCheck,
  ClipboardList,
  MoreHorizontal,
  X,
  LogIn,
  LogOut,
  UserCheck,
  Settings,
  Globe,
} from "lucide-react";
import { api, isSupabaseConfigured } from "@/lib/supabase";
import { useAppConfig } from "@/config/context";

export function Navbar() {
  const pathname = usePathname();
  const { empresa, oficio, plan, puede, terminos } = useAppConfig();
  const [showMobileMore, setShowMobileMore] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.getUsuarioActual().then((u) => {
      if (u && "email" in u && u.email) {
        setUserEmail(u.email);
      } else {
        setUserEmail(null);
      }
    });
  }, [pathname]);

  const handleLogout = async () => {
    if (confirm("¿Cerrar sesión del titular?")) {
      await api.logoutTitular();
      window.location.href = "/login";
    }
  };

  // Si estamos en la web pública para clientes finales, la barra de gestión interna no se muestra
  if (pathname === "/web") {
    return null;
  }

  // Elementos de navegación completa para Desktop (Solo niveles 1 y 2, nivel 3 equipo oculto)
  const navItems = [
    { href: "/presupuestos", label: "Presupuestos", icon: FileSpreadsheet },
    ...(puede("informes") ? [{ href: "/informes", label: "Informes", icon: Camera }] : []),
    ...(puede("clientes") ? [{ href: "/clientes", label: "Clientes", icon: Users }] : []),
    ...(puede("obras") ? [{ href: "/proyectos", label: terminos.trabajos, icon: FolderKanban }] : []),
    ...(puede("agenda") ? [{ href: "/agenda", label: "Agenda", icon: Calendar }] : []),
    ...(puede("compras") ? [{ href: "/compras", label: "Compras", icon: ShoppingCart }] : []),
    ...(puede("albaranes") ? [{ href: "/albaranes", label: "Albaranes", icon: FileCheck }] : []),
    { href: "/configuracion", label: "Configuración", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const IconLogo = oficio.id === "electricidad" ? Zap : Hammer;

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 transition-transform active:scale-95">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md"
              style={{ backgroundColor: empresa.colorPrimario }}
            >
              <IconLogo className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white">
                {empresa.nombreComercial}
              </span>
              <span className="ml-1 text-xs font-bold tracking-widest text-orange-400 uppercase">
                {empresa.subtitulo}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive("/") && pathname === "/"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              Inicio
            </Link>

            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  style={active ? { backgroundColor: empresa.colorPrimario } : {}}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Status */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("imanox:trigger-pwa-install"));
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm active:scale-95 transition-all cursor-pointer"
              style={{ backgroundColor: empresa.colorPrimario }}
              title="Instalar como app en este dispositivo"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Instalar</span>
            </button>

            {/* Database indicator pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 border border-slate-700">
              <Database
                className={`h-3 w-3 ${
                  isSupabaseConfigured ? "text-emerald-400" : "text-amber-400"
                }`}
              />
              <span className="text-slate-300 hidden sm:inline">
                {isSupabaseConfigured ? "Supabase" : "Local"}
              </span>
            </div>

            {/* Titular account indicator & logout */}
            {isSupabaseConfigured && (
              userEmail ? (
                <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline font-mono text-[11px] max-w-[130px] truncate text-slate-200">
                    {userEmail}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
                    title="Cerrar sesión de titular"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5 text-orange-400" />
                  <span className="hidden sm:inline">Entrar</span>
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/90 bg-white/95 backdrop-blur-lg pb-safe lg:hidden dark:border-slate-800 dark:bg-slate-900/95 shadow-lg">
        {/* Caso 1: Plan BÁSICO (Inicio, Presupuestos, FAB, Informes, Clientes) */}
        {plan.nivel === "basico" && (
          <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-1">
            <Link
              href="/"
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                pathname === "/"
                  ? "text-orange-600 dark:text-orange-500 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="text-[10px] mt-1">Inicio</span>
            </Link>

            <Link
              href="/presupuestos"
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive("/presupuestos")
                  ? "text-orange-600 dark:text-orange-500 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="text-[10px] mt-1">Presup.</span>
            </Link>

            {/* Hueco central reservado para el FAB */}
            <div className="flex items-center justify-center pointer-events-none">
              <span className="sr-only">Botón central</span>
            </div>

            <Link
              href="/informes"
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive("/informes")
                  ? "text-orange-600 dark:text-orange-500 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Camera className="h-5 w-5" />
              <span className="text-[10px] mt-1">Informes</span>
            </Link>

            <Link
              href="/clientes"
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive("/clientes")
                  ? "text-orange-600 dark:text-orange-500 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px] mt-1">Clientes</span>
            </Link>
          </div>
        )}

        {/* Caso 2: Plan ORGANIZADO o EQUIPO */}
        {plan.nivel !== "basico" && (
          <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-1">
            <Link
              href="/proyectos"
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive("/proyectos")
                  ? "text-orange-600 dark:text-orange-500 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <FolderKanban className="h-5 w-5" />
              <span className="text-[10px] mt-1">{terminos.trabajos}</span>
            </Link>

            <Link
              href="/presupuestos"
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive("/presupuestos")
                  ? "text-orange-600 dark:text-orange-500 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="text-[10px] mt-1">Presup.</span>
            </Link>

            {/* Hueco central reservado para el FAB */}
            <div className="flex items-center justify-center pointer-events-none">
              <span className="sr-only">Botón central</span>
            </div>

            <Link
              href="/agenda"
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive("/agenda")
                  ? "text-orange-600 dark:text-orange-500 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-[10px] mt-1">Agenda</span>
            </Link>

            {/* Botón Más opciones */}
            <button
              type="button"
              onClick={() => setShowMobileMore(!showMobileMore)}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                showMobileMore
                  ? "text-orange-600 dark:text-orange-500 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] mt-1">Más</span>
            </button>
          </div>
        )}
      </nav>

      {/* Menú Desplegable "Más" en Móvil */}
      {showMobileMore && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 shadow-2xl border-t border-slate-200 dark:border-slate-800 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-800 dark:text-white">
                Todas las secciones
              </span>
              <button
                onClick={() => setShowMobileMore(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/"
                onClick={() => setShowMobileMore(false)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Home className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Inicio</span>
              </Link>

              <Link
                href="/clientes"
                onClick={() => setShowMobileMore(false)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Clientes</span>
              </Link>

              <Link
                href="/informes"
                onClick={() => setShowMobileMore(false)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Camera className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Informes fotos</span>
              </Link>

              {puede("compras") && (
                <Link
                  href="/compras"
                  onClick={() => setShowMobileMore(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ShoppingCart className="h-5 w-5 text-amber-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Compras</span>
                </Link>
              )}

              {puede("agenda") && (
                <Link
                  href="/agenda"
                  onClick={() => setShowMobileMore(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Agenda</span>
                </Link>
              )}

              {puede("albaranes") && (
                <Link
                  href="/albaranes"
                  onClick={() => setShowMobileMore(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FileCheck className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Albaranes</span>
                </Link>
              )}

              <Link
                href="/configuracion"
                onClick={() => setShowMobileMore(false)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Settings className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Configuración</span>
              </Link>
            </div>

            {/* Sesión de titular en móvil */}
            {isSupabaseConfigured && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {userEmail ? (
                  <>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 truncate max-w-[170px]">
                        {userEmail}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileMore(false);
                        handleLogout();
                      }}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Salir
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setShowMobileMore(false)}
                    className="w-full text-center text-xs font-bold text-orange-600 dark:text-orange-400 p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40"
                  >
                    Iniciar Sesión de Titular
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
