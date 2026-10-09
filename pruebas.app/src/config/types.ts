export type TipoOficio =
  | "reformas"
  | "electricidad"
  | "fontaneria"
  | "pintura"
  | "climatizacion"
  | "carpinteria"
  | "multiservicios";

export type NivelPlan = "basico" | "organizado";

export type Capacidad =
  | "clientes"
  | "presupuestos"
  | "informes"
  | "fotos"
  | "pdf_export"
  | "dictado_voz"
  | "web_publica"
  | "obras"
  | "agenda"
  | "compras"
  | "albaranes";

export interface WebPublicaConfig {
  titulo: string;
  subtitulo: string;
  descripcion: string;
  servicios: Array<{ titulo: string; descripcion: string }>;
  zonaAtencion: string;
  telefonoContacto: string;
  emailContacto: string;
  galeriaFotos: Array<{ url: string; titulo: string }>;
}

export interface TemaConfig {
  id: string;
  nombre: string;
  colorPrimario: string;
  colorSecundario: string;
  fuente: string;
}

export interface PartidaSugerida {
  concepto: string;
  gremio: string;
  unidad: string;
  precio_unitario: number;
}

export interface OficioConfig {
  id: TipoOficio;
  nombre: string;
  icono: string;
  descripcion: string;
  vocabulario: {
    trabajosNombre: string; // "Obras" en reformas, "Instalaciones/Trabajos" en electricidad
    trabajoSingular: string; // "Obra", "Instalación", "Trabajo"
    gremiosNombre: string; // "Gremios" o "Especialidades"
    partidasNombre: string; // "Partidas"
  };
  unidadesSugeridas: Array<{ valor: string; etiqueta: string; descripcion: string }>;
  partidasSugeridas: PartidaSugerida[];
  proveedoresSugeridos: string[];
  gremios: string[];
}

export interface PlanConfig {
  nivel: NivelPlan;
  nombre: string;
  lema: string;
  capacidades: Capacidad[];
}

export interface EmpresaConfig {
  nombreComercial: string;
  subtitulo: string;
  telefono: string;
  email: string;
  cifNif: string;
  direccion: string;
  logoTexto: string;
  colorPrimario: string;
  zonaServicio: string;
  webPublicaUrl?: string;
}

export interface PreferenciasConfig {
  agruparPorObra: boolean; // Preferencia en Organizado para vincular documentos a obras o dejarlos libres
  mostrarSelectorGremios: boolean; // Si solo se maneja un oficio se puede ocultar
  vistaOperarioActiva: boolean; // Simulación del rol operario
  modulos_activos?: Capacidad[]; // Módulos habilitados granularmente por el administrador
}

export interface AppConfig {
  oficio: OficioConfig;
  plan: PlanConfig;
  empresa: EmpresaConfig;
  preferencias: PreferenciasConfig;
  tema: TemaConfig;
  webPublica: WebPublicaConfig;
}
