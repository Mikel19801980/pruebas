"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Truck,
  Clock,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Edit2,
  Trash2,
} from "lucide-react";
import { api, EventoAgenda, Proyecto } from "@/lib/supabase";
import { formatDateTime, formatDate, getGremioBadgeClasses, getLocalDateString } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { EventoForm } from "@/components/forms/EventoForm";
import { useAppConfig } from "@/config/context";

export default function AgendaPage() {
  const { oficio, terminos, puede } = useAppConfig();
  const [eventos, setEventos] = React.useState<EventoAgenda[]>([]);
  const [proyectos, setProyectos] = React.useState<Proyecto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorCarga, setErrorCarga] = React.useState<string | null>(null);
  const [modalNuevo, setModalNuevo] = React.useState(false);
  const [eventoEnEdicion, setEventoEnEdicion] = React.useState<EventoAgenda | null>(null);

  // Fecha seleccionada en hora local (por defecto hoy)
  const [fechaSeleccionada, setFechaSeleccionada] = React.useState<string>(() =>
    getLocalDateString()
  );
  const [filtroGremio, setFiltroGremio] = React.useState<string>("Todos");

  const fetchData = async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const [evList, projs] = await Promise.all([api.getEventos(), api.getProyectos()]);
      setEventos(evList);
      setProyectos(projs);
    } catch (e: any) {
      console.error(e);
      setErrorCarga(e?.message || "No se pudo conectar con el servidor para cargar la agenda.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const moverDia = (dias: number) => {
    const [y, m, d] = fechaSeleccionada.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d + dias, 12, 0, 0));
    setFechaSeleccionada(getLocalDateString(dateObj));
  };

  // Filtrar eventos por fecha seleccionada usando fecha local real del evento (sin desfase UTC)
  const eventosDelDia = eventos.filter((e) => {
    const diaEvento = getLocalDateString(e.fecha_hora);
    const coincideDia = diaEvento === fechaSeleccionada;
    if (filtroGremio === "Todos") return coincideDia;
    return coincideDia && e.gremio === filtroGremio;
  });

  const proximosEventos = eventos
    .filter((e) => new Date(e.fecha_hora) >= new Date())
    .slice(0, 8);

  // Gremios del día para cargar la furgoneta
  const gremiosDelDia = Array.from(new Set(eventosDelDia.map((e) => e.gremio || "General")));

  const sugerenciaFurgoneta = React.useMemo(() => {
    if (gremiosDelDia.length === 0) return "Día libre o sin intervenciones programadas.";

    const recomendaciones: string[] = [];
    if (gremiosDelDia.includes("Fontanería")) {
      recomendaciones.push("Fontanería: Cargar soplete, mordaza, tenazas prensadoras, teflón y cortatubos");
    }
    if (gremiosDelDia.includes("Albañilería")) {
      recomendaciones.push("Albañilería: Cargar gavetas, llaguero, paleta, nivel láser y batidor");
    }
    if (gremiosDelDia.includes("Pladur")) {
      recomendaciones.push("Pladur: Cargar atornillador pladur, regla, cinta de juntas, pasta y cúter");
    }
    if (gremiosDelDia.includes("Cerrajería")) {
      recomendaciones.push("Cerrajería: Cargar radial grande/chica, brocas cobalto y equipo de soldar");
    }
    if (gremiosDelDia.includes("Electricidad") || oficio.id === "electricidad") {
      recomendaciones.push("Electricidad: Cargar polímetro, comprobador de tensión, pelacables, guía pasacables y destornilladores aislados 1000V");
    }
    if (gremiosDelDia.includes("Pintura")) {
      recomendaciones.push("Pintura: Cargar rodillos, brochas, alargador, plásticos protectores y cinta carrocero");
    }
    if (gremiosDelDia.includes("Climatización") || oficio.id === "climatizacion") {
      recomendaciones.push("Climatización: Cargar manómetros, bomba de vacío, abocardador y báscula de gas");
    }
    return recomendaciones.length > 0
      ? recomendaciones.join(" • ")
      : `Especialidades del día: ${gremiosDelDia.join(", ")}. Preparar herramientas correspondientes.`;
  }, [gremiosDelDia, oficio.id]);

  const handleEditarEvento = (evento: EventoAgenda) => {
    setEventoEnEdicion(evento);
    setModalNuevo(true);
  };

  const handleEliminarEvento = async (id: string, tit: string) => {
    if (!confirm(`¿Cancelar la cita "${tit}" de la agenda?`)) return;
    try {
      await api.deleteEvento(id);
      setEventos((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(`Error al cancelar cita: ${err?.message || "Error desconocido"}`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarIcon className="h-7 w-7 text-orange-600" />
            Agenda de {terminos.trabajos} & Visitas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bloques organizados por hora local y especialidad para preparar las herramientas
          </p>
        </div>

        <Button
          variant="orange"
          onClick={() => {
            setEventoEnEdicion(null);
            setModalNuevo(true);
          }}
          className="gap-2 self-start sm:self-auto shadow-md"
        >
          <Plus className="h-5 w-5" />
          Añadir a Agenda
        </Button>
      </div>

      {/* BLOQUE ESPECIAL: CARGA DE FURGONETA */}
      <div className="rounded-2xl border-2 border-orange-500/40 bg-gradient-to-r from-orange-50 to-amber-50 p-4 dark:from-orange-950/30 dark:to-slate-900 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-md shadow-orange-600/30">
            <Truck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>Qué cargar en la furgoneta para este día</span>
              {gremiosDelDia.map((g) => (
                <span
                  key={g}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getGremioBadgeClasses(g)}`}
                >
                  {g}
                </span>
              ))}
            </h3>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {sugerenciaFurgoneta}
            </p>
          </div>
        </div>
      </div>

      {/* NAVEGADOR DE DÍAS Y FILTROS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => moverDia(-1)} className="h-10 w-10">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="h-10 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />

          <Button variant="outline" size="icon" onClick={() => moverDia(1)} className="h-10 w-10">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFechaSeleccionada(getLocalDateString())}
            className="h-10 text-xs font-bold"
          >
            Hoy
          </Button>
        </div>

        {/* Filtro por Gremio dinámico según oficio */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">{terminos.gremios}:</span>
          <select
            value={filtroGremio}
            onChange={(e) => setFiltroGremio(e.target.value)}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="Todos">Todos</option>
            {oficio.gremios.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* EVENTOS DEL DÍA SELECCIONADO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Intervenciones del {formatDate(fechaSeleccionada)}</span>
            <Badge variant="secondary">{eventosDelDia.length} programadas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">Cargando agenda...</p>
          ) : eventosDelDia.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-xs text-slate-500">
                No tienes trabajos ni visitas programadas para este día.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEventoEnEdicion(null);
                  setModalNuevo(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Programar Intervención
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {eventosDelDia.map((evento) => {
                const obra = proyectos.find((p) => p.id === evento.proyecto_id);
                return (
                  <div
                    key={evento.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-orange-500 transition-all gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {/* Bloque de color por Gremio */}
                      <div
                        className={`h-12 w-2 rounded-full shrink-0 ${
                          evento.gremio === "Fontanería"
                            ? "bg-blue-600"
                            : evento.gremio === "Albañilería"
                            ? "bg-amber-600"
                            : evento.gremio === "Pladur"
                            ? "bg-yellow-500"
                            : evento.gremio === "Cerrajería"
                            ? "bg-slate-700"
                            : evento.gremio === "Electricidad"
                            ? "bg-emerald-600"
                            : "bg-purple-600"
                        }`}
                      />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${getGremioBadgeClasses(
                              evento.gremio || "General"
                            )}`}
                          >
                            {evento.gremio || "General"}
                          </span>
                          <Badge variant="outline">{evento.tipo}</Badge>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {evento.titulo}
                        </h4>
                        {obra && puede("obras") && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            <FolderKanban className="h-3.5 w-3.5 text-orange-600" />
                            {obra.titulo} ({obra.cliente_nombre})
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        <Clock className="h-4 w-4 text-orange-600" />
                        {formatDateTime(evento.fecha_hora)}
                      </div>

                      {/* Botones de acción: Editar y Cancelar */}
                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                        <button
                          type="button"
                          onClick={() => handleEditarEvento(evento)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar cita"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarEvento(evento.id, evento.titulo)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Cancelar cita"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PRÓXIMAS INTERVENCIONES DE LA SEMANA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos días en el calendario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {proximosEventos.map((ev) => {
              const obra = proyectos.find((p) => p.id === ev.proyecto_id);
              return (
                <div
                  key={ev.id}
                  onClick={() => setFechaSeleccionada(getLocalDateString(ev.fecha_hora))}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 cursor-pointer transition-all space-y-1 bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`px-2 py-0.2 rounded font-bold border ${getGremioBadgeClasses(ev.gremio || "General")}`}>
                      {ev.gremio}
                    </span>
                    <span className="font-mono text-slate-500">{formatDateTime(ev.fecha_hora)}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {ev.titulo}
                  </p>
                  {puede("obras") && obra && (
                    <p className="text-[11px] text-slate-500 truncate">{obra.titulo}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal Nuevo / Editar Evento */}
      <Modal
        isOpen={modalNuevo}
        onClose={() => {
          setModalNuevo(false);
          setEventoEnEdicion(null);
        }}
        title={eventoEnEdicion ? "Modificar Cita en Agenda" : "Nueva Cita / Trabajo en Agenda"}
        description={
          eventoEnEdicion
            ? "Actualiza la fecha, hora, tipo o especialidad de la cita."
            : "Programa la intervención para saber qué herramientas preparar."
        }
      >
        <EventoForm
          proyectos={proyectos}
          eventoExistente={eventoEnEdicion || undefined}
          onSuccess={(ev) => {
            if (eventoEnEdicion) {
              setEventos((prev) => prev.map((e) => (e.id === ev.id ? ev : e)));
            } else {
              setEventos((prev) => [...prev, ev]);
            }
            setModalNuevo(false);
            setEventoEnEdicion(null);
          }}
          onCancel={() => {
            setModalNuevo(false);
            setEventoEnEdicion(null);
          }}
        />
      </Modal>
    </div>
  );
}
