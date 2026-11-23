import React, { useEffect, useMemo, useState } from 'react';
import { NATURALEZA_LABEL, PGC } from '../data/pgc';

const listeners = new Set<() => void>();
let abiertoGlobal = false;

export function abrirCuadroCuentas(): void {
  abiertoGlobal = true;
  for (const fn of listeners) {
    fn();
  }
}

export function cerrarCuadroCuentas(): void {
  abiertoGlobal = false;
  for (const fn of listeners) {
    fn();
  }
}

export function IconLibro({
  size = 18,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M8.5 7H15.5" />
      <path d="M8.5 11H13.5" />
    </svg>
  );
}

export function CuadroCuentasModal() {
  const [abierto, setAbierto] = useState(abiertoGlobal);
  const [busqueda, setBusqueda] = useState('');
  const [grupo, setGrupo] = useState<number | 'todos'>('todos');

  useEffect(() => {
    const sync = () => setAbierto(abiertoGlobal);
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  useEffect(() => {
    if (!abierto) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrarCuadroCuentas();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [abierto]);

  const cuentasFiltradas = useMemo(() => {
    const texto = busqueda.trim();
    const base = texto
      ? PGC.buscar(texto, PGC.cuentas.length)
      : PGC.cuentas;
    if (grupo === 'todos') {
      return base;
    }
    return base.filter((c) => c.grupo === grupo);
  }, [busqueda, grupo]);

  if (!abierto) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cuadro-cuentas-titulo"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        backgroundColor: 'rgba(17, 17, 17, 0.35)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={cerrarCuadroCuentas}
    >
      <div
        className="card"
        style={{
          maxWidth: 720,
          width: '100%',
          maxHeight: '88dvh',
          background: '#F8F7F4',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconLibro size={20} />
            <div>
              <h2
                id="cuadro-cuentas-titulo"
                className="card-title"
                style={{ fontSize: 16 }}
              >
                Cuadro de cuentas (PGC)
              </h2>
              <p className="card-subtitle">
                {cuentasFiltradas.length} cuentas disponibles
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-sec"
            style={{ minHeight: 38, padding: '0 14px' }}
            onClick={cerrarCuadroCuentas}
          >
            Cerrar
          </button>
        </div>

        {/* Recordatorio contable */}
        <p
          style={{
            margin: 0,
            padding: '10px 14px',
            borderRadius: 14,
            background: '#EDEBE6',
            fontSize: 12.5,
            lineHeight: 1.45,
            color: '#333333',
          }}
        >
          Grupo 4 = actividad propia (clientes, proveedores, personal, Hacienda),
          grupo 5 = financieras; activos y gastos aumentan en el Debe; pasivos, PN e
          ingresos, en el Haber.
        </p>

        {/* Buscador */}
        <input
          type="search"
          className="field"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por número o nombre (ej. 472, IVA, proveedores...)"
          autoFocus
        />

        {/* Filtro por grupo 1-7 */}
        <div
          className="tema-scroll"
          role="group"
          aria-label="Filtrar por grupo del PGC"
        >
          <button
            type="button"
            className={grupo === 'todos' ? 'chip-dark' : 'chip'}
            style={{ cursor: 'pointer', minHeight: 34 }}
            onClick={() => setGrupo('todos')}
          >
            Todos
          </button>
          {[1, 2, 3, 4, 5, 6, 7].map((g) => (
            <button
              key={g}
              type="button"
              className={grupo === g ? 'chip-dark' : 'chip'}
              style={{ cursor: 'pointer', minHeight: 34 }}
              onClick={() => setGrupo(g)}
            >
              Grupo {g}
            </button>
          ))}
        </div>

        {/* Lista de cuentas */}
        <div
          style={{
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingRight: 2,
          }}
        >
          {cuentasFiltradas.length === 0 ? (
            <p
              style={{
                margin: '16px 0',
                textAlign: 'center',
                fontSize: 13.5,
                color: '#6B6B6B',
              }}
            >
              No hay cuentas que coincidan con «{busqueda}».
            </p>
          ) : (
            cuentasFiltradas.map((c) => (
              <div
                key={c.n}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                    minWidth: 0,
                    flex: '1 1 220px',
                  }}
                >
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: '#111111',
                      minWidth: 38,
                    }}
                  >
                    {c.n}
                  </span>
                  <span
                    style={{
                      fontSize: 13.5,
                      color: '#111111',
                      lineHeight: 1.35,
                    }}
                  >
                    {c.nombre}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span className="chip" style={{ fontSize: 11.5 }}>
                    {NATURALEZA_LABEL[c.nat]}
                  </span>
                  {c.inv && (
                    <span className="chip-dark" style={{ fontSize: 11.5 }}>
                      sentido inverso
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
