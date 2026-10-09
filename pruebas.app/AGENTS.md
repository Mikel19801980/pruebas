<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Directrices del Proyecto: Plataforma de Oficios (Especificación v3.0)

Las siguientes reglas son de obligado cumplimiento para todos los agentes que trabajen en este repositorio:

1. **Mejora de plantilla maestra**: Cambios de base permitidos dentro del encargo, por fases y con pruebas. No añadir funciones comerciales no solicitadas.
2. **Implantación estándar**: Utilizar el configurador y la provisión. No cambiar rutas, tablas, servicios, dependencias o estructura para poner logo, colores o datos.
3. **Personalización**: Delimitar el desarrollo pagado, registrar archivos afectados y aislarlo cuando sea razonable. Si requiere modificar el núcleo fuera de lo acordado, explicar y pedir autorización antes.
4. **No hacer refactorizaciones ajenas al trabajo**: Entregar inventario de cambios y evidencia de los recorridos afectados. No declarar una función terminada solo porque compila.
5. **Inclusión en entregables**: Incluir `AGENTS.md` en cada paquete. Las reglas orientan al agente; la comparación de cambios con Git permite verificar su cumplimiento.
