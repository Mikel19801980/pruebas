"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileCheck,
  Plus,
  Search,
  Calendar,
  User,
  Trash2,
  Printer,
  ChevronRight,
  PlusCircle,
  FileText,
  Phone,
} from "lucide-react";
import { api, Albaran, LineaAlbaran, Cliente, Proyecto } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppConfig } from "@/config/context";

export default function AlbaranesPage() {
  const { puede, terminos, empresa } = useAppConfig();
  const [albaranes, setAlbaranes] = React.useState<Albaran[]>([]);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [proyectos, setProyectos] = React.useState<Proyecto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorCarga, setErrorCarga] = React.useState<string | null>(null);
  const [busqueda, setBusqueda] = React.useState("");

  // Modal nuevo albarán
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [numero, setNumero] = React.useState("");
  const [clienteNombre, setClienteNombre] = React.useState("");
  const [clienteTelefono, setClienteTelefono] = React.useState("");
  const [proyectoId, setProyectoId] = React.useState("");
  const [fecha, setFecha] = React.useState(new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = React.useState("");
  const [lineas, setLineas] = React.useState<LineaAlbaran[]>([
    { id: crypto.randomUUID(), descripcion: "", cantidad: 1, unidad: "ud" },
  ]);
  const [guardando, setGuardando] = React.useState(false);

  // Albarán para imprimir / ver
  const [albaranImprimir, setAlbaranImprimir] = React.useState<Albaran | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const [albData, cliData, projData] = await Promise.all([
        api.getAlbaranes(),
        api.getClientes(),
        puede("obras") ? api.getProyectos() : Promise.resolve([]),
      ]);
      setAlbaranes(albData);
      setClientes(cliData);
      setProyectos(projData);
    } catch (e: any) {
      console.error("Error cargando albaranes:", e);
      setErrorCarga(e?.message || "No se pudo sincronizar la lista de albaranes.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [puede]);

  const abrirNuevoAlbaran = async () => {
    let siguienteNum = "";
    try {
      siguienteNum = await api.obtenerSiguienteNumeroAlbaran(new Date().getFullYear());
    } catch {
      siguienteNum = `ALB-${new Date().getFullYear()}-${String(albaranes.length + 1).padStart(3, "0")}`;
    }
    setNumero(siguienteNum);
    setClienteNombre("");
    setClienteTelefono("");
    setProyectoId("");
    setFecha(new Date().toISOString().slice(0, 10));
    setObservaciones("");
    setLineas([{ id: crypto.randomUUID(), descripcion: "", cantidad: 1, unidad: "ud" }]);
    setIsModalOpen(true);
  };

  const handleClienteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const cli = clientes.find((c) => c.id === val);
    if (cli) {
      setClienteNombre(cli.nombre);
      setClienteTelefono(cli.telefono || "");
    }
  };

  const handleAddLinea = () => {
    setLineas([
      ...lineas,
      { id: crypto.randomUUID(), descripcion: "", cantidad: 1, unidad: "ud" },
    ]);
  };

  const handleUpdateLinea = (id: string, campo: keyof LineaAlbaran, valor: any) => {
    setLineas(
      lineas.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    );
  };

  const handleRemoveLinea = (id: string) => {
    if (lineas.length === 1) return;
    setLineas(lineas.filter((l) => l.id !== id));
  };

  const handleCrearAlbaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim() || !clienteNombre.trim()) return;
    const lineasValidas = lineas.filter((l) => l.descripcion.trim().length > 0);
    if (lineasValidas.length === 0) {
      alert("Introduce al menos una línea con descripción en el albarán.");
      return;
    }
    setGuardando(true);
    try {
      const nuevo = await api.createAlbaran({
        numero: numero.trim(),
        cliente_nombre: clienteNombre.trim(),
        cliente_telefono: clienteTelefono.trim() || null,
        proyecto_id: puede("obras") && proyectoId ? proyectoId : null,
        fecha,
        lineas: lineasValidas,
        observaciones: observaciones.trim() || null,
      });
      setIsModalOpen(false);
      await fetchData();
      setAlbaranImprimir(nuevo);
    } catch (err: any) {
      console.error("Error creando albarán:", err);
      alert(`Error al guardar el albarán: ${err?.message || "Revisa la base de datos o conexión"}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarAlbaran = async (id: string, num: string) => {
    if (!confirm(`¿Eliminar albarán "${num}"?`)) return;
    try {
      await api.deleteAlbaran(id);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrado
  const albaranesFiltrados = albaranes.filter((alb) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      alb.numero.toLowerCase().includes(q) ||
      alb.cliente_nombre.toLowerCase().includes(q) ||
      (alb.observaciones && alb.observaciones.toLowerCase().includes(q))
    );
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      {errorCarga && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold">Error de sincronización con la base de datos</p>
            <p className="text-xs mt-0.5">{errorCarga}</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchData} className="self-start sm:self-auto shrink-0">
            Reintentar
          </Button>
        </div>
      )}

      {/* Cabecera */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Albaranes
            </h1>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              {albaranes.length} documento{albaranes.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Albaranes de entrega de materiales y recepción de trabajos firmados por el cliente
          </p>
        </div>

        <Button
          onClick={abrirNuevoAlbaran}
          className="shadow-md text-white font-bold"
          style={{ backgroundColor: empresa.colorPrimario }}
        >
          <Plus className="mr-2 h-4 w-4 stroke-[3]" />
          Nuevo Albarán
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar albarán por número, cliente..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
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

      {/* Lista de Albaranes */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : albaranesFiltrados.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <FileCheck className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            {busqueda ? "No hay albaranes que coincidan" : "No tienes albaranes emitidos"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {busqueda
              ? "Prueba a buscar con otro término."
              : "Genera albaranes rápidos para que el cliente firme la entrega de materiales o remates de obra."}
          </p>
          {!busqueda && (
            <Button
              onClick={abrirNuevoAlbaran}
              className="mt-4 text-white font-bold"
              style={{ backgroundColor: empresa.colorPrimario }}
            >
              <Plus className="mr-2 h-4 w-4 stroke-[3]" />
              Crear primer albarán
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {albaranesFiltrados.map((alb) => (
            <Card
              key={alb.id}
              className="overflow-hidden border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-md flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                      {alb.numero}
                    </span>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white mt-2">
                      {alb.cliente_nombre}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {formatDate(alb.fecha)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleEliminarAlbaran(alb.id, alb.numero)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Eliminar albarán"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Resumen de Líneas */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 space-y-1.5 text-xs">
                  {alb.lineas.slice(0, 3).map((l, i) => (
                    <div key={l.id || i} className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span className="truncate pr-2">• {l.descripcion}</span>
                      <span className="font-mono font-bold shrink-0">
                        {l.cantidad} {l.unidad}
                      </span>
                    </div>
                  ))}
                  {alb.lineas.length > 3 && (
                    <p className="text-[11px] text-slate-400 italic">
                      +{alb.lineas.length - 3} líneas más...
                    </p>
                  )}
                </div>

                {alb.observaciones && (
                  <p className="text-xs text-slate-500 italic line-clamp-1">
                    "{alb.observaciones}"
                  </p>
                )}
              </div>

              {/* Botón ver e imprimir */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button
                  onClick={() => setAlbaranImprimir(alb)}
                  size="sm"
                  className="w-full text-white font-bold text-xs gap-1.5"
                  style={{ backgroundColor: empresa.colorPrimario }}
                >
                  <Printer className="h-3.5 w-3.5" />
                  Ver / Imprimir Albarán
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal / Vista Imprimible de Albarán */}
      {albaranImprimir && (
        <Modal
          isOpen={Boolean(albaranImprimir)}
          onClose={() => setAlbaranImprimir(null)}
          title={`Albarán ${albaranImprimir.numero}`}
          description="Documento de entrega con líneas detalladas y zona de firma"
        >
          <div className="space-y-6 pt-2">
            {/* Lienzo del Albarán */}
            <div id="albaran-print-canvas" className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 space-y-6">
              {/* Encabezado */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase text-slate-900">
                    {empresa.nombreComercial}
                  </h2>
                  <p className="text-xs text-orange-600 font-bold uppercase">{empresa.subtitulo}</p>
                  <p className="text-xs text-slate-500 mt-1">Tel: {empresa.telefono}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded">
                    ALBARÁN: {albaranImprimir.numero}
                  </span>
                  <p className="text-xs text-slate-500 mt-2">Fecha: {formatDate(albaranImprimir.fecha)}</p>
                </div>
              </div>

              {/* Cliente */}
              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  CLIENTE / DESTINO:
                </span>
                <p className="font-bold text-sm text-slate-900">{albaranImprimir.cliente_nombre}</p>
                {albaranImprimir.cliente_telefono && (
                  <p className="text-slate-600">Tel: {albaranImprimir.cliente_telefono}</p>
                )}
              </div>

              {/* Tabla de Conceptos */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5">Descripción del material o trabajo entregado</th>
                      <th className="p-2.5 text-right w-24">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {albaranImprimir.lineas.map((linea, idx) => (
                      <tr key={linea.id || idx}>
                        <td className="p-2.5 font-medium text-slate-800">{linea.descripcion}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {linea.cantidad} {linea.unidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {albaranImprimir.observaciones && (
                <div className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg">
                  Observaciones: {albaranImprimir.observaciones}
                </div>
              )}

              {/* Zona de Firma */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-xs text-slate-600">
                <div>
                  <p className="font-bold mb-10">Entregado por:</p>
                  <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-500">
                    {empresa.nombreComercial}
                  </div>
                </div>
                <div>
                  <p className="font-bold mb-10">Recibí y conforme (Firma del cliente):</p>
                  <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-500">
                    D./Dña. {albaranImprimir.cliente_nombre}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción del modal */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAlbaranImprimir(null)}>
                Cerrar
              </Button>
              <Button
                onClick={() => window.print()}
                className="text-white font-bold gap-1.5"
                style={{ backgroundColor: empresa.colorPrimario }}
              >
                <Printer className="h-4 w-4" />
                Imprimir Documento
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Nuevo Albarán */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Emitir Nuevo Albarán"
        description="Añade las líneas de materiales o conceptos entregados para la firma del cliente."
      >
        <form onSubmit={handleCrearAlbaran} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Número *
              </label>
              <Input
                type="text"
                required
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cliente *
            </label>
            {clientes.length > 0 ? (
              <div className="space-y-1.5">
                <select
                  onChange={handleClienteSelect}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Seleccionar o escribir nuevo --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.telefono ? `(${c.telefono})` : ""}
                    </option>
                  ))}
                </select>
                <Input
                  type="text"
                  required
                  placeholder="Nombre cliente"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                />
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

          {/* Selector de Obra si el plan tiene obras */}
          {puede("obras") && proyectos.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Asociar a {terminos.trabajo} (opcional)
              </label>
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Sin obra asociada --</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titulo} ({p.cliente_nombre})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Líneas de Albarán */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Materiales o conceptos entregados ({lineas.length})
              </label>
              <button
                type="button"
                onClick={handleAddLinea}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Añadir línea
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {lineas.map((linea, idx) => (
                <div key={linea.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Descripción (ej: Plato ducha pizarra 120x80)"
                    value={linea.descripcion}
                    onChange={(e) =>
                      handleUpdateLinea(linea.id, "descripcion", e.target.value)
                    }
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={linea.cantidad}
                    onChange={(e) =>
                      handleUpdateLinea(linea.id, "cantidad", Number(e.target.value))
                    }
                    className="w-16 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2 text-xs text-center font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <select
                    value={linea.unidad}
                    onChange={(e) =>
                      handleUpdateLinea(linea.id, "unidad", e.target.value)
                    }
                    className="w-16 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-1.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ud">ud</option>
                    <option value="m²">m²</option>
                    <option value="ml">ml</option>
                    <option value="kg">kg</option>
                    <option value="pa">pa</option>
                  </select>
                  {lineas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLinea(linea.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Material descargado a pie de obra en garaje con precinto intacto."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              disabled={guardando || !numero.trim() || !clienteNombre.trim()}
              className="text-white font-bold"
              style={{ backgroundColor: empresa.colorPrimario }}
            >
              {guardando ? "Guardando..." : "Emitir Albarán"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
