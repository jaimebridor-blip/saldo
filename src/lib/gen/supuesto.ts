import { PGC } from '../../data/pgc';
import type { TemaId } from '../../data/temas';
import { Engine } from '../engine';
import { Fmt } from '../fmt';
import { conPuntoFinal, type Plantilla, type PlantillaContext, type Rng } from '../gen';
import { Masas } from '../masas';
import type {
  Asiento,
  CalculoEjercicio,
  Ejercicio,
  SaldoInicial,
} from '../types';
import { PLANTILLAS_1 } from './plantillas1';
import { PLANTILLAS_2 } from './plantillas2';
import { PLANTILLAS_3 } from './plantillas3';

export interface SupuestoOpts {
  n?: number;
  semilla?: number;
}

const EMPRESAS_SUPUESTO: readonly string[] = [
  'ACEREPESA, S.A.',
  'METALÚRGICA DEL DUERO, S.L.',
  'TEXTILES PISUERGA, S.A.',
  'MUEBLES CAMPOS, S.A.',
  'CERÁMICAS CASTILLA, S.L.',
  'ELECTRODOMÉSTICOS TORMES, S.A.',
  'ALIMENTACIÓN CARRIÓN, S.L.',
  'MADERAS ARCO, S.A.',
  'CONSTRUCCIONES ARLANZÓN, S.L.',
  'DISTRIBUCIONES VALLE, S.A.',
  'SUMINISTROS DEL EBRO, S.L.',
  'TALLERES SANABRIA, S.A.',
];

type TipoOperacionCompleta =
  | 'V1'
  | 'V3'
  | 'N1'
  | 'F1'
  | 'J1'
  | 'D1'
  | 'AMORT_213'
  | 'EF_300';

const OPERACIONES_COMPLETO: readonly TipoOperacionCompleta[] = [
  'V1',
  'V3',
  'N1',
  'F1',
  'J1',
  'D1',
  'AMORT_213',
  'EF_300',
];

function r2(x: number): number {
  return Math.round(x * 100) / 100;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let z = Math.imul(t ^ (t >>> 15), 1 | t);
    z ^= z + Math.imul(z ^ (z >>> 7), 61 | z);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

function crearRngLocal(semillaInput?: number): Rng {
  const semilla =
    typeof semillaInput === 'number' && Number.isFinite(semillaInput)
      ? (semillaInput >>> 0) || 1
      : (Math.floor(Math.random() * 0x7fffffff) + 1) >>> 0;
  const next = mulberry32(semilla);

  const entero = (a: number, b: number, paso = 1): number => {
    const p = paso > 0 ? paso : 1;
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const steps = Math.floor((max - min) / p);
    return min + Math.floor(next() * (steps + 1)) * p;
  };

  const pick = <T,>(arr: readonly T[]): T => {
    if (arr.length === 0) {
      throw new Error('No se puede elegir un elemento de una lista vacía.');
    }
    return arr[Math.floor(next() * arr.length)];
  };

  const barajar = <T,>(arr: readonly T[]): T[] => {
    const copia = [...arr];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const tmp = copia[i];
      copia[i] = copia[j];
      copia[j] = tmp;
    }
    return copia;
  };

  return { semilla, next, entero, pick, barajar };
}

function construirCalculoEstados(saldos: Record<string, number>): {
  pyg: ReturnType<typeof Masas.pyg>;
  bal: ReturnType<typeof Masas.balance>;
  calc: CalculoEjercicio[];
} {
  const pyg = Masas.pyg(saldos);
  const bal = Masas.balance(saldos);

  const calc: CalculoEjercicio[] = [
    { etiqueta: 'PyG 1 · Importe neto cifra negocios', valor: pyg.lineas[1] ?? 0 },
    { etiqueta: 'PyG 4 · Aprovisionamientos', valor: pyg.lineas[4] ?? 0 },
    { etiqueta: 'PyG 6 · Gastos de personal', valor: pyg.lineas[6] ?? 0 },
    { etiqueta: 'PyG 7 · Otros gastos de explotación', valor: pyg.lineas[7] ?? 0 },
    { etiqueta: 'PyG 8 · Amortización del inmovilizado', valor: pyg.lineas[8] ?? 0 },
    { etiqueta: 'PyG A · Resultado de explotación', valor: pyg.A },
    { etiqueta: 'PyG B · Resultado financiero', valor: pyg.B },
    { etiqueta: 'PyG C · Resultado antes de impuestos', valor: pyg.C },
    { etiqueta: 'PyG 17 · Impuesto sobre beneficios', valor: pyg.impuesto },
    { etiqueta: 'PyG D · Resultado del ejercicio', valor: pyg.D },
    { etiqueta: 'Balance · Activo no corriente', valor: bal.anc },
    { etiqueta: 'Balance · Activo corriente', valor: bal.ac },
    { etiqueta: 'Balance · Activo total', valor: bal.activo },
    { etiqueta: 'Balance · Patrimonio neto', valor: bal.pn },
    { etiqueta: 'Balance · Pasivo no corriente', valor: bal.pnc },
    { etiqueta: 'Balance · Pasivo corriente', valor: bal.pc },
  ];

  return { pyg, bal, calc };
}

function generarOperacionCompleta(
  tipo: TipoOperacionCompleta,
  rng: Rng,
  ctx: {
    anio: string;
    c213: number;
    vidaUtil: number;
    cuotaMaq: number;
  }
): { texto: string; asientos: Asiento[] } {
  const anio = ctx.anio;

  switch (tipo) {
    case 'V1': {
      const precioLista = rng.entero(4000, 14000, 1000);
      const dPct = rng.pick([5, 10, 15]);
      const pPct = rng.pick([1, 2, 3]);
      const trasComercial = r2(precioLista * (1 - dPct / 100));
      const descuentoPP = r2(trasComercial * (pPct / 100));
      const base = r2(trasComercial - descuentoPP);
      const iva = r2(base * 0.21);
      const total = r2(base + iva);

      return {
        texto:
          `10/02/${anio}: compra mercaderías a crédito con un precio de catálogo de ${Fmt.eur(precioLista)}, ` +
          `aplicándose en factura un descuento comercial del ${dPct} % y un pronto pago del ${pPct} % sobre el importe ya rebajado (más 21 % de IVA). ` +
          `El 20/02/${anio} paga la factura al proveedor por banco.`,
        asientos: [
          {
            fecha: `10/02/${anio}`,
            concepto: 'Compra de mercaderías con descuentos en factura',
            lineas: [
              { c: '600', d: base, h: 0, por: 'Importe neto de compra en factura' },
              { c: '472', d: iva, h: 0, por: 'IVA soportado al 21 %' },
              { c: '400', d: 0, h: total, por: 'Deuda con el proveedor' },
            ],
          },
          {
            fecha: `20/02/${anio}`,
            concepto: 'Pago al proveedor por banco',
            lineas: [
              { c: '400', d: total, h: 0, por: 'Cancelación de la deuda comercial' },
              { c: '572', d: 0, h: total, por: 'Pago por transferencia bancaria' },
            ],
          },
        ],
      };
    }

    case 'V3': {
      const precioV = rng.entero(10000, 22000, 1000);
      const dPct = rng.pick([5, 10, 15]);
      const pPct = rng.pick([2, 3, 5]);
      const bv = r2(precioV * (1 - dPct / 100));
      const ivaV = r2(bv * 0.21);
      const totalV = r2(bv + ivaV);

      const dev = rng.pick([1000, 1500, 2000]);
      const ivaDev = r2(dev * 0.21);
      const totalDev = r2(dev + ivaDev);

      const baseNeta = r2(bv - dev);
      const saldoVivo = r2(totalV - totalDev);
      const x = r2(baseNeta * (pPct / 100));
      const ivaPP = r2(x * 0.21);
      const totalPP = r2(x + ivaPP);
      const cobro = r2(saldoVivo - totalPP);

      return {
        texto:
          `05/03/${anio}: vende mercaderías a crédito por ${Fmt.eur(precioV)} con descuento comercial en factura del ${dPct} % más 21 % de IVA. ` +
          `El 12/03/${anio} el cliente devuelve género por base de ${Fmt.eur(dev)}, y el 22/03/${anio} abona el resto anticipadamente por banco ` +
          `con un descuento por pronto pago fuera de factura del ${pPct} % sobre la base neta conservada.`,
        asientos: [
          {
            fecha: `05/03/${anio}`,
            concepto: 'Venta de mercaderías a crédito',
            lineas: [
              { c: '430', d: totalV, h: 0, por: 'Derecho de cobro sobre el cliente' },
              { c: '700', d: 0, h: bv, por: 'Venta neta tras descuento comercial' },
              { c: '477', d: 0, h: ivaV, por: 'IVA repercutido al 21 %' },
            ],
          },
          {
            fecha: `12/03/${anio}`,
            concepto: 'Devolución parcial de ventas',
            lineas: [
              { c: '708', d: dev, h: 0, por: 'Devolución de ventas' },
              { c: '477', d: ivaDev, h: 0, por: 'Rectificación de IVA repercutido' },
              { c: '430', d: 0, h: totalDev, por: 'Reducción del saldo del cliente' },
            ],
          },
          {
            fecha: `22/03/${anio}`,
            concepto: 'Cobro con descuento por pronto pago fuera de factura',
            lineas: [
              { c: '572', d: cobro, h: 0, por: 'Cobro líquido en cuenta bancaria' },
              { c: '706', d: x, h: 0, por: 'Descuento por pronto pago sobre ventas' },
              { c: '477', d: ivaPP, h: 0, por: 'Rectificación del IVA repercutido' },
              { c: '430', d: 0, h: saldoVivo, por: 'Cancelación del derecho de cobro' },
            ],
          },
        ],
      };
    }

    case 'F1': {
      const c = rng.pick([5000, 10000, 15000]);
      const nAnios = rng.pick([4, 5, 8]);
      const principal = r2(c * nAnios);

      return {
        texto:
          `01/04/${anio}: obtiene un préstamo bancario de ${Fmt.eur(principal)} ingresado en cuenta corriente, ` +
          `amortizable en ${nAnios} cuotas anuales constantes de capital cada año (reclasifica al cierre la cuota con vencimiento a corto plazo).`,
        asientos: [
          {
            fecha: `01/04/${anio}`,
            concepto: 'Concesión del préstamo bancario',
            lineas: [
              { c: '572', d: principal, h: 0, por: 'Ingreso del principal en bancos' },
              { c: '170', d: 0, h: principal, por: 'Deuda inicial a largo plazo' },
            ],
          },
          {
            fecha: `31/12/${anio}`,
            concepto: 'Reclasificación de la primera cuota del préstamo a corto plazo',
            lineas: [
              { c: '170', d: c, h: 0, por: 'Baja de largo plazo de la cuota próxima' },
              { c: '520', d: 0, h: c, por: 'Traspaso a deudas a corto plazo' },
            ],
          },
        ],
      };
    }

    case 'D1': {
      const base = rng.pick([5000, 8000, 10000]);
      const total = r2(base * 1.21);
      const pctDet = rng.pick([25, 40, 50, 60]);
      const deterioro = r2((total * pctDet) / 100);
      const incobrable = r2(total - deterioro);

      return {
        texto:
          `14/05/${anio}: de los derechos iniciales sobre clientes, califica como de dudoso cobro un saldo de ${Fmt.eur(total)} (IVA incluido) ` +
          `y dota un deterioro del ${pctDet} %. El 18/10/${anio} se declara la insolvencia firme e incobrable de dicho cliente.`,
        asientos: [
          {
            fecha: `14/05/${anio}`,
            concepto: 'Reclasificación a cliente de dudoso cobro',
            lineas: [
              { c: '436', d: total, h: 0, por: 'Traspaso a clientes de dudoso cobro' },
              { c: '430', d: 0, h: total, por: 'Baja de clientes ordinarios' },
            ],
          },
          {
            fecha: `14/05/${anio}`,
            concepto: 'Dotación del deterioro de crédito comercial',
            lineas: [
              { c: '694', d: deterioro, h: 0, por: 'Pérdida por deterioro de créditos' },
              { c: '490', d: 0, h: deterioro, por: 'Deterioro estimado del crédito' },
            ],
          },
          {
            fecha: `18/10/${anio}`,
            concepto: 'Insolvencia definitiva del cliente dudoso',
            lineas: [
              { c: '490', d: deterioro, h: 0, por: 'Aplicación del deterioro dotado' },
              { c: '650', d: incobrable, h: 0, por: 'Pérdida de crédito incobrable' },
              { c: '436', d: 0, h: total, por: 'Baja definitiva del crédito dudoso' },
            ],
          },
        ],
      };
    }

    case 'J1': {
      const m = rng.entero(7, 11, 1);
      const a = rng.pick([2400, 3600, 4800, 6000]);
      const servicio = rng.pick([
        { c: '621', nombre: 'alquiler anual de oficina', conIva: true },
        { c: '627', nombre: 'campaña anual de publicidad', conIva: true },
        { c: '625', nombre: 'póliza anual de seguro (exenta de IVA)', conIva: false },
      ] as const);

      const anticipado = r2((a * (m - 1)) / 12);
      const mm = String(m).padStart(2, '0');
      const iva = servicio.conIva ? r2(a * 0.21) : 0;
      const totalPago = r2(a + iva);

      const asientoPago: Asiento = servicio.conIva
        ? {
            fecha: `01/${mm}/${anio}`,
            concepto: `Pago anual de ${servicio.nombre}`,
            lineas: [
              { c: servicio.c, d: a, h: 0, por: 'Gasto anual contratado' },
              { c: '472', d: iva, h: 0, por: 'IVA soportado al 21 %' },
              { c: '572', d: 0, h: totalPago, por: 'Pago por banco' },
            ],
          }
        : {
            fecha: `01/${mm}/${anio}`,
            concepto: 'Pago de prima anual de seguro',
            lineas: [
              { c: servicio.c, d: a, h: 0, por: 'Prima anual de seguro' },
              { c: '572', d: 0, h: a, por: 'Pago por banco' },
            ],
          };

      return {
        texto:
          `01/${mm}/${anio}: paga por banco ${Fmt.eur(a)}${servicio.conIva ? ' más 21 % de IVA' : ''} por un ${servicio.nombre} ` +
          `que cubre 12 meses desde esta fecha, realizando la periodificación correspondiente el 31/12/${anio}.`,
        asientos: [
          asientoPago,
          {
            fecha: `31/12/${anio}`,
            concepto: 'Periodificación de gasto anticipado',
            lineas: [
              { c: '480', d: anticipado, h: 0, por: `Gasto anticipado (${m - 1} meses)` },
              { c: servicio.c, d: 0, h: anticipado, por: 'Ajuste al devengo del ejercicio' },
            ],
          },
        ],
      };
    }

    case 'N1': {
      const bruto = rng.pick([2000, 2500, 3000, 4000]);
      const irpfPct = rng.pick([12, 15, 18]);
      const irpf = r2(bruto * (irpfPct / 100));
      const ssTrab = r2(bruto * 0.065);
      const ssEmp = r2(bruto * 0.30);
      const ssTotal = r2(ssEmp + ssTrab);
      const liquido = r2(bruto - irpf - ssTrab);

      return {
        texto:
          `30/11/${anio}: devenga la nómina mensual por un salario bruto de ${Fmt.eur(bruto)}, con retención de IRPF del ${irpfPct} %, ` +
          `Seguridad Social del trabajador del 6,5 % y Seguridad Social a cargo de la empresa del 30 % (queda pendiente de pago).`,
        asientos: [
          {
            fecha: `30/11/${anio}`,
            concepto: 'Devengo de la nómina mensual',
            lineas: [
              { c: '640', d: bruto, h: 0, por: 'Sueldos y salarios' },
              { c: '642', d: ssEmp, h: 0, por: 'Seguridad Social a cargo de la empresa' },
              { c: '4751', d: 0, h: irpf, por: 'Retenciones de IRPF practicadas' },
              { c: '476', d: 0, h: ssTotal, por: 'Deuda total con la Seguridad Social' },
              { c: '465', d: 0, h: liquido, por: 'Remuneraciones pendientes de pago' },
            ],
          },
        ],
      };
    }

    case 'AMORT_213': {
      return {
        texto:
          `31/12/${anio}: contabiliza la amortización anual lineal de la maquinaria adquirida el 01/01/${anio} (vida útil ${ctx.vidaUtil} años, valor residual nulo).`,
        asientos: [
          {
            fecha: `31/12/${anio}`,
            concepto: 'Amortización anual de la maquinaria',
            lineas: [
              { c: '681', d: ctx.cuotaMaq, h: 0, por: 'Cuota anual de amortización lineal' },
              { c: '281', d: 0, h: ctx.cuotaMaq, por: 'Amortización acumulada del inmovilizado material' },
            ],
          },
        ],
      };
    }

    case 'EF_300': {
      const ef = rng.entero(4000, 14000, 1000);
      return {
        texto:
          `31/12/${anio}: el inventario físico final arroja unas existencias de mercaderías valoradas en ${Fmt.eur(ef)} (sin existencias iniciales).`,
        asientos: [
          {
            fecha: `31/12/${anio}`,
            concepto: 'Regularización de existencias finales',
            lineas: [
              { c: '300', d: ef, h: 0, por: 'Alta del inventario final de mercaderías' },
              { c: '610', d: 0, h: ef, por: 'Variación de existencias al cierre' },
            ],
          },
        ],
      };
    }
  }
}

function intentarSupuestoCompleto(
  n: number,
  semillaBase: number
): Ejercicio | null {
  const rng = crearRngLocal(semillaBase);
  const empresa = rng.pick(EMPRESAS_SUPUESTO);
  const anio = '20X6';

  const c572 = rng.entero(60000, 120000, 5000);
  const c430 = rng.entero(18000, 36000, 1000);
  const vidaUtil = rng.pick([4, 5, 8, 10]);
  const cuotaMaq = rng.entero(2000, 6000, 500);
  const c213 = r2(cuotaMaq * vidaUtil);
  const c100 = rng.entero(40000, 90000, 5000);
  const c113 = r2(c572 + c430 + c213 - c100);

  if (c113 <= 0) {
    return null;
  }

  const inicial: SaldoInicial[] = [
    { c: '213', d: c213, h: 0 },
    { c: '430', d: c430, h: 0 },
    { c: '572', d: c572, h: 0 },
    { c: '100', d: 0, h: c100 },
    { c: '113', d: 0, h: c113 },
  ];

  const elegidas = rng.barajar(OPERACIONES_COMPLETO).slice(0, n);
  const ordenCronologico: Record<TipoOperacionCompleta, number> = {
    V1: 1,
    V3: 2,
    F1: 3,
    D1: 4,
    J1: 5,
    N1: 6,
    AMORT_213: 7,
    EF_300: 8,
  };
  elegidas.sort((a, b) => ordenCronologico[a] - ordenCronologico[b]);

  const bloquesTexto: string[] = [];
  const asientos: Asiento[] = [];

  elegidas.forEach((tipo, idx) => {
    const op = generarOperacionCompleta(tipo, rng, {
      anio,
      c213,
      vidaUtil,
      cuotaMaq,
    });
    bloquesTexto.push(`${idx + 1}) ${op.texto}`);
    asientos.push(...op.asientos);
  });

  const saldosPre = Engine.mayorizar(asientos, inicial);
  const pygPre = Masas.pyg(saldosPre);

  let textoImpuesto =
    `Al cierre (31/12/${anio}), dado que el resultado antes de impuestos no es positivo, no se devenga impuesto sobre beneficios.`;

  if (pygPre.C > 0) {
    const impuesto = r2(pygPre.C * 0.25);
    if (impuesto > 0) {
      asientos.push({
        fecha: `31/12/${anio}`,
        concepto: 'Devengo del impuesto sobre beneficios (25 %)',
        lineas: [
          {
            c: '630',
            d: impuesto,
            h: 0,
            por: 'Impuesto sobre beneficios (25 % sobre BAI positivo)',
          },
          {
            c: '4752',
            d: 0,
            h: impuesto,
            por: 'Hacienda Pública, acreedora por impuesto sobre sociedades',
          },
        ],
      });
      textoImpuesto =
        `Al cierre (31/12/${anio}), contabiliza además el impuesto sobre beneficios del 25 % sobre el resultado antes de impuestos.`;
    }
  }

  for (const a of asientos) {
    const val = Engine.validar(a);
    if (!val.ok) {
      return null;
    }
    for (const l of a.lineas) {
      if (!PGC.get(l.c)) {
        return null;
      }
    }
  }

  const saldosFinal = Engine.mayorizar(asientos, inicial);
  const { bal, calc } = construirCalculoEstados(saldosFinal);

  if (Math.abs(bal.activo - (bal.pn + bal.pnc + bal.pc)) > 0.01) {
    return null;
  }

  for (const c of calc) {
    if (typeof c.valor !== 'number' || !Number.isFinite(c.valor)) {
      return null;
    }
  }

  const enunciado =
    `${empresa} (IVA 21 %). Balance inicial a 01/01/${anio}: ` +
    `Maquinaria ${Fmt.eur(c213)} (adquirida el 01/01/${anio}, vida útil ${vidaUtil} años, valor residual nulo), ` +
    `Clientes ${Fmt.eur(c430)}, Bancos c/c ${Fmt.eur(c572)}, Capital social ${Fmt.eur(c100)} y Reservas voluntarias ${Fmt.eur(c113)}. ` +
    `Durante el ejercicio ${anio} realiza las siguientes operaciones: ${bloquesTexto.join(' ')} ` +
    `${textoImpuesto} Redacta los asientos del libro diario y elabora la Cuenta de PyG y el Balance de situación finales.`;

  let notaSupuesto =
    'En el supuesto global se liquidan las operaciones en orden, se ajusta el 25 % de impuesto sobre beneficios si el BAI es positivo y el Balance final cuadra con Activo = Patrimonio neto + Pasivo.';
  if (elegidas.includes('D1')) {
    notaSupuesto += ' Simplificación: no se recupera el IVA del crédito incobrable.';
  }

  return {
    id: `S-completo-${semillaBase}`,
    tema: 'completo',
    nivel: 5,
    titulo: `Supuesto integral de examen (${n} operaciones)`,
    enunciado,
    inicial,
    asientos,
    calc,
    nota: notaSupuesto,
    fuente: 'gen',
  };
}

function limpiarCabeceraEnunciado(texto: string, empresa: string): string {
  let out = texto.trim();
  if (out.startsWith(empresa)) {
    out = out.slice(empresa.length).trim();
  }
  out = out.replace(/^\(IVA\s*21\s*%\)\s*\.?\s*/i, '');
  out = out.replace(/^\.\s*/, '');
  return out.trim();
}

function construirInicialDesdeMapa(map: Record<string, number>): SaldoInicial[] {
  const res: SaldoInicial[] = [];
  for (const [c, saldo] of Object.entries(map)) {
    const val = r2(saldo);
    if (Math.abs(val) < 0.005) {
      continue;
    }
    if (val > 0) {
      res.push({ c, d: val, h: 0 });
    } else {
      res.push({ c, d: 0, h: r2(-val) });
    }
  }
  return res;
}

function intentarSupuestoPorTema(
  temaId: TemaId,
  n: number,
  semillaBase: number
): Ejercicio | null {
  const todas: Plantilla[] = [...PLANTILLAS_1, ...PLANTILLAS_2, ...PLANTILLAS_3];
  const pool = todas.filter((p) => p.tema === temaId);
  if (pool.length === 0) {
    return null;
  }

  const rng = crearRngLocal(semillaBase);
  const empresa = rng.pick(EMPRESAS_SUPUESTO);
  const anio = '20X6';

  const c572 = rng.entero(60000, 120000, 5000);
  const c430 = rng.entero(18000, 36000, 1000);
  const vidaUtil = rng.pick([4, 5, 8, 10]);
  const cuotaMaq = rng.entero(2000, 6000, 500);
  const c213 = r2(cuotaMaq * vidaUtil);
  const c100 = rng.entero(40000, 90000, 5000);
  const c113 = r2(c572 + c430 + c213 - c100);

  if (c113 <= 0) {
    return null;
  }

  const inicialMap: Record<string, number> = {
    '213': c213,
    '430': c430,
    '572': c572,
    '100': -c100,
    '113': -c113,
  };

  const ordenadas = rng.barajar(pool);
  const seleccionadas: Plantilla[] = [];
  const usadasSinRepetir = new Set<string>();

  for (const p of ordenadas) {
    if (seleccionadas.length >= n) break;
    usadasSinRepetir.add(p.id);
    seleccionadas.push(p);
  }

  let cursor = 0;
  while (seleccionadas.length < n && cursor < pool.length * 4) {
    const p = ordenadas[cursor % ordenadas.length];
    seleccionadas.push(p);
    cursor += 1;
  }

  const bloquesTexto: string[] = [];
  const asientos: Asiento[] = [];
  const ctx: PlantillaContext = {
    empresa,
    anio,
    r2,
    fecha: (dia: number, mes: number) => {
      const dd = String(Math.max(1, Math.min(28, dia))).padStart(2, '0');
      const mm = String(Math.max(1, Math.min(12, mes))).padStart(2, '0');
      return `${dd}/${mm}/${anio}`;
    },
  };

  let intentosSub = 0;
  for (let idx = 0; idx < seleccionadas.length; idx++) {
    const plantilla = seleccionadas[idx];
    let ej: Ejercicio | null = null;

    for (let k = 0; k < 20; k++) {
      intentosSub += 1;
      const subRng = crearRngLocal((semillaBase + intentosSub * 3571) >>> 0 || 1);
      const candidato = plantilla.hacer(subRng, ctx);
      if (candidato && candidato.asientos.length > 0) {
        ej = candidato;
        break;
      }
    }

    if (!ej) {
      const candidatoSinFiltro = plantilla.hacer(rng, ctx);
      if (!candidatoSinFiltro) {
        return null;
      }
      ej = candidatoSinFiltro;
    }

    if (ej.inicial && ej.inicial.length > 0) {
      let netoInicial = 0;
      for (const s of ej.inicial) {
        const delta = r2(s.d - s.h);
        inicialMap[s.c] = r2((inicialMap[s.c] ?? 0) + delta);
        netoInicial = r2(netoInicial + delta);
      }
      if (Math.abs(netoInicial) > 0.005) {
        inicialMap['113'] = r2((inicialMap['113'] ?? 0) - netoInicial);
      }
    }

    const limpio = limpiarCabeceraEnunciado(ej.enunciado, empresa);
    bloquesTexto.push(`${idx + 1}) ${conPuntoFinal(limpio)}`);
    asientos.push(...ej.asientos);
  }

  if (asientos.length === 0) {
    return null;
  }

  for (const a of asientos) {
    const val = Engine.validar(a);
    if (!val.ok) {
      return null;
    }
    for (const l of a.lineas) {
      if (!PGC.get(l.c)) {
        return null;
      }
    }
  }

  const inicial = construirInicialDesdeMapa(inicialMap);
  for (const s of inicial) {
    if (!PGC.get(s.c)) {
      return null;
    }
  }

  const saldosFinal = Engine.mayorizar(asientos, inicial);
  const { bal, calc } = construirCalculoEstados(saldosFinal);

  if (Math.abs(bal.activo - (bal.pn + bal.pnc + bal.pc)) > 0.01) {
    return null;
  }

  for (const c of calc) {
    if (typeof c.valor !== 'number' || !Number.isFinite(c.valor)) {
      return null;
    }
  }

  const enunciado =
    `${empresa} (IVA 21 %). Situación inicial de partida a 01/01/${anio}: ` +
    `Maquinaria ${Fmt.eur(c213)} (adquirida el 01/01/${anio}, vida útil ${vidaUtil} años, VR 0 €), ` +
    `Clientes ${Fmt.eur(c430)}, Bancos c/c ${Fmt.eur(c572)}, Capital social ${Fmt.eur(c100)} y Reservas voluntarias ${Fmt.eur(c113)} ` +
    `(más los saldos específicos indicados en cada apartado). ` +
    `Realiza los siguientes bloques de operaciones: ${bloquesTexto.join(' ')} ` +
    `Elabora finalmente el resumen de Cuenta de PyG y masas del Balance.`;

  let notaTema =
    'Cada apartado integra sus asientos en el libro diario único del supuesto para calcular conjuntamente la Cuenta de PyG y el Balance de situación.';
  if (seleccionadas.some((p) => p.id === 'D1')) {
    notaTema += ' Simplificación: no se recupera el IVA del crédito incobrable.';
  }
  if (seleccionadas.some((p) => p.id === 'J3')) {
    notaTema +=
      ' Criterio de manual: también puede usarse otra cuenta de gasto según el origen; sigue el criterio de tu profesor.';
  }

  return {
    id: `S-${temaId}-${semillaBase}`,
    tema: temaId,
    nivel: 4,
    titulo: `Supuesto práctico de ${temaId} (${n} bloques)`,
    enunciado,
    inicial,
    asientos,
    calc,
    nota: notaTema,
    fuente: 'gen',
  };
}

export function generarSupuesto(
  temaId: TemaId,
  opts?: SupuestoOpts
): Ejercicio {
  const semillaBase =
    typeof opts?.semilla === 'number' && Number.isFinite(opts.semilla)
      ? (opts.semilla >>> 0) || 1
      : (Math.floor(Math.random() * 0x7fffffff) + 1) >>> 0;

  const r = crearRngLocal(semillaBase);
  const nRaw =
    typeof opts?.n === 'number' && Number.isFinite(opts.n)
      ? Math.round(opts.n)
      : r.entero(4, 8, 1);
  const n = Math.max(4, Math.min(8, nRaw));

  const MAX_INTENTOS = 25;

  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    const subSemilla = (semillaBase + intento * 7919) >>> 0 || 1;
    const supuesto =
      temaId === 'completo'
        ? intentarSupuestoCompleto(n, subSemilla)
        : intentarSupuestoPorTema(temaId, n, subSemilla);

    if (supuesto) {
      return supuesto;
    }
  }

  throw new Error(
    `No se pudo generar un supuesto válido para "${temaId}" tras ${MAX_INTENTOS} intentos.`
  );
}
