import { NATURALEZA_LABEL, PGC } from '../data/pgc';
import type { TemaId } from '../data/temas';
import { PREGUNTAS_TEORIA, SECUENCIAS_ORDENA } from '../data/theory';
import { Bank } from './bank';
import { Engine } from './engine';
import { Fmt } from './fmt';
import { Gen } from './gen';
import { Masas } from './masas';
import type { Asiento, Ejercicio, Linea } from './types';

export interface ErrorVaultItem {
  id: string;
  ts: number;
  tema: TemaId;
  juego: string;
  enunciado: string;
  tuRespuesta: string;
  correcta: string;
  ejercicioId: string;
  vecesFallo: number;
  aciertosSeguidos: number;
  dominado: boolean;
}

export interface NuevoErrorInput {
  tema: TemaId;
  juego: string;
  enunciado: string;
  tuRespuesta: string;
  correcta: string;
  ejercicioId: string;
}

export type EstadoVaultFiltro = 'pendientes' | 'dominados' | 'todos';
export type OrdenVaultFiltro = 'recientes' | 'fallados';

export interface VaultFiltroOpts {
  tema?: TemaId | 'todas';
  juego?: string | 'todos';
  estado?: EstadoVaultFiltro;
  orden?: OrdenVaultFiltro;
}

export interface DetalleSolucionVault {
  asiento?: Asiento;
  explicaciones: string[];
  nota?: string;
}

export type RetoVaultItem =
  | {
      tipo: 'asiento';
      item: ErrorVaultItem;
      asiento: Asiento;
      nota?: string;
    }
  | {
      tipo: 'opcion';
      item: ErrorVaultItem;
      opciones: string[];
      correctaTexto: string;
      explicaciones: string[];
    }
  | {
      tipo: 'numero';
      item: ErrorVaultItem;
      esperado: number;
      explicaciones: string[];
    }
  | {
      tipo: 'estudio-reto';
      item: ErrorVaultItem;
      explicaciones: string[];
    };

const MASAS_OPCIONES = [
  'Activo no corriente',
  'Activo corriente',
  'Patrimonio neto',
  'Pasivo no corriente',
  'Pasivo corriente',
  'Gasto',
  'Ingreso',
];

function crearId(): string {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function parsearLineasDesdeTexto(texto: string): Linea[] {
  if (!texto || typeof texto !== 'string') {
    return [];
  }
  const segmentos = texto.split(/\s*[|·]\s*/).filter(Boolean);
  const lineas: Linea[] = [];

  for (const seg of segmentos) {
    // Formato A (GameAsiento): "600 D 1.000,00 €"
    const mA = seg.trim().match(/^(\d{2,5})\s+([DH])\s+(.+)$/i);
    if (mA) {
      const c = mA[1];
      const lado = mA[2].toUpperCase();
      const imp = Fmt.parse(mA[3]);
      if (Number.isFinite(imp) && imp > 0) {
        lineas.push({
          c,
          d: lado === 'D' ? imp : 0,
          h: lado === 'H' ? imp : 0,
        });
        continue;
      }
    }

    // Formato B (Supuestos correccion.ts): "600 (D 1.000,00 €)"
    const mB = seg.trim().match(/^(\d{2,5})\s*\(\s*([DH])\s+([^)]+)\)$/i);
    if (mB) {
      const c = mB[1];
      const lado = mB[2].toUpperCase();
      const imp = Fmt.parse(mB[3]);
      if (Number.isFinite(imp) && imp > 0) {
        lineas.push({
          c,
          d: lado === 'D' ? imp : 0,
          h: lado === 'H' ? imp : 0,
        });
      }
    }
  }

  return lineas;
}

function intentarRecuperarEjercicio(item: ErrorVaultItem): {
  ej: Ejercicio | null;
  indiceAsiento: number;
} {
  const id = item.ejercicioId.trim();
  if (!id) {
    return { ej: null, indiceAsiento: 0 };
  }

  // Supuesto · Asiento / Rellena / Asiento completo / Calcula / Debe-Haber
  let baseId = id;
  let indiceAsiento = 0;

  const mAsiento = id.match(/^(.+?)_(?:asiento|rellena)_(\d+)$/);
  const mSupOp = id.match(/^(.+?)_op_(\d+)$/);
  const mSupEstado = id.match(/^(.+?)_(?:pyg|bal)_.+$/);
  const mCalc = id.match(/^(.+?)_calc$/);
  const mLinea = id.match(/^(.+?)_(\d{2,5})$/);

  if (mAsiento) {
    baseId = mAsiento[1];
    indiceAsiento = Number(mAsiento[2]) || 0;
  } else if (mSupOp) {
    baseId = mSupOp[1];
    indiceAsiento = Math.max(0, (Number(mSupOp[2]) || 1) - 1);
  } else if (mSupEstado) {
    baseId = mSupEstado[1];
  } else if (mCalc) {
    baseId = mCalc[1];
  } else if (mLinea) {
    baseId = mLinea[1];
  }

  // 1) Banco semilla (E01..E24)
  if (/^E\d+$/i.test(baseId)) {
    return { ej: Bank.porId(baseId.toUpperCase()), indiceAsiento };
  }

  // 2) Generador determinista G-PLANTILLA-SEMILLA
  const mGen = baseId.match(/^G-([A-Z0-9]+)-(\d+)$/);
  if (mGen) {
    try {
      const ej = Gen.generar(item.tema, {
        plantilla: mGen[1],
        semilla: Number(mGen[2]),
      });
      return { ej, indiceAsiento };
    } catch {
      return { ej: null, indiceAsiento };
    }
  }

  // 3) Supuesto determinista S-TEMA-SEMILLA
  const mSup = baseId.match(/^S-([a-z]+)-(\d+)$/);
  if (mSup) {
    try {
      const temaSup = mSup[1] as TemaId;
      const ej = Gen.supuesto(temaSup, {
        semilla: Number(mSup[2]),
      });
      return { ej, indiceAsiento };
    } catch {
      return { ej: null, indiceAsiento };
    }
  }

  return { ej: null, indiceAsiento };
}

function resolverAsiento(item: ErrorVaultItem): {
  asiento: Asiento | null;
  nota?: string;
} {
  const { ej, indiceAsiento } = intentarRecuperarEjercicio(item);
  if (ej && ej.asientos[indiceAsiento]) {
    return { asiento: ej.asientos[indiceAsiento], nota: ej.nota };
  }

  const lineas = parsearLineasDesdeTexto(item.correcta);
  if (lineas.length > 0) {
    const val = Engine.validar(lineas);
    if (val.ok || lineas.length >= 2) {
      return {
        asiento: {
          fecha: 'Operación registrada',
          concepto: item.enunciado.split('·')[0]?.trim() || 'Asiento correcto',
          lineas,
        },
        nota: ej?.nota,
      };
    }
  }

  return { asiento: null, nota: ej?.nota };
}

function etiquetaMasaDesdeCuenta(n: string): string {
  const m = Masas.de(n);
  switch (m) {
    case 'ANC':
      return 'Activo no corriente';
    case 'Existencias y deudores':
    case 'Inversiones y efectivo':
      return 'Activo corriente';
    case 'PN':
      return 'Patrimonio neto';
    case 'Pasivo no corriente':
      return 'Pasivo no corriente';
    case 'Pasivo corriente':
      return 'Pasivo corriente';
    case 'Gasto':
      return 'Gasto';
    case 'Ingreso':
      return 'Ingreso';
  }
}

export const Vault = {
  registrar(lista: ErrorVaultItem[], entrada: NuevoErrorInput): ErrorVaultItem[] {
    const idx = entrada.ejercicioId
      ? lista.findIndex((item) => item.ejercicioId === entrada.ejercicioId)
      : -1;

    if (idx >= 0) {
      const prev = lista[idx];
      const actualizado: ErrorVaultItem = {
        ...prev,
        ts: Date.now(),
        tema: entrada.tema,
        juego: entrada.juego,
        enunciado: entrada.enunciado,
        tuRespuesta: entrada.tuRespuesta,
        correcta: entrada.correcta,
        vecesFallo: prev.vecesFallo + 1,
        aciertosSeguidos: 0,
        dominado: false,
      };
      return [actualizado, ...lista.filter((_, i) => i !== idx)];
    }

    const nuevo: ErrorVaultItem = {
      id: crearId(),
      ts: Date.now(),
      tema: entrada.tema,
      juego: entrada.juego,
      enunciado: entrada.enunciado,
      tuRespuesta: entrada.tuRespuesta,
      correcta: entrada.correcta,
      ejercicioId: entrada.ejercicioId || crearId(),
      vecesFallo: 1,
      aciertosSeguidos: 0,
      dominado: false,
    };

    return [nuevo, ...lista];
  },

  pendientes(lista: ErrorVaultItem[]): ErrorVaultItem[] {
    return lista.filter((item) => !item.dominado);
  },

  marcarAcierto(
    lista: ErrorVaultItem[],
    id: string,
    umbralDominio = 2
  ): ErrorVaultItem[] {
    return lista.map((item) => {
      if (item.id !== id) {
        return item;
      }
      const aciertosSeguidos = item.aciertosSeguidos + 1;
      return {
        ...item,
        aciertosSeguidos,
        dominado: aciertosSeguidos >= umbralDominio,
      };
    });
  },

  marcarDominado(lista: ErrorVaultItem[], id: string): ErrorVaultItem[] {
    return lista.map((item) =>
      item.id === id
        ? {
            ...item,
            aciertosSeguidos: Math.max(2, item.aciertosSeguidos),
            dominado: true,
          }
        : item
    );
  },

  registrarFalloRepaso(
    lista: ErrorVaultItem[],
    id: string,
    tuRespuesta?: string
  ): ErrorVaultItem[] {
    return lista.map((item) =>
      item.id === id
        ? {
            ...item,
            ts: Date.now(),
            tuRespuesta:
              tuRespuesta && tuRespuesta.trim() ? tuRespuesta : item.tuRespuesta,
            vecesFallo: item.vecesFallo + 1,
            aciertosSeguidos: 0,
            dominado: false,
          }
        : item
    );
  },

  eliminar(lista: ErrorVaultItem[], id: string): ErrorVaultItem[] {
    return lista.filter((item) => item.id !== id);
  },

  juegosDisponibles(lista: ErrorVaultItem[]): string[] {
    return Array.from(new Set(lista.map((i) => i.juego).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  },

  filtrar(lista: ErrorVaultItem[], opts?: VaultFiltroOpts): ErrorVaultItem[] {
    const tema = opts?.tema ?? 'todas';
    const juego = opts?.juego ?? 'todos';
    const estado = opts?.estado ?? 'pendientes';
    const orden = opts?.orden ?? 'recientes';

    const filtrada = lista.filter((item) => {
      if (tema !== 'todas' && tema !== 'completo' && item.tema !== tema) {
        return false;
      }
      if (juego !== 'todos' && item.juego !== juego) {
        return false;
      }
      if (estado === 'pendientes' && item.dominado) {
        return false;
      }
      if (estado === 'dominados' && !item.dominado) {
        return false;
      }
      return true;
    });

    return [...filtrada].sort((a, b) => {
      if (orden === 'fallados') {
        if (b.vecesFallo !== a.vecesFallo) {
          return b.vecesFallo - a.vecesFallo;
        }
      }
      return b.ts - a.ts;
    });
  },

  resolverDetalle(item: ErrorVaultItem): DetalleSolucionVault {
    // 1) Preguntas de teoría fijas
    const preguntaTeoria = PREGUNTAS_TEORIA.find((p) => p.id === item.ejercicioId);
    if (preguntaTeoria) {
      return {
        explicaciones: [
          `Respuesta correcta: ${preguntaTeoria.opciones[preguntaTeoria.correcta]}`,
          preguntaTeoria.explicacion,
        ],
      };
    }

    // 2) Secuencias de Ordena
    const secuencia = SECUENCIAS_ORDENA.find((s) => s.id === item.ejercicioId);
    if (secuencia) {
      return {
        explicaciones: secuencia.pasos.map((p, idx) => `${idx + 1}. ${p.texto}`),
        nota: secuencia.nota,
      };
    }

    // 3) Clasifica por código de cuenta
    const mClas = item.ejercicioId.match(/^clasifica_(\d{2,5})$/);
    if (mClas) {
      const c = PGC.get(mClas[1]);
      if (c) {
        const masa = etiquetaMasaDesdeCuenta(c.n);
        return {
          explicaciones: [
            `La cuenta ${c.n} (${c.nombre}) pertenece a ${masa}.`,
            `Naturaleza: ${NATURALEZA_LABEL[c.nat]}${
              c.inv ? ' con sentido inverso al habitual de su masa.' : '.'
            }`,
          ],
        };
      }
    }

    // 4) Asientos (Asiento completo, Supuesto · Asiento, Rellena, Debe o Haber)
    const { asiento, nota } = resolverAsiento(item);
    if (asiento) {
      const explicaciones = Engine.explicarLineas(asiento);
      return {
        asiento,
        explicaciones,
        nota,
      };
    }

    // 5) Cálculos o Supuesto PyG / Balance con ejercicio recuperado
    const { ej } = intentarRecuperarEjercicio(item);
    if (ej) {
      return {
        explicaciones: [
          `Solución esperada: ${item.correcta}`,
          ...(ej.calc.slice(0, 4).map((c) => `${c.etiqueta}: ${typeof c.valor === 'number' ? Fmt.eur(c.valor) : c.valor}`)),
        ],
        nota: ej.nota,
      };
    }

    return {
      explicaciones: [`Solución correcta: ${item.correcta}`],
    };
  },

  crearRetoRepaso(item: ErrorVaultItem): RetoVaultItem {
    const detalle = Vault.resolverDetalle(item);

    // A) Asiento interactivo con EditorAsiento
    const esJuegoAsiento =
      item.juego === 'Asiento completo' ||
      item.juego === 'Supuesto · Asiento' ||
      item.juego === 'Rellena el asiento';

    if (esJuegoAsiento && detalle.asiento && detalle.asiento.lineas.length > 0) {
      return {
        tipo: 'asiento',
        item,
        asiento: detalle.asiento,
        nota: detalle.nota,
      };
    }

    // B) ¿Debe o Haber?
    if (
      item.juego === '¿Debe o Haber?' ||
      item.correcta === 'Debe' ||
      item.correcta === 'Haber'
    ) {
      return {
        tipo: 'opcion',
        item,
        opciones: ['Debe', 'Haber'],
        correctaTexto: item.correcta,
        explicaciones: detalle.explicaciones,
      };
    }

    // C) Clasifica
    if (item.juego === 'Clasifica' || MASAS_OPCIONES.includes(item.correcta)) {
      return {
        tipo: 'opcion',
        item,
        opciones: MASAS_OPCIONES,
        correctaTexto: item.correcta,
        explicaciones: detalle.explicaciones,
      };
    }

    // D) Test de teoría con opciones conocidas
    const preguntaTeoria = PREGUNTAS_TEORIA.find((p) => p.id === item.ejercicioId);
    if (preguntaTeoria) {
      return {
        tipo: 'opcion',
        item,
        opciones: preguntaTeoria.opciones,
        correctaTexto: preguntaTeoria.opciones[preguntaTeoria.correcta] ?? item.correcta,
        explicaciones: detalle.explicaciones,
      };
    }

    // E) Supuesto · PyG / Balance o cálculo numérico simple
    const numEsperado = Fmt.parse(item.correcta);
    if (
      (item.juego === 'Supuesto · PyG' ||
        item.juego === 'Supuesto · Balance' ||
        /^-?[\d.,]+\s*€?$/.test(item.correcta.trim())) &&
      Number.isFinite(numEsperado)
    ) {
      return {
        tipo: 'numero',
        item,
        esperado: numEsperado,
        explicaciones: detalle.explicaciones,
      };
    }

    // F) Opción múltiple genérica si hay tuRespuesta distinta de correcta (por ejemplo Test automático)
    if (
      item.juego === 'Test de teoría' &&
      item.correcta &&
      item.tuRespuesta &&
      item.tuRespuesta !== 'Sin responder'
    ) {
      const opciones =
        item.correcta === 'Verdadero' || item.correcta === 'Falso'
          ? ['Verdadero', 'Falso']
          : Array.from(
              new Set([
                item.correcta,
                item.tuRespuesta,
                'Ninguna de las anteriores',
              ])
            );
      return {
        tipo: 'opcion',
        item,
        opciones,
        correctaTexto: item.correcta,
        explicaciones: detalle.explicaciones,
      };
    }

    // G) Fallback interactivo: verificación de solución
    return {
      tipo: 'estudio-reto',
      item,
      explicaciones: detalle.explicaciones,
    };
  },
};
