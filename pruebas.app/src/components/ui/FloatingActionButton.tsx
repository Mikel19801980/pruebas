"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Plus, FolderPlus, Camera, ShoppingCart, Loader2, Check, FilePlus, Users, FileCheck, ClipboardList } from "lucide-react";
import { Modal } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { VoiceInput } from "./VoiceInput";
import { api, Proyecto, GREMIOS } from "@/lib/supabase";
import { useAppConfig } from "@/config/context";

export function FloatingActionButton() {
  const pathname = usePathname();
  const { puede, terminos, empresa, oficio } = useAppConfig();
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeAction, setActiveAction] = React.useState<"menu" | "nuevo_proyecto" | "nueva_foto" | "apuntar_material">("menu");

  // Lista de proyectos para asociar foto o material
  const [proyectos, setProyectos] = React.useState<Proyecto[]>([]);
  const [loadingProyectos, setLoadingProyectos] = React.useState(false);

  // Estados de formularios rápidos
  // 1. Nuevo Proyecto
  const [projTitulo, setProjTitulo] = React.useState("");
  const [projCliente, setProjCliente] = React.useState("");
  const [projTelefono, setProjTelefono] = React.useState("");

  // 2. Nueva Foto
  const [selectedProjectId, setSelectedProjectId] = React.useState("");
  const [uploadingFoto, setUploadingFoto] = React.useState(false);
  const [fotoSubidaExito, setFotoSubidaExito] = React.useState(false);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  // 3. Apuntar Material
  const [materialTexto, setMaterialTexto] = React.useState("");
  const [materialProveedor, setMaterialProveedor] = React.useState(oficio.proveedoresSugeridos[0] || "Almacén");
  const [materialGremio, setMaterialGremio] = React.useState(oficio.gremios[0] || "General");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setMaterialProveedor(oficio.proveedoresSugeridos[0] || "Almacén");
    setMaterialGremio(oficio.gremios[0] || "General");
  }, [oficio]);

  React.useEffect(() => {
    if (isOpen) {
      loadProyectos();
    }
  }, [isOpen]);

  const loadProyectos = async () => {
    setLoadingProyectos(true);
    try {
      const data = await api.getProyectos();
      setProyectos(data);
      // No forzar la primera obra para permitir compras generales sin obra
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProyectos(false);
    }
  };

  const handleOpenModal = () => {
    setActiveAction("menu");
    setFotoSubidaExito(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveAction("menu");
    setFotoSubidaExito(false);
  };

  // Crear Proyecto
  const handleCrearProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitulo.trim() || !projCliente.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createProyecto({
        titulo: projTitulo.trim(),
        cliente_nombre: projCliente.trim(),
        cliente_telefono: projTelefono.trim() || null,
        estado: "En curso",
        fecha_inicio: new Date().toISOString().slice(0, 10),
      });
      setProjTitulo("");
      setProjCliente("");
      setProjTelefono("");
      handleClose();
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Subir Foto
  const handleFotoSeleccionada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjectId) return;
    setUploadingFoto(true);
    try {
      const publicUrl = await api.uploadFoto(file);
      // Guardar partida con la foto en el primer presupuesto del proyecto o crear uno
      const presupuestos = await api.getPresupuestos(selectedProjectId);
      let presId = presupuestos[0]?.id;
      if (!presId) {
        const proj = proyectos.find((p) => p.id === selectedProjectId);
        const nuevoPresupuesto = await api.createPresupuesto({
          titulo: proj?.titulo || "Presupuesto de Obra",
          cliente_nombre: proj?.cliente_nombre || "Cliente",
          cliente_telefono: proj?.cliente_telefono || null,
          proyecto_id: selectedProjectId,
          total: 0,
          enlace_pdf: null,
          estado: "Borrador",
        });
        presId = nuevoPresupuesto.id;
      }
      await api.addPartida({
        presupuesto_id: presId,
        concepto: `Foto estado de obra (${new Date().toLocaleDateString("es-ES")})`,
        gremio: "Albañilería",
        precio: 0,
        foto_url: publicUrl,
      });
      setFotoSubidaExito(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Error subiendo la fotografía.");
    } finally {
      setUploadingFoto(false);
    }
  };

  // Apuntar Material
  const handleApuntarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTexto.trim()) return;
    setIsSubmitting(true);
    try {
      await api.addCompra({
        proyecto_id: selectedProjectId ? selectedProjectId : null,
        material: materialTexto.trim(),
        proveedor: materialProveedor,
        gremio: materialGremio,
        comprado: false,
      });
      setMaterialTexto("");
      setSelectedProjectId("");
      handleClose();
      if (typeof window !== "undefined" && window.location.pathname.includes("/compras")) {
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Error al apuntar material");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ocultar completamente el botón flotante en el configurador, web comercial y login
  const isHidden =
    pathname === "/configuracion" ||
    pathname?.startsWith("/configuracion") ||
    pathname === "/web" ||
    pathname?.startsWith("/web") ||
    pathname === "/login";

  if (isHidden) {
    return null;
  }

  return (
    <>
      {/* Botón Flotante Gigante Central */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={handleOpenModal}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-xl ring-4 ring-white dark:ring-slate-900 transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
          style={{ backgroundColor: empresa.colorPrimario }}
          aria-label="Acción rápida"
        >
          <Plus className="h-8 w-8 stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
          <span className="sr-only">Acciones rápidas</span>
        </button>
      </div>

      {/* Modal Multi-acción */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={
          activeAction === "menu"
            ? "¿Qué quieres hacer?"
            : activeAction === "nuevo_proyecto"
            ? "1. Nuevo Proyecto"
            : activeAction === "nueva_foto"
            ? "2. Foto de Obra"
            : "3. Apuntar Material"
        }
        description={
          activeAction === "menu"
            ? "Selecciona una acción directa a pie de obra:"
            : undefined
        }
      >
        {activeAction === "menu" && (
          <div className="space-y-3 pt-2">
            {/* Acción 1: Nuevo Presupuesto */}
            <a
              href="/presupuestos?crear=1"
              onClick={() => handleClose()}
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-3.5 text-left transition-all hover:border-orange-500 hover:bg-orange-50/50 dark:border-slate-800 dark:hover:bg-slate-800/80 cursor-pointer"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/80 dark:text-orange-400 shrink-0">
                <FilePlus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Nuevo Presupuesto</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Emitir presupuesto con partidas o fotos
                </p>
              </div>
            </a>

            {/* Acción 2: Nuevo Informe con Fotos */}
            {puede("informes") && (
              <a
                href="/informes?crear=1"
                onClick={() => handleClose()}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-3.5 text-left transition-all hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 shrink-0">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Nuevo Informe con Fotos</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Reporte fotográfico para cliente o visita
                  </p>
                </div>
              </a>
            )}

            {/* Acción 3: Nuevo Cliente */}
            {puede("clientes") && (
              <a
                href="/clientes"
                onClick={() => handleClose()}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-3.5 text-left transition-all hover:border-indigo-500 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Nuevo Cliente</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Añadir ficha rápida de contacto
                  </p>
                </div>
              </a>
            )}

            {/* Acción 4: Nuevo Trabajo / Obra (Solo si el plan lo permite) */}
            {puede("obras") && (
              <button
                onClick={() => setActiveAction("nuevo_proyecto")}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-3.5 text-left transition-all hover:border-orange-500 hover:bg-orange-50/50 dark:border-slate-800 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 shrink-0">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Nuevo {terminos.trabajo}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dar de alta {terminos.trabajo.toLowerCase()} nueva
                  </p>
                </div>
              </button>
            )}

            {/* Acción 5: Compras (Solo si el plan lo permite) */}
            {puede("compras") && (
              <button
                onClick={() => setActiveAction("apuntar_material")}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-3.5 text-left transition-all hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-slate-800 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 shrink-0">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Apuntar Material (o Dictar)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Añadir a la lista de compras del proveedor
                  </p>
                </div>
              </button>
            )}

            {/* Acción 6: Nuevo Albarán (Solo si el plan lo permite) */}
            {puede("albaranes") && (
              <a
                href="/albaranes"
                onClick={() => handleClose()}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-3.5 text-left transition-all hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-slate-800 dark:hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 shrink-0">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Nuevo Albarán</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hoja de entrega de materiales o fin de trabajo
                  </p>
                </div>
              </a>
            )}
          </div>
        )}

        {/* 1. Formulario Nuevo Proyecto */}
        {activeAction === "nuevo_proyecto" && (
          <form onSubmit={handleCrearProyecto} className="space-y-4 pt-2">
            <Input
              label="Título del Proyecto *"
              placeholder="Ej. Reforma Baño Almenara"
              value={projTitulo}
              onChange={(e) => setProjTitulo(e.target.value)}
              required
            />
            <Input
              label="Nombre del Cliente *"
              placeholder="Ej. Carlos Martínez"
              value={projCliente}
              onChange={(e) => setProjCliente(e.target.value)}
              required
            />
            <Input
              label="Teléfono del Cliente (WhatsApp)"
              placeholder="Ej. 622114455"
              type="tel"
              value={projTelefono}
              onChange={(e) => setProjTelefono(e.target.value)}
            />
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="w-1/3" onClick={() => setActiveAction("menu")}>
                Atrás
              </Button>
              <Button type="submit" variant="orange" className="w-2/3" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Crear Proyecto"}
              </Button>
            </div>
          </form>
        )}

        {/* 2. Subir Foto con Cámara Trasera */}
        {activeAction === "nueva_foto" && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Selecciona la Obra Activa *
              </label>
              <select
                className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titulo} ({p.cliente_nombre})
                  </option>
                ))}
              </select>
            </div>

            {/* Input oculto con capture="environment" para abrir la cámara trasera */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              className="hidden"
              onChange={handleFotoSeleccionada}
            />

            {fotoSubidaExito ? (
              <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 text-emerald-800 rounded-2xl dark:bg-emerald-950/50 dark:text-emerald-300">
                <Check className="h-10 w-10 text-emerald-600 mb-2" />
                <p className="font-bold text-center">¡Foto subida con éxito!</p>
                <p className="text-xs text-center">Guardada en Supabase Storage (fotos_reformas)</p>
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-3">
                <p className="text-xs text-slate-500">
                  Pulsa el botón para abrir directamente la cámara del móvil y tomar una foto del estado de la obra:
                </p>
                <Button
                  type="button"
                  variant="orange"
                  size="lg"
                  className="w-full gap-2"
                  disabled={uploadingFoto || !selectedProjectId}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  {uploadingFoto ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Subiendo a Supabase Storage...
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      Abrir Cámara Trasera
                    </>
                  )}
                </Button>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setActiveAction("menu")}
              disabled={uploadingFoto}
            >
              Atrás
            </Button>
          </div>
        )}

        {/* 3. Apuntar Material (con Dictado por Voz) */}
        {activeAction === "apuntar_material" && (
          <form onSubmit={handleApuntarMaterial} className="space-y-4 pt-2">
            {puede("obras") && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {terminos.trabajo} (opcional)
                </label>
                <select
                  className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">-- Sin obra / Compra general --</option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Material necesario *
                </label>
                <span className="text-[11px] text-orange-600 font-semibold">¡Dicta o escribe!</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={oficio.id === "electricidad" ? "Ej. 2 rollos cable 2.5mm, 4 cajas de mecanismos" : "Ej. 2 sacos cemento cola y bote sifónico"}
                  value={materialTexto}
                  onChange={(e) => setMaterialTexto(e.target.value)}
                  className="flex h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  required
                />
                <VoiceInput
                  size="icon"
                  onTranscript={(transcript) => {
                    setMaterialTexto((prev) => (prev ? `${prev}, ${transcript}` : transcript));
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Proveedor *
                </label>
                <select
                  className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={materialProveedor}
                  onChange={(e) => setMaterialProveedor(e.target.value)}
                >
                  {oficio.proveedoresSugeridos.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="Otro">Otro Proveedor</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {terminos.gremios}
                </label>
                <select
                  className="mt-1.5 flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  value={materialGremio}
                  onChange={(e) => setMaterialGremio(e.target.value)}
                >
                  {oficio.gremios.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="w-1/3" onClick={() => setActiveAction("menu")}>
                Atrás
              </Button>
              <Button type="submit" variant="orange" className="w-2/3" disabled={isSubmitting}>
                {isSubmitting ? "Apuntando..." : "Guardar en Lista"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
