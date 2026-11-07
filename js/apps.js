/* Programs used in each step (Photoshop, Premiere ...) shown as small logo badges.
   The built-in badges are plain lettered tiles; the user can drop the official logo (PNG/SVG/JPG) in once per program and it is used everywhere. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc;

/* id, name, short label */
const BUILT = [
  ['ps', 'Photoshop', 'Ps'], ['ai', 'Illustrator', 'Ai'], ['id', 'InDesign', 'Id'], ['lr', 'Lightroom', 'Lr'],
  ['pr', 'Premiere Pro', 'Pr'], ['ae', 'After Effects', 'Ae'], ['au', 'Audition', 'Au'], ['mp', 'Media Encoder', 'Me'],
  ['rs', 'DaVinci Resolve', 'Dv'], ['fc', 'Final Cut', 'Fc'], ['cc', 'CapCut', 'Cc'], ['fg', 'Figma', 'Fg'],
  ['cv', 'Canva', 'Cv'], ['cd', 'CorelDRAW', 'Cd'], ['bl', 'Blender', 'Bl'], ['c4', 'Cinema 4D', 'C4'],
  ['pc', 'Procreate', 'Pc'], ['mj', 'Midjourney', 'Mj'], ['xd', 'Adobe XD', 'Xd'], ['fr', 'Fresco', 'Fr']
];
/* own palette (not tied to any vendor's colours) */
const HUES = [212, 28, 268, 330, 160, 48, 190, 350, 100, 240, 12, 140];
const colorFor = i => 'hsl(' + HUES[i % HUES.length] + ' 62% 46%)';

const st = () => { const s = MSA.state; const a = s.apps = s.apps || {}; a.custom = a.custom || []; a.logos = a.logos || {}; return a; };
const all = () => BUILT.map((b, i) => ({ id: b[0], name: b[1], short: b[2], color: colorFor(i), built: true }))
  .concat(st().custom.map((c, i) => ({ id: c.id, name: c.name, short: c.short || c.name.slice(0, 2), color: colorFor(BUILT.length + i), built: false })));
const get = id => all().find(x => x.id === id);


/* ---- official logos: fetched from the public Iconify icon service, cached on the device and re-checked every 7 days,
   so when a logo is updated upstream the app picks the new one up by itself. A logo you upload yourself always wins. ---- */
const IC = 'https://api.iconify.design/';
/* per program: [iconify set, icon name] candidates tried in order, and the brand colour used for single-colour sets */
const SRC = {
  ps: ['31A8FF', ['logos', 'adobe-photoshop'], ['simple-icons', 'adobephotoshop'], ['streamline-logos', 'adobe-photoshop-logo']],
  ai: ['FF9A00', ['logos', 'adobe-illustrator'], ['simple-icons', 'adobeillustrator'], ['streamline-logos', 'adobe-illustrator-logo']],
  id: ['FF3366', ['logos', 'adobe-indesign'], ['simple-icons', 'adobeindesign'], ['streamline-logos', 'adobe-indesign-logo']],
  lr: ['31A8FF', ['logos', 'adobe-lightroom'], ['simple-icons', 'adobelightroom'], ['streamline-logos', 'adobe-lightroom-logo']],
  pr: ['9999FF', ['logos', 'adobe-premiere'], ['simple-icons', 'adobepremierepro'], ['streamline-logos', 'adobe-premiere-pro-logo']],
  ae: ['9999FF', ['logos', 'adobe-after-effects'], ['simple-icons', 'adobeaftereffects'], ['streamline-logos', 'adobe-after-effects-logo']],
  au: ['00E4BB', ['logos', 'adobe-audition'], ['simple-icons', 'adobeaudition'], ['streamline-logos', 'adobe-audition-logo']],
  mp: ['9999FF', ['logos', 'adobe-media-encoder'], ['simple-icons', 'adobemediaencoder'], ['streamline-logos', 'adobe-media-encoder-logo']],
  xd: ['FF61F6', ['logos', 'adobe-xd'], ['simple-icons', 'adobexd'], ['streamline-logos', 'adobe-xd-logo']],
  fr: ['FF3366', ['logos', 'adobe-fresco'], ['simple-icons', 'adobefresco'], ['streamline-logos', 'adobe-fresco-logo']],
  rs: ['233A51', ['logos', 'davinci-resolve'], ['simple-icons', 'davinciresolve']],
  fc: ['9B9B9B', ['logos', 'final-cut-pro'], ['simple-icons', 'finalcutpro']],
  cc: ['B0B0B0', ['simple-icons', 'capcut'], ['logos', 'capcut']],
  fg: ['F24E1E', ['logos', 'figma'], ['simple-icons', 'figma']],
  cv: ['00C4CC', ['logos', 'canva'], ['simple-icons', 'canva']],
  cd: ['4EB547', ['logos', 'coreldraw'], ['simple-icons', 'coreldraw']],
  bl: ['E87D0D', ['logos', 'blender'], ['simple-icons', 'blender']],
  c4: ['011A6A', ['logos', 'cinema-4d'], ['simple-icons', 'cinema4d']],
  pc: ['9B9B9B', ['simple-icons', 'procreate'], ['logos', 'procreate']],
  mj: ['9B9B9B', ['simple-icons', 'midjourney'], ['logos', 'midjourney']]
};
const OKEY = 'msa_applogos_v1', STALE = 7 * 24 * 3600 * 1000;
let OC = {}; try { OC = JSON.parse(localStorage.getItem(OKEY) || '{}') || {}; } catch (e) { OC = {}; }
const saveOC = () => { try { localStorage.setItem(OKEY, JSON.stringify(OC)); } catch (e) {} };
const toData = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
const officialSync = id => (OC[id] && OC[id].svg) ? toData(OC[id].svg) : null;
const hasOfficial = id => !!SRC[id];
async function fetchTxt(u){
  const ctl = typeof AbortController === 'function' ? new AbortController() : null, tm = setTimeout(() => ctl && ctl.abort(), 7000);
  try { const r = await fetch(u, ctl ? { signal: ctl.signal } : undefined); if (!r.ok) return null; const t = await r.text(); return /^\s*<svg[\s>]/i.test(t) && t.length > 80 && t.length < 400000 ? t : null; }
  catch (e) { return null; } finally { clearTimeout(tm); }
}
const inflight = new Map();
function refreshOfficial(id, force){
  const src = SRC[id]; if (!src) return Promise.resolve(null);
  const c = OC[id]; if (!force && c && c.svg && Date.now() - c.ts < STALE) return Promise.resolve(toData(c.svg));
  if (inflight.has(id)) return inflight.get(id);
  const p = (async () => {
    for (let i = 1; i < src.length; i++) {
      const [set, name] = src[i], mono = set === 'simple-icons';
      const t = await fetchTxt(IC + set + '/' + name + '.svg' + (mono ? '?color=%23' + src[0] : ''));
      if (t) { const changed = !c || c.svg !== t; OC[id] = { svg: t, ts: Date.now(), from: set + ':' + name }; saveOC(); if (changed) repaint(id); return toData(t); }
    }
    if (c && c.svg) { c.ts = Date.now() - STALE + 6 * 3600 * 1000; saveOC(); return toData(c.svg); }  /* offline: keep what we have, try again in 6 hours */
    return null;
  })().finally(() => inflight.delete(id));
  inflight.set(id, p); return p;
}
/* a logo arrived or changed: update every badge of that program already on screen */
function repaint(id){
  $$('.appb[data-app="' + id + '"]').forEach(b => {
    if (st().logos[id]) return;
    const u = officialSync(id); if (!u) return;
    b.classList.add('has'); b.innerHTML = '<img data-alogo="' + esc(id) + '" alt="' + esc(b.title || '') + '" src="' + u + '">';
  });
}
/* keep every known logo fresh in the background (one at a time, silent) */
let sweeping = false;
async function sweep(){
  if (sweeping || (typeof navigator !== 'undefined' && navigator.onLine === false)) return; sweeping = true;
  try { for (const id of Object.keys(SRC)) { const c = OC[id]; if (!c || !c.svg || Date.now() - c.ts >= STALE) { await refreshOfficial(id); await new Promise(r => setTimeout(r, 150)); } } } catch (e) {} finally { sweeping = false; }
}
setTimeout(sweep, 6000);
window.addEventListener('online', () => setTimeout(sweep, 1500));

const urls = new Map();
async function logoUrl(id){
  const a = st().logos[id];
  if (!a) { const sy = officialSync(id); if (sy) { refreshOfficial(id); return sy; } return hasOfficial(id) ? refreshOfficial(id, !OC[id]) : null; }
  if (urls.has(a.id)) return urls.get(a.id);
  const u = await MSA.files.url(a.id); if (u) urls.set(a.id, u); return u;
}
/* badge markup; call MSA.apps.hydrate(root) afterwards to load uploaded logos */
function badge(id, size){
  const x = get(id); if (!x) return '';
  const has = !!st().logos[id] || hasOfficial(id), sz = size || 24, pre = !st().logos[id] ? officialSync(id) : null;
  return '<span class="appb' + (has ? ' has' : '') + '" data-app="' + esc(id) + '" title="' + esc(x.name) + '" style="width:' + sz + 'px;height:' + sz + 'px;--ac:' + x.color + ';font-size:' + Math.round(sz * .42) + 'px">' +
    (has ? '<img data-alogo="' + esc(id) + '" alt="' + esc(x.name) + '"' + (pre ? ' src="' + pre + '"' : '') + '>' : '<b>' + esc(x.short) + '</b>') + '</span>';
}
function hydrate(root){
  $$('[data-alogo]', root || document).forEach(async im => { if (im.src) return; const u = await logoUrl(im.dataset.alogo); if (u) im.src = u; else { const b = im.closest('.appb'); if (b) { b.classList.remove('has'); b.innerHTML = '<b>' + esc((get(im.dataset.alogo) || {}).short || '') + '</b>'; } } });
}
const chips = (s, size) => (s.apps && s.apps.length ? s.apps.map(id => badge(id, size)).join('') : '');

async function setLogo(id){
  const f = (await MSA.pickFiles('image/*', false))[0]; if (!f) return false;
  try {
    const old = st().logos[id]; const a = await MSA.files.put(f);
    st().logos[id] = { id: a.id, name: a.name, mime: a.mime, size: a.size, kind: 'image' };
    if (old) { urls.delete(old.id); await MSA.files.del(old.id); }
    MSA.save(); return true;
  } catch (e) { MSA.toast(T('تعذّر حفظ اللوجو', 'Could not save the logo'), 'err'); return false; }
}
async function clearLogo(id){ const old = st().logos[id]; if (!old) return; delete st().logos[id]; urls.delete(old.id); try { await MSA.files.del(old.id); } catch (e) {} MSA.save(); }

/* the picker: tap programs to toggle them on the step; pencil = set / change logo; "+" = new program */
function pick(step, done, tabName){
  step.apps = step.apps || [];
  let tab = tabName || (MSA.state.ui && MSA.state.ui.apTab) || 'apps';
  const m = MSA.modal({ title: T('البرامج والمواقع المستخدمة في هذه الخطوة', 'Programs & sites used in this step'), size: 'wide', footer: false, body: '<div class="ap-tabs" id="apTabs"></div><div id="apBody"></div>',
    onClose: () => { done && done(); } });
  const body = $('#apBody', m.el), tabs = $('#apTabs', m.el);
  const drawTabs = () => {
    tabs.innerHTML = '<button data-tb="apps" class="' + (tab === 'apps' ? 'on' : '') + '">' + I('grid', 'sm') + esc(T('البرامج المستخدمة', 'Programs used')) + (step.apps.length ? '<i>' + step.apps.length + '</i>' : '') + '</button>' +
      '<button data-tb="sites" class="' + (tab === 'sites' ? 'on' : '') + '">' + I('globe', 'sm') + esc(T('المواقع المستخدمة', 'Sites used')) + ((step.sites || []).length ? '<i>' + step.sites.length + '</i>' : '') + '</button>';
    $$('[data-tb]', tabs).forEach(b => b.onclick = () => { tab = b.dataset.tb; try { MSA.state.ui.apTab = tab; MSA.save(); } catch (e) {} draw(); });
  };
  const draw = () => {
    drawTabs();
    if (tab === 'sites' && MSA.sites) { MSA.sites.draw(body, step, draw); return; }
    body.innerHTML = '<div class="hint" style="margin-bottom:10px">' + esc(T('اضغط على البرنامج لإضافته أو إزالته. القلم لتغيير اللوجو (ارفع اللوجو الرسمي مرة واحدة وهيظهر في كل المراحل).', 'Tap a program to add or remove it. The pencil sets its logo (upload the official logo once and it shows everywhere).')) + '</div>' +
      '<div class="ap-grid">' + all().map(x => {
        const on = step.apps.includes(x.id);
        return '<div class="ap-tile' + (on ? ' on' : '') + '" data-id="' + esc(x.id) + '" role="button" tabindex="0">' + badge(x.id, 44) + '<span class="ap-n" dir="auto">' + esc(x.name) + '</span>' +
          (on ? '<i class="ap-ck">' + I('check', 'sm') + '</i>' : '') + '<button class="icon-btn sm ap-ed" data-ed="' + esc(x.id) + '" aria-label="logo">' + I('pencil', 'sm') + '</button></div>';
      }).join('') + '<button class="ap-tile ap-new" data-new>' + I('plus') + '<span class="ap-n">' + esc(T('برنامج جديد', 'New program')) + '</span></button></div>';
    hydrate(body);
    $$('.ap-tile[data-id]', body).forEach(t => t.onclick = e => {
      if (e.target.closest('[data-ed]')) return;
      const id = t.dataset.id, i = step.apps.indexOf(id); if (i >= 0) step.apps.splice(i, 1); else step.apps.push(id);
      MSA.save(); draw();
    });
    $$('[data-ed]', body).forEach(b => b.onclick = e => { e.stopPropagation(); edit(b.dataset.ed); });
    $('[data-new]', body).onclick = async () => {
      const n = await MSA.ask({ title: T('اسم البرنامج', 'Program name'), placeholder: T('مثال: Substance Painter', 'e.g. Substance Painter') }); if (!n) return;
      const id = U.uid('ap'); st().custom.push({ id, name: n.slice(0, 40), short: n.replace(/[^A-Za-z0-9؀-ۿ]/g, '').slice(0, 2) || n.slice(0, 2) });
      step.apps.push(id); MSA.save(); draw();
    };
  };
  const edit = id => {
    const x = get(id); if (!x) return;
    const has = !!st().logos[id];
    const mm = MSA.modal({ title: x.name, footer: false, body: '<div class="row" style="justify-content:center;margin-bottom:12px">' + badge(id, 72) + '</div><div class="col" style="gap:8px">' +
      '<button class="btn primary" data-a="up">' + I('upload', 'sm') + esc(T('رفع اللوجو (PNG / SVG / JPG)', 'Upload logo (PNG / SVG / JPG)')) + '</button>' +
      (has ? '<button class="btn" data-a="rm">' + I('x', 'sm') + esc(T('إزالة لوجوي (الرجوع للّوجو الرسمي)', 'Remove my logo (back to the official one)')) + '</button>' : '') +
      (!x.built ? '<button class="btn" data-a="ren">' + I('pencil', 'sm') + esc(T('تغيير الاسم', 'Rename')) + '</button><button class="btn danger" data-a="del">' + I('trash', 'sm') + esc(T('حذف البرنامج', 'Delete program')) + '</button>' : '') + '</div>' });
    hydrate(mm.el);
    $('[data-a=up]', mm.el).onclick = async () => { if (await setLogo(id)) { mm.close(); draw(); } };
    const rm = $('[data-a=rm]', mm.el); if (rm) rm.onclick = async () => { await clearLogo(id); mm.close(); draw(); };
    const rn = $('[data-a=ren]', mm.el); if (rn) rn.onclick = async () => { const v = await MSA.ask({ title: T('اسم البرنامج', 'Program name'), value: x.name }); if (v) { const c = st().custom.find(y => y.id === id); c.name = v.slice(0, 40); MSA.save(); mm.close(); draw(); } };
    const dl = $('[data-a=del]', mm.el); if (dl) dl.onclick = async () => {
      if (!await MSA.confirm(T('حذف «' + x.name + '» من كل المراحل؟', 'Remove “' + x.name + '” from every step?'), { danger: true, okLabel: T('حذف', 'Delete') })) return;
      await clearLogo(id); st().custom = st().custom.filter(y => y.id !== id);
      MSA.proj.walk && MSA.state.projects.forEach(p => MSA.proj.walk(p.steps, s => { if (s.apps) s.apps = s.apps.filter(a => a !== id); }));
      mm.close(); draw(); MSA.save();
    };
  };
  draw();
}
/* click on a badge row opens the picker; used by the plan list and the map */
MSA.apps = { all, get, badge, chips, hydrate, pick };
})();
