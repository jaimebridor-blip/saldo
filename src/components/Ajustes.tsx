import React, { useEffect, useRef, useState } from 'react';
import { AI } from '../lib/ai';
import { Engine, type ResultadoCorreccion } from '../lib/engine';
import { Fmt } from '../lib/fmt';
import { useInstall } from '../lib/install';
import { Selftest, useSelftest } from '../lib/selftest';
import { Store, useStore, type StoreState } from '../lib/store';
import type { Asiento, Linea } from '../lib/types';
import {
  EditorAsiento,
  type EditorAsientoHandle,
} from './EditorAsiento';
import { Header } from './Header';
import { IconInstalar, IconOjo } from './Icons';
import { MayorVista } from './MayorVista';

const ASIENTO_PRUEBA: Asiento = {
  fecha: '2026-11-22',
  concepto: 'Compra de mercaderías por 10.000 € con IVA 21 % a crédito',
  lineas: [
    {
      c: '600',
      d: 10000,
      h: 0,
      por: 'Compra de mercaderías (gasto, aumenta en el Debe)',
    },
    {
      c: '472',
      d: 2100,
      h: 0,
      por: 'IVA soportado deducible al 21 % sobre 10.000 € (activo)',
    },
    {
      c: '400',
      d: 0,
      h: 12100,
      por: 'Deuda total con el proveedor (pasivo, aumenta en el Haber)',
    },
  ],
};

const LINEAS_DESORDENADAS: Linea[] = [
  { c: '400', d: 0, h: 12100 },
  { c: '472', d: 2100, h: 0 },
  { c: '600', d: 10000, h: 0 },
];

interface ConfirmState {
  titulo: string;
  mensaje: string;
  botonConfirmar: string;
  peligro?: boolean;
  onConfirm: () => void;
}

function diasHasta(fechaIso: string): number | null {
  if (!fechaIso) {
    return null;
  }
  const [y, m, d] = fechaIso.split('-').map(Number);
  if (!y || !m || !d) {
    return null;
  }
  const objetivo = new Date(y, m - 1, d);
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const diff = objetivo.getTime() - hoy.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function Ajustes() {
  const store = useStore();
  const { standalone, abrirInstalacion } = useInstall();
  const selftest = useSelftest();

  const [nombre, setNombre] = useState(store.perfil.nombre);
  const [fechaExamen, setFechaExamen] = useState(store.fechaExamen);
  const [clave, setClave] = useState(store.ia.clave);
  const [modelo, setModelo] = useState(store.ia.modelo || 'gemini-2.5-flash');
  const [mostrarClave, setMostrarClave] = useState(false);

  const [estadoIA, setEstadoIA] = useState<{
    tipo: 'ok' | 'error' | 'info';
    texto: string;
  } | null>(null);
  const [probandoIA, setProbandoIA] = useState(false);
  const [estadoDatos, setEstadoDatos] = useState<{
    tipo: 'ok' | 'error';
    texto: string;
  } | null>(null);
  const [confirmacion, setConfirmacion] = useState<ConfirmState | null>(null);
  const [resultadoMotor, setResultadoMotor] =
    useState<ResultadoCorreccion | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorMotorRef = useRef<EditorAsientoHandle | null>(null);

  useEffect(() => {
    setNombre(store.perfil.nombre);
    setFechaExamen(store.fechaExamen);
    setClave(store.ia.clave);
    setModelo(store.ia.modelo || 'gemini-2.5-flash');
  }, [store.perfil.nombre, store.fechaExamen, store.ia.clave, store.ia.modelo]);

  useEffect(() => {
    editorMotorRef.current?.setLineas(LINEAS_DESORDENADAS);
  }, []);

  const comprobarMotor = (lineas: Linea[]) => {
    const res = Engine.corregir(ASIENTO_PRUEBA, lineas);
    setResultadoMotor(res);
    editorMotorRef.current?.marcar(res);
  };

  const actualizarNombre = (valor: string) => {
    setNombre(valor);
    Store.update((prev) => ({
      ...prev,
      perfil: { ...prev.perfil, nombre: valor.trim() ? valor : 'Jaime Brizuela' },
    }));
  };

  const actualizarFechaExamen = (valor: string) => {
    setFechaExamen(valor);
    Store.update({ fechaExamen: valor });
  };

  const guardarIA = () => {
    const modeloFinal = modelo.trim() || 'gemini-2.5-flash';
    setModelo(modeloFinal);
    Store.update({
      ia: {
        clave: clave.trim(),
        modelo: modeloFinal,
      },
    });
    setEstadoIA({
      tipo: 'ok',
      texto: clave.trim()
        ? 'Configuración de IA guardada en este dispositivo.'
        : 'Clave eliminada. La app sigue funcionando sin IA.',
    });
  };

  const probarClave = async () => {
    const claveActual = clave.trim();
    const modeloActual = modelo.trim() || 'gemini-2.5-flash';
    if (!claveActual) {
      setEstadoIA({
        tipo: 'error',
        texto: 'Introduce una clave antes de probarla.',
      });
      return;
    }

    setProbandoIA(true);
    setEstadoIA({ tipo: 'info', texto: 'Comprobando conexión con Gemini...' });
    const res = await AI.probar(claveActual, modeloActual);
    setProbandoIA(false);

    if (res.ok) {
      setEstadoIA({
        tipo: 'ok',
        texto: `Conexión correcta (${modeloActual}): "${res.texto}"`,
      });
    } else {
      setEstadoIA({
        tipo: 'error',
        texto: res.error,
      });
    }
  };

  const manejarSeleccionArchivo = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const archivo = event.target.files?.[0];
    event.target.value = '';
    if (!archivo) {
      return;
    }

    try {
      const texto = await archivo.text();
      const validacion = Store.validarImportacion(texto);
      if (!validacion.ok) {
        setEstadoDatos({ tipo: 'error', texto: validacion.error });
        return;
      }

      const estadoImportado: StoreState = validacion.state;
      setConfirmacion({
        titulo: 'Importar copia de seguridad',
        mensaje: `Se sobrescribirá tu progreso actual por: ${validacion.resumen}.`,
        botonConfirmar: 'Sobrescribir progreso',
        onConfirm: () => {
          Store.set(estadoImportado);
          setEstadoDatos({
            tipo: 'ok',
            texto: 'Copia de seguridad importada correctamente.',
          });
          setConfirmacion(null);
        },
      });
    } catch {
      setEstadoDatos({
        tipo: 'error',
        texto: 'No se pudo leer el archivo seleccionado.',
      });
    }
  };

  const pedirBorrado = () => {
    setConfirmacion({
      titulo: 'Borrar todo el progreso',
      mensaje:
        'Se eliminarán tus puntos XP, rachas, dominio por temas, errores guardados y configuración local.',
      botonConfirmar: 'Sí, borrar todo',
      peligro: true,
      onConfirm: () => {
        Store.reset();
        setEstadoIA(null);
        setEstadoDatos({
          tipo: 'ok',
          texto: 'Progreso restablecido a los valores iniciales.',
        });
        setConfirmacion(null);
      },
    });
  };

  const diasRestantes = diasHasta(fechaExamen);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Header
        titulo="Ajustes"
        subtitulo="IA, datos e instalación"
        accionTexto="Resumen"
        accionRuta="/dashboard"
      />

      <div className="cards-grid">
        {/* 1. Perfil */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Perfil</h2>
              <p className="card-subtitle">
                Nombre visible en la barra lateral y en tus copias de seguridad.
              </p>
            </div>
            <span className="chip">Grado</span>
          </div>

          <label
            htmlFor="ajustes-nombre"
            className="label"
            style={{ display: 'block', marginBottom: 8 }}
          >
            Nombre
          </label>
          <input
            id="ajustes-nombre"
            type="text"
            className="field"
            value={nombre}
            onChange={(e) => actualizarNombre(e.target.value)}
            placeholder="Jaime Brizuela"
          />
        </section>

        {/* 2. Examen */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Examen</h2>
              <p className="card-subtitle">
                Fecha prevista para calcular la cuenta atrás de estudio.
              </p>
            </div>
            {diasRestantes !== null && (
              <span className="chip-dark tabular-nums">
                {diasRestantes > 0
                  ? `${diasRestantes} días`
                  : diasRestantes === 0
                  ? 'Hoy'
                  : 'Pasado'}
              </span>
            )}
          </div>

          <label
            htmlFor="ajustes-fecha-examen"
            className="label"
            style={{ display: 'block', marginBottom: 8 }}
          >
            Fecha del examen
          </label>
          <input
            id="ajustes-fecha-examen"
            type="date"
            className="field tabular-nums"
            value={fechaExamen}
            onChange={(e) => actualizarFechaExamen(e.target.value)}
          />
        </section>

        {/* 3. IA opcional */}
        <section className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-head">
            <div>
              <h2 className="card-title">IA opcional</h2>
              <p className="card-subtitle">
                Solo se usa para ampliar explicaciones de errores o generar supuestos nuevos.
              </p>
            </div>
            <span className={AI.tieneClave() ? 'chip-dark' : 'chip'}>
              {AI.tieneClave() ? 'Activa' : 'Opcional'}
            </span>
          </div>

          <p
            style={{
              margin: '0 0 16px',
              fontSize: 13.5,
              color: '#444444',
              lineHeight: 1.55,
              background: '#EDEBE6',
              padding: '12px 14px',
              borderRadius: 14,
            }}
          >
            No es necesaria: la app funciona sin IA. Para activarla gratis: 1) entra
            en aistudio.google.com con tu cuenta de Google; 2) pulsa «Get API key» y
            luego «Create API key»; 3) copia la clave y pégala aquí. Si da error,
            restringe la clave a «Generative Language API»
          </p>

          <div className="cards-grid" style={{ marginBottom: 14 }}>
            <div>
              <label
                htmlFor="ajustes-ia-clave"
                className="label"
                style={{ display: 'block', marginBottom: 8 }}
              >
                Clave API de Google AI Studio
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="ajustes-ia-clave"
                  type={mostrarClave ? 'text' : 'password'}
                  className="field"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="AIza..."
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="btn-sec"
                  onClick={() => setMostrarClave((v) => !v)}
                  aria-label={mostrarClave ? 'Ocultar clave' : 'Mostrar clave'}
                  title={mostrarClave ? 'Ocultar clave' : 'Mostrar clave'}
                  style={{ padding: '0 14px', flexShrink: 0 }}
                >
                  <IconOjo size={18} abierto={mostrarClave} />
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="ajustes-ia-modelo"
                className="label"
                style={{ display: 'block', marginBottom: 8 }}
              >
                Modelo
              </label>
              <input
                id="ajustes-ia-modelo"
                type="text"
                className="field"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="gemini-2.5-flash"
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn" onClick={guardarIA}>
                Guardar
              </button>
              <button
                type="button"
                className="btn-sec"
                onClick={probarClave}
                disabled={probandoIA}
              >
                {probandoIA ? 'Probando...' : 'Probar clave'}
              </button>
            </div>
            <span style={{ fontSize: 12.5, color: '#6B6B6B' }}>
              La clave se guarda solo en este dispositivo
            </span>
          </div>

          {estadoIA && (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: 14,
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: 13,
                lineHeight: 1.45,
                background:
                  estadoIA.tipo === 'error'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : estadoIA.tipo === 'ok'
                    ? 'rgba(16, 185, 129, 0.14)'
                    : '#EDEBE6',
                color:
                  estadoIA.tipo === 'error'
                    ? '#991B1B'
                    : estadoIA.tipo === 'ok'
                    ? '#065F46'
                    : '#111111',
              }}
            >
              {estadoIA.texto}
            </div>
          )}
        </section>

        {/* 4. Datos */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Datos</h2>
              <p className="card-subtitle">
                Exporta o restaura tu progreso en formato JSON.
              </p>
            </div>
            <span className="chip">Local</span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-sec"
              onClick={() => {
                Store.exportar();
                setEstadoDatos({
                  tipo: 'ok',
                  texto: 'Archivo de copia de seguridad descargado.',
                });
              }}
            >
              Exportar
            </button>

            <button
              type="button"
              className="btn-sec"
              onClick={() => fileInputRef.current?.click()}
            >
              Importar
            </button>

            <button
              type="button"
              className="btn-sec"
              style={{ color: '#B91C1C' }}
              onClick={pedirBorrado}
            >
              Borrar progreso
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={manejarSeleccionArchivo}
          />

          {estadoDatos && (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: 13,
                background:
                  estadoDatos.tipo === 'error'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(16, 185, 129, 0.14)',
                color: estadoDatos.tipo === 'error' ? '#991B1B' : '#065F46',
              }}
            >
              {estadoDatos.texto}
            </div>
          )}
        </section>

        {/* 5. Instalar */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Instalar</h2>
              <p className="card-subtitle">
                Úsala en pantalla completa desde tu móvil u ordenador.
              </p>
            </div>
            <span className="chip">{standalone ? 'Instalada' : 'PWA'}</span>
          </div>

          {standalone ? (
            <p style={{ margin: 0, fontSize: 13.5, color: '#6B6B6B', lineHeight: 1.45 }}>
              Saldo ya está instalada y funcionando en modo aplicación independiente.
            </p>
          ) : (
            <button type="button" className="btn" onClick={abrirInstalacion}>
              <IconInstalar size={16} />
              <span>Instalar Saldo</span>
            </button>
          )}
        </section>

        {/* 6. Probar motor */}
        <section className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-head">
            <div>
              <h2 className="card-title">Probar motor</h2>
              <p className="card-subtitle">
                Asiento de ejemplo: compra de mercaderías de 10.000 € más IVA 21 % a crédito (el orden de las líneas no afecta a la corrección).
              </p>
            </div>
            <span className={resultadoMotor?.ok ? 'chip-dark' : 'chip'}>
              {resultadoMotor
                ? `${Math.round(resultadoMotor.puntos * 100)} % · ${
                    resultadoMotor.ok ? 'Correcto ✓' : 'Revisar'
                  }`
                : 'Motor PGC'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button
              type="button"
              className="btn-sec"
              style={{ padding: '0 14px' }}
              onClick={() => {
                setResultadoMotor(null);
                editorMotorRef.current?.setLineas(LINEAS_DESORDENADAS);
              }}
            >
              Orden invertido
            </button>
            <button
              type="button"
              className="btn-sec"
              style={{ padding: '0 14px' }}
              onClick={() => {
                setResultadoMotor(null);
                editorMotorRef.current?.setLineas(ASIENTO_PRUEBA.lineas);
              }}
            >
              Orden original
            </button>
            <button
              type="button"
              className="btn-sec"
              style={{ padding: '0 14px' }}
              onClick={() => {
                setResultadoMotor(null);
                editorMotorRef.current?.reset();
              }}
            >
              Limpiar
            </button>
          </div>

          <EditorAsiento
            ref={editorMotorRef}
            lineas={3}
            onComprobar={comprobarMotor}
          />

          {resultadoMotor && (
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: resultadoMotor.ok
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(245, 158, 11, 0.13)',
                  color: resultadoMotor.ok ? '#065F46' : '#92400E',
                  fontSize: 13.5,
                  fontWeight: 500,
                }}
              >
                {resultadoMotor.ok
                  ? '✓ Asiento correcto aunque cambie el orden de las líneas.'
                  : 'Revisa las líneas marcadas en el editor.'}
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: '#EDEBE6',
                  fontSize: 13,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-line',
                  color: '#111111',
                }}
              >
                <span
                  className="label"
                  style={{ display: 'block', marginBottom: 6 }}
                >
                  Explicación línea a línea
                </span>
                {Engine.explicar(ASIENTO_PRUEBA)}
              </div>

              <div>
                <span
                  className="label"
                  style={{ display: 'block', marginBottom: 8 }}
                >
                  Libro mayor del asiento
                </span>
                <MayorVista asientos={[ASIENTO_PRUEBA]} />
              </div>
            </div>
          )}
        </section>

        {/* 7. Autocomprobación */}
        <section
          className="card"
          style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 14 }}
          aria-live="polite"
        >
          <div className="card-head" style={{ marginBottom: 0 }}>
            <div>
              <h2 className="card-title">Autocomprobación</h2>
              <p className="card-subtitle">
                {selftest.estado === 'pendiente'
                  ? 'Ejecutando verificación automática sin bloquear el arranque...'
                  : `Última ejecución: ${
                      selftest.ejecutadoEn
                        ? Fmt.fechaHora(selftest.ejecutadoEn)
                        : '—'
                    } (${selftest.duracionMs} ms)`}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                className="chip tabular-nums"
                style={{
                  background:
                    selftest.estado === 'pendiente'
                      ? '#EDEBE6'
                      : selftest.ok
                        ? 'rgba(16, 185, 129, 0.14)'
                        : 'rgba(239, 68, 68, 0.12)',
                  color:
                    selftest.estado === 'pendiente'
                      ? '#111111'
                      : selftest.ok
                        ? '#065F46'
                        : '#991B1B',
                  fontWeight: 600,
                }}
              >
                {selftest.estado === 'pendiente'
                  ? 'Comprobando...'
                  : selftest.ok
                    ? '✓ Todo correcto'
                    : `✗ ${selftest.bloques.filter((b) => !b.ok).length} bloque(s) con error`}
              </span>

              <button
                type="button"
                className="btn-sec"
                onClick={() => Selftest.run()}
              >
                Repetir
              </button>
            </div>
          </div>

          {selftest.bloques.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selftest.bloques.map((bloque) => (
                <div
                  key={bloque.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.72)',
                    borderRadius: 14,
                    padding: '10px 14px',
                    border: `1px solid ${
                      bloque.ok ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.35)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        aria-hidden="true"
                        style={{
                          fontWeight: 700,
                          color: bloque.ok ? '#065F46' : '#991B1B',
                        }}
                      >
                        {bloque.ok ? '✓' : '✗'}
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111111' }}>
                        {bloque.nombre}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: bloque.ok ? '#065F46' : '#991B1B',
                      }}
                    >
                      {bloque.ok ? 'Correcto' : 'Con fallos'}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: 12.5, color: '#525252', lineHeight: 1.45 }}>
                    {bloque.resumen}
                  </p>

                  {bloque.errores.length > 0 && (
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: '#991B1B',
                        borderRadius: 10,
                        padding: '8px 10px',
                        fontSize: 12,
                        lineHeight: 1.45,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                      }}
                    >
                      {bloque.errores.slice(0, 6).map((err, eIdx) => (
                        <div key={eIdx}>· {err}</div>
                      ))}
                      {bloque.errores.length > 6 && (
                        <div>
                          … y {bloque.errores.length - 6} incidencia(s) adicional(es).
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selftest.plantillasDesactivadas.length > 0 && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.14)',
                color: '#92400E',
                borderRadius: 14,
                padding: '10px 14px',
                fontSize: 12.5,
                lineHeight: 1.45,
              }}
            >
              <strong>Plantillas desactivadas automáticamente:</strong>{' '}
              {selftest.plantillasDesactivadas.join(', ')}
            </div>
          )}
        </section>
      </div>

      {/* Modal de confirmación in-app (compatible con iframe) */}
      {confirmacion && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
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
          onClick={() => setConfirmacion(null)}
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
            <h3
              id="confirm-dialog-title"
              className="card-title"
              style={{ fontSize: 16, marginBottom: 8 }}
            >
              {confirmacion.titulo}
            </h3>
            <p
              style={{
                margin: '0 0 20px',
                fontSize: 13.5,
                color: '#6B6B6B',
                lineHeight: 1.5,
              }}
            >
              {confirmacion.mensaje}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn-sec"
                onClick={() => setConfirmacion(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                style={
                  confirmacion.peligro
                    ? { backgroundColor: '#B91C1C', color: '#FFFFFF' }
                    : undefined
                }
                onClick={confirmacion.onConfirm}
              >
                {confirmacion.botonConfirmar}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
