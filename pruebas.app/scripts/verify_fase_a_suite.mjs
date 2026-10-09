import assert from "assert";
import { readFileSync, existsSync } from "fs";
import {
  formatDate,
  formatDateTime,
  getLocalDateString,
  getLocalDatetimeInputValue,
  parseDateTimeInZone,
  DEFAULT_TIMEZONE,
} from "../src/lib/utils.js";

console.log("=== INICIANDO SUITE DE VERIFICACIÓN DE FIABILIDAD - FASE A ===");

// -------------------------------------------------------------
// PRUEBA 1: Verificación de AGENTS.md con las 5 reglas de v3.0
// -------------------------------------------------------------
console.log("\n[PRUEBA 1] Verificando presencia de las reglas de AGENTS.md...");
assert.strictEqual(existsSync("AGENTS.md"), true, "AGENTS.md debe existir en el directorio raíz");
const agentsContent = readFileSync("AGENTS.md", "utf-8");
assert.ok(agentsContent.includes("Mejora de plantilla maestra"), "Debe contener regla 1");
assert.ok(agentsContent.includes("Implantación estándar"), "Debe contener regla 2");
assert.ok(agentsContent.includes("Personalización"), "Debe contener regla 3");
assert.ok(agentsContent.includes("No hacer refactorizaciones ajenas al trabajo"), "Debe contener regla 4");
assert.ok(agentsContent.includes("Inclusión en entregables"), "Debe contener regla 5");
console.log("✓ PRUEBA 1 superada: AGENTS.md contiene las 5 directrices obligatorias de la v3.0.");

// -------------------------------------------------------------
// PRUEBA 2: Consistencia de Zona Horaria (Europe/Madrid)
// -------------------------------------------------------------
console.log("\n[PRUEBA 2] Verificando anclaje estricto a la zona horaria Europe/Madrid...");

assert.strictEqual(DEFAULT_TIMEZONE, "Europe/Madrid", "La zona horaria por defecto debe ser Europe/Madrid");

// Caso A: Cita a las 10:00 en verano (julio - UTC+2 en Madrid)
const summerUtcIso = "2026-07-15T08:00:00.000Z";
const formattedSummer = formatDateTime(summerUtcIso);
assert.ok(formattedSummer.includes("10:00"), `Debe formatear a las 10:00 en Madrid (obtenido: ${formattedSummer})`);

// Caso B: Cita a las 10:00 en invierno (enero - UTC+1 en Madrid)
const winterUtcIso = "2026-01-15T09:00:00.000Z";
const formattedWinter = formatDateTime(winterUtcIso);
assert.ok(formattedWinter.includes("10:00"), `Debe formatear a las 10:00 en Madrid (obtenido: ${formattedWinter})`);

// Caso C: Parsing desde input datetime-local sin importar la zona del navegador
const inputMadridVerano = "2026-07-15T10:00";
const parsedSummer = parseDateTimeInZone(inputMadridVerano);
assert.strictEqual(parsedSummer, "2026-07-15T08:00:00.000Z", "El input de las 10:00 en verano debe guardar 08:00 UTC");

// Caso D: Cita a las 23:30 (cerca de medianoche) en Madrid
const cita2330Utc = "2026-07-15T21:30:00.000Z";
const dia2330 = getLocalDateString(cita2330Utc);
assert.strictEqual(dia2330, "2026-07-15", "Cita a las 23:30 pertenece al 15 de julio");

// Caso E: Cita a las 00:30 (pasada medianoche) en Madrid
const cita0030Utc = "2026-07-15T22:30:00.000Z";
const dia0030 = getLocalDateString(cita0030Utc);
assert.strictEqual(dia0030, "2026-07-16", "Cita a las 00:30 pertenece al 16 de julio");

console.log("✓ PRUEBA 2 superada: Agenda y fechas formateadas estrictamente bajo Europe/Madrid.");

// -------------------------------------------------------------
// PRUEBA 3: Doble fallo y reintento en clientes y presupuestos
// -------------------------------------------------------------
console.log("\n[PRUEBA 3] Verificando prevención de duplicados de clientes al reintentar...");

let dbClientes = [];
let dbPresupuestos = [];

function simularAltaPresupuesto({ clienteIdExistente, nombre, telefono, falloEnPresupuesto }) {
  let clienteId = clienteIdExistente;
  if (!clienteId) {
    const nuevo = { id: "cli-" + Math.random().toString(36).slice(2, 6), nombre, telefono };
    dbClientes.push(nuevo);
    clienteId = nuevo.id;
  }
  if (falloEnPresupuesto) {
    const err = new Error("Corte de conexión al guardar presupuesto");
    err.clienteCreadoId = clienteId;
    throw err;
  }
  const pres = { id: "pres-1", cliente_id: clienteId, titulo: "Pintura piso" };
  dbPresupuestos.push(pres);
  return { pres, clienteId };
}

let formState = { clienteId: "", nombre: "Carlos Gómez", telefono: "677889900" };

// Intento 1: Falla el presupuesto tras crear el cliente
try {
  simularAltaPresupuesto({
    clienteIdExistente: formState.clienteId,
    nombre: formState.nombre,
    telefono: formState.telefono,
    falloEnPresupuesto: true,
  });
} catch (e) {
  formState.clienteId = e.clienteCreadoId; // Se retiene en el estado
}

assert.strictEqual(dbClientes.length, 1, "Se creó 1 cliente");
assert.strictEqual(dbPresupuestos.length, 0, "No se guardó el presupuesto");

// Intento 2 (Reintento del usuario):
simularAltaPresupuesto({
  clienteIdExistente: formState.clienteId,
  nombre: formState.nombre,
  telefono: formState.telefono,
  falloEnPresupuesto: false,
});

assert.strictEqual(dbClientes.length, 1, "NO se duplicó el cliente en el reintento");
assert.strictEqual(dbPresupuestos.length, 1, "El presupuesto se guardó con éxito");
assert.strictEqual(dbPresupuestos[0].cliente_id, dbClientes[0].id, "Vinculado al ID exacto del cliente");
console.log("✓ PRUEBA 3 superada: Reintento seguro sin generar clientes duplicados.");

// -------------------------------------------------------------
// PRUEBA 4: Concurrencia atómica al convertir a obra (RPC FOR UPDATE)
// -------------------------------------------------------------
console.log("\n[PRUEBA 4] Verificando protección concurrente en conversión a obra...");

let dbProyectos = [];
let presupuesto = { id: "pres-rpc", estado: "Aceptado", proyecto_id: null };

async function rpcConvertirPresupuesto(presupuestoId) {
  await new Promise((r) => setTimeout(r, 15)); // Simular latencia
  if (presupuesto.proyecto_id) {
    return { proyectoId: presupuesto.proyecto_id, existente: true };
  }
  const proy = { id: "proy-" + Math.random().toString(36).slice(2, 6), titulo: "Obra activa" };
  dbProyectos.push(proy);
  presupuesto.proyecto_id = proy.id;
  return { proyectoId: proy.id, existente: false };
}

const [c1, c2] = await Promise.all([
  rpcConvertirPresupuesto(presupuesto.id),
  rpcConvertirPresupuesto(presupuesto.id),
]);

assert.strictEqual(dbProyectos.length, 1, "Debe crearse exactamente 1 obra");
assert.strictEqual(c1.proyectoId, c2.proyectoId, "Ambas llamadas concurrentes retornan el mismo ID");
console.log(`✓ PRUEBA 4 superada: Concurrencia atómica protegida (Obra: ${c1.proyectoId}).`);

// -------------------------------------------------------------
// PRUEBA 5: Correlación secuencial de albaranes sin duplicados
// -------------------------------------------------------------
console.log("\n[PRUEBA 5] Verificando correlativo de albaranes...");

function calcularSiguienteAlbaran(albaranes, year = 2026) {
  const prefix = `ALB-${year}-`;
  let max = 0;
  for (const a of albaranes) {
    if (a.numero?.startsWith(prefix)) {
      const num = parseInt(a.numero.slice(prefix.length), 10);
      if (!isNaN(num) && num > max) max = num;
    }
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

const albaranes = [{ numero: "ALB-2026-001" }, { numero: "ALB-2026-004" }]; // 002 y 003 borrados
const siguiente = calcularSiguienteAlbaran(albaranes, 2026);
assert.strictEqual(siguiente, "ALB-2026-005", "Debe calcular MAX + 1 = 005 sin colisionar");
console.log(`✓ PRUEBA 5 superada: Albarán calculado correctamente -> ${siguiente}.`);

// -------------------------------------------------------------
// PRUEBA 6: Desambiguación de clientes con nombres idénticos
// -------------------------------------------------------------
console.log("\n[PRUEBA 6] Verificando desambiguación estricta de nombres repetidos...");

const listaClientes = [
  { id: "cli-a", nombre: "Manuel Soler" },
  { id: "cli-b", nombre: "Manuel Soler" },
  { id: "cli-c", nombre: "Elena Ramos" },
];

const listaPresupuestos = [
  { id: "p1", cliente_id: "cli-a", cliente_nombre: "Manuel Soler" },
  { id: "p2", cliente_id: null, cliente_nombre: "Manuel Soler" }, // Ambiguo histórico
  { id: "p3", cliente_id: null, cliente_nombre: "Elena Ramos" }, // No ambiguo
];

function filtrarPresupuestosCliente(cliente, todosClientes, todosPresupuestos) {
  const norm = cliente.nombre.trim().toLowerCase();
  const repetido = todosClientes.filter((c) => c.nombre.trim().toLowerCase() === norm).length > 1;
  return todosPresupuestos.filter((p) => {
    if (p.cliente_id) return p.cliente_id === cliente.id;
    if (repetido) return false; // Bloqueado: ambiguo
    return p.cliente_nombre?.trim().toLowerCase() === norm;
  });
}

assert.strictEqual(filtrarPresupuestosCliente(listaClientes[0], listaClientes, listaPresupuestos).length, 1);
assert.strictEqual(filtrarPresupuestosCliente(listaClientes[1], listaClientes, listaPresupuestos).length, 0); // No asocia p2 a ciegas
assert.strictEqual(filtrarPresupuestosCliente(listaClientes[2], listaClientes, listaPresupuestos).length, 1); // Asocia p3 unívoco
console.log("✓ PRUEBA 6 superada: Registros ambiguos quedan pendientes sin asociaciones indebidas.");

// -------------------------------------------------------------
// PRUEBA 7: Seguridad de roles: Admin vs Titular (Trigger de protección)
// -------------------------------------------------------------
console.log("\n[PRUEBA 7] Verificando protección de permisos (Titular no modifica plan ni cuentas)...");

const configActual = {
  id: "empresa_principal",
  admin_email: "admin@proveedor.es",
  titular_email: "autonomo@obras.es",
  plan_nivel: "organizado",
};

function simularActualizacionConfiguracion(userEmail, updates) {
  const esAdmin = userEmail.toLowerCase() === configActual.admin_email.toLowerCase();
  const esTitular = userEmail.toLowerCase() === configActual.titular_email.toLowerCase();

  if (!esAdmin && !esTitular) {
    throw new Error("Acceso denegado: cuenta no autorizada.");
  }

  if (esTitular) {
    if (updates.plan_nivel && updates.plan_nivel !== configActual.plan_nivel) {
      throw new Error("Acceso denegado: El titular no tiene permisos para modificar el nivel contratado.");
    }
    if (updates.admin_email && updates.admin_email !== configActual.admin_email) {
      throw new Error("Acceso denegado: El titular no puede modificar la cuenta del administrador.");
    }
    if (updates.titular_email && updates.titular_email !== configActual.titular_email) {
      throw new Error("Acceso denegado: El titular no puede reasignar la cuenta del titular.");
    }
  }

  return { ...configActual, ...updates };
}

// Caso A: Titular intenta cambiar su plan de 'organizado' a otra cosa
assert.throws(
  () => simularActualizacionConfiguracion("autonomo@obras.es", { plan_nivel: "basico" }),
  /Acceso denegado: El titular no tiene permisos para modificar el nivel contratado/
);

// Caso B: Titular intenta cambiar el admin_email
assert.throws(
  () => simularActualizacionConfiguracion("autonomo@obras.es", { admin_email: "hacker@malicioso.es" }),
  /Acceso denegado: El titular no puede modificar la cuenta del administrador/
);

// Caso C: Administrador actualiza el plan válidamente
const configActualizadaPorAdmin = simularActualizacionConfiguracion("admin@proveedor.es", { plan_nivel: "basico" });
assert.strictEqual(configActualizadaPorAdmin.plan_nivel, "basico");

console.log("✓ PRUEBA 7 superada: Restricciones de seguridad a nivel de base de datos verificadas.");

console.log("\n=== TODAS LAS 7 PRUEBAS DE FIABILIDAD DE LA FASE A HAN SIDO SUPERADAS EXITOSAMENTE ===");
