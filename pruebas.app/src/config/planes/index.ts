import { NivelPlan, PlanConfig, Capacidad } from "../types";

export const PLAN_BASICO: PlanConfig = {
  nivel: "basico",
  nombre: "Básico",
  lema: "Presupuesta y documenta a pie de obra",
  capacidades: [
    "clientes",
    "presupuestos",
    "informes",
    "fotos",
    "pdf_export",
    "dictado_voz",
    "web_publica",
  ],
};

export const PLAN_ORGANIZADO: PlanConfig = {
  nivel: "organizado",
  nombre: "Organizado",
  lema: "Ordena tus trabajos, agenda y compras",
  capacidades: [
    ...PLAN_BASICO.capacidades,
    "obras",
    "agenda",
    "compras",
    "albaranes",
  ],
};

export const CATALOGO_PLANES: Record<NivelPlan, PlanConfig> = {
  basico: PLAN_BASICO,
  organizado: PLAN_ORGANIZADO,
};

export function tieneCapacidad(plan: PlanConfig, capacidad: Capacidad): boolean {
  return plan.capacidades.includes(capacidad);
}
