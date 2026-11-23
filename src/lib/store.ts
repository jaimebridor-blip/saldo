import { useSyncExternalStore } from 'react';
import { TEMAS, type TemaId } from '../data/temas';
import { Vault, type ErrorVaultItem, type NuevoErrorInput } from './vault';

const STORAGE_KEY = 'conta_jaime_v1';
const CURRENT_VERSION = 1;

export type ModoApp = 'practicar' | 'examen';
export type ModoJuego = 'estudio' | 'reto';
export type DiaContadorKey = 'juegos' | 'tarjetas' | 'vault';

export interface DominioTema {
  ok: number;
  total: number;
  recientes: boolean[];
}

export interface DiaEstado {
  fecha: string;
  juegos: number;
  tarjetas: number;
  vault: number;
}

export interface HistorialSupuestoItem {
  fecha: string;
  tema: TemaId;
  nota: number;
  duracion: number;
}

export interface StoreState {
  v: number;
  perfil: {
    nombre: string;
  };
  fechaExamen: string;
  modo: ModoApp;
  ui: {
    tema: TemaId;
    modoJuego: ModoJuego;
  };
  xp: number;
  racha: {
    fechas: string[];
  };
  dominio: Record<TemaId, DominioTema>;
  leitner: Record<string, unknown>;
  errores: ErrorVaultItem[];
  historial: HistorialSupuestoItem[];
  dia: DiaEstado;
  ia: {
    clave: string;
    modelo: string;
  };
}

export function hoyLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function crearDominioInicial(): Record<TemaId, DominioTema> {
  const map = {} as Record<TemaId, DominioTema>;
  for (const t of TEMAS) {
    map[t.id] = { ok: 0, total: 0, recientes: [] };
  }
  return map;
}

export function crearEstadoInicial(): StoreState {
  return {
    v: CURRENT_VERSION,
    perfil: { nombre: 'Jaime Brizuela' },
    fechaExamen: '',
    modo: 'practicar',
    ui: { tema: 'completo', modoJuego: 'estudio' },
    xp: 0,
    racha: { fechas: [] },
    dominio: crearDominioInicial(),
    leitner: {},
    errores: [],
    historial: [],
    dia: { fecha: hoyLocal(), juegos: 0, tarjetas: 0, vault: 0 },
    ia: { clave: '', modelo: 'gemini-2.5-flash' },
  };
}

function esTemaValido(id: unknown): id is TemaId {
  return typeof id === 'string' && TEMAS.some((t) => t.id === id);
}

function migrar(raw: unknown): StoreState {
  const base = crearEstadoInicial();
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  const obj = raw as Record<string, unknown>;

  const perfilObj =
    obj.perfil && typeof obj.perfil === 'object'
      ? (obj.perfil as Record<string, unknown>)
      : {};
  const nombre =
    typeof perfilObj.nombre === 'string' && perfilObj.nombre.trim()
      ? perfilObj.nombre
      : base.perfil.nombre;

  const uiObj =
    obj.ui && typeof obj.ui === 'object'
      ? (obj.ui as Record<string, unknown>)
      : {};

  const rachaObj =
    obj.racha && typeof obj.racha === 'object'
      ? (obj.racha as Record<string, unknown>)
      : {};

  const dominioRaw =
    obj.dominio && typeof obj.dominio === 'object'
      ? (obj.dominio as Record<string, unknown>)
      : {};
  const dominio = crearDominioInicial();
  for (const t of TEMAS) {
    const entry = dominioRaw[t.id];
    if (entry && typeof entry === 'object') {
      const e = entry as Record<string, unknown>;
      dominio[t.id] = {
        ok: typeof e.ok === 'number' && Number.isFinite(e.ok) ? e.ok : 0,
        total: typeof e.total === 'number' && Number.isFinite(e.total) ? e.total : 0,
        recientes: Array.isArray(e.recientes)
          ? e.recientes.filter((v): v is boolean => typeof v === 'boolean').slice(-20)
          : [],
      };
    }
  }

  const hoy = hoyLocal();
  const diaRaw =
    obj.dia && typeof obj.dia === 'object'
      ? (obj.dia as Record<string, unknown>)
      : {};
  const mismaFecha = diaRaw.fecha === hoy;
  const dia: DiaEstado = {
    fecha: hoy,
    juegos:
      mismaFecha && typeof diaRaw.juegos === 'number' && Number.isFinite(diaRaw.juegos)
        ? diaRaw.juegos
        : 0,
    tarjetas:
      mismaFecha && typeof diaRaw.tarjetas === 'number' && Number.isFinite(diaRaw.tarjetas)
        ? diaRaw.tarjetas
        : 0,
    vault:
      mismaFecha && typeof diaRaw.vault === 'number' && Number.isFinite(diaRaw.vault)
        ? diaRaw.vault
        : 0,
  };

  const iaRaw =
    obj.ia && typeof obj.ia === 'object'
      ? (obj.ia as Record<string, unknown>)
      : {};

  return {
    v: CURRENT_VERSION,
    perfil: { nombre },
    fechaExamen: typeof obj.fechaExamen === 'string' ? obj.fechaExamen : '',
    modo: obj.modo === 'examen' ? 'examen' : 'practicar',
    ui: {
      tema: esTemaValido(uiObj.tema) ? uiObj.tema : 'completo',
      modoJuego: uiObj.modoJuego === 'reto' ? 'reto' : 'estudio',
    },
    xp: typeof obj.xp === 'number' && Number.isFinite(obj.xp) && obj.xp >= 0 ? obj.xp : 0,
    racha: {
      fechas: Array.isArray(rachaObj.fechas)
        ? Array.from(
            new Set(rachaObj.fechas.filter((f): f is string => typeof f === 'string'))
          ).sort()
        : [],
    },
    dominio,
    leitner:
      obj.leitner && typeof obj.leitner === 'object' && !Array.isArray(obj.leitner)
        ? (obj.leitner as Record<string, unknown>)
        : {},
    errores: Array.isArray(obj.errores) ? (obj.errores as ErrorVaultItem[]) : [],
    historial: Array.isArray(obj.historial)
      ? obj.historial.filter((item): item is HistorialSupuestoItem => {
          if (!item || typeof item !== 'object') return false;
          const h = item as Record<string, unknown>;
          return (
            typeof h.fecha === 'string' &&
            esTemaValido(h.tema) &&
            typeof h.nota === 'number' &&
            Number.isFinite(h.nota) &&
            typeof h.duracion === 'number' &&
            Number.isFinite(h.duracion)
          );
        })
      : [],
    dia,
    ia: {
      clave: typeof iaRaw.clave === 'string' ? iaRaw.clave : '',
      modelo:
        typeof iaRaw.modelo === 'string' && iaRaw.modelo.trim()
          ? iaRaw.modelo.trim()
          : 'gemini-2.5-flash',
    },
  };
}

function cargarDeStorage(): StoreState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return crearEstadoInicial();
    }
    const parsed = JSON.parse(raw);
    return migrar(parsed);
  } catch {
    return crearEstadoInicial();
  }
}

function guardarEnStorage(state: StoreState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota o modo privado: mantenemos el estado en memoria sin romper la app.
  }
}

let currentState: StoreState = cargarDeStorage();
const listeners = new Set<() => void>();

function emitir(): void {
  for (const listener of listeners) {
    listener();
  }
}

export const Store = {
  get(): StoreState {
    return currentState;
  },

  set(next: StoreState): StoreState {
    currentState = migrar(next);
    guardarEnStorage(currentState);
    emitir();
    return currentState;
  },

  update(updater: Partial<StoreState> | ((prev: StoreState) => StoreState)): StoreState {
    const next =
      typeof updater === 'function'
        ? updater(currentState)
        : { ...currentState, ...updater };
    return Store.set(next);
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  nivel(xp = currentState.xp): number {
    return Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
  },

  addXP(n: number): StoreState {
    if (!Number.isFinite(n) || n === 0) {
      return currentState;
    }
    return Store.update((prev) => ({
      ...prev,
      xp: Math.max(0, prev.xp + Math.round(n)),
    }));
  },

  marcarDia(): StoreState {
    const hoy = hoyLocal();
    if (currentState.racha.fechas.includes(hoy)) {
      return currentState;
    }
    return Store.update((prev) => ({
      ...prev,
      racha: {
        fechas: [...prev.racha.fechas, hoy].sort(),
      },
    }));
  },

  registrar(temaId: TemaId, acierto: boolean): StoreState {
    return Store.update((prev) => {
      const actual = prev.dominio[temaId] ?? { ok: 0, total: 0, recientes: [] };
      const recientes = [...actual.recientes, acierto].slice(-20);
      return {
        ...prev,
        dominio: {
          ...prev.dominio,
          [temaId]: {
            ok: actual.ok + (acierto ? 1 : 0),
            total: actual.total + 1,
            recientes,
          },
        },
      };
    });
  },

  porcentajeTema(temaId: TemaId): number {
    const rec = currentState.dominio[temaId]?.recientes ?? [];
    if (rec.length === 0) {
      return 0;
    }
    const ok = rec.filter(Boolean).length;
    return Math.round((ok / rec.length) * 100);
  },

  contar(clave: DiaContadorKey): StoreState {
    const hoy = hoyLocal();
    return Store.update((prev) => {
      const baseDia =
        prev.dia.fecha === hoy
          ? prev.dia
          : { fecha: hoy, juegos: 0, tarjetas: 0, vault: 0 };
      return {
        ...prev,
        dia: {
          ...baseDia,
          [clave]: baseDia[clave] + 1,
        },
      };
    });
  },

  addError(e: NuevoErrorInput): StoreState {
    return Store.update((prev) => ({
      ...prev,
      errores: Vault.registrar(prev.errores, e),
    }));
  },

  addHistorial(item: HistorialSupuestoItem): StoreState {
    return Store.update((prev) => ({
      ...prev,
      historial: [...prev.historial, item],
    }));
  },

  ultimaNota(state = currentState): HistorialSupuestoItem | null {
    if (state.historial.length === 0) {
      return null;
    }
    return state.historial[state.historial.length - 1];
  },

  exportar(): void {
    const data = JSON.stringify(currentState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saldo-progreso-${hoyLocal()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  validarImportacion(texto: string): { ok: true; state: StoreState; resumen: string } | { ok: false; error: string } {
    try {
      const parsed = JSON.parse(texto) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { ok: false, error: 'El archivo no contiene un objeto JSON válido.' };
      }
      const obj = parsed as Record<string, unknown>;
      if (typeof obj.v !== 'number' || !Number.isFinite(obj.v) || !obj.perfil || !obj.dominio) {
        return {
          ok: false,
          error: 'El archivo no corresponde a una copia de seguridad de Saldo.',
        };
      }
      if (obj.v < 1 || obj.v > CURRENT_VERSION) {
        return {
          ok: false,
          error: `Versión de copia no compatible (v${obj.v}; esta versión admite hasta v${CURRENT_VERSION}).`,
        };
      }
      const state = migrar(parsed);
      const pendientes = Vault.pendientes(state.errores).length;
      const resumen = `${state.perfil.nombre} · ${state.xp} XP · ${state.errores.length} errores (${pendientes} pendientes)`;
      return { ok: true, state, resumen };
    } catch {
      return { ok: false, error: 'No se pudo leer el archivo JSON.' };
    }
  },

  async importar(
    archivo: File,
    confirmar?: (resumen: string) => Promise<boolean>
  ): Promise<{ ok: true } | { ok: false; error: string; cancelado?: boolean }> {
    const texto = await archivo.text();
    const validacion = Store.validarImportacion(texto);
    if (!validacion.ok) {
      return { ok: false, error: validacion.error };
    }
    if (confirmar) {
      const aceptado = await confirmar(validacion.resumen);
      if (!aceptado) {
        return { ok: false, error: 'Importación cancelada.', cancelado: true };
      }
    }
    Store.set(validacion.state);
    return { ok: true };
  },

  reset(): StoreState {
    const fresh = crearEstadoInicial();
    return Store.set(fresh);
  },
};

export function useStore(): StoreState {
  return useSyncExternalStore(Store.subscribe, Store.get, Store.get);
}
