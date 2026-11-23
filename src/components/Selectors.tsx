import React from 'react';
import { TEMAS, type TemaId } from '../data/temas';
import { Store, useStore, type ModoJuego } from '../lib/store';

export function useUi() {
  const store = useStore();
  const tema = store.ui.tema;
  const modo = store.ui.modoJuego;

  const setTema = (nuevoTema: TemaId) => {
    Store.update((prev) => ({
      ...prev,
      ui: { ...prev.ui, tema: nuevoTema },
    }));
  };

  const setModo = (nuevoModo: ModoJuego) => {
    Store.update((prev) => ({
      ...prev,
      ui: { ...prev.ui, modoJuego: nuevoModo },
    }));
  };

  return { tema, modo, setTema, setModo };
}

export function SelectorTema() {
  const { tema, setTema } = useUi();

  return (
    <div
      className="tema-scroll"
      role="tablist"
      aria-label="Seleccionar temática"
    >
      {TEMAS.map((item) => {
        const activo = item.id === tema;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activo}
            className={activo ? 'chip-dark' : 'chip'}
            style={{
              cursor: 'pointer',
              minHeight: 36,
              padding: '6px 14px',
              fontSize: 12.5,
            }}
            onClick={() => setTema(item.id)}
          >
            {item.nombre}
          </button>
        );
      })}
    </div>
  );
}

export function SelectorModo() {
  const { modo, setModo } = useUi();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div>
        <div
          className="segmented"
          role="tablist"
          aria-label="Modo de práctica"
        >
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'estudio'}
            className={`segmented-btn ${modo === 'estudio' ? 'is-active' : ''}`}
            onClick={() => setModo('estudio')}
          >
            Estudio
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'reto'}
            className={`segmented-btn ${modo === 'reto' ? 'is-active' : ''}`}
            onClick={() => setModo('reto')}
          >
            Reto
          </button>
        </div>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 12.5,
          color: '#6B6B6B',
          lineHeight: 1.4,
        }}
      >
        {modo === 'estudio'
          ? 'Estudio: ves la solución resuelta y explicada antes y luego practicas con otros números.'
          : 'Reto: resuelves y después ves la corrección línea a línea.'}
      </p>
    </div>
  );
}
