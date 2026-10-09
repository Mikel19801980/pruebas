"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Share2,
  Plus,
  Trash2,
  Hammer,
  Loader2,
  Phone,
  MessageCircle,
  Edit3,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Camera,
  Zap,
  Printer,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { api, Presupuesto, PartidaPresupuesto, Proyecto, EstadoPresupuesto } from "@/lib/supabase";
import { formatCurrency, formatDate, getGremioBadgeClasses } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PartidaForm } from "@/components/forms/PartidaForm";
import { useAppConfig } from "@/config/context";

export default function PresupuestoDetallePage() {
  const { empresa, oficio, puede, terminos } = useAppConfig();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [presupuesto, setPresupuesto] = React.useState<Presupuesto | null>(null);
  const [partidas, setPartidas] = React.useState<PartidaPresupuesto[]>([]);
  const [proyecto, setProyecto] = React.useState<Proyecto | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [generandoPdf, setGenerandoPdf] = React.useState(false);
  const [modalPartida, setModalPartida] = React.useState(false);
  const [modalFormaPago, setModalFormaPago] = React.useState(false);
  const [modalWhatsApp, setModalWhatsApp] = React.useState(false);

  // Edición de Forma de Pago
  const [formaPagoTexto, setFormaPagoTexto] = React.useState("");

  // Estado modal WhatsApp
  const [telefonoWhatsApp, setTelefonoWhatsApp] = React.useState("");

  const presupuestoRef = React.useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const pres = await api.getPresupuestoById(id);
      if (pres) {
        setPresupuesto(pres);
        setFormaPagoTexto(
          pres.forma_pago ||
            "10% a la reserva/firma del presupuesto, 40% al arrancar los trabajos, 30% a mitad de ejecución, 20% a finalización y entrega."
        );
        setTelefonoWhatsApp(pres.cliente_telefono || "");

        const parts = await api.getPartidas(pres.id);
        setPartidas(parts);

        if (pres.proyecto_id) {
          const projs = await api.getProyectos();
          const foundProj = projs.find((p) => p.id === pres.proyecto_id);
          setProyecto(foundProj || null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [id]);

  const handleEstadoChange = async (nuevoEstado: EstadoPresupuesto) => {
    if (!presupuesto) return;
    await api.updatePresupuesto(presupuesto.id, { estado: nuevoEstado });
    setPresupuesto({ ...presupuesto, estado: nuevoEstado });
  };

  const handleGuardarFormaPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presupuesto) return;
    await api.updatePresupuesto(presupuesto.id, { forma_pago: formaPagoTexto });
    setPresupuesto({ ...presupuesto, forma_pago: formaPagoTexto });
    setModalFormaPago(false);
  };

  const handleEliminarPartida = async (partidaId: string) => {
    if (!confirm("¿Deseas eliminar esta partida del presupuesto?")) return;
    if (!presupuesto) return;
    await api.deletePartida(partidaId, presupuesto.id);
    const updated = partidas.filter((p) => p.id !== partidaId);
    setPartidas(updated);
    const newTotal = updated.reduce((acc, curr) => acc + (Number(curr.precio) || 0), 0);
    setPresupuesto({ ...presupuesto, total: newTotal });
  };

  const [activandoObra, setActivandoObra] = React.useState(false);
  const handleActivarProyecto = async () => {
    if (!presupuesto || activandoObra) return;
    setActivandoObra(true);
    try {
      const proj = await api.convertirPresupuestoEnProyecto(presupuesto.id);
      setProyecto(proj);
      setPresupuesto({ ...presupuesto, estado: "Aceptado", proyecto_id: proj.id });
      alert(`¡Obra generada con éxito: "${proj.titulo}"! La puedes gestionar en Obras Activas.`);
    } catch (err: any) {
      console.error(err);
      alert(`Error al generar obra: ${err?.message || "Error desconocido"}`);
    } finally {
      setActivandoObra(false);
    }
  };

  // Generador de PDF
  const generarPDF = async (): Promise<Blob | null> => {
    if (!presupuestoRef.current) return null;
    setGenerandoPdf(true);

    try {
      const element = presupuestoRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const totalPdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = totalPdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, totalPdfHeight);
        heightLeft -= pageHeight;
      }

      const filename = `Presupuesto-${empresa.nombreComercial.replace(/\s+/g, "_")}-${(presupuesto?.titulo || "Propuesta").replace(/\s+/g, "_")}.pdf`;
      pdf.save(filename);

      const blob = pdf.output("blob");
      return blob;
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Hubo un error al generar el archivo PDF.");
      return null;
    } finally {
      setGenerandoPdf(false);
    }
  };

  // Comprobar si el teléfono es un móvil español (empieza por 6 o 7)
  const esMovil = (tel: string) => {
    const limpio = tel.replace(/\D/g, "");
    return (
      (limpio.length === 9 && (limpio.startsWith("6") || limpio.startsWith("7"))) ||
      (limpio.length === 11 && (limpio.startsWith("346") || limpio.startsWith("347")))
    );
  };

  const generarTextoMensajeWhatsApp = () => {
    if (!presupuesto) return "";
    const totalTexto = formatCurrency(presupuesto.total);
    const nombreEmpresa = empresa.nombreComercial;
    return `Hola ${presupuesto.cliente_nombre}, aquí tienes el presupuesto de ${nombreEmpresa} para:\n*${presupuesto.titulo}*\n\n💰 *Total Presupuesto:* ${totalTexto}\n\n📋 *Condiciones de pago acordadas:*\n${presupuesto.forma_pago || formaPagoTexto}\n\nQuedamos a tu completa disposición. ¡Un saludo del equipo de ${nombreEmpresa}!`;
  };

  const enviarWhatsAppFinal = async () => {
    if (!presupuesto) return;
    const telLimpio = telefonoWhatsApp.replace(/\D/g, "");
    const numeroFinal = telLimpio.startsWith("34") ? telLimpio : `34${telLimpio}`;
    const mensaje = generarTextoMensajeWhatsApp();

    // Guardar teléfono actualizado si cambió
    if (telefonoWhatsApp !== presupuesto.cliente_telefono) {
      await api.updatePresupuesto(presupuesto.id, { cliente_telefono: telefonoWhatsApp });
      setPresupuesto({ ...presupuesto, cliente_telefono: telefonoWhatsApp });
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Presupuesto ${empresa.nombreComercial} - ${presupuesto.titulo}`,
          text: mensaje,
        });
        setModalWhatsApp(false);
        return;
      } catch (e) {}
    }

    const url = `https://api.whatsapp.com/send?phone=${numeroFinal}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
    setModalWhatsApp(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-orange-600 mr-2" />
        Cargando presupuesto...
      </div>
    );
  }

  if (!presupuesto) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-600">Presupuesto no encontrado.</p>
        <Button variant="outline" onClick={() => router.push("/presupuestos")}>
          Volver a Presupuestos
        </Button>
      </div>
    );
  }

  // Agrupar partidas por gremio
  const gremiosAgrupados = partidas.reduce((acc, p) => {
    if (!acc[p.gremio]) acc[p.gremio] = [];
    acc[p.gremio].push(p);
    return acc;
  }, {} as Record<string, PartidaPresupuesto[]>);

  // Cálculo de pagos estimados (ej. 10%, 40%, etc.)
  const totalPres = Number(presupuesto.total) || 0;
  const pago10 = totalPres * 0.1;
  const pago40 = totalPres * 0.4;
  const pago30 = totalPres * 0.3;
  const pago20 = totalPres * 0.2;

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 space-y-6">
      {/* Barra superior de navegación y estado (Fija/Sticky para no perderla de vista) */}
      <div className="sticky top-16 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs print:hidden">
        <Link
          href="/presupuestos"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Presupuestos
        </Link>

        {/* Acciones principales superiores */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={presupuesto.estado}
            onChange={(e) => handleEstadoChange(e.target.value as EstadoPresupuesto)}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
          >
            <option value="Borrador">Borrador</option>
            <option value="Enviado">Enviado al Cliente</option>
            <option value="Aceptado">✓ Aceptado</option>
            <option value="Rechazado">✕ Rechazado</option>
          </select>

          <Button
            variant="orange"
            size="sm"
            onClick={() => setModalPartida(true)}
            className="gap-1.5 cursor-pointer shadow-md shadow-orange-500/20 font-bold"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Añadir Partida
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 cursor-pointer bg-white font-bold"
          >
            <Printer className="h-4 w-4 text-slate-700" />
            Imprimir / Guardar PDF
          </Button>

          {/* BOTÓN MÁGICO DE WHATSAPP DESTACADO */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setModalWhatsApp(true)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm font-bold"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Banner de Presupuesto Aceptado -> Crear Obra (solo si el plan lo permite) */}
      {puede("obras") && presupuesto.estado === "Aceptado" && !presupuesto.proyecto_id && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-200 print:hidden">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">¡El cliente ha aceptado este presupuesto!</h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Pasa de propuesta comercial a {terminos.trabajo.toLowerCase()} en ejecución con un solo clic.
              </p>
            </div>
          </div>
          <Button
            variant="default"
            size="sm"
            disabled={activandoObra}
            onClick={handleActivarProyecto}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white gap-2 font-bold shrink-0 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            {activandoObra ? "Generando obra..." : `Generar ${terminos.trabajo} Activo`}
          </Button>
        </div>
      )}

      {/* Banner de Presupuesto Rechazado */}
      {presupuesto.estado === "Rechazado" && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200 print:hidden">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Presupuesto Rechazado por el Cliente</h4>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              Esta propuesta fue declinada o desestimada. Queda archivada como histórico para futuras consultas.
            </p>
          </div>
        </div>
      )}

      {/* DOCUMENTO OFICIAL PARA VISTA Y PDF */}
      <div
        ref={presupuestoRef}
        className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-lg text-slate-900 print:shadow-none print:border-none print:p-0"
      >
        {/* Cabecera del Documento Dinámica según Empresa y Oficio */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 border-b-2 border-slate-900 gap-4 print-avoid-break">
          <div className="flex items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md print:shadow-none"
              style={{ backgroundColor: empresa.colorPrimario }}
            >
              {oficio.id === "electricidad" ? (
                <Zap className="h-7 w-7 stroke-[2.5]" />
              ) : (
                <Hammer className="h-7 w-7 stroke-[2.5]" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-wider text-slate-900">
                {empresa.nombreComercial}
              </h2>
              <span
                className="text-xs font-black tracking-widest uppercase block"
                style={{ color: empresa.colorPrimario }}
              >
                {empresa.subtitulo}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {empresa.direccion} • CIF/NIF: {empresa.cifNif} • Tel: {empresa.telefono}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs">
            <div className="flex items-center sm:justify-end gap-2 flex-wrap">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: `${empresa.colorPrimario}20`, color: empresa.colorPrimario }}
              >
                PRESUPUESTO Nº {presupuesto.id.slice(0, 8).toUpperCase()}
              </span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  presupuesto.estado === "Aceptado"
                    ? "bg-emerald-100 text-emerald-800"
                    : presupuesto.estado === "Rechazado"
                    ? "bg-rose-100 text-rose-800"
                    : presupuesto.estado === "Enviado"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {presupuesto.estado}
              </span>
            </div>
            <p className="text-slate-500">
              Fecha de emisión: {formatDate(presupuesto.fecha_emision || presupuesto.created_at || new Date().toISOString())}
            </p>
            <p className="text-slate-500">Validez de la oferta: 30 días</p>
          </div>
        </div>

        {/* Datos del Cliente y Propuesta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-200 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider block">CLIENTE</span>
            <p className="text-base font-bold text-slate-900">{presupuesto.cliente_nombre}</p>
            {presupuesto.cliente_telefono && (
              <p className="text-slate-600 flex items-center gap-1.5 font-mono">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                {presupuesto.cliente_telefono}
              </p>
            )}
          </div>

          <div className="space-y-1 sm:text-right">
            <span className="font-bold text-slate-400 uppercase tracking-wider block">TRABAJO / LOCALIZACIÓN</span>
            <p className="text-base font-bold text-slate-900">{presupuesto.titulo}</p>
            <p className="text-slate-500">
              {presupuesto.proyecto_id ? "✓ Obra activa asociada" : "Presupuesto previo de valoración"}
            </p>
          </div>
        </div>

        {/* Listado de Trabajos y Partidas por Gremio */}
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                DESGLOSE DETALLADO DE TRABAJOS Y PARTIDAS
              </h3>
              <span className="text-xs text-slate-400">
                {partidas.length} {partidas.length === 1 ? "partida" : "partidas"} registradas
              </span>
            </div>

            {/* BOTÓN VISIBLE EN LA PROPIA SECCIÓN */}
            <Button
              type="button"
              variant="orange"
              size="sm"
              onClick={() => setModalPartida(true)}
              className="gap-1.5 shadow-sm font-bold cursor-pointer print:hidden"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Añadir Partida
            </Button>
          </div>

          {Object.keys(gremiosAgrupados).length === 0 ? (
            <div className="text-center py-10 px-4 border-2 border-dashed border-orange-300 dark:border-orange-800 bg-orange-50/40 dark:bg-orange-950/20 rounded-2xl space-y-3">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Este presupuesto aún no tiene partidas añadidas.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Pulsa el botón a continuación para introducir el primer trabajo, dictarlo por voz, seleccionar gremio y poner precio.
              </p>
              <Button
                type="button"
                variant="orange"
                size="default"
                onClick={() => setModalPartida(true)}
                className="gap-2 shadow-md cursor-pointer font-bold px-6 py-3"
              >
                <Plus className="h-5 w-5 stroke-[2.5]" />
                Añadir Primera Partida Ahora
              </Button>
            </div>
          ) : (
            Object.entries(gremiosAgrupados).map(([gremio, items]) => (
              <div key={gremio} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5 print-avoid-break">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getGremioBadgeClasses(gremio)}`}>
                    {gremio}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({items.length} {items.length === 1 ? "concepto" : "conceptos"})
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const esFotoOPrecioCero = Boolean(item.foto_url && (!item.precio || item.precio === 0));

                    return (
                      <div key={item.id} className="py-3 flex items-start justify-between gap-4 print-avoid-break">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            {item.foto_url && (
                              <img
                                src={item.foto_url}
                                alt="Estado partida"
                                className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            )}
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.concepto}</p>
                              {item.cantidad && item.precio_unitario && !esFotoOPrecioCero ? (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
                                  <span>{item.cantidad} {item.unidad || "ud"}</span>
                                  <span>×</span>
                                  <span>{formatCurrency(item.precio_unitario)}/{item.unidad || "ud"}</span>
                                </div>
                              ) : null}
                              {item.foto_url && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-semibold mt-0.5 block">
                                  <Camera className="h-3 w-3" />
                                  Fotografía documental adjunta
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Si es una foto o partida sin coste, NO se muestra precio numérico */}
                          {esFotoOPrecioCero ? (
                            <span className="text-xs font-semibold text-slate-400 italic bg-slate-100 px-2 py-0.5 rounded">
                              Documental (Sin coste)
                            </span>
                          ) : (
                            <span className="font-mono text-sm font-bold text-slate-900 whitespace-nowrap">
                              {formatCurrency(item.precio)}
                            </span>
                          )}

                          <button
                            onClick={() => handleEliminarPartida(item.id)}
                            className="text-slate-300 hover:text-rose-500 p-1 transition-colors print:hidden cursor-pointer"
                            title="Eliminar partida"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {partidas.length > 0 && (
            <div className="pt-2 flex justify-start print:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalPartida(true)}
                className="gap-1.5 border-dashed border-2 hover:border-orange-500 font-bold cursor-pointer"
              >
                <Plus className="h-4 w-4 text-orange-600 stroke-[2.5]" />
                Añadir otra partida o fotografía
              </Button>
            </div>
          )}
        </div>

        {/* Galería de Fotografías del Estado Actual */}
        {partidas.some((p) => p.foto_url) && (
          <div className="py-6 border-t border-slate-200 space-y-3 print-avoid-break">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              REGISTRO FOTOGRÁFICO ADJUNTO (ESTADO ACTUAL)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {partidas
                .filter((p) => p.foto_url)
                .map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-xl border border-slate-200">
                    <img
                      src={p.foto_url!}
                      alt={p.concepto}
                      className="h-28 w-full object-cover"
                      onError={async (e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.retried && p.foto_url) {
                          target.dataset.retried = "true";
                          const renewed = await api.getFotoUrl(p.foto_url);
                          if (renewed && renewed !== target.src) {
                            target.src = renewed;
                          }
                        }
                      }}
                    />
                    <p className="p-1.5 text-[10px] text-slate-600 truncate bg-slate-50">{p.concepto}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* CONDICIONES Y FORMA DE PAGO ESTIMADA */}
        <div className="py-6 border-t-2 border-slate-200 space-y-3 bg-slate-50/70 p-4 rounded-2xl print-avoid-break">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-orange-600" />
              CONDICIONES Y FORMA DE PAGO ACORDADAS
            </h4>
            <button
              onClick={() => setModalFormaPago(true)}
              className="text-xs text-orange-600 hover:underline flex items-center gap-1 font-bold print:hidden cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" /> Modificar Forma de Pago
            </button>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {presupuesto.forma_pago || formaPagoTexto}
          </p>

          {/* Desglose de importes estimado si hay total */}
          {totalPres > 0 && (
            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-semibold">10% Reserva/Inicio</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(pago10)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-semibold">40% Arranque obra</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(pago40)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-semibold">30% Mitad ejecución</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(pago30)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-semibold">20% Entrega y fin</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(pago20)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Resumen Económico y Total */}
        <div className="mt-6 pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row items-end justify-between gap-4 print-avoid-break">
          <div className="text-xs text-slate-500 space-y-1">
            <p>• Los trabajos incluyen mano de obra cualificada, herramientas y desescombro.</p>
            <p>• Impuestos no incluidos (IVA aplicable según normativa vigente para reformas).</p>
          </div>

          <div className="w-full sm:w-72 rounded-2xl bg-slate-900 p-5 text-white text-right space-y-1">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">TOTAL PRESUPUESTO</span>
            <div className="text-3xl font-black text-orange-400">
              {formatCurrency(presupuesto.total)}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EDITAR FORMA DE PAGO */}
      <Modal
        isOpen={modalFormaPago}
        onClose={() => setModalFormaPago(false)}
        title="Forma de Pago del Presupuesto"
        description="Establece cómo se abonarán los importes (porcentajes, semanal por avance, etc.)."
      >
        <form onSubmit={handleGuardarFormaPago} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                setFormaPagoTexto(
                  "10% a la reserva/firma del presupuesto, 40% al arrancar los trabajos, 30% a mitad de ejecución, 20% a finalización y entrega."
                )
              }
              className="p-2.5 rounded-xl text-xs font-bold border border-slate-200 text-left hover:border-orange-500 cursor-pointer"
            >
              <strong>10% al arrancar</strong>
              <p className="text-[10px] text-slate-500 mt-0.5">10% - 40% - 30% - 20%</p>
            </button>
            <button
              type="button"
              onClick={() =>
                setFormaPagoTexto(
                  "40% al inicio de obra y acopio de materiales, 40% a mitad de obra, 20% a finalización."
                )
              }
              className="p-2.5 rounded-xl text-xs font-bold border border-slate-200 text-left hover:border-orange-500 cursor-pointer"
            >
              <strong>40% - 40% - 20%</strong>
              <p className="text-[10px] text-slate-500 mt-0.5">Clásico tres pagos</p>
            </button>
            <button
              type="button"
              onClick={() =>
                setFormaPagoTexto(
                  "10% reserva y pagos semanales cada viernes según avance y certificación de partidas completadas."
                )
              }
              className="p-2.5 rounded-xl text-xs font-bold border border-slate-200 text-left hover:border-orange-500 cursor-pointer"
            >
              <strong>Semanal por avance</strong>
              <p className="text-[10px] text-slate-500 mt-0.5">Según avance real</p>
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Texto de condiciones que verá el cliente:
            </label>
            <textarea
              rows={4}
              value={formaPagoTexto}
              onChange={(e) => setFormaPagoTexto(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="w-1/3" onClick={() => setModalFormaPago(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="orange" className="w-2/3">
              Guardar Condiciones
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL COMPARTIR POR WHATSAPP INTELIGENTE */}
      <Modal
        isOpen={modalWhatsApp}
        onClose={() => setModalWhatsApp(false)}
        title="Enviar Presupuesto por WhatsApp"
        description="Verifica el teléfono móvil del cliente antes de enviar."
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Teléfono Móvil del Cliente (WhatsApp) *
            </label>
            <Input
              type="tel"
              placeholder="Ej. 622114455"
              value={telefonoWhatsApp}
              onChange={(e) => setTelefonoWhatsApp(e.target.value)}
              required
            />
            {telefonoWhatsApp && !esMovil(telefonoWhatsApp) && (
              <p className="flex items-center gap-1 text-[11px] text-amber-600 mt-1 font-semibold">
                <AlertCircle className="h-3.5 w-3.5" />
                Parece un teléfono fijo o incompleto. Asegúrate de que sea un móvil (ej. 6XXXXXXXX).
              </p>
            )}
          </div>

          {/* Vista previa del mensaje */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Mensaje que recibirá el cliente:
            </label>
            <div className="mt-1.5 p-3 rounded-xl bg-slate-100 text-slate-800 text-xs font-sans whitespace-pre-line border border-slate-200">
              {generarTextoMensajeWhatsApp()}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="w-1/3" onClick={() => setModalWhatsApp(false)}>
              Cerrar
            </Button>
            <Button
              type="button"
              variant="orange"
              className="w-2/3 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              onClick={enviarWhatsAppFinal}
              disabled={!telefonoWhatsApp.trim()}
            >
              <MessageCircle className="h-4 w-4" />
              Abrir WhatsApp Ahora
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Añadir Partida con micrófono continuo */}
      <Modal
        isOpen={modalPartida}
        onClose={() => setModalPartida(false)}
        title="Nueva Partida al Presupuesto"
        description="Escribe o dicta el trabajo por voz, añade gremio, precio o foto."
      >
        <PartidaForm
          presupuestoId={presupuesto.id}
          onSuccess={(nueva) => {
            setPartidas((prev) => [...prev, nueva]);
            setPresupuesto((prev) => (prev ? { ...prev, total: prev.total + (nueva.precio || 0) } : null));
            setModalPartida(false);
          }}
          onCancel={() => setModalPartida(false)}
        />
      </Modal>
    </div>
  );
}
