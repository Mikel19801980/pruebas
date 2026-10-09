-- ========================================================
-- ESQUEMA SQL COMPLETO Y MIGRACIÓN IDEMPOTENTE PARA SUPABASE
-- PLATAFORMA DE OFICIOS (REFORMAS & ELECTRICIDAD) v2.1
-- ========================================================
-- Este script es 100% IDEMPOTENTE, SEGURO y NO DESTRUCTIVO:
-- 1. Conserva todos los datos históricos existentes y fechas.
-- 2. Añade estado 'Rechazado' a presupuestos.
-- 3. Crea la tabla 'configuracion_empresa' para sincronizar identidad y titular.
-- 4. Protege el acceso exclusivamente para el titular autorizado (RLS privado).
-- 5. Función atómica para correlativo de albaranes y creación única de obras (RPC FOR UPDATE).
-- ========================================================

-- ========================================================
-- 1. TABLA: configuracion_empresa (Centralizada en Supabase)
-- ========================================================
CREATE TABLE IF NOT EXISTS configuracion_empresa (
  id TEXT PRIMARY KEY DEFAULT 'empresa_principal',
  admin_email TEXT,
  titular_email TEXT,
  oficio_id TEXT NOT NULL DEFAULT 'reformas',
  plan_nivel TEXT NOT NULL DEFAULT 'organizado',
  tema_id TEXT NOT NULL DEFAULT 'tema_clasico',
  empresa JSONB NOT NULL DEFAULT '{}'::jsonb,
  preferencias JSONB NOT NULL DEFAULT '{}'::jsonb,
  web_publica JSONB NOT NULL DEFAULT '{}'::jsonb,
  borrador_web_publica JSONB NOT NULL DEFAULT '{}'::jsonb,
  borrador_empresa JSONB NOT NULL DEFAULT '{}'::jsonb,
  estado_publicacion TEXT NOT NULL DEFAULT 'publicado',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS admin_email TEXT;
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS titular_email TEXT;
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS oficio_id TEXT DEFAULT 'reformas';
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS plan_nivel TEXT DEFAULT 'organizado';
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS tema_id TEXT DEFAULT 'tema_clasico';
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS empresa JSONB DEFAULT '{}'::jsonb;
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS preferencias JSONB DEFAULT '{}'::jsonb;
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS web_publica JSONB DEFAULT '{}'::jsonb;
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS borrador_web_publica JSONB DEFAULT '{}'::jsonb;
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS borrador_empresa JSONB DEFAULT '{}'::jsonb;
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS estado_publicacion TEXT DEFAULT 'publicado';
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Restricción de niveles: Solo nivel 1 (básico) y nivel 2 (organizado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_config_plan_nivel'
  ) THEN
    ALTER TABLE configuracion_empresa 
      ADD CONSTRAINT chk_config_plan_nivel CHECK (plan_nivel IN ('basico', 'organizado'));
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Semilla inicial neutra de configuración de empresa
INSERT INTO configuracion_empresa (id, oficio_id, plan_nivel, empresa, preferencias)
VALUES (
  'empresa_principal',
  'reformas',
  'organizado',
  '{
    "nombreComercial": "Mi Empresa de Reformas",
    "subtitulo": "Especialistas en Reformas y Construcción",
    "cifNif": "",
    "telefono": "",
    "email": "",
    "direccion": "",
    "colorPrimario": "#ea580c"
  }'::jsonb,
  '{
    "agruparPorObra": true,
    "mostrarSelectorGremios": true,
    "vistaOperarioActiva": false
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- 2. TABLA: clientes (Directorio y cartera de clientes)
-- ========================================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  nif TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- 3. TABLA: proyectos (Obras y Trabajos activos)
-- ========================================================
CREATE TABLE IF NOT EXISTS proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  estado TEXT CHECK (estado IN ('Pendiente', 'En curso', 'Terminado')) DEFAULT 'En curso',
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

-- ========================================================
-- 4. TABLA: presupuestos (Con estado 'Rechazado' y fecha_emision segura)
-- ========================================================
CREATE TABLE IF NOT EXISTS presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL DEFAULT 'Presupuesto',
  cliente_nombre TEXT NOT NULL DEFAULT 'Cliente',
  cliente_telefono TEXT,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
  total NUMERIC(10, 2) DEFAULT 0,
  forma_pago TEXT,
  forma_pago_tipo TEXT DEFAULT 'porcentajes',
  fecha_emision DATE DEFAULT CURRENT_DATE,
  enlace_pdf TEXT,
  estado TEXT DEFAULT 'Borrador',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Actualizar columnas
ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS forma_pago_tipo TEXT DEFAULT 'porcentajes';

-- MIGRACIÓN SEGURA DE fecha_emision
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'presupuestos' AND column_name = 'fecha_emision'
  ) THEN
    ALTER TABLE presupuestos ADD COLUMN fecha_emision DATE;
  END IF;
  
  UPDATE presupuestos 
  SET fecha_emision = COALESCE(created_at::date, CURRENT_DATE)
  WHERE fecha_emision IS NULL;
  
  ALTER TABLE presupuestos ALTER COLUMN fecha_emision SET DEFAULT CURRENT_DATE;
END $$;

-- MIGRACIÓN DE ESTADO: Añadir 'Rechazado' de forma segura
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Eliminar constraints antiguos sobre el estado de presupuestos
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'presupuestos'::regclass AND contype = 'c' AND conname LIKE '%estado%'
  ) LOOP
    EXECUTE 'ALTER TABLE presupuestos DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;

  -- Aplicar nuevo constraint que incluye 'Rechazado'
  ALTER TABLE presupuestos ADD CONSTRAINT presupuestos_estado_check 
    CHECK (estado IN ('Borrador', 'Enviado', 'Aceptado', 'Rechazado'));
END $$;

-- ========================================================
-- 5. TABLA: partidas_presupuesto
-- ========================================================
CREATE TABLE IF NOT EXISTS partidas_presupuesto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  gremio TEXT NOT NULL,
  cantidad NUMERIC(10, 2) DEFAULT 1,
  unidad TEXT DEFAULT 'ud',
  precio_unitario NUMERIC(10, 2) DEFAULT 0,
  precio NUMERIC(10, 2) NOT NULL DEFAULT 0,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- 6. TABLA: listas_compra (Permite compras sin obra / ON DELETE SET NULL)
-- ========================================================
CREATE TABLE IF NOT EXISTS listas_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID,
  material TEXT NOT NULL,
  proveedor TEXT DEFAULT 'Almacén',
  gremio TEXT DEFAULT 'General',
  comprado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar que proyecto_id es NULLABLE y relación ON DELETE SET NULL
DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listas_compra' AND column_name = 'proyecto_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE listas_compra ALTER COLUMN proyecto_id DROP NOT NULL;
  END IF;

  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'listas_compra'
      AND kcu.column_name = 'proyecto_id'
  ) LOOP
    EXECUTE 'ALTER TABLE listas_compra DROP CONSTRAINT ' || quote_ident(r.constraint_name);
  END LOOP;

  ALTER TABLE listas_compra
    ADD CONSTRAINT fk_listas_compra_proyecto
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL;
END $$;

-- ========================================================
-- 7. TABLA: eventos_agenda (Permite citas sin obra / ON DELETE SET NULL)
-- ========================================================
CREATE TABLE IF NOT EXISTS eventos_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  fecha_hora TIMESTAMPTZ NOT NULL,
  tipo TEXT CHECK (tipo IN ('Visita', 'Trabajo', 'Reunión')) DEFAULT 'Trabajo',
  gremio TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE eventos_agenda ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'eventos_agenda' AND column_name = 'proyecto_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE eventos_agenda ALTER COLUMN proyecto_id DROP NOT NULL;
  END IF;

  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'eventos_agenda'
      AND kcu.column_name = 'proyecto_id'
  ) LOOP
    EXECUTE 'ALTER TABLE eventos_agenda DROP CONSTRAINT ' || quote_ident(r.constraint_name);
  END LOOP;

  ALTER TABLE eventos_agenda
    ADD CONSTRAINT fk_eventos_agenda_proyecto
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL;
END $$;

-- ========================================================
-- 8. TABLA: informes (Dossier fotográfico documental)
-- ========================================================
CREATE TABLE IF NOT EXISTS informes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT,
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fotos JSONB DEFAULT '[]'::jsonb,
  fecha DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE informes ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

-- ========================================================
-- 9. TABLA: albaranes (Con numeración única no repetible)
-- ========================================================
CREATE TABLE IF NOT EXISTS albaranes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT,
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  lineas JSONB DEFAULT '[]'::jsonb,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar UNIQUE(numero) para que dos dispositivos nunca dupliquen número
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'albaranes_numero_key'
  ) THEN
    ALTER TABLE albaranes ADD CONSTRAINT albaranes_numero_key UNIQUE (numero);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- TABLA: secuencias_albaranes (Garantiza reserva atómica correlativa sin duplicados)
CREATE TABLE IF NOT EXISTS secuencias_albaranes (
  year INT PRIMARY KEY,
  ultimo_numero INT NOT NULL DEFAULT 0
);

-- FUNCIÓN RPC: Obtener siguiente número correlativo de albarán atómico y seguro
CREATE OR REPLACE FUNCTION obtener_siguiente_numero_albaran(p_year INT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_prefix TEXT;
  v_max_existente INT;
  v_siguiente INT;
BEGIN
  IF NOT es_usuario_autorizado() THEN
    RAISE EXCEPTION 'Acceso denegado: únicamente el titular o administrador autorizado puede solicitar números de albarán.';
  END IF;

  v_prefix := 'ALB-' || p_year || '-';

  -- Extraer el número más alto existente en albaranes para sincronizar la secuencia
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(substring(numero from length(v_prefix) + 1), '[^0-9]', '', 'g'), '')::INT
  ), 0)
  INTO v_max_existente
  FROM albaranes
  WHERE numero LIKE v_prefix || '%';

  -- Reserva atómica en secuencias_albaranes con incremento y bloqueo
  INSERT INTO secuencias_albaranes (year, ultimo_numero)
  VALUES (p_year, v_max_existente + 1)
  ON CONFLICT (year) DO UPDATE
  SET ultimo_numero = GREATEST(secuencias_albaranes.ultimo_numero, v_max_existente) + 1
  RETURNING ultimo_numero INTO v_siguiente;

  RETURN v_prefix || lpad(v_siguiente::TEXT, 3, '0');
END;
$$;

REVOKE EXECUTE ON FUNCTION obtener_siguiente_numero_albaran(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION obtener_siguiente_numero_albaran(INT) TO authenticated;

-- ========================================================
-- 10. TABLA: partes_trabajo
-- ========================================================
CREATE TABLE IF NOT EXISTS partes_trabajo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_nombre TEXT NOT NULL,
  trabajo_o_cliente TEXT NOT NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  que_se_hizo TEXT NOT NULL,
  horas_texto TEXT,
  materiales_texto TEXT,
  fotos JSONB DEFAULT '[]'::jsonb,
  terminado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- 11. MIGRACIÓN NO AMBIGUA: ASOCIACIÓN DE CLIENTES HISTÓRICOS
-- No adivina: solo vincula si hay un único cliente unívoco
-- ========================================================
DO $$
BEGIN
  -- 1. Presupuestos por teléfono unívoco
  UPDATE presupuestos p
  SET cliente_id = c.id
  FROM clientes c
  WHERE p.cliente_id IS NULL
    AND p.cliente_telefono IS NOT NULL
    AND c.telefono = p.cliente_telefono
    AND (SELECT count(*) FROM clientes c2 WHERE c2.telefono = p.cliente_telefono) = 1;

  -- 2. Presupuestos por nombre unívoco (solo si no hay ningún otro cliente con ese nombre)
  UPDATE presupuestos p
  SET cliente_id = c.id
  FROM clientes c
  WHERE p.cliente_id IS NULL
    AND p.cliente_nombre IS NOT NULL
    AND lower(trim(c.nombre)) = lower(trim(p.cliente_nombre))
    AND (SELECT count(*) FROM clientes c2 WHERE lower(trim(c2.nombre)) = lower(trim(p.cliente_nombre))) = 1;

  -- 3. Informes por teléfono unívoco
  UPDATE informes i
  SET cliente_id = c.id
  FROM clientes c
  WHERE i.cliente_id IS NULL
    AND i.cliente_telefono IS NOT NULL
    AND c.telefono = i.cliente_telefono
    AND (SELECT count(*) FROM clientes c2 WHERE c2.telefono = i.cliente_telefono) = 1;

  -- 4. Informes por nombre unívoco
  UPDATE informes i
  SET cliente_id = c.id
  FROM clientes c
  WHERE i.cliente_id IS NULL
    AND i.cliente_nombre IS NOT NULL
    AND lower(trim(c.nombre)) = lower(trim(i.cliente_nombre))
    AND (SELECT count(*) FROM clientes c2 WHERE lower(trim(c2.nombre)) = lower(trim(i.cliente_nombre))) = 1;
END $$;

-- ========================================================
-- 12. HELPERS DE SEGURIDAD: ADMINISTRADOR Y TITULAR AUTORIZADO
-- ========================================================
CREATE OR REPLACE FUNCTION es_administrador_autorizado()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN auth.jwt() ->> 'email' IS NULL THEN FALSE
    WHEN (SELECT admin_email FROM configuracion_empresa WHERE id = 'empresa_principal') IS NULL THEN FALSE
    WHEN lower(trim(auth.jwt() ->> 'email')) = lower(trim((SELECT admin_email FROM configuracion_empresa WHERE id = 'empresa_principal'))) THEN TRUE
    ELSE FALSE
  END;
$$;

CREATE OR REPLACE FUNCTION es_titular_autorizado()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN auth.jwt() ->> 'email' IS NULL THEN FALSE
    WHEN (SELECT titular_email FROM configuracion_empresa WHERE id = 'empresa_principal') IS NULL THEN FALSE
    WHEN lower(trim(auth.jwt() ->> 'email')) = lower(trim((SELECT titular_email FROM configuracion_empresa WHERE id = 'empresa_principal'))) THEN TRUE
    ELSE FALSE
  END;
$$;

CREATE OR REPLACE FUNCTION es_usuario_autorizado()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(es_administrador_autorizado(), FALSE) OR COALESCE(es_titular_autorizado(), FALSE);
$$;

-- TRIGGER DE PROTECCIÓN: Proteger modulos_activos, plan_nivel, oficio_id, tema_id, web_publica y cuentas
CREATE OR REPLACE FUNCTION validar_modificacion_configuracion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Si es una operación de borrado, RECHAZAR SIEMPRE
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Acceso denegado: La configuración principal de la empresa (empresa_principal) no puede ser eliminada.';
  END IF;

  -- 1. Si es aprovisionamiento inicial (la instalación no tiene admin_email configurado todavía)
  IF OLD.admin_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. Si se ejecuta desde sesión administrativa de superusuario / service_role
  IF current_user IN ('postgres', 'supabase_admin') OR COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- 3. Si es el administrador autorizado registrado en la instalación
  IF es_administrador_autorizado() THEN
    RETURN NEW;
  END IF;

  -- 4. Si es titular autorizado, SOLO puede modificar ajustes operativos autorizados y datos de empresa
  IF es_titular_autorizado() THEN
    IF NEW.plan_nivel IS DISTINCT FROM OLD.plan_nivel THEN
      RAISE EXCEPTION 'Acceso denegado: El titular no tiene permisos para modificar el nivel contratado.';
    END IF;
    IF NEW.oficio_id IS DISTINCT FROM OLD.oficio_id THEN
      RAISE EXCEPTION 'Acceso denegado: El titular no tiene permisos para modificar la actividad u oficio de la instalación.';
    END IF;
    IF NEW.tema_id IS DISTINCT FROM OLD.tema_id THEN
      RAISE EXCEPTION 'Acceso denegado: El titular no tiene permisos para modificar el tema de diseño.';
    END IF;
    IF NEW.admin_email IS DISTINCT FROM OLD.admin_email THEN
      RAISE EXCEPTION 'Acceso denegado: El titular no puede modificar la cuenta del administrador.';
    END IF;
    IF NEW.titular_email IS DISTINCT FROM OLD.titular_email THEN
      RAISE EXCEPTION 'Acceso denegado: El titular no puede reasignar la cuenta del titular.';
    END IF;
    IF (NEW.preferencias->'modulos_activos') IS DISTINCT FROM (OLD.preferencias->'modulos_activos') THEN
      RAISE EXCEPTION 'Acceso denegado: El titular no tiene permisos para activar o desactivar módulos de la instalación.';
    END IF;
    IF NEW.web_publica IS DISTINCT FROM OLD.web_publica OR NEW.borrador_web_publica IS DISTINCT FROM OLD.borrador_web_publica THEN
      RAISE EXCEPTION 'Acceso denegado: El titular no tiene permisos para modificar o publicar la web comercial.';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Acceso denegado: Cuenta no autorizada para modificar la configuración.';
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_configuracion ON configuracion_empresa;
CREATE TRIGGER trg_proteger_configuracion
  BEFORE UPDATE OR DELETE ON configuracion_empresa
  FOR EACH ROW
  EXECUTE FUNCTION validar_modificacion_configuracion();

-- FUNCIÓN HELPER: Comprueba si un módulo funcional está habilitado en la instalación
CREATE OR REPLACE FUNCTION modulo_esta_activo(p_modulo TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    -- Si no hay modulos_activos configurados, comprobar por plan_nivel
    WHEN (SELECT preferencias->'modulos_activos' FROM configuracion_empresa WHERE id = 'empresa_principal') IS NULL THEN
      CASE 
        WHEN p_modulo IN ('albaranes', 'obras', 'agenda', 'compras') THEN
          COALESCE((SELECT plan_nivel = 'organizado' FROM configuracion_empresa WHERE id = 'empresa_principal'), FALSE)
        ELSE TRUE
      END
    -- Si hay modulos_activos en JSONB
    ELSE
      COALESCE((
        SELECT preferencias->'modulos_activos' @> to_jsonb(p_modulo)
        FROM configuracion_empresa 
        WHERE id = 'empresa_principal'
      ), FALSE)
  END;
$$;

-- TRIGGER DE INTEGRIDAD: Rechaza escrituras y borrados en módulos desactivados conservando datos históricos
CREATE OR REPLACE FUNCTION validar_modulo_activo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_modulo TEXT;
BEGIN
  v_modulo := TG_ARGV[0];
  IF NOT modulo_esta_activo(v_modulo) THEN
    RAISE EXCEPTION 'Operación rechazada: El módulo "%" está desactivado en la configuración de la instalación.', v_modulo;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_modulo_albaranes ON albaranes;
CREATE TRIGGER trg_validar_modulo_albaranes
  BEFORE INSERT OR UPDATE OR DELETE ON albaranes
  FOR EACH ROW
  EXECUTE FUNCTION validar_modulo_activo('albaranes');

DROP TRIGGER IF EXISTS trg_validar_modulo_compras ON listas_compra;
CREATE TRIGGER trg_validar_modulo_compras
  BEFORE INSERT OR UPDATE OR DELETE ON listas_compra
  FOR EACH ROW
  EXECUTE FUNCTION validar_modulo_activo('compras');

DROP TRIGGER IF EXISTS trg_validar_modulo_agenda ON eventos_agenda;
CREATE TRIGGER trg_validar_modulo_agenda
  BEFORE INSERT OR UPDATE OR DELETE ON eventos_agenda
  FOR EACH ROW
  EXECUTE FUNCTION validar_modulo_activo('agenda');

DROP TRIGGER IF EXISTS trg_validar_modulo_informes ON informes;
CREATE TRIGGER trg_validar_modulo_informes
  BEFORE INSERT OR UPDATE OR DELETE ON informes
  FOR EACH ROW
  EXECUTE FUNCTION validar_modulo_activo('informes');

DROP TRIGGER IF EXISTS trg_validar_modulo_obras ON proyectos;
CREATE TRIGGER trg_validar_modulo_obras
  BEFORE INSERT OR UPDATE OR DELETE ON proyectos
  FOR EACH ROW
  EXECUTE FUNCTION validar_modulo_activo('obras');

DROP TRIGGER IF EXISTS trg_validar_modulo_partes ON partes_trabajo;
CREATE TRIGGER trg_validar_modulo_partes
  BEFORE INSERT OR UPDATE OR DELETE ON partes_trabajo
  FOR EACH ROW
  EXECUTE FUNCTION validar_modulo_activo('obras');

DROP TRIGGER IF EXISTS trg_validar_modulo_presupuestos ON presupuestos;
CREATE TRIGGER trg_validar_modulo_presupuestos
  BEFORE INSERT OR UPDATE OR DELETE ON presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION validar_modulo_activo('presupuestos');

DROP TRIGGER IF EXISTS trg_validar_modulo_partidas ON partidas_presupuesto;
CREATE TRIGGER trg_validar_modulo_partidas
  BEFORE INSERT OR UPDATE OR DELETE ON partidas_presupuesto
  FOR EACH ROW
  EXECUTE FUNCTION validar_modulo_activo('presupuestos');

-- FUNCIÓN RPC: Procedimiento explícito y seguro para aprovisionar instalación
CREATE OR REPLACE FUNCTION provisionar_instalacion(
  p_admin_email TEXT,
  p_titular_email TEXT,
  p_plan_nivel TEXT DEFAULT 'organizado'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan_nivel TEXT;
  v_modulos JSONB;
BEGIN
  IF p_admin_email IS NULL OR trim(p_admin_email) = '' THEN
    RAISE EXCEPTION 'El correo del administrador técnico es obligatorio para aprovisionar.';
  END IF;

  -- Si ya está provisionada previamente, comprobar que quien ejecuta es administrador o service_role
  IF (SELECT admin_email FROM configuracion_empresa WHERE id = 'empresa_principal') IS NOT NULL THEN
    IF NOT (es_administrador_autorizado() OR current_user IN ('postgres', 'supabase_admin') OR COALESCE(auth.role(), '') = 'service_role') THEN
      RAISE EXCEPTION 'Acceso denegado: Solo el administrador autorizado puede reprovisionar la instalación.';
    END IF;
  END IF;

  v_plan_nivel := CASE WHEN p_plan_nivel IN ('basico', 'organizado') THEN p_plan_nivel ELSE 'organizado' END;
  v_modulos := CASE 
    WHEN v_plan_nivel = 'basico' THEN '["presupuestos", "informes", "clientes"]'::jsonb
    ELSE '["presupuestos", "informes", "obras", "agenda", "compras", "albaranes", "clientes"]'::jsonb
  END;

  UPDATE configuracion_empresa
  SET
    admin_email = lower(trim(p_admin_email)),
    titular_email = NULLIF(lower(trim(p_titular_email)), ''),
    plan_nivel = v_plan_nivel,
    preferencias = jsonb_set(
      COALESCE(preferencias, '{}'::jsonb),
      '{modulos_activos}',
      v_modulos
    ),
    updated_at = now()
  WHERE id = 'empresa_principal';
END;
$$;

REVOKE EXECUTE ON FUNCTION provisionar_instalacion(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION provisionar_instalacion(TEXT, TEXT, TEXT) TO authenticated, service_role;

-- ========================================================
-- 13. FUNCIÓN RPC ATÓMICA: convertir_presupuesto_en_proyecto
-- Con bloqueo FOR UPDATE y comprobación estricta de usuario autorizado
-- ========================================================
CREATE OR REPLACE FUNCTION convertir_presupuesto_en_proyecto(p_presupuesto_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_presupuesto RECORD;
  v_proyecto RECORD;
  v_nuevo_id UUID;
BEGIN
  -- 1. Comprobación estricta: Rechaza llamadas anónimas y no autorizadas
  IF NOT es_usuario_autorizado() THEN
    RAISE EXCEPTION 'Acceso denegado: únicamente el titular o administrador autorizado puede generar obras';
  END IF;

  -- 2. Bloquear la fila del presupuesto para evitar condiciones de carrera concurrentes
  SELECT * INTO v_presupuesto
  FROM presupuestos
  WHERE id = p_presupuesto_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado con ID %', p_presupuesto_id;
  END IF;

  -- 3. Si ya tiene un proyecto asociado, devolverlo de inmediato sin duplicar
  IF v_presupuesto.proyecto_id IS NOT NULL THEN
    SELECT * INTO v_proyecto
    FROM proyectos
    WHERE id = v_presupuesto.proyecto_id;

    IF FOUND THEN
      RETURN to_jsonb(v_proyecto);
    END IF;
  END IF;

  -- 4. Crear el nuevo proyecto de obra en la misma transacción atómica
  v_nuevo_id := gen_random_uuid();
  INSERT INTO proyectos (
    id,
    titulo,
    cliente_nombre,
    cliente_telefono,
    cliente_id,
    estado,
    fecha_inicio,
    created_at
  ) VALUES (
    v_nuevo_id,
    COALESCE(v_presupuesto.titulo, 'Reforma'),
    COALESCE(v_presupuesto.cliente_nombre, 'Cliente'),
    v_presupuesto.cliente_telefono,
    v_presupuesto.cliente_id,
    'En curso',
    CURRENT_DATE,
    NOW()
  )
  RETURNING * INTO v_proyecto;

  -- 5. Vincular el presupuesto a la nueva obra y marcar como Aceptado
  UPDATE presupuestos
  SET
    proyecto_id = v_nuevo_id,
    estado = 'Aceptado'
  WHERE id = p_presupuesto_id;

  RETURN to_jsonb(v_proyecto);
END;
$$;

REVOKE EXECUTE ON FUNCTION convertir_presupuesto_en_proyecto(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION convertir_presupuesto_en_proyecto(UUID) TO authenticated;

-- ========================================================
-- 14. FUNCIÓN RPC PÚBLICA Y PRIVADA PARA WEB COMERCIAL
-- ========================================================
-- Exponer exclusivamente contenido comercial publicado para visitantes (sin requerir sesión)
CREATE OR REPLACE FUNCTION obtener_web_publica()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT 
    c.oficio_id,
    c.tema_id,
    c.web_publica,
    jsonb_build_object(
      'nombreComercial', COALESCE(c.empresa->>'nombreComercial', ''),
      'subtitulo', COALESCE(c.empresa->>'subtitulo', ''),
      'telefono', COALESCE(c.empresa->>'telefono', ''),
      'email', COALESCE(c.empresa->>'email', ''),
      'direccion', COALESCE(c.empresa->>'direccion', ''),
      'cifNif', COALESCE(c.empresa->>'cifNif', ''),
      'colorPrimario', COALESCE(c.empresa->>'colorPrimario', '#ea580c')
    ) AS empresa_publica
  INTO v_rec
  FROM configuracion_empresa c
  WHERE c.id = 'empresa_principal';

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'oficio_id', v_rec.oficio_id,
    'tema_id', v_rec.tema_id,
    'web_publica', v_rec.web_publica,
    'empresa', v_rec.empresa_publica
  );
END;
$$;

GRANT EXECUTE ON FUNCTION obtener_web_publica() TO PUBLIC, anon, authenticated;

-- Previsualización de borrador exclusivamente para el administrador autorizado
CREATE OR REPLACE FUNCTION obtener_previsualizacion_borrador()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  IF NOT es_administrador_autorizado() THEN
    RAISE EXCEPTION 'Acceso denegado: únicamente el administrador de la instalación puede previsualizar borradores.';
  END IF;

  SELECT 
    c.oficio_id,
    c.tema_id,
    COALESCE(c.borrador_web_publica, c.web_publica) AS web_publica,
    COALESCE(c.borrador_empresa, c.empresa) AS empresa
  INTO v_rec
  FROM configuracion_empresa c
  WHERE c.id = 'empresa_principal';

  RETURN jsonb_build_object(
    'oficio_id', v_rec.oficio_id,
    'tema_id', v_rec.tema_id,
    'web_publica', v_rec.web_publica,
    'empresa', v_rec.empresa
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION obtener_previsualizacion_borrador() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION obtener_previsualizacion_borrador() TO authenticated;

-- ========================================================
-- 15. POLÍTICAS RLS: ACCESO AUTORIZADO (ADMINISTRADOR Y TITULAR)
-- Sin acceso anónimo y protegiendo todas las tablas operativas
-- ========================================================
ALTER TABLE configuracion_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidas_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE listas_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE informes ENABLE ROW LEVEL SECURITY;
ALTER TABLE albaranes ENABLE ROW LEVEL SECURITY;
ALTER TABLE partes_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE secuencias_albaranes ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tablas_operativas TEXT[] := ARRAY[
    'clientes', 'proyectos', 'presupuestos',
    'partidas_presupuesto', 'listas_compra', 'eventos_agenda',
    'informes', 'albaranes', 'partes_trabajo', 'secuencias_albaranes'
  ];
  t TEXT;
BEGIN
  -- 1. Políticas específicas para configuracion_empresa:
  -- SELECT y UPDATE permitidos para usuario autorizado; DELETE totalmente bloqueado para usuarios autenticados
  DROP POLICY IF EXISTS "Acceso total configuracion_empresa" ON configuracion_empresa;
  DROP POLICY IF EXISTS "Acceso titular configuracion_empresa" ON configuracion_empresa;
  DROP POLICY IF EXISTS "Acceso autorizado configuracion_empresa" ON configuracion_empresa;
  DROP POLICY IF EXISTS "Acceso select configuracion_empresa" ON configuracion_empresa;
  DROP POLICY IF EXISTS "Acceso update configuracion_empresa" ON configuracion_empresa;
  DROP POLICY IF EXISTS "Permitir select configuracion_empresa" ON configuracion_empresa;
  DROP POLICY IF EXISTS "Permitir insert configuracion_empresa" ON configuracion_empresa;
  DROP POLICY IF EXISTS "Permitir update configuracion_empresa" ON configuracion_empresa;
  DROP POLICY IF EXISTS "Permitir delete configuracion_empresa" ON configuracion_empresa;

  CREATE POLICY "Acceso select configuracion_empresa" ON configuracion_empresa
    FOR SELECT TO authenticated USING (es_usuario_autorizado());

  CREATE POLICY "Acceso update configuracion_empresa" ON configuracion_empresa
    FOR UPDATE TO authenticated USING (es_usuario_autorizado()) WITH CHECK (es_usuario_autorizado());

  -- 2. Políticas para tablas operativas
  FOREACH t IN ARRAY tablas_operativas LOOP
    EXECUTE 'DROP POLICY IF EXISTS "Acceso total ' || t || '" ON ' || quote_ident(t);
    EXECUTE 'DROP POLICY IF EXISTS "Acceso titular ' || t || '" ON ' || quote_ident(t);
    EXECUTE 'DROP POLICY IF EXISTS "Acceso autorizado ' || t || '" ON ' || quote_ident(t);
    EXECUTE 'DROP POLICY IF EXISTS "Permitir select ' || t || '" ON ' || quote_ident(t);
    EXECUTE 'DROP POLICY IF EXISTS "Permitir insert ' || t || '" ON ' || quote_ident(t);
    EXECUTE 'DROP POLICY IF EXISTS "Permitir update ' || t || '" ON ' || quote_ident(t);
    EXECUTE 'DROP POLICY IF EXISTS "Permitir delete ' || t || '" ON ' || quote_ident(t);

    -- Exigir autenticación del usuario autorizado (admin o titular)
    EXECUTE 'CREATE POLICY "Acceso autorizado ' || t || '" ON ' || quote_ident(t) || 
            ' FOR ALL TO authenticated USING (es_usuario_autorizado()) WITH CHECK (es_usuario_autorizado())';
  END LOOP;
END $$;

-- ========================================================
-- 16. STORAGE BUCKETS: SEPARACIÓN DE FOTOS PRIVADAS Y WEB PÚBLICA
-- ========================================================
-- BUCKET PRIVADO: fotos_reformas (Obras, presupuestos, informes)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos_reformas', 'fotos_reformas', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- BUCKET PÚBLICO: web_publica_fotos (Galería comercial pública)
INSERT INTO storage.buckets (id, name, public)
VALUES ('web_publica_fotos', 'web_publica_fotos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Titular Read Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Titular Insert Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Titular Update Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Titular Delete Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Autorizado Read Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Autorizado Insert Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Autorizado Update Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Autorizado Delete Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Web Publica Read Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Web Publica Insert Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Web Publica Update Fotos" ON storage.objects;
DROP POLICY IF EXISTS "Web Publica Delete Fotos" ON storage.objects;

-- Acceso al bucket privado fotos_reformas: exclusivamente usuario autorizado
CREATE POLICY "Autorizado Read Fotos" ON storage.objects 
  FOR SELECT TO authenticated 
  USING (bucket_id = 'fotos_reformas' AND es_usuario_autorizado());

CREATE POLICY "Autorizado Insert Fotos" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'fotos_reformas' AND es_usuario_autorizado());

CREATE POLICY "Autorizado Update Fotos" ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (bucket_id = 'fotos_reformas' AND es_usuario_autorizado());

CREATE POLICY "Autorizado Delete Fotos" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'fotos_reformas' AND es_usuario_autorizado());

-- Acceso al bucket público web_publica_fotos: lectura para cualquier visitante
CREATE POLICY "Web Publica Read Fotos" ON storage.objects 
  FOR SELECT TO public 
  USING (bucket_id = 'web_publica_fotos');

CREATE POLICY "Web Publica Insert Fotos" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'web_publica_fotos' AND es_administrador_autorizado());

CREATE POLICY "Web Publica Update Fotos" ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (bucket_id = 'web_publica_fotos' AND es_administrador_autorizado());

CREATE POLICY "Web Publica Delete Fotos" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'web_publica_fotos' AND es_administrador_autorizado());


