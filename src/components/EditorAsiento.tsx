import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { PGC, type CuentaPGC } from '../data/pgc';
import type {
  EstadoLineaCorreccion,
  LineaCorreccion,
  ResultadoCorreccion,
} from '../lib/engine';
import { Fmt } from '../lib/fmt';
import type { Linea } from '../lib/types';

export interface EditorAsientoProps {
  lineas?: number;
  bloqueado?: boolean;
  onCambio?: (lineas: Linea[]) => void;
  onComprobar?: (lineas: Linea[]) => void;
}

export interface EditorAsientoHandle {
  getLineas: () => Linea[];
  setLineas: (nuevas: Linea[]) => void;
  marcar: (resultado: ResultadoCorreccion) => void;
  reset: () => void;
}

interface FilaEditor {
  uid: string;
  cuentaTexto: string;
  debeTexto: string;
  haberTexto: string;
}

interface MarcaFila {
  estado: EstadoLineaCorreccion;
  mensaje: string;
}

let uidCounter = 1;
function nuevaFila(linea?: Linea): FilaEditor {
  const c = linea?.c ? linea.c.trim() : '';
  const nom = c ? PGC.nombre(c) : '';
  return {
    uid: `fila_${uidCounter++}`,
    cuentaTexto: c ? (nom ? `${c} · ${nom}` : c) : '',
    debeTexto: linea && linea.d > 0 ? Fmt.num(linea.d) : '',
    haberTexto: linea && linea.h > 0 ? Fmt.num(linea.h) : '',
  };
}

function crearFilasVacias(n: number): FilaEditor[] {
  return Array.from({ length: Math.max(1, n) }, () => nuevaFila());
}

function extraerCodigoCuenta(texto: string): string {
  const limpio = texto.trim();
  if (!limpio) {
    return '';
  }
  const match = limpio.match(/^(\d{2,5})\b/);
  if (match) {
    return match[1];
  }
  const exact = PGC.get(limpio);
  return exact ? exact.n : limpio;
}

function filasALineas(filas: FilaEditor[]): Linea[] {
  return filas
    .map((f) => {
      const c = extraerCodigoCuenta(f.cuentaTexto);
      const dParsed = Fmt.parse(f.debeTexto);
      const hParsed = Fmt.parse(f.haberTexto);
      const d = Number.isFinite(dParsed) && dParsed > 0 ? dParsed : 0;
      const h = Number.isFinite(hParsed) && hParsed > 0 ? hParsed : 0;
      return { c, d, h };
    })
    .filter((l) => l.c !== '' || l.d > 0 || l.h > 0);
}

const ESTILO_MARCA: Record<
  EstadoLineaCorreccion,
  { bg: string; color: string; border: string }
> = {
  ok: {
    bg: 'rgba(16, 185, 129, 0.12)',
    color: '#065F46',
    border: 'rgba(16, 185, 129, 0.35)',
  },
  importe: {
    bg: 'rgba(245, 158, 11, 0.13)',
    color: '#92400E',
    border: 'rgba(245, 158, 11, 0.4)',
  },
  lado: {
    bg: 'rgba(239, 68, 68, 0.11)',
    color: '#991B1B',
    border: 'rgba(239, 68, 68, 0.35)',
  },
  sobra: {
    bg: 'rgba(239, 68, 68, 0.11)',
    color: '#991B1B',
    border: 'rgba(239, 68, 68, 0.35)',
  },
  falta: {
    bg: 'rgba(239, 68, 68, 0.11)',
    color: '#991B1B',
    border: 'rgba(239, 68, 68, 0.35)',
  },
};

export const EditorAsiento = forwardRef<EditorAsientoHandle, EditorAsientoProps>(
  function EditorAsiento(
    { lineas = 3, bloqueado = false, onCambio, onComprobar },
    ref
  ) {
    const [filas, setFilas] = useState<FilaEditor[]>(() =>
      crearFilasVacias(lineas)
    );
    const [marcasPorFila, setMarcasPorFila] = useState<Record<number, MarcaFila>>(
      {}
    );
    const [faltantes, setFaltantes] = useState<LineaCorreccion[]>([]);
    const [dropdownIdx, setDropdownIdx] = useState<number | null>(null);
    const [indiceActivo, setIndiceActivo] = useState<number>(0);

    const notificarCambio = (nextFilas: FilaEditor[]) => {
      onCambio?.(filasALineas(nextFilas));
    };

    useImperativeHandle(
      ref,
      () => ({
        getLineas: () => filasALineas(filas),
        setLineas: (nuevas: Linea[]) => {
          const next =
            nuevas.length > 0
              ? nuevas.map((l) => nuevaFila(l))
              : crearFilasVacias(lineas);
          setFilas(next);
          setMarcasPorFila({});
          setFaltantes([]);
          notificarCambio(next);
        },
        marcar: (resultado: ResultadoCorreccion) => {
          const nuevasMarcas: Record<number, MarcaFila> = {};
          const nuevasFaltantes: LineaCorreccion[] = [];

          const indicesActivos = filas
            .map((f, rawIdx) => {
              const c = extraerCodigoCuenta(f.cuentaTexto);
              const dParsed = Fmt.parse(f.debeTexto);
              const hParsed = Fmt.parse(f.haberTexto);
              const d = Number.isFinite(dParsed) && dParsed > 0 ? dParsed : 0;
              const h = Number.isFinite(hParsed) && hParsed > 0 ? hParsed : 0;
              return c !== '' || d > 0 || h > 0 ? rawIdx : -1;
            })
            .filter((idx) => idx >= 0);

          for (const item of resultado.lineas) {
            if (item.estado === 'falta') {
              nuevasFaltantes.push(item);
              continue;
            }
            const idxs = item.dada?.indices ?? [];
            for (const lineaPos of idxs) {
              const rawPos = indicesActivos[lineaPos];
              if (typeof rawPos === 'number') {
                nuevasMarcas[rawPos] = {
                  estado: item.estado,
                  mensaje: item.mensaje,
                };
              }
            }
          }

          setMarcasPorFila(nuevasMarcas);
          setFaltantes(nuevasFaltantes);
        },
        reset: () => {
          const next = crearFilasVacias(lineas);
          setFilas(next);
          setMarcasPorFila({});
          setFaltantes([]);
          setDropdownIdx(null);
          notificarCambio(next);
        },
      }),
      [filas, lineas]
    );

    const { totalD, totalH, cuadra, diferencia } = useMemo(() => {
      let dSum = 0;
      let hSum = 0;
      for (const f of filas) {
        const dVal = Fmt.parse(f.debeTexto);
        const hVal = Fmt.parse(f.haberTexto);
        if (Number.isFinite(dVal) && dVal > 0) {
          dSum += dVal;
        }
        if (Number.isFinite(hVal) && hVal > 0) {
          hSum += hVal;
        }
      }
      const dClean = Math.round(dSum * 100) / 100;
      const hClean = Math.round(hSum * 100) / 100;
      const diff = Math.round(Math.abs(dClean - hClean) * 100) / 100;
      return {
        totalD: dClean,
        totalH: hClean,
        cuadra: dClean > 0 && diff <= 0.01,
        diferencia: diff,
      };
    }, [filas]);

    const actualizarFila = (idx: number, patch: Partial<FilaEditor>) => {
      setMarcasPorFila({});
      setFaltantes([]);
      setFilas((prev) => {
        const next = prev.map((f, i) => (i === idx ? { ...f, ...patch } : f));
        notificarCambio(next);
        return next;
      });
    };

    const seleccionarCuenta = (idx: number, cuenta: CuentaPGC) => {
      actualizarFila(idx, {
        cuentaTexto: `${cuenta.n} · ${cuenta.nombre}`,
      });
      setDropdownIdx(null);
    };

    const quitarFila = (idx: number) => {
      setMarcasPorFila({});
      setFaltantes([]);
      setFilas((prev) => {
        const next =
          prev.length <= 1 ? crearFilasVacias(1) : prev.filter((_, i) => i !== idx);
        notificarCambio(next);
        return next;
      });
      setDropdownIdx(null);
    };

    const anadirFila = () => {
      setMarcasPorFila({});
      setFaltantes([]);
      setFilas((prev) => {
        const next = [...prev, nuevaFila()];
        notificarCambio(next);
        return next;
      });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Lista de líneas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filas.map((fila, idx) => {
            const marca = marcasPorFila[idx];
            const estiloMarca = marca ? ESTILO_MARCA[marca.estado] : null;
            const codigo = extraerCodigoCuenta(fila.cuentaTexto);
            const cuentaExacta = codigo ? PGC.get(codigo) : undefined;
            const sugerencias =
              dropdownIdx === idx
                ? PGC.buscar(
                    fila.cuentaTexto.includes('·')
                      ? codigo
                      : fila.cuentaTexto,
                    8
                  )
                : [];

            return (
              <div
                key={fila.uid}
                style={{
                  borderRadius: 16,
                  padding: 10,
                  background: estiloMarca
                    ? estiloMarca.bg
                    : 'rgba(255, 255, 255, 0.72)',
                  border: `1px solid ${
                    estiloMarca ? estiloMarca.border : 'rgba(0, 0, 0, 0.06)'
                  }`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  {/* Buscador de cuenta */}
                  <div
                    style={{
                      position: 'relative',
                      flex: '2 1 200px',
                      minWidth: 0,
                    }}
                  >
                    <input
                      type="text"
                      className="field"
                      style={{ minHeight: 44, padding: '8px 12px' }}
                      value={fila.cuentaTexto}
                      disabled={bloqueado}
                      placeholder="Cuenta (ej. 600 o Compras)"
                      aria-label={`Cuenta línea ${idx + 1}`}
                      onFocus={(e) => {
                        e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
                        if (!bloqueado) {
                          setDropdownIdx(idx);
                          setIndiceActivo(0);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setDropdownIdx((curr) => (curr === idx ? null : curr));
                        }, 150);
                      }}
                      onChange={(e) => {
                        actualizarFila(idx, { cuentaTexto: e.target.value });
                        setDropdownIdx(idx);
                        setIndiceActivo(0);
                      }}
                      onKeyDown={(e) => {
                        if (dropdownIdx !== idx || sugerencias.length === 0) {
                          return;
                        }
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setIndiceActivo((i) =>
                            Math.min(i + 1, sugerencias.length - 1)
                          );
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setIndiceActivo((i) => Math.max(i - 1, 0));
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          const elegida = sugerencias[indiceActivo];
                          if (elegida) {
                            seleccionarCuenta(idx, elegida);
                          }
                        } else if (e.key === 'Escape') {
                          setDropdownIdx(null);
                        }
                      }}
                    />

                    {/* Desplegable de sugerencias */}
                    {dropdownIdx === idx && sugerencias.length > 0 && (
                      <div
                        role="listbox"
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          zIndex: 30,
                          background: '#FFFFFF',
                          borderRadius: 14,
                          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.14)',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          maxHeight: 240,
                          overflowY: 'auto',
                          padding: 4,
                        }}
                      >
                        {sugerencias.map((sug, sIdx) => (
                          <button
                            key={sug.n}
                            type="button"
                            role="option"
                            aria-selected={sIdx === indiceActivo}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              seleccionarCuenta(idx, sug);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              border: 'none',
                              borderRadius: 10,
                              padding: '9px 10px',
                              minHeight: 40,
                              cursor: 'pointer',
                              background:
                                sIdx === indiceActivo ? '#EDEBE6' : 'transparent',
                              color: '#111111',
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: 8,
                              fontSize: 13,
                            }}
                          >
                            <span
                              className="tabular-nums"
                              style={{ fontWeight: 700, flexShrink: 0 }}
                            >
                              {sug.n}
                            </span>
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {sug.nombre}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flex: '1 1 230px',
                      minWidth: 0,
                    }}
                  >
                    {/* Debe */}
                    <input
                      type="text"
                      inputMode="decimal"
                      className="field tabular-nums"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        minHeight: 44,
                        padding: '8px 10px',
                        textAlign: 'right',
                      }}
                      value={fila.debeTexto}
                      disabled={bloqueado}
                      placeholder="Debe"
                      aria-label={`Debe línea ${idx + 1}`}
                      onFocus={(e) => {
                        e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        actualizarFila(idx, {
                          debeTexto: val,
                          haberTexto: val.trim() ? '' : fila.haberTexto,
                        });
                      }}
                    />

                    {/* Haber */}
                    <input
                      type="text"
                      inputMode="decimal"
                      className="field tabular-nums"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        minHeight: 44,
                        padding: '8px 10px',
                        textAlign: 'right',
                      }}
                      value={fila.haberTexto}
                      disabled={bloqueado}
                      placeholder="Haber"
                      aria-label={`Haber línea ${idx + 1}`}
                      onFocus={(e) => {
                        e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        actualizarFila(idx, {
                          haberTexto: val,
                          debeTexto: val.trim() ? '' : fila.debeTexto,
                        });
                      }}
                    />

                    {/* Quitar línea */}
                    <button
                      type="button"
                      className="btn-sec"
                      disabled={bloqueado}
                      aria-label={`Quitar línea ${idx + 1}`}
                      title="Quitar línea"
                      style={{
                        width: 44,
                        minWidth: 44,
                        minHeight: 44,
                        padding: 0,
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                      onClick={() => quitarFila(idx)}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Confirmación de cuenta reconocida cuando solo se teclea el número */}
                {cuentaExacta && !fila.cuentaTexto.includes('·') && (
                  <div style={{ fontSize: 12, color: '#6B6B6B', paddingLeft: 4 }}>
                    {cuentaExacta.n} · {cuentaExacta.nombre}
                  </div>
                )}

                {/* Mensaje de corrección */}
                {marca && (
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: estiloMarca?.color,
                      paddingLeft: 4,
                    }}
                  >
                    {marca.mensaje}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Líneas que faltan tras corregir */}
        {faltantes.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '10px 14px',
              borderRadius: 14,
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#991B1B',
              fontSize: 13,
            }}
          >
            {faltantes.map((f, i) => (
              <div key={i}>! {f.mensaje}</div>
            ))}
          </div>
        )}

        {/* Botón añadir línea */}
        <div>
          <button
            type="button"
            className="btn-sec"
            disabled={bloqueado}
            style={{ minHeight: 44 }}
            onClick={anadirFila}
          >
            + Línea
          </button>
        </div>

        {/* Pie fijo con totales y Comprobar */}
        <div className="editor-footer">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="label">Total Debe</span>
              <span
                className="tabular-nums"
                style={{ fontSize: 14.5, fontWeight: 600 }}
              >
                {Fmt.eur(totalD)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="label">Total Haber</span>
              <span
                className="tabular-nums"
                style={{ fontSize: 14.5, fontWeight: 600 }}
              >
                {Fmt.eur(totalH)}
              </span>
            </div>

            <span className={cuadra ? 'chip-dark' : 'chip'}>
              {cuadra
                ? 'Cuadra ✓'
                : `Descuadre de ${Fmt.eur(diferencia)}`}
            </span>
          </div>

          <button
            type="button"
            className="btn"
            disabled={bloqueado}
            style={{ minHeight: 44 }}
            onClick={() => onComprobar?.(filasALineas(filas))}
          >
            Comprobar
          </button>
        </div>
      </div>
    );
  }
);
