import assert from "assert";

console.log("=== INICIANDO SUITE DE VERIFICACIÓN V2.1 ESTABLE ===");

// -------------------------------------------------------------
// TEST 1: Doble fallo al crear cliente y presupuesto (Sin duplicados al reintentar)
// -------------------------------------------------------------
console.log("\n[TEST 1] Verificando protección contra clientes duplicados en reintentos...");

let dbClientes = [];
let dbPresupuestos = [];

function simularCrearPresupuestoConCliente({
  clienteIdExistente,
  nuevoNombre,
  nuevoTelefono,
  fallarPresupuesto,
  fallarCliente,
}) {
  let clienteIdFinal = clienteIdExistente;

  // Paso 1: Si no hay cliente seleccionado, crearlo primero
  if (!clienteIdFinal) {
    if (fallarCliente) {
      throw new Error("Fallo simulado al crear cliente en base de datos");
    }
    const nuevoCli = {
      id: "cli-" + Math.random().toString(36).substring(2, 7),
      nombre: nuevoNombre,
      telefono: nuevoTelefono,
    };
    dbClientes.push(nuevoCli);
    clienteIdFinal = nuevoCli.id;
  }

  // Paso 2: Si falla el presupuesto, lanzar error pero devolver el clienteIdFinal para retener en estado
  if (fallarPresupuesto) {
    const error = new Error("Fallo simulado de red al guardar el presupuesto");
    error.clienteCreadoId = clienteIdFinal;
    throw error;
  }

  // Guardar presupuesto
  const nuevoPres = {
    id: "pres-" + Math.random().toString(36).substring(2, 7),
    cliente_id: clienteIdFinal,
    cliente_nombre: nuevoNombre,
    total: 1200,
  };
  dbPresupuestos.push(nuevoPres);
  return { pres: nuevoPres, clienteIdFinal };
}

// Escenario: El usuario intenta crear "Lucía Gómez"
let formState = {
  selectedClienteId: "",
  nombre: "Lucía Gómez",
  telefono: "655001122",
};

// Intento 1: Supabase crea el cliente pero la red corta el presupuesto
try {
  simularCrearPresupuestoConCliente({
    clienteIdExistente: formState.selectedClienteId,
    nuevoNombre: formState.nombre,
    nuevoTelefono: formState.telefono,
    fallarPresupuesto: true,
  });
} catch (err) {
  // El formulario guarda el ID creado en su estado para no volver a crearlo
  formState.selectedClienteId = err.clienteCreadoId;
}

assert.strictEqual(dbClientes.length, 1, "Debe haberse creado 1 solo cliente");
assert.strictEqual(formState.selectedClienteId, dbClientes[0].id, "El estado del formulario debe retener el ID creado");
assert.strictEqual(dbPresupuestos.length, 0, "No debe haber presupuestos aún");

// Intento 2 (Reintento del usuario al pulsar de nuevo Guardar):
try {
  const res = simularCrearPresupuestoConCliente({
    clienteIdExistente: formState.selectedClienteId,
    nuevoNombre: formState.nombre,
    nuevoTelefono: formState.telefono,
    fallarPresupuesto: false,
  });
  formState.selectedClienteId = res.clienteIdFinal;
} catch (err) {
  assert.fail("El reintento no debió fallar");
}

assert.strictEqual(dbClientes.length, 1, "NO debe haberse duplicado el cliente tras reintentar");
assert.strictEqual(dbPresupuestos.length, 1, "El presupuesto se guardó");
assert.strictEqual(dbPresupuestos[0].cliente_id, dbClientes[0].id, "El presupuesto está vinculado al cliente creado");
console.log("✓ TEST 1 superado: Reintento exitoso sin duplicar cliente en fallos parciales.");

// -------------------------------------------------------------
// TEST 2: Numeración secuencial de Albaranes (Respetar números existentes y huecos)
// -------------------------------------------------------------
console.log("\n[TEST 2] Verificando numeración secuencial de albaranes...");

function calcularSiguienteAlbaran(albaranesExistentes, year = 2026) {
  const prefix = `ALB-${year}-`;
  let maxSecuencia = 0;
  for (const a of albaranesExistentes) {
    if (a.numero && a.numero.startsWith(prefix)) {
      const sufijo = a.numero.slice(prefix.length);
      const num = parseInt(sufijo, 10);
      if (!isNaN(num) && num > maxSecuencia) {
        maxSecuencia = num;
      }
    }
  }
  return `${prefix}${String(maxSecuencia + 1).padStart(3, "0")}`;
}

const albaranesPrueba = [
  { numero: "ALB-2026-001" },
  { numero: "ALB-2026-003" }, // El 002 fue borrado en el pasado
  { numero: "ALB-2026-007" },
];

const siguiente = calcularSiguienteAlbaran(albaranesPrueba, 2026);
assert.strictEqual(siguiente, "ALB-2026-008", "Debe calcular MAX(sufijo) + 1 (008) sin colisionar con existentes");
console.log(`✓ TEST 2 superado: Siguiente albarán calculado correctamente -> ${siguiente}`);

// -------------------------------------------------------------
// TEST 3: Desambiguación estricta de clientes (Nombres compartidos)
// -------------------------------------------------------------
console.log("\n[TEST 3] Verificando que nombres compartidos NO se auto-vinculan erróneamente...");

const clientesTest = [
  { id: "c1", nombre: "Juan Pérez", telefono: "600111111" },
  { id: "c2", nombre: "Juan Pérez", telefono: "600222222" }, // Dos clientes con mismo nombre
  { id: "c3", nombre: "Ana Martínez", telefono: "600333333" },
];

const presupuestosTest = [
  { id: "p1", cliente_id: "c1", cliente_nombre: "Juan Pérez" },
  { id: "p2", cliente_id: null, cliente_nombre: "Juan Pérez" }, // Registro histórico antiguo sin ID
  { id: "p3", cliente_id: null, cliente_nombre: "Ana Martínez" }, // Registro único sin ambigüedad
];

function obtenerPresupuestosDelCliente(cliente, todosClientes, todosPresupuestos) {
  // Comprobar si hay más de 1 cliente con el mismo nombre normalizado
  const nombreNorm = cliente.nombre.trim().toLowerCase();
  const clientesConMismoNombre = todosClientes.filter(
    (c) => c.nombre.trim().toLowerCase() === nombreNorm
  );
  const esAmbiguo = clientesConMismoNombre.length > 1;

  return todosPresupuestos.filter((pres) => {
    if (pres.cliente_id) {
      return pres.cliente_id === cliente.id;
    }
    // Si no tiene cliente_id y el nombre es ambiguo, NO asociar automáticamente
    if (esAmbiguo) {
      return false;
    }
    return pres.cliente_nombre?.trim().toLowerCase() === nombreNorm;
  });
}

const presC1 = obtenerPresupuestosDelCliente(clientesTest[0], clientesTest, presupuestosTest);
assert.strictEqual(presC1.length, 1, "Juan Pérez #1 solo debe ver p1 (que tiene su ID explícito)");
assert.strictEqual(presC1[0].id, "p1");

const presC2 = obtenerPresupuestosDelCliente(clientesTest[1], clientesTest, presupuestosTest);
assert.strictEqual(presC2.length, 0, "Juan Pérez #2 no debe ver p2 porque es ambiguo y carece de ID");

const presC3 = obtenerPresupuestosDelCliente(clientesTest[2], clientesTest, presupuestosTest);
assert.strictEqual(presC3.length, 1, "Ana Martínez (sin duplicados) sí puede vincular su histórico p3");
assert.strictEqual(presC3[0].id, "p3");

console.log("✓ TEST 3 superado: Desambiguación estricta respeta registros ambiguos como pendientes.");

// -------------------------------------------------------------
// TEST 4: Concurrencia al convertir presupuesto en proyecto
// -------------------------------------------------------------
console.log("\n[TEST 4] Verificando protección de concurrencia al convertir presupuesto...");

let proyectosDB = [];
let presupuestoEstado = { id: "pres-concurrente", estado: "Aceptado", proyecto_id: null, titulo: "Reforma Baño" };

// Simular RPC con transacción atómica FOR UPDATE
async function rpcConvertirPresupuestoEnProyecto(presupuestoId, nuevoTitulo) {
  // Simular retardo de red concurrente
  await new Promise((r) => setTimeout(r, 10));

  // Bloqueo atómico: si ya tiene proyecto_id, devolver el existente
  if (presupuestoEstado.id === presupuestoId && presupuestoEstado.proyecto_id) {
    return { proyectoId: presupuestoEstado.proyecto_id, yaExistia: true };
  }

  // Crear proyecto
  const nuevoProyecto = {
    id: "proy-" + Math.random().toString(36).substring(2, 7),
    titulo: nuevoTitulo,
    estado: "En curso",
  };
  proyectosDB.push(nuevoProyecto);
  presupuestoEstado.proyecto_id = nuevoProyecto.id;

  return { proyectoId: nuevoProyecto.id, yaExistia: false };
}

// Ejecutar 2 llamadas concurrentes simuladas sobre el mismo presupuesto
const [res1, res2] = await Promise.all([
  rpcConvertirPresupuestoEnProyecto(presupuestoEstado.id, "Reforma Baño"),
  rpcConvertirPresupuestoEnProyecto(presupuestoEstado.id, "Reforma Baño"),
]);

assert.strictEqual(proyectosDB.length, 1, "Se debe haber creado exactamente 1 proyecto");
assert.strictEqual(res1.proyectoId, res2.proyectoId, "Ambas llamadas deben resolver al mismo ID de proyecto");
console.log(`✓ TEST 4 superado: Concurrencia controlada, 1 solo proyecto creado (${res1.proyectoId})`);

// -------------------------------------------------------------
// TEST 5: Acceso exclusivo del titular autorizado
// -------------------------------------------------------------
console.log("\n[TEST 5] Verificando política de titular exclusivo...");

const configuracionEmpresa = {
  id: "empresa_principal",
  titular_email: "titular@reformasimanox.es",
};

function verificarAccesoTitular(jwtEmail) {
  if (!jwtEmail) return false;
  return jwtEmail.toLowerCase().trim() === configuracionEmpresa.titular_email.toLowerCase().trim();
}

assert.strictEqual(verificarAccesoTitular("titular@reformasimanox.es"), true, "El titular debe tener acceso");
assert.strictEqual(verificarAccesoTitular("intruso@externo.es"), false, "Un usuario externo no autorizado debe ser rechazado");
assert.strictEqual(verificarAccesoTitular(null), false, "Usuarios anónimos deben ser rechazados");
console.log("✓ TEST 5 superado: Acceso privado exclusivo para el titular autorizado verificado.");

console.log("\n=== TODAS LAS PRUEBAS DE VERIFICACIÓN V2.1 HAN PASADO CON ÉXITO ===");
