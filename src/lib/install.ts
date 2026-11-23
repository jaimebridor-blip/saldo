import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="39.6" ry="39.6" fill="#111111" />
  <g transform="translate(25.2, 25.2) scale(5.4)" fill="none" stroke="#FFFFFF" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 4.5V19.5" />
    <path d="M8.5 19.5H15.5" />
    <path d="M4.5 7H19.5" />
    <path d="M5.5 7L3 13.5" />
    <path d="M5.5 7L8 13.5" />
    <path d="M2.5 13.5H8.5C8.5 15.3 7.15 16.5 5.5 16.5C3.85 16.5 2.5 15.3 2.5 13.5Z" />
    <path d="M18.5 7L16 13.5" />
    <path d="M18.5 7L21 13.5" />
    <path d="M15.5 13.5H21.5C21.5 15.3 20.15 16.5 18.5 16.5C16.85 16.5 15.5 15.3 15.5 13.5Z" />
  </g>
</svg>`;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<() => void>();
let modalVisible = false;
let initialized = false;

function notificar(): void {
  for (const fn of installListeners) {
    fn();
  }
}

export function esModoStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

export function generarAppleTouchIcon(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const svgBlob = new Blob([ICON_SVG], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  const img = new Image();

  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      ctx.drawImage(img, 0, 0, 180, 180);
      const pngUrl = canvas.toDataURL('image/png');

      let link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'apple-touch-icon';
        document.head.appendChild(link);
      }
      link.href = pngUrl;
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  };

  img.onerror = () => {
    URL.revokeObjectURL(svgUrl);
  };

  img.src = svgUrl;
}

export function initInstall(): void {
  if (initialized || typeof window === 'undefined') {
    return;
  }
  initialized = true;
  generarAppleTouchIcon();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notificar();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    modalVisible = false;
    notificar();
  });
}

export function useInstall() {
  const [, setTick] = useState(0);
  const [standalone, setStandalone] = useState(() => esModoStandalone());

  useEffect(() => {
    initInstall();
    const update = () => {
      setStandalone(esModoStandalone());
      setTick((n) => n + 1);
    };
    installListeners.add(update);

    const mq = window.matchMedia('(display-mode: standalone)');
    const onMq = () => update();
    mq.addEventListener?.('change', onMq);

    return () => {
      installListeners.delete(update);
      mq.removeEventListener?.('change', onMq);
    };
  }, []);

  const abrirInstalacion = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } finally {
        deferredPrompt = null;
        notificar();
      }
      return;
    }
    modalVisible = true;
    notificar();
  };

  const cerrarInstrucciones = () => {
    modalVisible = false;
    notificar();
  };

  return {
    standalone,
    tienePromptNativo: deferredPrompt !== null,
    mostrarInstrucciones: modalVisible,
    abrirInstalacion,
    cerrarInstrucciones,
  };
}
