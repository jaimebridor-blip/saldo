import React from 'react';
import { go, useRoute } from '../lib/router';
import { Store, useStore, type ModoApp } from '../lib/store';
import {
  abrirCuadroCuentas,
  CuadroCuentasModal,
  IconLibro,
} from './CuadroCuentas';
import {
  IconAjustes,
  IconExamen,
  IconFlecha,
  IconPracticar,
  LogoBalanza,
} from './Icons';

export interface HeaderProps {
  titulo: string;
  subtitulo?: string;
  accionTexto?: string;
  accionRuta?: string;
  onAccion?: () => void;
}

export function Header({
  titulo,
  subtitulo,
  accionTexto,
  accionRuta,
  onAccion,
}: HeaderProps) {
  const store = useStore();
  const { ruta } = useRoute();

  const cambiarModo = (nuevoModo: ModoApp) => {
    Store.update({ modo: nuevoModo });
    if (nuevoModo === 'examen') {
      go('/supuestos');
    }
  };

  const manejarAccion = () => {
    if (onAccion) {
      onAccion();
      return;
    }
    if (accionRuta) {
      go(accionRuta);
    }
  };

  return (
    <>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Barra móvil (< 820 px): logo + control Practicar|Examen + libro + engranaje Ajustes */}
        <div
          className="mobile-only"
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
          }}
        >
          <a
            href="#/dashboard"
            className="saldo-logo"
            onClick={(e) => {
              e.preventDefault();
              go('/dashboard');
            }}
          >
            <LogoBalanza size={22} />
            <span className="saldo-wordmark">Saldo</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="segmented" role="tablist" aria-label="Modo de estudio">
              <button
                type="button"
                role="tab"
                aria-selected={store.modo === 'practicar'}
                className={`segmented-btn ${store.modo === 'practicar' ? 'is-active' : ''}`}
                style={{ padding: '6px 9px', fontSize: 11.5 }}
                onClick={() => cambiarModo('practicar')}
              >
                <IconPracticar size={13} />
                <span>Practicar</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={store.modo === 'examen'}
                className={`segmented-btn ${store.modo === 'examen' ? 'is-active' : ''}`}
                style={{ padding: '6px 9px', fontSize: 11.5 }}
                onClick={() => cambiarModo('examen')}
              >
                <IconExamen size={13} />
                <span>Examen</span>
              </button>
            </div>

            <button
              type="button"
              onClick={abrirCuadroCuentas}
              aria-label="Cuadro de cuentas"
              title="Cuadro de cuentas"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.65)',
                color: '#111111',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}
            >
              <IconLibro size={18} />
            </button>

            <button
              type="button"
              onClick={() => go('/ajustes')}
              aria-label="Abrir Ajustes"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                background:
                  ruta === '/ajustes' ? '#111111' : 'rgba(255,255,255,0.65)',
                color: ruta === '/ajustes' ? '#FFFFFF' : '#111111',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}
            >
              <IconAjustes size={18} />
            </button>
          </div>
        </div>

        {/* Cabecera de pantalla: título en negrita 15-16 px con texto gris al lado + Cuadro de cuentas + botón píldora negro con flecha */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              flexWrap: 'wrap',
              minWidth: 0,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: '#111111',
                lineHeight: 1.3,
              }}
            >
              {titulo}
            </h1>
            {subtitulo && (
              <span
                style={{
                  fontSize: 13.5,
                  color: '#6B6B6B',
                  lineHeight: 1.35,
                }}
              >
                {subtitulo}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn-sec desktop-only"
              onClick={abrirCuadroCuentas}
              style={{ minHeight: 38, padding: '0 14px' }}
            >
              <IconLibro size={16} />
              <span>Cuadro de cuentas</span>
            </button>

            {accionTexto && (accionRuta || onAccion) && (
              <button
                type="button"
                className="btn"
                onClick={manejarAccion}
                style={{ minHeight: 38, padding: '0 16px' }}
              >
                <span>{accionTexto}</span>
                <IconFlecha size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      <CuadroCuentasModal />
    </>
  );
}
