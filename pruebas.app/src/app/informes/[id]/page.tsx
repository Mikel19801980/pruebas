"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Share2,
  Calendar,
  User,
  Phone,
  Camera,
  MessageCircle,
  FileText,
  CheckCircle,
} from "lucide-react";
import { api, Informe } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppConfig } from "@/config/context";

export default function DetalleInformePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { empresa, oficio } = useAppConfig();

  const [informe, setInforme] = React.useState<Informe | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    const fetchInforme = async () => {
      setLoading(true);
      try {
        const data = await api.getInformeById(id);
        setInforme(data);
      } catch (err) {
        console.error("Error cargando informe:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInforme();
  }, [id]);

  const handleImprimir = () => {
    window.print();
  };

  const cleanPhone = (phone?: string | null) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("34") ? digits : `34${digits}`;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center space-y-4">
        <div className="h-10 w-48 mx-auto bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!informe) {
    return (
      <div className="mx-auto max-w-md p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Informe no encontrado</h2>
        <p className="text-sm text-slate-500">El informe que buscas no existe o ha sido eliminado.</p>
        <Button onClick={() => router.push("/informes")}>Volver a Informes</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      {/* Barra de Acciones Superior (Oculta al imprimir) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Link
          href="/informes"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Informes
        </Link>

        <div className="flex items-center gap-2">
          {informe.cliente_telefono && (
            <a
              href={`https://wa.me/${cleanPhone(informe.cliente_telefono)}?text=${encodeURIComponent(
                `Hola ${informe.cliente_nombre}, te comparto el informe técnico "${informe.titulo}" realizado por ${empresa.nombreComercial}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}

          <Button
            onClick={handleImprimir}
            className="text-white font-bold text-xs gap-1.5 shadow-sm"
            style={{ backgroundColor: empresa.colorPrimario }}
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      {/* LIENZO DEL INFORME (Documento imprimible) */}
      <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-10 print:p-0 print:border-none print:shadow-none space-y-8">
        {/* Cabecera del Documento */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                {empresa.nombreComercial}
              </span>
            </div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-0.5">
              {empresa.subtitulo} · {oficio.nombre}
            </p>
            <div className="text-xs text-slate-500 mt-2 space-y-0.5">
              {empresa.cifNif && <p>NIF/CIF: {empresa.cifNif}</p>}
              <p>Tel: {empresa.telefono}</p>
              <p>Email: {empresa.email}</p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-100 sm:min-w-[260px]">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 mb-2">
              INFORME TÉCNICO CON FOTOS
            </span>
            <div className="space-y-1 text-xs">
              <p className="text-slate-500">
                Fecha: <span className="font-bold text-slate-900">{formatDate(informe.fecha)}</span>
              </p>
              <p className="text-slate-500">
                Ref: <span className="font-mono text-slate-700">INF-{informe.id.slice(0, 8)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Datos del Cliente y Título */}
        <div className="grid sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              DATOS DEL CLIENTE
            </h4>
            <p className="font-bold text-slate-900 text-sm">{informe.cliente_nombre}</p>
            {informe.cliente_telefono && (
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" />
                {informe.cliente_telefono}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              ASUNTO / MOTIVO DEL INFORME
            </h4>
            <p className="font-black text-slate-900 text-sm">{informe.titulo}</p>
          </div>
        </div>

        {/* Descripción / Diagnóstico */}
        {informe.descripcion && (
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              DESCRIPCIÓN Y OBSERVACIONES TÉCNICAS
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {informe.descripcion}
            </div>
          </div>
        )}

        {/* Galería Fotográfica */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-600" />
              REGISTRO FOTOGRÁFICO ADJUNTO ({informe.fotos?.length || 0})
            </h3>
          </div>

          {informe.fotos && informe.fotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {informe.fotos.map((foto, index) => (
                <div
                  key={foto.id || index}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col justify-between break-inside-avoid"
                >
                  <div className="relative aspect-video sm:aspect-4/3 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={foto.url}
                      alt={foto.nota || `Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={async (e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.retried && foto.url) {
                          target.dataset.retried = "true";
                          const renewed = await api.getFotoUrl(foto.url);
                          if (renewed && renewed !== target.src) {
                            target.src = renewed;
                          }
                        }
                      }}
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                      Foto {index + 1}
                    </span>
                  </div>
                  {foto.nota && (
                    <div className="p-3 border-t border-slate-200 bg-white">
                      <p className="text-xs text-slate-700 italic">
                        "{foto.nota}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Sin fotografías adjuntas en este informe.</p>
          )}
        </div>

        {/* Pie de Firma / Validez */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
          <div>
            <p className="font-bold text-slate-800 mb-12">Por la empresa / Técnico responsable:</p>
            <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-500">
              {empresa.nombreComercial}
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-800 mb-12">Recibí / Conformidad del cliente:</p>
            <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-500">
              D./Dña. {informe.cliente_nombre}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
