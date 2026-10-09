"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Hammer,
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { api } from "@/lib/supabase";
import { getTemaConfig } from "@/config/temas";
import { getOficioConfig } from "@/config/oficios";
import { EMPRESA_IMANOX } from "@/config/empresa";
import { DEFAULT_WEB_PUBLICA } from "@/config/web_publica";
import { EmpresaConfig, WebPublicaConfig } from "@/config/types";

function WebPublicaContent() {
  const searchParams = useSearchParams();
  const isPreviewRequested = searchParams.get("preview") === "1" || searchParams.get("preview") === "true";

  const [loading, setLoading] = React.useState(true);
  const [esPreview, setEsPreview] = React.useState(false);
  const [errorPreview, setErrorPreview] = React.useState<string | null>(null);

  const [oficioId, setOficioId] = React.useState<string>("reformas");
  const [temaId, setTemaId] = React.useState<string>("tema_clasico");
  const [empresa, setEmpresa] = React.useState<EmpresaConfig>(EMPRESA_IMANOX);
  const [webPublica, setWebPublica] = React.useState<WebPublicaConfig>(DEFAULT_WEB_PUBLICA);

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (isPreviewRequested) {
        try {
          const draftData = await api.getPrevisualizacionBorrador();
          if (draftData) {
            setEsPreview(true);
            if (draftData.oficio_id) setOficioId(draftData.oficio_id);
            if (draftData.tema_id) setTemaId(draftData.tema_id);
            if (draftData.empresa) setEmpresa(draftData.empresa);
            if (draftData.web_publica) setWebPublica(draftData.web_publica);
            setLoading(false);
            return;
          }
        } catch (err: any) {
          console.warn("Fallo al acceder a previsualización:", err);
          setErrorPreview(
            err?.message ||
              "Acceso restringido: Solo el administrador autenticado puede previsualizar borradores."
          );
        }
      }

      // Cargar web pública sanitizada para visitantes anónimos y fallback
      try {
        const publicData = await api.getWebPublica();
        if (publicData) {
          if (publicData.oficio_id) setOficioId(publicData.oficio_id);
          if (publicData.tema_id) setTemaId(publicData.tema_id);
          if (publicData.empresa) setEmpresa(publicData.empresa);
          if (publicData.web_publica) setWebPublica(publicData.web_publica);
        }
      } catch (err) {
        console.error("Error cargando web comercial pública:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isPreviewRequested]);

  const tema = React.useMemo(() => getTemaConfig(temaId), [temaId]);
  const oficio = React.useMemo(() => getOficioConfig(oficioId as any), [oficioId]);
  const IconLogo = oficioId === "electricidad" ? Zap : Hammer;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Cargando web comercial...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-orange-500 selection:text-white"
      style={{ fontFamily: tema.fuente }}
    >
      {/* Banner Exclusivo de Previsualización para el Administrador */}
      {esPreview && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2.5 text-xs font-bold border-b border-amber-600 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 shrink-0" />
            <span>
              Previsualización de Borrador (Solo visible para el Administrador) — Estos cambios no están visibles para los clientes hasta su publicación.
            </span>
          </div>
          <Link
            href="/configuracion"
            className="flex items-center gap-1 bg-amber-900 hover:bg-black text-white px-3 py-1 rounded-lg text-[11px] transition-colors ml-4 shrink-0"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Volver al Configurador</span>
          </Link>
        </div>
      )}

      {errorPreview && (
        <div className="bg-rose-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 shrink-0" />
            <span>{errorPreview} Mostrando la versión pública actual.</span>
          </div>
          <Link href="/login" className="underline text-[11px] ml-4 shrink-0">
            Iniciar Sesión como Administrador
          </Link>
        </div>
      )}

      {/* Barra superior de contacto rápido */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            {webPublica.telefonoContacto && (
              <a
                href={`tel:${webPublica.telefonoContacto.replace(/\s+/g, "")}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-orange-400" />
                <span>{webPublica.telefonoContacto}</span>
              </a>
            )}
            {webPublica.emailContacto && (
              <a
                href={`mailto:${webPublica.emailContacto}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors hidden sm:flex"
              >
                <Mail className="h-3.5 w-3.5 text-orange-400" />
                <span>{webPublica.emailContacto}</span>
              </a>
            )}
          </div>
          <div className="flex items-center gap-3">
            {webPublica.zonaAtencion && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="h-3 w-3 text-orange-400" />
                {webPublica.zonaAtencion}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cabecera de la Web Pública */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: tema.colorPrimario || empresa.colorPrimario }}
            >
              <IconLogo className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {empresa.nombreComercial}
              </h2>
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                {empresa.subtitulo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {webPublica.telefonoContacto && (
              <a
                href={`tel:${webPublica.telefonoContacto.replace(/\s+/g, "")}`}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                style={{ backgroundColor: tema.colorPrimario || empresa.colorPrimario }}
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Llamar Ahora</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-orange-50/40 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Presupuestos y Asesoramiento Sin Compromiso</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white max-w-3xl mx-auto leading-tight">
            {webPublica.titulo}
          </h1>

          <p className="text-lg sm:text-xl font-medium text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {webPublica.subtitulo}
          </p>

          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {webPublica.descripcion}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {webPublica.telefonoContacto && (
              <a
                href={`tel:${webPublica.telefonoContacto.replace(/\s+/g, "")}`}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-black text-white shadow-xl hover:shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: tema.colorPrimario || empresa.colorPrimario }}
              >
                <Phone className="h-4 w-4" />
                <span>Pedir Presupuesto: {webPublica.telefonoContacto}</span>
              </a>
            )}
            <a
              href="#servicios"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Ver Servicios</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Servicios Destacados */}
      <section id="servicios" className="py-16 sm:py-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">
              Nuestros Servicios Profesionales
            </h2>
            <p className="text-sm text-slate-500">
              Garantizamos máxima seriedad, plazos acordados y cumplimiento riguroso de la normativa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(webPublica.servicios || []).map((srv, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-orange-500/40 hover:shadow-md transition-all space-y-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {srv.titulo}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 pl-11 leading-relaxed">
                  {srv.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galería de Trabajos */}
      {webPublica.galeriaFotos && webPublica.galeriaFotos.length > 0 && (
        <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-3xl font-black text-slate-950 dark:text-white">
                Galería de Trabajos Realizados
              </h2>
              <p className="text-sm text-slate-500">
                Muestra fotográfica de acabados e intervenciones recientes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {webPublica.galeriaFotos.map((foto, idx) => (
                <div
                  key={idx}
                  className="group overflow-hidden rounded-3xl bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col"
                >
                  <div className="aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={foto.url}
                      alt={foto.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {foto.titulo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Zona de Cobertura y Contacto Directo */}
      <section className="py-16 sm:py-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 text-orange-600 mb-2">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white">
            ¿Hablamos de tu proyecto?
          </h2>

          <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Atendemos directamente en {webPublica.zonaAtencion || "nuestra zona de cobertura"}. Solicita una visita técnica sin ningún compromiso.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-bold">
            {webPublica.telefonoContacto && (
              <a
                href={`tel:${webPublica.telefonoContacto.replace(/\s+/g, "")}`}
                className="px-6 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Phone className="h-4 w-4 text-orange-400" />
                <span>{webPublica.telefonoContacto}</span>
              </a>
            )}
            {webPublica.emailContacto && (
              <a
                href={`mailto:${webPublica.emailContacto}`}
                className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <Mail className="h-4 w-4 text-orange-500" />
                <span>{webPublica.emailContacto}</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Pie de página comercial */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-bold text-white">{empresa.nombreComercial}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {empresa.cifNif ? `CIF/NIF: ${empresa.cifNif} · ` : ""}
              {empresa.direccion || ""}
            </p>
          </div>
          {esPreview && (
            <div className="flex items-center gap-4 text-[11px]">
              <Link href="/configuracion" className="text-orange-400 hover:underline">
                Volver al Configurador
              </Link>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function WebPublicaPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <p className="text-xs font-semibold text-slate-500">Cargando...</p>
        </div>
      }
    >
      <WebPublicaContent />
    </React.Suspense>
  );
}
