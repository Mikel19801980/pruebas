import { OficioConfig, TipoOficio } from "../types";
import { OFICIO_REFORMAS } from "./reformas";
import { OFICIO_ELECTRICIDAD } from "./electricidad";

export const CATALOGO_OFICIOS: Record<TipoOficio, OficioConfig> = {
  reformas: OFICIO_REFORMAS,
  electricidad: OFICIO_ELECTRICIDAD,
  fontaneria: {
    ...OFICIO_REFORMAS,
    id: "fontaneria",
    nombre: "Fontanería y Calefacción",
    icono: "Wrench",
    descripcion: "Instalaciones de agua, saneamiento, termos, calderas y grupos de presión.",
    vocabulario: {
      trabajosNombre: "Trabajos",
      trabajoSingular: "Trabajo",
      gremiosNombre: "Especialidades",
      partidasNombre: "Partidas",
    },
    gremios: ["Fontanería", "Calefacción", "Gas", "Desatascos", "Saneamiento"],
  },
  pintura: {
    ...OFICIO_REFORMAS,
    id: "pintura",
    nombre: "Pintura y Decoración",
    icono: "Paintbrush",
    descripcion: "Pintura interior, alisado de gotelé, esmaltados, fachadas y empapelado.",
    vocabulario: {
      trabajosNombre: "Trabajos",
      trabajoSingular: "Trabajo",
      gremiosNombre: "Especialidades",
      partidasNombre: "Partidas",
    },
    gremios: ["Pintura Interior", "Alisados", "Fachadas", "Tratamiento Humedades", "Esmaltes"],
  },
  climatizacion: {
    ...OFICIO_REFORMAS,
    id: "climatizacion",
    nombre: "Climatización y Aire",
    icono: "Wind",
    descripcion: "Equipos de aire acondicionado, conductos, aerotermia y ventilación.",
    vocabulario: {
      trabajosNombre: "Instalaciones",
      trabajoSingular: "Instalación",
      gremiosNombre: "Especialidades",
      partidasNombre: "Partidas",
    },
    gremios: ["Splits", "Conductos", "Aerotermia", "Ventilación", "Mantenimiento"],
  },
  carpinteria: {
    ...OFICIO_REFORMAS,
    id: "carpinteria",
    nombre: "Carpintería y Montaje",
    icono: "Scissors",
    descripcion: "Puertas, armarios a medida, tarimas flotantes y mobiliario.",
    vocabulario: {
      trabajosNombre: "Trabajos",
      trabajoSingular: "Trabajo",
      gremiosNombre: "Especialidades",
      partidasNombre: "Partidas",
    },
    gremios: ["Puertas", "Tarima", "Armarios", "Cocinas", "Carpintería Exterior"],
  },
  multiservicios: {
    ...OFICIO_REFORMAS,
    id: "multiservicios",
    nombre: "Multiservicios y Mantenimiento",
    icono: "Tool",
    descripcion: "Reparaciones rápidas del hogar, comunidades, cerrajería y manitas profesional.",
    vocabulario: {
      trabajosNombre: "Intervenciones",
      trabajoSingular: "Intervención",
      gremiosNombre: "Especialidades",
      partidasNombre: "Partidas",
    },
    gremios: ["Cerrajería", "Fontanería rápida", "Electricidad básica", "Montajes", "Reparaciones"],
  },
};

export function getOficioConfig(id: TipoOficio): OficioConfig {
  return CATALOGO_OFICIOS[id] || OFICIO_REFORMAS;
}
