# Saldo — Práctica de Contabilidad Financiera

Aplicación web instalable (PWA) de Contabilidad Financiera adaptada al Plan General Contable español (PGC / PYMES). Funciona completamente en local y sin backend ni inteligencia artificial obligatoria: incluye banco fijo de ejercicios verificados, generador paramétrico infinito, corrección contable línea a línea, 7 minijuegos, supuestos de examen con PyG y Balance, tarjetas Leitner y registro automático de fallos (Error Vault).

## Desarrollo local

```bash
npm install
npm run dev
```

Para generar la build estática de producción (carpeta `dist/`):

```bash
npm run build
```

## Despliegue en GitHub Pages (3 pasos)

1. Sube este repositorio a GitHub en la rama `main`.
2. En tu repositorio, entra en **Settings → Pages** y en **Build and deployment → Source** selecciona **GitHub Actions**.
3. El flujo `.github/workflows/deploy.yml` compilará `dist/` y publicará la web estática automáticamente en cada push a `main`.

> **IA opcional:** si quieres generar supuestos adicionales o pedir explicaciones personalizadas en los resultados, puedes introducir tu clave gratuita de Gemini en **Ajustes → IA opcional** (se guarda solo en tu navegador; sin clave, toda la app funciona al 100 % sin realizar ninguna llamada de red).
