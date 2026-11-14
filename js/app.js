import { t, moodName, fmtTime, fmtDay, fmtDayKey, monthInitials, monthLong, fmtRel } from './i18n.js';
import * as K from './crypto.js';
import { GitHub } from './github.js';
import { themeFor } from './season.js';
import { face, decor, DECOR, BURST, ladybug, doodle, icon } from './art.js';

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
const CFG = {
  owner: 'hichamAbd',
  repo: 'VibeCheck',
  branch: 'gh-pages',
  today: 'data/today.json',
  vault: 'data/vault.json',
  maxComment: 140,
  autoLockMs: 5 * 60 * 1000,
  refreshMs: 2 * 60 * 1000,
};
const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new?' + new URLSearchParams({
  name: 'VibeCheck posting',
  description: 'Lets the VibeCheck app on my phone save encrypted moods to the VibeCheck repository.',
  target_name: CFG.owner,
  expires_in: '366',
  contents: 'write',
}).toString();

// Every storage key starts with the app's name (all apps share one web address).
const LS = {
  share: 'vibecheck.shareKey',
  owner: 'vibecheck.owner',
  vaultCache: 'vibecheck.vaultCache',
  todayCache: 'vibecheck.todayCache',
  pinTries: 'vibecheck.pinTries',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let toastEl = null;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'svg') el.innerHTML = v; // only ever our own drawings, never user text
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage full or blocked */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  json(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
};

function currentTz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
}

function dayKey(date = new Date(), tz) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-US', { timeZone: tz || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  } catch (e) {
    parts = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  }
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

const byTime = (a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0);
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

function validKey(k) {
  try { return typeof k === 'string' && K.unb64u(k).length === 32; } catch (e) { return false; }
}

function friendsLink(ks) {
  return `${location.origin}${location.pathname}#k=${ks}`;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const S = {
  theme: themeFor(),
  shareKey: null,
  today: null,
  status: 'loading', // loading | ok | nolink | badlink | offline
  updatedAt: null,
  secrets: null, // only while unlocked: { token, ko, ks, tz, tokenSetAt }
  pin: null, // only while unlocked, to lock the backup file
  vault: null, // only while unlocked: { v, rev, tz, entries }
  tab: 'today',
  year: new Date().getFullYear(),
  draft: { m: 0, c: '', p: false },
  busy: false,
  hiddenAt: 0,
  pokes: [],
  peeled: new Set(),
  aprilDone: false,
  ladybug: Math.random() < 0.35,
};

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
function init() {
  applyTheme();
  const params = new URLSearchParams(location.hash.slice(1));
  const k = params.get('k');
  if (k && validKey(k)) {
    S.shareKey = k;
    store.set(LS.share, k);
  } else {
    const saved = store.get(LS.share);
    if (validKey(saved)) S.shareKey = saved;
  }
  const wantsOwner = params.has('owner');
  if (wantsOwner) {
    params.delete('owner');
    const rest = params.toString();
    history.replaceState(null, '', location.pathname + location.search + (rest ? `#${rest}` : ''));
  }

  render();
  loadToday();
  registerServiceWorker();

  setInterval(() => { if (document.visibilityState === 'visible' && !S.busy) loadToday(); }, CFG.refreshMs);
  setInterval(() => updateRelativeTimes(), 30000);
  document.addEventListener('visibilitychange', onVisibility);
  reduceMotion.addEventListener?.('change', () => render());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

  if (wantsOwner) setTimeout(openOwnerEntry, 250);
  if (S.theme.key === 'newyear') setTimeout(() => confetti(), 500);
}

function onVisibility() {
  if (document.visibilityState === 'hidden') {
    S.hiddenAt = Date.now();
    return;
  }
  if (S.secrets && S.hiddenAt && Date.now() - S.hiddenAt > CFG.autoLockMs) {
    lock(true);
    return;
  }
  loadToday();
}

function applyTheme() {
  document.documentElement.dataset.theme = S.theme.key;
  requestAnimationFrame(() => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    const meta = $('meta[name="theme-color"]');
    if (meta && bg) meta.setAttribute('content', bg);
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is a bonus */ });
}

// ---------------------------------------------------------------------------
// Loading what friends see
// ---------------------------------------------------------------------------
async function loadToday() {
  if (S.secrets) return loadVault();
  if (!S.shareKey) {
    S.status = 'nolink';
    render();
    return;
  }
  try {
    const res = await fetch(`${CFG.today}?t=${Date.now()}`, { cache: 'no-store' });
    if (res.status === 404) {
      S.today = null;
      S.status = 'ok';
      S.updatedAt = new Date().toISOString();
      render();
      return;
    }
    if (!res.ok) throw new Error('http');
    const env = await res.json();
    try {
      S.today = await K.decryptWith(S.shareKey, env, K.CTX.today);
    } catch (e) {
      S.status = 'badlink';
      render();
      return;
    }
    store.set(LS.todayCache, JSON.stringify(env));
    S.status = 'ok';
    S.updatedAt = new Date().toISOString();
  } catch (e) {
    const env = store.json(LS.todayCache);
    if (env) {
      try { S.today = await K.decryptWith(S.shareKey, env, K.CTX.today); } catch (err) { /* keep what we have */ }
    }
    S.status = 'offline';
  }
  render();
}

async function loadVault() {
  const keys = S.secrets;
  const envs = [];
  try {
    const res = await fetch(`${CFG.vault}?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) envs.push(await res.json());
  } catch (e) { /* offline */ }
  const cached = store.json(LS.vaultCache);
  if (cached) envs.push(cached);
  let best = S.vault;
  for (const env of envs) {
    try {
      const v = await K.decryptWith(keys.ko, env, K.CTX.vault);
      if (!best || (v.rev || 0) > (best.rev || 0)) best = v;
    } catch (e) { /* not ours or damaged */ }
  }
  if (!S.secrets) return; // locked meanwhile
  S.vault = best || { v: 1, rev: 0, tz: currentTz(), entries: [] };
  S.status = 'ok';
  S.updatedAt = new Date().toISOString();
  render();
}

// Today's entries, as the current viewer may see them.
function todaysEntries() {
  if (S.secrets && S.vault) {
    const key = dayKey(new Date(), currentTz());
    return S.vault.entries.filter((e) => e.d === key).sort(byTime);
  }
  if (S.today && S.today.d === dayKey(new Date(), S.today.tz)) {
    return [...S.today.entries].sort(byTime);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Saving (owner only)
// ---------------------------------------------------------------------------
function github(token = S.secrets.token) {
  return new GitHub({ token, owner: CFG.owner, repo: CFG.repo, branch: CFG.branch });
}

async function buildFiles(vault, keys) {
  const tz = vault.tz || currentTz();
  const key = dayKey(new Date(), tz);
  const shared = vault.entries
    .filter((e) => e.d === key && !e.p)
    .sort(byTime)
    .map((e) => ({ t: e.t, m: e.m, c: e.c }));
  const todayPayload = { v: 1, d: key, tz, at: new Date().toISOString(), entries: shared };
  const vaultEnv = await K.encryptWith(keys.ko, vault, K.CTX.vault);
  const todayEnv = await K.encryptWith(keys.ks, todayPayload, K.CTX.today);
  return { [CFG.vault]: JSON.stringify(vaultEnv), [CFG.today]: JSON.stringify(todayEnv) };
}

function errorText(e) {
  if (!e || e.status === 0) return t('err_net');
  if (e.status === 401 || e.status === 403) return t('err_key');
  return t('err_other', { code: e.status || '?' });
}

// Reads the latest diary from GitHub, applies a change, saves both files.
async function mutate(change, okMessage) {
  if (S.busy || !S.secrets) return false;
  S.busy = true;
  renderBusy();
  const gh = github();
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const text = await gh.readFile(CFG.vault);
      let vault = text
        ? await K.decryptWith(S.secrets.ko, JSON.parse(text), K.CTX.vault)
        : { v: 1, rev: 0, tz: currentTz(), entries: [] };
      vault = change(vault) || vault;
      vault.rev = Math.max(vault.rev || 0, (S.vault && S.vault.rev) || 0) + 1;
      vault.tz = currentTz();
      const files = await buildFiles(vault, S.secrets);
      try {
        await gh.commit(files);
      } catch (e) {
        if (e.status === 409 && attempt < 2) continue;
        throw e;
      }
      S.vault = vault;
      store.set(LS.vaultCache, files[CFG.vault]);
      toast(okMessage);
      return true;
    }
    return false;
  } catch (e) {
    toast(errorText(e), 'error');
    return false;
  } finally {
    S.busy = false;
    render();
  }
}

async function post() {
  if (!S.draft.m) {
    toast(t('pick_face'));
    return;
  }
  const now = new Date();
  const entry = {
    id: K.randomId(),
    t: now.toISOString(),
    d: dayKey(now, currentTz()),
    m: S.draft.m,
    c: S.draft.c.trim().slice(0, CFG.maxComment),
    p: !!S.draft.p,
  };
  const ok = await mutate((v) => { v.entries.push(entry); return v; }, t('posted'));
  if (ok) {
    S.draft = { m: 0, c: '', p: false };
    render();
  }
}

// ---------------------------------------------------------------------------
// Unlock / lock
// ---------------------------------------------------------------------------
function pinWaitSeconds() {
  const tries = store.json(LS.pinTries);
  if (!tries || !tries.until) return 0;
  return Math.max(0, Math.ceil((tries.until - Date.now()) / 1000));
}

function notePinFailure() {
  const tries = store.json(LS.pinTries) || { n: 0 };
  tries.n += 1;
  tries.until = tries.n >= 3 ? Date.now() + Math.min(15 * 60, 5 * 2 ** (tries.n - 3)) * 1000 : 0;
  store.set(LS.pinTries, JSON.stringify(tries));
}

async function unlockWith(pin) {
  const env = store.json(LS.owner);
  const secrets = await K.decryptWithPin(pin, env, K.CTX.device);
  store.del(LS.pinTries);
  S.secrets = secrets;
  S.pin = pin;
  S.shareKey = secrets.ks;
  store.set(LS.share, secrets.ks);
  await loadVault();
}

function lock(silent) {
  S.secrets = null;
  S.pin = null;
  S.vault = null;
  S.tab = 'today';
  S.draft = { m: 0, c: '', p: false };
  closeSheet();
  render();
  loadToday();
  if (!silent) toast(t('lock'));
}

function openOwnerEntry() {
  if (S.secrets) openMenu();
  else if (store.get(LS.owner)) openUnlock();
  else openSetup();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function render() {
  const app = $('#app');
  const active = document.activeElement && document.activeElement.id;
  app.replaceChildren(...[
    renderHeader(),
    renderBanner(),
    S.secrets ? renderComposer() : null,
    S.secrets ? renderTabs() : null,
    S.secrets && S.tab === 'year' ? renderYear() : renderToday(),
    renderFooter(),
  ].filter(Boolean));
  if (active) {
    const el = document.getElementById(active);
    if (el) el.focus({ preventScroll: true });
  }
}

function renderBusy() {
  const btn = $('#post-btn');
  if (btn) {
    btn.textContent = t('posting');
    btn.setAttribute('aria-busy', 'true');
  }
}

function renderHeader() {
  const word = h('button', { class: 'wordmark', type: 'button', 'aria-label': t('wordmark') },
    [...t('wordmark')].map((ch, i) => {
      const span = h('span', { class: 'wm-letter', text: ch });
      span.style.setProperty('--i', String(i));
      return span;
    }));
  pressAndHold(word, openOwnerEntry, () => wiggleWordmark(word));

  const actions = h('div', { class: 'top-actions' });
  if (S.secrets) {
    actions.append(
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('lock'), svg: icon('lock'), onclick: () => lock() }),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('menu'), svg: icon('menu'), onclick: openMenu }),
    );
  } else if (store.get(LS.owner)) {
    actions.append(h('button', { class: 'pill-btn', type: 'button', onclick: openUnlock }, h('span', { svg: icon('unlock'), class: 'pill-ico' }), t('unlock')));
  }

  return h('header', { class: 'top' },
    h('div', { class: 'top-row' }, word, actions),
    h('div', { class: 'date-row' },
      h('p', { class: 'dateline', text: fmtDay(new Date()) }),
      decorSlot(1)));
}

function renderBanner() {
  if (!S.secrets) return null;
  const age = Date.now() - new Date(S.secrets.tokenSetAt || 0).getTime();
  if (age < 335 * 86400000) return null;
  return h('div', { class: 'banner', role: 'status' },
    h('p', { text: t('key_expiring') }),
    h('button', { class: 'btn small', type: 'button', onclick: openReplaceKey, text: t('replace_key') }));
}

function renderComposer() {
  const d = S.draft;
  const faces = h('div', { class: 'faces', role: 'group', 'aria-label': t('how_are_you') },
    [5, 4, 3, 2, 1].map((m) => h('button', {
      class: `face-btn${d.m === m ? ' on' : ''}`,
      type: 'button',
      'aria-pressed': d.m === m ? 'true' : 'false',
      'aria-label': moodName(m),
      onclick: () => {
        S.draft.m = m;
        $('.composer').classList.add('open');
        document.querySelectorAll('.face-btn').forEach((b) => {
          const on = b === faceBtnFor(m);
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        $('#mood-word-pick').textContent = moodName(m);
      },
    }, h('span', { class: 'face-wrap', svg: face(m) }))));

  const counter = h('span', { class: 'counter', id: 'counter', text: `${d.c.length}/${CFG.maxComment}` });
  const area = h('textarea', {
    id: 'comment',
    rows: '2',
    maxlength: String(CFG.maxComment),
    placeholder: t('comment_ph'),
    autocomplete: 'off',
    oninput: (e) => {
      S.draft.c = e.target.value;
      counter.textContent = `${e.target.value.length}/${CFG.maxComment}`;
    },
  });
  area.value = d.c;

  const sw = h('input', { type: 'checkbox', role: 'switch', id: 'just-me', onchange: (e) => { S.draft.p = e.target.checked; } });
  sw.checked = d.p;

  return h('section', { class: `composer note${d.m ? ' open' : ''}`, 'aria-labelledby': 'composer-title' },
    h('div', { class: 'composer-head' },
      h('h2', { id: 'composer-title', text: t('how_are_you') }),
      h('span', { class: 'picked', id: 'mood-word-pick', 'aria-live': 'polite', text: d.m ? moodName(d.m) : '' })),
    faces,
    h('div', { class: 'composer-more' },
      h('label', { class: 'field-label', for: 'comment' }, h('span', { text: t('comment_label') }), counter),
      area,
      h('label', { class: 'switch', for: 'just-me' },
        sw,
        h('span', { class: 'switch-track', 'aria-hidden': 'true' }),
        h('span', { class: 'switch-text' }, h('strong', { text: t('just_me') }), h('span', { text: t('just_me_hint') }))),
      h('button', { class: 'btn primary', id: 'post-btn', type: 'button', onclick: post, text: S.busy ? t('posting') : t('post') })));
}

function faceBtnFor(m) {
  return [...document.querySelectorAll('.face-btn')].find((b) => b.getAttribute('aria-label') === moodName(m));
}

function renderTabs() {
  const tab = (id, label) => h('button', {
    class: `tab${S.tab === id ? ' on' : ''}`,
    type: 'button',
    role: 'tab',
    'aria-selected': S.tab === id ? 'true' : 'false',
    onclick: () => { S.tab = id; render(); },
    text: label,
  });
  return h('div', { class: 'tabs', role: 'tablist' }, tab('today', t('tab_today')), tab('year', t('tab_year')));
}

function renderToday() {
  if (!S.secrets) {
    if (S.status === 'loading') return h('section', { class: 'hero loading', 'aria-busy': 'true' }, h('p', { class: 'sr-only', text: t('loading') }));
    if (S.status === 'nolink') return stateCard(t('need_link_title'), t('need_link_body'));
    if (S.status === 'badlink') return stateCard(t('bad_link_title'), t('bad_link_body'));
  }
  const entries = todaysEntries();
  if (!entries.length) return stateCard(t('empty_title'), t('empty_body'));

  const latest = entries[entries.length - 1];
  const earlier = entries.slice(0, -1).reverse();
  return h('div', { class: 'today' },
    renderHero(latest),
    earlier.length ? h('section', { class: 'earlier', 'aria-labelledby': 'earlier-title' },
      h('div', { class: 'sec-head' }, h('h2', { id: 'earlier-title', text: t('earlier') }), decorSlot(2)),
      h('ul', { class: 'entries' }, earlier.map((e) => entryRow(e)))) : h('div', { class: 'sec-head lone' }, decorSlot(2)));
}

function hatForTheme() {
  return ['christmas', 'halloween', 'newyear'].includes(S.theme.key) ? S.theme.key : null;
}

function renderHero(e) {
  const upside = S.theme.key === 'aprilfools' && !S.aprilDone;
  const faceBtn = h('button', {
    class: `hero-face${upside ? ' upside' : ''}`,
    type: 'button',
    'aria-label': `${moodName(e.m)}, ${t('mascot')}`,
    svg: face(e.m, { hat: hatForTheme() }),
    onclick: (ev) => pokeFace(ev.currentTarget),
  });
  const word = h('div', { class: e.c ? 'hero-text hero-word' : 'hero-text hero-talk' },
    h('p', { class: 'mood-word', text: moodName(e.m) }),
    h('p', { class: 'meta' },
      h('time', { datetime: e.t, text: fmtTime(e.t) }),
      h('span', { class: 'rel', 'data-t': e.t, text: `, ${fmtRel(e.t)}` }),
      e.p ? h('span', { class: 'badge' }, h('span', { svg: icon('lock'), class: 'badge-ico' }), t('just_me_badge')) : null));
  return h('section', { class: 'hero', 'aria-label': t('tab_today') },
    faceBtn,
    e.c ? h('div', { class: 'hero-talk' }, h('p', { class: 'bubble', text: e.c })) : null,
    word,
    decorSlot(0),
    S.ladybug ? ladybugEl() : null);
}

function entryRow(e, { inSheet = false } = {}) {
  const inner = [
    h('span', { class: 'row-face', svg: face(e.m) }),
    h('span', { class: 'row-text' },
      h('span', { class: 'row-top' },
        h('strong', { text: moodName(e.m) }),
        h('time', { datetime: e.t, text: fmtTime(e.t) }),
        e.p ? h('span', { class: 'badge' }, h('span', { svg: icon('lock'), class: 'badge-ico' }), t('just_me_badge')) : null),
      e.c ? h('span', { class: 'row-comment', text: e.c }) : null),
  ];
  if (S.secrets && e.id) {
    return h('li', null, h('button', { class: 'row', type: 'button', onclick: () => openEdit(e, inSheet) }, inner, h('span', { class: 'row-edit', svg: icon('edit') })));
  }
  return h('li', null, h('div', { class: 'row' }, inner));
}

function stateCard(title, body) {
  return h('section', { class: 'hero state' },
    h('button', { class: 'hero-face', type: 'button', 'aria-label': t('mascot'), svg: face(0, { hat: hatForTheme() }), onclick: (ev) => pokeFace(ev.currentTarget) }),
    h('div', { class: 'hero-talk' },
      h('h2', { class: 'state-title', text: title }),
      h('p', { class: 'state-body', text: body })),
    decorSlot(0),
    S.ladybug ? ladybugEl() : null);
}

function renderFooter() {
  const label = S.status === 'offline' ? t('offline') : S.updatedAt ? t('updated', { when: fmtRel(S.updatedAt) }) : '';
  return h('footer', { class: 'foot' },
    decorSlot(3),
    h('p', { class: 'updated', id: 'updated', text: label }),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('refresh'), svg: icon('refresh'), onclick: (ev) => { spin(ev.currentTarget); loadToday(); } }));
}

function updateRelativeTimes() {
  document.querySelectorAll('.rel[data-t]').forEach((el) => { el.textContent = `, ${fmtRel(el.dataset.t)}`; });
  const up = $('#updated');
  if (up && S.updatedAt && S.status !== 'offline') up.textContent = t('updated', { when: fmtRel(S.updatedAt) });
}

// ---------------------------------------------------------------------------
// Year grid (owner only)
// ---------------------------------------------------------------------------
function renderYear() {
  const y = S.year;
  const byDay = new Map();
  for (const e of (S.vault ? S.vault.entries : [])) {
    if (!e.d || !e.d.startsWith(`${y}-`)) continue;
    if (!byDay.has(e.d)) byDay.set(e.d, []);
    byDay.get(e.d).push(e);
  }
  const todayKey = dayKey(new Date(), currentTz());
  const grid = h('div', { class: 'ygrid' });
  grid.append(h('span', { class: 'ylabel corner', 'aria-hidden': 'true' }));
  monthInitials().forEach((mi, i) => grid.append(h('span', { class: 'ylabel month', title: monthLong(i), 'aria-hidden': 'true', text: mi })));
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    grid.append(h('span', { class: 'ylabel dnum', 'aria-hidden': 'true', text: day === 1 || day % 5 === 0 ? String(day) : '' }));
    for (let mo = 0; mo < 12; mo++) {
      const date = new Date(y, mo, day, 12);
      if (date.getMonth() !== mo) {
        grid.append(h('span', { class: 'cell none', 'aria-hidden': 'true' }));
        continue;
      }
      const key = `${y}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const list = byDay.get(key) || [];
      count += list.length;
      const avg = list.length ? Math.round(list.reduce((s, e) => s + e.m, 0) / list.length) : 0;
      const cls = ['cell', avg ? `lv${avg}` : 'empty'];
      if (key === todayKey) cls.push('is-today');
      if (key > todayKey) cls.push('future');
      const label = fmtDayKey(key) + (avg ? `: ${moodName(avg)}` : '');
      grid.append(h('button', { class: cls.join(' '), type: 'button', 'aria-label': label, onclick: () => openDay(key) }));
    }
  }
  const countText = count === 0 ? t('year_count_zero') : count === 1 ? t('year_count_one') : t('year_count', { n: count });
  return h('section', { class: 'year note', 'aria-labelledby': 'year-title' },
    h('div', { class: 'year-nav' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('year_prev'), svg: icon('left'), onclick: () => { S.year -= 1; render(); } }),
      h('h2', { id: 'year-title', text: String(y) }),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('year_next'), svg: icon('right'), onclick: () => { S.year += 1; render(); } })),
    grid,
    h('p', { class: 'year-count', text: countText }),
    h('ul', { class: 'legend' }, [1, 2, 3, 4, 5].map((m) => h('li', null, h('span', { class: `sw lv${m}`, 'aria-hidden': 'true' }), moodName(m)))));
}

// ---------------------------------------------------------------------------
// Sheets (bottom panels)
// ---------------------------------------------------------------------------
function openSheet(title, ...content) {
  const dlg = $('#sheet');
  const body = h('div', { class: 'sheet-body' }, content);
  const keepToast = toastEl && toastEl.parentElement === dlg;
  dlg.replaceChildren(
    h('div', { class: 'sheet-head' },
      h('h2', { id: 'sheet-title', tabindex: '-1', text: title }),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('close'), svg: icon('close'), onclick: closeSheet })),
    body);
  if (keepToast) dlg.append(toastEl);
  dlg.setAttribute('aria-labelledby', 'sheet-title');
  if (!dlg.open) {
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }
  if (!body.querySelector('[autofocus]')) $('#sheet-title').focus({ preventScroll: true });
  return body;
}

function closeSheet() {
  const dlg = $('#sheet');
  if (toastEl && toastEl.parentElement === dlg) document.body.append(toastEl);
  if (dlg.open) {
    if (typeof dlg.close === 'function') dlg.close();
    else dlg.removeAttribute('open');
  }
}

function errLine() {
  return h('p', { class: 'err', role: 'alert' });
}

function pinInput(id, label, autofocus) {
  return h('label', { class: 'field', for: id },
    h('span', { class: 'field-label', text: label }),
    h('input', {
      id, type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '6', autocomplete: 'off', class: 'pin', autofocus: autofocus ? true : null,
    }));
}

function openUnlock() {
  const err = errLine();
  const btn = h('button', { class: 'btn primary', type: 'submit', text: t('unlock') });
  const form = h('form', { class: 'stack', novalidate: true }, pinInput('unlock-pin', t('pin_label'), true), err, btn);
  const go = async () => {
    const input = $('#unlock-pin');
    const wait = pinWaitSeconds();
    if (wait) { err.textContent = t('pin_wait', { s: wait }); return; }
    if (!/^\d{6}$/.test(input.value)) { err.textContent = t('setup_err_pin'); return; }
    btn.textContent = t('unlocking');
    try {
      await unlockWith(input.value);
      closeSheet();
      render();
    } catch (e) {
      notePinFailure();
      const w = pinWaitSeconds();
      err.textContent = w ? t('pin_wait', { s: w }) : t('wrong_pin');
      input.value = '';
      input.focus();
      btn.textContent = t('unlock');
    }
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); go(); });
  openSheet(t('enter_pin'), form);
  const input = $('#unlock-pin');
  input.addEventListener('input', () => { err.textContent = ''; if (/^\d{6}$/.test(input.value)) go(); });
  setTimeout(() => input.focus(), 50);
}

function openMenu() {
  const item = (ico, label, fn, cls = '') => h('li', null, h('button', { class: `menu-item ${cls}`, type: 'button', onclick: fn }, h('span', { svg: icon(ico), class: 'menu-ico' }), label));
  openSheet(t('menu'),
    h('ul', { class: 'menu' },
      item('share', t('share_link'), () => shareLink(S.secrets.ks)),
      item('save', t('save_backup'), openBackup),
      item('key', t('replace_key'), openReplaceKey),
      item('lock', t('lock'), () => lock()),
      item('trash', t('forget_phone'), forgetPhone, 'danger')));
}

async function shareLink(ks) {
  const url = friendsLink(ks);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'VibeCheck', text: t('share_text'), url });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast(t('link_copied'));
  } catch (e) {
    window.prompt(t('share_link'), url);
  }
}

async function makeBackup(pin, secrets, vault) {
  const keys = await K.encryptWithPin(pin, { ko: secrets.ko, ks: secrets.ks }, K.CTX.backup);
  const vaultEnv = await K.encryptWith(secrets.ko, vault, K.CTX.vault);
  const doc = { app: 'vibecheck', kind: 'backup', v: 1, created: new Date().toISOString(), keys, vault: vaultEnv };
  const name = `vibecheck-backup-${dayKey(new Date(), currentTz())}.json`;
  return new File([JSON.stringify(doc)], name, { type: 'application/json' });
}

async function saveFile(file) {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (e) {
      if (e && e.name === 'AbortError') return false;
    }
  }
  const url = URL.createObjectURL(file);
  const a = h('a', { href: url, download: file.name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}

// The file is prepared first, so the Save tap can open the share sheet at once.
function backupButton(prepare) {
  let file = null;
  const btn = h('button', { class: 'btn', type: 'button', text: t('loading') });
  btn.setAttribute('aria-busy', 'true');
  prepare().then((f) => {
    file = f;
    btn.textContent = t('save_backup');
    btn.removeAttribute('aria-busy');
  });
  btn.addEventListener('click', async () => {
    if (!file) return;
    if (await saveFile(file)) toast(t('backup_saved'));
  });
  return btn;
}

function openBackup() {
  openSheet(t('save_backup'),
    h('p', { class: 'muted', text: t('done_backup') }),
    backupButton(() => makeBackup(S.pin, S.secrets, S.vault || { v: 1, rev: 0, tz: currentTz(), entries: [] })));
}

function openReplaceKey() {
  const err = errLine();
  const input = h('input', { id: 'new-token', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', class: 'token' });
  const btn = h('button', { class: 'btn primary', type: 'submit', text: t('save') });
  const form = h('form', { class: 'stack', novalidate: true },
    h('p', { class: 'muted', text: t('setup_step1_body') }),
    h('a', { class: 'btn', href: TOKEN_URL, target: '_blank', rel: 'noopener noreferrer', text: t('setup_open_github') }),
    h('label', { class: 'field', for: 'new-token' }, h('span', { class: 'field-label', text: t('setup_paste') }), input),
    err, btn);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = input.value.trim();
    if (!token) { err.textContent = t('setup_err_token'); return; }
    btn.textContent = t('setup_checking');
    try {
      await github(token).check();
      S.secrets = { ...S.secrets, token, tokenSetAt: new Date().toISOString() };
      store.set(LS.owner, JSON.stringify(await K.encryptWithPin(S.pin, S.secrets, K.CTX.device)));
      closeSheet();
      render();
      toast(t('key_replaced'));
    } catch (er) {
      err.textContent = er.status === 0 ? t('err_net') : t('setup_err_key');
      btn.textContent = t('save');
    }
  });
  openSheet(t('replace_key'), form);
}

function forgetPhone() {
  if (!window.confirm(t('forget_confirm'))) return;
  [LS.owner, LS.vaultCache, LS.pinTries].forEach((k) => store.del(k));
  lock(true);
  toast(t('forgotten'));
}

function openDay(key) {
  const list = (S.vault ? S.vault.entries : []).filter((e) => e.d === key).sort(byTime);
  openSheet(fmtDayKey(key),
    list.length ? h('ul', { class: 'entries' }, list.map((e) => entryRow(e, { inSheet: key }))) : h('p', { class: 'muted', text: t('day_empty') }));
}

function openEdit(entry, backToDay) {
  const draft = { m: entry.m, c: entry.c || '', p: !!entry.p };
  const faces = h('div', { class: 'faces', role: 'group', 'aria-label': t('how_are_you') },
    [5, 4, 3, 2, 1].map((m) => h('button', {
      class: `face-btn${draft.m === m ? ' on' : ''}`,
      type: 'button',
      'aria-pressed': draft.m === m ? 'true' : 'false',
      'aria-label': moodName(m),
      onclick: (ev) => {
        draft.m = m;
        ev.currentTarget.parentElement.querySelectorAll('.face-btn').forEach((b) => {
          const on = b === ev.currentTarget;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      },
    }, h('span', { class: 'face-wrap', svg: face(m) }))));
  const area = h('textarea', { id: 'edit-comment', rows: '2', maxlength: String(CFG.maxComment), placeholder: t('comment_ph'), oninput: (e) => { draft.c = e.target.value; } });
  area.value = draft.c;
  const sw = h('input', { type: 'checkbox', role: 'switch', id: 'edit-just-me', onchange: (e) => { draft.p = e.target.checked; } });
  sw.checked = draft.p;
  const save = h('button', { class: 'btn primary', type: 'button', text: t('save') });
  const del = h('button', { class: 'btn danger-text', type: 'button', text: t('delete') });
  const after = () => { if (backToDay) openDay(backToDay); else closeSheet(); };
  save.addEventListener('click', async () => {
    save.textContent = t('posting');
    const ok = await mutate((v) => {
      const e = v.entries.find((x) => x.id === entry.id);
      if (e) Object.assign(e, { m: draft.m, c: draft.c.trim().slice(0, CFG.maxComment), p: draft.p, u: new Date().toISOString() });
      return v;
    }, t('saved'));
    if (ok) after(); else save.textContent = t('save');
  });
  del.addEventListener('click', async () => {
    if (!window.confirm(t('delete_confirm'))) return;
    const ok = await mutate((v) => { v.entries = v.entries.filter((x) => x.id !== entry.id); return v; }, t('deleted'));
    if (ok) after();
  });
  openSheet(t('edit_title'),
    h('p', { class: 'muted', text: `${fmtDayKey(entry.d)}, ${fmtTime(entry.t)}` }),
    faces,
    h('label', { class: 'field', for: 'edit-comment' }, h('span', { class: 'field-label', text: t('comment_label') }), area),
    h('label', { class: 'switch', for: 'edit-just-me' }, sw, h('span', { class: 'switch-track', 'aria-hidden': 'true' }),
      h('span', { class: 'switch-text' }, h('strong', { text: t('just_me') }), h('span', { text: t('just_me_hint') }))),
    save, del);
}

// ---------------------------------------------------------------------------
// First-time setup on the owner's phone
// ---------------------------------------------------------------------------
function openSetup() {
  const err = errLine();
  const token = h('input', { id: 'setup-token', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', class: 'token' });
  const btn = h('button', { class: 'btn primary', type: 'submit', text: t('setup_go') });
  const form = h('form', { class: 'stack', novalidate: true },
    h('p', { class: 'muted', text: t('setup_intro') }),
    isIOS && !isStandalone ? h('p', { class: 'notice', text: t('setup_homescreen') }) : null,
    h('h3', { text: `1. ${t('setup_step1')}` }),
    h('p', { class: 'muted', text: t('setup_step1_body') }),
    h('a', { class: 'btn', href: TOKEN_URL, target: '_blank', rel: 'noopener noreferrer', text: t('setup_open_github') }),
    h('label', { class: 'field', for: 'setup-token' }, h('span', { class: 'field-label', text: t('setup_paste') }), token),
    h('h3', { text: `2. ${t('setup_step2')}` }),
    h('p', { class: 'muted', text: t('setup_step2_body') }),
    h('div', { class: 'pin-pair' }, pinInput('setup-pin', t('setup_pin')), pinInput('setup-pin2', t('setup_pin2'))),
    err, btn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    const tok = token.value.trim();
    const pin = $('#setup-pin').value;
    const pin2 = $('#setup-pin2').value;
    if (!tok) { err.textContent = t('setup_err_token'); return; }
    if (!/^\d{6}$/.test(pin)) { err.textContent = t('setup_err_pin'); return; }
    if (pin !== pin2) { err.textContent = t('setup_err_pin2'); return; }
    const gh = github(tok);
    btn.textContent = t('setup_checking');
    try {
      await gh.check();
      const existing = await gh.readFile(CFG.vault);
      if (existing) {
        openRestore({ token: tok, pin, remote: JSON.parse(existing) });
        return;
      }
      btn.textContent = t('setup_creating');
      await createFresh(tok, pin);
    } catch (er) {
      btn.textContent = t('setup_go');
      err.textContent = er.status === 0 ? t('err_net')
        : er.status === 401 ? t('setup_err_key')
          : [403, 404, 422].includes(er.status) ? t('setup_err_write')
            : errorText(er);
    }
  });
  openSheet(t('setup_title'), form);
}

async function createFresh(token, pin) {
  const secrets = { token, ko: K.newKey(), ks: K.newKey(), tz: currentTz(), tokenSetAt: new Date().toISOString() };
  const vault = { v: 1, rev: 1, tz: secrets.tz, entries: [] };
  const files = await buildFiles(vault, secrets);
  await github(token).commit(files, 'Start VibeCheck');
  await finishSetup(secrets, pin, vault, files[CFG.vault]);
}

async function finishSetup(secrets, pin, vault, vaultText) {
  store.set(LS.owner, JSON.stringify(await K.encryptWithPin(pin, secrets, K.CTX.device)));
  if (vaultText) store.set(LS.vaultCache, vaultText);
  store.set(LS.share, secrets.ks);
  S.secrets = secrets;
  S.pin = pin;
  S.shareKey = secrets.ks;
  S.vault = vault;
  S.status = 'ok';
  S.updatedAt = new Date().toISOString();
  render();
  openSheet(t('done_title'),
    h('p', { class: 'muted', text: t('done_backup') }),
    backupButton(() => makeBackup(pin, secrets, vault)),
    h('p', { class: 'muted', text: t('done_link') }),
    h('button', { class: 'btn', type: 'button', onclick: () => shareLink(secrets.ks) }, h('span', { svg: icon('share'), class: 'btn-ico' }), t('share_link')),
    h('button', { class: 'btn primary', type: 'button', onclick: closeSheet, text: t('done_finish') }));
}

function openRestore({ token, pin, remote }) {
  const err = errLine();
  const file = h('input', { id: 'restore-file', type: 'file', accept: 'application/json,.json', class: 'file' });
  const bpin = pinInput('restore-pin', t('restore_pin'));
  const btn = h('button', { class: 'btn primary', type: 'submit', text: t('unlock') });
  const fresh = h('button', { class: 'btn danger-text', type: 'button', text: t('restore_fresh') });
  const form = h('form', { class: 'stack', novalidate: true },
    h('p', { class: 'muted', text: t('restore_body') }),
    h('label', { class: 'field', for: 'restore-file' }, h('span', { class: 'field-label', text: t('restore_pick') }), file),
    bpin, err, btn, fresh);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    const f = file.files && file.files[0];
    if (!f) { err.textContent = t('restore_badfile'); return; }
    let doc;
    try {
      doc = JSON.parse(await f.text());
      if (doc.app !== 'vibecheck' || doc.kind !== 'backup') throw new Error('kind');
    } catch (er) {
      err.textContent = t('restore_badfile');
      return;
    }
    btn.textContent = t('unlocking');
    try {
      const keys = await K.decryptWithPin($('#restore-pin').value, doc.keys, K.CTX.backup);
      const remoteVault = await K.decryptWith(keys.ko, remote, K.CTX.vault);
      const backupVault = await K.decryptWith(keys.ko, doc.vault, K.CTX.vault);
      // Bring back anything that only the backup still has.
      const ids = new Set(remoteVault.entries.map((x) => x.id));
      const missing = backupVault.entries.filter((x) => !ids.has(x.id));
      const secrets = { token, ko: keys.ko, ks: keys.ks, tz: currentTz(), tokenSetAt: new Date().toISOString() };
      let vault = remoteVault;
      let vaultText = null;
      if (missing.length) {
        vault = { ...remoteVault, rev: (remoteVault.rev || 0) + 1, entries: [...remoteVault.entries, ...missing] };
        const files = await buildFiles(vault, secrets);
        await github(token).commit(files, 'Update');
        vaultText = files[CFG.vault];
      }
      await finishSetup(secrets, pin, vault, vaultText);
    } catch (er) {
      btn.textContent = t('unlock');
      err.textContent = er && er.status !== undefined ? errorText(er) : t('restore_wrong');
    }
  });
  fresh.addEventListener('click', async () => {
    if (!window.confirm(t('restore_fresh_confirm'))) return;
    fresh.textContent = t('setup_creating');
    try {
      await createFresh(token, pin);
    } catch (er) {
      fresh.textContent = t('restore_fresh');
      err.textContent = errorText(er);
    }
  });
  openSheet(t('restore_title'), form);
}

// ---------------------------------------------------------------------------
// Little surprises
// ---------------------------------------------------------------------------
function pressAndHold(el, onHold, onTap) {
  let timer = null;
  let held = false;
  el.addEventListener('pointerdown', () => {
    held = false;
    clearTimeout(timer);
    timer = setTimeout(() => { held = true; onHold(); }, 700);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, () => clearTimeout(timer)));
  el.addEventListener('click', (e) => {
    if (held) { e.preventDefault(); held = false; return; }
    onTap();
  });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

function wiggleWordmark(word) {
  if (reduceMotion.matches) return;
  word.classList.remove('wave');
  void word.offsetWidth;
  word.classList.add('wave');
  setTimeout(() => word.classList.remove('wave'), 1400);
}

function restartAnim(el, cls, ms) {
  el.classList.remove(cls);
  void el.getBoundingClientRect();
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}

function pokeFace(btn) {
  if (btn.classList.contains('upside')) {
    S.aprilDone = true;
    btn.classList.remove('upside');
    toast(t('aprilfool'));
    return;
  }
  const now = Date.now();
  S.pokes = S.pokes.filter((x) => now - x < 4000);
  S.pokes.push(now);
  if (S.pokes.length >= 5) {
    S.pokes = [];
    if (!reduceMotion.matches) restartAnim(btn, 'spin', 900);
    toast(t('poke_more'));
    const r = btn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, BURST[S.theme.key], 18);
    return;
  }
  if (!reduceMotion.matches) restartAnim(btn, 'squish', 450);
  if (S.pokes.length === 3) toast(t('poke'));
}

function decorSlot(i) {
  const names = DECOR[S.theme.key] || DECOR.autumn;
  const name = names[i % names.length];
  const wrap = h('span', { class: `decor slot${i}` },
    h('span', { class: 'under', svg: doodle(i) }),
    h('button', { class: 'peel', type: 'button', tabindex: '-1', 'aria-hidden': 'true', svg: decor(name) }));
  const btn = wrap.querySelector('.peel');
  btn.addEventListener('click', () => {
    if (wrap.classList.contains('peeled')) return;
    wrap.classList.add('peeled');
    const r = btn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, BURST[S.theme.key], 12);
    S.peeled.add(i);
    if (S.peeled.size === 4) {
      S.peeled = new Set();
      setTimeout(() => { toast(t('all_peeled')); confetti(); }, 500);
    }
    setTimeout(() => wrap.classList.remove('peeled'), 4500);
  });
  return wrap;
}

function ladybugEl() {
  const spots = ['lb-a', 'lb-b', 'lb-c'];
  const bug = h('button', { class: `ladybug ${spots[Math.floor(Math.random() * spots.length)]}`, type: 'button', tabindex: '-1', 'aria-hidden': 'true', svg: ladybug() });
  bug.addEventListener('click', () => {
    if (bug.classList.contains('fly')) return;
    bug.classList.add('fly');
    toast(t('ladybug'));
    S.ladybug = false;
    setTimeout(() => bug.remove(), reduceMotion.matches ? 0 : 1200);
  });
  return bug;
}

function spin(el) {
  if (!reduceMotion.matches) restartAnim(el, 'turn', 600);
}

function burst(x, y, colors = ['#FFC93C'], count = 12) {
  if (reduceMotion.matches) return;
  const fx = $('#fx');
  for (let i = 0; i < count; i++) {
    const p = h('span', { class: `bit${i % 3 === 0 ? ' round' : ''}` });
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const dist = 50 + Math.random() * 60;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist + 40}px`);
    p.style.setProperty('--rot', `${Math.round(Math.random() * 540 - 270)}deg`);
    fx.append(p);
    setTimeout(() => p.remove(), 1100);
  }
}

function confetti() {
  if (reduceMotion.matches) return;
  const fx = $('#fx');
  const colors = BURST.newyear;
  const w = window.innerWidth;
  for (let i = 0; i < 46; i++) {
    const p = h('span', { class: `confetto${i % 4 === 0 ? ' round' : ''}` });
    p.style.left = `${Math.random() * w}px`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--delay', `${Math.random() * 0.6}s`);
    p.style.setProperty('--drift', `${Math.random() * 80 - 40}px`);
    p.style.setProperty('--rot', `${Math.round(Math.random() * 720 - 360)}deg`);
    fx.append(p);
    setTimeout(() => p.remove(), 3200);
  }
}

let toastTimer = null;
function toast(text, kind = '') {
  toastEl = toastEl || $('#toast');
  const el = toastEl;
  const dlg = $('#sheet');
  const host = dlg.open ? dlg : document.body;
  if (el.parentElement !== host) host.append(el);
  el.textContent = text;
  el.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, kind === 'error' ? 6000 : 3200);
}

init();
