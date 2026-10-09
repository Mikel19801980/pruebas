"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppConfig } from "@/config/context";
import { TipoOficio, NivelPlan } from "@/config/types";
import { Sliders, Check, X, Layers, Briefcase, Zap, Hammer, Settings, Lock } from "lucide-react";

export function ConfigSwitcher() {
  const pathname = usePathname();
  const { oficio, plan, preferencias, esAdmin, setOficio, setPlanNivel, setPreferencias } = useAppConfig();
  const [isOpen, setIsOpen] = React.useState(false);

  // Ocultar completamente en la web comercial pública y dentro del propio panel de configuración
  if (pathname === "/web" || pathname === "/configuracion") {
    return null;
  }

  return (
    <>
      {/* Botón flotante discreto en esquina inferior izquierda */}
      <aside aria-label="Selector de Modo y Oficio" className="fixed bottom-6 left-6 z-30 print:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-900 text-slate-200 border border-slate-700/80 shadow-xl text-xs backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          title="Configurar Oficio y Nivel de la Plataforma"
        >
          <div className="flex items-center gap-1.5 font-bold text-white">
            {oficio.id === "electricidad" ? (
              <Zap className="h-3.5 w-3.5 text-sky-400" />
            ) : (
              <Hammer className="h-3.5 w-3.5 text-orange-400" />
            )}
            <span>{oficio.nombre}</span>
          </div>
          <span className="text-slate-500 font-normal">|</span>
          <span className="text-[11px] font-semibold text-slate-300 capitalize">
            {plan.nivel === "basico" ? "Sin obras" : plan.nombre}
          </span>
          <Sliders className="h-3.5 w-3.5 text-slate-400 ml-1 group-hover:rotate-45 transition-transform" />
        </button>
      </aside>

      {/* Panel emergente modal / drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 print:hidden">
          <div
            className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-600/20 text-orange-400">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Configuración del Modo</h3>
                  <p className="text-[11px] text-slate-400">
                    Adapta la plataforma al oficio y forma de trabajar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selector 1: Oficio Comercial */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-orange-400" />
                  1. Actividad Comercial (Oficio)
                </label>
                {!esAdmin && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                    <Lock className="h-3 w-3" /> Solo Admin
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!esAdmin}
                  onClick={() => esAdmin && setOficio("reformas")}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                    !esAdmin ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                  } ${
                    oficio.id === "reformas"
                      ? "bg-orange-600 text-white shadow-sm ring-2 ring-orange-400/30"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Hammer className="h-4 w-4" />
                    Reformas
                  </span>
                  {oficio.id === "reformas" && <Check className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  disabled={!esAdmin}
                  onClick={() => esAdmin && setOficio("electricidad")}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                    !esAdmin ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                  } ${
                    oficio.id === "electricidad"
                      ? "bg-sky-600 text-white shadow-sm ring-2 ring-sky-400/30"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Electricidad
                  </span>
                  {oficio.id === "electricidad" && <Check className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {esAdmin
                  ? `Cambia vocabulario (${oficio.vocabulario.trabajosNombre}) y partidas sugeridas. Mantiene los datos y NIF de la empresa intactos.`
                  : "Definido por el administrador de la instalación para este negocio."}
              </p>
            </div>

            {/* Selector 2: Nivel Funcional (Plan) */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-blue-400" />
                  2. Nivel Funcional (Plan)
                </label>
                {!esAdmin && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                    <Lock className="h-3 w-3" /> Solo Admin
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["basico", "organizado"] as NivelPlan[]).map((nivel) => (
                  <button
                    key={nivel}
                    type="button"
                    disabled={!esAdmin}
                    onClick={() => esAdmin && setPlanNivel(nivel)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold capitalize transition-all ${
                      !esAdmin ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                    } ${
                      plan.nivel === nivel
                        ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {nivel === "basico" ? "1. Básico (Sin Obras)" : "2. Organizado"}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {plan.nivel === "basico"
                  ? "Modo sin obras: Presupuestos directos, informes con fotos y compras libres."
                  : plan.lema}
              </p>
            </div>

            {/* Selector 3: Preferencias */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                3. Ajustes de Flujo
              </label>
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                  <span>Agrupar por Obras/Trabajos</span>
                  <input
                    type="checkbox"
                    checked={preferencias.agruparPorObra}
                    disabled={plan.nivel === "basico"}
                    onChange={(e) => setPreferencias({ agruparPorObra: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-orange-600 focus:ring-0 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                  <span>Selector de Gremios múltiple</span>
                  <input
                    type="checkbox"
                    checked={preferencias.mostrarSelectorGremios}
                    onChange={(e) => setPreferencias({ mostrarSelectorGremios: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-orange-600 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Acceso al Configurador Completo */}
            <Link
              href="/configuracion"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm"
            >
              <Settings className="h-4 w-4" />
              Abrir Panel de Configuración Completo
            </Link>

            {/* Botón cerrar */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Listo / Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
