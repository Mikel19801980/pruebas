"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Palette,
  Globe,
  Briefcase,
  Layers,
  Sliders,
  Save,
  Eye,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ExternalLink,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Info,
} from "lucide-react";
import { useAppConfig } from "@/config/context";
import { api, isSupabaseConfigured } from "@/lib/supabase";
import { CATALOGO_TEMAS } from "@/config/temas";
import { CATALOGO_OFICIOS } from "@/config/oficios";
import { PLAN_BASICO, PLAN_ORGANIZADO } from "@/config/planes";
import { TipoOficio, NivelPlan, Capacidad } from "@/config/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ConfiguracionPage() {
  const {
    config,
    oficio,
    plan,
    empresa,
    preferencias,
    tema,
    webPublica,
    terminos,
    borradorWebPublica,
    borradorEmpresa,
    estadoPublicacion,
    modoVistaPrevia,
    setModoVistaPrevia,
    setOficio,
    setPlanNivel,
    setPreferencias,
    setEmpresa,
    setTemaId,
    guardarBorradorWeb,
    publicarConfiguracionWeb,
  } = useAppConfig();

  const [usuarioEmail, setUsuarioEmail] = React.useState<string | null>(null);
  const [esAdmin, setEsAdmin] = React.useState(false);
  const [adminEmail, setAdminEmail] = React.useState<string | null>(null);
  const [titularEmail, setTitularEmail] = React.useState<string | null>(null);

  const esAdminEfectivo = esAdmin && modoVistaPrevia !== "titular";

  // Estados locales editables para Empresa y Web Pública
  const [editEmpresa, setEditEmpresa] = React.useState(borradorEmpresa || empresa);
  const [editWeb, setEditWeb] = React.useState(borradorWebPublica || webPublica);

  // Módulos habilitados granularmente
  const [modulosActivos, setModulosActivos] = React.useState<Capacidad[]>(
    preferencias.modulos_activos || [...plan.capacidades]
  );

  // Feedback y mensajes
  const [guardando, setGuardando] = React.useState(false);
  const [mensaje, setMensaje] = React.useState<{ tipo: "ok" | "error" | "warn"; texto: string } | null>(null);

  // Sincronizar módulos si cambia preferencias
  React.useEffect(() => {
    if (preferencias.modulos_activos) {
      setModulosActivos(preferencias.modulos_activos);
    } else {
      setModulosActivos([...plan.capacidades]);
    }
  }, [preferencias.modulos_activos, plan.capacidades]);

  // Verificar credenciales y rol
  React.useEffect(() => {
    async function checkRole() {
      if (!isSupabaseConfigured) {
        // En modo local, comprobar sesión simulada o por defecto admin
        if (typeof window !== "undefined") {
          const sim = localStorage.getItem("imanox_simulated_user");
          if (sim) {
            try {
              const u = JSON.parse(sim);
              setUsuarioEmail(u.email);
              setEsAdmin(u.rol === "administrador");
              return;
            } catch {}
          }
        }
        setUsuarioEmail("admin@tuempresa.es");
        setEsAdmin(true);
        return;
      }
      try {
        const [user, cfg] = await Promise.all([api.getUsuarioActual(), api.getConfig()]);
        const email = user?.email?.toLowerCase().trim() || null;
        setUsuarioEmail(email);

        const aEmail = cfg?.admin_email?.toLowerCase().trim() || null;
        const tEmail = cfg?.titular_email?.toLowerCase().trim() || null;
        setAdminEmail(aEmail);
        setTitularEmail(tEmail);

        // Determinar si es Administrador o Titular
        if ((user as any)?.rol === "administrador" || (user as any)?.rol === "titular") {
          setEsAdmin((user as any)?.rol === "administrador");
        } else if (!aEmail && !tEmail) {
          setEsAdmin(true);
        } else if (aEmail && email === aEmail) {
          setEsAdmin(true);
        } else {
          setEsAdmin(false);
        }
      } catch (err) {
        console.error("Error verificando rol:", err);
      }
    }
    checkRole();
  }, []);

  React.useEffect(() => {
    setEditEmpresa(borradorEmpresa || empresa);
  }, [borradorEmpresa, empresa]);

  React.useEffect(() => {
    setEditWeb(borradorWebPublica || webPublica);
  }, [borradorWebPublica, webPublica]);

  // Aplicar paquete predefinido de nivel (Básico vs Organizado)
  const aplicarPaqueteNivel = async (nivel: NivelPlan) => {
    if (!esAdminEfectivo) return;
    try {
      const capacidadesBase = nivel === "basico" ? [...PLAN_BASICO.capacidades] : [...PLAN_ORGANIZADO.capacidades];
      await setPlanNivel(nivel);
      await setPreferencias({ modulos_activos: capacidadesBase });
      setModulosActivos(capacidadesBase);
      setMensaje({
        tipo: "ok",
        texto: `Paquete predefinido "${nivel === "basico" ? "Básico" : "Organizado"}" aplicado. Módulos inicializados.`,
      });
    } catch (err: any) {
      setMensaje({
        tipo: "error",
        texto: `Error al aplicar paquete: ${err?.message || "Operación fallida"}`,
      });
    }
  };

  // Conmutar un módulo individual
  const toggleModulo = async (cap: Capacidad) => {
    if (!esAdminEfectivo) return;
    const yaActivo = modulosActivos.includes(cap);

    if (yaActivo) {
      // Regla de dependencia: Clientes es compartido y necesario si hay presupuestos, obras o informes
      if (cap === "clientes") {
        const hayDependientes =
          modulosActivos.includes("presupuestos") ||
          modulosActivos.includes("obras") ||
          modulosActivos.includes("informes");
        if (hayDependientes) {
          setMensaje({
            tipo: "warn",
            texto: "Aviso de dependencia: El módulo 'Clientes' es indispensable mientras Presupuestos, Obras o Informes estén activos.",
          });
          return;
        }
      }

      // Regla de dependencia: Obras con presupuestos convertidos o compras
      const nuevos = modulosActivos.filter((m) => m !== cap);
      try {
        await setPreferencias({ modulos_activos: nuevos });
        setModulosActivos(nuevos);
        setMensaje({
          tipo: "ok",
          texto: `Módulo '${cap}' desactivado. Los datos históricos se conservan para futura reactivación.`,
        });
      } catch (err: any) {
        setMensaje({
          tipo: "error",
          texto: `Error al desactivar módulo '${cap}': ${err?.message || "Operación fallida"}`,
        });
      }
    } else {
      // Activar módulo
      const nuevos = [...modulosActivos, cap];
      // Si se activa presupuestos o informes o obras, auto-activar clientes si no estaba
      if (["presupuestos", "obras", "informes"].includes(cap) && !nuevos.includes("clientes")) {
        nuevos.push("clientes");
      }
      try {
        await setPreferencias({ modulos_activos: nuevos });
        setModulosActivos(nuevos);
        setMensaje({
          tipo: "ok",
          texto: `Módulo '${cap}' habilitado correctamente.`,
        });
      } catch (err: any) {
        setMensaje({
          tipo: "error",
          texto: `Error al activar módulo '${cap}': ${err?.message || "Operación fallida"}`,
        });
      }
    }
  };

  // Guardar Borrador
  const handleGuardarBorrador = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      await guardarBorradorWeb({
        empresa: editEmpresa,
        web: editWeb,
      });
      setMensaje({ tipo: "ok", texto: "Borrador guardado correctamente. Puedes previsualizarlo antes de publicar." });
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err?.message || "Error al guardar el borrador." });
    } finally {
      setGuardando(false);
    }
  };

  // Publicar Cambios
  const handlePublicar = async () => {
    if (!confirm("¿Deseas publicar esta configuración en la web pública? Los cambios serán visibles inmediatamente para los clientes.")) {
      return;
    }
    setGuardando(true);
    setMensaje(null);
    try {
      await publicarConfiguracionWeb({
        empresa: editEmpresa,
        web: editWeb,
        temaId: tema.id,
        oficioId: oficio.id,
      });
      setMensaje({ tipo: "ok", texto: "¡Configuración y Web Comercial publicadas con éxito!" });
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err?.message || "Error al publicar la configuración." });
    } finally {
      setGuardando(false);
    }
  };

  // Ver como titular (previsualización de permisos sin alterar identidad ni sesión real)
  const handleVerComoTitular = () => {
    if (modoVistaPrevia === "titular") {
      setModoVistaPrevia(null);
      setMensaje({ tipo: "ok", texto: "Vista previa desactivada. Has vuelto al modo Administrador." });
    } else {
      setModoVistaPrevia("titular");
      setMensaje({
        tipo: "ok",
        texto: "Modo vista previa Titular activado. Así verá la configuración el titular con los ajustes técnicos bloqueados.",
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-8 pb-28">
      {/* Cabecera del Configurador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Administración de la Instalación
            </h1>
            <Badge variant="outline" className="border-orange-500/30 text-orange-600 bg-orange-50/50 dark:bg-orange-950/20">
              Panel Técnico
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión técnica y personalización de la plataforma. Separada del uso diario del titular.
          </p>
        </div>

        {/* Acceso Explícito: Ver como titular & Acciones Principales */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleVerComoTitular}
            variant={modoVistaPrevia === "titular" ? "default" : "outline"}
            className={`text-xs font-bold gap-1.5 ${
              modoVistaPrevia === "titular"
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "border-orange-500/40 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
            }`}
            title="Simula la experiencia de permisos que tendrá el titular sin alterar la sesión real"
          >
            <UserCheck className="h-4 w-4" />
            <span>{modoVistaPrevia === "titular" ? "Salir de Vista Previa" : "Ver como Titular"}</span>
          </Button>

          <Link
            href="/web?preview=1"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 border border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 text-amber-900 dark:text-amber-200 transition-colors"
            title="Previsualizar borrador comercial antes de publicar"
          >
            <Eye className="h-4 w-4 text-amber-600" />
            <span>Previsualizar Borrador</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>

          <Link
            href="/web"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Ver la web pública tal como la ven los clientes en este momento"
          >
            <span>Ver Web Publicada</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>

          <Button
            onClick={handleGuardarBorrador}
            disabled={guardando}
            variant="outline"
            className="text-xs font-bold gap-1.5"
          >
            <Save className="h-4 w-4 text-slate-500" />
            <span>Guardar Borrador</span>
          </Button>

          <Button
            onClick={handlePublicar}
            disabled={guardando}
            className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Publicar</span>
          </Button>
        </div>
      </div>

      {/* Banner de Previsualización Titular Activo */}
      {modoVistaPrevia === "titular" && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Modo de previsualización:</strong> Viendo la interfaz con permisos de <strong>Titular</strong> (los ajustes técnicos de nivel, módulos, oficio y tema están bloqueados).
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs bg-white dark:bg-slate-900 border-amber-300 ml-3 shrink-0"
            onClick={() => setModoVistaPrevia(null)}
          >
            Volver a Administrador
          </Button>
        </div>
      )}

      {/* Banner de Mensaje / Alerta */}
      {mensaje && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between ${
            mensaje.tipo === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
              : mensaje.tipo === "warn"
              ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          <span>{mensaje.texto}</span>
          <button onClick={() => setMensaje(null)} className="font-bold underline ml-2 cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* Indicador de Rol y Estado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Estado de Publicación:</span>
          {estadoPublicacion === "borrador" ? (
            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              Borrador pendiente de publicar
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              Publicado en producción
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>
            Sesión: <strong>{usuarioEmail || "Sin sesión"}</strong> ({esAdminEfectivo ? "Administrador de Instalación" : "Titular"})
          </span>
        </div>
      </div>

      {/* SECCIÓN 1: NIVEL CONTRATADO (PAQUETES PREDEFINIDOS) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
              <Layers className="h-5 w-5 text-purple-600" />
              1. Nivel de la Instalación (Paquetes Predefinidos)
            </CardTitle>
            {!esAdminEfectivo && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-50/40 gap-1">
                <Lock className="h-3 w-3" /> Solo Administrador
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Al seleccionar un paquete, el <strong>administrador de la instalación</strong> carga una selección inicial de módulos recomendada.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => aplicarPaqueteNivel("basico")}
              className={`p-4 rounded-2xl border transition-all ${
                plan.nivel === "basico"
                  ? "border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 ring-2 ring-purple-500/20 shadow-sm"
                  : "border-slate-200 dark:border-slate-800"
              } ${esAdminEfectivo ? "cursor-pointer hover:border-purple-300" : "opacity-80 cursor-not-allowed"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Paquete 1: Básico</span>
                {plan.nivel === "basico" && <Badge className="bg-purple-600 text-white text-[10px]">Activo</Badge>}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Selección inicial: Presupuestos directos, cartera de clientes, informes fotográficos y web comercial. Sin obras.
              </p>
            </div>

            <div
              onClick={() => aplicarPaqueteNivel("organizado")}
              className={`p-4 rounded-2xl border transition-all ${
                plan.nivel === "organizado"
                  ? "border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 ring-2 ring-purple-500/20 shadow-sm"
                  : "border-slate-200 dark:border-slate-800"
              } ${esAdminEfectivo ? "cursor-pointer hover:border-purple-300" : "opacity-80 cursor-not-allowed"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Paquete 2: Organizado</span>
                {plan.nivel === "organizado" && <Badge className="bg-purple-600 text-white text-[10px]">Activo</Badge>}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Selección inicial completa: Todo lo anterior más seguimiento de obras/trabajos, agenda de citas, compras y albaranes.
              </p>
            </div>
          </div>

          {!esAdminEfectivo && (
            <p className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>Esta decisión corresponde en exclusiva al <strong>administrador de la instalación</strong>. El titular no puede modificar el plan contratado.</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN 2: MÓDULOS HABILITADOS (INTERRUPTORES EXCLUSIVOS DEL ADMINISTRADOR) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
              <Sliders className="h-5 w-5 text-indigo-600" />
              2. Módulos Habilitados (Exclusivo del Administrador)
            </CardTitle>
            {!esAdminEfectivo && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-50/40 gap-1">
                <Lock className="h-3 w-3" /> Solo Administrador
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Ajusta granularmente qué módulos están operativos en esta instalación. Al desactivar un módulo, se ocultan sus menús y se bloquea el acceso directo, conservando los datos existentes para una posible reactivación.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Listado de interruptores */}
          {[
            {
              id: "presupuestos",
              nombre: "Presupuestos",
              desc: "Emisión de propuestas, partidas detalladas y exportación a PDF.",
              obligatorio: false,
            },
            {
              id: "informes",
              nombre: "Informes Fotográficos",
              desc: "Reportes técnicos con fotografías a pie de obra para clientes.",
              obligatorio: false,
            },
            {
              id: "obras",
              nombre: `${terminos.trabajos} (Gestión de Trabajos)`,
              desc: "Seguimiento centralizado de obras activas. Recuerda que Agenda y Compras funcionan perfectamente sin este módulo.",
              obligatorio: false,
            },
            {
              id: "agenda",
              nombre: "Agenda de Citas y Visitas",
              desc: "Programación de visitas con hora local de Madrid. Funciona con o sin obras.",
              obligatorio: false,
            },
            {
              id: "compras",
              nombre: "Compras y Listas de Materiales",
              desc: "Control de materiales por proveedor o gremio. Funciona con o sin obras.",
              obligatorio: false,
            },
            {
              id: "albaranes",
              nombre: "Albaranes y Entregas",
              desc: "Albaranes correlativos firmados por el cliente para certificar entregas.",
              obligatorio: false,
            },
            {
              id: "clientes",
              nombre: "Cartera de Clientes (Módulo Compartido)",
              desc: "Directorio centralizado. Se mantiene activo automáticamente si hay presupuestos, obras o informes habilitados.",
              obligatorio: true,
            },
          ].map((m) => {
            const cap = m.id as Capacidad;
            const activo = modulosActivos.includes(cap);
            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  activo
                    ? "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-800"
                    : "bg-slate-100/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-900 opacity-75"
                }`}
              >
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {m.nombre}
                    </span>
                    {activo ? (
                      <Badge className="bg-emerald-600 text-white text-[10px]">Habilitado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 text-[10px]">Desactivado</Badge>
                    )}
                    {m.obligatorio && (
                      <Badge variant="outline" className="border-indigo-400 text-indigo-600 dark:text-indigo-400 text-[10px]">
                        Compartido
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {m.desc}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!esAdminEfectivo}
                  onClick={() => toggleModulo(cap)}
                  className={`p-1.5 rounded-xl transition-colors shrink-0 ${
                    esAdminEfectivo
                      ? "hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                      : "cursor-not-allowed opacity-50"
                  }`}
                  title={esAdminEfectivo ? "Conmutar módulo" : "Solo el administrador de la instalación puede cambiar módulos"}
                >
                  {activo ? (
                    <ToggleRight className="h-7 w-7 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-slate-400" />
                  )}
                </button>
              </div>
            );
          })}

          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              <strong>Garantía de preservación:</strong> Desactivar un módulo solo oculta su visibilidad para el titular y bloquea su acceso directo. Si el cliente decide contratarlo o activarlo en el futuro, todos los datos históricos (números de albarán, compras anteriores, eventos) se conservarán intactos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN 3: PREFERENCIAS OPERATIVAS DEL TITULAR */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
            <Sliders className="h-5 w-5 text-amber-600" />
            3. Ajustes Cotidianos del Titular
          </CardTitle>
          <p className="text-xs text-slate-500">
            Ajustes de flujo diario que sí corresponden a la operativa del titular del negocio.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs cursor-pointer">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Agrupar por Obras/Trabajos</span>
              <span className="text-[11px] text-slate-500">
                Si está desactivado, oculta la sección de Obras y permite operar compras y agenda de manera 100% libre.
              </span>
            </div>
            <input
              type="checkbox"
              checked={preferencias.agruparPorObra}
              onChange={(e) => setPreferencias({ agruparPorObra: e.target.checked })}
              className="h-4 w-4 rounded border-slate-400 text-orange-600 focus:ring-0 cursor-pointer ml-4"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs cursor-pointer">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Selector de Gremios Múltiple</span>
              <span className="text-[11px] text-slate-500">
                Permite clasificar partidas por albañilería, fontanería, electricidad, etc. Ocultar si solo trabajas un único gremio.
              </span>
            </div>
            <input
              type="checkbox"
              checked={preferencias.mostrarSelectorGremios}
              onChange={(e) => setPreferencias({ mostrarSelectorGremios: e.target.checked })}
              className="h-4 w-4 rounded border-slate-400 text-orange-600 focus:ring-0 cursor-pointer ml-4"
            />
          </label>
        </CardContent>
      </Card>

      {/* SECCIÓN 4: ACTIVIDAD COMERCIAL (OFICIO) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
              <Briefcase className="h-5 w-5 text-sky-600" />
              4. Actividad Comercial y Catálogo de Oficios
            </CardTitle>
            {!esAdminEfectivo && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-50/40 gap-1">
                <Lock className="h-3 w-3" /> Solo Administrador
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Ajusta el vocabulario de la instalación ({oficio.vocabulario.trabajosNombre}) y las unidades de medida. Las tarifas quedan vacías hasta que el titular configure sus precios.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.keys(CATALOGO_OFICIOS).map((k) => {
              const oKey = k as TipoOficio;
              const oCfg = CATALOGO_OFICIOS[oKey];
              const isSelected = oficio.id === oKey;
              return (
                <button
                  key={oKey}
                  type="button"
                  disabled={!esAdminEfectivo}
                  onClick={async () => {
                    if (!esAdminEfectivo) return;
                    try {
                      await setOficio(oKey);
                    } catch (err: any) {
                      setMensaje({ tipo: "error", texto: `Error cambiando oficio: ${err?.message || "Operación fallida"}` });
                    }
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    !esAdminEfectivo ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                  } ${
                    isSelected
                      ? "border-sky-600 bg-sky-50/50 dark:bg-sky-950/20 ring-2 ring-sky-500/20 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    {oCfg.nombre}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Término: {oCfg.vocabulario.trabajosNombre}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN 5: DATOS DE EMPRESA E IDENTIDAD */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
            <Building2 className="h-5 w-5 text-orange-600" />
            5. Datos de Empresa e Identidad Comercial
          </CardTitle>
          <p className="text-xs text-slate-500">
            Aparecen en presupuestos, albaranes, encabezados y en la presentación pública.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Nombre Comercial</label>
              <input
                type="text"
                value={editEmpresa.nombreComercial || ""}
                onChange={(e) => setEditEmpresa({ ...editEmpresa, nombreComercial: e.target.value })}
                placeholder="Ej. IMANOX REFORMAS"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Subtítulo / Especialidad</label>
              <input
                type="text"
                value={editEmpresa.subtitulo || ""}
                onChange={(e) => setEditEmpresa({ ...editEmpresa, subtitulo: e.target.value })}
                placeholder="Ej. Reformas Integrales y Baños"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">CIF / NIF</label>
              <input
                type="text"
                value={editEmpresa.cifNif || ""}
                onChange={(e) => setEditEmpresa({ ...editEmpresa, cifNif: e.target.value })}
                placeholder="Ej. B-88776655 o 12345678Z"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Teléfono de Contacto</label>
              <input
                type="text"
                value={editEmpresa.telefono || ""}
                onChange={(e) => setEditEmpresa({ ...editEmpresa, telefono: e.target.value })}
                placeholder="Ej. 622 11 44 55"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Email Comercial</label>
              <input
                type="email"
                value={editEmpresa.email || ""}
                onChange={(e) => setEditEmpresa({ ...editEmpresa, email: e.target.value })}
                placeholder="Ej. info@empresa.es"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Color Primario de Marca</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editEmpresa.colorPrimario || "#ea580c"}
                  onChange={(e) => setEditEmpresa({ ...editEmpresa, colorPrimario: e.target.value })}
                  className="h-9 w-12 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={editEmpresa.colorPrimario || "#ea580c"}
                  onChange={(e) => setEditEmpresa({ ...editEmpresa, colorPrimario: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Dirección / Sede</label>
              <input
                type="text"
                value={editEmpresa.direccion || ""}
                onChange={(e) => setEditEmpresa({ ...editEmpresa, direccion: e.target.value })}
                placeholder="Ej. Calle Mayor 10, Madrid"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN 6: TEMA DE DISEÑO */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
              <Palette className="h-5 w-5 text-indigo-600" />
              6. Tema de Diseño y Aspecto Visual
            </CardTitle>
            {!esAdminEfectivo && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-50/40 gap-1">
                <Lock className="h-3 w-3" /> Solo Administrador
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
            El corazón de la app está desacoplado de los temas. Actualmente usa el tema profesional limpio, compatible con los futuros temas de Stitch.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(CATALOGO_TEMAS).map((t) => (
              <div
                key={t.id}
                onClick={async () => {
                  if (!esAdminEfectivo) return;
                  try {
                    await setTemaId(t.id);
                  } catch (err: any) {
                    setMensaje({ tipo: "error", texto: `Error cambiando tema: ${err?.message || "Operación fallida"}` });
                  }
                }}
                className={`p-4 rounded-2xl border transition-all ${
                  !esAdminEfectivo ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                } ${
                  tema.id === t.id
                    ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{t.nombre}</span>
                  {tema.id === t.id && (
                    <Badge className="bg-indigo-600 text-white text-[10px]">Activo</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: t.colorPrimario }} />
                  <div className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: t.colorSecundario }} />
                  <span className="text-[11px] text-slate-400 font-mono ml-2">Tokens limpios</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN 7: CONTENIDO DE LA WEB PÚBLICA */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
            <Globe className="h-5 w-5 text-emerald-600" />
            7. Web Comercial Pública (Borrador / Publicación)
          </CardTitle>
          <p className="text-xs text-slate-500">
            Contenido accesible para clientes en la ruta pública (<code className="font-mono text-orange-600">/web</code>). Modifica el borrador y publica cuando esté listo.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Título Principal de la Web</label>
              <input
                type="text"
                value={editWeb.titulo || ""}
                onChange={(e) => setEditWeb({ ...editWeb, titulo: e.target.value })}
                placeholder="Ej. Servicios Profesionales de Reformas y Construcción"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Subtítulo / Propuesta de Valor</label>
              <input
                type="text"
                value={editWeb.subtitulo || ""}
                onChange={(e) => setEditWeb({ ...editWeb, subtitulo: e.target.value })}
                placeholder="Ej. Presupuesto cerrado, compromiso y garantía profesional"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Descripción de la Empresa</label>
              <textarea
                rows={3}
                value={editWeb.descripcion || ""}
                onChange={(e) => setEditWeb({ ...editWeb, descripcion: e.target.value })}
                placeholder="Describe la experiencia de la empresa y cómo ayuda a sus clientes..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Zona de Cobertura / Atención</label>
                <input
                  type="text"
                  value={editWeb.zonaAtencion || ""}
                  onChange={(e) => setEditWeb({ ...editWeb, zonaAtencion: e.target.value })}
                  placeholder="Ej. Madrid capital, Pozuelo, Las Rozas, Majadahonda"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Teléfono Público de Contacto</label>
                <input
                  type="text"
                  value={editWeb.telefonoContacto || ""}
                  onChange={(e) => setEditWeb({ ...editWeb, telefonoContacto: e.target.value })}
                  placeholder="Ej. 622 11 44 55"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Bloque de Servicios Destacados */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Servicios Destacados ({editWeb.servicios?.length || 0})
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[11px] gap-1"
                onClick={() =>
                  setEditWeb({
                    ...editWeb,
                    servicios: [
                      ...(editWeb.servicios || []),
                      { titulo: "Nuevo Servicio", descripcion: "Descripción del servicio prestado." },
                    ],
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir Servicio
              </Button>
            </div>

            <div className="space-y-2">
              {(editWeb.servicios || []).map((srv, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-start gap-3"
                >
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={srv.titulo}
                      onChange={(e) => {
                        const next = [...editWeb.servicios];
                        next[idx].titulo = e.target.value;
                        setEditWeb({ ...editWeb, servicios: next });
                      }}
                      placeholder="Título del servicio"
                      className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <input
                      type="text"
                      value={srv.descripcion}
                      onChange={(e) => {
                        const next = [...editWeb.servicios];
                        next[idx].descripcion = e.target.value;
                        setEditWeb({ ...editWeb, servicios: next });
                      }}
                      placeholder="Descripción detallada"
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = editWeb.servicios.filter((_, i) => i !== idx);
                      setEditWeb({ ...editWeb, servicios: next });
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
