import { Fmt } from '../fmt';
import { conPuntoFinal, type Plantilla } from '../gen';
import type { Asiento, Ejercicio } from '../types';

export const PLANTILLAS_2: Plantilla[] = [
  // =========================================================================
  // PRÉSTAMOS E INVERSIONES FINANCIERAS
  // =========================================================================
  {
    id: 'F1',
    tema: 'prestamos',
    nombre: 'Préstamo con amortización constante',
    nivel: 3,
    hacer(rng, ctx): Ejercicio | null {
      const c = rng.pick([5000, 10000, 20000, 25000]);
      const n = rng.pick([4, 5, 8, 10]);
      const principal = ctx.r2(c * n);
      const tipoPct = rng.pick([3, 4, 5, 6]);
      const tipo = tipoPct / 100;

      const int1 = ctx.r2(principal * tipo);
      const pago1 = ctx.r2(c + int1);
      const int2 = ctx.r2((principal - c) * tipo);

      const anioConc = '20X5';
      const anioCuota = '20X6';
      const fConc = `31/12/${anioConc}`;
      const fCuota = `31/12/${anioCuota}`;

      const asientos: Asiento[] = [
        {
          fecha: fConc,
          concepto: 'Concesión del préstamo a largo plazo',
          lineas: [
            {
              c: '572',
              d: principal,
              h: 0,
              por: 'Ingreso del principal en la cuenta corriente',
            },
            {
              c: '170',
              d: 0,
              h: principal,
              por: 'Deuda inicial a largo plazo con la entidad de crédito',
            },
          ],
        },
        {
          fecha: fConc,
          concepto: 'Reclasificación de la primera cuota a corto plazo',
          lineas: [
            {
              c: '170',
              d: c,
              h: 0,
              por: 'Traspaso de la cuota con vencimiento a 12 meses',
            },
            {
              c: '520',
              d: 0,
              h: c,
              por: 'Deuda a corto plazo por la primera cuota de capital',
            },
          ],
        },
        {
          fecha: fCuota,
          concepto: 'Pago de la primera cuota anual (capital e intereses)',
          lineas: [
            {
              c: '520',
              d: c,
              h: 0,
              por: 'Amortización constante de capital del primer año',
            },
            {
              c: '662',
              d: int1,
              h: 0,
              por: 'Intereses devengados del primer año sobre el capital vivo',
            },
            {
              c: '572',
              d: 0,
              h: pago1,
              por: 'Cargo bancario de la primera anualidad',
            },
          ],
        },
        {
          fecha: fCuota,
          concepto: 'Reclasificación de la segunda cuota a corto plazo',
          lineas: [
            {
              c: '170',
              d: c,
              h: 0,
              por: 'Traspaso del principal que vence el próximo ejercicio',
            },
            {
              c: '520',
              d: 0,
              h: c,
              por: 'Deuda a corto plazo para el segundo año',
            },
          ],
        },
      ];

      const enunciado =
        `${conPuntoFinal(ctx.empresa)} ` +
        `1) ${fConc}: recibe un préstamo bancario de ${Fmt.eur(principal)} a devolver en ${n} anualidades constantes de capital cada 31 de diciembre, al ${tipoPct} % anual (reclasifica al cierre la parte a corto plazo). ` +
        `2) ${fCuota}: paga por banco la primera cuota (capital e intereses del año) y reclasifica la cuota del ejercicio siguiente. ` +
        `Calcula además los intereses correspondientes al segundo año.`;

      return {
        id: '',
        tema: 'prestamos',
        nivel: 3,
        titulo: 'Préstamo con amortización constante',
        enunciado,
        inicial: null,
        asientos,
        calc: [
          { etiqueta: 'Cuota anual de capital', valor: c },
          { etiqueta: 'Intereses del primer año', valor: int1 },
          { etiqueta: 'Pago total del primer año', valor: pago1 },
          { etiqueta: 'Intereses del segundo año', valor: int2 },
        ],
        nota: 'Al cierre de cada ejercicio se reclasifica de largo (170) a corto plazo (520) la cuota de capital que vence en los próximos 12 meses. Los intereses se devengan sobre el capital vivo.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'F2',
    tema: 'prestamos',
    nombre: 'Rentas financieras con retención del 19 %',
    nivel: 2,
    hacer(rng, ctx): Ejercicio | null {
      const esDividendos = rng.next() < 0.5;
      const bruto = rng.entero(500, 4000, 100);
      const neto = ctx.r2(bruto * 0.81);
      const retencion = ctx.r2(bruto * 0.19);

      if (!Number.isInteger(ctx.r2(neto / 0.81)) || ctx.r2(neto + retencion) !== bruto) {
        return null;
      }

      if (esDividendos) {
        const nAcc = rng.entero(100, 500, 50);
        const precioAcc = rng.entero(10, 40, 2);
        const inversion = ctx.r2(nAcc * precioAcc);
        const f1 = ctx.fecha(10, 2);
        const f2 = ctx.fecha(15, 6);

        const asientos: Asiento[] = [
          {
            fecha: f1,
            concepto: 'Compra de acciones como inversión financiera a corto plazo',
            lineas: [
              {
                c: '540',
                d: inversion,
                h: 0,
                por: 'Alta de la inversión en instrumentos de patrimonio a c/p',
              },
              {
                c: '572',
                d: 0,
                h: inversion,
                por: 'Pago por banco al adquirir las acciones',
              },
            ],
          },
          {
            fecha: f2,
            concepto: 'Cobro de dividendos con retención del 19 %',
            lineas: [
              {
                c: '572',
                d: neto,
                h: 0,
                por: 'Importe líquido ingresado en banco tras retención',
              },
              {
                c: '473',
                d: retencion,
                h: 0,
                por: 'Retención fiscal del 19 % soportada a cuenta',
              },
              {
                c: '760',
                d: 0,
                h: bruto,
                por: 'Ingreso íntegro por dividendos (760)',
              },
            ],
          },
        ];

        const enunciado =
          `${conPuntoFinal(ctx.empresa)} ` +
          `1) ${f1}: adquiere ${nAcc} acciones cotizadas a ${Fmt.eur(precioAcc)} cada una como inversión financiera temporal a corto plazo, pagando por banco. ` +
          `2) ${f2}: cobra en cuenta corriente unos dividendos líquidos de ${Fmt.eur(neto)}, tras practicarse una retención fiscal del 19 %.`;

        return {
          id: '',
          tema: 'prestamos',
          nivel: 2,
          titulo: 'Dividendos con retención (19 %)',
          enunciado,
          inicial: null,
          asientos,
          calc: [
            { etiqueta: 'Inversión inicial (540)', valor: inversion },
            { etiqueta: 'Dividendo bruto (760)', valor: bruto },
            { etiqueta: 'Retención 19 % (473)', valor: retencion },
            { etiqueta: 'Neto cobrado (572)', valor: neto },
          ],
          nota: 'Si el enunciado da el líquido tras retención del 19 %, el bruto se obtiene dividiendo entre 0,81. La retención va a la 473 (Activo) y el ingreso bruto a la 760.',
          fuente: 'gen',
        };
      }

      const f1 = ctx.fecha(12, 3);
      const f2 = ctx.fecha(20, 9);
      const nominalBonos = rng.entero(20000, 80000, 5000);

      const asientos: Asiento[] = [
        {
          fecha: f1,
          concepto: 'Suscripción de bonos a corto plazo',
          lineas: [
            {
              c: '541',
              d: nominalBonos,
              h: 0,
              por: 'Valores representativos de deuda a corto plazo',
            },
            {
              c: '572',
              d: 0,
              h: nominalBonos,
              por: 'Pago por banco',
            },
          ],
        },
        {
          fecha: f2,
          concepto: 'Cobro de intereses de bonos con retención del 19 %',
          lineas: [
            {
              c: '572',
              d: neto,
              h: 0,
              por: 'Importe líquido ingresado en cuenta bancaria',
            },
            {
              c: '473',
              d: retencion,
              h: 0,
              por: 'Retención fiscal del 19 % (H.P., retenciones y pagos a cuenta)',
            },
            {
              c: '761',
              d: 0,
              h: bruto,
              por: 'Ingreso bruto de valores representativos de deuda (761)',
            },
          ],
        },
      ];

      const enunciado =
        `${conPuntoFinal(ctx.empresa)} ` +
        `1) ${f1}: adquiere bonos del Tesoro como valores representativos de deuda a corto plazo por ${Fmt.eur(nominalBonos)}, pagando por banco. ` +
        `2) ${f2}: cobra en cuenta corriente los intereses del cupón, percibiendo un importe neto de ${Fmt.eur(neto)} tras una retención del 19 %.`;

      return {
        id: '',
        tema: 'prestamos',
        nivel: 2,
        titulo: 'Intereses de valores de deuda con retención',
        enunciado,
        inicial: null,
        asientos,
        calc: [
          { etiqueta: 'Interés bruto (761)', valor: bruto },
          { etiqueta: 'Retención 19 % (473)', valor: retencion },
          { etiqueta: 'Neto cobrado (572)', valor: neto },
        ],
        nota: 'Los intereses de bonos y obligaciones van a la 761 por su importe íntegro (neto / 0,81). La retención del 19 % se carga en la 473.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'F3',
    tema: 'prestamos',
    nombre: 'Fianzas constituidas y recibidas',
    nivel: 1,
    hacer(rng, ctx): Ejercicio | null {
      const importe = rng.entero(1200, 6000, 300);
      const tipo = rng.pick(['const_lp', 'const_cp', 'recib_lp'] as const);
      const f1 = ctx.fecha(1, 4);

      if (tipo === 'const_lp') {
        return {
          id: '',
          tema: 'prestamos',
          nivel: 1,
          titulo: 'Fianza constituida a largo plazo',
          enunciado: `${conPuntoFinal(ctx.empresa)} 1) ${f1}: firma un contrato de arrendamiento de una nave industrial a 4 años y entrega por transferencia bancaria ${Fmt.eur(importe)} en concepto de fianza.`,
          inicial: null,
          asientos: [
            {
              fecha: f1,
              concepto: 'Constitución de fianza a largo plazo',
              lineas: [
                {
                  c: '260',
                  d: importe,
                  h: 0,
                  por: 'Efectivo entregado como garantía a largo plazo (activo)',
                },
                {
                  c: '572',
                  d: 0,
                  h: importe,
                  por: 'Salida bancaria por la entrega de la fianza',
                },
              ],
            },
          ],
          calc: [{ etiqueta: 'Fianza constituida a l/p (260)', valor: importe }],
          nota: 'Las fianzas entregadas a más de un año son un activo no corriente en la cuenta 260.',
          fuente: 'gen',
        };
      }

      if (tipo === 'const_cp') {
        return {
          id: '',
          tema: 'prestamos',
          nivel: 1,
          titulo: 'Fianza constituida a corto plazo',
          enunciado: `${conPuntoFinal(ctx.empresa)} 1) ${f1}: alquila maquinaria por 6 meses y deposita por banco una fianza de ${Fmt.eur(importe)} que recuperará al finalizar el contrato.`,
          inicial: null,
          asientos: [
            {
              fecha: f1,
              concepto: 'Constitución de fianza a corto plazo',
              lineas: [
                {
                  c: '565',
                  d: importe,
                  h: 0,
                  por: 'Efectivo entregado como garantía a corto plazo (activo)',
                },
                {
                  c: '572',
                  d: 0,
                  h: importe,
                  por: 'Pago por cuenta bancaria',
                },
              ],
            },
          ],
          calc: [{ etiqueta: 'Fianza constituida a c/p (565)', valor: importe }],
          nota: 'Las fianzas entregadas con vencimiento igual o inferior a un año se registran en la cuenta 565.',
          fuente: 'gen',
        };
      }

      return {
        id: '',
        tema: 'prestamos',
        nivel: 1,
        titulo: 'Fianza recibida a largo plazo',
        enunciado: `${conPuntoFinal(ctx.empresa)} 1) ${f1}: arrienda un local de su propiedad a un tercero por 3 años y recibe por banco ${Fmt.eur(importe)} como fianza en garantía.`,
        inicial: null,
        asientos: [
          {
            fecha: f1,
            concepto: 'Recepción de fianza a largo plazo',
            lineas: [
              {
                c: '572',
                d: importe,
                h: 0,
                por: 'Ingreso en banco del depósito recibido',
              },
              {
                c: '180',
                d: 0,
                h: importe,
                por: 'Obligación de devolver la fianza al término del contrato (pasivo l/p)',
              },
            ],
          },
        ],
        calc: [{ etiqueta: 'Fianza recibida a l/p (180)', valor: importe }],
        nota: 'Las fianzas recibidas en garantía a más de un año constituyen un pasivo no corriente en la cuenta 180.',
        fuente: 'gen',
      };
    },
  },

  // =========================================================================
  // CAPITAL Y CONSTITUCIÓN
  // =========================================================================
  {
    id: 'K1',
    tema: 'capital',
    nombre: 'Constitución con aportaciones dinerarias y no dinerarias',
    nivel: 1,
    hacer(rng, ctx): Ejercicio | null {
      const k = rng.pick([100000, 200000, 300000]);
      const terreno = rng.entero(20000, 80000, 5000);
      const construccion = rng.entero(30000, 120000, 5000);
      const efectivo = ctx.r2(k - terreno - construccion);

      if (efectivo <= 0) {
        return null;
      }

      const f1 = ctx.fecha(15, 1);

      return {
        id: '',
        tema: 'capital',
        nivel: 1,
        titulo: 'Constitución de la sociedad',
        enunciado:
          `${conPuntoFinal(ctx.empresa)} 1) ${f1}: se constituye la sociedad con un capital social de ${Fmt.eur(k)} totalmente suscrito y desembolsado. ` +
          `Los socios aportan un terreno valorado en ${Fmt.eur(terreno)}, una nave industrial (construcción) valorada en ${Fmt.eur(construccion)} y el resto mediante ingreso en la cuenta corriente bancaria.`,
        inicial: null,
        asientos: [
          {
            fecha: f1,
            concepto: 'Constitución y desembolso íntegro del capital social',
            lineas: [
              {
                c: '210',
                d: terreno,
                h: 0,
                por: 'Aportación no dineraria de terrenos',
              },
              {
                c: '211',
                d: construccion,
                h: 0,
                por: 'Aportación no dineraria de construcciones',
              },
              {
                c: '572',
                d: efectivo,
                h: 0,
                por: 'Desembolso dinerario restante en bancos',
              },
              {
                c: '100',
                d: 0,
                h: k,
                por: 'Capital social escriturado (patrimonio neto)',
              },
            ],
          },
        ],
        calc: [
          {
            etiqueta: 'Aportaciones no dinerarias',
            valor: ctx.r2(terreno + construccion),
          },
          { etiqueta: 'Desembolso en efectivo (572)', valor: efectivo },
          { etiqueta: 'Capital social (100)', valor: k },
        ],
        nota: 'En la constitución con desembolso íntegro se cargan los bienes aportados y la tesorería por su valor razonable y se abona Capital social (100).',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'K2',
    tema: 'capital',
    nombre: 'Ampliación de capital con prima de emisión',
    nivel: 3,
    hacer(rng, ctx): Ejercicio | null {
      const c0 = rng.pick([300000, 600000, 900000]);
      const pPct = rng.pick([20, 25, 40]);
      const p = pPct / 100;
      const capitalNuevo = ctx.r2(c0 / (1 - p));
      const ampliacion = ctx.r2(capitalNuevo - c0);
      const nominal = rng.pick([5, 10]);
      const acciones = ampliacion / nominal;

      if (!Number.isInteger(acciones) || acciones <= 0) {
        return null;
      }

      const prima = rng.pick([1, 2, 3]);
      const emision = nominal + prima;
      const cobroTotal = ctx.r2(acciones * emision);
      const primaTotal = ctx.r2(acciones * prima);
      const f1 = ctx.fecha(18, 4);

      return {
        id: '',
        tema: 'capital',
        nivel: 3,
        titulo: 'Ampliación de capital con prima de emisión',
        enunciado:
          `${conPuntoFinal(ctx.empresa)} 1) ${f1}: la sociedad, cuyo capital social previo es de ${Fmt.eur(c0)}, acuerda una ampliación de capital ` +
          `emitiendo nuevas acciones de ${Fmt.eur(nominal)} de valor nominal con una prima de emisión de ${Fmt.eur(prima)} por acción, totalmente suscritas y desembolsadas por banco. ` +
          `Las nuevas acciones representan exactamente el ${pPct} % del capital social resultante tras la ampliación.`,
        inicial: null,
        asientos: [
          {
            fecha: f1,
            concepto: 'Ampliación de capital con prima de emisión',
            lineas: [
              {
                c: '572',
                d: cobroTotal,
                h: 0,
                por: 'Desembolso total por banco (nominal + prima)',
              },
              {
                c: '100',
                d: 0,
                h: ampliacion,
                por: 'Aumento del capital social por el valor nominal emitido',
              },
              {
                c: '110',
                d: 0,
                h: primaTotal,
                por: 'Prima de emisión de las nuevas acciones',
              },
            ],
          },
        ],
        calc: [
          { etiqueta: 'Capital social resultante', valor: capitalNuevo },
          { etiqueta: 'Ampliación de capital nominal (100)', valor: ampliacion },
          { etiqueta: 'Número de acciones emitidas', valor: acciones },
          { etiqueta: 'Prima de emisión total (110)', valor: primaTotal },
        ],
        nota: 'Si las nuevas acciones suponen el porcentaje p del capital final, C_final = C0 / (1 − p). El nominal va a Capital social (100) y el sobreprecio a Prima de emisión (110).',
        fuente: 'gen',
      };
    },
  },

  // =========================================================================
  // NÓMINAS
  // =========================================================================
  {
    id: 'N1',
    tema: 'nominas',
    nombre: 'Devengo y liquidación de nómina, SS e IRPF',
    nivel: 2,
    hacer(rng, ctx): Ejercicio | null {
      const bruto = rng.pick([1500, 2000, 2500, 3000, 4000]);
      const irpfPct = rng.pick([12, 15, 18]);
      const ssTrabPct = 6.5;
      const ssEmpPct = 30;

      const irpf = ctx.r2(bruto * (irpfPct / 100));
      const ssTrab = ctx.r2(bruto * (ssTrabPct / 100));
      const ssEmp = ctx.r2(bruto * (ssEmpPct / 100));
      const ssTotal = ctx.r2(ssEmp + ssTrab);
      const liquido = ctx.r2(bruto - irpf - ssTrab);
      const irpfTrim = ctx.r2(irpf * 3);

      const fDev = ctx.fecha(28, 2);
      const fPagoNom = ctx.fecha(2, 3);
      const fPagoSS = ctx.fecha(28, 3);
      const fPagoIRPF = ctx.fecha(20, 4);

      const asientos: Asiento[] = [
        {
          fecha: fDev,
          concepto: 'Devengo de la nómina mensual',
          lineas: [
            {
              c: '640',
              d: bruto,
              h: 0,
              por: 'Retribución bruta del trabajador (sueldos y salarios)',
            },
            {
              c: '642',
              d: ssEmp,
              h: 0,
              por: 'Cotización a la Seguridad Social a cargo de la empresa (30 %)',
            },
            {
              c: '4751',
              d: 0,
              h: irpf,
              por: 'Retención practicada por IRPF a ingresar en Hacienda',
            },
            {
              c: '476',
              d: 0,
              h: ssTotal,
              por: 'Deuda total con la Seguridad Social (cuota empresa + cuota trabajador)',
            },
            {
              c: '465',
              d: 0,
              h: liquido,
              por: 'Sueldo líquido pendiente de pago al trabajador',
            },
          ],
        },
        {
          fecha: fPagoNom,
          concepto: 'Pago de la nómina por banco',
          lineas: [
            {
              c: '465',
              d: liquido,
              h: 0,
              por: 'Cancelación de remuneraciones pendientes',
            },
            {
              c: '572',
              d: 0,
              h: liquido,
              por: 'Transferencia del salario neto',
            },
          ],
        },
        {
          fecha: fPagoSS,
          concepto: 'Pago de los seguros sociales a mes vencido',
          lineas: [
            {
              c: '476',
              d: ssTotal,
              h: 0,
              por: 'Liquidación de las cuotas de la Seguridad Social',
            },
            {
              c: '572',
              d: 0,
              h: ssTotal,
              por: 'Cargo bancario de la Seguridad Social',
            },
          ],
        },
        {
          fecha: fPagoIRPF,
          concepto: 'Ingreso trimestral de retenciones de IRPF',
          lineas: [
            {
              c: '4751',
              d: irpfTrim,
              h: 0,
              por: 'Cancelación de las retenciones de IRPF de tres nóminas iguales',
            },
            {
              c: '572',
              d: 0,
              h: irpfTrim,
              por: 'Pago a Hacienda por banco',
            },
          ],
        },
      ];

      const enunciado =
        `${conPuntoFinal(ctx.empresa)} ` +
        `1) ${fDev}: contabiliza la nómina del mes con un salario bruto de ${Fmt.eur(bruto)}, una retención de IRPF del ${irpfPct} %, Seguridad Social a cargo del trabajador del 6,5 % y Seguridad Social a cargo de la empresa del 30 %. ` +
        `2) ${fPagoNom}: paga la nómina líquida por banco. ` +
        `3) ${fPagoSS}: abona por banco las cuotas totales a la Seguridad Social. ` +
        `4) ${fPagoIRPF}: ingresa en Hacienda por banco las retenciones de IRPF correspondientes al trimestre completo (tres nóminas mensuales idénticas).`;

      return {
        id: '',
        tema: 'nominas',
        nivel: 2,
        titulo: 'Nómina mensual, Seguridad Social e IRPF',
        enunciado,
        inicial: null,
        asientos,
        calc: [
          { etiqueta: 'SS a cargo de la empresa (642)', valor: ssEmp },
          { etiqueta: 'IRPF mensual retenido (4751)', valor: irpf },
          { etiqueta: 'Deuda total Seguridad Social (476)', valor: ssTotal },
          { etiqueta: 'Líquido a pagar al trabajador (465)', valor: liquido },
          { etiqueta: 'Ingreso trimestral IRPF (3 meses)', valor: irpfTrim },
        ],
        nota: 'En la 476 se acumulan tanto la cuota empresarial (642) como la deducida al trabajador. Las retenciones de IRPF (4751) se liquidan trimestralmente.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'N2',
    tema: 'nominas',
    nombre: 'Nómina con paga extraordinaria prorrateada',
    nivel: 3,
    hacer(rng, ctx): Ejercicio | null {
      const sueldo = rng.pick([1500, 2000, 2500]);
      const extra = rng.pick([2400, 3000, 3600]);
      const prorrata = ctx.r2(extra / 6);
      const bruto = ctx.r2(sueldo + prorrata);

      const irpfPct = rng.pick([12, 15, 18]);
      const irpf = ctx.r2(bruto * (irpfPct / 100));
      const ssTrab = ctx.r2(bruto * 0.065);
      const ssEmp = ctx.r2(bruto * 0.30);
      const ssTotal = ctx.r2(ssEmp + ssTrab);
      const liquido = ctx.r2(bruto - irpf - ssTrab);

      const fDev = ctx.fecha(28, 2);

      return {
        id: '',
        tema: 'nominas',
        nivel: 3,
        titulo: 'Nómina con paga extra prorrateada',
        enunciado:
          `${conPuntoFinal(ctx.empresa)} 1) ${fDev}: contabiliza exclusivamente el devengo de la nómina de febrero sabiendo que el sueldo base mensual es de ${Fmt.eur(sueldo)} ` +
          `y el trabajador tiene derecho a dos pagas extraordinarias al año de ${Fmt.eur(extra)} cada una (devengo semestral prorrateado; la parte de paga extra queda pendiente en remuneraciones pendientes hasta junio). ` +
          `Retención de IRPF: ${irpfPct} %; Seguridad Social del trabajador: 6,5 %; Seguridad Social de la empresa: 30 %.`,
        inicial: null,
        asientos: [
          {
            fecha: fDev,
            concepto: 'Devengo de nómina con prorrata de paga extra',
            lineas: [
              {
                c: '640',
                d: bruto,
                h: 0,
                por: 'Sueldo mensual más la sexta parte de la paga extra semestral',
              },
              {
                c: '642',
                d: ssEmp,
                h: 0,
                por: 'Seguridad Social de la empresa (30 % sobre el bruto devengado)',
              },
              {
                c: '4751',
                d: 0,
                h: irpf,
                por: 'Retención de IRPF',
              },
              {
                c: '476',
                d: 0,
                h: ssTotal,
                por: 'Cuota total de Seguridad Social (empresa + trabajador)',
              },
              {
                c: '465',
                d: 0,
                h: liquido,
                por: 'Remuneraciones pendientes (incluye la prorrata de la paga extra)',
              },
            ],
          },
        ],
        calc: [
          { etiqueta: 'Prorrata mensual de paga extra', valor: prorrata },
          { etiqueta: 'Bruto devengado (640)', valor: bruto },
          { etiqueta: 'SS empresa (642)', valor: ssEmp },
          { etiqueta: 'Remuneraciones pendientes (465)', valor: liquido },
        ],
        nota: 'Cada paga extra semestral se devenga a razón de 1/6 al mes, sumándose al gasto de sueldos (640) y quedando en 465 hasta su abono.',
        fuente: 'gen',
      };
    },
  },

  // =========================================================================
  // INMOVILIZADO Y AMORTIZACIÓN
  // =========================================================================
  {
    id: 'I1',
    tema: 'inmovilizado',
    nombre: 'Amortización lineal y enajenación de inmovilizado',
    nivel: 4,
    hacer(rng, ctx): Ejercicio | null {
      const m = rng.pick([500, 1000, 1500]);
      const n = rng.pick([5, 8, 10]);
      const p = ctx.r2(m * 12 * n);
      const conVR = rng.next() < 1 / 3;
      const vr = conVR ? ctx.r2(p * 0.1) : 0;
      const cuotaAnual = ctx.r2((p - vr) / n);
      const cuotaMensual = ctx.r2(cuotaAnual / 12);

      const mesCompra = rng.pick([1, 4, 7, 10]);
      const anioVentaOffset = rng.entero(2, Math.min(6, n), 1); // 20X3..20X7
      const mesVenta = rng.entero(2, 12, 1);

      const tm = anioVentaOffset * 12 + (mesVenta - mesCompra);
      // Exige tm >= 13 y tm < 12*n
      if (tm < 13 || tm >= 12 * n) {
        return null;
      }

      const acumulada = ctx.r2(cuotaMensual * tm);
      const amortAnioVenta = ctx.r2(cuotaMensual * (mesVenta - 1));
      const vnc = ctx.r2(p - acumulada);

      const delta = rng.pick([-9000, -3000, 3000, 6000]);
      const precioVenta = ctx.r2(vnc + delta);
      if (precioVenta <= 0) {
        return null;
      }

      const ivaCompra = ctx.r2(p * 0.21);
      const totalCompra = ctx.r2(p + ivaCompra);
      const ivaVenta = ctx.r2(precioVenta * 0.21);
      const totalVenta = ctx.r2(precioVenta + ivaVenta);
      const resultado = ctx.r2(precioVenta - vnc);

      const fCompra = `${String(1).padStart(2, '0')}/${String(mesCompra).padStart(2, '0')}/20X1`;
      const anioVentaTxt = `20X${1 + anioVentaOffset}`;
      const fVenta = `${String(1).padStart(2, '0')}/${String(mesVenta).padStart(2, '0')}/${anioVentaTxt}`;

      const lineasVenta = [
        {
          c: '572',
          d: totalVenta,
          h: 0,
          por: 'Cobro por banco de la venta más IVA',
        },
        {
          c: '281',
          d: acumulada,
          h: 0,
          por: 'Baja de la amortización acumulada total hasta la fecha de venta',
        },
        ...(resultado < 0
          ? [
              {
                c: '671',
                d: Math.abs(resultado),
                h: 0,
                por: 'Pérdida en la venta (precio < VNC)',
              },
            ]
          : []),
        {
          c: '213',
          d: 0,
          h: p,
          por: 'Baja del precio de adquisición de la maquinaria',
        },
        {
          c: '477',
          d: 0,
          h: ivaVenta,
          por: 'IVA repercutido en la venta del inmovilizado (21 %)',
        },
        ...(resultado > 0
          ? [
              {
                c: '771',
                d: 0,
                h: resultado,
                por: 'Beneficio en la venta (precio > VNC)',
              },
            ]
          : []),
      ];

      const asientos: Asiento[] = [
        {
          fecha: fCompra,
          concepto: 'Adquisición de maquinaria con IVA por banco',
          lineas: [
            {
              c: '213',
              d: p,
              h: 0,
              por: 'Precio de adquisición del inmovilizado material',
            },
            {
              c: '472',
              d: ivaCompra,
              h: 0,
              por: 'IVA soportado deducible (21 %)',
            },
            {
              c: '572',
              d: 0,
              h: totalCompra,
              por: 'Pago íntegro por banco',
            },
          ],
        },
        {
          fecha: fVenta,
          concepto: `Amortización de ${anioVentaTxt} hasta la fecha de venta`,
          lineas: [
            {
              c: '681',
              d: amortAnioVenta,
              h: 0,
              por: `Amortización lineal de ${mesVenta - 1} meses del ejercicio ${anioVentaTxt}`,
            },
            {
              c: '281',
              d: 0,
              h: amortAnioVenta,
              por: 'Incremento de la amortización acumulada previa a la baja',
            },
          ],
        },
        {
          fecha: fVenta,
          concepto: 'Venta de la maquinaria por banco',
          lineas: lineasVenta,
        },
      ];

      const textoVR = conVR
        ? `con un valor residual estimado del 10 % (${Fmt.eur(vr)})`
        : 'sin valor residual';

      const enunciado =
        `${ctx.empresa} (IVA 21 %). ` +
        `1) ${fCompra}: adquiere una maquinaria por ${Fmt.eur(p)} más IVA, pagando por banco. Se amortiza linealmente durante ${n} años ${textoVR}. ` +
        `2) ${fVenta}: vende la maquinaria por banco en ${Fmt.eur(precioVenta)} más IVA. ` +
        `La amortización de los ejercicios anteriores al de la venta ya está contabilizada. Contabiliza la compra, la amortización del ejercicio ${anioVentaTxt} hasta la venta y la enajenación.`;

      return {
        id: '',
        tema: 'inmovilizado',
        nivel: 4,
        titulo: 'Amortización lineal y venta de inmovilizado',
        enunciado,
        inicial: null,
        asientos,
        calc: [
          { etiqueta: 'Cuota de amortización anual', valor: cuotaAnual },
          { etiqueta: 'Amortización acumulada total', valor: acumulada },
          { etiqueta: 'Valor neto contable (VNC)', valor: vnc },
          {
            etiqueta:
              resultado >= 0
                ? 'Beneficio de la venta'
                : 'Pérdida de la venta',
            valor: resultado,
          },
        ],
        nota: 'Antes de dar de baja el bien se dota la amortización devengada en el ejercicio de la venta. El resultado compara el precio sin IVA con el VNC (Coste − Amortización acumulada).',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'I2',
    tema: 'inmovilizado',
    nombre: 'Amortización degresiva y suma de dígitos',
    nivel: 3,
    hacer(rng, ctx): Ejercicio | null {
      const pareja = rng.pick([
        { n: 3, p: 60000 },
        { n: 4, p: 40000 },
        { n: 5, p: 45000 },
        { n: 8, p: 72000 },
      ]);

      const { n, p } = pareja;
      const coef = n < 5 ? 1.5 : n < 8 ? 2 : 2.5;
      const tasa = coef / n;

      const degCuota1 = ctx.r2(p * tasa);
      const degVnc1 = ctx.r2(p - degCuota1);
      const degCuota2 = ctx.r2(degVnc1 * tasa);
      const degVnc2 = ctx.r2(degVnc1 - degCuota2);

      const sigma = (n * (n + 1)) / 2;
      const digCuota1 = ctx.r2((p * n) / sigma);
      const digCuota2 = ctx.r2((p * (n - 1)) / sigma);
      const digVnc2 = ctx.r2(p - digCuota1 - digCuota2);

      const fCierre = ctx.fecha(31, 12);

      return {
        id: '',
        tema: 'inmovilizado',
        nivel: 3,
        titulo: 'Amortización degresiva y suma de dígitos',
        enunciado:
          `${conPuntoFinal(ctx.empresa)} 1) ${fCierre}: adquirió el 01/01/${ctx.anio} una maquinaria por ${Fmt.eur(p)} (sin valor residual) con una vida útil de ${n} años. ` +
          `Calcula las dos primeras cuotas anuales y el VNC al término del segundo año mediante el método degresivo sobre saldo pendiente (coeficiente ${String(coef).replace('.', ',')}) ` +
          `y mediante suma de dígitos decrecientes, y contabiliza la primera cuota degresiva.`,
        inicial: null,
        asientos: [
          {
            fecha: fCierre,
            concepto: 'Primera cuota anual por método degresivo',
            lineas: [
              {
                c: '681',
                d: degCuota1,
                h: 0,
                por: 'Gasto por amortización del primer ejercicio (método degresivo)',
              },
              {
                c: '281',
                d: 0,
                h: degCuota1,
                por: 'Amortización acumulada del inmovilizado material',
              },
            ],
          },
        ],
        calc: [
          { etiqueta: 'Degresiva · Cuota año 1', valor: degCuota1 },
          { etiqueta: 'Degresiva · Cuota año 2', valor: degCuota2 },
          { etiqueta: 'Degresiva · VNC tras año 2', valor: degVnc2 },
          { etiqueta: 'Suma de dígitos · Cuota año 1', valor: digCuota1 },
          { etiqueta: 'Suma de dígitos · Cuota año 2', valor: digCuota2 },
          { etiqueta: 'Suma de dígitos · VNC tras año 2', valor: digVnc2 },
        ],
        nota: 'En el método degresivo de porcentaje constante la tasa = coef / n se aplica cada año sobre el VNC. En suma de dígitos decrecientes se divide entre Σ = n(n+1)/2 multiplicando por n, n−1...',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'I3',
    tema: 'inmovilizado',
    nombre: 'Deterioro de valor del inmovilizado y reversión',
    nivel: 2,
    hacer(rng, ctx): Ejercicio | null {
      const deterioro = rng.pick([2000, 3000, 5000]);
      const reversion = rng.pick([1000, 2000]);

      if (reversion > deterioro) {
        return null;
      }

      const f1 = '31/12/20X5';
      const f2 = '31/12/20X6';

      return {
        id: '',
        tema: 'inmovilizado',
        nivel: 2,
        titulo: 'Deterioro de valor y reversión',
        enunciado:
          `${conPuntoFinal(ctx.empresa)} ` +
          `1) ${f1}: al cierre del ejercicio, el importe recuperable de una maquinaria es inferior a su VNC en ${Fmt.eur(deterioro)}, registrándose el oportuno deterioro reversible. ` +
          `2) ${f2}: las condiciones de mercado mejoran y se recupera parte del valor, correspondiendo revertir ${Fmt.eur(reversion)} del deterioro dotado.`,
        inicial: null,
        asientos: [
          {
            fecha: f1,
            concepto: 'Dotación de deterioro del inmovilizado material',
            lineas: [
              {
                c: '691',
                d: deterioro,
                h: 0,
                por: 'Pérdida por deterioro reversible (gasto)',
              },
              {
                c: '291',
                d: 0,
                h: deterioro,
                por: 'Corrección de valor del inmovilizado material (291)',
              },
            ],
          },
          {
            fecha: f2,
            concepto: 'Reversión parcial del deterioro',
            lineas: [
              {
                c: '291',
                d: reversion,
                h: 0,
                por: 'Reducción del deterioro acumulado',
              },
              {
                c: '791',
                d: 0,
                h: reversion,
                por: 'Ingreso por reversión del deterioro (791)',
              },
            ],
          },
        ],
        calc: [
          { etiqueta: 'Deterioro dotado (691)', valor: deterioro },
          { etiqueta: 'Reversión reconocida (791)', valor: reversion },
          {
            etiqueta: 'Saldo final de deterioro (291)',
            valor: ctx.r2(deterioro - reversion),
          },
        ],
        nota: 'La 291 es una cuenta correctora de Activo (sentido inverso): nace en el Haber al dotar la pérdida (691) y se carga al revertir con abono a la 791.',
        fuente: 'gen',
      };
    },
  },

  // =========================================================================
  // AJUSTES Y PERIODIFICACIONES
  // =========================================================================
  {
    id: 'J1',
    tema: 'ajustes',
    nombre: 'Periodificación de gastos anticipados',
    nivel: 2,
    hacer(rng, ctx): Ejercicio | null {
      const m = rng.entero(7, 11, 1);
      const a = rng.pick([2400, 3600, 4800, 6000, 12000]);
      const servicio = rng.pick([
        { c: '621', nombre: 'alquiler anual de una oficina', conIva: true },
        { c: '627', nombre: 'campaña anual de publicidad', conIva: true },
        { c: '625', nombre: 'póliza anual de seguro (exento de IVA)', conIva: false },
      ] as const);

      const anticipado = ctx.r2((a * (m - 1)) / 12);
      const devengado = ctx.r2(a - anticipado);
      const mesesConsumidos = 13 - m;

      const fPago = ctx.fecha(1, m);
      const fCierre = ctx.fecha(31, 12);

      const iva = servicio.conIva ? ctx.r2(a * 0.21) : 0;
      const totalPago = ctx.r2(a + iva);

      const asientoPago: Asiento = servicio.conIva
        ? {
            fecha: fPago,
            concepto: `Pago anual de ${servicio.nombre} con IVA`,
            lineas: [
              {
                c: servicio.c,
                d: a,
                h: 0,
                por: 'Registro inicial del gasto anual contratado',
              },
              {
                c: '472',
                d: iva,
                h: 0,
                por: 'IVA soportado al 21 %',
              },
              {
                c: '572',
                d: 0,
                h: totalPago,
                por: 'Pago íntegro por banco',
              },
            ],
          }
        : {
            fecha: fPago,
            concepto: 'Pago de prima de seguro anual exenta de IVA',
            lineas: [
              {
                c: servicio.c,
                d: a,
                h: 0,
                por: 'Prima anual de seguro (exenta de IVA)',
              },
              {
                c: '572',
                d: 0,
                h: a,
                por: 'Pago por cuenta bancaria',
              },
            ],
          };

      const asientoPeriodificacion: Asiento = {
        fecha: fCierre,
        concepto: 'Periodificación de gasto anticipado al cierre',
        lineas: [
          {
            c: '480',
            d: anticipado,
            h: 0,
            por: `Activo por los ${m - 1} meses que corresponden al ejercicio siguiente`,
          },
          {
            c: servicio.c,
            d: 0,
            h: anticipado,
            por: 'Minoración del gasto para imputar solo los meses devengados este año',
          },
        ],
      };

      const textoIva = servicio.conIva ? ' más 21 % de IVA' : '';

      return {
        id: '',
        tema: 'ajustes',
        nivel: 2,
        titulo: 'Gastos anticipados (480)',
        enunciado:
          `${ctx.empresa}${servicio.conIva ? ' (IVA 21 %)' : ''}. ` +
          `1) ${fPago}: paga por banco ${Fmt.eur(a)}${textoIva} por un ${servicio.nombre} que cubre exactamente 12 meses desde esta fecha. ` +
          `2) ${fCierre}: realiza el ajuste de periodificación al cierre del ejercicio.`,
        inicial: null,
        asientos: [asientoPago, asientoPeriodificacion],
        calc: [
          { etiqueta: 'Meses devengados en el ejercicio', valor: mesesConsumidos },
          { etiqueta: 'Gasto imputable al ejercicio', valor: devengado },
          { etiqueta: 'Gasto anticipado (480)', valor: anticipado },
        ],
        nota: 'En virtud del principio de devengo, la parte de gasto pagada por anticipado correspondiente al año siguiente (m − 1 meses) se traspasa al activo en la 480.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'J2',
    tema: 'ajustes',
    nombre: 'Periodificación de ingresos anticipados',
    nivel: 2,
    hacer(rng, ctx): Ejercicio | null {
      const m = rng.entero(9, 12, 1);
      const a = rng.pick([3000, 6000, 9000]);

      const mesesActual = 13 - m;
      const mesesSiguiente = 6 - mesesActual;
      const anticipado = ctx.r2((a * mesesSiguiente) / 6);
      const devengado = ctx.r2(a - anticipado);

      if (anticipado <= 0) {
        return null;
      }

      const iva = ctx.r2(a * 0.21);
      const total = ctx.r2(a + iva);
      const fCobro = ctx.fecha(1, m);
      const fCierre = ctx.fecha(31, 12);

      return {
        id: '',
        tema: 'ajustes',
        nivel: 2,
        titulo: 'Ingresos anticipados (485)',
        enunciado:
          `${ctx.empresa} (IVA 21 %). ` +
          `1) ${fCobro}: cobra por adelantado mediante transferencia bancaria ${Fmt.eur(a)} más IVA por el alquiler semestral (6 meses desde esta fecha) de una nave de su propiedad. ` +
          `2) ${fCierre}: realiza el ajuste de periodificación correspondiente al cierre.`,
        inicial: null,
        asientos: [
          {
            fecha: fCobro,
            concepto: 'Cobro anticipado de 6 meses de arrendamiento',
            lineas: [
              {
                c: '572',
                d: total,
                h: 0,
                por: 'Entrada en banco del alquiler semestral más IVA',
              },
              {
                c: '752',
                d: 0,
                h: a,
                por: 'Ingreso inicial por arrendamientos',
              },
              {
                c: '477',
                d: 0,
                h: iva,
                por: 'IVA repercutido al 21 %',
              },
            ],
          },
          {
            fecha: fCierre,
            concepto: 'Periodificación del ingreso anticipado al cierre',
            lineas: [
              {
                c: '752',
                d: anticipado,
                h: 0,
                por: `Ajuste del ingreso por los ${mesesSiguiente} meses del ejercicio siguiente`,
              },
              {
                c: '485',
                d: 0,
                h: anticipado,
                por: 'Pasivo por ingresos anticipados',
              },
            ],
          },
        ],
        calc: [
          { etiqueta: 'Meses devengados en el ejercicio', valor: mesesActual },
          { etiqueta: 'Ingreso imputable al ejercicio', valor: devengado },
          { etiqueta: 'Ingreso anticipado (485)', valor: anticipado },
        ],
        nota: 'Los cobros anticipados de servicios que se prestarán el año siguiente se periodifican cargando la 752 y abonando Ingresos anticipados (485).',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'J3',
    tema: 'ajustes',
    nombre: 'Provisiones por litigios o impuestos y reclasificación',
    nivel: 3,
    hacer(rng, ctx): Ejercicio | null {
      const importe = rng.pick([20000, 30000, 50000]);
      const esFiscal = rng.next() < 0.5;
      const cuentaLP = esFiscal ? '141' : '142';
      const motivo = esFiscal
        ? 'una inspección y reclamación fiscal de Hacienda que la empresa estima probable perder dentro de unos 18 meses'
        : 'un litigio judicial con un proveedor cuya resolución se estima en unos 18 meses';

      const f1 = '31/12/20X5';
      const f2 = '31/12/20X6';
      const f3 = '15/06/20X7';

      return {
        id: '',
        tema: 'ajustes',
        nivel: 3,
        titulo: 'Provisiones: dotación, reclasificación y pago',
        enunciado:
          `${conPuntoFinal(ctx.empresa)} ` +
          `1) ${f1}: dota una provisión de ${Fmt.eur(importe)} por ${motivo}. ` +
          `2) ${f2}: un año después, al quedar el vencimiento previsto dentro de los próximos 12 meses, reclasifica la provisión a corto plazo. ` +
          `3) ${f3}: dicta sentencia firme por el importe exacto provisionado y la empresa paga por banco.`,
        inicial: null,
        asientos: [
          {
            fecha: f1,
            concepto: 'Dotación de la provisión a largo plazo',
            lineas: [
              {
                c: '678',
                d: importe,
                h: 0,
                por: 'Gasto excepcional por el importe estimado de la contingencia',
              },
              {
                c: cuentaLP,
                d: 0,
                h: importe,
                por: esFiscal
                  ? 'Provisión para impuestos a largo plazo (141)'
                  : 'Provisión para otras responsabilidades a largo plazo (142)',
              },
            ],
          },
          {
            fecha: f2,
            concepto: 'Reclasificación de la provisión a corto plazo',
            lineas: [
              {
                c: cuentaLP,
                d: importe,
                h: 0,
                por: 'Baja de la provisión a largo plazo',
              },
              {
                c: '529',
                d: 0,
                h: importe,
                por: 'Traspaso a provisiones a corto plazo (529)',
              },
            ],
          },
          {
            fecha: f3,
            concepto: 'Aplicación y pago de la provisión',
            lineas: [
              {
                c: '529',
                d: importe,
                h: 0,
                por: 'Cancelación de la provisión al producirse la resolución',
              },
              {
                c: '572',
                d: 0,
                h: importe,
                por: 'Pago definitivo mediante transferencia bancaria',
              },
            ],
          },
        ],
        calc: [
          { etiqueta: `Provisión inicial (${cuentaLP})`, valor: importe },
          { etiqueta: 'Reclasificación a c/p (529)', valor: importe },
          { etiqueta: 'Pago final por banco (572)', valor: importe },
        ],
        nota: 'Las provisiones por impuestos usan la 141 y las de litigios la 142. Al quedar a menos de un año se reclasifican a la 529 y se cancelan contra 572 al pagar. Criterio de manual: también puede usarse otra cuenta de gasto según el origen; sigue el criterio de tu profesor.',
        fuente: 'gen',
      };
    },
  },
];
