// Color tokens map to CSS variables (defined per-theme in index.css) so the
// whole app re-themes when <html data-theme> flips. Fallbacks = light values,
// so colors still render even if the stylesheet hasn't loaded.
export const C = {
  pageBg: 'var(--c-pageBg, #f5f5fb)',
  sidebarBg: 'var(--c-sidebarBg, #ffffff)',
  sidebarBorder: 'var(--c-sidebarBorder, #ececf3)',
  headerBg: 'var(--c-headerBg, #15132b)',
  headerText: 'var(--c-headerText, #f5f5fb)',
  headerMuted: 'var(--c-headerMuted, #b7b5c6)',
  headerBorder: 'var(--c-headerBorder, rgba(255,255,255,.12))',
  headerSurface: 'var(--c-headerSurface, rgba(255,255,255,.06))',
  cardBg: 'var(--c-cardBg, #ffffff)',
  border: 'var(--c-border, #ececf3)',
  borderDark: 'var(--c-borderDark, #dcdbe8)',
  text: 'var(--c-text, #15132b)',
  textSecondary: 'var(--c-textSecondary, #6c6a82)',
  textMuted: 'var(--c-textMuted, #b7b5c6)',
  primary: 'var(--c-primary, #5b4be6)',
  primaryHover: 'var(--c-primaryHover, #4b37d8)',
  primaryLight: 'var(--c-primaryLight, #eeebff)',
  primaryText: 'var(--c-primaryText, #15132b)',
  purple: 'var(--c-purple, #8b5cf6)',
  green: 'var(--c-green, #0e8a5a)',
  amber: 'var(--c-amber, #ffb020)',
  // Failure states — kept distinct from `primary` so errors never read as brand.
  danger: 'var(--c-danger, #e11d48)',
  dangerText: 'var(--c-dangerText, #be123c)',
  dangerBg: 'var(--c-dangerBg, #fff1f2)',
  dangerBorder: 'var(--c-dangerBorder, #fecdd3)',
  shadowSm: 'var(--c-shadowSm, 0 1px 2px 0 rgba(20,19,43,.04), 0 1px 3px 0 rgba(20,19,43,.06))',
  shadowMd: 'var(--c-shadowMd, 0 10px 30px -18px rgba(20,19,43,.25))',
  shadowLg: 'var(--c-shadowLg, 0 12px 24px -8px rgba(91,75,230,.28), 0 4px 12px -4px rgba(91,75,230,.18))',
  waBg: 'var(--c-waBg, #e5ddd5)',
  // neutral surface aliases (used when migrating literal-heavy views)
  surface: 'var(--c-surface, #ffffff)',
  surfaceAlt: 'var(--c-surfaceAlt, #f5f5fb)',
  hover: 'var(--c-hover, #f1f0f7)',
  waBgPattern: 'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' viewBox=\'0 0 16 16\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h8v8H0z\' fill=\'%23d1d7db\' fill-opacity=\'0.15\'/%3E%3C/svg%3E")',
};

export const CHAT = {
  incomingBg: 'var(--c-incomingBg, #ffffff)',
  incomingText: 'var(--c-incomingText, #111b21)',
  outgoingBg: 'var(--c-outgoingBg, #d9fdd3)',
  outgoingText: 'var(--c-outgoingText, #111b21)',
  chatBg: 'var(--c-chatBg, #e5ddd5)',
  bubbleRadius: '7.5px',
  bubblePadding: '6px 7px 8px 9px',
  statusDelivered: 'var(--c-statusDelivered, #53bdeb)',
  statusRead: 'var(--c-statusRead, #53bdeb)',
  statusSent: 'var(--c-statusSent, #8696a0)',
};

// Type stack shared with the Indefine LMS portal (see index.html for loading).
export const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
// Display face, used for the wordmark — the LMS uses it for headings.
export const DISPLAY = "'Schibsted Grotesk', 'Plus Jakarta Sans', sans-serif";
export const MONO = "'DM Mono', monospace";

export function relativeTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Mask a phone number for display — keep the first 2 and last 3 digits, star the
// rest (e.g. "919487722330" -> "91*******330", "93xxxxx678" -> "93*****678").
// Used directly for non-interactive contexts (<option>, strings); the
// MaskedNumber component wraps this with click-to-reveal for JSX.
export function maskPhone(raw) {
  const s = String(raw ?? '');
  const digits = s.replace(/\D/g, '');
  if (digits.length <= 5) return s; // too short to meaningfully mask
  return digits.slice(0, 2) + '*'.repeat(digits.length - 5) + digits.slice(-3);
}

// Tag colors are stored as pale pastels (good as light fills, unreadable with
// the white chip text). Darken a hex color so a white label reads clearly while
// the tag keeps its own hue. Falls back to a dark slate for missing/invalid.
export function darkenColor(hex, factor = 0.5) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex || '');
  if (!m) return '#3a3852';
  const n = parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

// Trigger a client-side download of a JS object as a pretty-printed .json file.
export function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Slugify a name into a safe filename fragment.
export function slugifyName(name) {
  return String(name || 'export').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'export';
}

export function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
