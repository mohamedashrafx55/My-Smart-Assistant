/* Boot: theme, language, navigation, splash, seed data, reminders */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const t = (k, v) => MSA.t(k, v);
const NAV = [['active', 'briefcase'], ['done', 'trophy'], ['learn', 'grad'], ['tasks', 'checks']];
const S = () => MSA.state;

/* ---------- appearance ---------- */
function inkFor(hex){
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return '#fff';
  const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 170 ? '#111' : '#fff';
}
MSA.applyAccent = function(){
  const c = S().settings.accent || '#5b8def', r = document.documentElement.style;
  r.setProperty('--accent', c); r.setProperty('--accent-ink', inkFor(c));
};
MSA.effectiveTheme = function(){
  const th = S().settings.theme;
  return th === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : (th === 'light' ? 'light' : 'dark');
};
MSA.applyTheme = function(){
  const th = MSA.effectiveTheme();
  document.documentElement.dataset.theme = th;
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = th === 'dark' ? '#2e2e2e' : '#f8f7f5';
  const b = $('#btnTheme'); if (b) { b.innerHTML = I(th === 'dark' ? 'sun' : 'moon'); b.title = t(th === 'dark' ? 'themeLight' : 'themeDark'); }
  if (MSA.view === 'tasks') MSA.rerender();
};
matchMedia('(prefers-color-scheme: light)').addEventListener && matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (S().settings.theme === 'auto') MSA.applyTheme(); });

MSA.applyLang = function(){
  const lang = S().settings.lang === 'en' ? 'en' : 'ar';
  const h = document.documentElement; h.lang = lang; h.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = 'My Smart Assistant';
  buildNav(); buildTop(); MSA.applyProfile(); tickClock();
  const b = $('#btnTheme'); if (b) b.title = t(MSA.effectiveTheme() === 'dark' ? 'themeLight' : 'themeDark');
  if (MSA.view) { $$('#nav .nav-item').forEach(x => x.classList.toggle('active', x.dataset.view === MSA.view)); MSA.rerender(); }
};
MSA.applyProfile = function(){ const f = $('#navFoot'); if (f) f.textContent = S().profile.name || ''; };

/* ---------- chrome ---------- */
function buildTop(){
  const g = $('#btnSettings'); g.innerHTML = I('gear', 'lg') + '<span class="gear-lbl">' + U.esc(t('settings')) + '</span>';
  g.setAttribute('aria-label', t('settings'));
  const th = $('#btnTheme'); if (th) th.setAttribute('aria-label', t('theme'));
}
function buildNav(){
  const nav = $('#nav');
  nav.innerHTML = NAV.map(n => '<button class="nav-item" data-view="' + n[0] + '">' + I(n[1]) + '<span class="lbl">' + U.esc(t('nav.' + n[0])) + '</span><span class="lbl-s">' + U.esc(t('nav.s.' + n[0])) + '</span><span class="count" data-count="' + n[0] + '" hidden></span></button>').join('') + '<div class="nav-foot" id="navFoot"></div>';
  MSA.updateCounts();
}
MSA.updateCounts = function(){
  const s = S(), P = MSA.proj, c = {
    active: P.activeList().length, done: P.doneList().length, learn: s.learning.videos.length,
    tasks: s.tasks.filter(x => x.type === 'task' && x.status !== 'done').length
  };
  $$('[data-count]').forEach(el => { const n = c[el.dataset.count] || 0; el.textContent = n; el.hidden = !n; });
};
function tickClock(){
  const el = $('#clock'); if (!el) return;
  const loc = S().settings.lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB';
  el.textContent = new Intl.DateTimeFormat(loc, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date());
}

/* ---------- first-run content: the Finjan campaign plan ---------- */
function seed(){
  const s = S(); if (s.seeded) return; s.seeded = true; MSA.save();
  /* new installs start empty (no sample project); the demo can still be added from Settings → Data */
}

/* ---------- splash ---------- */
function runSplash(){
  const sp = $('#splash'); let finished = false;
  const tt = $('.splash-title', sp); if (tt && !tt.querySelector('span')) { tt.innerHTML = Array.from(tt.dataset.t || tt.textContent).map((ch, i) => '<span style="--i:' + i + '">' + (ch === ' ' ? ' ' : ch) + '</span>').join(''); }
  const hi = $('#splashHi', sp); if (hi) hi.innerHTML = (S().settings.lang === 'en' ? 'Welcome back, ' : 'أهلاً بعودتك يا ') + '<b>' + MSA.u.esc(MSA.myName()) + '</b>';
  const finish = () => { if (finished) return; finished = true; $('#app').hidden = false; sp.classList.add('out'); setTimeout(() => sp.remove(), 1000); document.removeEventListener('keydown', finish); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (S().settings.intro === false || reduce) { setTimeout(finish, reduce ? 500 : 40); return; }
  sp.addEventListener('click', finish); document.addEventListener('keydown', finish);
  setTimeout(finish, 5200);
}

/* ---------- boot ---------- */
function boot(){
  MSA.applyAccent(); MSA.applyTheme();
  const lang = S().settings.lang === 'en' ? 'en' : 'ar'; S().settings.lang = lang;
  const h = document.documentElement; h.lang = lang; h.dir = lang === 'ar' ? 'rtl' : 'ltr';
  seed();
  buildNav(); buildTop(); MSA.applyProfile(); tickClock(); setInterval(tickClock, 30000);
  $('#btnSettings').addEventListener('click', () => MSA.openSettings());
  $('#btnHome').addEventListener('click', () => MSA.go('home'));
  $('.brand').addEventListener('click', () => MSA.go('home'));
  $('#btnTheme').addEventListener('click', () => { S().settings.theme = MSA.effectiveTheme() === 'dark' ? 'light' : 'dark'; MSA.save(); MSA.applyTheme(); if (MSA.refreshSettings) MSA.refreshSettings(); });
  $('#nav').addEventListener('click', e => {
    const b = e.target.closest('.nav-item'); if (!b) return;
    if (b.dataset.view === 'done' && MSA.view === 'done') S().ui.doneOpen = null;
    MSA.go(b.dataset.view);
  });
  MSA.applyTheme();
  MSA.go('home');
  MSA.startReminders();
  runSplash();
}
/* user-typed fields follow the direction of what is typed (Arabic or English) */
let dirQueued = false;
const SEL = 'textarea:not([dir]),input[type=text]:not([dir]),input[type=search]:not([dir]),[contenteditable=true]:not([dir])';
function applyAutoDir(){ dirQueued = false; $$(SEL).forEach(e => e.setAttribute('dir', 'auto')); }
new MutationObserver(() => { if (!dirQueued) { dirQueued = true; requestAnimationFrame(applyAutoDir); } }).observe(document.body, { childList: true, subtree: true });
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
/* offline support for the hosted web version only (not inside Electron / Capacitor, not on localhost) */
if ('serviceWorker' in navigator && location.protocol === 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !window.Capacitor) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
window.addEventListener('error', e => console.error('[MSA]', e.message, e.filename + ':' + e.lineno));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

