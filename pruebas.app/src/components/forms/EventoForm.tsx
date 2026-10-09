"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { api, EventoAgenda, Proyecto, TipoEvento } from "@/lib/supabase";
import { getLocalDatetimeInputValue, parseDateTimeInZone } from "@/lib/utils";
import { useAppConfig } from "@/config/context";

interface EventoFormProps {
  proyectos: Proyecto[];
  eventoExistente?: EventoAgenda;
  onSuccess: (evento: EventoAgenda) => void;
  onCancel?: () => void;
}

export function EventoForm({ proyectos, eventoExistente, onSuccess, onCancel }: EventoFormProps) {
  const { oficio, terminos, puede } = useAppConfig();

  const [proyectoId, setProyectoId] = React.useState(eventoExistente?.proyecto_id || "");
  const [titulo, setTitulo] = React.useState(eventoExistente?.titulo || "");
  const [tipo, setTipo] = React.useState<TipoEvento>(eventoExistente?.tipo || "Trabajo");
  const [gremio, setGremio] = React.useState(
    eventoExistente?.gremio || oficio.gremios[0] || "General"
  );

  // Inicializar con la hora local real de empresa (ej. próxima hora en punto) sin desfasaje UTC
  const [fechaHora, setFechaHora] = React.useState<string>(() => {
    if (eventoExistente?.fecha_hora) {
      return getLocalDatetimeInputValue(new Date(eventoExistente.fecha_hora));
    }
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return getLocalDatetimeInputValue(d);
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Si cambia el oficio y el gremio seleccionado no pertenece a la nueva lista, reasignar
  React.useEffect(() => {
    if (!eventoExistente && oficio.gremios.length > 0 && !oficio.gremios.includes(gremio)) {
      setGremio(oficio.gremios[0]);
    }
  }, [oficio, gremio, eventoExistente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("El título del trabajo o visita es obligatorio.");
      return;
    }
    if (!fechaHora) {
      setError("Debes indicar fecha y hora para la cita.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const isoFechaHora = parseDateTimeInZone(fechaHora);
      const finalProyectoId = (puede("obras") && proyectoId) ? proyectoId : null;

      if (eventoExistente) {
        await api.updateEvento(eventoExistente.id, {
          proyecto_id: finalProyectoId,
          titulo: titulo.trim(),
          fecha_hora: isoFechaHora,
          tipo,
          gremio,
        });
        onSuccess({
          ...eventoExistente,
          proyecto_id: finalProyectoId,
          titulo: titulo.trim(),
          fecha_hora: isoFechaHora,
          tipo,
          gremio,
        });
      } else {
        const nuevo = await api.addEvento({
          proyecto_id: finalProyectoId,
          titulo: titulo.trim(),
          fecha_hora: isoFechaHora,
          tipo,
          gremio,
        });
        onSuccess(nuevo);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al guardar el evento en la agenda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
        </div>
      )}

      {puede("obras") && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {terminos.trabajo} asignado (opcional)
          </label>
          <select
            className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 font-medium"
            value={proyectoId}
            onChange={(e) => setProyectoId(e.target.value)}
          >
            <option value="">-- Cita independiente / Visita previa (Sin obra) --</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo} ({p.cliente_nombre})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Título del Trabajo o Visita *
          </label>
          <span className="text-[11px] text-orange-600 font-bold">¡Dicta o escribe!</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ej. Revisión de instalación y medición de baño"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="flex h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            required
          />
          <VoiceInput
            size="icon"
            onTranscript={(texto) => {
              setTitulo((prev) => (prev ? `${prev} ${texto}` : texto));
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Tipo de Evento *
          </label>
          <select
            className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 font-medium"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoEvento)}
          >
            <option value="Trabajo">Trabajo en Obra</option>
            <option value="Visita">Visita / Medición</option>
            <option value="Reunión">Reunión con Cliente</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {terminos.gremios} ({oficio.nombre}) *
          </label>
          <select
            className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 font-medium"
            value={gremio}
            onChange={(e) => setGremio(e.target.value)}
          >
            {oficio.gremios.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Fecha y Hora (Hora Local) *"
        type="datetime-local"
        value={fechaHora}
        onChange={(e) => setFechaHora(e.target.value)}
        required
      />

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="w-1/3" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="orange" className={onCancel ? "w-2/3" : "w-full"} disabled={loading}>
          {loading ? "Guardando..." : eventoExistente ? "Actualizar Cita" : "Guardar en Agenda"}
        </Button>
      </div>
    </form>
  );
}
