"use client";

import * as React from "react";
import Link from "next/link";
import { FolderKanban, Plus, Phone, Calendar, ArrowRight, User } from "lucide-react";
import { api, Proyecto, EstadoProyecto } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { ProyectoForm } from "@/components/forms/ProyectoForm";

import { useAppConfig } from "@/config/context";

export default function ProyectosPage() {
  const { terminos, empresa } = useAppConfig();
  const [proyectos, setProyectos] = React.useState<Proyecto[]>([]);
  const [filtroEstado, setFiltroEstado] = React.useState<"Todos" | EstadoProyecto>("Todos");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const fetchProyectos = async () => {
    setLoading(true);
    try {
      const data = await api.getProyectos();
      setProyectos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProyectos();
  }, []);

  const proyectosFiltrados = proyectos.filter((p) => {
    if (filtroEstado === "Todos") return true;
    return p.estado === filtroEstado;
  });

  const getBadgeVariant = (estado: EstadoProyecto) => {
    if (estado === "En curso") return "orange";
    if (estado === "Terminado") return "success";
    return "secondary";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FolderKanban className="h-7 w-7 text-orange-600" />
            {terminos.trabajos}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control de {terminos.trabajos.toLowerCase()} en curso, clientes y expedientes
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 self-start sm:self-auto shadow-md text-white font-bold cursor-pointer"
          style={{ backgroundColor: empresa.colorPrimario }}
        >
          <Plus className="h-5 w-5" />
          Nuevo {terminos.trabajo}
        </Button>
      </div>

      {/* Filtros por Estado */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
        {(["Todos", "En curso", "Pendiente", "Terminado"] as const).map((est) => (
          <button
            key={est}
            onClick={() => setFiltroEstado(est)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filtroEstado === est
                ? "bg-slate-900 text-white shadow-sm dark:bg-orange-600"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {est}
            <span className="ml-1.5 opacity-70">
              ({est === "Todos" ? proyectos.length : proyectos.filter((p) => p.estado === est).length})
            </span>
          </button>
        ))}
      </div>

      {/* Listado de Obras */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Cargando obras activas...</div>
      ) : proyectosFiltrados.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-500 text-sm">No hay reformas en esta categoría.</p>
          <Button
            variant="orange"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Primera Reforma
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proyectosFiltrados.map((proyecto) => (
            <Link key={proyecto.id} href={`/proyectos/${proyecto.id}`} className="block group">
              <Card className="h-full transition-all group-hover:border-orange-500/80 group-hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
                      {proyecto.titulo}
                    </CardTitle>
                    <Badge variant={getBadgeVariant(proyecto.estado)}>
                      {proyecto.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {proyecto.cliente_nombre}
                      </span>
                    </div>

                    {proyecto.cliente_telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="font-mono">{proyecto.cliente_telefono}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Inicio: {formatDate(proyecto.fecha_inicio)}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs font-semibold text-orange-600 group-hover:translate-x-1 transition-transform">
                    <span>Ver ficha y partidas</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Modal Nuevo Proyecto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Nuevo ${terminos.trabajo}`}
        description={`Introduce los datos principales para comenzar.`}
      >
        <ProyectoForm
          onSuccess={(nuevo) => {
            setProyectos((prev) => [nuevo, ...prev]);
            setIsModalOpen(false);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
