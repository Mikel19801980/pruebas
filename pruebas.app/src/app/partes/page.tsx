"use client";

import * as React from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  User,
  Clock,
  Package,
  Camera,
  CheckCircle2,
  Clock4,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { api, ParteTrabajo, Proyecto } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { useAppConfig } from "@/config/context";

export default function PartesTrabajoPage() {
  const { puede, terminos, empresa } = useAppConfig();
  const [partes, setPartes] = React.useState<ParteTrabajo[]>([]);
  const [proyectos, setProyectos] = React.useState<Proyecto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busqueda, setBusqueda] = React.useState("");

  // Modal nuevo parte
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [autorNombre, setAutorNombre] = React.useState("");
  const [trabajoOCliente, setTrabajoOCliente] = React.useState("");
  const [fecha, setFecha] = React.useState(new Date().toISOString().slice(0, 10));
  const [queSeHizo, setQueSeHizo] = React.useState("");
  const [horasTexto, setHorasTexto] = React.useState("");
  const [materialesTexto, setMaterialesTexto] = React.useState("");
  const [fotos, setFotos] = React.useState<string[]>([]);
  const [terminado, setTerminado] = React.useState(false);
  const [subiendoFoto, setSubiendoFoto] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [partesData, projsData] = await Promise.all([
        api.getPartesTrabajo(),
        puede("obras") ? api.getProyectos() : Promise.resolve([]),
      ]);
      setPartes(partesData);
      setProyectos(projsData);
    } catch (e) {
      console.error("Error cargando partes:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [puede]);

  const abrirNuevoParte = () => {
    setAutorNombre("");
    setTrabajoOCliente(proyectos[0]?.titulo || "");
    setFecha(new Date().toISOString().slice(0, 10));
    setQueSeHizo("");
    setHorasTexto("");
    setMaterialesTexto("");
    setFotos([]);
    setTerminado(false);
    setIsModalOpen(true);
  };

  const handleSubirFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setSubiendoFoto(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await api.uploadFoto(file);
        urls.push(url);
      }
      setFotos((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error("Error subiendo foto:", err);
    } finally {
      setSubiendoFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCrearParte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autorNombre.trim() || !queSeHizo.trim() || !trabajoOCliente.trim()) return;
    setGuardando(true);
    try {
      await api.createParteTrabajo({
        autor_nombre: autorNombre.trim(),
        trabajo_o_cliente: trabajoOCliente.trim(),
        fecha,
        que_se_hizo: queSeHizo.trim(),
        horas_texto: horasTexto.trim() || null,
        materiales_texto: materialesTexto.trim() || null,
        fotos,
        terminado,
      });
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error("Error creando parte:", err);
      alert(`Error al guardar el parte: ${err?.message || "Revisa la base de datos o conexión"}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarParte = async (id: string) => {
    if (!confirm("¿Eliminar este parte de trabajo?")) return;
    try {
      await api.deleteParteTrabajo(id);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrado
  const partesFiltrados = partes.filter((p) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      p.autor_nombre.toLowerCase().includes(q) ||
      p.trabajo_o_cliente.toLowerCase().includes(q) ||
      p.que_se_hizo.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      {/* Cabecera */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Partes de Trabajo
            </h1>
            <Badge variant="outline" className="border-purple-500/30 text-purple-600 dark:text-purple-400">
              {partes.length} parte{partes.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reporte diario de los operarios a pie de obra: qué se hizo, fotos y estado
          </p>
        </div>

        <Button
          onClick={abrirNuevoParte}
          className="shadow-md text-white font-bold"
          style={{ backgroundColor: empresa.colorPrimario }}
        >
          <Plus className="mr-2 h-4 w-4 stroke-[3]" />
          Nuevo Parte
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por operario, trabajo o lo que se hizo..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
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

      {/* Lista de Partes */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : partesFiltrados.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            {busqueda ? "No hay partes que coincidan" : "No tienes partes de trabajo registrados"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {busqueda
              ? "Prueba a buscar con otro término."
              : "Tus trabajadores o tú podéis apuntar en segundos qué se hizo cada día con fotos."}
          </p>
          {!busqueda && (
            <Button
              onClick={abrirNuevoParte}
              className="mt-4 text-white font-bold"
              style={{ backgroundColor: empresa.colorPrimario }}
            >
              <Plus className="mr-2 h-4 w-4 stroke-[3]" />
              Crear primer parte
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {partesFiltrados.map((parte) => (
            <Card
              key={parte.id}
              className="overflow-hidden border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-md flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {parte.autor_nombre}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(parte.fecha)}
                      </span>
                    </div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white mt-1">
                      {parte.trabajo_o_cliente}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    {parte.terminado ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Terminado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                        <Clock4 className="h-3 w-3" />
                        En curso
                      </span>
                    )}
                    <button
                      onClick={() => handleEliminarParte(parte.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                      title="Eliminar parte"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Qué se hizo */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {parte.que_se_hizo}
                </div>

                {/* Horas y Materiales */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {parte.horas_texto && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {parte.horas_texto}
                    </span>
                  )}
                  {parte.materiales_texto && (
                    <span className="flex items-center gap-1 truncate">
                      <Package className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{parte.materiales_texto}</span>
                    </span>
                  )}
                </div>

                {/* Fotos del parte */}
                {parte.fotos && parte.fotos.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pt-1">
                    {parte.fotos.map((url, i) => (
                      <div
                        key={i}
                        className="h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100"
                      >
                        <img src={url} alt="Foto parte" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Nuevo Parte de Trabajo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Parte de Trabajo"
        description="Reporte rápido diario desde el móvil para registrar lo realizado y fotos."
      >
        <form onSubmit={handleCrearParte} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ¿Quién lo realiza? *
              </label>
              <Input
                type="text"
                required
                placeholder="Ej: Manolo (Oficial)"
                value={autorNombre}
                onChange={(e) => setAutorNombre(e.target.value)}
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
              {terminos.trabajo} o Cliente *
            </label>
            {proyectos.length > 0 ? (
              <div className="space-y-1.5">
                <select
                  onChange={(e) => {
                    const proj = proyectos.find((p) => p.id === e.target.value);
                    if (proj) setTrabajoOCliente(proj.titulo);
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Seleccionar de la lista o escribir abajo --</option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo} ({p.cliente_nombre})
                    </option>
                  ))}
                </select>
                <Input
                  type="text"
                  required
                  placeholder="Ej: Reforma Baño Carlos / Avería en cuadro"
                  value={trabajoOCliente}
                  onChange={(e) => setTrabajoOCliente(e.target.value)}
                />
              </div>
            ) : (
              <Input
                type="text"
                required
                placeholder="Ej: Reforma Baño Carlos / Avería en cuadro"
                value={trabajoOCliente}
                onChange={(e) => setTrabajoOCliente(e.target.value)}
              />
            )}
          </div>

          {/* Qué se ha hecho con Dictado de voz */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                ¿Qué se ha hecho hoy? *
              </label>
              <VoiceInput
                onTranscript={(text) =>
                  setQueSeHizo((prev) => (prev ? `${prev} ${text}` : text))
                }
                size="sm"
                buttonText="Dictar por voz"
              />
            </div>
            <textarea
              rows={3}
              required
              value={queSeHizo}
              onChange={(e) => setQueSeHizo(e.target.value)}
              placeholder="Ej: Picado de azulejo antiguo, desescombro completo y bajada a contenedor. Rozas de fontanería replanteadas."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tiempo invertido (opcional)
              </label>
              <Input
                type="text"
                placeholder="Ej: 7h / Media jornada"
                value={horasTexto}
                onChange={(e) => setHorasTexto(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Materiales usados (opcional)
              </label>
              <Input
                type="text"
                placeholder="Ej: 3 sacos yeso, 1 sifón"
                value={materialesTexto}
                onChange={(e) => setMaterialesTexto(e.target.value)}
              />
            </div>
          </div>

          {/* Fotos del parte */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Fotos del avance ({fotos.length})
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={subiendoFoto}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-xs font-bold hover:bg-purple-100 transition-colors"
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

            {fotos.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                {fotos.map((url, i) => (
                  <div key={i} className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border">
                    <img src={url} alt="Foto" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 text-white rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkbox Terminado */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="terminado"
              checked={terminado}
              onChange={(e) => setTerminado(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="terminado" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              ¿Trabajo completamente terminado y listo para entrega?
            </label>
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
              disabled={guardando || !autorNombre.trim() || !queSeHizo.trim()}
              className="text-white font-bold"
              style={{ backgroundColor: empresa.colorPrimario }}
            >
              {guardando ? "Guardando..." : "Guardar Parte"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
