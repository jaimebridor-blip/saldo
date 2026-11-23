import React from 'react';
import { go, useRoute, type RutaApp } from '../lib/router';
import { useStore } from '../lib/store';
import { Vault } from '../lib/vault';
import {
  IconDashboard,
  IconFlashcards,
  IconJugar,
  IconSupuestos,
  IconVault,
} from './Icons';

interface TabEntry {
  ruta: RutaApp;
  label: string;
  icon: React.ReactNode;
  soloPracticar?: boolean;
  badge?: number;
}

export function BottomNav() {
  const store = useStore();
  const { ruta } = useRoute();
  const pendientes = Vault.pendientes(store.errores).length;

  const tabs: TabEntry[] = [
    {
      ruta: '/dashboard',
      label: 'Resumen',
      icon: <IconDashboard size={20} />,
    },
    {
      ruta: '/jugar',
      label: 'Jugar',
      icon: <IconJugar size={20} />,
      soloPracticar: true,
    },
    {
      ruta: '/supuestos',
      label: 'Supuestos',
      icon: <IconSupuestos size={20} />,
    },
    {
      ruta: '/flashcards',
      label: 'Tarjetas',
      icon: <IconFlashcards size={20} />,
      soloPracticar: true,
    },
    {
      ruta: '/vault',
      label: 'Vault',
      icon: <IconVault size={20} />,
      badge: pendientes,
    },
  ];

  const visibles =
    store.modo === 'examen'
      ? tabs.filter((tab) => !tab.soloPracticar)
      : tabs;

  return (
    <nav className="bottom-nav" aria-label="Navegación inferior">
      {visibles.map((tab) => {
        const activo = ruta === tab.ruta;
        return (
          <button
            key={tab.ruta}
            type="button"
            className={`bottom-nav-btn ${activo ? 'is-active' : ''}`}
            onClick={() => go(tab.ruta)}
            aria-current={activo ? 'page' : undefined}
          >
            {tab.icon}
            <span className="bottom-nav-label">{tab.label}</span>
            {typeof tab.badge === 'number' && tab.badge > 0 && (
              <span className="bottom-nav-badge">{tab.badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
