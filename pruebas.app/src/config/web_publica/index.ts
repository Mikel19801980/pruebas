import { WebPublicaConfig } from "../types";

export const DEFAULT_WEB_PUBLICA: WebPublicaConfig = {
  titulo: "Servicios Profesionales de Reformas y Construcción",
  subtitulo: "Calidad, compromiso y presupuesto cerrado sin sorpresas",
  descripcion: "Especialistas en reformas integrales y parciales de viviendas, locales y baños. Ofrecemos asesoramiento personalizado, gestión completa de gremios y materiales de primera calidad.",
  servicios: [
    {
      titulo: "Reformas de Baños y Cocinas",
      descripcion: "Alicatado, fontanería, cambio de bañera por plato de ducha y mobiliario a medida.",
    },
    {
      titulo: "Reformas Integrales de Viviendas",
      descripcion: "Coordinación total de gremios: albañilería, electricidad, pladur, pintura y carpintería.",
    },
    {
      titulo: "Pladur, Aislamientos y Pintura",
      descripcion: "Trasdosados acústicos/térmicos, techos continuos y acabados de pintura lisa lavable.",
    },
    {
      titulo: "Instalaciones y Mantenimiento",
      descripcion: "Fontanería multicapa, saneamiento, electricidad y climatización certificada.",
    },
  ],
  zonaAtencion: "Comunidad de Madrid y poblaciones cercanas",
  telefonoContacto: "622 11 44 55",
  emailContacto: "info@imanoxreformas.es",
  galeriaFotos: [
    {
      url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      titulo: "Reforma integral de baño con plato de resina y grifería termostática",
    },
    {
      url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
      titulo: "Cocina abierta con isla y alicatado porcelánico rectificado",
    },
    {
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      titulo: "Salón con techos continuos de pladur e iluminación indirecta LED",
    },
  ],
};
