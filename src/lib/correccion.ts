import { PGC } from '../data/pgc';
import { Engine, type ResultadoCorreccion } from './engine';
import { Fmt } from './fmt';
import {
  Masas,
  MODELO_PYG_PYMES,
  type ResumenBalance,
  type ResumenPyG,
} from './masas';
import { hoyLocal, Store } from './store';
import type { Asiento, Ejercicio, Linea } from './types';

const TOL = 0.01;

function r2(x: number): number {
  return Math.round(x * 100) / 100;
}

export type RespuestaPyG = Record<number, number>;

export interface RespuestaBalance {
  anc: number;
  ac: number;
  activo: number;
  pn: number;
  pnc: number;
  pc: number;
  pnYPasivo: number;
}

export const CAMPOS_BALANCE: Array<{
  clave: keyof RespuestaBalance;
  etiqueta: string;
  grupo: 'activo' | 'pasivo';
  esTotal?: boolean;
}> = [
  { clave: 'anc', etiqueta: 'Activo no corriente', grupo: 'activo' },
  { clave: 'ac', etiqueta: 'Activo corriente', grupo: 'activo' },
  { clave: 'activo', etiqueta: 'Total Activo', grupo: 'activo', esTotal: true },
  { clave: 'pn', etiqueta: 'Patrimonio neto (incluye resultado)', grupo: 'pasivo' },
  { clave: 'pnc', etiqueta: 'Pasivo no corriente', grupo: 'pasivo' },
  { clave: 'pc', etiqueta: 'Pasivo corriente', grupo: 'pasivo' },
  { clave: 'pnYPasivo', etiqueta: 'Total PN y Pasivo', grupo: 'pasivo', esTotal: true },
];

export function crearRespuestaPyGVacia(): RespuestaPyG {
  const mapa: RespuestaPyG = {};
  for (let i = 1; i <= 17; i++) {
    mapa[i] = 0;
  }
  return mapa;
}

export function crearRespuestaBalanceVacia(): RespuestaBalance {
  return {
    anc: 0,
    ac: 0,
    activo: 0,
    pn: 0,
    pnc: 0,
    pc: 0,
    pnYPasivo: 0,
  };
}

export function calcularSubtotalesPyG(lineas: RespuestaPyG): {
  A: number;
  B: number;
  C: number;
  impuesto: number;
  D: number;
} {
  let A = 0;
  for (let i = 1; i <= 11; i++) {
    A = r2(A + (Number(lineas[i]) || 0));
  }
  let B = 0;
  for (let i = 12; i <= 16; i++) {
    B = r2(B + (Number(lineas[i]) || 0));
  }
  const C = r2(A + B);
  const impuesto = r2(Number(lineas[17]) || 0);
  const D = r2(C + impuesto);
  return { A, B, C, impuesto, D };
}

export function calcularSolucionReferencia(ej: Ejercicio): {
  pyg: ResumenPyG;
  balance: ResumenBalance;
} {
  const saldos = Engine.mayorizar(ej.asientos, ej.inicial);
  const pyg = Masas.pyg(saldos);
  const balance = Masas.balance(saldos);

  // Si un ejercicio del banco tiene asientos de cierre (129) sin saldos iniciales
  // y aporta un desglose numérico en calc, completamos con calc cuando corresponda.
  const tieneAsiento129 = ej.asientos.some((a) =>
    a.lineas.some((l) => l.c.trim() === '129')
  );
  if (tieneAsiento129 && (!ej.inicial || ej.inicial.length === 0) && ej.calc.length > 0) {
    const nuevoPyGLineas: Record<number, number> = { ...pyg.lineas };
    let usoCalcPyG = false;

    for (const item of ej.calc) {
      const m = item.etiqueta.match(/^(\d{1,2})\.\s/);
      if (m && typeof item.valor === 'number') {
        const num = Number(m[1]);
        if (num >= 1 && num <= 17) {
          nuevoPyGLineas[num] = item.valor;
          usoCalcPyG = true;
        }
      }
    }

    if (usoCalcPyG) {
      const subs = calcularSubtotalesPyG(nuevoPyGLineas);
      return {
        pyg: {
          lineas: nuevoPyGLineas,
          ...subs,
        },
        balance,
      };
    }
  }

  return { pyg, balance };
}

export interface PenalizacionSupuesto {
  seccion: 'asientos' | 'pyg' | 'balance';
  operacionIdx?: number;
  motivo: string;
  importe: number;
}

export interface ItemAsientoResultado {
  indice: number;
  asientoSolucion: Asiento;
  respuestaAlumno: Linea[];
  correccion: ResultadoCorreccion;
  puntosMax: number;
  puntosBrutos: number;
}

export interface ItemPyGResultado {
  numLinea: number;
  etiqueta: string;
  esperado: number;
  dado: number;
  ok: boolean;
  evaluada: boolean;
}

export interface ItemBalanceResultado {
  clave: keyof RespuestaBalance;
  etiqueta: string;
  esperado: number;
  dado: number;
  ok: boolean;
}

export interface ResultadoSupuesto {
  nota: number;
  notaSobre10: number;
  aprobado: boolean;
  asientosBruto: number;
  asientosPenalizacion: number;
  asientosNota: number;
  pygBruto: number;
  pygNota: number;
  balanceBruto: number;
  balanceNota: number;
  penalizaciones: PenalizacionSupuesto[];
  itemsAsientos: ItemAsientoResultado[];
  itemsPyG: ItemPyGResultado[];
  itemsBalance: ItemBalanceResultado[];
  solucionPyG: ResumenPyG;
  solucionBalance: ResumenBalance;
  xpGanado: number;
}

export function formatearLineasCorto(lineas: Linea[]): string {
  const validas = lineas.filter((l) => l.c.trim() !== '' || l.d > 0 || l.h > 0);
  if (validas.length === 0) {
    return 'Sin responder';
  }
  return validas
    .map((l) => {
      const c = l.c.trim() || '?';
      const partes: string[] = [];
      if (l.d > 0) partes.push(`D ${Fmt.eur(l.d)}`);
      if (l.h > 0) partes.push(`H ${Fmt.eur(l.h)}`);
      return `${c} (${partes.join(' / ') || '0 €'})`;
    })
    .join(' · ');
}

export function corregirSupuesto(params: {
  ejercicio: Ejercicio;
  respuestasAsientos: Linea[][];
  respuestaPyG: RespuestaPyG;
  respuestaBalance: RespuestaBalance;
}): ResultadoSupuesto {
  const { ejercicio, respuestasAsientos, respuestaPyG, respuestaBalance } = params;
  const { pyg: solucionPyG, balance: solucionBalance } =
    calcularSolucionReferencia(ejercicio);

  const penalizaciones: PenalizacionSupuesto[] = [];
  const itemsAsientos: ItemAsientoResultado[] = [];

  // 1) Asientos (2 puntos)
  const numAsientos = Math.max(1, ejercicio.asientos.length);
  const pesoPorAsiento = 2 / numAsientos;
  let sumaBrutoAsientos = 0;

  ejercicio.asientos.forEach((asientoSol, idx) => {
    const resp = (respuestasAsientos[idx] ?? []).filter(
      (l) => l.c.trim() !== '' || l.d > 0 || l.h > 0
    );
    const correccion = Engine.corregir(asientoSol, resp);
    const puntosBrutos = correccion.puntos * pesoPorAsiento;
    sumaBrutoAsientos += puntosBrutos;

    if (resp.length > 0 && !correccion.cuadra) {
      penalizaciones.push({
        seccion: 'asientos',
        operacionIdx: idx,
        motivo: `Operación ${idx + 1} (${asientoSol.fecha}): asiento descuadrado.`,
        importe: 0.2,
      });
    }

    const cuentasSolucion = new Set(asientoSol.lineas.map((l) => l.c.trim()));
    for (const lc of correccion.lineas) {
      if (lc.estado === 'sobra' && lc.dada) {
        const codigo = lc.dada.c.trim();
        if (!codigo) {
          penalizaciones.push({
            seccion: 'asientos',
            operacionIdx: idx,
            motivo: `Operación ${idx + 1}: línea con importe pero sin cuenta.`,
            importe: 0.2,
          });
        } else if (!cuentasSolucion.has(codigo)) {
          const nom = PGC.nombre(codigo);
          penalizaciones.push({
            seccion: 'asientos',
            operacionIdx: idx,
            motivo: `Operación ${idx + 1}: la cuenta ${codigo}${
              nom ? ` (${nom})` : ''
            } no pertenece a la solución.`,
            importe: 0.2,
          });
        }
      }
    }

    itemsAsientos.push({
      indice: idx,
      asientoSolucion: asientoSol,
      respuestaAlumno: resp,
      correccion,
      puntosMax: r2(pesoPorAsiento),
      puntosBrutos: r2(puntosBrutos),
    });
  });

  const asientosBruto = r2(Math.min(2, sumaBrutoAsientos));
  const asientosPenalizacion = r2(
    penalizaciones
      .filter((p) => p.seccion === 'asientos')
      .reduce((acc, p) => acc + p.importe, 0)
  );
  const asientosNota = r2(Math.max(0, asientosBruto - asientosPenalizacion));

  // 2) PyG (1,5 puntos repartidos entre las líneas con valor != 0 en la solución)
  const lineasModelo = MODELO_PYG_PYMES.filter(
    (f): f is { tipo: 'linea'; clave: string; numLinea: number; etiqueta: string } =>
      f.tipo === 'linea' && typeof f.numLinea === 'number'
  );

  const lineasNoCero = lineasModelo.filter(
    (f) => Math.abs(solucionPyG.lineas[f.numLinea] ?? 0) > TOL
  );

  const itemsPyG: ItemPyGResultado[] = [];
  let aciertosPyG = 0;

  for (const f of lineasModelo) {
    const esperado = r2(solucionPyG.lineas[f.numLinea] ?? 0);
    const dado = r2(Number(respuestaPyG[f.numLinea]) || 0);
    const evaluada = Math.abs(esperado) > TOL;
    const ok = Math.abs(dado - esperado) <= TOL;

    if (evaluada && ok) {
      aciertosPyG += 1;
    }

    if (evaluada || Math.abs(dado) > TOL) {
      itemsPyG.push({
        numLinea: f.numLinea,
        etiqueta: f.etiqueta,
        esperado,
        dado,
        ok,
        evaluada,
      });
    }
  }

  let pygBruto = 0;
  if (lineasNoCero.length > 0) {
    pygBruto =
      aciertosPyG === lineasNoCero.length
        ? 1.5
        : r2((aciertosPyG / lineasNoCero.length) * 1.5);
  } else {
    const fallosExtra = itemsPyG.filter((i) => !i.ok).length;
    pygBruto = fallosExtra === 0 ? 1.5 : 0;
  }
  const pygNota = r2(Math.max(0, pygBruto));

  // 3) Balance (1,5 puntos repartidos por igual entre sus 7 campos)
  const itemsBalance: ItemBalanceResultado[] = [];
  let aciertosBalance = 0;

  for (const campo of CAMPOS_BALANCE) {
    const esperado = r2(solucionBalance[campo.clave]);
    const dado = r2(Number(respuestaBalance[campo.clave]) || 0);
    const ok = Math.abs(dado - esperado) <= TOL;
    if (ok) {
      aciertosBalance += 1;
    }
    itemsBalance.push({
      clave: campo.clave,
      etiqueta: campo.etiqueta,
      esperado,
      dado,
      ok,
    });
  }

  const balanceBruto =
    aciertosBalance === CAMPOS_BALANCE.length
      ? 1.5
      : r2((aciertosBalance / CAMPOS_BALANCE.length) * 1.5);
  const balanceNota = r2(Math.max(0, balanceBruto));

  const nota = r2(Math.min(5, Math.max(0, asientosNota + pygNota + balanceNota)));
  const notaSobre10 = r2(nota * 2);
  const aprobado = nota >= 2.5;
  const xpGanado = Math.round(nota * 10) + (nota >= 4.5 ? 20 : 0);

  return {
    nota,
    notaSobre10,
    aprobado,
    asientosBruto,
    asientosPenalizacion,
    asientosNota,
    pygBruto,
    pygNota,
    balanceBruto,
    balanceNota,
    penalizaciones,
    itemsAsientos,
    itemsPyG,
    itemsBalance,
    solucionPyG,
    solucionBalance,
    xpGanado,
  };
}

export function registrarResultadoSupuesto(
  ejercicio: Ejercicio,
  resultado: ResultadoSupuesto,
  duracionSegundos: number
): void {
  Store.addXP(resultado.xpGanado);
  Store.registrar(ejercicio.tema, resultado.nota >= 4);
  Store.marcarDia();
  Store.addHistorial({
    fecha: hoyLocal(),
    tema: ejercicio.tema,
    nota: resultado.nota,
    duracion: Math.max(0, Math.round(duracionSegundos)),
  });

  // Cada ítem fallado (asientos, PyG evaluadas y Balance) va al Error Vault
  for (const item of resultado.itemsAsientos) {
    if (item.correccion.puntos < 0.99) {
      Store.addError({
        tema: ejercicio.tema,
        juego: 'Supuesto · Asiento',
        enunciado: `${ejercicio.titulo} · Op ${item.indice + 1} (${item.asientoSolucion.fecha}): ${item.asientoSolucion.concepto}`,
        tuRespuesta: formatearLineasCorto(item.respuestaAlumno),
        correcta: formatearLineasCorto(item.asientoSolucion.lineas),
        ejercicioId: `${ejercicio.id}_op_${item.indice + 1}`,
      });
    }
  }

  for (const item of resultado.itemsPyG) {
    if (!item.ok) {
      Store.addError({
        tema: ejercicio.tema,
        juego: 'Supuesto · PyG',
        enunciado: `${ejercicio.titulo} · PyG ${item.etiqueta}`,
        tuRespuesta: Fmt.eur(item.dado),
        correcta: Fmt.eur(item.esperado),
        ejercicioId: `${ejercicio.id}_pyg_${item.numLinea}`,
      });
    }
  }

  for (const item of resultado.itemsBalance) {
    if (!item.ok) {
      Store.addError({
        tema: ejercicio.tema,
        juego: 'Supuesto · Balance',
        enunciado: `${ejercicio.titulo} · Balance: ${item.etiqueta}`,
        tuRespuesta: Fmt.eur(item.dado),
        correcta: Fmt.eur(item.esperado),
        ejercicioId: `${ejercicio.id}_bal_${item.clave}`,
      });
    }
  }
}
