/* User guide: a full, searchable manual inside the app. Opens from the book icon next to the settings gear.
   Content lives in guide-1/2/3.js (MSA.guideData), the annotated screenshots in assets/guide-<lang>-<id>.webp and their
   numbered legends in guide-img.js. A contents page jumps straight to any section; a side index follows the reading position. */
(function(){
'use strict';
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc;
const en = () => MSA.state.settings.lang === 'en';
const L = p => (p ? (en() ? p[1] : p[0]) : '') || '';
Object.assign(MSA.dict.en, { 'guide.title': 'User guide', 'guide.sub': 'A complete reference to every part of the app, with steps and annotated screenshots' });
Object.assign(MSA.dict.ar, { 'guide.title': 'دليل المستخدم', 'guide.sub': 'مرجع كامل لكل جزء في البرنامج، بخطوات وصور توضيحية عليها أرقام' });

/* **bold**  [[button / screen name]]  `value` */
const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[\[(.+?)\]\]/g, '<span class="gd-ui">$1</span>').replace(/`(.+?)`/g, '<code>$1</code>');
const G = () => { const s = MSA.state; s.guide = s.guide || {}; s.guide.read = s.guide.read || {}; return s.guide; };
let backTo = 'home', io = null, q = '';

MSA.openGuide = function(hash){
  if (MSA.view !== 'guide') backTo = MSA.view || 'home';
  MSA.state.ui.guideAt = hash || null;
  MSA.go('guide');
};

const data = () => (MSA.guideData || []).filter(c => c && c.secs);
const secText = s => [L(s.h), L(s.p), (s.steps || []).map(L).join(' '), (s.tips || []).map(L).join(' '), (s.warn || []).map(L).join(' '), (s.list || []).map(L).join(' '), (s.legend ? '' : '')].join(' ').toLowerCase();

function figure(s){
  if (!s.img) return '';
  const lg = (MSA.guideShots && MSA.guideShots[s.img] && MSA.guideShots[s.img][en() ? 'en' : 'ar']) || [];
  const nm = 'guide-' + (en() ? 'en' : 'ar') + '-' + s.img + '.webp';
  const src = (window.__GIMG && window.__GIMG[nm]) || ('assets' + '/' + nm);
  return '<figure class="gd-fig"><div class="gd-shot"><img loading="lazy" decoding="async" src="' + src + '" alt="' + esc(L(s.h)) + '" onerror="this.closest(\'figure\').classList.add(\'gd-noimg\')"></div>' +
    (lg.length ? '<ol class="gd-leg">' + lg.map((x, i) => '<li><i>' + (i + 1) + '</i><span>' + rich(x) + '</span></li>').join('') + '</ol>' : '') + '</figure>';
}
function sectionHTML(c, s, n){
  const go = s.go || c.go;
  return '<section class="gd-sec" id="g-' + c.id + '-' + s.id + '" data-sec="' + c.id + '-' + s.id + '"><h3><span class="gd-n">' + n + '</span>' + rich(L(s.h)) + '</h3>' +
    (s.p ? '<p class="gd-p">' + rich(L(s.p)) + '</p>' : '') +
    (s.img ? figure(s) : '') +
    (s.steps && s.steps.length ? '<ol class="gd-steps">' + s.steps.map(x => '<li>' + rich(L(x)) + '</li>').join('') + '</ol>' : '') +
    (s.list && s.list.length ? '<ul class="gd-list">' + s.list.map(x => '<li>' + rich(L(x)) + '</li>').join('') + '</ul>' : '') +
    (s.tips || []).map(x => '<div class="gd-box tip">' + I('bulb', 'sm') + '<div>' + rich(L(x)) + '</div></div>').join('') +
    (s.warn || []).map(x => '<div class="gd-box warn">' + I('info', 'sm') + '<div>' + rich(L(x)) + '</div></div>').join('') +
    (go ? '<button class="btn sm gd-try" data-try="' + esc(go) + '">' + I('external', 'sm') + esc(T('جرّبها الآن', 'Try it now')) + '</button>' : '') + '</section>';
}
function chapterHTML(c, ci){
  return '<article class="gd-ch" id="g-' + c.id + '" data-ch="' + c.id + '" style="--c:' + c.col + '"><header class="gd-chh"><span class="gd-ci">' + I(c.ic || 'book') + '</span><div><small>' + esc(T('الفصل ', 'Chapter ')) + (ci + 1) + '</small><h2>' + esc(L(c.t)) + '</h2></div></header>' +
    '<p class="gd-sum">' + rich(L(c.sum)) + '</p>' + c.secs.map((s, i) => sectionHTML(c, s, (ci + 1) + '.' + (i + 1))).join('') + '</article>';
}
function tocHTML(d){
  return '<div class="gd-toc" id="g-toc">' + d.map((c, ci) => '<div class="gd-tc" data-ch="' + c.id + '" style="--c:' + c.col + '"><button class="gd-tch" data-jump="g-' + c.id + '"><span class="gd-ci">' + I(c.ic || 'book', 'sm') + '</span><span class="gd-tct"><b>' + (ci + 1) + '. ' + esc(L(c.t)) + '</b><small>' + esc(L(c.sum).replace(/\*\*|\[\[|\]\]|`/g, '').slice(0, 90)) + '…</small></span></button>' +
    '<ul>' + c.secs.map((s, i) => '<li data-sec="' + c.id + '-' + s.id + '"><button data-jump="g-' + c.id + '-' + s.id + '"><i>' + (ci + 1) + '.' + (i + 1) + '</i>' + esc(L(s.h).replace(/\*\*|\[\[|\]\]|`/g, '')) + '</button></li>').join('') + '</ul></div>').join('') + '</div>';
}

function render(host){
  const d = data(), total = d.reduce((a, c) => a + c.secs.length, 0), rd = Object.keys(G().read).filter(k => d.some(c => c.secs.some(s => c.id + '-' + s.id === k))).length;
  host.innerHTML = '<div class="gd"><div class="sp-head"><button class="btn sm" id="gdBack">' + I(document.documentElement.dir === 'rtl' ? 'arrow-r' : 'arrow-l', 'sm') + '<span>' + esc(T('رجوع', 'Back')) + '</span></button>' +
    '<h1>' + I('book', 'lg') + '<span>' + esc(MSA.t('guide.title')) + '</span></h1></div>' +
    '<div class="gd-hero"><div><h2>' + esc(T('كل اللي محتاج تعرفه عن البرنامج في مكان واحد', 'Everything you need to know about the app, in one place')) + '</h2><p>' + esc(MSA.t('guide.sub')) + '</p>' +
    '<div class="gd-search">' + I('search', 'sm') + '<input id="gdQ" type="search" placeholder="' + esc(T('ابحث في الدليل… (مثلًا: تسعير، نسخة احتياطية، بصمة)', 'Search the guide… (e.g. pricing, backup, fingerprint)')) + '" autocomplete="off"></div></div>' +
    '<div class="gd-prog" title="' + esc(T('أقسام قرأتها', 'Sections read')) + '"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="17" fill="none" stroke="var(--line)" stroke-width="5"/><circle id="gdRing" cx="21" cy="21" r="17" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + (2 * Math.PI * 17).toFixed(1) + '" stroke-dashoffset="' + (2 * Math.PI * 17 * (1 - rd / Math.max(1, total))).toFixed(1) + '" transform="rotate(-90 21 21)"/></svg><b id="gdPct">' + Math.round(rd / Math.max(1, total) * 100) + '%</b><small>' + esc(T('اتقرا', 'read')) + '</small></div></div>' +
    '<div class="gd-layout"><nav class="gd-nav" id="gdNav" aria-label="guide"><button data-jump="g-toc" class="on">' + I('list', 'sm') + '<span>' + esc(T('الفهرس', 'Contents')) + '</span></button>' +
      d.map((c, i) => '<button data-jump="g-' + c.id + '" data-ch="' + c.id + '" style="--c:' + c.col + '">' + I(c.ic || 'book', 'sm') + '<span>' + (i + 1) + '. ' + esc(L(c.t)) + '</span></button>').join('') + '</nav>' +
    '<div class="gd-main"><h2 class="gd-h">' + I('list', 'sm') + esc(T('الفهرس — اضغط على أي عنوان وهتنزل له مباشرة', 'Contents — tap any title to jump straight to it')) + '</h2>' + tocHTML(d) +
      '<div id="gdBody">' + d.map(chapterHTML).join('') + '</div><div class="gd-empty" id="gdNone" hidden>' + esc(T('مفيش نتيجة للبحث ده. جرّب كلمة تانية.', 'No results. Try another word.')) + '</div>' +
      '<div class="gd-end">' + I('check-c') + '<b>' + esc(T('خلصت الدليل 🎉', 'You reached the end 🎉')) + '</b><p>' + esc(T('لو لسه فيه حاجة مش واضحة، ارجع للفهرس أو ابحث بكلمة من اللي بتدوّر عليه.', 'If something is still unclear, go back to the contents or search for a keyword.')) + '</p></div></div></div>' +
    '<button class="gd-fab" id="gdFab" hidden aria-label="' + esc(T('الفهرس', 'Contents')) + '">' + I('list') + '</button></div>';
  wire(host, d);
}

function scrollToId(id, flash){
  const v = $('#view'), el = document.getElementById(id); if (!v || !el) return;
  const nav = $('#gdNav'); const off = (nav && getComputedStyle(nav).position === 'sticky' && innerWidth <= 820 ? nav.offsetHeight : 0) + 12;
  const top = el.getBoundingClientRect().top - v.getBoundingClientRect().top + v.scrollTop - off;
  v.scrollTo({ top: Math.max(0, top), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  if (flash) { el.classList.remove('gd-flash'); void el.offsetWidth; el.classList.add('gd-flash'); }
}
function wire(host, d){
  const v = $('#view');
  $('#gdBack', host).onclick = () => MSA.go(backTo && backTo !== 'guide' ? backTo : 'home');
  host.addEventListener('click', e => {
    const j = e.target.closest('[data-jump]'); if (j) { scrollToId(j.dataset.jump, !/^g-toc$/.test(j.dataset.jump)); return; }
    const t = e.target.closest('[data-try]'); if (t) { MSA.go(t.dataset.try); return; }
  });
  /* reading position -> side index, read marks, floating contents button */
  if (io) io.disconnect();
  const seen = G().read, secs = $$('.gd-sec', host);
  io = new IntersectionObserver(es => es.forEach(en_ => { if (en_.isIntersecting && en_.intersectionRatio > .35) { const k = en_.target.dataset.sec; if (!seen[k]) { seen[k] = 1; MSA.save(); paint(host, d); const li = $('.gd-toc li[data-sec="' + k + '"]', host); if (li) li.classList.add('done'); } } }), { root: v, threshold: [.35] });
  secs.forEach(s => io.observe(s));
  $$('.gd-toc li', host).forEach(li => { if (seen[li.dataset.sec]) li.classList.add('done'); });
  const spy = () => {
    const fab = $('#gdFab', host), toc = $('#g-toc', host); if (!fab || !toc || !document.body.contains(fab)) { v.removeEventListener('scroll', spy); return; }
    fab.hidden = toc.getBoundingClientRect().bottom > 0;
    let cur = ''; $$('.gd-ch', host).forEach(c => { if (c.getBoundingClientRect().top < 140) cur = c.dataset.ch; });
    $$('#gdNav button', host).forEach(b => b.classList.toggle('on', cur ? b.dataset.ch === cur : b.dataset.jump === 'g-toc'));
    const on = $('#gdNav button.on', host); if (on && innerWidth <= 820) { const nv = $('#gdNav', host); nv.scrollTo({ left: on.offsetLeft - nv.clientWidth / 2 + on.clientWidth / 2, behavior: 'auto' }); }
  };
  v.addEventListener('scroll', spy, { passive: true }); spy();
  $('#gdFab', host).onclick = () => scrollToId('g-toc');
  /* search */
  const qi = $('#gdQ', host);
  qi.oninput = () => { q = qi.value.trim().toLowerCase(); filter(host, d); };
  if (q) { qi.value = q; filter(host, d); }
  const at = MSA.state.ui.guideAt; if (at) { MSA.state.ui.guideAt = null; setTimeout(() => scrollToId('g-' + at, true), 120); }
}
function paint(host, d){
  const total = d.reduce((a, c) => a + c.secs.length, 0), rd = Object.keys(G().read).filter(k => d.some(c => c.secs.some(s => c.id + '-' + s.id === k))).length;
  const ring = $('#gdRing', host), pct = $('#gdPct', host); if (!ring) return;
  ring.setAttribute('stroke-dashoffset', (2 * Math.PI * 17 * (1 - rd / Math.max(1, total))).toFixed(1)); pct.textContent = Math.round(rd / Math.max(1, total) * 100) + '%';
}
function filter(host, d){
  const words = q.split(/\s+/).filter(Boolean); let hits = 0;
  d.forEach(c => {
    let any = 0;
    c.secs.forEach(s => {
      const ok = !words.length || words.every(w => (secText(s) + ' ' + L(c.t).toLowerCase()).includes(w));
      const sec = document.getElementById('g-' + c.id + '-' + s.id), li = $('.gd-toc li[data-sec="' + c.id + '-' + s.id + '"]', host);
      if (sec) sec.hidden = !ok; if (li) li.hidden = !ok; if (ok) { any++; hits++; }
    });
    const ch = document.getElementById('g-' + c.id), tc = $('.gd-tc[data-ch="' + c.id + '"]', host);
    if (ch) ch.hidden = !any; if (tc) tc.hidden = !any;
  });
  $('#gdNone', host).hidden = hits > 0;
  $('.gd-end', host).hidden = words.length > 0;
}
MSA.views.guide = { render };
})();
