"use client";

import * as React from "react";
import { Camera, Loader2, Image as ImageIcon, Calculator, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { api, GREMIOS, PartidaPresupuesto, UNIDADES_MEDICION } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { useAppConfig } from "@/config/context";

interface PartidaFormProps {
  presupuestoId: string;
  onSuccess: (partida: PartidaPresupuesto) => void;
  onCancel?: () => void;
}

export function PartidaForm({ presupuestoId, onSuccess, onCancel }: PartidaFormProps) {
  const { oficio, preferencias, terminos, empresa } = useAppConfig();
  const [concepto, setConcepto] = React.useState("");
  const [gremio, setGremio] = React.useState<string>(oficio.gremios[0] || "General");

  // Modo de cálculo: 'medicion' (ej. 52 m2 x 20 €) o 'alzado' (precio cerrado)
  const [modoCalculo, setModoCalculo] = React.useState<"medicion" | "alzado">("medicion");
  const [cantidad, setCantidad] = React.useState<string>("1");
  const [unidad, setUnidad] = React.useState<string>("m²");
  const [precioUnitario, setPrecioUnitario] = React.useState<string>("");
  const [precioTotal, setPrecioTotal] = React.useState<string>("");

  const [esFotoEstado, setEsFotoEstado] = React.useState(false);
  const [fotoUrl, setFotoUrl] = React.useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Recalcular total cuando cambian cantidad o precio unitario
  const handleCantidadChange = (val: string) => {
    setCantidad(val);
    const cantNum = parseFloat(val);
    const puNum = parseFloat(precioUnitario);
    if (!isNaN(cantNum) && !isNaN(puNum)) {
      setPrecioTotal((cantNum * puNum).toFixed(2));
    }
  };

  const handlePrecioUnitarioChange = (val: string) => {
    setPrecioUnitario(val);
    const cantNum = parseFloat(cantidad);
    const puNum = parseFloat(val);
    if (!isNaN(cantNum) && !isNaN(puNum)) {
      setPrecioTotal((cantNum * puNum).toFixed(2));
    }
  };

  const handlePrecioTotalChange = (val: string) => {
    setPrecioTotal(val);
    const totNum = parseFloat(val);
    const cantNum = parseFloat(cantidad);
    if (!isNaN(totNum) && !isNaN(cantNum) && cantNum > 0) {
      setPrecioUnitario((totNum / cantNum).toFixed(2));
    }
  };

  const handleCaptureFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const url = await api.uploadFoto(file);
      setFotoUrl(url);
      setEsFotoEstado(true);
      if (!concepto.trim()) {
        setConcepto(`Foto estado actual (${new Date().toLocaleDateString("es-ES")})`);
      }
    } catch (err) {
      console.error(err);
      alert("Error subiendo foto");
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim()) {
      setError("El concepto de la partida es obligatorio.");
      return;
    }

    let cantNum = parseFloat(cantidad) || 1;
    let puNum = parseFloat(precioUnitario) || 0;
    let totNum = parseFloat(precioTotal) || 0;

    if (esFotoEstado || fotoUrl) {
      totNum = 0;
      puNum = 0;
    } else {
      if (totNum <= 0) {
        setError("El precio total de la partida debe ser mayor que cero.");
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      const nueva = await api.addPartida({
        presupuesto_id: presupuestoId,
        concepto: concepto.trim(),
        gremio,
        cantidad: esFotoEstado ? undefined : cantNum,
        unidad: esFotoEstado ? undefined : unidad,
        precio_unitario: esFotoEstado ? undefined : puNum,
        precio: totNum,
        foto_url: fotoUrl,
      });
      onSuccess(nueva);
    } catch (err) {
      console.error(err);
      setError("Error al guardar la partida.");
    } finally {
      setSubmitting(false);
    }
  };

  const calculoValido = !isNaN(parseFloat(cantidad)) && !isNaN(parseFloat(precioUnitario)) && parseFloat(cantidad) > 0 && parseFloat(precioUnitario) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Sugerencias rápidas por oficio */}
      {oficio.partidasSugeridas.length > 0 && (
        <div className="space-y-1.5 p-3 rounded-2xl bg-orange-50/50 dark:bg-slate-800/80 border border-orange-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Partidas frecuentes ({oficio.nombre}):</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {oficio.partidasSugeridas.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setConcepto(item.concepto);
                  setGremio(item.gremio);
                  setUnidad(item.unidad);
                  if (item.precio_unitario > 0) {
                    setPrecioUnitario(item.precio_unitario.toString());
                    const c = parseFloat(cantidad) || 1;
                    setPrecioTotal((c * item.precio_unitario).toFixed(2));
                  } else {
                    setPrecioUnitario("");
                    setPrecioTotal("");
                  }
                  setModoCalculo("medicion");
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-orange-500 font-medium text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {item.concepto.length > 35 ? `${item.concepto.slice(0, 35)}...` : item.concepto}{" "}
                <strong className="text-orange-600 font-bold">
                  ({item.precio_unitario > 0 ? `${item.precio_unitario}€/` : ""}{item.unidad})
                </strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gremio / Especialidad */}
      {preferencias.mostrarSelectorGremios && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {terminos.gremios} *
          </label>
          <select
            className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
      )}

      {/* Concepto / Trabajo con Dictado por Voz */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Descripción / Trabajo a realizar *
          </label>
          <span className="text-[11px] text-orange-600 font-bold">¡Dicta o escribe!</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ej. Alicatado porcelánico en paredes, pasta y enlechado"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="flex h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            required
          />
          <VoiceInput
            size="icon"
            onTranscript={(texto) => {
              setConcepto((prev) => (prev ? `${prev} ${texto}` : texto));
            }}
          />
        </div>
      </div>

      {/* Selector de modo: Por Medición (52 m2 x 20 €) o Precio Alzado */}
      {!esFotoEstado && (
        <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-orange-600" />
              Cálculo Económico
            </span>
            <div className="flex gap-1 p-0.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setModoCalculo("medicion")}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  modoCalculo === "medicion"
                    ? "bg-white text-orange-600 shadow-xs dark:bg-slate-900 dark:text-orange-400"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Por Medición (m², ml, ud...)
              </button>
              <button
                type="button"
                onClick={() => setModoCalculo("alzado")}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  modoCalculo === "alzado"
                    ? "bg-white text-orange-600 shadow-xs dark:bg-slate-900 dark:text-orange-400"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Precio Alzado
              </button>
            </div>
          </div>

          {modoCalculo === "medicion" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {/* Cantidad / Medición */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Cantidad / Medición *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej. 52"
                    value={cantidad}
                    onChange={(e) => handleCantidadChange(e.target.value)}
                    className="mt-1 flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                {/* Unidad */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Unidad *
                  </label>
                  <select
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value)}
                    className="mt-1 flex h-11 w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {oficio.unidadesSugeridas.map((u) => (
                      <option key={u.valor} value={u.valor}>
                        {u.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Precio Unitario */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Precio Unitario (€) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej. 20.00"
                    value={precioUnitario}
                    onChange={(e) => handlePrecioUnitarioChange(e.target.value)}
                    className="mt-1 flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              {/* Resultado visual en tiempo real */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-100/70 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
                <div className="text-xs text-orange-950 dark:text-orange-200 font-medium">
                  {calculoValido ? (
                    <span>
                      {cantidad} {unidad} × {formatCurrency(parseFloat(precioUnitario))} /{unidad}
                    </span>
                  ) : (
                    <span>Introduce cantidad y precio unitario</span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-orange-800 dark:text-orange-300 uppercase block font-bold">
                    Total Partida
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                    {formatCurrency(parseFloat(precioTotal) || 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Precio Total Cerrado (€) *
              </label>
              <Input
                placeholder="Ej. 1040.00"
                type="number"
                step="0.01"
                value={precioTotal}
                onChange={(e) => handlePrecioTotalChange(e.target.value)}
                required
              />
            </div>
          )}
        </div>
      )}

      {/* Casilla de Foto Documental (Sin coste) */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={esFotoEstado}
            onChange={(e) => {
              setEsFotoEstado(e.target.checked);
              if (e.target.checked) {
                setPrecioTotal("0");
                setPrecioUnitario("0");
              }
            }}
            className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="font-medium">Es solo fotografía documental del estado actual (Sin coste económico)</span>
        </label>
      </div>

      {/* Adjuntar foto con cámara trasera */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Foto del estado actual (Cámara trasera)
        </label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          className="hidden"
          onChange={handleCaptureFoto}
        />
        <div className="mt-2 flex items-center gap-3">
          {fotoUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
              <img src={fotoUrl} alt="Preview" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400 dark:border-slate-700">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 cursor-pointer bg-white"
            disabled={uploadingFoto}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingFoto ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Subiendo foto...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 text-orange-600" />
                {fotoUrl ? "Cambiar Foto" : "Hacer Foto con Cámara"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="w-1/3" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="orange" className={onCancel ? "w-2/3" : "w-full"} disabled={submitting}>
          {submitting ? "Guardando..." : "Guardar Partida"}
        </Button>
      </div>
    </form>
  );
}
