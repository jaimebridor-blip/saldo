import React from 'react';
import { go, useRoute, type RutaApp } from '../lib/router';
import { Store, useStore, type ModoApp } from '../lib/store';
import { Vault } from '../lib/vault';
import { useInstall } from '../lib/install';
import { abrirCuadroCuentas, IconLibro } from './CuadroCuentas';
import {
  IconAjustes,
  IconDashboard,
  IconExamen,
  IconFlashcards,
  IconInstalar,
  IconJugar,
  IconPracticar,
  IconSupuestos,
  IconVault,
  LogoBalanza,
} from './Icons';

interface NavEntry {
  ruta: RutaApp;
  titulo: string;
  subtitulo: string;
  icon: React.ReactNode;
  soloPracticar?: boolean;
  badge?: number;
}

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return 'SB';
  }
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function Sidebar() {
  const store = useStore();
  const { ruta } = useRoute();
  const { standalone, abrirInstalacion } = useInstall();

  const pendientesVault = Vault.pendientes(store.errores).length;

  const items: NavEntry[] = [
    {
      ruta: '/dashboard',
      titulo: 'Dashboard',
      subtitulo: 'Inicio y evolución',
      icon: <IconDashboard size={19} />,
    },
    {
      ruta: '/jugar',
      titulo: 'Jugar',
      subtitulo: 'Juegos de 2-5 minutos',
      icon: <IconJugar size={19} />,
      soloPracticar: true,
    },
    {
      ruta: '/supuestos',
      titulo: 'Supuestos',
      subtitulo: 'Problemas tipo examen',
      icon: <IconSupuestos size={19} />,
    },
    {
      ruta: '/flashcards',
      titulo: 'Flashcards',
      subtitulo: 'Cuentas y fórmulas',
      icon: <IconFlashcards size={19} />,
      soloPracticar: true,
    },
    {
      ruta: '/vault',
      titulo: 'Error Vault',
      subtitulo: 'Registro de fallos',
      icon: <IconVault size={19} />,
      badge: pendientesVault,
    },
    {
      ruta: '/ajustes',
      titulo: 'Ajustes',
      subtitulo: 'IA, datos e instalación',
      icon: <IconAjustes size={19} />,
    },
  ];

  const visibles =
    store.modo === 'examen'
      ? items.filter((item) => !item.soloPracticar)
      : items;

  const cambiarModo = (nuevoModo: ModoApp) => {
    Store.update({ modo: nuevoModo });
    if (nuevoModo === 'examen') {
      go('/supuestos');
    }
  };

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      {/* Cabecera: 3 puntos decorativos (escritorio) + logo Saldo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 4px 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            aria-hidden="true"
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#FF5F57',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#FEBC2E',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#28C840',
                display: 'inline-block',
              }}
            />
          </div>
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
        </div>
      </div>

      {/* Control segmentado Practicar | Examen */}
      <div
        className="segmented"
        role="tablist"
        aria-label="Modo de estudio"
        style={{ width: '100%' }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={store.modo === 'practicar'}
          className={`segmented-btn ${store.modo === 'practicar' ? 'is-active' : ''}`}
          style={{ flex: 1 }}
          onClick={() => cambiarModo('practicar')}
        >
          <IconPracticar size={14} />
          <span>Practicar</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={store.modo === 'examen'}
          className={`segmented-btn ${store.modo === 'examen' ? 'is-active' : ''}`}
          style={{ flex: 1 }}
          onClick={() => cambiarModo('examen')}
        >
          <IconExamen size={14} />
          <span>Examen</span>
        </button>
      </div>

      {/* Menú lateral */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {visibles.map((item) => {
          const activo = ruta === item.ruta;
          return (
            <button
              key={item.ruta}
              type="button"
              className={`nav-item ${activo ? 'is-active' : ''}`}
              onClick={() => go(item.ruta)}
              aria-current={activo ? 'page' : undefined}
            >
              <span
                style={{
                  color: activo ? '#111111' : '#6B6B6B',
                  display: 'inline-flex',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                }}
              >
                <span className="nav-title">{item.titulo}</span>
                <span className="nav-subtitle">{item.subtitulo}</span>
              </span>
              {typeof item.badge === 'number' && (
                <span className="nav-badge" aria-label={`${item.badge} pendientes`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Pie: Cuadro de cuentas + Instalar Saldo + Perfil */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          paddingTop: 10,
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <button
          type="button"
          className="btn-sec"
          style={{ width: '100%' }}
          onClick={abrirCuadroCuentas}
        >
          <IconLibro size={16} />
          <span>Cuadro de cuentas</span>
        </button>

        {!standalone && (
          <button
            type="button"
            className="btn-sec"
            style={{ width: '100%' }}
            onClick={abrirInstalacion}
          >
            <IconInstalar size={16} />
            <span>Instalar Saldo</span>
          </button>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '4px 4px',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
              letterSpacing: '0.02em',
            }}
            aria-hidden="true"
          >
            {obtenerIniciales(store.perfil.nombre)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: '#111111',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {store.perfil.nombre}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: '#6B6B6B',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Contabilidad Financiera
            </div>
          </div>
          <button
            type="button"
            onClick={() => go('/ajustes')}
            aria-label="Abrir Ajustes"
            title="Ajustes"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              background: ruta === '/ajustes' ? '#FFFFFF' : 'transparent',
              color: '#6B6B6B',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <IconAjustes size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
