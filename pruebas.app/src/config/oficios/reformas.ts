import { OficioConfig } from "../types";

export const OFICIO_REFORMAS: OficioConfig = {
  id: "reformas",
  nombre: "Reformas e Integrales",
  icono: "Hammer",
  descripcion: "Albañilería, fontanería, pladur, alicatados y reformas completas de viviendas y locales.",
  vocabulario: {
    trabajosNombre: "Obras",
    trabajoSingular: "Obra",
    gremiosNombre: "Gremios",
    partidasNombre: "Partidas",
  },
  unidadesSugeridas: [
    { valor: "m²", etiqueta: "m² (Metros cuadrados)", descripcion: "Alicatados, solados, pladur, yeso, pintura" },
    { valor: "ml", etiqueta: "ml (Metros lineales)", descripcion: "Rodapiés, cornisas, rozas, tuberías" },
    { valor: "ud", etiqueta: "ud (Unidad)", descripcion: "Inodoros, muebles de baño, puertas, ventanas" },
    { valor: "pa", etiqueta: "pa (Partida alzada)", descripcion: "Demolición general, desescombro, limpieza" },
    { valor: "h", etiqueta: "h (Horas)", descripcion: "Mano de obra, trabajos imprevistos" },
    { valor: "kg", etiqueta: "kg (Kilogramos)", descripcion: "Áridos, sacos de mortero o escayola" },
  ],
  partidasSugeridas: [
    { concepto: "Picado de azulejos antiguos y desescombro en contenedor", gremio: "Albañilería", unidad: "m²", precio_unitario: 0 },
    { concepto: "Alicatado porcelánico rectificado con cemento cola C2TE y lechada", gremio: "Albañilería", unidad: "m²", precio_unitario: 0 },
    { concepto: "Instalación completa de fontanería multicapa para baño (4 tomas + desagües)", gremio: "Fontanería", unidad: "ud", precio_unitario: 0 },
    { concepto: "Suministro e instalación de plato de ducha de resina pizarra 120x80", gremio: "Fontanería", unidad: "ud", precio_unitario: 0 },
    { concepto: "Trasdosado autoportante de placa de yeso laminado (Pladur) 15mm con lana de roca", gremio: "Pladur", unidad: "m²", precio_unitario: 0 },
    { concepto: "Pintura plástica lisa lavable mate en paredes y techos a dos manos", gremio: "Pintura", unidad: "m²", precio_unitario: 0 },
  ],
  proveedoresSugeridos: ["Obramat / Bricomart", "Saltoki", "La Plataforma", "Leroy Merlin", "Almacén Local de Construcción"],
  gremios: ["Albañilería", "Fontanería", "Electricidad", "Pladur", "Pintura", "Cerrajería", "Carpintería"],
};
