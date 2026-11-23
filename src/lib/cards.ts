import { TARJETAS_MANUALES, type TipoTarjeta } from '../data/cards';
import { NATURALEZA_LABEL, PGC, type CuentaPGC } from '../data/pgc';
import type { TemaId } from '../data/temas';
import { hoyLocal, Store } from './store';
import type { ErrorVaultItem } from './vault';

export const INTERVALOS_LEITNER = [0, 1, 3, 7, 16, 35] as const;
export const SESION_TARJETAS_SIZE = 10;

export type MazoTipo = 'tema' | 'errores' | 'pendientes';

export interface EstadoLeitner {
  caja: number;
  proxima: string;
  aciertos: number;
  fallos: number;
}

export interface TarjetaEstudio {
  id: string;
  tipo: TipoTarjeta;
  tema: Exclude<TemaId, 'completo'>;
  etiqueta: string;
  frente: string;
  frenteDetalle?: string;
  dorso: string;
  dorsoDetalle?: string;
}

export function sumarDiasISO(fechaIso: string, dias: number): string {
  const [y, m, d] = fechaIso.split('-').map(Number);
  const base =
    y && m && d ? new Date(y, m - 1, d) : new Date();
  base.setDate(base.getDate() + dias);
  const yy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, '0');
  const dd = String(base.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function temaDeCuentaPGC(numero: string): Exclude<TemaId, 'completo'> {
  const n = numero.trim();
  if (n === '640' || n === '642') return 'nominas';
  if (n === '681') return 'inmovilizado';
  if (n.startsWith('30') || n.startsWith('39') || n === '610') return 'existencias';
  if (n === '436' || n === '490') return 'dudosos';
  if (n === '630' || n === '129') return 'cierre';
  if (n === '170' || n === '520') return 'prestamos';
  if (n === '100' || n === '110') return 'capital';
  return 'cuadro';
}

function construirTarjetasPGC(cuentas: CuentaPGC[]): TarjetaEstudio[] {
  const out: TarjetaEstudio[] = [];
  for (const c of cuentas) {
    const tema = temaDeCuentaPGC(c.n);
    const natTxt = NATURALEZA_LABEL[c.nat];
    const invTxt = c.inv ? ' · Tiene sentido inverso' : '';
    const dorsoDetalle = `Naturaleza: ${natTxt}${invTxt}`;

    out.push({
      id: `PGC_${c.n}_NUM`,
      tipo: 1,
      tema,
      etiqueta: 'PGC · Número → Nombre',
      frente: c.n,
      frenteDetalle: `Grupo ${c.grupo} · ¿Qué cuenta del PGC es?`,
      dorso: c.nombre,
      dorsoDetalle,
    });

    out.push({
      id: `PGC_${c.n}_NOM`,
      tipo: 1,
      tema,
      etiqueta: 'PGC · Nombre → Número',
      frente: c.nombre,
      frenteDetalle: `Grupo ${c.grupo} · ¿Qué número tiene en el PGC?`,
      dorso: c.n,
      dorsoDetalle,
    });
  }
  return out;
}

const TARJETAS_PGC: TarjetaEstudio[] = construirTarjetasPGC(PGC.cuentas);

const TARJETAS_FIJAS: TarjetaEstudio[] = [
  ...TARJETAS_PGC,
  ...TARJETAS_MANUALES,
];

function tarjetaDesdeError(err: ErrorVaultItem): TarjetaEstudio {
  const tema: Exclude<TemaId, 'completo'> =
    err.tema === 'completo' ? 'conceptos' : err.tema;
  return {
    id: `ERR_${err.id}`,
    tipo: 'error',
    tema,
    etiqueta: `Mi error · ${err.juego}`,
    frente: err.enunciado,
    frenteDetalle: err.tuRespuesta
      ? `Tu fallo anterior: ${err.tuRespuesta}`
      : undefined,
    dorso: err.correcta,
    dorsoDetalle: `Fallado ${err.vecesFallo} ${
      err.vecesFallo === 1 ? 'vez' : 'veces'
    }`,
  };
}

function parseEstadoLeitner(raw: unknown, hoy: string): EstadoLeitner {
  if (!raw || typeof raw !== 'object') {
    return { caja: 0, proxima: hoy, aciertos: 0, fallos: 0 };
  }
  const obj = raw as Record<string, unknown>;
  const cajaRaw = typeof obj.caja === 'number' && Number.isFinite(obj.caja) ? obj.caja : 0;
  const caja = Math.max(0, Math.min(5, Math.floor(cajaRaw)));
  const proxima =
    typeof obj.proxima === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.proxima)
      ? obj.proxima
      : hoy;
  const aciertos =
    typeof obj.aciertos === 'number' && Number.isFinite(obj.aciertos) && obj.aciertos >= 0
      ? Math.floor(obj.aciertos)
      : 0;
  const fallos =
    typeof obj.fallos === 'number' && Number.isFinite(obj.fallos) && obj.fallos >= 0
      ? Math.floor(obj.fallos)
      : 0;

  return { caja, proxima, aciertos, fallos };
}

function barajar<T>(arr: readonly T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copia[i];
    copia[i] = copia[j];
    copia[j] = tmp;
  }
  return copia;
}

export const Cards = {
  intervalos: INTERVALOS_LEITNER,

  todasFijas(): TarjetaEstudio[] {
    return TARJETAS_FIJAS;
  },

  tarjetasErrores(errores: ErrorVaultItem[] = Store.get().errores): TarjetaEstudio[] {
    const pendientes = errores.filter((e) => !e.dominado);
    const origen = pendientes.length > 0 ? pendientes : [];
    return origen.map(tarjetaDesdeError);
  },

  todasConErrores(errores: ErrorVaultItem[] = Store.get().errores): TarjetaEstudio[] {
    return [...TARJETAS_FIJAS, ...Cards.tarjetasErrores(errores)];
  },

  estadoDe(
    idTarjeta: string,
    leitnerMap: Record<string, unknown> = Store.get().leitner
  ): EstadoLeitner {
    const hoy = hoyLocal();
    return parseEstadoLeitner(leitnerMap[idTarjeta], hoy);
  },

  estaPendienteHoy(
    idTarjeta: string,
    leitnerMap: Record<string, unknown> = Store.get().leitner
  ): boolean {
    const hoy = hoyLocal();
    const est = parseEstadoLeitner(leitnerMap[idTarjeta], hoy);
    return est.proxima <= hoy;
  },

  obtenerMazo(
    mazo: MazoTipo,
    tema: TemaId,
    errores: ErrorVaultItem[] = Store.get().errores,
    leitnerMap: Record<string, unknown> = Store.get().leitner
  ): TarjetaEstudio[] {
    if (mazo === 'errores') {
      const listaErrores = Cards.tarjetasErrores(errores);
      return tema === 'completo'
        ? listaErrores
        : listaErrores.filter((t) => t.tema === tema);
    }

    if (mazo === 'pendientes') {
      const todas = Cards.todasConErrores(errores);
      const filtradas =
        tema === 'completo' ? todas : todas.filter((t) => t.tema === tema);
      return filtradas.filter((t) => Cards.estaPendienteHoy(t.id, leitnerMap));
    }

    if (tema === 'completo') {
      return TARJETAS_FIJAS;
    }

    return TARJETAS_FIJAS.filter((t) => t.tema === tema);
  },

  resumenCajas(
    tarjetas: TarjetaEstudio[],
    leitnerMap: Record<string, unknown> = Store.get().leitner
  ): {
    cajas: [number, number, number, number, number, number];
    pendientesHoy: number;
    total: number;
  } {
    const cajas: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
    let pendientesHoy = 0;
    const hoy = hoyLocal();

    for (const t of tarjetas) {
      const est = parseEstadoLeitner(leitnerMap[t.id], hoy);
      cajas[est.caja] += 1;
      if (est.proxima <= hoy) {
        pendientesHoy += 1;
      }
    }

    return {
      cajas,
      pendientesHoy,
      total: tarjetas.length,
    };
  },

  crearSesion(
    tarjetas: TarjetaEstudio[],
    opts?: {
      cantidad?: number;
      incluirAdelantadas?: boolean;
      leitnerMap?: Record<string, unknown>;
    }
  ): TarjetaEstudio[] {
    const cantidad = opts?.cantidad ?? SESION_TARJETAS_SIZE;
    const leitnerMap = opts?.leitnerMap ?? Store.get().leitner;
    const hoy = hoyLocal();

    const pendientes = tarjetas.filter((t) => {
      const est = parseEstadoLeitner(leitnerMap[t.id], hoy);
      return est.proxima <= hoy;
    });

    const ordenarPorPrioridad = (lista: TarjetaEstudio[]): TarjetaEstudio[] => {
      const barajada = barajar(lista);
      return barajada.sort((a, b) => {
        const ea = parseEstadoLeitner(leitnerMap[a.id], hoy);
        const eb = parseEstadoLeitner(leitnerMap[b.id], hoy);
        if (ea.caja !== eb.caja) {
          return ea.caja - eb.caja;
        }
        return ea.proxima.localeCompare(eb.proxima);
      });
    };

    const ordenadasPendientes = ordenarPorPrioridad(pendientes);
    if (ordenadasPendientes.length >= cantidad || !opts?.incluirAdelantadas) {
      return ordenadasPendientes.slice(0, cantidad);
    }

    const idsPendientes = new Set(ordenadasPendientes.map((t) => t.id));
    const restantes = ordenarPorPrioridad(
      tarjetas.filter((t) => !idsPendientes.has(t.id))
    );
    return [...ordenadasPendientes, ...restantes].slice(0, cantidad);
  },

  responder(
    tarjeta: TarjetaEstudio,
    acierto: boolean,
    concederXP = true
  ): EstadoLeitner {
    const hoy = hoyLocal();
    const actual = parseEstadoLeitner(Store.get().leitner[tarjeta.id], hoy);
    const nuevaCaja = acierto ? Math.min(5, actual.caja + 1) : 0;
    const intervalo = INTERVALOS_LEITNER[nuevaCaja] ?? 0;
    const siguiente: EstadoLeitner = {
      caja: nuevaCaja,
      proxima: acierto ? sumarDiasISO(hoy, intervalo) : hoy,
      aciertos: actual.aciertos + (acierto ? 1 : 0),
      fallos: actual.fallos + (acierto ? 0 : 1),
    };

    Store.update((prev) => ({
      ...prev,
      leitner: {
        ...prev.leitner,
        [tarjeta.id]: siguiente,
      },
    }));

    if (concederXP) {
      Store.addXP(1);
    }
    Store.marcarDia();
    Store.contar('tarjetas');
    Store.registrar(tarjeta.tema, acierto);

    return siguiente;
  },
};
