import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

export function LogoBalanza({ size = 22, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 4.5V19.5" />
      <path d="M8.5 19.5H15.5" />
      <path d="M4.5 7H19.5" />
      <path d="M5.5 7L3 13.5" />
      <path d="M5.5 7L8 13.5" />
      <path d="M2.5 13.5H8.5C8.5 15.3 7.15 16.5 5.5 16.5C3.85 16.5 2.5 15.3 2.5 13.5Z" />
      <path d="M18.5 7L16 13.5" />
      <path d="M18.5 7L21 13.5" />
      <path d="M15.5 13.5H21.5C21.5 15.3 20.15 16.5 18.5 16.5C16.85 16.5 15.5 15.3 15.5 13.5Z" />
    </svg>
  );
}

export function IconDashboard({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  );
}

export function IconJugar({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="7 5 19 12 7 19 7 5" />
    </svg>
  );
}

export function IconSupuestos({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 3.5H15L19 7.5V20.5H7C5.9 20.5 5 19.6 5 18.5V5.5C5 4.4 5.9 3.5 7 3.5Z" />
      <path d="M14.5 3.5V8H19" />
      <path d="M9 12H15" />
      <path d="M9 15.5H15" />
    </svg>
  );
}

export function IconFlashcards({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="6.5" width="14" height="13" rx="2.5" />
      <path d="M8 4H17.5C18.88 4 20 5.12 20 6.5V15.5" />
      <path d="M8.5 11.5H13.5" />
      <path d="M8.5 14.5H12" />
    </svg>
  );
}

export function IconVault({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.5 7.5H19.5V18.5C19.5 19.6 18.6 20.5 17.5 20.5H6.5C5.4 20.5 4.5 19.6 4.5 18.5V7.5Z" />
      <path d="M3.5 4.5H20.5V7.5H3.5V4.5Z" />
      <path d="M10 12.5H14" />
    </svg>
  );
}

export function IconAjustes({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export function IconPracticar({ size = 15, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M13 3L5 14H12L11 21L19 10H12L13 3Z" />
    </svg>
  );
}

export function IconExamen({ size = 15, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5V13.5L14.5 15" />
      <path d="M9.5 3.5H14.5" />
    </svg>
  );
}

export function IconFlecha({ size = 15, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12H19" />
      <path d="M13 6L19 12L13 18" />
    </svg>
  );
}

export function IconInstalar({ size = 16, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 4V15" />
      <path d="M7.5 10.5L12 15L16.5 10.5" />
      <path d="M4.5 17.5V19C4.5 19.83 5.17 20.5 6 20.5H18C18.83 20.5 19.5 19.83 19.5 19V17.5" />
    </svg>
  );
}

export function IconOjo({
  size = 18,
  abierto = true,
  className = '',
}: IconProps & { abierto?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 12C4.8 7.8 8.1 6 12 6C15.9 6 19.2 7.8 21.5 12C19.2 16.2 15.9 18 12 18C8.1 18 4.8 16.2 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
      {!abierto && <path d="M4 4L20 20" />}
    </svg>
  );
}
