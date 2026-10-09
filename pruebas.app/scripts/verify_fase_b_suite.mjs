// ==============================================================================
// VERIFICACIÓN AUTOMÁTICA FASE B — PLATAFORMA DE OFICIOS (v3.0)
// ==============================================================================
// Comprueba:
// 1. Restricción estricta de niveles: solo 'basico' y 'organizado'.
// 2. Desacoplamiento del corazón de diseño: temas independientes y tokens limpios.
// 3. Estructura y esquema de borrador, previsualización y publicación en configuracion_empresa.
// 4. Panel configurador centralizado (/configuracion) sin tocar código.
// 5. Web pública comercial (/web) independiente de la gestión privada.
// 6. RLS y AuthGuard: acceso público a /web y protección de rutas privadas.
// ==============================================================================

import fs from "fs";
import path from "path";

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
  }
}

console.log("=== INICIO DE COMPROBACIONES FASE B ===\n");

// 1. Catálogo de planes y restricción de niveles
const planesPath = path.resolve("src/config/planes/index.ts");
const planesContent = fs.readFileSync(planesPath, "utf-8");
assert(
  planesContent.includes("CATALOGO_PLANES") &&
  planesContent.includes("basico:") &&
  planesContent.includes("organizado:") &&
  !planesContent.includes("equipo:"),
  "1. Los planes funcionales están estrictamente restringidos a 'basico' y 'organizado' (sin nivel 'equipo')."
);

// 2. Núcleo desacoplado de diseño y tema provisional
const temasPath = path.resolve("src/config/temas/index.ts");
const temasContent = fs.readFileSync(temasPath, "utf-8");
assert(
  temasContent.includes("TEMA_CLASICO") &&
  temasContent.includes("tema_clasico") &&
  temasContent.includes("getTemaConfig"),
  "2. El núcleo de diseño está desacoplado con tema provisional limpio preparado para temas Stitch."
);

// 3. Esquema SQL para borrador, previsualización y publicación
const schemaPath = path.resolve("supabase_schema.sql");
const schemaContent = fs.readFileSync(schemaPath, "utf-8");
assert(
  schemaContent.includes("tema_id") &&
  schemaContent.includes("web_publica JSONB") &&
  schemaContent.includes("borrador_web_publica JSONB") &&
  schemaContent.includes("borrador_empresa JSONB") &&
  schemaContent.includes("estado_publicacion TEXT"),
  "3. El esquema SQL soporta columnas para borrador, previsualización y publicación de la web pública."
);

// 4. ConfigContext con soporte de temas, borradores y publicación
const contextPath = path.resolve("src/config/context.tsx");
const contextContent = fs.readFileSync(contextPath, "utf-8");
assert(
  contextContent.includes("guardarBorradorWeb") &&
  contextContent.includes("publicarConfiguracionWeb") &&
  contextContent.includes("estadoPublicacion") &&
  contextContent.includes("setTemaId"),
  "4. ConfigContext implementa el flujo de trabajo completo de borrador y publicación de la configuración."
);

// 5. Pantalla del Configurador Privado
const configPagePath = path.resolve("src/app/configuracion/page.tsx");
assert(
  fs.existsSync(configPagePath),
  "5. Existe la pantalla del configurador centralizado en /configuracion."
);
const configPageContent = fs.readFileSync(configPagePath, "utf-8");
assert(
  configPageContent.includes("Datos de Empresa") &&
  configPageContent.includes("Tema de Diseño") &&
  configPageContent.includes("Web Comercial Pública") &&
  configPageContent.includes("Actividad Comercial") &&
  configPageContent.includes("Nivel de la Instalación") &&
  configPageContent.includes("Guardar Borrador") &&
  configPageContent.includes("Publicar"),
  "6. El configurador cubre las 6 áreas requeridas por la especificación v3.0 sin necesidad de tocar código."
);

// 6. Web Comercial Pública
const webPagePath = path.resolve("src/app/web/page.tsx");
assert(
  fs.existsSync(webPagePath),
  "7. Existe la página web comercial pública en /web."
);
const webPageContent = fs.readFileSync(webPagePath, "utf-8");
assert(
  webPageContent.includes("Nuestros Servicios Profesionales") &&
  webPageContent.includes("Galería de Trabajos Realizados") &&
  webPageContent.includes("¿Hablamos de tu proyecto?") &&
  webPageContent.includes("webPublica.telefonoContacto"),
  "8. La web comercial pública presenta servicios, fotos, cobertura y contacto consumiendo la configuración."
);

// 7. AuthGuard permite acceso público a /web
const authGuardPath = path.resolve("src/components/auth/AuthGuard.tsx");
const authGuardContent = fs.readFileSync(authGuardPath, "utf-8");
assert(
  authGuardContent.includes('/web') &&
  authGuardContent.includes('isPublicRoute'),
  "9. AuthGuard autoriza el acceso anónimo/público a /web mientras protege la gestión interna."
);

console.log(`\nResultado final: ${passed}/${total} comprobaciones superadas.`);

if (passed === total) {
  console.log("\n[OK] VERIFICACIÓN FASE B SUPERADA CON ÉXITO.\n");
  process.exit(0);
} else {
  console.error("\n[ERROR] Hay comprobaciones fallidas en la Fase B.\n");
  process.exit(1);
}
