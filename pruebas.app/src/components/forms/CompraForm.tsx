"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { api, GREMIOS, ListaCompra, Proyecto } from "@/lib/supabase";
import { useAppConfig } from "@/config/context";

interface CompraFormProps {
  proyectos: Proyecto[];
  initialProyectoId?: string;
  onSuccess: (compra: ListaCompra) => void;
  onCancel?: () => void;
}

export function CompraForm({
  proyectos,
  initialProyectoId,
  onSuccess,
  onCancel,
}: CompraFormProps) {
  const { oficio, puede } = useAppConfig();

  const proveedores: string[] = React.useMemo(() => {
    const lista = oficio.proveedoresSugeridos || [];
    return [...lista, "Otro"];
  }, [oficio]);

  const gremios: string[] = React.useMemo(() => {
    const lista = oficio.gremios || [];
    return lista.length > 0 ? [...lista] : [...GREMIOS];
  }, [oficio]);

  const [proyectoId, setProyectoId] = React.useState(initialProyectoId || "");
  const [material, setMaterial] = React.useState("");
  const [proveedor, setProveedor] = React.useState<string>(proveedores[0] || "Obramat / Bricomart");
  const [gremio, setGremio] = React.useState<string>(gremios[0] || "Albañilería");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (proveedores.length > 0 && !proveedores.includes(proveedor)) {
      setProveedor(proveedores[0]);
    }
    if (gremios.length > 0 && !gremios.includes(gremio)) {
      setGremio(gremios[0]);
    }
  }, [oficio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material.trim()) {
      setError("Debes indicar el material a comprar.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nueva = await api.addCompra({
        proyecto_id: puede("obras") && proyectoId ? proyectoId : null,
        material: material.trim(),
        proveedor,
        gremio,
        comprado: false,
      });
      onSuccess(nueva);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al guardar en la lista de compras.");
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
            Obra / Trabajo asignado (opcional)
          </label>
          <select
            className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={proyectoId}
            onChange={(e) => setProyectoId(e.target.value)}
          >
            <option value="">-- Compra general / Sin obra asociada --</option>
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
            Material / Herramienta *
          </label>
          <span className="text-[11px] text-orange-600 font-bold">¡Pulsa el micro para dictar!</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ej. 2 sacos de mortero y rodillo"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="flex h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            required
          />
          <VoiceInput
            size="icon"
            onTranscript={(texto) => {
              setMaterial((prev) => (prev ? `${prev}, ${texto}` : texto));
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Proveedor / Tienda *
          </label>
          <select
            className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
          >
            {proveedores.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Gremio / Especialidad
          </label>
          <select
            className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={gremio}
            onChange={(e) => setGremio(e.target.value)}
          >
            {gremios.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="w-1/3" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="orange" className={onCancel ? "w-2/3" : "w-full"} disabled={loading}>
          {loading ? "Guardando..." : "Añadir a la Lista"}
        </Button>
      </div>
    </form>
  );
}
