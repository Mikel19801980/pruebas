import { TemaConfig } from "../types";

export const TEMA_CLASICO: TemaConfig = {
  id: "tema_clasico",
  nombre: "Clásico Profesional",
  colorPrimario: "#ea580c",
  colorSecundario: "#0f172a",
  fuente: "system-ui, -apple-system, sans-serif",
};

export const CATALOGO_TEMAS: Record<string, TemaConfig> = {
  tema_clasico: TEMA_CLASICO,
};

export function getTemaConfig(id?: string | null): TemaConfig {
  if (id && CATALOGO_TEMAS[id]) {
    return CATALOGO_TEMAS[id];
  }
  return TEMA_CLASICO;
}
