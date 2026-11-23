import { Fmt } from '../fmt';
import { conPuntoFinal, type Plantilla } from '../gen';
import { Masas } from '../masas';
import type { Asiento, Ejercicio } from '../types';

export const PLANTILLAS_3: Plantilla[] = [
  // =========================================================================
  // EXISTENCIAS (método especulativo)
  // =========================================================================
  {
    id: 'X1',
    tema: 'existencias',
    nombre: 'Existencias por método FIFO y deterioro',
    nivel: 3,
    hacer(rng, ctx): Ejercicio | null {
      const u0 = rng.pick([10, 20, 30]);
      const p0 = rng.entero(50, 100, 10);
      const u1 = rng.pick([10, 20, 30]);
      const p1 = p0 + rng.pick([10, 20]);
      const v = rng.entero(10, u0 + u1 - 10, 10);
      const d0 = rng.pick([0, 150, 300]);

      const iniciales = ctx.r2(u0 * p0);
      let costeVentas = 0;
      let finales = 0;

      if (v <= u0) {
        costeVentas = ctx.r2(v * p0);
        finales = ctx.r2((u0 - v) * p0 + u1 * p1);
      } else {
        costeVentas = ctx.r2(u0 * p0 + (v - u0) * p1);
        finales = ctx.r2((u0 + u1 - v) * p1);
      }

      const deltaMercado = rng.pick([-300, -100, 0, 200]);
      const mercado = ctx.r2(finales + deltaMercado);
      if (mercado <= 0) {
        return null;
      }

      const deterioroFinal = mercado < finales ? ctx.r2(finales - mercado) : 0;
      const fCierre = ctx.fecha(31, 12);
      const asientos: Asiento[] = [];

      if (d0 > 0) {
        asientos.push({
          fecha: fCierre,
          concepto: 'Reversión del deterioro inicial de existencias',
          lineas: [
            {
              c: '390',
              d: d0,
              h: 0,
              por: 'Baja del deterioro contabilizado al inicio del ejercicio',
            },
            {
              c: '793',
              d: 0,
              h: d0,
              por: 'Ingreso por reversión del deterioro de mercaderías',
            },
          ],
        });
      }

      asientos.push({
        fecha: fCierre,
        concepto: 'Baja de las existencias iniciales',
        lineas: [
          {
            c: '610',
            d: iniciales,
            h: 0,
            por: 'Variación de existencias (cargo por las existencias iniciales)',
          },
          {
            c: '300',
            d: 0,
            h: iniciales,
            por: 'Cierre de las mercaderías iniciales',
          },
        ],
      });

      asientos.push({
        fecha: fCierre,
        concepto: 'Alta de las existencias finales (FIFO)',
        lineas: [
          {
            c: '300',
            d: finales,
            h: 0,
            por: 'Valoración FIFO de las mercaderías en almacén al cierre',
          },
          {
            c: '610',
            d: 0,
            h: finales,
            por: 'Variación de existencias (abono por las existencias finales)',
          },
        ],
      });

      if (deterioroFinal > 0) {
        asientos.push({
          fecha: fCierre,
          concepto: 'Dotación del deterioro de existencias al cierre',
          lineas: [
            {
              c: '693',
              d: deterioroFinal,
              h: 0,
              por: 'Pérdida por deterioro (valor neto realizable < coste)',
            },
            {
              c: '390',
              d: 0,
              h: deterioroFinal,
              por: 'Corrección valorativa de las mercaderías finales',
            },
          ],
        });
      }

      const textoD0 =
        d0 > 0
          ? ` con un deterioro de valor acumulado inicial de ${Fmt.eur(d0)}`
          : ' sin deterioro inicial';

      const enunciado =
        `${conPuntoFinal(ctx.empresa)} Existencias de mercaderías valoradas por FIFO (método especulativo). ` +
        `${conPuntoFinal(`Al inicio del ejercicio ${ctx.anio} hay ${u0} unidades a ${Fmt.eur(p0)}/ud.${textoD0}`)} ` +
        `Durante el año se compran ${u1} unidades a ${Fmt.eur(p1)}/ud. y se venden ${v} unidades. ` +
        `1) ${fCierre}: al cierre, el valor neto realizable (mercado) del stock final es de ${Fmt.eur(mercado)}. ` +
        `Calcula las existencias finales, el coste de ventas y el deterioro al cierre, y realiza los asientos de regularización.`;

      return {
        id: '',
        tema: 'existencias',
        nivel: 3,
        titulo: 'Existencias por FIFO y deterioro',
        enunciado,
        inicial:
          d0 > 0
            ? [
                { c: '300', d: iniciales, h: 0 },
                { c: '390', d: 0, h: d0 },
              ]
            : [{ c: '300', d: iniciales, h: 0 }],
        asientos,
        calc: [
          { etiqueta: 'Existencias finales (FIFO)', valor: finales },
          { etiqueta: 'Coste de ventas', valor: costeVentas },
          { etiqueta: 'Deterioro de valor al cierre', valor: deterioroFinal },
        ],
        nota: 'En FIFO salen primero las unidades más antiguas. Al cierre se revierte el deterioro inicial (390 a 793), se regularizan existencias (610/300) y se dota el nuevo deterioro si el mercado es menor que el coste.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'X2',
    tema: 'existencias',
    nombre: 'Existencias por PMP y comparación LIFO',
    nivel: 3,
    hacer(rng, ctx): Ejercicio | null {
      const u = rng.pick([20, 30, 40]);
      const p0 = rng.pick([40, 50, 60]);
      const p1 = p0 + rng.pick([10, 20]);
      const v = rng.entero(10, 2 * u - 10, 10);
      const d0 = rng.pick([0, 150, 300]);

      const pmp = ctx.r2((p0 + p1) / 2);
      const iniciales = ctx.r2(u * p0);
      const finalesPMP = ctx.r2((2 * u - v) * pmp);

      const finalesLIFO =
        v <= u
          ? ctx.r2(u * p0 + (u - v) * p1)
          : ctx.r2((2 * u - v) * p0);

      const mercado = ctx.r2(finalesPMP + rng.pick([-200, 0, 200]));
      if (mercado <= 0) {
        return null;
      }
      const deterioroFinal =
        mercado < finalesPMP ? ctx.r2(finalesPMP - mercado) : 0;

      const fCierre = ctx.fecha(31, 12);
      const asientos: Asiento[] = [];

      if (d0 > 0) {
        asientos.push({
          fecha: fCierre,
          concepto: 'Reversión del deterioro inicial de mercaderías',
          lineas: [
            {
              c: '390',
              d: d0,
              h: 0,
              por: 'Cancelación del deterioro inicial',
            },
            {
              c: '793',
              d: 0,
              h: d0,
              por: 'Reversión del deterioro de existencias',
            },
          ],
        });
      }

      asientos.push(
        {
          fecha: fCierre,
          concepto: 'Baja de existencias iniciales',
          lineas: [
            {
              c: '610',
              d: iniciales,
              h: 0,
              por: 'Variación de existencias por las unidades iniciales',
            },
            {
              c: '300',
              d: 0,
              h: iniciales,
              por: 'Baja de mercaderías iniciales',
            },
          ],
        },
        {
          fecha: fCierre,
          concepto: 'Alta de existencias finales (PMP)',
          lineas: [
            {
              c: '300',
              d: finalesPMP,
              h: 0,
              por: 'Mercaderías finales valoradas a Precio Medio Ponderado',
            },
            {
              c: '610',
              d: 0,
              h: finalesPMP,
              por: 'Variación de existencias por el inventario final',
            },
          ],
        }
      );

      if (deterioroFinal > 0) {
        asientos.push({
          fecha: fCierre,
          concepto: 'Dotación de deterioro al cierre',
          lineas: [
            {
              c: '693',
              d: deterioroFinal,
              h: 0,
              por: 'Pérdida por deterioro de existencias',
            },
            {
              c: '390',
              d: 0,
              h: deterioroFinal,
              por: 'Deterioro de valor de las mercaderías',
            },
          ],
        });
      }

      const textoD0 =
        d0 > 0
          ? ` (deterioro inicial de ${Fmt.eur(d0)})`
          : '';

      const enunciado =
        `${conPuntoFinal(ctx.empresa)} ${conPuntoFinal(`Al inicio del ejercicio ${ctx.anio} tiene ${u} uds. de mercaderías a ${Fmt.eur(p0)}/ud.${textoD0}`)} ` +
        `Compra posteriormente otras ${u} uds. a ${Fmt.eur(p1)}/ud. y vende ${v} uds. durante el año. ` +
        `1) ${fCierre}: realiza los asientos de regularización por PMP sabiendo que el valor de mercado final es de ${Fmt.eur(mercado)}, y calcula además el valor de las existencias finales si se aplicara LIFO (solo a efectos teóricos de examen).`;

      return {
        id: '',
        tema: 'existencias',
        nivel: 3,
        titulo: 'Existencias por PMP y cálculo LIFO',
        enunciado,
        inicial:
          d0 > 0
            ? [
                { c: '300', d: iniciales, h: 0 },
                { c: '390', d: 0, h: d0 },
              ]
            : [{ c: '300', d: iniciales, h: 0 }],
        asientos,
        calc: [
          { etiqueta: 'Precio medio ponderado (PMP)', valor: pmp },
          { etiqueta: 'Existencias finales (PMP)', valor: finalesPMP },
          { etiqueta: 'Existencias finales por LIFO (solo examen)', valor: finalesLIFO },
        ],
        nota: 'El PGC admite PMP y FIFO (no LIFO). En LIFO (solo examen) salen primero las últimas compras realizadas.',
        fuente: 'gen',
      };
    },
  },

  // =========================================================================
  // CLIENTES DUDOSOS Y PROVISIONES
  // =========================================================================
  {
    id: 'D1',
    tema: 'dudosos',
    nombre: 'Cliente de dudoso cobro e insolvencia definitiva',
    nivel: 2,
    hacer(rng, ctx): Ejercicio | null {
      const base = rng.pick([5000, 10000, 20000]);
      const total = ctx.r2(base * 1.21);
      const pctDet = rng.pick([25, 40, 50, 60]);
      const deterioro = ctx.r2((total * pctDet) / 100);
      const incobrable = ctx.r2(total - deterioro);

      const f1 = ctx.fecha(14, 5);
      const f2 = ctx.fecha(20, 11);

      const asientos: Asiento[] = [
        {
          fecha: f1,
          concepto: 'Reclasificación del cliente como dudoso cobro',
          lineas: [
            {
              c: '436',
              d: total,
              h: 0,
              por: 'Traspaso del saldo total con IVA a clientes de dudoso cobro',
            },
            {
              c: '430',
              d: 0,
              h: total,
              por: 'Baja en la cuenta ordinaria de clientes',
            },
          ],
        },
        {
          fecha: f1,
          concepto: 'Dotación del deterioro de valor estimado',
          lineas: [
            {
              c: '694',
              d: deterioro,
              h: 0,
              por: `Pérdida por deterioro estimada en el ${pctDet} % del crédito`,
            },
            {
              c: '490',
              d: 0,
              h: deterioro,
              por: 'Deterioro de valor de créditos por operaciones comerciales',
            },
          ],
        },
        {
          fecha: f2,
          concepto: 'Insolvencia definitiva del cliente dudoso',
          lineas: [
            {
              c: '490',
              d: deterioro,
              h: 0,
              por: 'Aplicación del deterioro previamente dotado',
            },
            {
              c: '650',
              d: incobrable,
              h: 0,
              por: 'Pérdida definitiva por la parte no cubierta con deterioro',
            },
            {
              c: '436',
              d: 0,
              h: total,
              por: 'Baja definitiva del cliente de dudoso cobro',
            },
          ],
        },
      ];

      const enunciado =
        `${ctx.empresa} (IVA 21 %). Tiene registrado un derecho de cobro sobre un cliente procedente de una venta de base imponible ${Fmt.eur(base)} (total factura ${Fmt.eur(total)}). ` +
        `1) ${f1}: ante indicios de impago, califica el crédito como de dudoso cobro y dota un deterioro por el ${pctDet} % de su importe total. ` +
        `2) ${f2}: se declara la insolvencia firme e incobrable del cliente por la totalidad de la deuda.`;

      return {
        id: '',
        tema: 'dudosos',
        nivel: 2,
        titulo: 'Clientes dudosos e insolvencia firme',
        enunciado,
        inicial: [{ c: '430', d: total, h: 0 }],
        asientos,
        calc: [
          { etiqueta: 'Crédito total con IVA (436)', valor: total },
          { etiqueta: 'Deterioro dotado (490)', valor: deterioro },
          { etiqueta: 'Pérdida incobrable adicional (650)', valor: incobrable },
        ],
        nota: 'En el método individualizado se reclasifica el total (con IVA) a la 436 y se dota el deterioro (694 a 490). Al resultar incobrable se aplica la 490 y la diferencia va a la 650. Simplificación: no se recupera el IVA del crédito incobrable.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'D2',
    tema: 'dudosos',
    nombre: 'Ajuste global del deterioro de créditos comerciales',
    nivel: 3,
    hacer(rng, ctx): Ejercicio | null {
      const saldoInicial490 = rng.pick([3000, 6000]);
      const dudosos1 = rng.pick([20000, 30250]);
      const dudosos2 = rng.pick([10000, 25000]);

      const necesario1 = ctx.r2(dudosos1 * 0.3);
      const ajuste1 = ctx.r2(necesario1 - saldoInicial490);
      const necesario2 = ctx.r2(dudosos2 * 0.3);
      const ajuste2 = ctx.r2(necesario2 - necesario1);

      const f1 = '31/12/20X5';
      const f2 = '31/12/20X6';
      const asientos: Asiento[] = [];

      if (Math.abs(ajuste1) > 0.01) {
        asientos.push(
          ajuste1 > 0
            ? {
                fecha: f1,
                concepto: 'Ajuste al alza del deterioro de créditos (año 1)',
                lineas: [
                  {
                    c: '694',
                    d: ajuste1,
                    h: 0,
                    por: 'Dotación adicional hasta cubrir el 30 % de los dudosos',
                  },
                  {
                    c: '490',
                    d: 0,
                    h: ajuste1,
                    por: 'Incremento del deterioro acumulado',
                  },
                ],
              }
            : {
                fecha: f1,
                concepto: 'Ajuste a la baja del deterioro de créditos (año 1)',
                lineas: [
                  {
                    c: '490',
                    d: Math.abs(ajuste1),
                    h: 0,
                    por: 'Reducción del deterioro sobrante',
                  },
                  {
                    c: '794',
                    d: 0,
                    h: Math.abs(ajuste1),
                    por: 'Reversión del deterioro de créditos comerciales',
                  },
                ],
              }
        );
      }

      if (Math.abs(ajuste2) > 0.01) {
        asientos.push(
          ajuste2 > 0
            ? {
                fecha: f2,
                concepto: 'Ajuste al alza del deterioro de créditos (año 2)',
                lineas: [
                  {
                    c: '694',
                    d: ajuste2,
                    h: 0,
                    por: 'Dotación complementaria al cierre del segundo año',
                  },
                  {
                    c: '490',
                    d: 0,
                    h: ajuste2,
                    por: 'Incremento de la 490 hasta el saldo necesario',
                  },
                ],
              }
            : {
                fecha: f2,
                concepto: 'Reversión del exceso de deterioro (año 2)',
                lineas: [
                  {
                    c: '490',
                    d: Math.abs(ajuste2),
                    h: 0,
                    por: 'Disminución del deterioro acumulado',
                  },
                  {
                    c: '794',
                    d: 0,
                    h: Math.abs(ajuste2),
                    por: 'Reversión del deterioro de créditos comerciales (794)',
                  },
                ],
              }
        );
      }

      if (asientos.length === 0) {
        return null;
      }

      const enunciado =
        `${conPuntoFinal(ctx.empresa)} Estima la insolvencia de sus créditos comerciales al 30 % sobre el saldo de clientes dudosos al cierre (método de ajuste por diferencia). ` +
        `Parte con un saldo previo de deterioro de ${Fmt.eur(saldoInicial490)}. ` +
        `1) ${f1}: el saldo de clientes dudosos asciende a ${Fmt.eur(dudosos1)}. ` +
        `2) ${f2}: un año después, el saldo de clientes dudosos es de ${Fmt.eur(dudosos2)}. ` +
        `Contabiliza únicamente los ajustes necesarios (sin apuntes si el ajuste es nulo).`;

      return {
        id: '',
        tema: 'dudosos',
        nivel: 3,
        titulo: 'Ajuste del deterioro por estimación global',
        enunciado,
        inicial: [{ c: '490', d: 0, h: saldoInicial490 }],
        asientos,
        calc: [
          { etiqueta: 'Deterioro necesario año 1 (30 %)', valor: necesario1 },
          { etiqueta: 'Ajuste año 1', valor: ajuste1 },
          { etiqueta: 'Deterioro necesario año 2 (30 %)', valor: necesario2 },
          { etiqueta: 'Ajuste año 2', valor: ajuste2 },
        ],
        nota: 'Ajuste = deterioro necesario − saldo previo de 490. Si es positivo se dota (694 a 490); si es negativo se revierte (490 a 794); si es 0 no se hace asiento.',
        fuente: 'gen',
      };
    },
  },

  // =========================================================================
  // CIERRE Y CUENTAS ANUALES
  // =========================================================================
  {
    id: 'Z1',
    tema: 'cierre',
    nombre: 'Regularización contable y cierre con beneficio',
    nivel: 3,
    hacer(rng, ctx): Ejercicio | null {
      const c600 = rng.entero(16000, 32000, 1000);
      const c610 = rng.entero(1000, 4000, 1000);
      const c640 = rng.entero(12000, 22000, 1000);
      const c642 = rng.entero(3600, 6800, 400);
      const c621 = rng.entero(2000, 6000, 1000);
      const c681 = rng.entero(2000, 6000, 1000);
      const c662 = rng.entero(800, 2400, 400);

      const c700 = rng.entero(56000, 96000, 1000);
      const c760 = rng.entero(1000, 4000, 1000);

      const gastosPre = ctx.r2(c600 + c610 + c640 + c642 + c621 + c681 + c662);
      const ingresos = ctx.r2(c700 + c760);
      const bai = ctx.r2(ingresos - gastosPre);

      if (bai <= 0) {
        return null;
      }

      const impuesto = ctx.r2(bai * 0.25);
      const beneficioNeto = ctx.r2(bai - impuesto);
      const totalGastos = ctx.r2(gastosPre + impuesto);

      const fCierre = '31/12/20X6';
      const fApertura = '01/01/20X7';

      const asientos: Asiento[] = [
        {
          fecha: fCierre,
          concepto: 'Devengo del impuesto sobre beneficios (25 %)',
          lineas: [
            {
              c: '630',
              d: impuesto,
              h: 0,
              por: 'Gasto por impuesto corriente (25 % del BAI)',
            },
            {
              c: '4752',
              d: 0,
              h: impuesto,
              por: 'Hacienda Pública, acreedora por impuesto sobre sociedades',
            },
          ],
        },
        {
          fecha: fCierre,
          concepto: 'Regularización de gastos contra Resultado del ejercicio',
          lineas: [
            {
              c: '129',
              d: totalGastos,
              h: 0,
              por: 'Suma de todos los gastos del ejercicio (incluido el 630)',
            },
            { c: '600', d: 0, h: c600 },
            { c: '610', d: 0, h: c610 },
            { c: '621', d: 0, h: c621 },
            { c: '630', d: 0, h: impuesto },
            { c: '640', d: 0, h: c640 },
            { c: '642', d: 0, h: c642 },
            { c: '662', d: 0, h: c662 },
            { c: '681', d: 0, h: c681 },
          ],
        },
        {
          fecha: fCierre,
          concepto: 'Regularización de ingresos contra Resultado del ejercicio',
          lineas: [
            { c: '700', d: c700, h: 0 },
            { c: '760', d: c760, h: 0 },
            {
              c: '129',
              d: 0,
              h: ingresos,
              por: 'Suma de los ingresos del ejercicio',
            },
          ],
        },
        {
          fecha: fApertura,
          concepto: 'Aplicación del resultado: beneficio a 120',
          lineas: [
            {
              c: '129',
              d: beneficioNeto,
              h: 0,
              por: 'Saldado del resultado positivo del ejercicio anterior',
            },
            {
              c: '120',
              d: 0,
              h: beneficioNeto,
              por: 'Remanente pendiente de aplicación',
            },
          ],
        },
      ];

      const enunciado =
        `${conPuntoFinal(ctx.empresa)} A ${fCierre}, antes del impuesto sobre beneficios (25 %), presenta los siguientes saldos de gestión: ` +
        `Compras de mercaderías ${Fmt.eur(c600)}, Variación de existencias (saldo deudor) ${Fmt.eur(c610)}, ` +
        `Arrendamientos ${Fmt.eur(c621)}, Sueldos y salarios ${Fmt.eur(c640)}, Seguridad Social de la empresa ${Fmt.eur(c642)}, ` +
        `Amortización del inmovilizado material ${Fmt.eur(c681)}, Intereses de deudas ${Fmt.eur(c662)}, ` +
        `Ventas de mercaderías ${Fmt.eur(c700)} e Ingresos por dividendos ${Fmt.eur(c760)}. ` +
        `Contabiliza el impuesto del 25 %, la regularización de pérdidas y ganancias al cierre y la aplicación del resultado a remanente el ${fApertura}.`;

      return {
        id: '',
        tema: 'cierre',
        nivel: 3,
        titulo: 'Regularización y cierre con beneficio',
        enunciado,
        inicial: [
          { c: '600', d: c600, h: 0 },
          { c: '610', d: c610, h: 0 },
          { c: '621', d: c621, h: 0 },
          { c: '640', d: c640, h: 0 },
          { c: '642', d: c642, h: 0 },
          { c: '662', d: c662, h: 0 },
          { c: '681', d: c681, h: 0 },
          { c: '700', d: 0, h: c700 },
          { c: '760', d: 0, h: c760 },
        ],
        asientos,
        calc: [
          { etiqueta: 'Beneficio antes de impuestos', valor: bai },
          { etiqueta: 'Impuesto sobre beneficios (25 %)', valor: impuesto },
          { etiqueta: 'Beneficio neto (129)', valor: beneficioNeto },
        ],
        nota: 'Con beneficio antes de impuestos positivo se devenga el 25 % en la 630 contra 4752 y se saldan todos los gastos (incluido 630) e ingresos contra la 129. Tras el asiento de apertura del ejercicio siguiente (que reabre los saldos del cierre, con la 129 incluida), el asiento de aplicación del resultado traspasa el beneficio de 129 a 120 (o a reservas) o la pérdida de 121 a 129.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'Z2',
    tema: 'cierre',
    nombre: 'Regularización contable y cierre con pérdidas',
    nivel: 3,
    hacer(rng, ctx): Ejercicio | null {
      const c600 = rng.entero(24000, 42000, 1000);
      const c610 = rng.entero(2000, 5000, 1000);
      const c640 = rng.entero(18000, 30000, 1000);
      const c642 = rng.entero(5000, 9000, 500);
      const c621 = rng.entero(3000, 8000, 1000);
      const c681 = rng.entero(3000, 7000, 1000);
      const c662 = rng.entero(1000, 3000, 500);

      const c700 = rng.entero(32000, 58000, 1000);
      const c760 = rng.entero(500, 2000, 500);

      const totalGastos = ctx.r2(c600 + c610 + c640 + c642 + c621 + c681 + c662);
      const totalIngresos = ctx.r2(c700 + c760);

      if (totalIngresos >= totalGastos) {
        return null;
      }

      const perdida = ctx.r2(totalGastos - totalIngresos);
      const fCierre = '31/12/20X6';
      const fApertura = '01/01/20X7';

      const asientos: Asiento[] = [
        {
          fecha: fCierre,
          concepto: 'Regularización de gastos contra Resultado del ejercicio',
          lineas: [
            {
              c: '129',
              d: totalGastos,
              h: 0,
              por: 'Traspaso de todos los gastos del ejercicio al Debe de la 129',
            },
            { c: '600', d: 0, h: c600 },
            { c: '610', d: 0, h: c610 },
            { c: '621', d: 0, h: c621 },
            { c: '640', d: 0, h: c640 },
            { c: '642', d: 0, h: c642 },
            { c: '662', d: 0, h: c662 },
            { c: '681', d: 0, h: c681 },
          ],
        },
        {
          fecha: fCierre,
          concepto: 'Regularización de ingresos contra Resultado del ejercicio',
          lineas: [
            { c: '700', d: c700, h: 0 },
            { c: '760', d: c760, h: 0 },
            {
              c: '129',
              d: 0,
              h: totalIngresos,
              por: 'Traspaso de todos los ingresos del ejercicio al Haber de la 129',
            },
          ],
        },
        {
          fecha: fApertura,
          concepto: 'Aplicación del resultado: pérdida a 121',
          lineas: [
            {
              c: '121',
              d: perdida,
              h: 0,
              por: 'Resultados negativos de ejercicios anteriores (sentido inverso PN)',
            },
            {
              c: '129',
              d: 0,
              h: perdida,
              por: 'Cierre de la cuenta 129 con saldo deudor',
            },
          ],
        },
      ];

      const enunciado =
        `${conPuntoFinal(ctx.empresa)} A ${fCierre} presenta los siguientes saldos de gestión: ` +
        `Compras de mercaderías ${Fmt.eur(c600)}, Variación de existencias (saldo deudor) ${Fmt.eur(c610)}, ` +
        `Arrendamientos ${Fmt.eur(c621)}, Sueldos y salarios ${Fmt.eur(c640)}, Seguridad Social de la empresa ${Fmt.eur(c642)}, ` +
        `Amortización del inmovilizado material ${Fmt.eur(c681)}, Intereses de deudas ${Fmt.eur(c662)}, ` +
        `Ventas de mercaderías ${Fmt.eur(c700)} e Ingresos por dividendos ${Fmt.eur(c760)}. ` +
        `Realiza la regularización al cierre y el asiento de aplicación del resultado el ${fApertura}.`;

      return {
        id: '',
        tema: 'cierre',
        nivel: 3,
        titulo: 'Regularización y cierre con pérdidas',
        enunciado,
        inicial: [
          { c: '600', d: c600, h: 0 },
          { c: '610', d: c610, h: 0 },
          { c: '621', d: c621, h: 0 },
          { c: '640', d: c640, h: 0 },
          { c: '642', d: c642, h: 0 },
          { c: '662', d: c662, h: 0 },
          { c: '681', d: c681, h: 0 },
          { c: '700', d: 0, h: c700 },
          { c: '760', d: 0, h: c760 },
        ],
        asientos,
        calc: [
          { etiqueta: 'Total ingresos', valor: totalIngresos },
          { etiqueta: 'Total gastos', valor: totalGastos },
          { etiqueta: 'Pérdida del ejercicio (121)', valor: perdida },
        ],
        nota: 'Cuando los gastos superan a los ingresos no se devenga impuesto sobre beneficios y la 129 queda con saldo deudor. Tras el asiento de apertura del ejercicio siguiente (que reabre los saldos del cierre, con la 129 incluida), el asiento de aplicación del resultado traspasa el beneficio de 129 a 120 (o a reservas) o la pérdida de 121 a 129.',
        fuente: 'gen',
      };
    },
  },

  {
    id: 'Z3',
    tema: 'cierre',
    nombre: 'Cuenta de PyG y Balance de situación',
    nivel: 5,
    hacer(rng, ctx): Ejercicio | null {
      const c213 = rng.entero(40000, 80000, 2000);
      const c281 = rng.entero(8000, 24000, 2000);
      const c300 = rng.entero(6000, 18000, 1000);
      const c430 = rng.entero(8000, 22000, 1000);
      const c572 = rng.entero(15000, 35000, 1000);

      const c400 = rng.entero(6000, 18000, 1000);
      const c170 = rng.entero(10000, 28000, 2000);
      const c520 = rng.entero(3000, 8000, 1000);
      const c100 = rng.entero(25000, 50000, 5000);

      const c600 = rng.entero(18000, 34000, 1000);
      const c610 = rng.entero(1000, 4000, 1000);
      const c640 = rng.entero(14000, 24000, 1000);
      const c642 = rng.entero(4000, 7200, 400);
      const c621 = rng.entero(2000, 6000, 1000);
      const c681 = rng.entero(2000, 6000, 1000);
      const c662 = rng.entero(800, 2400, 400);
      const c700 = rng.entero(62000, 98000, 1000);

      if (c281 >= c213) {
        return null;
      }

      const gastosPre = ctx.r2(c600 + c610 + c640 + c642 + c621 + c681 + c662);
      const bai = ctx.r2(c700 - gastosPre);
      if (bai <= 0) {
        return null;
      }

      const totalDebePre = ctx.r2(c213 + c300 + c430 + c572 + gastosPre);
      const totalHaberSin113 = ctx.r2(c281 + c400 + c170 + c520 + c100 + c700);
      const c113 = ctx.r2(totalDebePre - totalHaberSin113);
      if (c113 <= 0) {
        return null;
      }

      const impuesto = ctx.r2(bai * 0.25);
      const fCierre = '31/12/20X6';

      const asientoImpuesto: Asiento = {
        fecha: fCierre,
        concepto: 'Impuesto sobre beneficios del ejercicio (25 %)',
        lineas: [
          {
            c: '630',
            d: impuesto,
            h: 0,
            por: 'Impuesto sobre beneficios (25 % del resultado antes de impuestos)',
          },
          {
            c: '4752',
            d: 0,
            h: impuesto,
            por: 'Deuda fiscal por impuesto sobre sociedades',
          },
        ],
      };

      const saldosPre: Record<string, number> = {
        '213': c213,
        '281': -c281,
        '300': c300,
        '430': c430,
        '572': c572,
        '400': -c400,
        '170': -c170,
        '520': -c520,
        '100': -c100,
        '113': -c113,
        '600': c600,
        '610': c610,
        '640': c640,
        '642': c642,
        '621': c621,
        '681': c681,
        '662': c662,
        '700': -c700,
        '630': impuesto,
        '4752': -impuesto,
      };

      const pyg = Masas.pyg(saldosPre);
      const bal = Masas.balance(saldosPre);

      if (Math.abs(bal.activo - (bal.pn + bal.pnc + bal.pc)) > 0.01) {
        return null;
      }

      const enunciado =
        `${conPuntoFinal(ctx.empresa)} A ${fCierre} (antes del impuesto sobre beneficios del 25 %) presenta los siguientes saldos: ` +
        `Maquinaria ${Fmt.eur(c213)}, Amortización acumulada (281) ${Fmt.eur(c281)}, Mercaderías ${Fmt.eur(c300)}, ` +
        `Clientes ${Fmt.eur(c430)}, Bancos ${Fmt.eur(c572)}, Proveedores ${Fmt.eur(c400)}, Deudas l/p entidades de crédito ${Fmt.eur(c170)}, ` +
        `Deudas c/p entidades de crédito ${Fmt.eur(c520)}, Capital social ${Fmt.eur(c100)}, Reservas voluntarias (cifra de cierre) ${Fmt.eur(c113)}, ` +
        `Compras ${Fmt.eur(c600)}, Variación de existencias (deudora) ${Fmt.eur(c610)}, Sueldos ${Fmt.eur(c640)}, SS empresa ${Fmt.eur(c642)}, ` +
        `Arrendamientos ${Fmt.eur(c621)}, Amortización (681) ${Fmt.eur(c681)}, Intereses de deudas ${Fmt.eur(c662)} y Ventas ${Fmt.eur(c700)}. ` +
        `Contabiliza el impuesto del 25 % y elabora la Cuenta de PyG (líneas 1, 4, 6, 7, 8, 13, A, B, C, 17 y D) y las masas del Balance.`;

      return {
        id: '',
        tema: 'cierre',
        nivel: 5,
        titulo: 'Cuenta de PyG y Balance de situación',
        enunciado,
        inicial: [
          { c: '213', d: c213, h: 0 },
          { c: '281', d: 0, h: c281 },
          { c: '300', d: c300, h: 0 },
          { c: '430', d: c430, h: 0 },
          { c: '572', d: c572, h: 0 },
          { c: '400', d: 0, h: c400 },
          { c: '170', d: 0, h: c170 },
          { c: '520', d: 0, h: c520 },
          { c: '100', d: 0, h: c100 },
          { c: '113', d: 0, h: c113 },
          { c: '600', d: c600, h: 0 },
          { c: '610', d: c610, h: 0 },
          { c: '640', d: c640, h: 0 },
          { c: '642', d: c642, h: 0 },
          { c: '621', d: c621, h: 0 },
          { c: '681', d: c681, h: 0 },
          { c: '662', d: c662, h: 0 },
          { c: '700', d: 0, h: c700 },
        ],
        asientos: [asientoImpuesto],
        calc: [
          { etiqueta: 'PyG 1 · Importe neto cifra negocios', valor: pyg.lineas[1] },
          { etiqueta: 'PyG 4 · Aprovisionamientos', valor: pyg.lineas[4] },
          { etiqueta: 'PyG 6 · Gastos de personal', valor: pyg.lineas[6] },
          { etiqueta: 'PyG 7 · Otros gastos explotación', valor: pyg.lineas[7] },
          { etiqueta: 'PyG 8 · Amortización del inmovilizado', valor: pyg.lineas[8] },
          { etiqueta: 'PyG 13 · Gastos financieros', valor: pyg.lineas[13] },
          { etiqueta: 'PyG A · Resultado de explotación', valor: pyg.A },
          { etiqueta: 'PyG B · Resultado financiero', valor: pyg.B },
          { etiqueta: 'PyG C · Resultado antes de impuestos', valor: pyg.C },
          { etiqueta: 'PyG 17 · Impuesto sobre beneficios', valor: pyg.impuesto },
          { etiqueta: 'PyG D · Resultado del ejercicio', valor: pyg.D },
          { etiqueta: 'Balance · Activo total', valor: bal.activo },
          { etiqueta: 'Balance · Patrimonio neto', valor: bal.pn },
          { etiqueta: 'Balance · Pasivo no corriente', valor: bal.pnc },
          { etiqueta: 'Balance · Pasivo corriente', valor: bal.pc },
        ],
        nota: 'La 630 se integra en la línea 17 de la PyG (negativa) y la deuda fiscal (4752) en el Pasivo corriente. El resultado D forma parte del Patrimonio neto.',
        fuente: 'gen',
      };
    },
  },
];
