"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Calendar,
  Camera,
  FileSpreadsheet,
  ShoppingCart,
  Plus,
  Loader2,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { api, Proyecto, Presupuesto, PartidaPresupuesto, ListaCompra, EventoAgenda, EstadoProyecto } from "@/lib/supabase";
import { formatCurrency, formatDate, getGremioBadgeClasses } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { PartidaForm } from "@/components/forms/PartidaForm";
import { CompraForm } from "@/components/forms/CompraForm";

export default function ProyectoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [proyecto, setProyecto] = React.useState<Proyecto | null>(null);
  const [presupuestos, setPresupuestos] = React.useState<Presupuesto[]>([]);
  const [partidas, setPartidas] = React.useState<PartidaPresupuesto[]>([]);
  const [compras, setCompras] = React.useState<ListaCompra[]>([]);
  const [eventos, setEventos] = React.useState<EventoAgenda[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [uploadingFoto, setUploadingFoto] = React.useState(false);
  const [modalPartida, setModalPartida] = React.useState(false);
  const [modalCompra, setModalCompra] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const allProjs = await api.getProyectos();
      const current = allProjs.find((p) => p.id === id);
      setProyecto(current || null);

      const presList = await api.getPresupuestos(id);
      setPresupuestos(presList);

      if (presList.length > 0) {
        const parts = await api.getPartidas(presList[0].id);
        setPartidas(parts);
      } else {
        setPartidas([]);
      }

      const compList = await api.getCompras(id);
      setCompras(compList);

      const evList = await api.getEventos(id);
      setEventos(evList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [id]);

  const handleCambiarEstado = async (nuevoEstado: EstadoProyecto) => {
    if (!proyecto) return;
    await api.updateProyectoEstado(proyecto.id, nuevoEstado);
    setProyecto({ ...proyecto, estado: nuevoEstado });
  };

  const handleCrearPresupuestoInicial = async () => {
    if (!proyecto) return;
    const nuevo = await api.createPresupuesto({
      titulo: proyecto.titulo,
      cliente_nombre: proyecto.cliente_nombre,
      cliente_telefono: proyecto.cliente_telefono,
      proyecto_id: proyecto.id,
      total: 0,
      enlace_pdf: null,
      estado: "Borrador",
    });
    setPresupuestos([nuevo]);
    setModalPartida(true);
  };

  const handleSubirFotoCamara = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !proyecto) return;
    setUploadingFoto(true);
    try {
      const publicUrl = await api.uploadFoto(file);
      let presId = presupuestos[0]?.id;
      if (!presId) {
        const nuevoPres = await api.createPresupuesto({
          titulo: proyecto.titulo,
          cliente_nombre: proyecto.cliente_nombre,
          cliente_telefono: proyecto.cliente_telefono,
          proyecto_id: proyecto.id,
          total: 0,
          enlace_pdf: null,
          estado: "Borrador",
        });
        presId = nuevoPres.id;
        setPresupuestos([nuevoPres]);
      }
      const nuevaPartida = await api.addPartida({
        presupuesto_id: presId,
        concepto: `Foto estado de obra (${new Date().toLocaleDateString("es-ES")})`,
        gremio: "Albañilería",
        precio: 0,
        foto_url: publicUrl,
      });
      setPartidas((prev) => [...prev, nuevaPartida]);
    } catch (err) {
      console.error(err);
      alert("Error subiendo fotografía a Supabase.");
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleToggleCompra = async (compraId: string, actual: boolean) => {
    await api.toggleCompra(compraId, !actual);
    setCompras((prev) =>
      prev.map((c) => (c.id === compraId ? { ...c, comprado: !actual } : c))
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-orange-600 mr-2" />
        Cargando obra...
      </div>
    );
  }

  if (!proyecto) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-600">Obra no encontrada.</p>
        <Button variant="outline" onClick={() => router.push("/proyectos")}>
          Volver a Obras
        </Button>
      </div>
    );
  }

  const activePresupuesto = presupuestos[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
      {/* Botón Volver y Cabecera */}
      <div className="space-y-3">
        <Link
          href="/proyectos"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Obras
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {proyecto.titulo}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Cliente: <span className="font-semibold text-slate-700 dark:text-slate-300">{proyecto.cliente_nombre}</span>
              {" • "}Inicio: {formatDate(proyecto.fecha_inicio)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {proyecto.cliente_telefono && (
              <a
                href={`https://wa.me/34${proyecto.cliente_telefono.replace(/\s+/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </a>
            )}

            <select
              value={proyecto.estado}
              onChange={(e) => handleCambiarEstado(e.target.value as EstadoProyecto)}
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="En curso">En curso</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Terminado">Terminado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas de Pie de Obra */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Abrir Cámara con capture="environment" */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          className="hidden"
          onChange={handleSubirFotoCamara}
        />
        <Button
          variant="outline"
          className="flex flex-col h-auto py-3 gap-1.5 border-dashed border-2 hover:border-orange-500"
          disabled={uploadingFoto}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadingFoto ? (
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
          ) : (
            <Camera className="h-5 w-5 text-orange-600" />
          )}
          <span className="text-xs font-bold">Foto Cámara</span>
        </Button>

        <Button
          variant="outline"
          className="flex flex-col h-auto py-3 gap-1.5"
          onClick={() => {
            if (!activePresupuesto) {
              handleCrearPresupuestoInicial();
            } else {
              setModalPartida(true);
            }
          }}
        >
          <Plus className="h-5 w-5 text-blue-600" />
          <span className="text-xs font-bold">Añadir Partida</span>
        </Button>

        <Button
          variant="outline"
          className="flex flex-col h-auto py-3 gap-1.5"
          onClick={() => setModalCompra(true)}
        >
          <ShoppingCart className="h-5 w-5 text-emerald-600" />
          <span className="text-xs font-bold">Pedir Material</span>
        </Button>

        {activePresupuesto ? (
          <Link
            href={`/presupuestos/${activePresupuesto.id}`}
            className="flex flex-col items-center justify-center py-3 rounded-xl border border-slate-200 bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 transition-colors dark:border-slate-800 dark:bg-orange-950/40 dark:text-orange-300"
          >
            <FileSpreadsheet className="h-5 w-5" />
            <span className="text-xs mt-1.5">Ver PDF Presupuesto</span>
          </Link>
        ) : (
          <Button
            variant="orange"
            className="flex flex-col h-auto py-3 gap-1.5"
            onClick={handleCrearPresupuestoInicial}
          >
            <FileSpreadsheet className="h-5 w-5" />
            <span className="text-xs font-bold">Crear Presupuesto</span>
          </Button>
        )}
      </div>

      {/* SECCIÓN 1: Presupuesto y Partidas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-orange-600" />
                Presupuesto de la Reforma
              </CardTitle>
              {activePresupuesto && (
                <div className="text-xs text-slate-500 mt-0.5">
                  Estado: <Badge variant="warning">{activePresupuesto.estado}</Badge>
                </div>
              )}
            </div>

            {activePresupuesto && (
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Total Estimado</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(activePresupuesto.total)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!activePresupuesto ? (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-500 mb-3">Esta obra aún no tiene un presupuesto creado.</p>
              <Button size="sm" variant="orange" onClick={handleCrearPresupuestoInicial}>
                Crear Presupuesto Ahora
              </Button>
            </div>
          ) : partidas.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No hay partidas registradas todavía. Añade la primera con el botón &quot;Añadir Partida&quot;.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {partidas.map((partida) => (
                <div key={partida.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {partida.foto_url && (
                      <a href={partida.foto_url} target="_blank" rel="noreferrer">
                        <img
                          src={partida.foto_url}
                          alt="Foto partida"
                          className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                        />
                      </a>
                    )}
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mb-1 ${getGremioBadgeClasses(partida.gremio)}`}>
                        {partida.gremio}
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {partida.concepto}
                      </p>
                      {partida.cantidad && partida.precio_unitario && partida.precio > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300">
                          <span>{partida.cantidad} {partida.unidad || "ud"}</span>
                          <span>×</span>
                          <span>{formatCurrency(partida.precio_unitario)}/{partida.unidad || "ud"}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {partida.foto_url && (!partida.precio || partida.precio === 0) ? (
                      <span className="text-xs font-semibold text-slate-400 italic bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        Documental
                      </span>
                    ) : (
                      formatCurrency(partida.precio)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN 2: Galería de Fotos del Proyecto */}
      {partidas.some((p) => p.foto_url) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              Fotografías de Obra (Supabase Storage: fotos_reformas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {partidas
                .filter((p) => p.foto_url)
                .map((p) => (
                  <div key={p.id} className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <img
                      src={p.foto_url!}
                      alt={p.concepto}
                      className="h-32 w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 p-1.5 text-[10px] text-white truncate">
                      {p.concepto}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECCIÓN 3: Materiales Pendientes de esta Obra */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
              Materiales de esta Obra
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setModalCompra(true)}>
              <Plus className="h-4 w-4 mr-1" /> Apuntar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {compras.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">No hay materiales apuntados para esta obra.</p>
          ) : (
            <div className="space-y-2">
              {compras.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleToggleCompra(c.id, c.comprado)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    c.comprado
                      ? "bg-slate-50/60 border-slate-200 text-slate-400 line-through dark:bg-slate-900/40 dark:border-slate-800"
                      : "bg-white border-slate-200 text-slate-900 hover:border-orange-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                        c.comprado
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-400"
                      }`}
                    >
                      {c.comprado && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{c.material}</p>
                      <span className="text-[11px] text-slate-500">
                        {c.proveedor} {c.gremio ? `• ${c.gremio}` : ""}
                      </span>
                    </div>
                  </div>
                  <Badge variant={c.comprado ? "success" : "secondary"}>
                    {c.comprado ? "Comprado" : "Pendiente"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Añadir Partida */}
      {activePresupuesto && (
        <Modal
          isOpen={modalPartida}
          onClose={() => setModalPartida(false)}
          title="Añadir Partida de Presupuesto"
          description="Detalla el trabajo, gremio y precio presupuestado."
        >
          <PartidaForm
            presupuestoId={activePresupuesto.id}
            onSuccess={(nueva) => {
              setPartidas((prev) => [...prev, nueva]);
              setModalPartida(false);
              fetchData();
            }}
            onCancel={() => setModalPartida(false)}
          />
        </Modal>
      )}

      {/* Modal Apuntar Material */}
      <Modal
        isOpen={modalCompra}
        onClose={() => setModalCompra(false)}
        title="Apuntar Material para la Obra"
        description="Escribe o dicta por voz lo que necesitas pedir o comprar."
      >
        <CompraForm
          proyectos={[proyecto]}
          initialProyectoId={proyecto.id}
          onSuccess={(nueva) => {
            setCompras((prev) => [nueva, ...prev]);
            setModalCompra(false);
          }}
          onCancel={() => setModalCompra(false)}
        />
      </Modal>
    </div>
  );
}
