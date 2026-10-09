"use client";

import * as React from "react";
import Link from "next/link";
import {
  FolderKanban,
  FileSpreadsheet,
  Calendar,
  ShoppingCart,
  Truck,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  FileCheck2,
  FileClock,
  Camera,
  Users,
  FileCheck,
  ClipboardList,
  Phone,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import {
  api,
  Proyecto,
  Presupuesto,
  ListaCompra,
  EventoAgenda,
  Informe,
  Cliente,
  ParteTrabajo,
} from "@/lib/supabase";
import { formatCurrency, formatDate, formatDateTime, getGremioBadgeClasses } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppConfig } from "@/config/context";

export default function DashboardPage() {
  const { empresa, oficio, plan, puede, terminos } = useAppConfig();
  const [proyectos, setProyectos] = React.useState<Proyecto[]>([]);
  const [presupuestos, setPresupuestos] = React.useState<Presupuesto[]>([]);
  const [compras, setCompras] = React.useState<ListaCompra[]>([]);
  const [eventos, setEventos] = React.useState<EventoAgenda[]>([]);
  const [informes, setInformes] = React.useState<Informe[]>([]);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [partes, setPartes] = React.useState<ParteTrabajo[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadAll() {
      try {
        const [p, pres, c, ev, inf, cli] = await Promise.all([
          puede("obras") ? api.getProyectos() : Promise.resolve([]),
          api.getPresupuestos(),
          puede("compras") ? api.getCompras() : Promise.resolve([]),
          puede("agenda") ? api.getEventos() : Promise.resolve([]),
          api.getInformes(),
          api.getClientes(),
        ]);
        setProyectos(p);
        setPresupuestos(pres);
        setCompras(c);
        setEventos(ev);
        setInformes(inf);
        setClientes(cli);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [puede]);

  const obrasEnCurso = proyectos.filter((p) => p.estado === "En curso");
  const comprasPendientes = compras.filter((c) => !c.comprado);
  const totalPresupuestos = presupuestos.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  const presupuestosAceptados = presupuestos.filter((p) => p.estado === "Aceptado");
  const presupuestosBorrador = presupuestos.filter((p) => p.estado === "Borrador");

  // Eventos de hoy
  const hoyStr = new Date().toISOString().slice(0, 10);
  const eventosHoy = eventos.filter((e) => e.fecha_hora.slice(0, 10) === hoyStr);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6 pb-20">
      {/* Banner Principal de Bienvenida */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Sparkles className="h-3 w-3" /> Panel de {oficio.nombre} · Plan {plan.nombre}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {empresa.nombreComercial}
              <span className="text-xs font-bold text-orange-400 ml-2 uppercase">
                {empresa.subtitulo}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {plan.nivel === "basico"
                ? "Presupuestos rápidos, informes con fotos y cartera de clientes sin complicaciones."
                : plan.nivel === "organizado"
                ? `Control completo de ${terminos.trabajos.toLowerCase()}, agenda, lista de compras y albaranes.`
                : `Gestión con equipo de operarios: asignaciones, partes diarios con fotos y avances.`}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Link href="/presupuestos?crear=1">
              <Button
                size="sm"
                className="gap-2 text-white font-bold cursor-pointer"
                style={{ backgroundColor: empresa.colorPrimario }}
              >
                <Plus className="h-4 w-4" /> Nuevo Presupuesto
              </Button>
            </Link>
            {puede("informes") && (
              <Link href="/informes?crear=1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 cursor-pointer bg-slate-800 text-white border-slate-700"
                >
                  <Camera className="h-4 w-4" /> Nuevo Informe
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ACCESOS DIRECTOS EN PLAN BÁSICO (Las 3 acciones maestras) */}
      {plan.nivel === "basico" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tarjeta 1: Presupuestos */}
          <Link href="/presupuestos" className="block group">
            <Card className="h-full border-slate-200 dark:border-slate-800 transition-all group-hover:border-orange-500 group-hover:shadow-md">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/80 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    Presupuestos
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {presupuestos.length} emitidos · {formatCurrency(totalPresupuestos)}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 mt-2">
                    Crear o ver <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Tarjeta 2: Informes con Fotos */}
          <Link href="/informes" className="block group">
            <Card className="h-full border-slate-200 dark:border-slate-800 transition-all group-hover:border-blue-500 group-hover:shadow-md">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Informes con Fotos
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {informes.length} reportes documentados
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-2">
                    Nuevo reporte <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Tarjeta 3: Clientes */}
          <Link href="/clientes" className="block group">
            <Card className="h-full border-slate-200 dark:border-slate-800 transition-all group-hover:border-indigo-500 group-hover:shadow-md">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Clientes
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {clientes.length} contactos en agenda
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                    Llamar o WhatsApp <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* MÉTRICAS CLAVE PARA PLAN ORGANIZADO Y EQUIPO */}
      {plan.nivel !== "basico" && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Métrica 1: Presupuestado Total */}
          <Link href="/presupuestos">
            <Card className="hover:border-orange-500/80 transition-all cursor-pointer">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-500">Presupuestado</span>
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {formatCurrency(totalPresupuestos)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {presupuestos.length} presupuestos emitidos
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Métrica 2: Obras en curso */}
          <Link href="/proyectos">
            <Card className="hover:border-orange-500/80 transition-all cursor-pointer">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-500">
                    {terminos.trabajos} en Curso
                  </span>
                  <FolderKanban className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {obrasEnCurso.length}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {proyectos.length} registradas en total
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Métrica 3: Compras pendientes */}
          {puede("compras") && (
            <Link href="/compras">
              <Card className="hover:border-orange-500/80 transition-all cursor-pointer">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-bold text-slate-500">Materiales a Pedir</span>
                    <ShoppingCart className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-orange-600">
                    {comprasPendientes.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    En lista para almacenes
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Métrica 4: Citas de Hoy */}
          <Link href="/agenda">
            <Card className="hover:border-orange-500/80 transition-all cursor-pointer">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-500">Citas de Hoy</span>
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {eventosHoy.length}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {eventos.length} programadas
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* CARGA DE FURGONETA & CITAS DE HOY (Solo si tiene agenda) */}
      {puede("agenda") && eventosHoy.length > 0 && (
        <Card className="border-orange-500/40 bg-gradient-to-r from-orange-50/70 to-amber-50/50 dark:from-orange-950/20 dark:to-slate-900">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                Intervenciones y Herramientas para Hoy
              </CardTitle>
              <Link href="/agenda" className="text-xs font-bold text-orange-600 hover:underline">
                Ver Agenda
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-orange-200/60 dark:divide-slate-800">
              {eventosHoy.map((e) => (
                <div key={e.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold border ${getGremioBadgeClasses(
                        e.gremio || "General"
                      )}`}
                    >
                      {e.gremio}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">{e.titulo}</span>
                  </div>
                  <span className="font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-orange-600" />
                    {formatDateTime(e.fecha_hora)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TRABAJOS / OBRAS ACTIVAS (Solo si tiene obras) */}
      {puede("obras") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-orange-600" />
              {terminos.trabajos} Activas
            </h2>
            <Link
              href="/proyectos"
              className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {obrasEnCurso.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No hay {terminos.trabajos.toLowerCase()} en curso en este momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {obrasEnCurso.slice(0, 4).map((p) => (
                <Link key={p.id} href={`/proyectos/${p.id}`} className="block">
                  <Card className="hover:border-orange-500 transition-all p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {p.titulo}
                      </h3>
                      <Badge variant="orange">{p.estado}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      Cliente: <span className="font-medium text-slate-800 dark:text-slate-200">{p.cliente_nombre}</span>
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>Inicio: {p.fecha_inicio ? formatDate(p.fecha_inicio) : "Pendiente"}</span>
                      <span className="text-orange-600 font-bold flex items-center gap-0.5">
                        Ficha <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BLOQUE INFERIOR: ÚLTIMOS PRESUPUESTOS & INFORMES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Últimos Presupuestos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-orange-600" />
              Últimos Presupuestos
            </h2>
            <Link
              href="/presupuestos"
              className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {presupuestos.slice(0, 4).map((pres) => (
              <Link key={pres.id} href={`/presupuestos/${pres.id}`} className="block">
                <Card className="hover:border-orange-500/80 transition-all p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{pres.titulo}</h4>
                    <p className="text-slate-400 text-[11px]">{pres.cliente_nombre}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(pres.total)}
                    </span>
                    <div>
                      <Badge variant="outline" className="text-[10px]">
                        {pres.estado}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Últimos Informes de Fotos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-600" />
              Últimos Informes con Fotos
            </h2>
            <Link
              href="/informes"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {informes.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <p className="text-xs text-slate-400">No hay informes con fotos creados.</p>
              <Link href="/informes" className="inline-block mt-2">
                <Button size="sm" variant="outline" className="text-xs">
                  <Camera className="h-3.5 w-3.5 mr-1 text-blue-500" /> Crear informe
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-2">
              {informes.slice(0, 4).map((inf) => (
                <Link key={inf.id} href={`/informes/${inf.id}`} className="block">
                  <Card className="hover:border-blue-500/80 transition-all p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{inf.titulo}</h4>
                      <p className="text-slate-400 text-[11px]">
                        {inf.cliente_nombre} · {formatDate(inf.fecha)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {inf.fotos?.length || 0} fotos
                    </Badge>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
