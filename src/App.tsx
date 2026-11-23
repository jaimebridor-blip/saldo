import React, { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { Ajustes } from './components/Ajustes';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { Flashcards } from './components/Flashcards';
import { Jugar } from './components/Jugar';
import { Sidebar } from './components/Sidebar';
import { Supuestos } from './components/Supuestos';
import { Vault } from './components/Vault';
import { useInstall } from './lib/install';
import { go, useRoute } from './lib/router';
import { useStore } from './lib/store';

interface ErrorBoundaryState {
  error: Error | null;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // El aviso discreto en pantalla sustituye a errores sin control.
  }

  render() {
    if (this.state.error) {
      return (
        <section
          className="card"
          role="alert"
          aria-live="polite"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxWidth: 540,
            margin: '24px auto',
          }}
        >
          <span className="label">Recuperación</span>
          <h2 className="card-title" style={{ fontSize: 17 }}>
            Algo no ha cargado bien en esta vista
          </h2>
          <p className="card-subtitle" style={{ fontSize: 13.5 }}>
            {this.state.error.message ||
              'Se ha producido un fallo inesperado al mostrar este apartado.'}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn"
              onClick={() => this.setState({ error: null })}
            >
              Reintentar
            </button>
            <button
              type="button"
              className="btn-sec"
              onClick={() => {
                this.setState({ error: null });
                go('/dashboard');
              }}
            >
              Ir al resumen
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const store = useStore();
  const { ruta } = useRoute();
  const { mostrarInstrucciones, cerrarInstrucciones } = useInstall();

  useEffect(() => {
    if (
      store.modo === 'examen' &&
      (ruta === '/jugar' || ruta === '/flashcards')
    ) {
      go('/supuestos');
    }
  }, [store.modo, ruta]);

  const renderPantalla = () => {
    switch (ruta) {
      case '/jugar':
        return store.modo === 'examen' ? <Supuestos /> : <Jugar />;
      case '/supuestos':
        return <Supuestos />;
      case '/flashcards':
        return store.modo === 'examen' ? <Supuestos /> : <Flashcards />;
      case '/vault':
        return <Vault />;
      case '/ajustes':
        return <Ajustes />;
      case '/dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-area">
        <div className="main-inner">
          <AppErrorBoundary key={ruta}>{renderPantalla()}</AppErrorBoundary>
        </div>
      </main>

      <BottomNav />

      {mostrarInstrucciones && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            backgroundColor: 'rgba(17, 17, 17, 0.35)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={cerrarInstrucciones}
        >
          <div
            className="card"
            style={{
              maxWidth: 420,
              width: '100%',
              background: '#FFFFFF',
              boxShadow: '0 20px 50px rgba(0,0,0,0.16)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-head">
              <div>
                <h2
                  id="install-dialog-title"
                  className="card-title"
                  style={{ fontSize: 16 }}
                >
                  Instalar Saldo
                </h2>
                <p className="card-subtitle">
                  Añade Saldo a la pantalla de inicio para usarla como aplicación.
                </p>
              </div>
              <span className="chip">PWA</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 18,
                fontSize: 13.5,
                lineHeight: 1.5,
                color: '#111111',
              }}
            >
              <div
                style={{
                  background: '#F4F2ED',
                  padding: '12px 14px',
                  borderRadius: 14,
                }}
              >
                <strong>iOS (Safari):</strong> Compartir → Añadir a pantalla de inicio
              </div>
              <div
                style={{
                  background: '#F4F2ED',
                  padding: '12px 14px',
                  borderRadius: 14,
                }}
              >
                <strong>Android (Chrome):</strong> menú ⋮ → Instalar aplicación
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn"
                onClick={cerrarInstrucciones}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
