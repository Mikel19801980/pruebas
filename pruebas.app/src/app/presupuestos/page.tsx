"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, Plus, ArrowRight, FolderKanban, Phone, Sparkles } from "lucide-react";
import { api, Presupuesto, Proyecto, EstadoPresupuesto, Cliente } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { useAppConfig } from "@/config/context";

function PresupuestosContent() {
  const { puede, terminos, empresa } = useAppConfig();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get("cliente_id");
  const crearParam = searchParams.get("crear");

  const [presupuestos, setPresupuestos] = React.useState<Presupuesto[]>([]);
  const [proyectos, setProyectos] = React.useState<Proyecto[]>([]);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [filtroEstado, setFiltroEstado] = React.useState<"Todos" | EstadoPresupuesto>("Todos");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Formulario nuevo presupuesto
  const [titulo, setTitulo] = React.useState("");
  const [selectedClienteId, setSelectedClienteId] = React.useState<string>("");
  const [clienteNombre, setClienteNombre] = React.useState("");
  const [clienteTelefono, setClienteTelefono] = React.useState("");
  const [selectedProyectoId, setSelectedProyectoId] = React.useState<string>("");
  const [formaPagoTipo, setFormaPagoTipo] = React.useState<"10_inicio" | "40_40_20" | "semanal" | "personalizada">("10_inicio");
  const [formaPagoTexto, setFormaPagoTexto] = React.useState("10% a la reserva/firma, 40% al arrancar trabajos, 30% a mitad de obra, 20% a fin de obra y entrega.");

  const [loading, setLoading] = React.useState(true);
  const [creando, setCreando] = React.useState(false);
  const [activandoId, setActivandoId] = React.useState<string | null>(null);
  const [errorCarga, setErrorCarga] = React.useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const [pres, projs, clis] = await Promise.all([
        api.getPresupuestos(),
        puede("obras") ? api.getProyectos() : Promise.resolve([]),
        api.getClientes(),
      ]);
      setPresupuestos(pres);
      setProyectos(projs);
      setClientes(clis);
    } catch (e: any) {
      console.error("Error al cargar presupuestos:", e);
      setErrorCarga(e?.message || "Error al conectar con la base de datos");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [puede]);

  // Si viene con cliente_id o crear=1 en la URL
  React.useEffect(() => {
    if (clienteIdParam) {
      const cli = clientes.find((c) => c.id === clienteIdParam);
      if (cli) {
        setSelectedClienteId(cli.id);
        setClienteNombre(cli.nombre);
        setClienteTelefono(cli.telefono || "");
      } else {
        api.getClienteById(clienteIdParam).then((cli) => {
          if (cli) {
            setSelectedClienteId(cli.id);
            setClienteNombre(cli.nombre);
            setClienteTelefono(cli.telefono || "");
          }
        }).catch(console.error);
      }
    }
    if (crearParam === "1") {
      setIsModalOpen(true);
    }
  }, [clienteIdParam, crearParam, clientes]);

  const handleClienteSelectChange = (id: string) => {
    setSelectedClienteId(id);
    if (id === "nuevo") {
      setClienteNombre("");
      setClienteTelefono("");
    } else if (id) {
      const cli = clientes.find((c) => c.id === id);
      if (cli) {
        setClienteNombre(cli.nombre);
        setClienteTelefono(cli.telefono || "");
      }
    }
  };

  const handleFormaPagoChange = (tipo: "10_inicio" | "40_40_20" | "semanal" | "personalizada") => {
    setFormaPagoTipo(tipo);
    if (tipo === "10_inicio") {
      setFormaPagoTexto("10% a la reserva/firma, 40% al arrancar demolición/instalaciones, 30% a mitad de obra, 20% a finalización y entrega.");
    } else if (tipo === "40_40_20") {
      setFormaPagoTexto("40% al inicio de obra, 40% a mitad de ejecución, 20% a terminación de los trabajos.");
    } else if (tipo === "semanal") {
      setFormaPagoTexto("10% reserva y pagos semanales los viernes según avance y partidas ejecutadas.");
    }
  };

  const handleCrearPresupuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !clienteNombre.trim()) {
      alert("Por favor completa el título y el nombre del cliente.");
      return;
    }
    setCreando(true);
    try {
      let finalClienteId = selectedClienteId && selectedClienteId !== "nuevo" ? selectedClienteId : null;

      // Si no hay un cliente_id seleccionado o eligió 'nuevo', buscar si ya existe o crearlo
      if (!finalClienteId && clienteNombre.trim()) {
        const existente = clientes.find((c) => {
          if (clienteTelefono.trim() && c.telefono) {
            const tel1 = c.telefono.replace(/\D/g, "");
            const tel2 = clienteTelefono.replace(/\D/g, "");
            if (tel1 && tel2 && tel1 === tel2) return true;
          }
          return c.nombre.toLowerCase().trim() === clienteNombre.toLowerCase().trim();
        });

        if (existente) {
          finalClienteId = existente.id;
          setSelectedClienteId(existente.id);
        } else {
          try {
            const nuevoCli = await api.createCliente({
              nombre: clienteNombre.trim(),
              telefono: clienteTelefono.trim() || null,
            });
            finalClienteId = nuevoCli.id;
            // Recordar el cliente creado en el estado para que un fallo o reintento posterior del presupuesto NO lo duplique
            setSelectedClienteId(nuevoCli.id);
            setClientes((prev) => [nuevoCli, ...prev]);
          } catch (cliErr: any) {
            console.error("Error al registrar cliente:", cliErr);
            alert(`No se pudo crear la ficha del cliente: ${cliErr?.message || "Error de conexión"}. El presupuesto no se ha guardado para evitar registros huérfanos.`);
            return; // DETENER: no continuar guardando el presupuesto sin cliente vinculado
          }
        }
      }

      const nuevo = await api.createPresupuesto({
        titulo: titulo.trim(),
        cliente_nombre: clienteNombre.trim(),
        cliente_telefono: clienteTelefono.trim() || null,
        cliente_id: finalClienteId,
        proyecto_id: selectedProyectoId || null,
        total: 0,
        forma_pago: formaPagoTexto.trim(),
        forma_pago_tipo: "porcentajes",
        fecha_emision: new Date().toISOString().slice(0, 10),
        enlace_pdf: null,
        estado: "Borrador",
      });
      setIsModalOpen(false);
      window.location.href = `/presupuestos/${nuevo.id}`;
    } catch (err: any) {
      console.error("Error al crear presupuesto:", err);
      alert(`Error al guardar el presupuesto: ${err?.message || "Revisa la base de datos o conexión"}. Los datos se conservan para que puedas reintentar.`);
    } finally {
      setCreando(false);
    }
  };

  const handleActivarProyecto = async (e: React.MouseEvent, presupuestoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (activandoId) return;
    setActivandoId(presupuestoId);
    try {
      const proj = await api.convertirPresupuestoEnProyecto(presupuestoId);
      alert(`¡Obra generada con éxito: "${proj.titulo}"! La puedes ver en Obras Activas.`);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(`Error al activar obra: ${err?.message || "Error desconocido"}`);
    } finally {
      setActivandoId(null);
    }
  };

  const presupuestosFiltrados = presupuestos.filter((p) => {
    if (filtroEstado === "Todos") return true;
    return p.estado === filtroEstado;
  });

  const getBadgeVariant = (estado: EstadoPresupuesto) => {
    if (estado === "Aceptado") return "success";
    if (estado === "Enviado") return "orange";
    if (estado === "Rechazado") return "destructive";
    return "secondary";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileSpreadsheet className="h-7 w-7 text-orange-600" />
            Presupuestos a Clientes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Crea propuestas para clientes potenciales. Cuando se acepten, se convierten automáticamente en obras activas.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedClienteId("");
            setClienteNombre("");
            setClienteTelefono("");
            setTitulo("");
            setIsModalOpen(true);
          }}
          className="gap-2 self-start sm:self-auto shadow-md cursor-pointer text-white font-bold"
          style={{ backgroundColor: empresa.colorPrimario }}
        >
          <Plus className="h-5 w-5" />
          Nuevo Presupuesto
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

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(["Todos", "Borrador", "Enviado", "Aceptado", "Rechazado"] as const).map((est) => (
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
              ({est === "Todos" ? presupuestos.length : presupuestos.filter((p) => p.estado === est).length})
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Cargando presupuestos...</div>
      ) : presupuestosFiltrados.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <p className="text-slate-500 text-sm">No hay presupuestos en esta sección.</p>
          <Button
            variant="orange"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Presupuesto para Cliente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presupuestosFiltrados.map((presupuesto) => (
            <Link key={presupuesto.id} href={`/presupuestos/${presupuesto.id}`} className="block group">
              <Card className="h-full transition-all group-hover:border-orange-500/80 group-hover:shadow-md flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
                        {presupuesto.titulo || "Presupuesto de Reforma"}
                      </CardTitle>
                      <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                        Cliente: <strong className="text-slate-800 dark:text-slate-200">{presupuesto.cliente_nombre}</strong>
                      </span>
                    </div>
                    <Badge variant={getBadgeVariant(presupuesto.estado)}>
                      {presupuesto.estado}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {presupuesto.cliente_telefono && (
                      <div className="flex items-center gap-2 font-mono">
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{presupuesto.cliente_telefono}</span>
                      </div>
                    )}
                    {puede("obras") && (
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {presupuesto.proyecto_id
                            ? "✓ Vinculado a Obra en curso"
                            : "Pendiente de aceptar para iniciar obra"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botón especial si está aceptado pero no tiene obra aún (solo si el plan maneja obras) */}
                  {puede("obras") && presupuesto.estado === "Aceptado" && !presupuesto.proyecto_id && (
                    <button
                      type="button"
                      disabled={Boolean(activandoId)}
                      onClick={(e) => handleActivarProyecto(e, presupuesto.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs font-bold cursor-pointer hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        {activandoId === presupuesto.id ? "Creando obra..." : `Aceptado: Crear ${terminos.trabajo} Activo Ahora`}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Total</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(presupuesto.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform">
                      <span>Ver & Enviar WhatsApp</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* MODAL CREAR PRESUPUESTO DIRECTO A CLIENTE */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Presupuesto para Cliente"
        description="Rellena los datos del cliente y los trabajos propuestos."
      >
        <form onSubmit={handleCrearPresupuesto} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Título del Trabajo / Presupuesto *
              </label>
              <span className="text-[11px] text-orange-600 font-bold">¡Dicta o escribe!</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. Reforma Integral Baño o Reforma Cocina y Galería"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="flex h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                required
              />
              <VoiceInput
                size="icon"
                onTranscript={(dictado) => {
                  setTitulo((prev) => (prev ? `${prev} ${dictado}` : dictado));
                }}
              />
            </div>
          </div>

          {/* Selector de Cliente */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Cliente Registrado o Nuevo *
            </label>
            <select
              value={selectedClienteId}
              onChange={(e) => handleClienteSelectChange(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="">-- Seleccionar cliente existente o dar de alta nuevo --</option>
              <option value="nuevo">➕ Escribir datos de un nuevo cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.telefono ? `(${c.telefono})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nombre o Razón Social del Cliente *"
              placeholder="Ej. Carmen Navarro"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              required
            />
            <Input
              label="Móvil Cliente (Para WhatsApp)"
              placeholder="Ej. 655443322"
              type="tel"
              value={clienteTelefono}
              onChange={(e) => setClienteTelefono(e.target.value)}
            />
          </div>

          {/* Forma de Pago Inicial */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Forma de Pago Propuesta
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFormaPagoChange("10_inicio")}
                className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  formaPagoTipo === "10_inicio"
                    ? "bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                10% al arrancar
              </button>
              <button
                type="button"
                onClick={() => handleFormaPagoChange("40_40_20")}
                className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  formaPagoTipo === "40_40_20"
                    ? "bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                40% - 40% - 20%
              </button>
              <button
                type="button"
                onClick={() => handleFormaPagoChange("semanal")}
                className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  formaPagoTipo === "semanal"
                    ? "bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Semanal por avance
              </button>
            </div>
            <textarea
              rows={2}
              value={formaPagoTexto}
              onChange={(e) => {
                setFormaPagoTexto(e.target.value);
                setFormaPagoTipo("personalizada");
              }}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Opcional: Asociar a obra existente si la hay (solo si el plan maneja obras) */}
          {puede("obras") && proyectos.length > 0 && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Vincular a {terminos.trabajo} existente (Opcional)
              </label>
              <select
                className="mt-1 flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={selectedProyectoId}
                onChange={(e) => setSelectedProyectoId(e.target.value)}
              >
                <option value="">Ninguna (Presupuesto directo a cliente)</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titulo} ({p.cliente_nombre})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="w-1/3" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="orange" className="w-2/3" disabled={creando}>
              {creando ? "Creando..." : "Crear y Añadir Trabajos"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function PresupuestosPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Cargando presupuestos...</div>}>
      <PresupuestosContent />
    </React.Suspense>
  );
}
