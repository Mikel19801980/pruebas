const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zelgwszwuioyeyuepdcf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_D-O_HSpD7af6fB42a3Q4yA_fHXE798G';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('--- Iniciando Carga de Datos Iniciales en Supabase ---');

  // 1. Proyectos
  const p1Id = crypto.randomUUID();
  const p2Id = crypto.randomUUID();
  const p3Id = crypto.randomUUID();
  const p4Id = crypto.randomUUID();

  const proyectos = [
    {
      id: p1Id,
      titulo: 'Reforma Integral Baño Almenara',
      cliente_nombre: 'Carlos Martínez',
      cliente_telefono: '622114455',
      estado: 'En curso',
      fecha_inicio: new Date().toISOString().slice(0, 10),
    },
    {
      id: p2Id,
      titulo: 'Reforma Cocina Los Rosales',
      cliente_nombre: 'Elena Gómez',
      cliente_telefono: '633889900',
      estado: 'En curso',
      fecha_inicio: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10),
    },
    {
      id: p3Id,
      titulo: 'Sustitución Cuadro y Cableado Eléctrico',
      cliente_nombre: 'David Ruiz',
      cliente_telefono: '655443322',
      estado: 'Pendiente',
      fecha_inicio: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    },
    {
      id: p4Id,
      titulo: 'Pintura Completa Piso 90m2',
      cliente_nombre: 'Sara Montero',
      cliente_telefono: '611223344',
      estado: 'Pendiente',
      fecha_inicio: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    },
  ];

  const { error: errProy } = await supabase.from('proyectos').insert(proyectos);
  if (errProy) console.error('Error insertando proyectos:', errProy);
  else console.log('✓ 4 Proyectos insertados correctamente');

  // 2. Presupuestos
  const pres1Id = crypto.randomUUID();
  const pres2Id = crypto.randomUUID();

  const presupuestos = [
    {
      id: pres1Id,
      titulo: 'Reforma Baño Almenara',
      cliente_nombre: 'Carlos Martínez',
      cliente_telefono: '622114455',
      proyecto_id: p1Id,
      total: 3850,
      forma_pago: '10% reserva y firma, 40% inicio de demolición y fontanería, 30% alicatado y sanitarios, 20% remates finales y entrega.',
      estado: 'Enviado',
    },
    {
      id: pres2Id,
      titulo: 'Cambio de Plato de Ducha y Mampara',
      cliente_nombre: 'Mariano Serrano',
      cliente_telefono: '644123456',
      proyecto_id: null,
      total: 1650,
      forma_pago: '10% a la aceptación, 50% al inicio de trabajos, 40% a la colocación de mampara y prueba de agua.',
      estado: 'Borrador',
    },
  ];

  const { error: errPres } = await supabase.from('presupuestos').insert(presupuestos);
  if (errPres) console.error('Error insertando presupuestos:', errPres);
  else console.log('✓ 2 Presupuestos insertados correctamente');

  // 3. Partidas Presupuesto
  const partidas = [
    {
      id: crypto.randomUUID(),
      presupuesto_id: pres1Id,
      concepto: 'Picado de azulejos antiguos y desescombro a vertedero',
      gremio: 'Albañilería',
      cantidad: 30,
      unidad: 'm²',
      precio_unitario: 25,
      precio: 750,
    },
    {
      id: crypto.randomUUID(),
      presupuesto_id: pres1Id,
      concepto: 'Instalación de fontanería multicapa y plato de ducha de resina',
      gremio: 'Fontanería',
      cantidad: 1,
      unidad: 'ud',
      precio_unitario: 1200,
      precio: 1200,
    },
    {
      id: crypto.randomUUID(),
      presupuesto_id: pres1Id,
      concepto: 'Alicatado porcelánico rectificado 60x120 y enlechado',
      gremio: 'Albañilería',
      cantidad: 30,
      unidad: 'm²',
      precio_unitario: 45,
      precio: 1350,
    },
    {
      id: crypto.randomUUID(),
      presupuesto_id: pres1Id,
      concepto: 'Montaje de mueble suspendido, lavabo, grifería y espejo led',
      gremio: 'Fontanería',
      cantidad: 1,
      unidad: 'ud',
      precio_unitario: 550,
      precio: 550,
    },
    {
      id: crypto.randomUUID(),
      presupuesto_id: pres2Id,
      concepto: 'Desmontaje de bañera existente y retirada de escombros',
      gremio: 'Albañilería',
      cantidad: 1,
      unidad: 'ud',
      precio_unitario: 450,
      precio: 450,
    },
    {
      id: crypto.randomUUID(),
      presupuesto_id: pres2Id,
      concepto: 'Suministro e instalación plato de resina pizarra 120x80 y mampara cromo',
      gremio: 'Fontanería',
      cantidad: 1,
      unidad: 'ud',
      precio_unitario: 1200,
      precio: 1200,
    },
  ];

  const { error: errPart } = await supabase.from('partidas_presupuesto').insert(partidas);
  if (errPart) console.error('Error insertando partidas:', errPart);
  else console.log('✓ 6 Partidas de presupuesto insertadas correctamente');

  // 4. Lista de compras
  const compras = [
    {
      id: crypto.randomUUID(),
      proyecto_id: p1Id,
      material: '10 sacos de cemento cola C2TE y crucetas 1.5mm',
      proveedor: 'Obramat / Bricomart',
      gremio: 'Albañilería',
      comprado: false,
    },
    {
      id: crypto.randomUUID(),
      proyecto_id: p1Id,
      material: 'Bote sifónico extraplano y 4m tubo PVC 40mm',
      proveedor: 'Almacén Fontanería',
      gremio: 'Fontanería',
      comprado: true,
    },
    {
      id: crypto.randomUUID(),
      proyecto_id: p2Id,
      material: 'Placas pladur hidrófugo y montantes 48mm',
      proveedor: 'Obramat / Bricomart',
      gremio: 'Pladur',
      comprado: false,
    },
    {
      id: crypto.randomUUID(),
      proyecto_id: p1Id,
      material: 'Perfil mampara cromo y anclajes especiales',
      proveedor: 'Cerrajería Almenara',
      gremio: 'Cerrajería',
      comprado: false,
    },
  ];

  const { error: errComp } = await supabase.from('listas_compra').insert(compras);
  if (errComp) console.error('Error insertando compras:', errComp);
  else console.log('✓ 4 Materiales de compra insertados correctamente');

  // 5. Eventos agenda
  const eventos = [
    {
      id: crypto.randomUUID(),
      proyecto_id: p1Id,
      titulo: 'Instalación de tuberías y desagüe ducha',
      fecha_hora: new Date(Date.now() + 3600000 * 2).toISOString(),
      tipo: 'Trabajo',
      gremio: 'Fontanería',
    },
    {
      id: crypto.randomUUID(),
      proyecto_id: p1Id,
      titulo: 'Recepción de alicatado y comprobación niveles',
      fecha_hora: new Date(Date.now() + 86400000).toISOString(),
      tipo: 'Visita',
      gremio: 'Albañilería',
    },
    {
      id: crypto.randomUUID(),
      proyecto_id: p2Id,
      titulo: 'Montaje de tomas eléctricas para vitro y horno',
      fecha_hora: new Date(Date.now() + 86400000 * 2).toISOString(),
      tipo: 'Trabajo',
      gremio: 'Electricidad',
    },
  ];

  const { error: errEve } = await supabase.from('eventos_agenda').insert(eventos);
  if (errEve) console.error('Error insertando eventos:', errEve);
  else console.log('✓ 3 Eventos de agenda insertados correctamente');

  console.log('--- Datos de prueba cargados con éxito en Supabase ---');
}

seed();
