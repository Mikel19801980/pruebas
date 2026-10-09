"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  Store,
  CheckCircle2,
  Trash2,
  Wrench,
  FolderKanban,
  Check,
} from "lucide-react";
import { api, ListaCompra, Proyecto, GREMIOS } from "@/lib/supabase";
import { getGremioBadgeClasses } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { useAppConfig } from "@/config/context";

function ComprasContent() {
  const searchParams = useSearchParams();
  const paramProyectoId = searchParams.get("proyecto_id") || "";
  const { oficio, terminos, empresa, puede } = useAppConfig();
  const [compras, setCompras] = React.useState<ListaCompra[]>([]);
  const [proyectos, setProyectos] = React.useState<Proyecto[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modo de agrupación
  const [modoVista, setModoVista] = React.useState<"proveedor" | "gremio" | "proyecto">("proveedor");
  const [filtroEstado, setFiltroEstado] = React.useState<"todos" | "pendientes" | "comprados">("pendientes");

  // Entrada rápida superior - Por defecto "" (Sin obra / Compra general) salvo que venga por URL
  const [nuevoMaterial, setNuevoMaterial] = React.useState("");
  const [selectedProyectoId, setSelectedProyectoId] = React.useState(paramProyectoId);
  const [selectedProveedor, setSelectedProveedor] = React.useState(oficio.proveedoresSugeridos[0] || "Almacén");
  const [selectedGremio, setSelectedGremio] = React.useState(oficio.gremios[0] || "General");
  const [isAdding, setIsAdding] = React.useState(false);
  const [errorCarga, setErrorCarga] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (paramProyectoId) {
      setSelectedProyectoId(paramProyectoId);
    }
  }, [paramProyectoId]);

  const fetchData = async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const [comprasList, projs] = await Promise.all([
        api.getCompras(),
        puede("obras") ? api.getProyectos() : Promise.resolve([]),
      ]);
      setCompras(comprasList);
      setProyectos(projs);
    } catch (err: any) {
      console.error(err);
      setErrorCarga(err?.message || "Error al conectar con la lista de compras");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleCrearRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMaterial.trim()) return;
    setIsAdding(true);
    try {
      const item = await api.addCompra({
        proyecto_id: selectedProyectoId ? selectedProyectoId : null,
        material: nuevoMaterial.trim(),
        proveedor: selectedProveedor,
        gremio: selectedGremio,
        comprado: false,
      });
      setCompras((prev) => [item, ...prev]);
      setNuevoMaterial("");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Error al añadir a la lista de compras");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (id: string, actual: boolean) => {
    await api.toggleCompra(id, !actual);
    setCompras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, comprado: !actual } : c))
    );
  };

  const handleEliminar = async (id: string) => {
    await api.deleteCompra(id);
    setCompras((prev) => prev.filter((c) => c.id !== id));
  };

  // Filtrado por estado (pendientes / comprados / todos)
  const comprasFiltradas = compras.filter((c) => {
    if (filtroEstado === "pendientes") return !c.comprado;
    if (filtroEstado === "comprados") return c.comprado;
    return true;
  });

  // Agrupación dinámica
  const grupos = React.useMemo(() => {
    const map: Record<string, ListaCompra[]> = {};

    comprasFiltradas.forEach((item) => {
      let clave = "";
      if (modoVista === "proveedor") {
        clave = item.proveedor || "Otros Proveedores";
      } else if (modoVista === "gremio") {
        clave = item.gremio || "General";
      } else {
        const proj = proyectos.find((p) => p.id === item.proyecto_id);
        clave = proj?.titulo || "Obra sin asignar";
      }

      if (!map[clave]) map[clave] = [];
      map[clave].push(item);
    });

    return map;
  }, [comprasFiltradas, modoVista, proyectos]);

  const totalPendientes = compras.filter((c) => !c.comprado).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShoppingCart className="h-7 w-7 text-orange-600" />
            Listas de Compra & Materiales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Optimiza tus viajes a los almacenes cruzando las necesidades de todas las obras activas
          </p>
        </div>

        <Badge variant={totalPendientes > 0 ? "orange" : "success"} className="text-sm py-1 px-3 self-start sm:self-auto font-mono">
          {totalPendientes} pendientes de compra
        </Badge>
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

      {/* BARRA DE ENTRADA RÁPIDA CON DICTADO POR VOZ */}
      <Card className="border-orange-500/40 bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-900 dark:to-orange-950/20 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-900 dark:text-white">
            <span>Apuntar Material (o Dictar a Pie de Obra)</span>
            <span className="text-[11px] font-normal text-orange-600 dark:text-orange-400">
              Usa el micrófono si tienes las manos ocupadas
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCrearRapido} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={oficio.id === "electricidad" ? "Ej. 10 magnetotérmicos 16A, tubo corrugado 20mm..." : "Ej. 5 sacos cemento cola, 2 codos PVC 40mm..."}
                value={nuevoMaterial}
                onChange={(e) => setNuevoMaterial(e.target.value)}
                className="flex h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                required
              />
              <VoiceInput
                size="icon"
                onTranscript={(dictado) => {
                  setNuevoMaterial((prev) => (prev ? `${prev}, ${dictado}` : dictado));
                }}
              />
            </div>

            <div className={`grid grid-cols-1 ${puede("obras") ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}>
              {puede("obras") && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{terminos.trabajo} (opcional)</label>
                  <select
                    className="mt-1 flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    value={selectedProyectoId}
                    onChange={(e) => setSelectedProyectoId(e.target.value)}
                  >
                    <option value="">-- Sin obra / Compra general --</option>
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Proveedor / Almacén</label>
                <select
                  className="mt-1 flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={selectedProveedor}
                  onChange={(e) => setSelectedProveedor(e.target.value)}
                >
                  {oficio.proveedoresSugeridos.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="Otro">Otro Almacén</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{terminos.gremios}</label>
                <div className="flex gap-2 mt-1">
                  <select
                    className="flex h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    value={selectedGremio}
                    onChange={(e) => setSelectedGremio(e.target.value)}
                  >
                    {oficio.gremios.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-11 px-4 text-white font-bold cursor-pointer"
                    style={{ backgroundColor: empresa.colorPrimario }}
                    disabled={isAdding}
                  >
                    <Check className="h-4 w-4 mr-1" /> Apuntar
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* PESTAÑAS DE AGRUPACIÓN Y FILTRADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Selector de Vista: Proveedor vs Gremio vs Proyecto */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          <button
            onClick={() => setModoVista("proveedor")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              modoVista === "proveedor"
                ? "bg-white text-orange-600 shadow-sm dark:bg-slate-900 dark:text-orange-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            Por Proveedor
          </button>

          <button
            onClick={() => setModoVista("gremio")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              modoVista === "gremio"
                ? "bg-white text-orange-600 shadow-sm dark:bg-slate-900 dark:text-orange-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            Por Gremio
          </button>

          {puede("obras") && (
            <button
              onClick={() => setModoVista("proyecto")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                modoVista === "proyecto"
                  ? "bg-white text-orange-600 shadow-sm dark:bg-slate-900 dark:text-orange-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <FolderKanban className="h-3.5 w-3.5" />
              Por {terminos.trabajo}
            </button>
          )}
        </div>

        {/* Filtro: Pendientes / Comprados / Todos */}
        <div className="flex items-center gap-1 text-xs">
          {(["pendientes", "comprados", "todos"] as const).map((filtro) => (
            <button
              key={filtro}
              onClick={() => setFiltroEstado(filtro)}
              className={`px-3 py-1.5 rounded-xl capitalize font-medium transition-colors cursor-pointer ${
                filtroEstado === filtro
                  ? "bg-slate-900 text-white dark:bg-orange-600"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {filtro}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO AGRUPADO */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Cargando listas de compra...</div>
      ) : Object.keys(grupos).length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-2">
          <p className="text-slate-500 text-sm font-medium">No hay materiales en esta sección.</p>
          <p className="text-xs text-slate-400">
            {filtroEstado === "pendientes"
              ? "¡Excelente! Has comprado todo lo que estaba pendiente."
              : "Añade nuevos materiales con la barra superior o dictando por voz."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grupos).map(([grupoTitulo, items]) => {
            const pendientesEnGrupo = items.filter((i) => !i.comprado).length;

            return (
              <Card key={grupoTitulo} className="overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 py-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {modoVista === "proveedor" && <Store className="h-5 w-5 text-orange-600" />}
                      {modoVista === "gremio" && <Wrench className="h-5 w-5 text-blue-600" />}
                      {modoVista === "proyecto" && <FolderKanban className="h-5 w-5 text-emerald-600" />}
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                        {grupoTitulo}
                      </CardTitle>
                    </div>
                    <Badge variant={pendientesEnGrupo > 0 ? "orange" : "secondary"}>
                      {pendientesEnGrupo} pendientes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => {
                    const obraAsociada = proyectos.find((p) => p.id === item.proyecto_id);

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-4 transition-colors ${
                          item.comprado
                            ? "bg-slate-50/50 dark:bg-slate-900/30 text-slate-400"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        <div
                          className="flex items-center gap-3.5 flex-1 cursor-pointer"
                          onClick={() => handleToggle(item.id, item.comprado)}
                        >
                          {/* Checkbox táctil grande */}
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                              item.comprado
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 dark:border-slate-600 hover:border-orange-500"
                            }`}
                          >
                            {item.comprado && <CheckCircle2 className="h-4 w-4" />}
                          </div>

                          <div className="space-y-1">
                            <p
                              className={`text-sm font-semibold transition-all ${
                                item.comprado ? "line-through text-slate-400 dark:text-slate-500" : ""
                              }`}
                            >
                              {item.material}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {modoVista !== "proyecto" && obraAsociada && (
                                <span className="font-medium text-orange-600 dark:text-orange-400">
                                  Obra: {obraAsociada.titulo}
                                </span>
                              )}
                              {modoVista !== "proveedor" && item.proveedor && (
                                <span className="text-slate-500">
                                  Tienda: {item.proveedor}
                                </span>
                              )}
                              {item.gremio && (
                                <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${getGremioBadgeClasses(item.gremio)}`}>
                                  {item.gremio}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleEliminar(item.id)}
                          className="text-slate-300 hover:text-rose-500 p-2 transition-colors ml-2 cursor-pointer"
                          title="Eliminar de la lista"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ComprasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando compras...</div>}>
      <ComprasContent />
    </Suspense>
  );
}

