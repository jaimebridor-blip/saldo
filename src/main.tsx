import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initInstall } from './lib/install';
import { Selftest } from './lib/selftest';

const AVISO_GLOBAL_ID = 'saldo-global-error-notice';

function mostrarAvisoErrorGlobal(mensaje: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  const existente = document.getElementById(AVISO_GLOBAL_ID);
  if (existente) {
    const detalle = existente.querySelector('[data-detalle]');
    if (detalle && mensaje) {
      detalle.textContent = mensaje;
    }
    return;
  }

  const contenedor = document.createElement('div');
  contenedor.id = AVISO_GLOBAL_ID;
  contenedor.setAttribute('role', 'alert');
  contenedor.setAttribute('aria-live', 'polite');
  contenedor.style.position = 'fixed';
  contenedor.style.left = '16px';
  contenedor.style.right = '16px';
  contenedor.style.bottom = 'calc(76px + env(safe-area-inset-bottom, 0px))';
  contenedor.style.maxWidth = '520px';
  contenedor.style.margin = '0 auto';
  contenedor.style.zIndex = '90';
  contenedor.style.background = '#FFFFFF';
  contenedor.style.color = '#111111';
  contenedor.style.borderRadius = '18px';
  contenedor.style.padding = '12px 14px';
  contenedor.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.14)';
  contenedor.style.border = '1px solid rgba(0, 0, 0, 0.08)';
  contenedor.style.display = 'flex';
  contenedor.style.alignItems = 'center';
  contenedor.style.justifyContent = 'space-between';
  contenedor.style.gap = '12px';
  contenedor.style.flexWrap = 'wrap';
  contenedor.style.fontFamily =
    '-apple-system, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif';

  const textoWrap = document.createElement('div');
  textoWrap.style.minWidth = '0';
  textoWrap.style.flex = '1 1 200px';

  const titulo = document.createElement('div');
  titulo.textContent = 'Se ha producido un fallo inesperado';
  titulo.style.fontSize = '13.5px';
  titulo.style.fontWeight = '600';

  const detalle = document.createElement('div');
  detalle.setAttribute('data-detalle', '1');
  detalle.textContent = mensaje || 'Puedes reintentar para restablecer la vista.';
  detalle.style.fontSize = '12px';
  detalle.style.color = '#525252';
  detalle.style.marginTop = '2px';

  textoWrap.appendChild(titulo);
  textoWrap.appendChild(detalle);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Reintentar';
  btn.className = 'btn';
  btn.style.minHeight = '40px';
  btn.style.padding = '0 16px';
  btn.style.borderRadius = '999px';
  btn.style.background = '#111111';
  btn.style.color = '#FFFFFF';
  btn.style.border = 'none';
  btn.style.fontSize = '13px';
  btn.style.fontWeight = '600';
  btn.style.cursor = 'pointer';
  btn.onclick = () => {
    contenedor.remove();
    window.location.reload();
  };

  contenedor.appendChild(textoWrap);
  contenedor.appendChild(btn);
  document.body.appendChild(contenedor);
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    event.preventDefault();
    const msg =
      event.error instanceof Error
        ? event.error.message
        : event.message || 'Error de ejecución en la página.';
    mostrarAvisoErrorGlobal(msg);
  });

  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    const reason = event.reason;
    const msg =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Error asíncrono inesperado.';
    mostrarAvisoErrorGlobal(msg);
  });
}

initInstall();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

setTimeout(() => {
  Selftest.run();
}, 0);
