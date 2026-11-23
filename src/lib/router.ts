import { useEffect, useState } from 'react';

export type RutaApp =
  | '/dashboard'
  | '/jugar'
  | '/supuestos'
  | '/flashcards'
  | '/vault'
  | '/ajustes';

const RUTAS_VALIDAS: ReadonlySet<string> = new Set([
  '/dashboard',
  '/jugar',
  '/supuestos',
  '/flashcards',
  '/vault',
  '/ajustes',
]);

export interface RouteState {
  ruta: RutaApp;
  subruta?: string;
  query: Record<string, string>;
}

function parseHash(): RouteState {
  const rawHash = window.location.hash || '#/dashboard';
  const sinAlmohadilla = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
  const [pathPart, searchPart = ''] = sinAlmohadilla.split('?');
  const pathNormalizado = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;

  let ruta: RutaApp = '/dashboard';
  let subruta: string | undefined;

  if (pathNormalizado.startsWith('/jugar/')) {
    ruta = '/jugar';
    const resto = pathNormalizado.slice('/jugar/'.length).replace(/^\/+|\/+$/g, '');
    if (resto) {
      subruta = decodeURIComponent(resto);
    }
  } else if (RUTAS_VALIDAS.has(pathNormalizado)) {
    ruta = pathNormalizado as RutaApp;
  }

  const params = new URLSearchParams(searchPart);
  const query: Record<string, string> = {};
  params.forEach((value, key) => {
    query[key] = value;
  });

  return { ruta, subruta, query };
}

export function go(ruta: string): void {
  const limpio = ruta.startsWith('#') ? ruta.slice(1) : ruta;
  const destino = limpio.startsWith('/') ? `#${limpio}` : `#/${limpio}`;
  if (window.location.hash !== destino) {
    window.location.hash = destino;
  }
}

export function useRoute(): RouteState {
  const [route, setRoute] = useState<RouteState>(() => parseHash());

  useEffect(() => {
    if (!window.location.hash) {
      window.location.replace('#/dashboard');
    }
    const onHashChange = () => {
      setRoute(parseHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
