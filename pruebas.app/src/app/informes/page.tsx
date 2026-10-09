"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Plus,
  Search,
  Calendar,
  User,
  Image as ImageIcon,
  Printer,
  Share2,
  Trash2,
  ExternalLink,
  Upload,
  X,
  FileText,
  MessageCircle,
} from "lucide-react";
import { api, Informe, Cliente, Proyecto, FotoInforme } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { useAppConfig } from "@/config/context";

function InformesContent() {
  const { puede, terminos, empresa } = useAppConfig();
  const [informes, setInformes] = React.useState<Informe[]>([]);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [proyectos, setProyectos] = React.useState<Proyecto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busqueda, setBusqueda] = React.useState("");

  // Modal nuevo informe
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [titulo, setTitulo] = React.useState("");
  const [clienteNombre, setClienteNombre] = React.useState("");
  const [clienteTelefono, setClienteTelefono] = React.useState("");
  const [clienteId, setClienteId] = React.useState("");
  const [proyectoId, setProyectoId] = React.useState("");
  const [fecha, setFecha] = React.useState(new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = React.useState("");
  const [fotos, setFotos] = React.useState<FotoInforme[]>([]);
  const [subiendoFoto, setSubiendoFoto] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [errorCarga, setErrorCarga] = React.useState<string | null>(null);
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get("cliente_id");
  const crearParam = searchParams.get("crear");

  const fetchData = async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const [infData, cliData, projData] = await Promise.all([
        api.getInformes(),
        api.getClientes(),
        puede("obras") ? api.getProyectos() : Promise.resolve([]),
      ]);
      setInformes(infData);
      setClientes(cliData);
      setProyectos(projData);
    } catch (e: any) {
      console.error("Error cargando informes:", e);
      setErrorCarga(e?.message || "Error al conectar con la base de datos");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [puede]);

  React.useEffect(() => {
    if (crearParam === "1") {
      abrirNuevoInforme();
    }
  }, [crearParam]);

  React.useEffect(() => {
    if (clienteIdParam && clientes.length > 0) {
      const cli = clientes.find((c) => c.id === clienteIdParam);
      if (cli) {
        setClienteId(cli.id);
        setClienteNombre(cli.nombre);
        setClienteTelefono(cli.telefono || "");
        setIsModalOpen(true);
      }
    }
  }, [clienteIdParam, clientes]);

  const abrirNuevoInforme = () => {
    setTitulo("");
    setClienteNombre("");
    setClienteTelefono("");
    setClienteId("");
    setProyectoId("");
    setFecha(new Date().toISOString().slice(0, 10));
    setDescripcion("");
    setFotos([]);
    setIsModalOpen(true);
  };

  const handleClienteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setClienteId(val);
    const cli = clientes.find((c) => c.id === val);
    if (cli) {
      setClienteNombre(cli.nombre);
      setClienteTelefono(cli.telefono || "");
    }
  };

  const handleSubirFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setSubiendoFoto(true);
    try {
      const subidas: FotoInforme[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await api.uploadFoto(file);
        subidas.push({
          id: crypto.randomUUID(),
          url,
          nota: "",
        });
      }
      setFotos((prev) => [...prev, ...subidas]);
    } catch (err) {
      console.error("Error subiendo foto:", err);
    } finally {
      setSubiendoFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleActualizarNotaFoto = (id: string, nota: string) => {
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, nota } : f)));
  };

  const handleEliminarFoto = (id: string) => {
    setFotos((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCrearInforme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !clienteNombre.trim()) return;
    setGuardando(true);
    try {
      const nuevo = await api.createInforme({
        titulo: titulo.trim(),
        cliente_nombre: clienteNombre.trim(),
        cliente_telefono: clienteTelefono.trim() || null,
        cliente_id: clienteId || null,
        proyecto_id: proyectoId || null,
        fecha,
        descripcion: descripcion.trim() || null,
        fotos,
      });
      setIsModalOpen(false);
      window.location.href = `/informes/${nuevo.id}`;
    } catch (err: any) {
      console.error("Error creando informe:", err);
      alert(`Error al guardar el informe: ${err?.message || "Revisa la base de datos o conexión"}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarInforme = async (id: string, tit: string) => {
    if (!confirm(`¿Eliminar el informe fotográfico "${tit}"?`)) return;
    try {
      await api.deleteInforme(id);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrado
  const informesFiltrados = informes.filter((inf) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      inf.titulo.toLowerCase().includes(q) ||
      inf.cliente_nombre.toLowerCase().includes(q) ||
      (inf.descripcion && inf.descripcion.toLowerCase().includes(q))
    );
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      {/* Cabecera */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Informes con Fotos
            </h1>
            <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400">
              {informes.length} informe{informes.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reportes fotográficos para clientes: visitas previas, avance diario o fin de obra
          </p>
        </div>

        <Button
          onClick={abrirNuevoInforme}
          className="shadow-md text-white font-bold"
          style={{ backgroundColor: empresa.colorPrimario }}
        >
          <Camera className="mr-2 h-4 w-4 stroke-[2.5]" />
          Nuevo Informe
        </Button>
      </div>

      {/* Banner de Error Visible con Reintento */}
      {errorCarga && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-200 text-sm">
          <span>{errorCarga}</span>
          <Button size="sm" variant="outline" onClick={fetchData} className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-200">
            Reintentar
          </Button>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar informe por título, cliente o notas..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Lista de Informes */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : informesFiltrados.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <Camera className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            {busqueda ? "No hay informes que coincidan" : "No tienes informes fotográficos"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {busqueda
              ? "Prueba con otra palabra clave."
              : "Crea tu primer informe de fotos para documentar el estado de un trabajo o enviar un resumen al cliente."}
          </p>
          {!busqueda && (
            <Button
              onClick={abrirNuevoInforme}
              className="mt-4 text-white font-bold"
              style={{ backgroundColor: empresa.colorPrimario }}
            >
              <Camera className="mr-2 h-4 w-4" />
              Crear primer informe
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {informesFiltrados.map((inf) => (
            <Card
              key={inf.id}
              className="overflow-hidden border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-md flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(inf.fecha)}
                    </span>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white mt-0.5">
                      {inf.titulo}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {inf.cliente_nombre}
                    </p>
                  </div>

                  <button
                    onClick={() => handleEliminarInforme(inf.id, inf.titulo)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Eliminar informe"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {inf.descripcion && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {inf.descripcion}
                  </p>
                )}

                {/* Previsualización de Fotos */}
                {inf.fotos && inf.fotos.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {inf.fotos.slice(0, 4).map((f, idx) => (
                        <div
                          key={f.id || idx}
                          className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100"
                        >
                          <img
                            src={f.url}
                            alt={f.nota || "Foto informe"}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                      {inf.fotos.length > 4 && (
                        <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                          +{inf.fotos.length - 4} más
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {inf.fotos.length} foto{inf.fotos.length === 1 ? "" : "s"} adjunta{inf.fotos.length === 1 ? "" : "s"}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-3 text-center text-xs text-slate-400">
                    Sin fotos adjuntas
                  </div>
                )}
              </div>

              {/* Pie de tarjeta con botones */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Link
                  href={`/informes/${inf.id}`}
                  className="flex-1 text-center py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Ver / Imprimir PDF
                </Link>

                {inf.cliente_telefono && (
                  <a
                    href={`https://wa.me/${inf.cliente_telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Hola ${inf.cliente_nombre}, adjunto el informe fotográfico "${inf.titulo}" de ${empresa.nombreComercial}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                    title="Enviar por WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Nuevo Informe */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Informe con Fotos"
        description="Documenta el estado de una obra o trabajo con fotos y notas directas."
      >
        <form onSubmit={handleCrearInforme} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Título del informe *
            </label>
            <Input
              type="text"
              required
              placeholder="Ej: Inspección inicial humedades / Fin de instalación cocina"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cliente *
              </label>
              {clientes.length > 0 ? (
                <div className="space-y-1.5">
                  <select
                    value={clienteId}
                    onChange={handleClienteSelect}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Seleccionar o escribir --</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.telefono ? `(${c.telefono})` : ""}
                      </option>
                    ))}
                  </select>
                  {!clienteId && (
                    <Input
                      type="text"
                      placeholder="Nombre cliente"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                    />
                  )}
                </div>
              ) : (
                <Input
                  type="text"
                  required
                  placeholder="Nombre cliente"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha
              </label>
              <Input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>

          {/* Selector de Obra si el plan tiene obras */}
          {puede("obras") && proyectos.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Asociar a {terminos.trabajo} (opcional)
              </label>
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Ninguna (informe independiente) --</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titulo} ({p.cliente_nombre})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Descripción con Dictado por voz */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Descripción / Observaciones
              </label>
              <VoiceInput
                onTranscript={(text) =>
                  setDescripcion((prev) => (prev ? `${prev} ${text}` : text))
                }
                size="sm"
                buttonText="Dictar por voz"
              />
            </div>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Explica qué se ha revisado, qué problemas se han detectado o qué trabajos se han culminado..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fotos del informe */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Fotos ({fotos.length})
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={subiendoFoto}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                {subiendoFoto ? "Subiendo..." : "Añadir fotos"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleSubirFotos}
              />
            </div>

            {fotos.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <Camera className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Pulsa para sacar foto con la cámara o elegir de la galería
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Puedes subir varias fotos</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {fotos.map((f, i) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60"
                  >
                    <img
                      src={f.url}
                      alt={`Foto ${i + 1}`}
                      className="h-12 w-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Pie de foto (ej: tubería antes de sellar)"
                        value={f.nota || ""}
                        onChange={(e) => handleActualizarNotaFoto(f.id, e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEliminarFoto(f.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={guardando || !titulo.trim() || !clienteNombre.trim()}
              className="text-white font-bold"
              style={{ backgroundColor: empresa.colorPrimario }}
            >
              {guardando ? "Creando informe..." : "Crear y Abrir Informe"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function InformesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Cargando informes...</div>}>
      <InformesContent />
    </React.Suspense>
  );
}
