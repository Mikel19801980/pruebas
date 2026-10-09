"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { api, EstadoProyecto, Proyecto } from "@/lib/supabase";
import { useAppConfig } from "@/config/context";

interface ProyectoFormProps {
  onSuccess: (proyecto: Proyecto) => void;
  onCancel?: () => void;
}

export function ProyectoForm({ onSuccess, onCancel }: ProyectoFormProps) {
  const { terminos, empresa } = useAppConfig();
  const [titulo, setTitulo] = React.useState("");
  const [clienteNombre, setClienteNombre] = React.useState("");
  const [clienteTelefono, setClienteTelefono] = React.useState("");
  const [estado, setEstado] = React.useState<EstadoProyecto>("En curso");
  const [fechaInicio, setFechaInicio] = React.useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !clienteNombre.trim()) {
      setError("El título de la obra y el nombre del cliente son obligatorios.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nuevo = await api.createProyecto({
        titulo: titulo.trim(),
        cliente_nombre: clienteNombre.trim(),
        cliente_telefono: clienteTelefono.trim() || null,
        estado,
        fecha_inicio: fechaInicio,
      });
      onSuccess(nuevo);
    } catch (err: any) {
      console.error(err);
      setError("Error guardando el proyecto. Intenta de nuevo.");
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

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Título de {terminos.trabajo} *
          </label>
          <span className="text-[11px] text-orange-600 font-bold">¡Dicta o escribe!</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={`Ej. ${terminos.trabajo} Calle Mayor`}
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
        <Input
          label="Nombre del Cliente *"
          placeholder="Ej. Juan Pérez"
          value={clienteNombre}
          onChange={(e) => setClienteNombre(e.target.value)}
          required
        />
        <Input
          label="Teléfono WhatsApp"
          placeholder="Ej. 654321987"
          type="tel"
          value={clienteTelefono}
          onChange={(e) => setClienteTelefono(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Estado de {terminos.trabajo} *
          </label>
          <select
            className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoProyecto)}
          >
            <option value="En curso">En curso</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Terminado">Terminado</option>
          </select>
        </div>

        <Input
          label="Fecha de Inicio *"
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="w-1/3" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          className={onCancel ? "w-2/3 text-white font-bold" : "w-full text-white font-bold"}
          style={{ backgroundColor: empresa.colorPrimario }}
          disabled={loading}
        >
          {loading ? "Guardando..." : `Guardar ${terminos.trabajo}`}
        </Button>
      </div>
    </form>
  );
}
