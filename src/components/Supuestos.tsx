import React, { useEffect, useState } from 'react';
import { PGC } from '../data/pgc';
import { getTema, type TemaId } from '../data/temas';
import { AI } from '../lib/ai';
import { Bank } from '../lib/bank';
import {
  corregirSupuesto,
  registrarResultadoSupuesto,
  type ResultadoSupuesto,
} from '../lib/correccion';
import { Engine } from '../lib/engine';
import { Fmt } from '../lib/fmt';
import { Gen } from '../lib/gen';
import { Masas } from '../lib/masas';
import { Store, useStore } from '../lib/store';
import type { Asiento, CalculoEjercicio, Ejercicio, SaldoInicial } from '../lib/types';
import { Header } from './Header';
import { useUi } from './Selectors';
import { ConfigSupuesto, type OrigenSupuesto } from './supuestos/Config';
import { EstudioSupuesto } from './supuestos/Estudio';
import { ExamenSupuesto, type EntregaSupuesto } from './supuestos/Examen';
import { ResultadosSupuesto } from './supuestos/Resultados';

type VistaSupuesto = 'config' | 'estudio' | 'examen' | 'resultados';

function limpiarJsonIA(texto: string): string {
  const sinBloque = texto
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const inicio = sinBloque.indexOf('{');
  const fin = sinBloque.lastIndexOf('}');
  if (inicio >= 0 && fin > inicio) {
    return sinBloque.slice(inicio, fin + 1);
  }
  return sinBloque;
}

function normalizarEjercicioIA(raw: unknown, temaDefecto: TemaId): Ejercicio | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const obj = raw as Record<string, unknown>;

  const inicial: SaldoInicial[] | null = Array.isArray(obj.inicial)
    ? obj.inicial
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((s) => ({
          c: String(s.c ?? '').trim(),
          d: Math.round((Number(s.d) || 0) * 100) / 100,
          h: Math.round((Number(s.h) || 0) * 100) / 100,
        }))
    : null;

  const asientos: Asiento[] = Array.isArray(obj.asientos)
    ? obj.asientos
        .filter((a): a is Record<string, unknown> => Boolean(a && typeof a === 'object'))
        .map((a, idx) => ({
          fecha: String(a.fecha ?? `0${(idx % 8) + 1}/06/20X6`).trim(),
          concepto: String(a.concepto ?? `Operación ${idx + 1}`).trim(),
          lineas: Array.isArray(a.lineas)
            ? a.lineas
                .filter((l): l is Record<string, unknown> => Boolean(l && typeof l === 'object'))
                .map((l) => ({
                  c: String(l.c ?? '').trim(),
                  d: Math.round((Number(l.d) || 0) * 100) / 100,
                  h: Math.round((Number(l.h) || 0) * 100) / 100,
                  por: typeof l.por === 'string' ? l.por : undefined,
                }))
            : [],
        }))
    : [];

  const calc: CalculoEjercicio[] = Array.isArray(obj.calc)
    ? obj.calc
        .filter((c): c is Record<string, unknown> => Boolean(c && typeof c === 'object'))
        .map((c) => ({
          etiqueta: String(c.etiqueta ?? '').trim(),
          valor: Number(c.valor),
        }))
    : [];

  const ej: Ejercicio = {
    id: `IA-${Date.now()}`,
    tema: temaDefecto,
    nivel: 4,
    titulo: String(obj.titulo ?? `Supuesto IA (${getTema(temaDefecto).nombre})`).trim(),
    enunciado: String(obj.enunciado ?? '').trim(),
    inicial: inicial && inicial.length > 0 ? inicial : null,
    asientos,
    calc,
    nota: String(obj.nota ?? '').trim(),
    fuente: 'ia',
  };

  if (ej.asientos.length < 3) {
    return null;
  }

  // Validar con Gen.validar
  const val = Gen.validar(ej);
  if (!val.ok) {
    return null;
  }

  // Comprobar que el balance inicial (si existe) cuadra
  if (ej.inicial && ej.inicial.length > 0) {
    const sumD = ej.inicial.reduce((acc, s) => acc + s.d, 0);
    const sumH = ej.inicial.reduce((acc, s) => acc + s.h, 0);
    if (Math.abs(sumD - sumH) > 0.01) {
      return null;
    }
  }

  // Comprobar que el Balance final cuadra
  const saldos = Engine.mayorizar(ej.asientos, ej.inicial);
  const bal = Masas.balance(saldos);
  if (Math.abs(bal.activo - bal.pnYPasivo) > 0.01) {
    return null;
  }

  return ej;
}

async function generarSupuestoConIA(tema: TemaId, numOps: number): Promise<Ejercicio | null> {
  const cuentasDisponibles = PGC.cuentas.map((c) => `${c.n} ${c.nombre}`).join(', ');
  const temaNombre = getTema(tema).nombre;

  const prompt = [
    'Genera un único supuesto práctico completo de Contabilidad Financiera española (PGC PYMES, IVA 21 %) para una empresa ficticia española.',
    `Temática solicitada: "${temaNombre}" (id: "${tema}"). Número de operaciones/asientos: entre ${numOps} y ${numOps}.`,
    'Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional ni markdown) con exactamente esta estructura:',
    '{',
    '  "titulo": "Supuesto: ...",',
    '  "enunciado": "Texto completo con empresa ficticia, balance inicial si hay, todas las operaciones fechadas e IVA 21 %",',
    '  "inicial": [{"c":"572","d":50000,"h":0}, {"c":"100","d":0,"h":50000}] o null,',
    '  "asientos": [{"fecha":"15/02/20X6","concepto":"...","lineas":[{"c":"600","d":1000,"h":0},{"c":"472","d":210,"h":0},{"c":"400","d":0,"h":1210}]}],',
    '  "calc": [{"etiqueta":"Resultado antes de impuestos","valor":0}],',
    '  "nota": "Resumen breve del criterio contable aplicado."',
    '}',
    'Reglas obligatorias:',
    '1) Usa SOLO códigos de cuenta de este catálogo PGC: ' + cuentasDisponibles + '.',
    '2) Todos los asientos deben cuadrar (suma de d == suma de h) y cada línea solo puede tener d > 0 o h > 0.',
    '3) Si hay "inicial", la suma de d debe igualar exactamente la suma de h.',
    '4) Todos los valores de "calc" deben ser numéricos.',
  ].join('\n');

  const raw = await AI.llamar(prompt, { json: true });
  const parsed = JSON.parse(limpiarJsonIA(raw)) as unknown;
  return normalizarEjercicioIA(parsed, tema);
}

export function Supuestos() {
  const store = useStore();
  const { tema, modo } = useUi();

  const esExamenGlobal = store.modo === 'examen';
  const tieneClaveIA = AI.tieneClave();
  const ultimaNota = Store.ultimaNota(store);

  const [vista, setVista] = useState<VistaSupuesto>('config');
  const [origen, setOrigen] = useState<OrigenSupuesto>('gen');
  const [numOps, setNumOps] = useState<number>(5);
  const [conCrono, setConCrono] = useState<boolean>(true);
  const [minutos, setMinutos] = useState<number>(45);
  const [cargandoIA, setCargandoIA] = useState<boolean>(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const [ejercicioActual, setEjercicioActual] = useState<Ejercicio | null>(null);
  const [examenKey, setExamenKey] = useState<number>(1);
  const [resultadoActual, setResultadoActual] = useState<ResultadoSupuesto | null>(null);
  const [duracionFinal, setDuracionFinal] = useState<number>(0);
  const [tiempoAgotadoFinal, setTiempoAgotadoFinal] = useState<boolean>(false);

  // Si se activa el modo global Examen, forzamos Reto, cronómetro activo y ocultamos Estudio
  useEffect(() => {
    if (esExamenGlobal) {
      setConCrono(true);
      if (vista === 'estudio') {
        setVista('config');
      }
    }
  }, [esExamenGlobal, vista]);

  // Si desaparece la clave de IA mientras estaba seleccionado origen "ia"
  useEffect(() => {
    if (!tieneClaveIA && origen === 'ia') {
      setOrigen('gen');
    }
  }, [tieneClaveIA, origen]);

  const seleccionarDesdeBanco = (temaId: TemaId, excluirId?: string): Ejercicio => {
    if (temaId === 'completo') {
      const integrales = Bank.supuestos();
      const pool =
        excluirId && integrales.length > 1
          ? integrales.filter((e) => e.id !== excluirId)
          : integrales;
      if (pool.length > 0) {
        return pool[Math.floor(Math.random() * pool.length)];
      }
    }

    const candidato = Bank.elegir(temaId, {
      soloSupuestos: true,
      excluir: excluirId ? [excluirId] : undefined,
    });
    if (candidato) {
      return candidato;
    }

    const sinExcluir = Bank.elegir(temaId, { soloSupuestos: true });
    if (sinExcluir) {
      return sinExcluir;
    }

    return Gen.supuesto(temaId, { n: numOps });
  };

  const construirSupuestoSync = (
    origenObjetivo: OrigenSupuesto,
    temaObjetivo: TemaId,
    excluirId?: string
  ): Ejercicio => {
    if (origenObjetivo === 'banco') {
      return seleccionarDesdeBanco(temaObjetivo, excluirId);
    }
    return Gen.supuesto(temaObjetivo, { n: numOps });
  };

  const empezar = async () => {
    setAviso(null);
    const modoEfectivo = esExamenGlobal ? 'reto' : modo;
    let ejercicioElegido: Ejercicio | null = null;

    if (origen === 'ia' && tieneClaveIA) {
      setCargandoIA(true);
      try {
        const ejIA = await generarSupuestoConIA(tema, numOps);
        if (ejIA) {
          ejercicioElegido = ejIA;
        } else {
          setAviso(
            'La propuesta de la IA no pasó la validación contable (Gen.validar) o no cuadraba su Balance. Se ha usado un supuesto generado automáticamente.'
          );
          ejercicioElegido = Gen.supuesto(tema, { n: numOps });
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Error al generar con IA.';
        setAviso(
          `${msg} Se ha cargado en su lugar un supuesto generado automáticamente.`
        );
        ejercicioElegido = Gen.supuesto(tema, { n: numOps });
      } finally {
        setCargandoIA(false);
      }
    } else {
      ejercicioElegido = construirSupuestoSync(origen, tema);
    }

    setEjercicioActual(ejercicioElegido);
    setResultadoActual(null);

    if (modoEfectivo === 'estudio') {
      setVista('estudio');
    } else {
      setExamenKey((k) => k + 1);
      setVista('examen');
    }
  };

  const pasarDeEstudioAReto = () => {
    const temaBase = ejercicioActual?.tema ?? tema;
    const otro =
      origen === 'banco'
        ? seleccionarDesdeBanco(temaBase, ejercicioActual?.id)
        : Gen.supuesto(temaBase, { n: numOps });

    setAviso(null);
    setEjercicioActual(otro);
    setResultadoActual(null);
    setExamenKey((k) => k + 1);
    setVista('examen');
  };

  const iniciarOtroReto = () => {
    const temaBase = ejercicioActual?.tema ?? tema;
    const otro =
      origen === 'banco'
        ? seleccionarDesdeBanco(temaBase, ejercicioActual?.id)
        : Gen.supuesto(temaBase, { n: numOps });

    setAviso(null);
    setEjercicioActual(otro);
    setResultadoActual(null);
    setExamenKey((k) => k + 1);
    setVista('examen');
  };

  const finalizarExamen = (entrega: EntregaSupuesto) => {
    if (!ejercicioActual) return;
    const resultado = corregirSupuesto({
      ejercicio: ejercicioActual,
      respuestasAsientos: entrega.respuestasAsientos,
      respuestaPyG: entrega.respuestaPyG,
      respuestaBalance: entrega.respuestaBalance,
    });

    registrarResultadoSupuesto(ejercicioActual, resultado, entrega.duracionSegundos);
    setResultadoActual(resultado);
    setDuracionFinal(entrega.duracionSegundos);
    setTiempoAgotadoFinal(entrega.tiempoAgotado);
    setVista('resultados');
  };

  const subtituloHeader = ultimaNota
    ? `Problema tipo examen · 5 puntos · Última nota: ${Fmt.num(ultimaNota.nota)} / 5`
    : 'Problema tipo examen · 5 puntos';

  if (vista === 'estudio' && ejercicioActual && !esExamenGlobal) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Header
          titulo="Supuestos"
          subtitulo={subtituloHeader}
          accionTexto="Error Vault"
          accionRuta="/vault"
        />
        {aviso && (
          <div
            role="status"
            aria-live="polite"
            className="card"
            style={{
              padding: '12px 16px',
              background: 'rgba(245, 158, 11, 0.14)',
              color: '#92400E',
              fontSize: 13,
            }}
          >
            {aviso}
          </div>
        )}
        <EstudioSupuesto
          ejercicio={ejercicioActual}
          onAhoraTu={pasarDeEstudioAReto}
          onVolver={() => setVista('config')}
        />
      </div>
    );
  }

  if (vista === 'examen' && ejercicioActual) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Header
          titulo="Supuestos"
          subtitulo={subtituloHeader}
        />
        {aviso && (
          <div
            role="status"
            aria-live="polite"
            className="card"
            style={{
              padding: '12px 16px',
              background: 'rgba(245, 158, 11, 0.14)',
              color: '#92400E',
              fontSize: 13,
            }}
          >
            {aviso}
          </div>
        )}
        <ExamenSupuesto
          key={examenKey}
          ejercicio={ejercicioActual}
          conCrono={esExamenGlobal ? true : conCrono}
          minutos={minutos}
          onTerminar={finalizarExamen}
          onSalir={() => setVista('config')}
        />
      </div>
    );
  }

  if (vista === 'resultados' && ejercicioActual && resultadoActual) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Header
          titulo="Supuestos"
          subtitulo={subtituloHeader}
          accionTexto="Error Vault"
          accionRuta="/vault"
        />
        <ResultadosSupuesto
          ejercicio={ejercicioActual}
          resultado={resultadoActual}
          duracionSegundos={duracionFinal}
          tiempoAgotado={tiempoAgotadoFinal}
          onRepetirOtro={iniciarOtroReto}
          onVolverConfig={() => setVista('config')}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Header
        titulo="Supuestos"
        subtitulo={subtituloHeader}
        accionTexto="Error Vault"
        accionRuta="/vault"
      />

      <ConfigSupuesto
        origen={origen}
        onOrigen={setOrigen}
        numOps={numOps}
        onNumOps={setNumOps}
        conCrono={esExamenGlobal ? true : conCrono}
        onConCrono={setConCrono}
        minutos={minutos}
        onMinutos={setMinutos}
        esExamenGlobal={esExamenGlobal}
        tieneClaveIA={tieneClaveIA}
        cargandoIA={cargandoIA}
        aviso={aviso}
        ultimaNota={ultimaNota}
        onEmpezar={empezar}
      />
    </div>
  );
}
