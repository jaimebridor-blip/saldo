import React from 'react';

export type MascotEstado = 'reposo' | 'feliz' | 'triste' | 'pensando';

export interface MascotProps {
  color: string;
  estado?: MascotEstado;
  size?: number;
  className?: string;
}

export function Mascot({
  color,
  estado = 'reposo',
  size = 68,
  className = '',
}: MascotProps) {
  const clampSize = `clamp(${Math.max(36, Math.round(size * 0.72))}px, 14vw, ${size}px)`;
  return (
    <div
      className={`mascot-blob is-${estado} ${className}`.trim()}
      style={{
        width: clampSize,
        height: clampSize,
        backgroundColor: color,
      }}
      role="img"
      aria-label={`Mascota Saldo en estado ${estado}`}
    >
      <div className="mascot-eyes">
        <span className="mascot-eye mascot-eye-left" />
        <span className="mascot-eye mascot-eye-right" />
      </div>
    </div>
  );
}
