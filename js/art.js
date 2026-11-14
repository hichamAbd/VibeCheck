// All drawings are made for VibeCheck. Every sticker is drawn once and
// rendered three times: a flat offset shadow, a white die-cut edge, then the
// coloured body. No inline style attributes (the content security policy
// forbids them): colours are plain SVG attributes.

export const INK = '#1A1F36';
// Mood colours, index = mood (0 = asleep / nothing yet, 1 = awful … 5 = great).
export const MOOD_COLORS = ['#C9CED8', '#D8392B', '#3D78D8', '#9AA6BA', '#2FB565', '#FFB21A'];

// Decorations: drawn once, rendered four times (offset shadow, white die-cut,
// ink outline, then the coloured body). Outline widths come from css/app.css.
function sticker(body, { cut = 10, cls = '', vb = '0 0 100 100' } = {}) {
  return `<svg viewBox="${vb}" class="stk cut-${cut} ${cls}" aria-hidden="true" focusable="false">` +
    `<g class="stk-shadow" transform="translate(2 3.5)">${body}</g>` +
    `<g class="stk-cut">${body}</g>` +
    `<g class="stk-ink">${body}</g>` +
    `<g class="stk-body">${body}</g></svg>`;
}

// ---------- Moody McMugface ----------
// A chunky diner mug with attitude. Everything is plain SVG attributes
// (the content security policy forbids inline styles).
const WHITE = '#FFFFFF';
const COFFEE = '#4A2B19';
const P = (d, c = INK, w = 5, extra = '') => `<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none" ${extra}/>`;
const dot = (x, y, r = 3.6, c = INK, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${extra}/>`;
const BODY = 'M10 32V80q0 12 12 12h40q12 0 12-12V32Z';
const HANDLE = 'M74 46q20 0 20 16q0 16-20 16';

function puff(x, y) {
  const d = `M${x} ${y}q-5 -6 0 -11q5 -5 0 -11`;
  return P(d, INK, 8) + P(d, WHITE, 3.6);
}
const STEAM = { 5: [28, 42, 56], 4: [35, 49], 3: [42], 2: [], 1: [], 0: [] };

const FACE = {
  // asleep: nothing posted yet
  0: P('M23 46h14M47 46h14', INK, 6) + P('M24 54q6 5 12 0M48 54q6 5 12 0', INK, 4.5) +
     `<ellipse cx="42" cy="72" rx="4" ry="3.2" fill="${INK}"/>` +
     P('M72 6h9l-9 10h9M86 -8h6l-6 7h6', INK, 3.5),
  // awful: steep brows, gritted teeth
  1: P('M23 43l15 9M61 43l-15 9', INK, 7) + dot(31, 58) + dot(53, 58) +
     `<rect x="30" y="67" width="24" height="10" rx="3" fill="${WHITE}" stroke="${INK}" stroke-width="3.2"/>` +
     P('M30 72h24M36 67v10M42 67v10M48 67v10', INK, 1.8),
  // bad: furrowed, frowning
  2: P('M23 45l15 6M61 45l-15 6', INK, 7) + dot(31, 57) + dot(53, 57) + P('M33 74q9-7 18 0', INK, 5),
  // okay: heavy flat brows, half-closed eyes
  3: P('M23 48h15M46 48h15', INK, 7) + P('M25 55h12M47 55h12', INK, 4) + dot(31, 57.5, 2.6) + dot(53, 57.5, 2.6) + P('M35 71h15', INK, 5),
  // good: one eyebrow up, smirk
  4: P('M24 46q7-7 14-3', INK, 6.5) + P('M46 47h14', INK, 6.5) + dot(31, 55) + dot(53, 55) + P('M32 71q11 5 20-5', INK, 5),
  // great: aviators and a big toothy grin
  5: `<path d="M22 49h16q2.5 0 2 3q-1.5 9-10 9q-8.5 0-10-9q-.5-3 2-3z" fill="${INK}"/>` +
     `<path d="M46 49h16q2.5 0 2 3q-1.5 9-10 9q-8.5 0-10-9q-.5-3 2-3z" fill="${INK}"/>` +
     P('M40 51h6', INK, 3) + P('M25 52l4 0', WHITE, 2.2) + P('M49 52l4 0', WHITE, 2.2) +
     `<path d="M28 66h28q0 14-14 14q-14 0-14-14z" fill="${WHITE}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` +
     P('M29 70h26M35 66v6M42 66v6M49 66v6', INK, 2),
};

const STUBBLE = [[28, 82], [33, 85], [39, 86], [45, 86], [51, 85], [56, 82], [31, 80.5], [54, 80.5], [42, 83]]
  .map(([x, y]) => dot(x, y, 1.1, INK, 'opacity="0.45"')).join('');

const HATS = {
  christmas: `<path d="M12 30Q22 2 60 6Q80 10 84 30" fill="#D8392B" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<rect x="6" y="24" width="74" height="13" rx="6.5" fill="${WHITE}" stroke="${INK}" stroke-width="3.5"/>` +
    dot(86, 32, 7, WHITE, `stroke="${INK}" stroke-width="3.5"`),
  halloween: `<path d="M22 28L44 -6L64 28Z" fill="#3B2A5C" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<rect x="4" y="25" width="76" height="9" rx="4.5" fill="#3B2A5C" stroke="${INK}" stroke-width="3.5"/>` + P('M26 20h35', '#F28C28', 5),
  newyear: `<path d="M30 28L48 -4L64 26Z" fill="#FFB21A" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    P('M38 14l16 6M34 22l26 4', '#D8392B', 3.5) + dot(48, -6, 5, '#2FB565', `stroke="${INK}" stroke-width="3"`),
};

function moody(m, hat) {
  const c = MOOD_COLORS[m] ?? MOOD_COLORS[3];
  const sil = (fill, st, handleW) => P(HANDLE, fill, handleW) +
    `<path d="${BODY}" fill="${fill}" ${st}/>` + `<ellipse cx="42" cy="32" rx="32" ry="8" fill="${fill}" ${st}/>`;
  let s = `<g transform="translate(2.5 4)" class="mug-shadow">${sil(INK, `stroke="${INK}" stroke-width="14" stroke-linejoin="round"`, 25)}</g>`;
  s += sil(WHITE, `stroke="${WHITE}" stroke-width="14" stroke-linejoin="round"`, 25);
  s += P(HANDLE, INK, 18) + P(HANDLE, c, 10.5);
  s += `<path d="${BODY}" fill="${c}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
  s += `<rect x="60" y="40" width="9" height="44" rx="4.5" fill="#000000" opacity="0.13"/>`;
  s += `<rect x="16" y="42" width="5" height="26" rx="2.5" fill="${WHITE}" opacity="0.5"/>`;
  s += `<ellipse cx="42" cy="32" rx="32" ry="8" fill="${c}" stroke="${INK}" stroke-width="6"/>`;
  s += `<ellipse cx="42" cy="32.5" rx="25" ry="4.6" fill="${m === 0 ? '#3A3F52' : COFFEE}"/>`;
  s += `<path d="M16 27.5l4 5l-5 3.5" fill="${WHITE}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  s += STUBBLE + (FACE[m] ?? FACE[3]);
  if (m === 2) s += `<path d="M66 36v13q0 4 3.5 4q3.5 0 3.5-4v-11" fill="${COFFEE}" stroke="${INK}" stroke-width="2.5"/>`;
  if (m === 1) {
    s += P('M67 38l-5 8l5 5l-5 8', INK, 3.2) +
      `<g transform="rotate(-30 62 80)"><rect x="52" y="75.5" width="20" height="9" rx="4.5" fill="#F2C38B" stroke="${INK}" stroke-width="2.5"/><rect x="59" y="75.5" width="6" height="9" fill="#E3A866"/></g>`;
  }
  if (hat && HATS[hat]) s += HATS[hat];
  else if (m === 1) {
    const smoke = `stroke="${INK}" stroke-width="3"`;
    s += dot(36, 10, 6, '#6B7080', smoke) + dot(46, 4, 7.5, '#6B7080', smoke) + dot(56, 11, 5, '#6B7080', smoke);
  } else s += STEAM[m].map((x) => puff(x, 22)).join('');
  return s;
}

// Same name as before so the rest of the app keeps working: face(m) draws Moody.
export function face(m, { hat = null, cls = '' } = {}) {
  return `<svg viewBox="-10 -16 118 120" class="stk mug ${cls}" aria-hidden="true" focusable="false">${moody(m, hat)}</svg>`;
}

// ---------- Seasonal decorations ----------
const D = {
  leaf: [`<path d="M50 8C78 24 88 58 50 92C12 58 22 24 50 8Z" fill="#D9542B"/><path d="M50 22V86M50 46L65 35M50 62L35 51" stroke="#9E3517" stroke-width="3.5" stroke-linecap="round" fill="none"/>`],
  leaf2: [`<path d="M50 8C78 24 88 58 50 92C12 58 22 24 50 8Z" fill="#E9A23B"/><path d="M50 22V86M50 46L35 35M50 62L65 51" stroke="#A86A12" stroke-width="3.5" stroke-linecap="round" fill="none"/>`],
  acorn: [`<ellipse cx="50" cy="62" rx="22" ry="26" fill="#C98B4E"/><path d="M22 48Q50 18 78 48Q50 56 22 48Z" fill="#7A4A2A"/><rect x="46" y="16" width="8" height="16" rx="4" fill="#7A4A2A"/>`],
  mushroom: [`<rect x="38" y="50" width="24" height="36" rx="11" fill="#F4E6D0"/><path d="M12 56Q50 0 88 56Q50 64 12 56Z" fill="#E0453A"/><circle cx="36" cy="38" r="6" fill="#FFF6EC"/><circle cx="60" cy="30" r="5" fill="#FFF6EC"/><circle cx="68" cy="46" r="4" fill="#FFF6EC"/>`],
  snowflake: [`<path d="M50 12V88M17 31L83 69M17 69L83 31M50 26L42 18M50 26L58 18M50 74L42 82M50 74L58 82" stroke="#4F86D9" stroke-width="7" stroke-linecap="round" fill="none"/>`, 18],
  mitten: [`<path d="M66 44Q82 40 82 53Q82 64 66 62Z" fill="#E0453A"/><path d="M30 32Q30 14 48 14Q66 14 66 32V68H30Z" fill="#E0453A"/><rect x="26" y="64" width="44" height="20" rx="7" fill="#F4E6D0"/>`],
  mug: [`<path d="M64 48Q80 48 80 60Q80 72 64 71" stroke="#3E6FB0" stroke-width="7" fill="none"/><rect x="22" y="38" width="44" height="48" rx="10" fill="#3E6FB0"/><path d="M36 14Q30 22 36 30M50 12Q44 20 50 28" stroke="#8FB0D9" stroke-width="4" stroke-linecap="round" fill="none"/>`, 15],
  blossom: [`<circle cx="50" cy="29" r="16" fill="#F7A8C4"/><circle cx="70" cy="44" r="16" fill="#F7A8C4"/><circle cx="62" cy="67" r="16" fill="#F7A8C4"/><circle cx="38" cy="67" r="16" fill="#F7A8C4"/><circle cx="30" cy="44" r="16" fill="#F7A8C4"/><circle cx="50" cy="51" r="10" fill="#FFD23F"/>`],
  blossom2: [`<circle cx="50" cy="29" r="16" fill="#C9B6F2"/><circle cx="70" cy="44" r="16" fill="#C9B6F2"/><circle cx="62" cy="67" r="16" fill="#C9B6F2"/><circle cx="38" cy="67" r="16" fill="#C9B6F2"/><circle cx="30" cy="44" r="16" fill="#C9B6F2"/><circle cx="50" cy="51" r="10" fill="#FFD23F"/>`],
  tulip: [`<path d="M50 50V90" stroke="#3E9B5B" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M50 72Q64 58 74 66Q66 82 50 82Z" fill="#3E9B5B"/><path d="M30 20L40 32L50 16L60 32L70 20Q74 52 50 54Q26 52 30 20Z" fill="#E8546B"/>`, 14],
  bee: [`<ellipse cx="40" cy="32" rx="11" ry="15" fill="#DDEFFF" transform="rotate(-25 40 32)"/><ellipse cx="60" cy="30" rx="11" ry="15" fill="#DDEFFF" transform="rotate(25 60 30)"/><ellipse cx="50" cy="58" rx="28" ry="22" fill="#FFC93C"/><path d="M42 40V77M56 40V77" stroke="${INK}" stroke-width="7" fill="none"/><circle cx="72" cy="54" r="3" fill="${INK}"/>`],
  sun: [`<path d="M50 8V20M50 80V92M8 50H20M80 50H92M20 20L28 28M72 72L80 80M20 80L28 72M72 28L80 20" stroke="#FF9F1C" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="50" cy="50" r="22" fill="#FFC93C"/>`, 18],
  popsicle: [`<rect x="44" y="62" width="12" height="30" rx="6" fill="#D9A066"/><rect x="28" y="8" width="44" height="62" rx="22" fill="#FF7AA2"/><path d="M28 36H72" stroke="#FFD1DF" stroke-width="6" fill="none"/>`],
  shell: [`<path d="M50 88L14 46Q14 14 50 14Q86 14 86 46Z" fill="#FF9C7A"/><path d="M50 84L32 22M50 84L50 16M50 84L68 22" stroke="#E0663F" stroke-width="3.5" stroke-linecap="round" fill="none"/>`],
  melon: [`<path d="M10 40A40 40 0 0 0 90 40Z" fill="#3E9B5B"/><path d="M17 40A33 33 0 0 0 83 40Z" fill="#FF5E6C"/><circle cx="38" cy="52" r="3" fill="${INK}"/><circle cx="52" cy="60" r="3" fill="${INK}"/><circle cx="64" cy="50" r="3" fill="${INK}"/>`],
  pumpkin: [`<rect x="46" y="12" width="8" height="18" rx="4" fill="#3E7B3E"/><ellipse cx="34" cy="58" rx="20" ry="28" fill="#F28C28"/><ellipse cx="66" cy="58" rx="20" ry="28" fill="#F28C28"/><ellipse cx="50" cy="58" rx="20" ry="30" fill="#FF9F3A"/><path d="M37 52L43 43L48 52ZM52 52L57 43L63 52Z" fill="${INK}"/><path d="M38 66Q50 76 62 66" stroke="${INK}" stroke-width="4" stroke-linecap="round" fill="none"/>`],
  ghost: [`<path d="M22 86V42Q22 12 50 12Q78 12 78 42V86L69 78L60 86L50 78L40 86L31 78Z" fill="#EEF0FF"/><circle cx="40" cy="42" r="5" fill="${INK}"/><circle cx="60" cy="42" r="5" fill="${INK}"/><ellipse cx="50" cy="58" rx="6" ry="8" fill="${INK}"/>`],
  bat: [`<path d="M50 40Q42 30 34 34Q26 26 8 32Q18 40 16 52Q26 46 34 54Q40 48 50 56Q60 48 66 54Q74 46 84 52Q82 40 92 32Q74 26 66 34Q58 30 50 40Z" fill="#2B2340"/><circle cx="46" cy="44" r="2" fill="#FFC93C"/><circle cx="54" cy="44" r="2" fill="#FFC93C"/>`],
  candy: [`<path d="M28 50L8 34V66Z" fill="#9B5DE5"/><path d="M72 50L92 34V66Z" fill="#9B5DE5"/><circle cx="50" cy="50" r="24" fill="#F15BB5"/><path d="M38 40Q50 50 62 40M38 60Q50 50 62 60" stroke="#FFD1EC" stroke-width="4" stroke-linecap="round" fill="none"/>`],
  tree: [`<rect x="44" y="76" width="12" height="14" rx="3" fill="#8A5A3B"/><path d="M50 10L80 50H66L86 80H14L34 50H20Z" fill="#2E8B57"/><circle cx="42" cy="58" r="4" fill="#FF5E6C"/><circle cx="60" cy="68" r="4" fill="#FFC93C"/><circle cx="54" cy="40" r="3.5" fill="#8DB8F2"/>`],
  gift: [`<rect x="16" y="38" width="68" height="48" rx="6" fill="#E0453A"/><rect x="12" y="28" width="76" height="16" rx="5" fill="#F05A4A"/><path d="M50 28V86" stroke="#FFC93C" stroke-width="9" fill="none"/><path d="M50 28Q36 8 30 22Q28 30 50 28Q72 30 70 22Q64 8 50 28Z" fill="#FFC93C"/>`],
  star: [`<path d="M50 8L61 36L92 38L68 57L76 88L50 71L24 88L32 57L8 38L39 36Z" fill="#FFC93C" stroke="#FFC93C" stroke-width="4" stroke-linejoin="round"/>`],
  cane: [`<path d="M60 90V36Q60 16 44 16Q28 16 28 32" stroke="#E0453A" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M60 90V36Q60 16 44 16Q28 16 28 32" stroke="#FFFFFF" stroke-width="12" stroke-dasharray="7 11" fill="none"/>`, 22],
  balloon: [`<path d="M50 70Q45 80 52 86Q58 92 50 97" stroke="${INK}" stroke-width="2.5" fill="none"/><path d="M46 67L54 67L50 74Z" fill="#9B5DE5"/><ellipse cx="50" cy="38" rx="24" ry="30" fill="#9B5DE5"/><ellipse cx="41" cy="28" rx="5" ry="8" fill="#C9A8F5"/>`],
  balloon2: [`<path d="M50 70Q45 80 52 86Q58 92 50 97" stroke="${INK}" stroke-width="2.5" fill="none"/><path d="M46 67L54 67L50 74Z" fill="#FF5E6C"/><ellipse cx="50" cy="38" rx="24" ry="30" fill="#FF5E6C"/><ellipse cx="41" cy="28" rx="5" ry="8" fill="#FFA8B0"/>`],
  popper: [`<path d="M20 88L40 40L66 66Z" fill="#FFC93C"/><path d="M30 68L46 52M25 80L36 69" stroke="#FF5E6C" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="70" cy="24" r="5" fill="#4F86D9"/><rect x="56" y="10" width="9" height="9" rx="2" fill="#FF5E6C" transform="rotate(20 60 14)"/><circle cx="86" cy="42" r="4" fill="#3E9B5B"/><rect x="76" y="56" width="9" height="9" rx="2" fill="#9B5DE5" transform="rotate(-15 80 60)"/>`],
  fish: [`<path d="M70 50L92 32V68Z" fill="#4F86D9"/><ellipse cx="44" cy="50" rx="32" ry="20" fill="#6FA8F0"/><circle cx="26" cy="46" r="4" fill="${INK}"/><path d="M48 36Q56 50 48 64" stroke="#4F86D9" stroke-width="3.5" stroke-linecap="round" fill="none"/>`],
  fish2: [`<path d="M70 50L92 32V68Z" fill="#F28C28"/><ellipse cx="44" cy="50" rx="32" ry="20" fill="#FFB25E"/><circle cx="26" cy="46" r="4" fill="${INK}"/><path d="M48 36Q56 50 48 64" stroke="#F28C28" stroke-width="3.5" stroke-linecap="round" fill="none"/>`],
  ladybug: [`<circle cx="50" cy="26" r="13" fill="${INK}"/><circle cx="50" cy="56" r="30" fill="#E0453A"/><path d="M50 28V86" stroke="${INK}" stroke-width="3.5" fill="none"/><circle cx="36" cy="48" r="6" fill="${INK}"/><circle cx="64" cy="48" r="6" fill="${INK}"/><circle cx="38" cy="70" r="5" fill="${INK}"/><circle cx="62" cy="70" r="5" fill="${INK}"/>`],
};

export const DECOR = {
  autumn: ['leaf', 'acorn', 'mushroom', 'leaf2'],
  winter: ['snowflake', 'mitten', 'mug', 'snowflake'],
  spring: ['blossom', 'tulip', 'bee', 'blossom2'],
  summer: ['sun', 'popsicle', 'shell', 'melon'],
  halloween: ['pumpkin', 'ghost', 'bat', 'candy'],
  christmas: ['tree', 'gift', 'star', 'cane'],
  newyear: ['balloon', 'star', 'popper', 'balloon2'],
  aprilfools: ['fish', 'blossom', 'fish2', 'tulip'],
};

// Colours used when a sticker bursts into little pieces.
export const BURST = {
  autumn: ['#D9542B', '#E9A23B', '#C98B4E'],
  winter: ['#FFFFFF', '#DDEFFF', '#8FB0D9'],
  spring: ['#F7A8C4', '#C9B6F2', '#FFD23F'],
  summer: ['#FFC93C', '#FF7AA2', '#FF9C7A'],
  halloween: ['#F28C28', '#9B5DE5', '#2B2340'],
  christmas: ['#E0453A', '#2E8B57', '#FFC93C'],
  newyear: ['#9B5DE5', '#FF5E6C', '#FFC93C', '#4F86D9', '#3E9B5B'],
  aprilfools: ['#6FA8F0', '#FFB25E', '#F7A8C4'],
};

export function decor(name) {
  const [body, cut] = D[name] || D.star;
  return sticker(body, { cut: cut || 10, cls: 'decor-art' });
}

export function ladybug() {
  return sticker(D.ladybug[0], { cls: 'ladybug-art' });
}

// Tiny ink doodles hidden under peelable stickers.
const DOODLES = [
  `<path d="M20 33C8 25 4 18 7 12C10 7 17 7 20 13C23 7 30 7 33 12C36 18 32 25 20 33Z"/>`,
  `<path d="M20 5L24 15L35 16L27 23L29 34L20 28L11 34L13 23L5 16L16 15Z"/>`,
  `<path d="M20 20m-2 0a2 2 0 1 1 4 0a5 5 0 1 1 -9 -1a8 8 0 1 1 15 4a11 11 0 1 1 -20 -6"/>`,
  `<circle cx="20" cy="20" r="14"/><path d="M14 17v1M26 17v1M13 24q7 7 14 0"/>`,
];
export function doodle(i) {
  return `<svg viewBox="0 0 40 40" class="doodle" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${DOODLES[i % DOODLES.length]}</g></svg>`;
}

// ---------- Small interface icons (stroke, currentColor) ----------
const ICONS = {
  menu: `<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>`,
  lock: `<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  unlock: `<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>`,
  close: `<path d="M6 6l12 12M18 6L6 18"/>`,
  left: `<path d="M15 5l-7 7l7 7"/>`,
  right: `<path d="M9 5l7 7l-7 7"/>`,
  refresh: `<path d="M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4"/>`,
  share: `<path d="M12 15V4M8 8l4-4l4 4M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6"/>`,
  save: `<path d="M12 4v11M8 11l4 4l4-4M5 19h14"/>`,
  key: `<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2"/>`,
  trash: `<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>`,
  edit: `<path d="M5 19l1-4L16 5l3 3L9 18z"/>`,
};
export function icon(name) {
  return `<svg viewBox="0 0 24 24" class="ico" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</g></svg>`;
}
