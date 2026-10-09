import { OficioConfig } from "../types";

export const OFICIO_ELECTRICIDAD: OficioConfig = {
  id: "electricidad",
  nombre: "Instalaciones Eléctricas",
  icono: "Zap",
  descripcion: "Instalaciones eléctricas de baja tensión, boletines CIE, cuadros, iluminación y telecomunicaciones.",
  vocabulario: {
    trabajosNombre: "Instalaciones / Trabajos",
    trabajoSingular: "Instalación",
    gremiosNombre: "Especialidades",
    partidasNombre: "Partidas",
  },
  unidadesSugeridas: [
    { valor: "ud", etiqueta: "ud (Punto / Mecanismo / Unidad)", descripcion: "Punto de luz, enchufe, foco, cuadro" },
    { valor: "ml", etiqueta: "ml (Metros lineales)", descripcion: "Tubo corrugado, bandeja, manguera eléctrica" },
    { valor: "h", etiqueta: "h (Horas)", descripcion: "Mano de obra oficial electricista, localización de averías" },
    { valor: "pa", etiqueta: "pa (Partida alzada / Boletín)", descripcion: "Legalización, tramitación CIE, acometida" },
  ],
  partidasSugeridas: [
    { concepto: "Punto de luz simple/conmutado con cable libre de halógenos 1,5mm² y mecanismo", gremio: "Electricidad", unidad: "ud", precio_unitario: 0 },
    { concepto: "Toma de corriente schuko 16A con línea dedicada de 2,5mm² en tubo corrugado", gremio: "Electricidad", unidad: "ud", precio_unitario: 0 },
    { concepto: "Sustitución y montaje de cuadro general con IGA, sobretensiones y 5 circuitos PIA", gremio: "Electricidad", unidad: "ud", precio_unitario: 0 },
    { concepto: "Canalización empotrada bajo tubo corrugado M20 con apertura y tapado de roza", gremio: "Electricidad", unidad: "ml", precio_unitario: 0 },
    { concepto: "Tramitación y emisión de Certificado de Instalación Eléctrica (Boletín CIE)", gremio: "Legalización", unidad: "pa", precio_unitario: 0 },
    { concepto: "Localización y reparación de derivación / salto de diferencial en vivienda", gremio: "Averías", unidad: "h", precio_unitario: 0 },
  ],
  proveedoresSugeridos: ["Sonepar / Dielectro", "Rexel", "Electro Stocks", "Obramat / Bricomart", "Suministros Eléctricos Locales"],
  gremios: ["Electricidad", "Telecomunicaciones", "Climatización", "Legalización", "Averías urgentes"],
};
