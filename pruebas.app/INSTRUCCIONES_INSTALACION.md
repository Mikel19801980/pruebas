# Guía de Instalación, Aprovisionamiento y Actualización
## Plataforma de Oficios — Especificación v3.0 (Revisión Corregida)

Esta guía describe el procedimiento oficial para aprovisionar nuevas instalaciones o actualizar instalaciones existentes conservando íntegramente datos de clientes, presupuestos, obras, fotos y configuraciones.

---

## 1. Requisitos Previos

- **Node.js**: Versión 18 o superior (recomendado 20+ o 24).
- **Gestor de paquetes**: `npm`, `pnpm` o `yarn`.
- **Proyecto Supabase**: Base de datos PostgreSQL con Supabase Auth y Storage.

---

## 2. Configuración de Entorno

Crea o edita `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key-aqui"
```

> **Reglas de Seguridad**:
> - No incluyas claves de servicio (`service_role`).
> - `.env.local` nunca debe subirse al control de versiones ni a paquetes ZIP distribuibles.
> - Si faltan estas variables en producción, la aplicación muestra una pantalla segura de instalación no configurada y bloquea el modo demostración automático.
> - Para activar el modo demo explícito en local/evaluación, define opcionalmente `NEXT_PUBLIC_DEMO_MODE=true`.

---

## 3. Aplicación de la Migración SQL (Segura e Idempotente)

El archivo `supabase_schema.sql` contiene el esquema unificado v3.0 con todas las correcciones de concurrencia y seguridad:

1. **Preservación total de datos**: No elimina registros, mantiene fechas originales, histórico de albaranes y presupuestos.
2. **Niveles contractuales estrictos**: Solo nivel 1 (`basico`) y nivel 2 (`organizado`). No existe nivel "equipo".
3. **Numeración atómica concurrente de albaranes**: Tabla `secuencias_albaranes (year INT PRIMARY KEY, ultimo_numero INT)` y función atómica `obtener_siguiente_numero_albaran(p_year)` con bloqueo por fila que evita colisiones en entornos multiusuario.
4. **Protección de módulos desactivados**: Triggers en base de datos (`validar_modulo_activo`) que impiden peticiones directas de inserción/edición si el módulo está inactivo en `preferencias.modulos_activos`, preservando las filas existentes.
5. **Control de acceso estricto**: Trigger `validar_modificacion_configuracion` que impide al titular cambiar `plan_nivel`, `modulos_activos`, `oficio_id`, `tema_id`, `web_publica` o emails administrativos.
6. **Mecanismo seguro de lectura web**:
   - `obtener_web_publica()`: Expone únicamente datos públicos sanitizados (oficio, tema, empresa pública y web comercial). Excluye borradores, emails y preferencias operativas privadas.
   - `obtener_previsualizacion_borrador()`: Accesible exclusivamente por el administrador autenticado.
7. **Storage con fotos privadas protegidas**:
   - Bucket `fotos_reformas`: Privado (`public = false`) con RLS que restringe acceso a usuarios autenticados autorizados, sirviéndose mediante URLs firmadas temporales.
   - Bucket `web_publica_fotos`: Público (`public = true`) exclusivo para la galería comercial de la web de captación.

### Instrucciones en Supabase:
1. Ve al panel de control de Supabase en [app.supabase.com](https://app.supabase.com).
2. Selecciona tu proyecto y entra en **SQL Editor**.
3. Pega el contenido completo de `supabase_schema.sql` y pulsa **Run**.
4. Verás la confirmación `Success. No rows returned`.

---

## 4. Procedimiento de Aprovisionamiento Inicial Seguro

El aprovisionamiento inicial vincula la instalación al administrador técnico y al titular sin exigir un administrador que no existe todavía y sin permitir que usuarios anónimos se apropien de la instalación:

### Ejecución en el SQL Editor de Supabase (Método Oficial):
Ejecuta la función de aprovisionamiento con privilegios de superusuario/base de datos:

```sql
SELECT provisionar_instalacion(
  p_admin_email := 'admin@tuagencia.es',          -- Email del administrador técnico / implantador
  p_titular_email := 'titular@empresa-reformas.es', -- Email del cliente dueño del negocio
  p_plan_nivel := 'organizado'                    -- 'basico' o 'organizado'
);
```

Este procedimiento:
- Crea o actualiza el registro singleton `empresa_principal`.
- Asigna las credenciales autorizadas.
- Inicializa los módulos correspondientes al plan contratado.
- Protege la instalación contra accesos de cuentas no vinculadas.

---

## 5. Procedimiento de Personalización Estándar (Sin Modificar Código)

1. Inicia sesión con la cuenta de administrador en `/login`.
2. Accede a **/configuracion**.
3. Personaliza:
   - **Nivel contratado**: Básico (sin obras) u Organizado (con obras y compras).
   - **Módulos habilitados**: Interruptores individuales con control de dependencias.
   - **Oficio**: Reformas, Electricidad, etc. (adapta vocabulario dinámico).
   - **Tema**: Temas visuales desacoplados del código fuente.
   - **Empresa**: Nombre comercial, CIF/NIF, teléfono, email, dirección, color de marca.
   - **Web Pública**: Hero, servicios destacados, zona de atención y fotos de galería.
4. Pulsa **Guardar Borrador** para almacenar los cambios sin alterar la web pública.
5. Revisa la previsualización en **/web?preview=1** (con banner indicador).
6. Pulsa **Publicar** para volcar exactamente los datos editados a la web comercial en vivo.
7. Comprueba la web pública en **/web** desde un navegador de incógnito sin iniciar sesión.

---

## 6. Procedimiento de Actualización y Punto de Recuperación

En caso de requerir volver a la versión anterior:

- **Punto de recuperación Git**:
  - Tag: `recovery-fase-b-point` (Commit `f6ac957`).
  - Rama de respaldo: `recovery/v3.0-fase-b`.
- **Despliegue de actualizaciones**:
  1. Mantén intactos `.env.local` y los buckets de Supabase.
  2. Ejecuta `supabase_schema.sql` (es idempotente y no borra datos).
  3. Ejecuta `npm install && npm run build`.

---

## 7. Verificación de Suites de Pruebas

Para verificar de forma automatizada las correcciones implementadas:

```bash
# Comprobación de integración de Fase B y regresiones corregidas
node scripts/verify_fase_b_corregida.mjs

# Compilación de producción limpia
npm run build
```
