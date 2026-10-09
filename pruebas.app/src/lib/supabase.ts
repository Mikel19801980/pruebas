import { createClient } from "@supabase/supabase-js";
export { GREMIOS, type GremioType } from "./utils";

export type EstadoProyecto = "Pendiente" | "En curso" | "Terminado";
export type EstadoPresupuesto = "Borrador" | "Enviado" | "Aceptado" | "Rechazado";
export type TipoEvento = "Visita" | "Trabajo" | "Reunión";

export interface Proyecto {
  id: string;
  titulo: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
  cliente_id?: string | null;
  estado: EstadoProyecto;
  fecha_inicio: string;
  created_at?: string;
}

export interface Presupuesto {
  id: string;
  titulo?: string;
  cliente_nombre?: string;
  cliente_telefono?: string | null;
  cliente_id?: string | null;
  proyecto_id: string | null;
  total: number;
  forma_pago?: string;
  forma_pago_tipo?: string;
  fecha_emision?: string | null;
  enlace_pdf: string | null;
  estado: EstadoPresupuesto;
  created_at?: string;
  proyecto?: Proyecto;
}

export const UNIDADES_MEDICION = ["m²", "ml", "ud", "pa", "h", "kg"] as const;
export type UnidadMedicion = (typeof UNIDADES_MEDICION)[number];

export interface PartidaPresupuesto {
  id: string;
  presupuesto_id: string;
  concepto: string;
  gremio: string;
  cantidad?: number;
  unidad?: string;
  precio_unitario?: number;
  precio: number;
  foto_url: string | null;
  created_at?: string;
}

export interface ListaCompra {
  id: string;
  proyecto_id?: string | null;
  cliente_id?: string | null;
  material: string;
  proveedor: string;
  gremio?: string;
  comprado: boolean;
  created_at?: string;
  proyecto?: Proyecto;
}

export interface EventoAgenda {
  id: string;
  proyecto_id?: string | null;
  cliente_id?: string | null;
  cliente_nombre?: string | null;
  titulo: string;
  fecha_hora: string;
  tipo: TipoEvento;
  gremio?: string;
  created_at?: string;
  proyecto?: Proyecto;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  nif?: string | null;
  notas?: string | null;
  created_at?: string;
}

export interface FotoInforme {
  id: string;
  url: string;
  pie?: string;
  nota?: string;
}

export interface Informe {
  id: string;
  cliente_nombre: string;
  cliente_telefono?: string | null;
  cliente_id?: string | null;
  titulo: string;
  descripcion?: string | null;
  fotos: FotoInforme[];
  proyecto_id?: string | null;
  fecha: string;
  created_at?: string;
}

export interface LineaAlbaran {
  id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
}

export interface Albaran {
  id: string;
  numero: string;
  cliente_nombre: string;
  cliente_telefono?: string | null;
  proyecto_id?: string | null;
  fecha: string;
  lineas: LineaAlbaran[];
  observaciones?: string | null;
  created_at?: string;
}

export interface ParteTrabajo {
  id: string;
  autor_nombre: string;
  trabajo_o_cliente: string;
  fecha: string;
  que_se_hizo: string;
  horas_texto?: string | null;
  materiales_texto?: string | null;
  fotos: string[];
  terminado: boolean;
  created_at?: string;
}

export interface ConfiguracionEmpresaRecord {
  id: string;
  admin_email?: string | null;
  titular_email?: string | null;
  oficio_id: string;
  plan_nivel: string;
  tema_id?: string;
  empresa: any;
  preferencias: any;
  web_publica?: any;
  borrador_web_publica?: any;
  borrador_empresa?: any;
  estado_publicacion?: string;
  updated_at?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// SEED INICIAL PARA MODO LOCAL / DEMO
// ==========================================
const INITIAL_PROYECTOS: Proyecto[] = [
  {
    id: "p1-almenara",
    titulo: "Reforma Baño Almenara",
    cliente_nombre: "Carlos Martínez",
    cliente_telefono: "622114455",
    estado: "En curso",
    fecha_inicio: new Date().toISOString().slice(0, 10),
  },
  {
    id: "p2-cocina",
    titulo: "Reforma Cocina Sagunto",
    cliente_nombre: "Lucía Gómez",
    cliente_telefono: "633998877",
    estado: "Pendiente",
    fecha_inicio: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
  },
];

const INITIAL_PRESUPUESTOS: Presupuesto[] = [
  {
    id: "pres-1",
    titulo: "Reforma Baño Almenara",
    cliente_nombre: "Carlos Martínez",
    cliente_telefono: "622114455",
    proyecto_id: "p1-almenara",
    total: 3850,
    forma_pago: "10% reserva y firma del presupuesto, 40% inicio de demolición y fontanería, 30% alicatado y sanitarios, 20% remates finales y entrega.",
    forma_pago_tipo: "porcentajes",
    enlace_pdf: null,
    estado: "Enviado",
    created_at: new Date().toISOString(),
  },
  {
    id: "pres-2",
    titulo: "Cambio de Plato de Ducha y Mampara",
    cliente_nombre: "Mariano Serrano",
    cliente_telefono: "644123456",
    proyecto_id: null, // Presupuesto previo para cliente potencial
    total: 1650,
    forma_pago: "10% a la aceptación, 50% al inicio de trabajos, 40% a la colocación de mampara y prueba de agua.",
    forma_pago_tipo: "porcentajes",
    enlace_pdf: null,
    estado: "Borrador",
    created_at: new Date().toISOString(),
  },
];

const INITIAL_PARTIDAS: PartidaPresupuesto[] = [
  {
    id: "par-1",
    presupuesto_id: "pres-1",
    concepto: "Picado de azulejos antiguos y desescombro a vertedero",
    gremio: "Albañilería",
    cantidad: 30,
    unidad: "m²",
    precio_unitario: 25,
    precio: 750,
    foto_url: null,
  },
  {
    id: "par-2",
    presupuesto_id: "pres-1",
    concepto: "Instalación de fontanería multicapa y plato de ducha de resina",
    gremio: "Fontanería",
    cantidad: 1,
    unidad: "ud",
    precio_unitario: 1200,
    precio: 1200,
    foto_url: null,
  },
  {
    id: "par-3",
    presupuesto_id: "pres-1",
    concepto: "Alicatado porcelánico rectificado 60x120 y enlechado",
    gremio: "Albañilería",
    cantidad: 35,
    unidad: "m²",
    precio_unitario: 40,
    precio: 1400,
    foto_url: null,
  },
  {
    id: "par-4",
    presupuesto_id: "pres-1",
    concepto: "Falso techo de Pladur hidrófugo y dos puntos de luz LED",
    gremio: "Pladur",
    cantidad: 1,
    unidad: "pa",
    precio_unitario: 500,
    precio: 500,
    foto_url: null,
  },
  {
    id: "par-5",
    presupuesto_id: "pres-2",
    concepto: "Demolición bañera, desescombro y bajada a cota de plato",
    gremio: "Albañilería",
    cantidad: 1,
    unidad: "pa",
    precio_unitario: 450,
    precio: 450,
    foto_url: null,
  },
  {
    id: "par-6",
    presupuesto_id: "pres-2",
    concepto: "Suministro e instalación plato de resina pizarra 120x80 y mampara cromo",
    gremio: "Fontanería",
    cantidad: 1,
    unidad: "ud",
    precio_unitario: 1200,
    precio: 1200,
    foto_url: null,
  },
];

const INITIAL_COMPRAS: ListaCompra[] = [
  {
    id: "c-1",
    proyecto_id: "p1-almenara",
    material: "10 sacos de cemento cola C2TE y crucetas 1.5mm",
    proveedor: "Obramat / Bricomart",
    gremio: "Albañilería",
    comprado: false,
  },
  {
    id: "c-2",
    proyecto_id: "p1-almenara",
    material: "Bote sifónico extraplano y 4m tubo PVC 40mm",
    proveedor: "Almacén Fontanería",
    gremio: "Fontanería",
    comprado: true,
  },
  {
    id: "c-3",
    proyecto_id: "p2-cocina",
    material: "Placas pladur hidrófugo y montantes 48mm",
    proveedor: "Obramat / Bricomart",
    gremio: "Pladur",
    comprado: false,
  },
  {
    id: "c-4",
    proyecto_id: "p1-almenara",
    material: "Perfil mampara cromo y anclajes especiales",
    proveedor: "Cerrajería Almenara",
    gremio: "Cerrajería",
    comprado: false,
  },
];

const INITIAL_EVENTOS: EventoAgenda[] = [
  {
    id: "e-1",
    proyecto_id: "p1-almenara",
    titulo: "Instalación de tuberías y desagüe ducha",
    fecha_hora: new Date(Date.now() + 3600000 * 2).toISOString(),
    tipo: "Trabajo",
    gremio: "Fontanería",
  },
  {
    id: "e-2",
    proyecto_id: "p1-almenara",
    titulo: "Recepción de alicatado y comprobación niveles",
    fecha_hora: new Date(Date.now() + 86400000).toISOString(),
    tipo: "Visita",
    gremio: "Albañilería",
  },
  {
    id: "e-3",
    proyecto_id: "p2-cocina",
    titulo: "Medición final de encimera con cliente",
    fecha_hora: new Date(Date.now() + 86400000 * 2).toISOString(),
    tipo: "Reunión",
    gremio: "General",
  },
];

const INITIAL_CLIENTES: Cliente[] = [
  {
    id: "cli-1",
    nombre: "Carlos Martínez",
    telefono: "622114455",
    email: "carlos.martinez@gmail.com",
    direccion: "Calle Mayor 14, 2ºB",
    notas: "Cliente preferente. Obra de baño.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cli-2",
    nombre: "Mariano Serrano",
    telefono: "644123456",
    email: "mariano.serrano@hotmail.com",
    direccion: "Av. Constitución 89",
    notas: "Interesado en cambio de bañera por plato.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cli-3",
    nombre: "Lucía Gómez",
    telefono: "633998877",
    email: "lucia.gomez@empresa.es",
    direccion: "Calle Sol 5",
    notas: "Reforma de cocina.",
    created_at: new Date().toISOString(),
  },
];

const INITIAL_INFORMES: Informe[] = [
  {
    id: "inf-1",
    cliente_nombre: "Carlos Martínez",
    cliente_telefono: "622114455",
    cliente_id: "cli-1",
    titulo: "Inspección inicial de bajante y humedades",
    descripcion: "Se detecta fuga en el codo de desagüe de 40mm tras el falso techo. Procedemos a sanear antes de alicatar.",
    fotos: [],
    proyecto_id: "p1-almenara",
    fecha: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
  },
];

const INITIAL_ALBARANES: Albaran[] = [
  {
    id: "alb-1",
    numero: "ALB-2026-001",
    cliente_nombre: "Carlos Martínez",
    cliente_telefono: "622114455",
    proyecto_id: "p1-almenara",
    fecha: new Date().toISOString().slice(0, 10),
    lineas: [
      { id: "la-1", descripcion: "Plato de ducha pizarra 120x80 color antracita", cantidad: 1, unidad: "ud" },
      { id: "la-2", descripcion: "Mampara fija 90cm perfil negro mate", cantidad: 1, unidad: "ud" },
    ],
    observaciones: "Entregado a pie de obra con albarán firmado.",
    created_at: new Date().toISOString(),
  },
];

const INITIAL_PARTES: ParteTrabajo[] = [
  {
    id: "par-1",
    autor_nombre: "Manolo (Oficial)",
    trabajo_o_cliente: "Reforma Baño Almenara (Carlos Martínez)",
    fecha: new Date().toISOString().slice(0, 10),
    que_se_hizo: "Demolición de alicatado antiguo y desescombro completo en contenedor. Rozas de fontanería iniciadas.",
    horas_texto: "7 horas",
    materiales_texto: "10 sacos escombros",
    fotos: [],
    terminado: true,
    created_at: new Date().toISOString(),
  },
];

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(`imanox_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`imanox_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error("Error guardando en localStorage", e);
  }
}

// ==========================================
// SERVICIOS UNIFICADOS (SUPABASE CON FALLBACK)
// ==========================================

export const api = {
  // PROYECTOS
  async getProyectos(): Promise<Proyecto[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("proyectos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error obteniendo proyectos de Supabase:", error);
        throw new Error(error.message || "Error al cargar los proyectos");
      }
      return (data || []) as Proyecto[];
    }
    return getLocal<Proyecto[]>("proyectos", INITIAL_PROYECTOS);
  },

  async getProyectoById(id: string): Promise<Proyecto | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("proyectos").select("*").eq("id", id).maybeSingle();
      if (error) {
        console.error("Error obteniendo proyecto por ID de Supabase:", error);
        throw new Error(error.message || "Error al cargar el proyecto");
      }
      return data as Proyecto | null;
    }
    const all = await this.getProyectos();
    return all.find((p) => p.id === id) || null;
  },

  async createProyecto(proyecto: Omit<Proyecto, "id">): Promise<Proyecto> {
    const newId = crypto.randomUUID();
    const item: Proyecto = { ...proyecto, id: newId, created_at: new Date().toISOString() };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("proyectos").insert([item]).select().single();
      if (error) {
        console.error("Error creando proyecto en Supabase:", error);
        throw new Error(error.message || "Error al guardar el proyecto");
      }
      return data as Proyecto;
    }
    const current = getLocal<Proyecto[]>("proyectos", INITIAL_PROYECTOS);
    const updated = [item, ...current];
    setLocal("proyectos", updated);
    return item;
  },

  async updateProyectoEstado(id: string, estado: EstadoProyecto): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("proyectos").update({ estado }).eq("id", id);
      if (error) {
        console.error("Error actualizando estado del proyecto en Supabase:", error);
        throw new Error(error.message || "Error al actualizar el proyecto");
      }
      return;
    }
    const current = getLocal<Proyecto[]>("proyectos", INITIAL_PROYECTOS);
    const updated = current.map((p) => (p.id === id ? { ...p, estado } : p));
    setLocal("proyectos", updated);
  },

  // PRESUPUESTOS
  async getPresupuestos(proyectoId?: string): Promise<Presupuesto[]> {
    if (isSupabaseConfigured) {
      let query = supabase.from("presupuestos").select("*, proyecto:proyectos(*)");
      if (proyectoId) query = query.eq("proyecto_id", proyectoId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) {
        console.error("Error obteniendo presupuestos de Supabase:", error);
        throw new Error(error.message || "Error al cargar presupuestos");
      }
      return (data || []) as Presupuesto[];
    }
    const all = getLocal<Presupuesto[]>("presupuestos", INITIAL_PRESUPUESTOS);
    const proyectos = getLocal<Proyecto[]>("proyectos", INITIAL_PROYECTOS);
    const enriched = all.map((p) => ({
      ...p,
      proyecto: p.proyecto_id ? proyectos.find((proj) => proj.id === p.proyecto_id) : undefined,
    }));
    return proyectoId ? enriched.filter((p) => p.proyecto_id === proyectoId) : enriched;
  },

  async getPresupuestoById(id: string): Promise<Presupuesto | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("presupuestos")
        .select("*, proyecto:proyectos(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.error("Error obteniendo presupuesto de Supabase:", error);
        throw new Error(error.message || "Error al cargar el presupuesto");
      }
      return data as Presupuesto | null;
    }
    const all = await this.getPresupuestos();
    return all.find((p) => p.id === id) || null;
  },

  async createPresupuesto(presupuesto: Omit<Presupuesto, "id">): Promise<Presupuesto> {
    const fechaActual = new Date().toISOString().slice(0, 10);
    const item: Presupuesto = {
      titulo: presupuesto.titulo || "Presupuesto",
      cliente_nombre: presupuesto.cliente_nombre || "Cliente",
      cliente_telefono: presupuesto.cliente_telefono || null,
      cliente_id: presupuesto.cliente_id || null,
      forma_pago: presupuesto.forma_pago || "10% reserva y firma, 40% inicio, 30% avance, 20% entrega.",
      forma_pago_tipo: presupuesto.forma_pago_tipo || "porcentajes",
      fecha_emision: presupuesto.fecha_emision || fechaActual,
      ...presupuesto,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("presupuestos").insert([item]).select().single();
      if (error) {
        console.error("Error creando presupuesto en Supabase:", error);
        throw new Error(error.message || "Error al guardar el presupuesto en Supabase");
      }
      return data as Presupuesto;
    }
    const current = getLocal<Presupuesto[]>("presupuestos", INITIAL_PRESUPUESTOS);
    setLocal("presupuestos", [item, ...current]);
    return item;
  },

  async updatePresupuesto(id: string, updates: Partial<Presupuesto>): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("presupuestos").update(updates).eq("id", id);
      if (error) {
        console.error("Error actualizando presupuesto en Supabase:", error);
        throw new Error(error.message || "Error al actualizar el presupuesto");
      }
      return;
    }
    const current = getLocal<Presupuesto[]>("presupuestos", INITIAL_PRESUPUESTOS);
    setLocal(
      "presupuestos",
      current.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  },

  // CONVERTIR PRESUPUESTO ACEPTADO EN PROYECTO DE OBRA (ATÓMICO E IDEMPOTENTE)
  _conversionesEnCurso: new Map<string, Promise<Proyecto>>(),

  async convertirPresupuestoEnProyecto(presupuestoId: string): Promise<Proyecto> {
    // Si ya hay una conversión en curso para este presupuesto en esta sesión, reutilizar la misma Promise
    if (this._conversionesEnCurso.has(presupuestoId)) {
      return this._conversionesEnCurso.get(presupuestoId)!;
    }

    const ejecucion = (async () => {
      if (isSupabaseConfigured) {
        // En modo real con Supabase, la conversión DEBE ser atómica a través de la función RPC
        // con bloqueo FOR UPDATE en la base de datos para garantizar que nunca se dupliquen obras.
        // No se permite el método secuencial alternativo.
        const { data, error } = await supabase.rpc("convertir_presupuesto_en_proyecto", {
          p_presupuesto_id: presupuestoId,
        });

        if (error) {
          console.error("Error en RPC convertir_presupuesto_en_proyecto:", error);
          if (
            error.message?.includes("function") ||
            error.message?.includes("does not exist") ||
            error.code === "PGRST202"
          ) {
            throw new Error(
              "Para convertir presupuestos en obras de forma atómica y evitar duplicados, es necesario aplicar la migración SQL en Supabase (función convertir_presupuesto_en_proyecto). Por favor, ejecuta supabase_schema.sql en el SQL Editor de Supabase."
            );
          }
          throw new Error(error.message || "Error al convertir presupuesto en obra");
        }

        if (data) {
          return data as Proyecto;
        }
        throw new Error("No se pudo obtener el proyecto generado tras la conversión");
      }

      // 2. Fallback transaccional / local
      const pres = await this.getPresupuestoById(presupuestoId);
      if (!pres) throw new Error("Presupuesto no encontrado");

      // Si ya tiene proyecto asociado, retornar ese proyecto inmediatamente para evitar duplicados
      if (pres.proyecto_id) {
        const projs = await this.getProyectos();
        const existing = projs.find((p) => p.id === pres.proyecto_id);
        if (existing) return existing;
      }

      // Crear el nuevo proyecto de obra activa vinculando cliente_id
      const nuevoProyecto = await this.createProyecto({
        titulo: pres.titulo || "Reforma",
        cliente_nombre: pres.cliente_nombre || "Cliente",
        cliente_telefono: pres.cliente_telefono || null,
        cliente_id: pres.cliente_id || null,
        estado: "En curso",
        fecha_inicio: new Date().toISOString().slice(0, 10),
      });

      // Vincular el proyecto creado al presupuesto
      try {
        await this.updatePresupuesto(presupuestoId, {
          proyecto_id: nuevoProyecto.id,
          estado: "Aceptado",
        });
      } catch (err) {
        // Si falla la vinculación, revertir inmediatamente eliminando la obra creada para no dejar registros huérfanos
        console.error("Fallo al vincular presupuesto. Revirtiendo creación de obra...");
        try {
          if (isSupabaseConfigured) {
            await supabase.from("proyectos").delete().eq("id", nuevoProyecto.id);
          } else {
            const current = getLocal<Proyecto[]>("proyectos", INITIAL_PROYECTOS);
            setLocal("proyectos", current.filter((p) => p.id !== nuevoProyecto.id));
          }
        } catch (cleanupErr) {
          console.error("Error en rollback de obra:", cleanupErr);
        }
        throw new Error("No se pudo vincular el presupuesto a la obra. Se ha cancelado la operación para evitar obras duplicadas.");
      }

      return nuevoProyecto;
    })();

    this._conversionesEnCurso.set(presupuestoId, ejecucion);
    try {
      return await ejecucion;
    } finally {
      this._conversionesEnCurso.delete(presupuestoId);
    }
  },

  // PARTIDAS DE PRESUPUESTO
  async getPartidas(presupuestoId: string): Promise<PartidaPresupuesto[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("partidas_presupuesto")
        .select("*")
        .eq("presupuesto_id", presupuestoId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Error obteniendo partidas de Supabase:", error);
        throw new Error(error.message || "Error al cargar las partidas");
      }
      const rawPartidas = (data || []) as PartidaPresupuesto[];
      // Renovar URLs firmadas de fotos privadas de forma dinámica
      return await Promise.all(
        rawPartidas.map(async (p) => {
          if (p.foto_url) {
            const freshUrl = await this.getFotoUrl(p.foto_url);
            return { ...p, foto_url: freshUrl };
          }
          return p;
        })
      );
    }
    const all = getLocal<PartidaPresupuesto[]>("partidas", INITIAL_PARTIDAS);
    return all.filter((p) => p.presupuesto_id === presupuestoId);
  },

  async addPartida(partida: Omit<PartidaPresupuesto, "id">): Promise<PartidaPresupuesto> {
    const item: PartidaPresupuesto = { ...partida, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("partidas_presupuesto").insert([item]).select().single();
      if (error) {
        console.error("Error añadiendo partida a Supabase:", error);
        throw new Error(error.message || "Error al guardar la partida");
      }
      await this.recalculatePresupuestoTotal(partida.presupuesto_id);
      return data as PartidaPresupuesto;
    }
    const current = getLocal<PartidaPresupuesto[]>("partidas", INITIAL_PARTIDAS);
    const updated = [...current, item];
    setLocal("partidas", updated);
    await this.recalculatePresupuestoTotal(partida.presupuesto_id);
    return item;
  },

  async deletePartida(id: string, presupuestoId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("partidas_presupuesto").delete().eq("id", id);
      if (error) {
        console.error("Error eliminando partida de Supabase:", error);
        throw new Error(error.message || "Error al eliminar la partida");
      }
    } else {
      const current = getLocal<PartidaPresupuesto[]>("partidas", INITIAL_PARTIDAS);
      setLocal("partidas", current.filter((p) => p.id !== id));
    }
    await this.recalculatePresupuestoTotal(presupuestoId);
  },

  async recalculatePresupuestoTotal(presupuestoId: string): Promise<number> {
    const partidas = await this.getPartidas(presupuestoId);
    const total = partidas.reduce((acc, curr) => acc + (Number(curr.precio) || 0), 0);
    await this.updatePresupuesto(presupuestoId, { total });
    return total;
  },

  // LISTAS DE COMPRA
  async getCompras(proyectoId?: string): Promise<ListaCompra[]> {
    if (isSupabaseConfigured) {
      let query = supabase.from("listas_compra").select("*, proyecto:proyectos(*)");
      if (proyectoId) query = query.eq("proyecto_id", proyectoId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) {
        console.error("Error obteniendo compras de Supabase:", error);
        throw new Error(error.message || "Error al cargar la lista de compras");
      }
      return (data || []) as ListaCompra[];
    }
    const all = getLocal<ListaCompra[]>("compras", INITIAL_COMPRAS);
    const proyectos = getLocal<Proyecto[]>("proyectos", INITIAL_PROYECTOS);
    const enriched = all.map((c) => ({
      ...c,
      proyecto: proyectos.find((proj) => proj.id === c.proyecto_id),
    }));
    return proyectoId ? enriched.filter((c) => c.proyecto_id === proyectoId) : enriched;
  },

  async addCompra(compra: Omit<ListaCompra, "id">): Promise<ListaCompra> {
    const item: ListaCompra = {
      ...compra,
      proyecto_id: compra.proyecto_id || null,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("listas_compra").insert([item]).select().single();
      if (error) {
        console.error("Error creando compra en Supabase:", error);
        throw new Error(error.message || "Error al añadir el material a la lista de compras");
      }
      return data as ListaCompra;
    }
    const current = getLocal<ListaCompra[]>("compras", INITIAL_COMPRAS);
    const updated = [item, ...current];
    setLocal("compras", updated);
    return item;
  },

  async toggleCompra(id: string, comprado: boolean): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("listas_compra").update({ comprado }).eq("id", id);
      if (error) {
        console.error("Error actualizando compra en Supabase:", error);
        throw new Error(error.message || "Error al actualizar el estado del material");
      }
      return;
    }
    const current = getLocal<ListaCompra[]>("compras", INITIAL_COMPRAS);
    setLocal(
      "compras",
      current.map((c) => (c.id === id ? { ...c, comprado } : c))
    );
  },

  async deleteCompra(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("listas_compra").delete().eq("id", id);
      if (error) {
        console.error("Error eliminando compra en Supabase:", error);
        throw new Error(error.message || "Error al eliminar el material");
      }
      return;
    }
    const current = getLocal<ListaCompra[]>("compras", INITIAL_COMPRAS);
    setLocal("compras", current.filter((c) => c.id !== id));
  },

  // EVENTOS AGENDA
  async getEventos(proyectoId?: string): Promise<EventoAgenda[]> {
    if (isSupabaseConfigured) {
      let query = supabase.from("eventos_agenda").select("*, proyecto:proyectos(*)");
      if (proyectoId) query = query.eq("proyecto_id", proyectoId);
      const { data, error } = await query.order("fecha_hora", { ascending: true });
      if (error) {
        console.error("Error obteniendo eventos de Supabase:", error);
        throw new Error(error.message || "Error al cargar la agenda");
      }
      return (data || []) as EventoAgenda[];
    }
    const all = getLocal<EventoAgenda[]>("eventos", INITIAL_EVENTOS);
    const proyectos = getLocal<Proyecto[]>("proyectos", INITIAL_PROYECTOS);
    const enriched = all.map((e) => ({
      ...e,
      proyecto: proyectos.find((proj) => proj.id === e.proyecto_id),
    }));
    return proyectoId ? enriched.filter((e) => e.proyecto_id === proyectoId) : enriched;
  },

  async addEvento(evento: Omit<EventoAgenda, "id">): Promise<EventoAgenda> {
    const item: EventoAgenda = {
      ...evento,
      proyecto_id: evento.proyecto_id || null,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("eventos_agenda").insert([item]).select().single();
      if (error) {
        console.error("Error guardando evento en Supabase:", error);
        throw new Error(error.message || "Error al programar el evento en la agenda");
      }
      return data as EventoAgenda;
    }
    const current = getLocal<EventoAgenda[]>("eventos", INITIAL_EVENTOS);
    setLocal("eventos", [...current, item]);
    return item;
  },

  async updateEvento(id: string, updates: Partial<EventoAgenda>): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("eventos_agenda").update(updates).eq("id", id);
      if (error) {
        console.error("Error actualizando evento en Supabase:", error);
        throw new Error(error.message || "Error al actualizar la cita en la agenda");
      }
      return;
    }
    const current = getLocal<EventoAgenda[]>("eventos", INITIAL_EVENTOS);
    setLocal(
      "eventos",
      current.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  },

  async deleteEvento(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("eventos_agenda").delete().eq("id", id);
      if (error) {
        console.error("Error eliminando evento en Supabase:", error);
        throw new Error(error.message || "Error al cancelar la cita en la agenda");
      }
      return;
    }
    const current = getLocal<EventoAgenda[]>("eventos", INITIAL_EVENTOS);
    setLocal("eventos", current.filter((e) => e.id !== id));
  },

  // SUBIDA Y LECTURA DE FOTOS PRIVADAS (fotos_reformas)
  async uploadFoto(file: File): Promise<string> {
    if (isSupabaseConfigured) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `obras/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos_reformas")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error subiendo foto privada a Supabase Storage:", uploadError);
        throw new Error("No se pudo subir la fotografía privada: " + uploadError.message);
      }

      // Obtener URL firmada para visualización del usuario autorizado (válida 7 días)
      const { data: signedData } = await supabase.storage
        .from("fotos_reformas")
        .createSignedUrl(filePath, 60 * 60 * 24 * 7);

      return signedData?.signedUrl || filePath;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  },

  // SUBIDA DE FOTOS PÚBLICAS PARA LA WEB COMERCIAL (web_publica_fotos)
  async uploadFotoPublica(file: File): Promise<string> {
    if (isSupabaseConfigured) {
      const fileExt = file.name.split(".").pop();
      const fileName = `web-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `galeria/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("web_publica_fotos")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error subiendo foto pública a Supabase Storage:", uploadError);
        throw new Error("No se pudo subir la imagen pública: " + uploadError.message);
      }

      const { data } = supabase.storage.from("web_publica_fotos").getPublicUrl(filePath);
      return data.publicUrl;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  },

  // Obtener URL válida para mostrar una foto (gestiona URLs firmadas para el bucket privado fotos_reformas)
  async getFotoUrl(urlOrPath: string): Promise<string> {
    if (!urlOrPath) return "";
    if (!isSupabaseConfigured || urlOrPath.startsWith("data:")) return urlOrPath;

    // 1. Si es una ruta relativa directa del bucket privado (ej: "obras/archivo.jpg")
    if (urlOrPath.startsWith("obras/") || (!urlOrPath.startsWith("http") && !urlOrPath.startsWith("/"))) {
      try {
        const { data, error } = await supabase.storage
          .from("fotos_reformas")
          .createSignedUrl(urlOrPath, 60 * 60 * 24 * 7);
        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
      } catch (e) {
        console.warn("No se pudo generar URL firmada desde ruta relativa:", e);
      }
    }

    // 2. Si la URL apunta a fotos_reformas (URL firmada caducada o URL pública histórica)
    if (urlOrPath.includes("fotos_reformas/")) {
      try {
        let pathPart = urlOrPath.split("fotos_reformas/")[1].split("?")[0];
        // Decodificar posibles URI components en el path
        pathPart = decodeURIComponent(pathPart);
        const { data, error } = await supabase.storage
          .from("fotos_reformas")
          .createSignedUrl(pathPart, 60 * 60 * 24 * 7);
        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
      } catch (e) {
        console.warn("No se pudo regenerar URL firmada para foto privada:", e);
      }
    }
    return urlOrPath;
  },

  // ==========================================
  // CLIENTES (Módulo Básico / Todos)
  // ==========================================
  async getClientes(): Promise<Cliente[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("clientes").select("*").order("nombre", { ascending: true });
      if (error) {
        console.error("Error leyendo clientes de Supabase:", error);
        throw new Error(error.message || "Error al cargar la lista de clientes");
      }
      return (data || []) as Cliente[];
    }
    return getLocal<Cliente[]>("clientes", INITIAL_CLIENTES);
  },

  async getClienteById(id: string): Promise<Cliente | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
      if (error) {
        console.error("Error buscando cliente en Supabase:", error);
        throw new Error(error.message || "Error al consultar la ficha del cliente");
      }
      return data as Cliente | null;
    }
    const list = await this.getClientes();
    return list.find((c) => c.id === id) || null;
  },

  async createCliente(cliente: Omit<Cliente, "id">): Promise<Cliente> {
    const item: Cliente = { ...cliente, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("clientes").insert([item]).select().single();
      if (error) {
        console.error("Error creando cliente en Supabase:", error);
        throw new Error(error.message || "Error al registrar el nuevo cliente");
      }
      return data as Cliente;
    }
    const current = getLocal<Cliente[]>("clientes", INITIAL_CLIENTES);
    const updated = [item, ...current];
    setLocal("clientes", updated);
    return item;
  },

  async updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("clientes").update(updates).eq("id", id).select().single();
      if (error) {
        console.error("Error actualizando cliente en Supabase:", error);
        throw new Error(error.message || "Error al modificar la ficha del cliente");
      }
      return data as Cliente;
    }
    const current = getLocal<Cliente[]>("clientes", INITIAL_CLIENTES);
    const updated = current.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setLocal("clientes", updated);
    return updated.find((c) => c.id === id) as Cliente;
  },

  async deleteCliente(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) {
        console.error("Error eliminando cliente de Supabase:", error);
        throw new Error(error.message || "Error al eliminar el cliente");
      }
      return;
    }
    const current = getLocal<Cliente[]>("clientes", INITIAL_CLIENTES);
    setLocal("clientes", current.filter((c) => c.id !== id));
  },

  // ==========================================
  // INFORMES CON FOTOS (Módulo Básico / Todos)
  // ==========================================
  async getInformes(clienteId?: string, proyectoId?: string): Promise<Informe[]> {
    if (isSupabaseConfigured) {
      let query = supabase.from("informes").select("*");
      if (clienteId) query = query.eq("cliente_id", clienteId);
      if (proyectoId) query = query.eq("proyecto_id", proyectoId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) {
        console.error("Error leyendo informes de Supabase:", error);
        throw new Error(error.message || "Error al cargar los informes fotográficos");
      }
      const rawList = (data || []) as Informe[];
      return await Promise.all(
        rawList.map(async (inf) => {
          if (inf.fotos && Array.isArray(inf.fotos)) {
            const fotosRenovadas = await Promise.all(
              inf.fotos.map(async (f) => ({
                ...f,
                url: f.url ? await this.getFotoUrl(f.url) : f.url,
              }))
            );
            return { ...inf, fotos: fotosRenovadas };
          }
          return inf;
        })
      );
    }
    let list = getLocal<Informe[]>("informes", INITIAL_INFORMES);
    if (clienteId) list = list.filter((inf) => inf.cliente_id === clienteId);
    if (proyectoId) list = list.filter((inf) => inf.proyecto_id === proyectoId);
    return list;
  },

  async getInformeById(id: string): Promise<Informe | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("informes").select("*").eq("id", id).maybeSingle();
      if (error) {
        console.error("Error leyendo informe de Supabase:", error);
        throw new Error(error.message || "Error al abrir el informe fotográfico");
      }
      if (!data) return null;
      const inf = data as Informe;
      if (inf.fotos && Array.isArray(inf.fotos)) {
        const fotosRenovadas = await Promise.all(
          inf.fotos.map(async (f) => ({
            ...f,
            url: f.url ? await this.getFotoUrl(f.url) : f.url,
          }))
        );
        return { ...inf, fotos: fotosRenovadas };
      }
      return inf;
    }
    const list = getLocal<Informe[]>("informes", INITIAL_INFORMES);
    return list.find((inf) => inf.id === id) || null;
  },

  async createInforme(informe: Omit<Informe, "id">): Promise<Informe> {
    const item: Informe = { ...informe, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("informes").insert([item]).select().single();
      if (error) {
        console.error("Error creando informe en Supabase:", error);
        throw new Error(error.message || "Error al guardar el informe fotográfico");
      }
      return data as Informe;
    }
    const current = getLocal<Informe[]>("informes", INITIAL_INFORMES);
    const updated = [item, ...current];
    setLocal("informes", updated);
    return item;
  },

  async updateInforme(id: string, updates: Partial<Informe>): Promise<Informe> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("informes").update(updates).eq("id", id).select().single();
      if (error) {
        console.error("Error actualizando informe en Supabase:", error);
        throw new Error(error.message || "Error al actualizar el informe");
      }
      return data as Informe;
    }
    const current = getLocal<Informe[]>("informes", INITIAL_INFORMES);
    const updated = current.map((inf) => (inf.id === id ? { ...inf, ...updates } : inf));
    setLocal("informes", updated);
    return updated.find((inf) => inf.id === id) as Informe;
  },

  async deleteInforme(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("informes").delete().eq("id", id);
      if (error) {
        console.error("Error eliminando informe de Supabase:", error);
        throw new Error(error.message || "Error al eliminar el informe");
      }
      return;
    }
    const current = getLocal<Informe[]>("informes", INITIAL_INFORMES);
    setLocal("informes", current.filter((inf) => inf.id !== id));
  },

  // ==========================================
  // ALBARANES (Módulo Organizado / Equipo)
  // ==========================================
  async getAlbaranes(proyectoId?: string): Promise<Albaran[]> {
    if (isSupabaseConfigured) {
      let query = supabase.from("albaranes").select("*");
      if (proyectoId) query = query.eq("proyecto_id", proyectoId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) {
        console.error("Error leyendo albaranes de Supabase:", error);
        throw new Error(error.message || "Error al cargar los albaranes");
      }
      return (data || []) as Albaran[];
    }
    const list = getLocal<Albaran[]>("albaranes", INITIAL_ALBARANES);
    return proyectoId ? list.filter((a) => a.proyecto_id === proyectoId) : list;
  },

  async getAlbaranById(id: string): Promise<Albaran | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("albaranes").select("*").eq("id", id).maybeSingle();
      if (error) {
        console.error("Error buscando albarán en Supabase:", error);
        throw new Error(error.message || "Error al abrir el albarán");
      }
      return data as Albaran | null;
    }
    const list = getLocal<Albaran[]>("albaranes", INITIAL_ALBARANES);
    return list.find((a) => a.id === id) || null;
  },

  async createAlbaran(albaran: Omit<Albaran, "id">): Promise<Albaran> {
    const numeroFinal = albaran.numero || (await this.obtenerSiguienteNumeroAlbaran());
    const item: Albaran = { ...albaran, numero: numeroFinal, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    if (isSupabaseConfigured) {
      let { data, error } = await supabase.from("albaranes").insert([item]).select().single();
      // Si hubo colisión concurrente de número único, reintentar con el siguiente número atómico reservado
      if (error && (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("albaranes_numero_key"))) {
        const nuevoNumero = await this.obtenerSiguienteNumeroAlbaran();
        item.numero = nuevoNumero;
        const retryResult = await supabase.from("albaranes").insert([item]).select().single();
        if (retryResult.error) {
          throw new Error(retryResult.error.message || "Error al emitir el albarán tras reintento de numeración concurrente");
        }
        return retryResult.data as Albaran;
      }
      if (error) {
        console.error("Error creando albarán en Supabase:", error);
        throw new Error(error.message || "Error al emitir el albarán");
      }
      return data as Albaran;
    }
    const current = getLocal<Albaran[]>("albaranes", INITIAL_ALBARANES);
    const updated = [item, ...current];
    setLocal("albaranes", updated);
    return item;
  },

  async deleteAlbaran(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("albaranes").delete().eq("id", id);
      if (error) {
        console.error("Error eliminando albarán de Supabase:", error);
        throw new Error(error.message || "Error al eliminar el albarán");
      }
      return;
    }
    const current = getLocal<Albaran[]>("albaranes", INITIAL_ALBARANES);
    setLocal("albaranes", current.filter((a) => a.id !== id));
  },

  // ==========================================
  // PARTES DE TRABAJO (Módulo Equipo)
  // ==========================================
  async getPartesTrabajo(): Promise<ParteTrabajo[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("partes_trabajo").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("Error leyendo partes de trabajo de Supabase:", error);
        throw new Error(error.message || "Error al cargar los partes de trabajo");
      }
      return (data || []) as ParteTrabajo[];
    }
    return getLocal<ParteTrabajo[]>("partes_trabajo", INITIAL_PARTES);
  },

  async getParteById(id: string): Promise<ParteTrabajo | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("partes_trabajo").select("*").eq("id", id).maybeSingle();
      if (error) {
        console.error("Error buscando parte en Supabase:", error);
        throw new Error(error.message || "Error al consultar el parte de trabajo");
      }
      return data as ParteTrabajo | null;
    }
    const list = getLocal<ParteTrabajo[]>("partes_trabajo", INITIAL_PARTES);
    return list.find((p) => p.id === id) || null;
  },

  async createParteTrabajo(parte: Omit<ParteTrabajo, "id">): Promise<ParteTrabajo> {
    const item: ParteTrabajo = { ...parte, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("partes_trabajo").insert([item]).select().single();
      if (error) {
        console.error("Error creando parte en Supabase:", error);
        throw new Error(error.message || "Error al registrar el parte de trabajo");
      }
      return data as ParteTrabajo;
    }
    const current = getLocal<ParteTrabajo[]>("partes_trabajo", INITIAL_PARTES);
    const updated = [item, ...current];
    setLocal("partes_trabajo", updated);
    return item;
  },

  async deleteParteTrabajo(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("partes_trabajo").delete().eq("id", id);
      if (error) {
        console.error("Error eliminando parte de Supabase:", error);
        throw new Error(error.message || "Error al eliminar el parte");
      }
      return;
    }
    const current = getLocal<ParteTrabajo[]>("partes_trabajo", INITIAL_PARTES);
    setLocal("partes_trabajo", current.filter((p) => p.id !== id));
  },

  // ==========================================
  // NUMERACIÓN DE ALBARANES ATÓMICA
  // ==========================================
  async obtenerSiguienteNumeroAlbaran(year: number = new Date().getFullYear()): Promise<string> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc("obtener_siguiente_numero_albaran", { p_year: year });
        if (!error && data) {
          return data as string;
        }
      } catch (e) {
        console.warn("Aviso al invocar obtener_siguiente_numero_albaran RPC:", e);
      }
    }
    const albaranes = await this.getAlbaranes();
    const prefix = `ALB-${year}-`;
    const nums = albaranes
      .filter((a) => a.numero && a.numero.startsWith(prefix))
      .map((a) => {
        const numPart = a.numero.slice(prefix.length).replace(/\D/g, "");
        return parseInt(numPart, 10) || 0;
      });
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    return `${prefix}${String(maxNum + 1).padStart(3, "0")}`;
  },

  // ==========================================
  // CONFIGURACIÓN DE EMPRESA Y TITULAR (CENTRALIZADA)
  // ==========================================
  async getConfig(): Promise<ConfiguracionEmpresaRecord | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("configuracion_empresa")
          .select("*")
          .eq("id", "empresa_principal")
          .maybeSingle();
        if (error) {
          console.warn("Aviso al leer configuracion_empresa de Supabase:", error);
          return null;
        }
        return data as ConfiguracionEmpresaRecord | null;
      } catch (e) {
        console.warn("Excepción al consultar configuracion_empresa:", e);
        return null;
      }
    }
    return null;
  },

  // Cola secuencial para evitar que escrituras simultáneas sobreescriban cambios recientes
  _saveConfigQueue: Promise.resolve() as Promise<void>,

  async saveConfig(updates: Partial<ConfiguracionEmpresaRecord>): Promise<void> {
    const task = async () => {
      if (isSupabaseConfigured) {
        // En producción: persistencia estricta en Supabase. Los errores SE PROPAGAN para mostrarlos claramente.
        const { error } = await supabase
          .from("configuracion_empresa")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", "empresa_principal");

        if (error) {
          console.error("Error guardando configuracion_empresa en Supabase:", error);
          throw new Error(error.message || "Error al guardar la configuración en Supabase");
        }
        return;
      }

      // Modo local/desarrollo sin conexión a Supabase
      const current = getLocal<ConfiguracionEmpresaRecord | null>("configuracion_empresa", null);
      setLocal("configuracion_empresa", { ...(current || {}), ...updates, updated_at: new Date().toISOString() });
    };

    if (!this._saveConfigQueue) {
      this._saveConfigQueue = Promise.resolve();
    }
    const nextOp = this._saveConfigQueue.then(task, task);
    this._saveConfigQueue = nextOp.catch(() => {});
    return nextOp;
  },

  // ==========================================
  // WEB COMERCIAL PÚBLICA (Mecanismo seguro de lectura)
  // ==========================================
  // Lectura exclusiva de datos públicos para visitantes anónimos
  async getWebPublica(): Promise<{
    oficio_id: string;
    tema_id: string;
    web_publica: any;
    empresa: any;
  } | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc("obtener_web_publica");
        if (error) {
          console.warn("Aviso al obtener web comercial pública de Supabase:", error);
          return null;
        }
        return data;
      } catch (e) {
        console.warn("Excepción obteniendo web comercial pública:", e);
        return null;
      }
    }
    const cfg = getLocal<ConfiguracionEmpresaRecord | null>("configuracion_empresa", null);
    return {
      oficio_id: cfg?.oficio_id || "reformas",
      tema_id: cfg?.tema_id || "tema_clasico",
      web_publica: cfg?.web_publica || null,
      empresa: cfg?.empresa || null,
    };
  },

  // Previsualización de borrador: solo accesible para el administrador autorizado
  async getPrevisualizacionBorrador(): Promise<{
    oficio_id: string;
    tema_id: string;
    web_publica: any;
    empresa: any;
  } | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc("obtener_previsualizacion_borrador");
      if (error) {
        throw new Error(error.message || "Acceso denegado a la previsualización del borrador.");
      }
      return data;
    }
    const cfg = getLocal<ConfiguracionEmpresaRecord | null>("configuracion_empresa", null);
    return {
      oficio_id: cfg?.oficio_id || "reformas",
      tema_id: cfg?.tema_id || "tema_clasico",
      web_publica: cfg?.borrador_web_publica || cfg?.web_publica || null,
      empresa: cfg?.borrador_empresa || cfg?.empresa || null,
    };
  },

  // ==========================================
  // AUTENTICACIÓN Y ACCESO EXCLUSIVO DEL TITULAR
  // ==========================================
  async loginTitular(email: string, password: string) {
    if (!isSupabaseConfigured) {
      return { user: { email }, session: {}, rol: "titular" };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Verificar si esta instalación tiene titular o administrador asignado
    const cfg = await this.getConfig();
    const userEmail = data.user?.email?.toLowerCase().trim();
    const adminEmail = cfg?.admin_email?.toLowerCase().trim();
    const titularEmail = cfg?.titular_email?.toLowerCase().trim();

    const esAdmin = Boolean(adminEmail && userEmail === adminEmail);
    const esTitular = Boolean(titularEmail && userEmail === titularEmail);

    if (cfg && (cfg.titular_email || cfg.admin_email)) {
      if (!esAdmin && !esTitular) {
        await supabase.auth.signOut();
        throw new Error(
          `Acceso denegado: La cuenta ${data.user?.email} no está autorizada para esta instalación.`
        );
      }
    } else {
      // Si la instalación no ha sido aprovisionada, rechazar el acceso en lugar de que cualquiera se apropie
      await supabase.auth.signOut();
      throw new Error(
        "Instalación no aprovisionada: El administrador debe ejecutar la provisión oficial en Supabase (provisionar_instalacion) antes de poder acceder."
      );
    }
    return { ...data, rol: esAdmin ? "administrador" : "titular" };
  },

  async logoutTitular() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("imanox_simulated_user");
    }
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },

  async getUsuarioActual() {
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
      } catch {
        return null;
      }
    }

    // Únicamente en modo local / sin Supabase configurado se lee la sesión simulada
    if (typeof window !== "undefined") {
      const sim = localStorage.getItem("imanox_simulated_user");
      if (sim) {
        try {
          return JSON.parse(sim);
        } catch {}
      }
    }
    return { email: "titular@empresa.es", rol: "titular" };
  },
};
