export const Fmt = {
  num(x: number): string {
    if (typeof x !== 'number' || !Number.isFinite(x)) {
      return '—';
    }
    const rounded = Math.round(x * 100) / 100;
    const clean = Object.is(rounded, -0) ? 0 : rounded;
    const negative = clean < 0;
    const abs = Math.abs(clean);
    const isInt = Math.abs(abs - Math.round(abs)) < 1e-9;

    const fixed = isInt ? String(Math.round(abs)) : abs.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    const formatted = decPart !== undefined ? `${grouped},${decPart}` : grouped;
    return negative ? `-${formatted}` : formatted;
  },

  eur(x: number): string {
    if (typeof x !== 'number' || !Number.isFinite(x)) {
      return '—';
    }
    return `${Fmt.num(x)} €`;
  },

  fecha(valor?: Date | string | number): string {
    if (valor === undefined || valor === null || valor === '') {
      return '—';
    }
    if (typeof valor === 'string') {
      const isoMatch = valor.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
      }
      const dmyMatch = valor.trim().match(/^(\d{2})\/(\d{2})\/(\d{4}|20X\d)$/i);
      if (dmyMatch) {
        return `${dmyMatch[1]}/${dmyMatch[2]}/${dmyMatch[3]}`;
      }
    }
    const d = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  },

  fechaHora(ts: number): string {
    if (typeof ts !== 'number' || !Number.isFinite(ts)) {
      return '—';
    }
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${Fmt.fecha(d)} · ${hh}:${min}`;
  },

  parse(texto: string): number {
    if (typeof texto !== 'string') {
      return NaN;
    }
    let s = texto
      .trim()
      .replace(/€/g, '')
      .replace(/[\s\u00A0]/g, '')
      .replace(/−/g, '-');

    if (!s || s === '-' || s === '+') {
      return NaN;
    }

    const hasComma = s.includes(',');
    const hasDot = s.includes('.');

    if (hasComma && hasDot) {
      const lastComma = s.lastIndexOf(',');
      const lastDot = s.lastIndexOf('.');
      if (lastComma > lastDot) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
    } else if (hasComma) {
      const parts = s.split(',');
      if (parts.length > 2) {
        return NaN;
      }
      s = s.replace(',', '.');
    } else if (hasDot) {
      if (/^[+-]?\d{1,3}(\.\d{3})+$/.test(s)) {
        s = s.replace(/\./g, '');
      } else if (s.split('.').length > 2) {
        return NaN;
      }
    }

    if (!/^[+-]?\d+(\.\d+)?$/.test(s)) {
      return NaN;
    }

    const value = Number(s);
    return Number.isFinite(value) ? value : NaN;
  },
};
