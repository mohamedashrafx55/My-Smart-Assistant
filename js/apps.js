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

const urls = new Map();
async function logoUrl(id){
  const a = st().logos[id]; if (!a) return null;
  if (urls.has(a.id)) return urls.get(a.id);
  const u = await MSA.files.url(a.id); if (u) urls.set(a.id, u); return u;
}
/* badge markup; call MSA.apps.hydrate(root) afterwards to load uploaded logos */
function badge(id, size){
  const x = get(id); if (!x) return '';
  const has = !!st().logos[id], sz = size || 24;
  return '<span class="appb' + (has ? ' has' : '') + '" data-app="' + esc(id) + '" title="' + esc(x.name) + '" style="width:' + sz + 'px;height:' + sz + 'px;--ac:' + x.color + ';font-size:' + Math.round(sz * .42) + 'px">' +
    (has ? '<img data-alogo="' + esc(id) + '" alt="' + esc(x.name) + '">' : '<b>' + esc(x.short) + '</b>') + '</span>';
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
function pick(step, done){
  step.apps = step.apps || [];
  const m = MSA.modal({ title: T('البرامج المستخدمة في هذه المرحلة', 'Programs used in this step'), size: 'wide', footer: false, body: '<div id="apBody"></div>',
    onClose: () => { done && done(); } });
  const body = $('#apBody', m.el);
  const draw = () => {
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
      (has ? '<button class="btn" data-a="rm">' + I('x', 'sm') + esc(T('إزالة اللوجو (الرجوع للشارة)', 'Remove logo (back to badge)')) + '</button>' : '') +
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
