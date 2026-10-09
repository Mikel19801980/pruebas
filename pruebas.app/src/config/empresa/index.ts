import { EmpresaConfig, TipoOficio } from "../types";

export const EMPRESA_IMANOX: EmpresaConfig = {
  nombreComercial: "IMANOX",
  subtitulo: "Reformas Integrales",
  telefono: "622 11 44 55",
  email: "info@imanoxreformas.es",
  cifNif: "B-88776655",
  direccion: "Calle Principal 12, Madrid",
  logoTexto: "IX",
  colorPrimario: "#ea580c", // Naranja reformas
  zonaServicio: "Comunidad de Madrid y alrededores",
  webPublicaUrl: "https://imanox-reformas.vercel.app",
};

export const EMPRESA_VOLTPRO: EmpresaConfig = {
  nombreComercial: "VOLTPRO",
  subtitulo: "Instalaciones Eléctricas",
  telefono: "633 44 55 66",
  email: "contacto@voltpro.es",
  cifNif: "B-99887766",
  direccion: "Avenida de la Industria 45, Nave 3, Madrid",
  logoTexto: "VP",
  colorPrimario: "#0284c7", // Azul eléctrico
  zonaServicio: "Madrid y Corredor del Henares",
  webPublicaUrl: "https://voltpro-electricidad.es",
};

export const EMPRESAS_POR_OFICIO: Partial<Record<TipoOficio, EmpresaConfig>> = {
  reformas: EMPRESA_IMANOX,
  electricidad: EMPRESA_VOLTPRO,
};

export function getEmpresaPorOficio(oficio: TipoOficio): EmpresaConfig {
  return EMPRESAS_POR_OFICIO[oficio] || {
    ...EMPRESA_IMANOX,
    nombreComercial: `PROFESIONAL ${oficio.toUpperCase()}`,
    subtitulo: `Servicios de ${oficio}`,
  };
}
