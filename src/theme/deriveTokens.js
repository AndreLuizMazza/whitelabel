// src/lib/theme/deriveTokens.js
const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));

function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0');
  const n = parseInt(full.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex({ r, g, b }) { const to = v => v.toString(16).padStart(2, '0'); return `#${to(r)}${to(g)}${to(b)}`; }
function rgbToHsl({ r, g, b }) {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  let h = 0;
  if (d) {
    switch (max) { case R: h = ((G - B) / d + (G < B ? 6 : 0)); break;
      case G: h = (B - R) / d + 2; break;
      default: h = (R - G) / d + 4; }
    h *= 60;
  }
  const l = (max + min) / 1.999999;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return { h, s, l };
}
function hslToRgb({ h, s, l }) {
  const C = (1 - Math.abs(2 * l - 1)) * s;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - C / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = C; g = X; b = 0; }
  else if (60 <= h && h < 120) { r = X; g = C; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = C; b = X; }
  else if (180 <= h && h < 240) { r = 0; g = X; b = C; }
  else if (240 <= h && h < 300) { r = X; g = 0; b = C; }
  else { r = C; g = 0; b = X; }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}
function hslToHex(hsl) { return rgbToHex(hslToRgb(hsl)); }
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const m = (x, y) => Math.round(x + (y - x) * clamp(t));
  return rgbToHex({ r: m(A.r, B.r), g: m(A.g, B.g), b: m(A.b, B.b) });
}
function relLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map(v => v / 255).map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}
function contrastRatio(fg, bg) {
  const L1 = relLuminance(fg), L2 = relLuminance(bg);
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
function ensureContrast(fg, bg, min = 4.5) {
  if (contrastRatio(fg, bg) >= min) return fg;
  const options = ['#000000', '#FFFFFF', fg];
  let best = options[0], bestC = 0;
  for (const c of options) { const cr = contrastRatio(c, bg); if (cr > bestC) { bestC = cr; best = c; } }
  if (bestC >= min) return best;
  const hsl = rgbToHsl(hexToRgb(fg));
  for (let step = 0; step < 24; step++) {
    const delta = (step + 1) * 0.03;
    for (const sign of [+1, -1]) {
      const l = clamp(hsl.l + sign * delta);
      const candidate = hslToHex({ ...hsl, l });
      if (contrastRatio(candidate, bg) >= min) return candidate;
    }
  }
  return best;
}
function pickOnColor(bg) {
  const whiteBetter = contrastRatio('#FFFFFF', bg) >= contrastRatio('#000000', bg);
  const on = whiteBetter ? '#FFFFFF' : '#000000';
  return ensureContrast(on, bg, 4.5);
}

export function deriveTokens(base = {}) {
  const primary = (base['--primary'] || '#5B3DF8').trim();
  const onPrimaryBase = (base['--on-primary'] || '#FFFFFF').trim();
  const surface = (base['--surface'] || '#FFFFFF').trim();
  const surfaceAlt = (base['--surface-alt'] || mixHex(surface, '#000000', 0.04)).trim();
  const textBase = (base['--text'] || '#1A1A1A').trim();

  const P = rgbToHsl(hexToRgb(primary));
  const mk = (dl, s = P.s) => hslToHex({ h: P.h, s, l: clamp(P.l + dl) });

  const p50  = mk(+0.36), p100 = mk(+0.28), p200 = mk(+0.20), p300 = mk(+0.12);
  const p400 = mk(+0.06), p500 = mk(0),     p600 = mk(-0.06), p700 = mk(-0.12);
  const p800 = mk(-0.18), p900 = mk(-0.26);

  const onPrimary = ensureContrast(onPrimaryBase, p600, 4.5);

  const textStrong = ensureContrast(textBase, surface, 7);
  const textMuted  = ensureContrast(mixHex(textStrong, surface, 0.35), surface, 4.5);
  const textWeak   = ensureContrast(mixHex(textStrong, surface, 0.55), surface, 3.2);

  const borderWeak   = mixHex(textStrong, surface, 0.88);
  const borderStrong = mixHex(textStrong, surface, 0.75);

  // superfícies elevadas (sutileza no mesmo tom)
  const surfaceElev1 = mixHex(surface, p900, 0.03);
  const surfaceElev2 = mixHex(surface, p900, 0.06);
  const surfaceElev3 = mixHex(surface, p900, 0.10);

  // navegação (fallbacks, só se não vierem do tenant)
  const navHoverBg   = base['--nav-hover-bg']   || mixHex(primary, surface, 0.90);
  const navActiveBg  = base['--nav-active-bg']  || mixHex(primary, surface, 0.82);
  const navActiveCol = base['--nav-active-color'] || primary;

  // botões e badges
  const buttonHover  = base['--button-hover']  || mixHex(p600, surface, 0.12);
  const buttonActive = base['--button-active'] || mixHex(p700, surface, 0.18);

  const badgeSuccessBg = base['--badge-success-bg'] || mixHex(p400, surface, 0.86);
  const badgeWarnBg    = base['--badge-warn-bg']    || mixHex(p300, surface, 0.86);
  const badgeDangerBg  = base['--badge-danger-bg']  || mixHex(p700, surface, 0.85);
  const badgeFg        = base['--badge-fg']         || ensureContrast(p700, badgeSuccessBg, 4.5);

  const onSurfaceAuto = pickOnColor(surface);

  return {
    '--primary': primary,
    '--on-primary': onPrimary,
    '--surface': surface,
    '--surface-alt': surfaceAlt,
    '--text': textStrong,
    '--text-muted': textMuted,
    '--text-weak': textWeak,
    '--c-border': borderWeak,
    '--c-border-strong': borderStrong,

    '--primary-50': p50,
    '--primary-100': p100,
    '--primary-200': p200,
    '--primary-300': p300,
    '--primary-400': p400,
    '--primary-500': p500,
    '--primary-600': p600,
    '--primary-700': p700,
    '--primary-800': p800,
    '--primary-900': p900,

    '--surface-elev-1': surfaceElev1,
    '--surface-elev-2': surfaceElev2,
    '--surface-elev-3': surfaceElev3,

    '--nav-hover-bg': navHoverBg,
    '--nav-active-bg': navActiveBg,
    '--nav-active-color': navActiveCol,

    '--button-hover': buttonHover,
    '--button-active': buttonActive,

    '--badge-success-bg': badgeSuccessBg,
    '--badge-warn-bg': badgeWarnBg,
    '--badge-danger-bg': badgeDangerBg,
    '--badge-fg': badgeFg,

    '--on-surface-auto': onSurfaceAuto
  };
}

export function injectCssVars(vars, root = document.documentElement) {
  Object.entries(vars || {}).forEach(([k, v]) => { try { root.style.setProperty(k, v); } catch {} });
}

export function applyTenantTheme(tenantTokens) {
  const derived = deriveTokens(tenantTokens || {});
  injectCssVars({ ...tenantTokens, ...derived });
  return { base: tenantTokens, derived };
}
