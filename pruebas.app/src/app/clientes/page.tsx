"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  Camera,
  FolderKanban,
  Search,
  MessageCircle,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { api, Cliente, Presupuesto, Informe, Proyecto } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { useAppConfig } from "@/config/context";

export default function ClientesPage() {
  const { puede, terminos, empresa } = useAppConfig();
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [presupuestos, setPresupuestos] = React.useState<Presupuesto[]>([]);
  const [informes, setInformes] = React.useState<Informe[]>([]);
  const [proyectos, setProyectos] = React.useState<Proyecto[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filtro / Búsqueda
  const [busqueda, setBusqueda] = React.useState("");

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [clienteEnEdicion, setClienteEnEdicion] = React.useState<Cliente | null>(null);
  const [nombre, setNombre] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [direccion, setDireccion] = React.useState("");
  const [nif, setNif] = React.useState("");
  const [notas, setNotas] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);

  // Cliente seleccionado para ver dossier
  const [clienteSeleccionado, setClienteSeleccionado] = React.useState<Cliente | null>(null);
  const [errorCarga, setErrorCarga] = React.useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const [cliData, presData, infData, projData] = await Promise.all([
        api.getClientes(),
        api.getPresupuestos(),
        api.getInformes(),
        puede("obras") ? api.getProyectos() : Promise.resolve([]),
      ]);
      setClientes(cliData);
      setPresupuestos(presData);
      setInformes(infData);
      setProyectos(projData);
    } catch (e: any) {
      console.error("Error cargando clientes:", e);
      setErrorCarga(e?.message || "Error al conectar con la base de datos");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [puede]);

  const abrirNuevoCliente = () => {
    setClienteEnEdicion(null);
    setNombre("");
    setTelefono("");
    setEmail("");
    setDireccion("");
    setNif("");
    setNotas("");
    setIsModalOpen(true);
  };

  const abrirEditarCliente = (cli: Cliente) => {
    setClienteEnEdicion(cli);
    setNombre(cli.nombre);
    setTelefono(cli.telefono || "");
    setEmail(cli.email || "");
    setDireccion(cli.direccion || "");
    setNif(cli.nif || "");
    setNotas(cli.notas || "");
    setIsModalOpen(true);
  };

  const handleGuardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    try {
      if (clienteEnEdicion) {
        await api.updateCliente(clienteEnEdicion.id, {
          nombre: nombre.trim(),
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          direccion: direccion.trim() || null,
          nif: nif.trim() || null,
          notas: notas.trim() || null,
        });
      } else {
        await api.createCliente({
          nombre: nombre.trim(),
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          direccion: direccion.trim() || null,
          nif: nif.trim() || null,
          notas: notas.trim() || null,
        });
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error("Error guardando cliente:", err);
      alert(`Error al guardar el cliente: ${err?.message || "Revisa la conexión o base de datos"}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarCliente = async (id: string, nombreCli: string) => {
    if (!confirm(`¿Eliminar ficha de "${nombreCli}"? Los presupuestos asociados seguirán existiendo.`)) return;
    try {
      await api.deleteCliente(id);
      if (clienteSeleccionado?.id === id) setClienteSeleccionado(null);
      await fetchData();
    } catch (err) {
      console.error("Error eliminando cliente:", err);
    }
  };

  // Filtrar clientes
  const clientesFiltrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono && c.telefono.includes(q)) ||
      (c.direccion && c.direccion.toLowerCase().includes(q)) ||
      (c.notas && c.notas.toLowerCase().includes(q))
    );
  });

  // Helper: Relacionar presupuestos por ID estricto (no adivinar: los ambiguos quedan sin vincular)
  const getPresupuestosDelCliente = (cli: Cliente) => {
    return presupuestos.filter((p) => {
      if (p.cliente_id) {
        return p.cliente_id === cli.id;
      }
      // Registros antiguos sin cliente_id:
      // 1. Coincidencia por teléfono unívoco
      if (p.cliente_telefono && cli.telefono) {
        const tel1 = p.cliente_telefono.replace(/\D/g, "");
        const tel2 = cli.telefono.replace(/\D/g, "");
        if (tel1 && tel2 && tel1 === tel2) {
          const otrosMismoTel = clientes.filter((c) => c.id !== cli.id && c.telefono && c.telefono.replace(/\D/g, "") === tel1);
          if (otrosMismoTel.length === 0) return true;
        }
      }
      // 2. Coincidencia por nombre solo si NO hay ningún otro cliente con ese nombre
      if (p.cliente_nombre && cli.nombre && p.cliente_nombre.toLowerCase().trim() === cli.nombre.toLowerCase().trim()) {
        const otrosMismoNombre = clientes.filter((c) => c.id !== cli.id && c.nombre.toLowerCase().trim() === cli.nombre.toLowerCase().trim());
        if (otrosMismoNombre.length === 0) return true;
      }
      return false;
    });
  };

  // Helper: Relacionar informes por ID estricto
  const getInformesDelCliente = (cli: Cliente) => {
    return informes.filter((i) => {
      if (i.cliente_id) {
        return i.cliente_id === cli.id;
      }
      if (i.cliente_telefono && cli.telefono) {
        const tel1 = i.cliente_telefono.replace(/\D/g, "");
        const tel2 = cli.telefono.replace(/\D/g, "");
        if (tel1 && tel2 && tel1 === tel2) {
          const otrosMismoTel = clientes.filter((c) => c.id !== cli.id && c.telefono && c.telefono.replace(/\D/g, "") === tel1);
          if (otrosMismoTel.length === 0) return true;
        }
      }
      if (i.cliente_nombre && cli.nombre && i.cliente_nombre.toLowerCase().trim() === cli.nombre.toLowerCase().trim()) {
        const otrosMismoNombre = clientes.filter((c) => c.id !== cli.id && c.nombre.toLowerCase().trim() === cli.nombre.toLowerCase().trim());
        if (otrosMismoNombre.length === 0) return true;
      }
      return false;
    });
  };

  // Limpiar teléfono para WhatsApp
  const cleanPhone = (phone?: string | null) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("34") ? digits : `34${digits}`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      {/* Cabecera */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Clientes
            </h1>
            <Badge variant="outline" className="border-orange-500/30 text-orange-600 dark:text-orange-400">
              {clientes.length} contacto{clientes.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fichas directas de clientes con histórico de presupuestos e informes
          </p>
        </div>

        <Button
          onClick={abrirNuevoCliente}
          className="shadow-md text-white font-bold"
          style={{ backgroundColor: empresa.colorPrimario }}
        >
          <Plus className="mr-2 h-4 w-4 stroke-[3]" />
          Nuevo Cliente
        </Button>
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

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar cliente por nombre, teléfono o dirección..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            {busqueda ? "No hay clientes que coincidan" : "No tienes clientes registrados"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {busqueda
              ? "Prueba a buscar con otro término o limpia el buscador."
              : "Da de alta tu primer cliente para tener organizados sus presupuestos e informes."}
          </p>
          {!busqueda && (
            <Button
              onClick={abrirNuevoCliente}
              className="mt-4 text-white font-bold"
              style={{ backgroundColor: empresa.colorPrimario }}
            >
              <Plus className="mr-2 h-4 w-4 stroke-[3]" />
              Crear primer cliente
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {clientesFiltrados.map((cli) => {
            // Contar presupuestos e informes de este cliente de forma estricta
            const presDelCli = getPresupuestosDelCliente(cli);
            const infDelCli = getInformesDelCliente(cli);

            return (
              <Card
                key={cli.id}
                className="overflow-hidden border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-md hover:border-orange-500/40"
              >
                <div className="p-5 space-y-3">
                  {/* Encabezado del cliente */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        {cli.nombre}
                      </h3>
                      {cli.nif && (
                        <p className="text-xs font-mono text-slate-400">NIF/CIF: {cli.nif}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirEditarCliente(cli)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Editar cliente"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEliminarCliente(cli.id, cli.nombre)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Datos de contacto */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {cli.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">{cli.telefono}</span>
                      </div>
                    )}
                    {cli.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cli.email}</span>
                      </div>
                    )}
                    {cli.direccion && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cli.direccion}</span>
                      </div>
                    )}
                    {cli.notas && (
                      <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2 text-xs italic text-slate-500 dark:text-slate-400">
                        "{cli.notas}"
                      </div>
                    )}
                  </div>

                  {/* Métricas y accesos */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-orange-500" />
                        {presDelCli.length} pres.
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Camera className="h-3.5 w-3.5 text-blue-500" />
                        {infDelCli.length} inf.
                      </span>
                    </div>

                    <button
                      onClick={() => setClienteSeleccionado(cli)}
                      className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-0.5 text-xs"
                    >
                      Ver ficha completa
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Botones de acción rápida: Llamar y WhatsApp */}
                  {cli.telefono && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={`tel:${cli.telefono}`}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        Llamar
                      </a>
                      <a
                        href={`https://wa.me/${cleanPhone(cli.telefono)}?text=${encodeURIComponent(
                          `Hola ${cli.nombre}, me pongo en contacto desde ${empresa.nombreComercial}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white shadow-sm transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal / Ficha Detalle del Cliente Seleccionado */}
      {clienteSeleccionado && (
        <Modal
          isOpen={Boolean(clienteSeleccionado)}
          onClose={() => setClienteSeleccionado(null)}
          title={`Ficha: ${clienteSeleccionado.nombre}`}
          description="Documentos y datos asociados a este cliente"
        >
          <div className="space-y-4 pt-2">
            {/* Info rápida */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Teléfono:</span>
                <span className="font-mono">{clienteSeleccionado.telefono || "No indicado"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Email:</span>
                <span>{clienteSeleccionado.email || "No indicado"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Dirección:</span>
                <span>{clienteSeleccionado.direccion || "No indicada"}</span>
              </div>
              {clienteSeleccionado.nif && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300">NIF/CIF:</span>
                  <span className="font-mono">{clienteSeleccionado.nif}</span>
                </div>
              )}
            </div>

            {/* Acciones directas con el cliente */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/presupuestos?cliente_id=${clienteSeleccionado.id}&crear=1`}
                onClick={() => setClienteSeleccionado(null)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-bold text-xs hover:bg-orange-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo Presupuesto
              </Link>
              <Link
                href={`/informes?cliente_id=${clienteSeleccionado.id}`}
                onClick={() => setClienteSeleccionado(null)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold text-xs hover:bg-blue-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo Informe
              </Link>
            </div>

            {/* Presupuestos del Cliente */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-4 w-4 text-orange-500" />
                Presupuestos emitidos
              </h4>
              {getPresupuestosDelCliente(clienteSeleccionado).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay presupuestos para este cliente todavía.</p>
              ) : (
                <div className="space-y-2">
                  {getPresupuestosDelCliente(clienteSeleccionado).map((p) => (
                    <Link
                      key={p.id}
                      href={`/presupuestos/${p.id}`}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{p.titulo}</p>
                        <p className="text-[11px] text-slate-400">{formatDate(p.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-orange-600 dark:text-orange-400">
                          {formatCurrency(p.total)}
                        </p>
                        <Badge variant="outline" className="text-[10px]">
                          {p.estado}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Informes del Cliente */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <Camera className="h-4 w-4 text-blue-500" />
                Informes con fotos
              </h4>
              {getInformesDelCliente(clienteSeleccionado).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay informes fotográficos para este cliente.</p>
              ) : (
                <div className="space-y-2">
                  {getInformesDelCliente(clienteSeleccionado).map((inf) => (
                    <Link
                      key={inf.id}
                      href={`/informes/${inf.id}`}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{inf.titulo}</p>
                        <p className="text-[11px] text-slate-400">{formatDate(inf.fecha)}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {inf.fotos?.length || 0} fotos
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Crear / Editar Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={clienteEnEdicion ? "Editar Ficha de Cliente" : "Nuevo Cliente"}
        description="Rellena los datos básicos de contacto del cliente."
      >
        <form onSubmit={handleGuardarCliente} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre o Razón Social *
            </label>
            <Input
              type="text"
              required
              placeholder="Ej: Carlos Martínez o Peluquería Carmen"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono
              </label>
              <Input
                type="tel"
                placeholder="612345678"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                NIF / CIF (opcional)
              </label>
              <Input
                type="text"
                placeholder="12345678Z"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email (opcional)
            </label>
            <Input
              type="email"
              placeholder="cliente@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Dirección de obra / vivienda
            </label>
            <Input
              type="text"
              placeholder="Calle Mayor 14, 2ºB, Valencia"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Notas internas / Recordatorios
              </label>
              <VoiceInput
                onTranscript={(text) => setNotas((prev) => (prev ? `${prev} ${text}` : text))}
                size="sm"
                buttonText="Dictar"
              />
            </div>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Tiene perro pequeño. Horario de tarde a partir de las 17h."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              disabled={guardando || !nombre.trim()}
              className="text-white font-bold"
              style={{ backgroundColor: empresa.colorPrimario }}
            >
              {guardando ? "Guardando..." : clienteEnEdicion ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
