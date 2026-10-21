/* Shared UI helpers: toast, modal, drawer, dialogs, context menu, attachments */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
MSA.$ = $; MSA.$$ = $$;
const t = (k, v) => MSA.t(k, v);

/* delegated click handler: <button data-act="name"> -> map.name(el, event) */
MSA.on = function(root, map, type){
  root.addEventListener(type || 'click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el)) return;
    const fn = map[el.dataset.act];
    if (fn) fn(el, e);
  });
};
MSA.openLink = function(url){
  if (!url) return;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = 'https://' + url;
  if (!/^(https?|mailto|tel):/i.test(url)) return;          // never open javascript:/data: links
  const B = MSA.native && MSA.native('Browser');
  if (B && /^https?:/i.test(url)) { B.open({ url }).catch(() => window.open(url, '_blank', 'noopener,noreferrer')); return; }
  window.open(url, '_blank', 'noopener,noreferrer');
};
MSA.fmtDate = function(ms, withTime){
  if (ms == null || isNaN(ms)) return '';
  const loc = MSA.state.settings.lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB';
  const o = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) { o.hour = '2-digit'; o.minute = '2-digit'; }
  return new Intl.DateTimeFormat(loc, o).format(new Date(ms));
};

/* ---------- toast ---------- */
MSA.toast = function(msg, type, ms){
  const root = $('#toastRoot'); if (!root) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (type || 'ok');
  el.innerHTML = I(type === 'err' ? 'info' : type === 'bell' ? 'bell' : 'check-c') + '<span></span>';
  el.lastChild.textContent = msg;
  root.appendChild(el);
  setTimeout(() => { el.style.transition = '.3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }, ms || 2800);
};

/* ---------- overlays ---------- */
const stack = [];
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && stack.length) { const top = stack[stack.length - 1]; if (!top.static) top.close(); }
});
function mountOverlay(wrapEl, opts){
  const root = $('#overlayRoot');
  root.appendChild(wrapEl);
  const api = { el: wrapEl, static: !!opts.static, close(){ if (api.closed) return; api.closed = true; const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1); wrapEl.remove(); opts.onClose && opts.onClose(); } };
  stack.push(api);
  wrapEl.addEventListener('mousedown', e => { if (e.target === wrapEl && !api.static) api.close(); });
  return api;
}
MSA.closeAllOverlays = () => { while (stack.length) stack[stack.length - 1].close(); };

MSA.modal = function(o){
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.innerHTML = '<div class="modal ' + (o.size || '') + '" role="dialog" aria-modal="true">' +
    '<div class="mh"><h3></h3><button class="icon-btn sm" data-x aria-label="' + U.esc(t('close')) + '">' + I('x') + '</button></div>' +
    '<div class="mb"></div>' + (o.footer === false ? '' : '<div class="mf"></div>') + '</div>';
  $('h3', wrap).textContent = o.title || '';
  const body = $('.mb', wrap);
  if (typeof o.body === 'string') body.innerHTML = o.body; else if (o.body) body.appendChild(o.body);
  const api = mountOverlay(wrap, o);
  $('[data-x]', wrap).onclick = api.close;
  const foot = $('.mf', wrap);
  (o.buttons || []).forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + (b.cls || '');
    btn.innerHTML = (b.icon ? I(b.icon, 'sm') : '') + '<span></span>';
    btn.lastChild.textContent = b.label;
    btn.onclick = () => { const r = b.onClick ? b.onClick(api, wrap) : api.close(); };
    foot && foot.appendChild(btn);
  });
  if (o.onMount) o.onMount(wrap, api);
  return api;
};

MSA.drawer = function(o){
  const wrap = document.createElement('div');
  wrap.className = 'drawer-wrap';
  wrap.innerHTML = '<aside class="drawer ' + (o.side || 'right') + '" role="dialog" aria-modal="true">' +
    '<div class="mh"><h3></h3><button class="icon-btn sm" data-x aria-label="' + U.esc(t('close')) + '">' + I('x') + '</button></div>' +
    '<div class="mb"></div>' + (o.buttons ? '<div class="mf"></div>' : '') + '</aside>';
  $('h3', wrap).textContent = o.title || '';
  const body = $('.mb', wrap);
  if (typeof o.body === 'string') body.innerHTML = o.body; else if (o.body) body.appendChild(o.body);
  const api = mountOverlay(wrap, o);
  $('[data-x]', wrap).onclick = api.close;
  const foot = $('.mf', wrap);
  (o.buttons || []).forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + (b.cls || '');
    btn.innerHTML = (b.icon ? I(b.icon, 'sm') : '') + '<span></span>'; btn.lastChild.textContent = b.label;
    btn.onclick = () => b.onClick(api, wrap);
    foot.appendChild(btn);
  });
  if (o.onMount) o.onMount(wrap, api);
  return api;
};

/* prompt / confirm replacements */
MSA.ask = function(o){
  return new Promise(res => {
    let done = false; const fin = v => { if (!done) { done = true; res(v); } };
    const multi = o.multiline;
    const m = MSA.modal({
      title: o.title, size: '',
      body: '<div class="field" style="margin:0">' + (o.label ? '<label class="f">' + U.esc(o.label) + '</label>' : '') +
        (multi ? '<textarea id="askIn" placeholder="' + U.esc(o.placeholder || '') + '"></textarea>' : '<input id="askIn" type="' + (o.type || 'text') + '" placeholder="' + U.esc(o.placeholder || '') + '">') + '</div>',
      buttons: [
        { label: t('cancel'), cls: 'ghost', onClick: a => { a.close(); } },
        { label: o.okLabel || t('save'), cls: 'primary', onClick: a => { const v = $('#askIn', a.el).value.trim(); if (o.required !== false && !v) { $('#askIn', a.el).focus(); return; } fin(v); a.close(); } }
      ],
      onClose: () => fin(null),
      onMount: el => { const i = $('#askIn', el); i.value = o.value || ''; setTimeout(() => { i.focus(); i.select && i.select(); }, 30); i.addEventListener('keydown', e => { if (e.key === 'Enter' && !multi) { e.preventDefault(); $('.btn.primary', el).click(); } }); }
    });
  });
};
MSA.confirm = function(msg, o){
  o = o || {};
  return new Promise(res => {
    let done = false; const fin = v => { if (!done) { done = true; res(v); } };
    MSA.modal({
      title: o.title || t('confirm'), body: '<p style="margin:0">' + U.esc(msg) + '</p>',
      buttons: [
        { label: t('cancel'), cls: 'ghost', onClick: a => a.close() },
        { label: o.okLabel || t('ok'), cls: o.danger ? 'primary' : 'primary', onClick: a => { fin(true); a.close(); } }
      ],
      onClose: () => fin(false),
      onMount: el => { if (o.danger) { const b = $('.btn.primary', el); b.style.background = 'var(--danger)'; b.style.borderColor = 'var(--danger)'; } }
    });
  });
};

/* ---------- context menu ---------- */
let ctxEl = null;
function closeCtx(){ if (ctxEl) { ctxEl.remove(); ctxEl = null; } }
let ctxAt = 0, ctxGuard = 0;
document.addEventListener('mousedown', e => { if (ctxEl && !ctxEl.contains(e.target) && Date.now() - ctxAt > ctxGuard) closeCtx(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCtx(); });
window.addEventListener('scroll', closeCtx, true);
window.addEventListener('resize', closeCtx);
MSA.ctx = function(x, y, items, o){
  closeCtx();
  const el = document.createElement('div'); el.className = 'ctx';
  items.forEach(it => {
    if (it === '-') { el.appendChild(document.createElement('hr')); return; }
    const b = document.createElement('button'); if (it.danger) b.className = 'danger';
    b.innerHTML = I(it.icon || 'minus', 'sm') + '<span></span>'; b.lastChild.textContent = it.label;
    b.onclick = () => { if (Date.now() - ctxAt < ctxGuard) return; closeCtx(); it.onClick(); }; el.appendChild(b);
  });
  document.body.appendChild(el);
  const r = el.getBoundingClientRect();
  el.style.left = Math.max(6, Math.min(x, innerWidth - r.width - 6)) + 'px';
  el.style.top = Math.max(6, Math.min(y, innerHeight - r.height - 6)) + 'px';
  ctxEl = el; ctxAt = Date.now(); ctxGuard = o && o.guard ? 450 : 0; return el;
};
MSA.closeCtx = closeCtx;

/* ---------- attachments ---------- */
const ACCEPT = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
  doc: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.rtf,.zip,.rar,.7z,.psd,.ai,.eps,.indd,.fig,.sketch,.xd,.svg,.json'
};
MSA.ACCEPT = ACCEPT;
MSA.pickFiles = function(accept, multiple){
  return new Promise(res => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept || ''; inp.multiple = !!multiple; inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.onchange = () => { res(Array.from(inp.files)); inp.remove(); };
    inp.oncancel = () => { res([]); inp.remove(); };
    inp.click();
  });
};
/* pick + store files of a kind; resolves to attachment descriptors */
MSA.addFiles = async function(kind){
  const files = await MSA.pickFiles(ACCEPT[kind] || '', true);
  const out = [];
  for (const f of files) {
    try { const a = await MSA.files.put(f); if (kind !== 'doc' && a.kind === 'doc') a.kind = kind; out.push(a); }
    catch (e) { MSA.toast(t('fileFail') + ': ' + f.name, 'err'); }
  }
  if (out.length) MSA.toast(t('filesAdded', { n: out.length }));
  return out;
};
const KIND_ICON = { image: 'image', video: 'video', audio: 'music', doc: 'doc' };
MSA.attHTML = function(a, removable){
  const ext = (a.name.split('.').pop() || '').slice(0, 5).toUpperCase();
  let inner;
  if (a.kind === 'image') inner = '<img data-thumb="' + a.id + '" alt="">';
  else if (a.kind === 'video') inner = '<video data-thumb="' + a.id + '" muted preload="metadata" playsinline></video><span class="tag">' + I('play') + '</span>';
  else inner = '<div class="kind">' + I(KIND_ICON[a.kind] || 'doc') + '<span>' + U.esc(a.kind === 'doc' ? ext : a.name.slice(0, 18)) + '</span></div>';
  return '<div class="att" data-att="' + a.id + '" title="' + U.esc(a.name) + '">' + inner +
    (removable ? '<button class="x" data-rm-att="' + a.id + '" aria-label="' + U.esc(t('delete')) + '">' + I('x', 'sm') + '</button>' : '') + '</div>';
};
MSA.hydrateAtts = function(root){
  $$('[data-thumb]', root).forEach(async el => {
    if (el.src) return;
    const u = await MSA.files.url(el.dataset.thumb);
    if (u) el.src = el.tagName === 'VIDEO' ? u + '#t=0.1' : u; else { const w = el.closest('.att'); if (w) w.style.opacity = .4; }
  });
};
MSA.downloadAtt = async function(a){
  const u = await MSA.files.url(a.id); if (!u) return;
  const l = document.createElement('a'); l.href = u; l.download = a.name; document.body.appendChild(l); l.click(); l.remove();
};
MSA.openAtt = async function(a, list){
  list = list && list.length ? list : [a];
  let idx = Math.max(0, list.findIndex(x => x.id === a.id));
  const m = MSA.modal({ title: a.name, size: 'wide', footer: false, body: '<div class="viewer" id="vwr"></div>' });
  const show = async () => {
    const cur = list[idx]; $('h3', m.el).textContent = cur.name;
    const box = $('#vwr', m.el); box.innerHTML = '';
    const u = await MSA.files.url(cur.id);
    if (!u) { box.innerHTML = '<p class="muted">' + U.esc(t('fileMissing')) + '</p>'; return; }
    if (cur.kind === 'image') box.innerHTML = '<img src="' + u + '" alt="">';
    else if (cur.kind === 'video') box.innerHTML = '<video src="' + u + '" controls autoplay playsinline></video>';
    else if (cur.kind === 'audio') box.innerHTML = '<div style="width:100%;text-align:center">' + I('music', 'lg') + '<div style="margin:10px 0">' + U.esc(cur.name) + '</div><audio src="' + u + '" controls autoplay></audio></div>';
    else box.innerHTML = '<div style="text-align:center">' + I('doc', 'lg') + '<div style="margin:10px 0">' + U.esc(cur.name) + '<div class="hint">' + U.size(cur.size || 0) + '</div></div><button class="btn primary" id="dlBtn">' + I('download', 'sm') + U.esc(t('download')) + '</button></div>';
    const d = $('#dlBtn', m.el); if (d) d.onclick = () => MSA.downloadAtt(cur);
    if (list.length > 1) {
      const nav = document.createElement('div'); nav.className = 'row'; nav.style.cssText = 'justify-content:center;margin-top:12px';
      nav.innerHTML = '<button class="btn sm" data-n="-1">' + I('chev-l', 'sm flip') + '</button><span class="hint">' + (idx + 1) + ' / ' + list.length + '</span><button class="btn sm" data-n="1">' + I('chev-r', 'sm flip') + '</button><button class="btn sm" id="dl2">' + I('download', 'sm') + '</button>';
      box.parentNode.appendChild(nav);
      const old = $$('.row', box.parentNode); if (old.length > 1) old[0].remove();
      $$('[data-n]', nav).forEach(b => b.onclick = () => { idx = (idx + +b.dataset.n + list.length) % list.length; nav.remove(); show(); });
      $('#dl2', nav).onclick = () => MSA.downloadAtt(cur);
    }
  };
  show();
};
/* wire click handlers for attachment thumbnails inside a container; getList(id) returns the array the attachment lives in */
MSA.bindAtts = function(root, getList, onRemove){
  root.addEventListener('click', e => {
    const rm = e.target.closest('[data-rm-att]');
    if (rm && root.contains(rm)) { e.stopPropagation(); onRemove && onRemove(rm.dataset.rmAtt); return; }
    const el = e.target.closest('.att[data-att]');
    if (el && root.contains(el)) { const list = getList(el.dataset.att) || []; const a = list.find(x => x.id === el.dataset.att); if (a) MSA.openAtt(a, list); }
  });
};

/* small helpers for rendering */
MSA.empty = (icon, msg, sub) => '<div class="empty">' + I(icon) + '<div style="font-weight:600;color:var(--text)">' + U.esc(msg) + '</div>' + (sub ? '<div style="margin-top:4px">' + U.esc(sub) + '</div>' : '') + '</div>';
MSA.rich = html => '<div class="rich">' + U.sanitize(html) + '</div>';

/* register / switch views */
MSA.views = {};
MSA.view = null;
MSA.go = function(name){
  if (!MSA.views[name]) return;
  MSA.view = name; MSA.state.ui.view = name; MSA.save();
  $$('#nav .nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  MSA.render(true);
  $('#view').scrollTop = 0;
};
MSA.render = function(animate){
  const v = $('#view'); if (!MSA.view) return;
  MSA.closeCtx();
  v.innerHTML = '<div class="' + (animate ? 'view-in' : '') + '"></div>';
  const host = v.firstChild;
  MSA.views[MSA.view].render(host);
  MSA.hydrateAtts(host);
};
/* keepScroll=false means "navigated inside the view": animate and start from the top */
MSA.rerender = function(keepScroll){
  const v = $('#view'), top = v.scrollTop;
  MSA.render(keepScroll === false);
  v.scrollTop = keepScroll === false ? 0 : top;
};
})();

