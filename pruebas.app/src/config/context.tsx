"use client";

import * as React from "react";
import {
  AppConfig,
  Capacidad,
  EmpresaConfig,
  NivelPlan,
  OficioConfig,
  PreferenciasConfig,
  TemaConfig,
  TipoOficio,
  WebPublicaConfig,
} from "./types";
import { CATALOGO_OFICIOS, getOficioConfig } from "./oficios";
import { CATALOGO_PLANES, tieneCapacidad } from "./planes";
import { EMPRESA_IMANOX } from "./empresa";
import { getTemaConfig, TEMA_CLASICO } from "./temas";
import { DEFAULT_WEB_PUBLICA } from "./web_publica";
import { api } from "@/lib/supabase";

interface ConfigContextValue {
  config: AppConfig;
  oficio: OficioConfig;
  plan: typeof CATALOGO_PLANES[NivelPlan];
  empresa: EmpresaConfig;
  preferencias: PreferenciasConfig;
  tema: TemaConfig;
  webPublica: WebPublicaConfig;
  // Borradores para edición segura antes de publicar
  borradorWebPublica: WebPublicaConfig;
  borradorEmpresa: EmpresaConfig;
  estadoPublicacion: "borrador" | "publicado";
  modoVistaPrevia: "admin" | "titular" | null;
  setModoVistaPrevia: (modo: "admin" | "titular" | null) => void;
  esAdmin: boolean;
  setOficio: (id: TipoOficio) => Promise<void>;
  setPlanNivel: (nivel: NivelPlan) => Promise<void>;
  setPreferencias: (prefs: Partial<PreferenciasConfig>) => Promise<void>;
  setEmpresa: (emp: Partial<EmpresaConfig>) => Promise<void>;
  setTemaId: (id: string) => Promise<void>;
  guardarBorradorWeb: (borrador: { web: WebPublicaConfig; empresa: EmpresaConfig }) => Promise<void>;
  publicarConfiguracionWeb: (publicacion: { web: WebPublicaConfig; empresa: EmpresaConfig; temaId?: string; oficioId?: TipoOficio }) => Promise<void>;
  puede: (capacidad: Capacidad) => boolean;
  // Vocabulario dinámico según oficio
  terminos: {
    trabajos: string;
    trabajo: string;
    gremios: string;
    partidas: string;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  oficio: getOficioConfig("reformas"),
  plan: CATALOGO_PLANES.organizado,
  empresa: EMPRESA_IMANOX,
  preferencias: {
    agruparPorObra: true,
    mostrarSelectorGremios: true,
    vistaOperarioActiva: false,
  },
  tema: TEMA_CLASICO,
  webPublica: DEFAULT_WEB_PUBLICA,
};

const ConfigContext = React.createContext<ConfigContextValue | null>(null);

const STORAGE_KEY = "plataforma_oficios_config_v2";

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [oficioId, setOficioId] = React.useState<TipoOficio>("reformas");
  const [planNivel, setPlanNivel] = React.useState<NivelPlan>("organizado");
  const [temaId, setTemaIdState] = React.useState<string>("tema_clasico");
  const [empresaState, setEmpresaState] = React.useState<EmpresaConfig>(DEFAULT_CONFIG.empresa);
  const [preferencias, setPreferenciasState] = React.useState<PreferenciasConfig>(
    DEFAULT_CONFIG.preferencias
  );
  const [webPublicaState, setWebPublicaState] = React.useState<WebPublicaConfig>(
    DEFAULT_CONFIG.webPublica
  );
  const [borradorWebPublica, setBorradorWebPublica] = React.useState<WebPublicaConfig>(
    DEFAULT_CONFIG.webPublica
  );
  const [borradorEmpresa, setBorradorEmpresa] = React.useState<EmpresaConfig>(
    DEFAULT_CONFIG.empresa
  );
  const [estadoPublicacion, setEstadoPublicacion] = React.useState<"borrador" | "publicado">("publicado");
  const [modoVistaPrevia, setModoVistaPrevia] = React.useState<"admin" | "titular" | null>(null);
  const [esAdminReal, setEsAdminReal] = React.useState<boolean>(false);

  const esAdmin = React.useMemo(() => {
    if (modoVistaPrevia === "titular") return false;
    return esAdminReal;
  }, [modoVistaPrevia, esAdminReal]);

  // 1. Cargar configuración inicial (primero de localStorage para inmediatez, luego sincronizar desde Supabase)
  React.useEffect(() => {
    // Determinar rol real
    api.getUsuarioActual().then(async (user) => {
      const cfg = await api.getConfig();
      const email = user && "email" in user && user.email ? (user.email as string).toLowerCase().trim() : null;
      const adminEmail = cfg?.admin_email?.toLowerCase().trim();
      if (adminEmail && email === adminEmail) {
        setEsAdminReal(true);
      } else if (!adminEmail && !cfg?.titular_email) {
        setEsAdminReal(true);
      } else {
        setEsAdminReal(false);
      }
    }).catch(() => {});
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.oficioId && CATALOGO_OFICIOS[parsed.oficioId as TipoOficio]) {
          setOficioId(parsed.oficioId);
        }
        if (parsed.planNivel && parsed.planNivel !== "equipo" && CATALOGO_PLANES[parsed.planNivel as NivelPlan]) {
          setPlanNivel(parsed.planNivel);
        }
        if (parsed.temaId) {
          setTemaIdState(parsed.temaId);
        }
        if (parsed.preferencias) {
          setPreferenciasState((prev) => ({ ...prev, ...parsed.preferencias }));
        }
        if (parsed.empresa) {
          setEmpresaState((prev) => ({ ...prev, ...parsed.empresa }));
          setBorradorEmpresa((prev) => ({ ...prev, ...parsed.empresa }));
        }
        if (parsed.webPublica) {
          setWebPublicaState((prev) => ({ ...prev, ...parsed.webPublica }));
          setBorradorWebPublica((prev) => ({ ...prev, ...parsed.webPublica }));
        }
      }
    } catch {
      // Ignorar fallo de parseo
    }

    // Sincronizar desde la base de datos Supabase para mantener la misma identidad en móvil y ordenador
    api.getConfig().then((remoteCfg) => {
      if (remoteCfg) {
        if (remoteCfg.oficio_id && CATALOGO_OFICIOS[remoteCfg.oficio_id as TipoOficio]) {
          setOficioId(remoteCfg.oficio_id as TipoOficio);
        }
        if (remoteCfg.plan_nivel && remoteCfg.plan_nivel !== "equipo" && CATALOGO_PLANES[remoteCfg.plan_nivel as NivelPlan]) {
          setPlanNivel(remoteCfg.plan_nivel as NivelPlan);
        }
        if (remoteCfg.tema_id) {
          setTemaIdState(remoteCfg.tema_id);
        }
        if (remoteCfg.preferencias && typeof remoteCfg.preferencias === "object") {
          setPreferenciasState((prev) => ({ ...prev, ...remoteCfg.preferencias }));
        }
        if (remoteCfg.empresa && typeof remoteCfg.empresa === "object" && remoteCfg.empresa.nombreComercial) {
          setEmpresaState((prev) => ({ ...prev, ...remoteCfg.empresa }));
        }
        if (remoteCfg.web_publica && typeof remoteCfg.web_publica === "object" && remoteCfg.web_publica.titulo) {
          setWebPublicaState((prev) => ({ ...prev, ...remoteCfg.web_publica }));
        }
        if (remoteCfg.borrador_web_publica && typeof remoteCfg.borrador_web_publica === "object" && remoteCfg.borrador_web_publica.titulo) {
          setBorradorWebPublica((prev) => ({ ...prev, ...remoteCfg.borrador_web_publica }));
        } else if (remoteCfg.web_publica && typeof remoteCfg.web_publica === "object" && remoteCfg.web_publica.titulo) {
          setBorradorWebPublica((prev) => ({ ...prev, ...remoteCfg.web_publica }));
        }
        if (remoteCfg.borrador_empresa && typeof remoteCfg.borrador_empresa === "object" && remoteCfg.borrador_empresa.nombreComercial) {
          setBorradorEmpresa((prev) => ({ ...prev, ...remoteCfg.borrador_empresa }));
        } else if (remoteCfg.empresa && typeof remoteCfg.empresa === "object" && remoteCfg.empresa.nombreComercial) {
          setBorradorEmpresa((prev) => ({ ...prev, ...remoteCfg.empresa }));
        }
        if (remoteCfg.estado_publicacion === "borrador" || remoteCfg.estado_publicacion === "publicado") {
          setEstadoPublicacion(remoteCfg.estado_publicacion);
        }

        // Refrescar caché local
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              oficioId: remoteCfg.oficio_id || "reformas",
              planNivel: remoteCfg.plan_nivel !== "equipo" ? remoteCfg.plan_nivel : "organizado",
              temaId: remoteCfg.tema_id || "tema_clasico",
              preferencias: remoteCfg.preferencias || DEFAULT_CONFIG.preferencias,
              empresa: remoteCfg.empresa || DEFAULT_CONFIG.empresa,
              webPublica: remoteCfg.web_publica || DEFAULT_CONFIG.webPublica,
            })
          );
        } catch {}
      }
    }).catch((err) => {
      console.warn("No se pudo cargar la configuración remota de empresa:", err);
    });
  }, []);

  const saveToStorage = async (
    newOficio: TipoOficio,
    newPlan: NivelPlan,
    newPrefs: PreferenciasConfig,
    newEmp: EmpresaConfig,
    newTema: string = temaId,
    newWeb: WebPublicaConfig = webPublicaState
  ) => {
    const safePlan: NivelPlan = newPlan;
    // Persistir centralizadamente en Supabase primero; propagar el error si falla
    await api.saveConfig({
      oficio_id: newOficio,
      plan_nivel: safePlan,
      tema_id: newTema,
      preferencias: newPrefs,
      empresa: newEmp,
      web_publica: newWeb,
    });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          oficioId: newOficio,
          planNivel: safePlan,
          temaId: newTema,
          preferencias: newPrefs,
          empresa: newEmp,
          webPublica: newWeb,
        })
      );
    } catch {
      // Ignorar fallo de storage local
    }
  };

  const setOficio = React.useCallback(
    async (id: TipoOficio) => {
      await saveToStorage(id, planNivel, preferencias, empresaState, temaId, webPublicaState);
      setOficioId(id);
    },
    [planNivel, preferencias, empresaState, temaId, webPublicaState]
  );

  const setPlan = React.useCallback(
    async (nivel: NivelPlan) => {
      await saveToStorage(oficioId, nivel, preferencias, empresaState, temaId, webPublicaState);
      setPlanNivel(nivel);
    },
    [oficioId, preferencias, empresaState, temaId, webPublicaState]
  );

  const setTemaId = React.useCallback(
    async (newTemaId: string) => {
      await saveToStorage(oficioId, planNivel, preferencias, empresaState, newTemaId, webPublicaState);
      setTemaIdState(newTemaId);
    },
    [oficioId, planNivel, preferencias, empresaState, webPublicaState]
  );

  const setPreferencias = React.useCallback(
    async (diff: Partial<PreferenciasConfig>) => {
      const next = { ...preferencias, ...diff };
      await saveToStorage(oficioId, planNivel, next, empresaState, temaId, webPublicaState);
      setPreferenciasState(next);
    },
    [oficioId, planNivel, preferencias, empresaState, temaId, webPublicaState]
  );

  const setEmpresa = React.useCallback(
    async (diff: Partial<EmpresaConfig>) => {
      const next = { ...empresaState, ...diff };
      await saveToStorage(oficioId, planNivel, preferencias, next, temaId, webPublicaState);
      setEmpresaState(next);
    },
    [oficioId, planNivel, preferencias, empresaState, temaId, webPublicaState]
  );

  // Guardado de borrador (no publicado en web pública todavía): confirmación previa antes de mutar estado
  const guardarBorradorWeb = React.useCallback(
    async (borrador: { web: WebPublicaConfig; empresa: EmpresaConfig }) => {
      await api.saveConfig({
        borrador_web_publica: borrador.web,
        borrador_empresa: borrador.empresa,
        estado_publicacion: "borrador",
      });

      setBorradorWebPublica(borrador.web);
      setBorradorEmpresa(borrador.empresa);
      setEstadoPublicacion("borrador");
    },
    []
  );

  // Publicación definitiva de la web pública (escritura única y atómica)
  const publicarConfiguracionWeb = React.useCallback(
    async (publicacion: { web: WebPublicaConfig; empresa: EmpresaConfig; temaId?: string; oficioId?: TipoOficio }) => {
      const nextTema = publicacion.temaId || temaId;
      const nextOficio = publicacion.oficioId || oficioId;

      // 1. Escritura única y atómica en Supabase
      await api.saveConfig({
        web_publica: publicacion.web,
        borrador_web_publica: publicacion.web,
        empresa: publicacion.empresa,
        borrador_empresa: publicacion.empresa,
        estado_publicacion: "publicado",
        tema_id: nextTema,
        oficio_id: nextOficio,
      });

      // 2. Solo tras confirmación de Supabase, actualizar estado de React
      setWebPublicaState(publicacion.web);
      setEmpresaState(publicacion.empresa);
      setBorradorWebPublica(publicacion.web);
      setBorradorEmpresa(publicacion.empresa);
      setEstadoPublicacion("publicado");
      if (publicacion.temaId) setTemaIdState(publicacion.temaId);
      if (publicacion.oficioId) setOficioId(publicacion.oficioId);

      // 3. Sincronizar caché local
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            oficioId: nextOficio,
            planNivel,
            temaId: nextTema,
            preferencias,
            empresa: publicacion.empresa,
            webPublica: publicacion.web,
          })
        );
      } catch {}
    },
    [oficioId, planNivel, preferencias, temaId]
  );

  const oficio = React.useMemo(() => getOficioConfig(oficioId), [oficioId]);
  const plan = React.useMemo(() => CATALOGO_PLANES[planNivel], [planNivel]);
  const empresa = React.useMemo(() => empresaState, [empresaState]);
  const tema = React.useMemo(() => getTemaConfig(temaId), [temaId]);
  const webPublica = React.useMemo(() => webPublicaState, [webPublicaState]);

  const puede = React.useCallback(
    (capacidad: Capacidad): boolean => {
      // Si el administrador ha configurado módulos activos específicos, prevalece dicha selección
      if (preferencias.modulos_activos && Array.isArray(preferencias.modulos_activos)) {
        // Clientes es un módulo compartido fundamental; si presupuestos, obras o informes están activos, clientes se respeta
        if (capacidad === "clientes") {
          return (
            preferencias.modulos_activos.includes("clientes") ||
            preferencias.modulos_activos.includes("presupuestos") ||
            preferencias.modulos_activos.includes("obras") ||
            preferencias.modulos_activos.includes("informes")
          );
        }
        if (capacidad === "obras" && !preferencias.agruparPorObra) {
          return false;
        }
        return preferencias.modulos_activos.includes(capacidad);
      }

      // Por defecto, se rige por el paquete del plan contratado
      if (capacidad === "obras" && !preferencias.agruparPorObra) {
        return false;
      }
      return tieneCapacidad(plan, capacidad);
    },
    [plan, preferencias.agruparPorObra, preferencias.modulos_activos]
  );

  const terminos = React.useMemo(
    () => ({
      trabajos: oficio.vocabulario.trabajosNombre,
      trabajo: oficio.vocabulario.trabajoSingular,
      gremios: oficio.vocabulario.gremiosNombre,
      partidas: oficio.vocabulario.partidasNombre,
    }),
    [oficio]
  );

  const config = React.useMemo(
    () => ({
      oficio,
      plan,
      empresa,
      preferencias,
      tema,
      webPublica,
    }),
    [oficio, plan, empresa, preferencias, tema, webPublica]
  );

  return (
    <ConfigContext.Provider
      value={{
        config,
        oficio,
        plan,
        empresa,
        preferencias,
        tema,
        webPublica,
        borradorWebPublica,
        borradorEmpresa,
        estadoPublicacion,
        modoVistaPrevia,
        setModoVistaPrevia,
        esAdmin,
        setOficio,
        setPlanNivel: setPlan,
        setPreferencias,
        setEmpresa,
        setTemaId,
        guardarBorradorWeb,
        publicarConfiguracionWeb,
        puede,
        terminos,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = React.useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useAppConfig debe usarse dentro de un AppConfigProvider");
  }
  return ctx;
}
