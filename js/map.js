/* Campaign map — n8n-style node graph of the project steps (pan / zoom / click a stage to open it) */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, P = MSA.proj;
const t = (k, v) => MSA.t(k, v);
Object.assign(MSA.dict.en, {
  'view.map': 'Map', 'view.list': 'List', 'map.fit': 'Fit all', 'map.next': 'Next step', 'map.zin': 'Zoom in', 'map.zout': 'Zoom out',
  'map.hint': 'Drag to move · scroll or pinch to zoom · tap a stage to open it', 'map.extra': 'Extra steps',
  'map.done': 'Done', 'map.nextUp': 'Up next', 'map.todo': 'Not started', 'map.close': 'Close'
});
Object.assign(MSA.dict.ar, {
  'view.map': 'الخريطة', 'view.list': 'القائمة', 'map.fit': 'عرض الكل', 'map.next': 'الخطوة التالية', 'map.zin': 'تكبير', 'map.zout': 'تصغير',
  'map.hint': 'اسحب للتحريك • العجلة أو القرص للتكبير • اضغط على أي مرحلة لفتحها', 'map.extra': 'خطوات إضافية',
  'map.done': 'مكتملة', 'map.nextUp': 'التالية', 'map.todo': 'لم تبدأ', 'map.close': 'إغلاق'
});


Object.assign(MSA.dict.en, {
  'map.edit': 'Edit the grid', 'map.editDone': 'Done editing', 'map.addStage': 'New stage', 'map.resetLayout': 'Reset to default layout',
  'map.editHint': 'Drag a stage to move it · drag from a stage’s dot to another stage to draw an arrow (drop on empty space to create a new stage) · tap an arrow to delete it, flip it or drag its ends to re-route it',
  'map.stageName': 'Stage name', 'map.next1': 'New stage after this', 'map.rename': 'Rename', 'map.open': 'Open stage', 'map.del': 'Delete stage',
  'map.arrowDel': 'Delete arrow', 'map.arrowRev': 'Flip direction', 'map.resetQ': 'Reset the positions and arrows of this project’s grid to the default layout? Your stages and files are not touched.',
  'map.resize': 'Drag to resize', 'map.color': 'Colour', 'map.bigger': 'Bigger', 'map.smaller': 'Smaller', 'map.custom': 'Custom colour', 'map.noColor': 'Default colour',
  'map.reset': 'Reset', 'map.delGroupQ': 'Delete the stage “{n}” with all its sub-stages and files?'
});
Object.assign(MSA.dict.ar, {
  'map.edit': 'تعديل الشبكة', 'map.editDone': 'تم التعديل', 'map.addStage': 'مرحلة جديدة', 'map.resetLayout': 'إعادة الترتيب الافتراضي',
  'map.editHint': 'اسحب المرحلة لتحريكها • اسحب من نقطة المرحلة إلى مرحلة أخرى لرسم سهم (وأفلت في مكان فارغ لإنشاء مرحلة جديدة) • اضغط على سهم لحذفه أو عكسه أو اسحب طرفه لتغيير مساره',
  'map.stageName': 'اسم المرحلة', 'map.next1': 'مرحلة جديدة بعد هذه', 'map.rename': 'تغيير الاسم', 'map.open': 'فتح المرحلة', 'map.del': 'حذف المرحلة',
  'map.arrowDel': 'حذف السهم', 'map.arrowRev': 'عكس الاتجاه', 'map.resetQ': 'إعادة مواقع المراحل والأسهم في شبكة هذا المشروع إلى الترتيب الافتراضي؟ المراحل والملفات لن تتأثر.',
  'map.resize': 'اسحب لتغيير الحجم', 'map.color': 'اللون', 'map.bigger': 'أكبر', 'map.smaller': 'أصغر', 'map.custom': 'لون مخصص', 'map.noColor': 'اللون الافتراضي',
  'map.reset': 'إعادة الترتيب', 'map.delGroupQ': 'حذف المرحلة «{n}» مع كل مراحلها الفرعية وملفاتها؟'
});

const W = 208, H = 134, DX = 252, PAD = 70, GRID = 10, FPAD = { l: 24, r: 24, t: 50, b: 22 };
/* default placement for the standard campaign plan: [column, y] (mirrors the workflow drawing) */
const LAY = {
  brief: [0, 0], idea: [0, 200], mood: [0, 400],
  colors: [-1.5, 690], fonts: [-.5, 690], icons: [.5, 690], imagestyle: [1.5, 690],
  logo: [-1, 940], slogan: [1, 940], main: [0, 1140], templates: [0, 1340],
  onscreen: [-1, 1540], printing: [1, 1540], static: [-1.5, 1740], motion: [-.5, 1740], mockups: [0, 1940]
};
const EDGES = [['brief', 'idea'], ['idea', 'mood'], ['mood', 'foundations'], ['foundations', 'logo'], ['foundations', 'slogan'],
  ['logo', 'main'], ['slogan', 'main'], ['main', 'templates'], ['templates', 'onscreen'], ['templates', 'printing'],
  ['onscreen', 'static'], ['onscreen', 'motion'], ['static', 'mockups'], ['motion', 'mockups'], ['printing', 'mockups']];

let view = null, sel = null, lastProj = null, editing = false, esel = null, esel_e = -1, colorOpen = false;

/* ---------- the graph is saved per project: p.graph = { v:2, pos:{stepId:[x,y]}, edges:[[from,to],…] } ---------- */
const isFrame = s => s.key === 'foundations' && s.children.length > 0;
const snap = v => Math.round(v / GRID) * GRID;
const dimOf = (g, id) => { const d = g.dim && g.dim[id]; return d ? [d[0], d[1]] : [W, H]; };
const MINW = 120, MINH = 70, MAXW = 520, MAXH = 420;
const PALETTE = ['#4f8cff', '#2dd4d4', '#10b981', '#84cc16', '#f59e0b', '#ff8a4c', '#ef5b5b', '#ec4899', '#a56bef', '#8b5cf6', '#8a8a86', '#111111'];
function flat(p){
  const all = [], parentOf = {};
  P.walk(p.steps, s => { all.push(s); s.children.forEach(c => parentOf[c.id] = s); });
  return { all, parentOf };
}
function defaultGraph(p){
  const g = { v: 2, pos: {}, edges: [] }, { all, parentOf } = flat(p);
  const byKey = {}; all.forEach(s => { if (s.key) byKey[s.key] = s; });
  const plan = !!byKey.foundations;
  const ids = new Set(all.map(s => s.id));
  if (plan) {
    const cols = Object.values(LAY).map(v => v[0]), minC = Math.min(...cols);
    all.forEach(s => { if (s.key && LAY[s.key]) g.pos[s.id] = [snap((LAY[s.key][0] - minC) * DX + PAD + 20), snap(LAY[s.key][1] + PAD)]; });
    EDGES.forEach(([a, b]) => { if (byKey[a] && byKey[b]) g.edges.push([byKey[a].id, byKey[b].id]); });
  } else {
    /* any other plan: a snake of three columns following the order of the steps */
    const top = p.steps.filter(s => !isFrame(s));
    top.forEach((s, i) => { const r = Math.floor(i / 3), c = i % 3; g.pos[s.id] = [snap(PAD + (r % 2 ? 2 - c : c) * DX), snap(PAD + r * (H + 90))]; if (i) g.edges.push([top[i - 1].id, s.id]); });
  }
  g.edges = g.edges.filter(e => ids.has(e[0]) && ids.has(e[1]));
  return g;
}
function overlaps(g, x, y, skip, p){
  const R = (a, b, c, d, e, f, h, i) => a < e + h && a + c > e && b < f + i && b + d > f;
  const { all } = flat(p);
  return all.some(s => { if (s.id === skip || isFrame(s) || !g.pos[s.id]) return false; const q = g.pos[s.id], d = dimOf(g, s.id); return R(x - 10, y - 10, W + 20, H + 20, q[0], q[1], d[0], d[1]); });
}
function freeSpot(g, p, x, y, skip){
  x = snap(Math.max(40, x)); y = snap(Math.max(70, y));
  for (let k = 0; k < 60 && overlaps(g, x, y, skip, p); k++) { x += W + 30; if (k % 5 === 4) { x -= 5 * (W + 30); y += H + 40; } }
  return [x, y];
}
function frameBox(g, s){
  const ks = s.children.filter(c => g.pos[c.id]); if (!ks.length) return null;
  const x0 = Math.min(...ks.map(c => g.pos[c.id][0])) - FPAD.l, x1 = Math.max(...ks.map(c => g.pos[c.id][0] + dimOf(g, c.id)[0])) + FPAD.r;
  const y0 = Math.min(...ks.map(c => g.pos[c.id][1])) - FPAD.t, y1 = Math.max(...ks.map(c => g.pos[c.id][1] + dimOf(g, c.id)[1])) + FPAD.b;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
/* make sure every step has a place and every arrow points at something that still exists */
function graphOf(p){
  let g = p.graph;
  if (!g || g.v !== 2) { g = p.graph = defaultGraph(p); MSA.save(); }
  const { all, parentOf } = flat(p), ids = new Set(all.map(s => s.id));
  let dirty = false;
  g.dim = g.dim || {}; g.col = g.col || {};
  Object.keys(g.pos).forEach(id => { if (!ids.has(id)) { delete g.pos[id]; delete g.dim[id]; delete g.col[id]; dirty = true; } });
  const ne = g.edges.filter(e => ids.has(e[0]) && ids.has(e[1]) && e[0] !== e[1]); if (ne.length !== g.edges.length) { g.edges = ne; dirty = true; }
  all.forEach(s => {
    if (g.pos[s.id]) return;
    if (isFrame(s)) return;
    const par = parentOf[s.id]; let q;
    if (par && isFrame(par)) {
      const ks = par.children.filter(c => c.id !== s.id && g.pos[c.id]);
      q = ks.length ? freeSpot(g, p, Math.max(...ks.map(c => g.pos[c.id][0])) + W + 30, g.pos[ks[0].id][1], s.id) : freeSpot(g, p, 200, 400, s.id);
    } else if (par && g.pos[par.id]) {
      q = freeSpot(g, p, g.pos[par.id][0] + (par.children.indexOf(s)) * (W + 30), g.pos[par.id][1] + H + 80, s.id);
      g.edges.push([par.id, s.id]);
    } else {
      const ps = Object.values(g.pos); const bottom = ps.length ? Math.max(...ps.map(v => v[1])) + H + 70 : 70;
      q = freeSpot(g, p, ps.length ? Math.min(...ps.map(v => v[0])) : PAD, bottom, s.id);
    }
    g.pos[s.id] = q; dirty = true;
  });
  if (dirty) MSA.save();
  return g;
}

function layout(p){
  const g = graphOf(p), nodes = {}, frames = {};
  P.walk(p.steps, s => {
    if (isFrame(s)) { const b = frameBox(g, s); if (b) frames[s.id] = { s, ...b, kids: s.children.map(c => c.id) }; else { nodes[s.id] = { s, x: g.pos[s.id] ? g.pos[s.id][0] : PAD, y: g.pos[s.id] ? g.pos[s.id][1] : PAD, w: W, h: H }; } }
    else if (g.pos[s.id]) { const d = dimOf(g, s.id); nodes[s.id] = { s, x: g.pos[s.id][0], y: g.pos[s.id][1], w: d[0], h: d[1] }; }
  });
  const rs = [...Object.values(nodes).map(n => [n.x + n.w, n.y + n.h]), ...Object.values(frames).map(f => [f.x + f.w, f.y + f.h])];
  return { g, nodes, frames, E: g.edges, w: Math.max(600, ...rs.map(r => r[0])) + PAD, h: Math.max(400, ...rs.map(r => r[1])) + PAD };
}
function rect(L, id){ const f = L.frames[id]; if (f) return f; const n = L.nodes[id]; return n ? { x: n.x, y: n.y, w: n.w, h: n.h } : null; }
function stepOf(L, id){ return L.frames[id] ? L.frames[id].s : (L.nodes[id] && L.nodes[id].s); }
function doneOf(L, id){ const s = stepOf(L, id); return s ? P.done(s) : false; }

/* where an arrow leaves and enters its two stages */
function geom(L, a, b){
  const ra = rect(L, a), rb = rect(L, b); if (!ra || !rb) return null;
  const outs = L.E.filter(e => e[0] === a), ins = L.E.filter(e => e[1] === b);
  const io = outs.findIndex(e => e[1] === b), ii = ins.findIndex(e => e[0] === a);
  const dy = rb.y - (ra.y + ra.h);
  let x1, y1, x2, y2, d;
  if (dy >= 36) {
    x1 = ra.x + ra.w / 2 + (outs.length > 1 && !L.frames[a] ? (io - (outs.length - 1) / 2) * 56 : 0);
    if (L.frames[a]) x1 = Math.max(ra.x + 40, Math.min(ra.x + ra.w - 40, rb.x + rb.w / 2));
    x2 = rb.x + rb.w / 2 + (ins.length > 1 ? (ii - (ins.length - 1) / 2) * 56 : 0);
    y1 = ra.y + ra.h; y2 = rb.y; const k = Math.max(40, (y2 - y1) / 2);
    d = 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + (y1 + k) + ' ' + x2 + ' ' + (y2 - k) + ' ' + x2 + ' ' + (y2 - 2);
    return { x1, y1, x2, y2, d, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
  }
  const right = rb.x + rb.w / 2 >= ra.x + ra.w / 2;
  x1 = right ? ra.x + ra.w : ra.x; y1 = ra.y + ra.h / 2; x2 = right ? rb.x : rb.x + rb.w; y2 = rb.y + rb.h / 2;
  /* the target is beside or above: go sideways, and loop around when it sits on the same level */
  const k = Math.max(50, Math.abs(x2 - x1) / 2) * (right ? 1 : -1);
  if (Math.abs(y2 - y1) < 6 && ((right && x2 - x1 < 30) || (!right && x1 - x2 < 30))) {
    d = 'M' + x1 + ' ' + y1 + ' C' + (x1 + 70 * (right ? 1 : -1)) + ' ' + (y1 - 90) + ' ' + (x2 - 70 * (right ? 1 : -1)) + ' ' + (y2 - 90) + ' ' + x2 + ' ' + y2;
  } else d = 'M' + x1 + ' ' + y1 + ' C' + (x1 + k) + ' ' + y1 + ' ' + (x2 - k) + ' ' + y2 + ' ' + (x2 + (right ? -2 : 2)) + ' ' + y2;
  return { x1, y1, x2, y2, d, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
}

function edgesSVG(L){
  let svg = '', hs = '';
  L.E.forEach(([a, b], i) => {
    const q = geom(L, a, b); if (!q) return;
    const dn = doneOf(L, a), tdn = doneOf(L, b);
    const cls = (dn ? (tdn ? 'e done' : 'e flow') : 'e') + (editing && esel_e === i ? ' sel' : '');
    const mk = dn ? (tdn ? 'mkd' : 'mkf') : 'mk';
    svg += '<path class="' + cls + '" marker-end="url(#' + mk + ')" d="' + q.d + '"/>';
    if (editing) {
      svg += '<path class="eh" data-ei="' + i + '" d="' + q.d + '"/>';
      if (esel_e === i) hs += '<circle class="ehd" data-eh="src" cx="' + q.x1 + '" cy="' + q.y1 + '" r="9"/><circle class="ehd" data-eh="dst" cx="' + q.x2 + '" cy="' + q.y2 + '" r="9"/>';
    }
  });
  const mkr = (id, c) => '<marker id="' + id + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1L9 5L1 9z" fill="' + c + '"/></marker>';
  return '<svg class="medges" width="' + L.w + '" height="' + L.h + '" viewBox="0 0 ' + L.w + ' ' + L.h + '"><defs>' +
    mkr('mk', 'var(--edge)') + mkr('mkd', 'var(--ok)') + mkr('mkf', 'var(--accent)') + '</defs>' + svg + hs + '</svg>';
}

function thumbOf(s){
  const atts = P.allAtts([s]); const kinds = {};
  atts.forEach(a => kinds[a.kind] = (kinds[a.kind] || 0) + 1);
  const img = [...atts].reverse().find(a => a.kind === 'image'), vid = [...atts].reverse().find(a => a.kind === 'video');
  let inner;
  if (img) inner = '<img data-thumb="' + img.id + '" alt="">';
  else if (vid) inner = '<video data-thumb="' + vid.id + '" muted preload="metadata" playsinline></video>';
  else inner = '<div class="mn-empty">' + I(atts.length ? 'clip' : 'plus', 'sm') + '</div>';
  const chips = [['image', 'image'], ['video', 'video'], ['audio', 'music'], ['doc', 'doc']].filter(k => kinds[k[0]]).map(k => '<span>' + I(k[1], 'xs') + kinds[k[0]] + '</span>').join('');
  return '<div class="mn-thumb' + (img || vid ? ' has' : '') + '">' + inner + (chips ? '<div class="mn-chips">' + chips + '</div>' : '') + '</div>';
}
const PORTS = '<i class="hd t" data-port></i><i class="hd b" data-port></i><i class="hd l" data-port></i><i class="hd r" data-port></i>';

function nodeHTML(L, id, n, ready){
  const s = n.s, done = P.done(s), part = P.partial(s), lv = P.leaves(s), kid = s.children.length;
  const dn = lv.filter(x => x.done).length;
  const st = done ? '<span class="mn-st ok">' + I('check', 'sm') + '</span>' : (kid ? '<span class="mn-st cnt">' + dn + '/' + lv.length + '</span>' : '<span class="mn-st"></span>');
  return '<div class="mnode' + (done ? ' done' : '') + (part ? ' part' : '') + (ready && !done ? ' ready' : '') + (sel === s.id ? ' sel' : '') + (editing && esel === s.id ? ' esel' : '') + (L.g.col[s.id] ? ' cc' : '') + '" data-node="' + s.id + '" style="left:' + n.x + 'px;top:' + n.y + 'px;width:' + n.w + 'px;height:' + n.h + 'px' + (L.g.col[s.id] ? ';--nc:' + L.g.col[s.id] : '') + '">' +
    PORTS + (editing ? '<i class="rz" data-rz title="' + U.esc(t('map.resize')) + '"></i>' : '') + '<div class="mn-top">' + st + '<span class="mn-t" dir="auto">' + U.esc(P.title(s)) + '</span></div>' + thumbOf(s) + (s.apps && s.apps.length ? '<div class="mn-apps">' + MSA.apps.chips(s, 20) + '</div>' : '') + (MSA.plus && MSA.plus.dueChip ? MSA.plus.dueChip(s, 'mn-due') : '') + '</div>';
}
function frameHTML(f){
  const gs = f.s, lv = P.leaves(gs), dn = lv.filter(x => x.done).length;
  return '<div class="mgroup' + (P.done(gs) ? ' done' : '') + (sel === gs.id ? ' sel' : '') + (editing && esel === gs.id ? ' esel' : '') + (f.col ? ' cc' : '') + '" data-node="' + gs.id + '" data-frame style="' + (f.col ? '--nc:' + f.col + ';' : '') + 'left:' + f.x + 'px;top:' + f.y + 'px;width:' + f.w + 'px;height:' + f.h + 'px">' + PORTS +
    '<div class="mg-t"><span dir="auto">' + U.esc(P.title(gs)) + '</span><b>' + dn + '/' + lv.length + '</b></div></div>';
}

function readySet(L){
  const preds = {}; L.E.forEach(([a, b]) => (preds[b] = preds[b] || []).push(a));
  const frameOf = {}; Object.values(L.frames).forEach(f => f.kids.forEach(k => frameOf[k] = f.s.id));
  const r = new Set();
  Object.keys(L.nodes).forEach(id => {
    const pr = preds[id] || (frameOf[id] ? preds[frameOf[id]] : null) || [];
    if (pr.every(a => doneOf(L, a))) r.add(id);
  });
  return r;
}
function toolHTML(L){
  if (!editing) return '';
  const b = (a, ic, lab, cls) => '<button class="' + (cls || '') + '" data-ma="' + a + '" title="' + U.esc(lab) + '" aria-label="' + U.esc(lab) + '">' + I(ic, 'sm') + '</button>';
  if (esel && rect(L, esel)) {
    const r = rect(L, esel);
    const isF = !!L.frames[esel], cur = L.g.col[esel] || '';
    const pal = colorOpen ? '<div class="mepal" data-pal>' + PALETTE.map(c => '<button data-ma="cc" data-v="' + c + '" class="' + (cur === c ? 'on' : '') + '" style="background:' + c + '" aria-label="' + c + '"></button>').join('') +
      '<label class="mecust" title="' + U.esc(t('map.custom')) + '"><input type="color" data-cc value="' + (/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#4f8cff') + '"></label>' +
      '<button data-ma="cc" data-v="" class="mereset" title="' + U.esc(t('map.noColor')) + '">' + I('x', 'xs') + '</button></div>' : '';
    return '<div class="metool" style="left:' + (r.x + r.w / 2) + 'px;top:' + (r.y - 8) + 'px">' + b('rename', 'pencil', t('map.rename')) + b('color', 'palette', t('map.color'), colorOpen ? 'on' : '') + (isF ? '' : b('small', 'minus', t('map.smaller')) + b('big', 'plus', t('map.bigger'))) + b('next', 'plus', t('map.next1')) + b('open', 'maximize', t('map.open')) + b('del', 'trash', t('map.del'), 'danger') + pal + '</div>';
  }
  if (esel_e >= 0 && L.E[esel_e]) {
    const q = geom(L, L.E[esel_e][0], L.E[esel_e][1]);
    if (q) return '<div class="metool" style="left:' + q.mx + 'px;top:' + (q.my - 4) + 'px">' + b('erev', 'repeat', t('map.arrowRev')) + b('edel', 'trash', t('map.arrowDel'), 'danger') + '</div>';
  }
  return '';
}

function build(p){
  const L = layout(p), ready = readySet(L);
  let h = '<div class="mapbox' + (editing ? ' edit' : '') + '" id="mapBox"><div class="mapworld" id="mapWorld" style="width:' + L.w + 'px;height:' + L.h + 'px">' + edgesSVG(L);
  Object.values(L.frames).forEach(f => { f.col = L.g.col[f.s.id]; h += frameHTML(f); });
  Object.keys(L.nodes).forEach(id => { h += nodeHTML(L, id, L.nodes[id], ready.has(id)); });
  h += '<div id="metoolHost">' + toolHTML(L) + '</div></div>' +
    '<div class="maplegend"><span><i class="lgd ok"></i>' + U.esc(t('map.done')) + '</span><span><i class="lgd nx"></i>' + U.esc(t('map.nextUp')) + '</span><span><i class="lgd"></i>' + U.esc(t('map.todo')) + '</span></div>' +
    '<div class="mapctl"><button class="icon-btn" data-m="in" title="' + U.esc(t('map.zin')) + '">' + I('plus', 'sm') + '</button><button class="icon-btn" data-m="out" title="' + U.esc(t('map.zout')) + '">' + I('minus', 'sm') + '</button>' +
    '<button class="icon-btn" data-m="fit" title="' + U.esc(t('map.fit')) + '">' + I('maximize', 'sm') + '</button><button class="icon-btn" data-m="next" title="' + U.esc(t('map.next')) + '">' + I('flag', 'sm') + '</button>' +
    '<button class="icon-btn' + (editing ? ' on' : '') + '" data-m="edit" title="' + U.esc(t('map.edit')) + '">' + I('pencil', 'sm') + '</button></div>' +
    (editing ? '<div class="mapedit"><button class="btn sm primary" data-m="add">' + I('plus', 'sm') + '<span>' + U.esc(t('map.addStage')) + '</span></button>' +
      '<button class="btn sm" data-m="reset">' + I('undo', 'sm') + '<span>' + U.esc(t('map.resetLayout')) + '</span></button>' +
      '<button class="btn sm" data-m="edit">' + I('check', 'sm') + '<span>' + U.esc(t('map.editDone')) + '</span></button></div>' : '') +
    '<div class="maphint">' + U.esc(t(editing ? 'map.editHint' : 'map.hint')) + '</div>' +
    '<aside class="mapdet" id="mapDet" hidden></aside></div>';
  return { html: h, L, ready };
}

P.renderMap = function(box, p){
  if (lastProj !== p.id) { lastProj = p.id; view = null; sel = null; esel = null; esel_e = -1; colorOpen = false; }
  let b = build(p); box.innerHTML = b.html; let L = b.L;
  const el = box.querySelector('#mapBox'), world = box.querySelector('#mapWorld'), det = box.querySelector('#mapDet');
  MSA.hydrateAtts(box); MSA.apps.hydrate(box);
  const apply = () => { world.style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.k + ')'; };
  const dims = () => ({ w: el.clientWidth, h: el.clientHeight });
  const clampK = k => Math.max(.2, Math.min(2, k));
  const fitW = () => { const d = dims(); const k = clampK(Math.max(.5, Math.min(1, d.w / L.w))); view = { k, x: (d.w - L.w * k) / 2, y: 6 }; };
  const fitAll = () => { const d = dims(); const k = clampK(Math.min(d.w / L.w, d.h / L.h)); view = { k, x: (d.w - L.w * k) / 2, y: (d.h - L.h * k) / 2 }; };
  const focus = (id, k) => { const r = rect(L, id); if (!r) return; const d = dims(); k = clampK(k); const pw = Math.min(380, d.w * .92), rtl = getComputedStyle(el).direction === 'rtl'; const cx = d.w > 700 && !editing ? (rtl ? (pw + d.w) / 2 : (d.w - pw) / 2) : d.w / 2; view = { k, x: cx - (r.x + r.w / 2) * k, y: d.h / 2 - (r.y + r.h / 2) * k }; apply(); };
  const zoomAt = (cx, cy, f) => { const k = clampK(view.k * f), r = k / view.k; view.x = cx - (cx - view.x) * r; view.y = cy - (cy - view.y) * r; view.k = k; apply(); };
  let needFit = false;
  if (!view) { if (dims().w > 0) fitW(); else { needFit = true; view = { k: .6, x: 0, y: 6 }; } } apply();
  const toWorld = e => { const rc = el.getBoundingClientRect(); return { x: (e.clientX - rc.left - view.x) / view.k, y: (e.clientY - rc.top - view.y) / view.k }; };
  const redo = () => { P.renderMap(box, p); };      /* structural change: rebuild the map, keep the view */
  const commit = () => MSA.save();

  /* detail panel: the same step editor as the list view (checkbox, add buttons, note, files) */
  const showDet = () => {
    const r = sel && P.find(p.steps, sel);
    if (!r || editing) { det.hidden = true; if (!r) sel = null; return; }
    det.hidden = false;
    det.innerHTML = '<div class="md-h"><b dir="auto">' + U.esc(P.title(r.step)) + '</b><button class="icon-btn" data-m="close" aria-label="' + U.esc(t('map.close')) + '">' + I('x', 'sm') + '</button></div><div class="md-b">' + P.stepHTML(r.step, 0) + '</div>';
    MSA.hydrateAtts(det); MSA.apps.hydrate(det);
    box.querySelectorAll('[data-node]').forEach(n => n.classList.toggle('sel', n.dataset.node === sel));
  };
  showDet();

  /* live refresh while dragging: positions, frames and arrows only */
  const live = () => {
    L = layout(p);
    Object.keys(L.nodes).forEach(id => { const n = world.querySelector('.mnode[data-node="' + id + '"]'); if (n) { const q = L.nodes[id]; n.style.left = q.x + 'px'; n.style.top = q.y + 'px'; n.style.width = q.w + 'px'; n.style.height = q.h + 'px'; } });
    Object.values(L.frames).forEach(f => { const n = world.querySelector('.mgroup[data-node="' + f.s.id + '"]'); if (n) { n.style.left = f.x + 'px'; n.style.top = f.y + 'px'; n.style.width = f.w + 'px'; n.style.height = f.h + 'px'; } });
    const old = world.querySelector('.medges'); const tmp = document.createElement('div'); tmp.innerHTML = edgesSVG(L); old.replaceWith(tmp.firstChild);
    world.style.width = L.w + 'px'; world.style.height = L.h + 'px';
    const th = world.querySelector('#metoolHost'); if (th) th.innerHTML = toolHTML(L);
  };
  const tempPath = (x1, y1, x2, y2) => {
    const svg = world.querySelector('.medges'); let pth = svg.querySelector('.etmp');
    if (!pth) { pth = document.createElementNS('http://www.w3.org/2000/svg', 'path'); pth.setAttribute('class', 'etmp'); svg.appendChild(pth); }
    const k = Math.max(40, Math.abs(y2 - y1) / 2); pth.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + (y1 + k) + ' ' + x2 + ' ' + (y2 - k) + ' ' + x2 + ' ' + y2);
  };
  const rm = () => { const x = world.querySelector('.etmp'); if (x) x.remove(); };
  const nodeAt = e => { const u = document.elementFromPoint(e.clientX, e.clientY); const n = u && u.closest('[data-node]'); return n && el.contains(n) ? n.dataset.node : null; };
  const mkStep = title => ({ id: U.uid('s'), key: null, title, done: false, note: '', atts: [], children: [] });
  const addAt = async (x, y, fromId) => {
    const v = await MSA.ask({ title: t('map.addStage'), placeholder: t('map.stageName') }); if (!v) return null;
    const s = mkStep(v); p.steps.push(s);
    p.graph.pos[s.id] = freeSpot(p.graph, p, x - W / 2, y - H / 2, s.id); if (fromId && p.graph.col && p.graph.col[fromId]) p.graph.col[s.id] = p.graph.col[fromId];
    if (fromId) p.graph.edges.push([fromId, s.id]);
    esel = s.id; esel_e = -1; commit(); MSA.updateCounts && MSA.updateCounts(); redo(); return s;
  };
  const addEdge = (a, c) => {
    if (!a || !c || a === c) return false;
    if (p.graph.edges.some(e => e[0] === a && e[1] === c)) return false;
    p.graph.edges.push([a, c]); return true;
  };

  /* ---------- pointer: pan / pinch, and (in edit mode) move stages, draw and re-route arrows ---------- */
  const ptrs = new Map(); let moved = false, start = null, pinch = null, drag = null;
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('.mapdet,.mapctl,.metool,.mapedit')) return;
    if (editing && e.pointerType !== 'touch' || editing) {
      const rz = e.target.closest('[data-rz]');
      if (rz && ptrs.size === 0) { const nd0 = rz.closest('[data-node]'), id0 = nd0.dataset.node; const dd = dimOf(p.graph, id0); drag = { type: 'resize', id: id0, w0: toWorld(e), d0: dd.slice() }; moved = true; el.setPointerCapture(e.pointerId); e.preventDefault(); return; }
      const port = e.target.closest('[data-port]'), eh = e.target.closest('[data-eh]'), eHit = e.target.closest('[data-ei]'), nd = e.target.closest('[data-node]');
      if (port && nd && ptrs.size === 0) {
        const id = nd.dataset.node, r = rect(L, id), pt = port.classList.contains('t') ? [r.x + r.w / 2, r.y] : port.classList.contains('l') ? [r.x, r.y + r.h / 2] : port.classList.contains('r') ? [r.x + r.w, r.y + r.h / 2] : [r.x + r.w / 2, r.y + r.h];
        drag = { type: 'conn', from: id, p0: pt }; moved = true; el.setPointerCapture(e.pointerId); e.preventDefault(); return;
      }
      if (eh && esel_e >= 0 && ptrs.size === 0) { drag = { type: 'reconn', end: eh.dataset.eh, i: esel_e }; moved = true; el.setPointerCapture(e.pointerId); e.preventDefault(); return; }
      if (eHit && !nd && ptrs.size === 0) { esel_e = +eHit.dataset.ei; esel = null; live(); sel = null; moved = true; setTimeout(() => { moved = false; }, 0); e.preventDefault(); return; }
      if (nd && ptrs.size === 0) {
        const id = nd.dataset.node, w0 = toWorld(e), r = P.find(p.steps, id);
        const fr = L.frames[id]; const ids = fr ? fr.kids : [id];
        drag = { type: 'node', id, w0, orig: ids.map(k => [k, (p.graph.pos[k] || [0, 0]).slice()]), n: 0, sx: e.clientX, sy: e.clientY, started: false };
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); return;
      }
    }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = false;
    start = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    if (ptrs.size === 2) { drag = null; const [a, c] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - c.x, a.y - c.y), k: view.k }; }
  });
  el.addEventListener('pointermove', e => {
    if (drag && drag.type === 'resize') { const w = toWorld(e); p.graph.dim[drag.id] = [Math.max(MINW, Math.min(MAXW, snap(drag.d0[0] + w.x - drag.w0.x))), Math.max(MINH, Math.min(MAXH, snap(drag.d0[1] + w.y - drag.w0.y)))]; live(); return; }
    if (drag && drag.type === 'conn') { const w = toWorld(e); tempPath(drag.p0[0], drag.p0[1], w.x, w.y); el.classList.toggle('dropok', !!nodeAt(e)); return; }
    if (drag && drag.type === 'reconn') {
      const ed = L.E[drag.i]; if (!ed) return; const q = geom(L, ed[0], ed[1]); if (!q) return; const w = toWorld(e);
      if (drag.end === 'dst') tempPath(q.x1, q.y1, w.x, w.y); else tempPath(w.x, w.y, q.x2, q.y2);
      el.classList.toggle('dropok', !!nodeAt(e)); return;
    }
    if (drag && drag.type === 'node') {
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.started && Math.hypot(dx, dy) > 5) { drag.started = true; moved = true; el.classList.add('moving'); try { el.setPointerCapture(e.pointerId); } catch (x) {} }
      if (drag.started) {
        const w = toWorld(e), ddx = w.x - drag.w0.x, ddy = w.y - drag.w0.y;
        drag.orig.forEach(([k, o]) => { p.graph.pos[k] = [Math.max(30, snap(o[0] + ddx)), Math.max(60, snap(o[1] + ddy))]; });
        live();
      }
      return;
    }
    if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const rc = el.getBoundingClientRect();
    if (ptrs.size === 2 && pinch) {
      const [a, c] = [...ptrs.values()]; const d = Math.hypot(a.x - c.x, a.y - c.y);
      zoomAt((a.x + c.x) / 2 - rc.left, (a.y + c.y) / 2 - rc.top, clampK(pinch.k * d / pinch.d) / view.k); moved = true; return;
    }
    if (ptrs.size !== 1 || !start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!moved && Math.hypot(dx, dy) > 6) { moved = true; el.classList.add('grab'); try { el.setPointerCapture(e.pointerId); } catch (x) {} }
    if (moved) { view.x = start.vx + dx; view.y = start.vy + dy; apply(); }
  });
  const up = async e => {
    if (drag && drag.type === 'resize') { drag = null; commit(); redo(); setTimeout(() => { moved = false; }, 0); return; }
    if (drag && (drag.type === 'conn' || drag.type === 'reconn')) {
      const d = drag; drag = null; rm(); el.classList.remove('dropok'); const target = nodeAt(e), w = toWorld(e);
      if (d.type === 'conn') {
        if (target && target !== d.from) { if (addEdge(d.from, target)) { esel_e = p.graph.edges.length - 1; esel = null; commit(); } redo(); }
        else if (!target) { const rc = el.getBoundingClientRect(); if (Math.hypot(e.clientX - rc.left - 0, 0) >= 0) await addAt(w.x, w.y, d.from); }
      } else {
        const ed = p.graph.edges[d.i];
        if (ed && target) {
          const ne = d.end === 'dst' ? [ed[0], target] : [target, ed[1]];
          if (ne[0] !== ne[1] && !p.graph.edges.some((x, k) => k !== d.i && x[0] === ne[0] && x[1] === ne[1])) { p.graph.edges[d.i] = ne; commit(); }
        }
        redo();
      }
      return;
    }
    if (drag && drag.type === 'node') {
      const d = drag; drag = null; ptrs.delete(e.pointerId); el.classList.remove('moving');
      if (d.started) { commit(); live(); setTimeout(() => { moved = false; }, 0); return; }
      /* a plain tap on a stage */
      if (editing) { esel = d.id; esel_e = -1; sel = null; world.querySelectorAll('.mnode,.mgroup').forEach(n => n.classList.toggle('esel', n.dataset.node === esel)); live(); }
      return;
    }
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) { el.classList.remove('grab'); } else if (ptrs.size === 1) { const q = [...ptrs.values()][0]; start = { x: q.x, y: q.y, vx: view.x, vy: view.y }; }
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', e => { drag = null; rm(); up(e); });
  el.addEventListener('wheel', e => {
    if (e.target.closest('.mapdet')) return; e.preventDefault();
    const rc = el.getBoundingClientRect();
    if (e.ctrlKey || Math.abs(e.deltaY) > 0) zoomAt(e.clientX - rc.left, e.clientY - rc.top, Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0016)));
  }, { passive: false });

  const resizeBy = f => { if (!esel || L.frames[esel]) return; const d = dimOf(p.graph, esel); p.graph.dim[esel] = [Math.max(MINW, Math.min(MAXW, snap(d[0] * f))), Math.max(MINH, Math.min(MAXH, snap(d[1] * f)))]; commit(); redo(); };
  const act = async (a, btn) => {
    const r = esel && P.find(p.steps, esel);
    if (a === 'big') { resizeBy(1.18); return; } if (a === 'small') { resizeBy(.85); return; }
    if (a === 'color') { colorOpen = !colorOpen; live(); return; }
    if (a === 'cc' && esel) { const v = btn && btn.dataset.v; if (v) p.graph.col[esel] = v; else delete p.graph.col[esel]; commit(); redo(); return; }
    if (a === 'rename' && r) { const v = await MSA.ask({ title: t('map.rename'), value: P.title(r.step) }); if (v) { r.step.title = v; commit(); redo(); } }
    else if (a === 'next' && esel) { const q = rect(L, esel); if (q) await addAt(q.x + q.w / 2, q.y + q.h + 80 + H / 2, esel); }
    else if (a === 'open' && r) { editing = false; sel = esel; esel = null; redo(); focus(sel, Math.max(view.k, .85)); }
    else if (a === 'del' && r) {
      const many = r.step.children.length > 0;
      if (!await MSA.confirm(many ? t('map.delGroupQ', { n: P.title(r.step) }) : t('delStepQ', { n: P.title(r.step) }), { danger: true, okLabel: t('delete') })) return;
      const atts = P.ownedAtts([r.step]); r.list.splice(r.index, 1); await MSA.files.delMany(atts);
      esel = null; commit(); MSA.updateCounts && MSA.updateCounts(); MSA.rerender();
    }
    else if (a === 'edel' && esel_e >= 0) { p.graph.edges.splice(esel_e, 1); esel_e = -1; commit(); redo(); }
    else if (a === 'erev' && esel_e >= 0) { const e = p.graph.edges[esel_e]; p.graph.edges[esel_e] = [e[1], e[0]]; commit(); redo(); }
  };
  el.addEventListener('input', e => { const ci = e.target.closest('[data-cc]'); if (!ci || !esel) return; p.graph.col[esel] = ci.value; const n = world.querySelector('[data-node="' + esel + '"]'); if (n) { n.style.setProperty('--nc', ci.value); n.classList.add('cc'); } });
  el.addEventListener('change', e => { if (e.target.closest('[data-cc]')) commit(); });
  el.addEventListener('click', async e => {
    const ma = e.target.closest('[data-ma]'); if (ma && el.contains(ma)) { await act(ma.dataset.ma, ma); return; }
    const m = e.target.closest('[data-m]');
    if (m && el.contains(m)) {
      const d = dims(), a = m.dataset.m;
      if (a === 'in') zoomAt(d.w / 2, d.h / 2, 1.25); else if (a === 'out') zoomAt(d.w / 2, d.h / 2, .8);
      else if (a === 'fit') { fitAll(); apply(); }
      else if (a === 'close') { sel = null; showDet(); }
      else if (a === 'edit') { editing = !editing; sel = null; esel = null; esel_e = -1; redo(); }
      else if (a === 'add') { const c = { x: (d.w / 2 - view.x) / view.k, y: (d.h / 2 - view.y) / view.k }; await addAt(c.x, c.y, null); }
      else if (a === 'reset') { if (await MSA.confirm(t('map.resetQ'), { danger: true, okLabel: t('map.reset') })) { delete p.graph; esel = null; esel_e = -1; commit(); redo(); fitAll(); apply(); } }
      else if (a === 'next') {
        const s = Object.keys(L.nodes).find(id => b.ready.has(id) && !P.done(L.nodes[id].s) && !L.nodes[id].s.children.length) || Object.keys(L.nodes).find(id => !P.done(L.nodes[id].s));
        if (s) { sel = L.nodes[s].s.id; if (editing) { editing = false; redo(); } focus(s, Math.max(view.k, .85)); showDet(); }
      }
      return;
    }
    if (moved) { moved = false; return; }
    if (editing) { if (!e.target.closest('[data-node],[data-ei],.metool')) { esel = null; esel_e = -1; live(); world.querySelectorAll('.esel').forEach(n => n.classList.remove('esel')); } return; }
    const n = e.target.closest('[data-node]');
    if (n && el.contains(n) && !e.target.closest('.mapdet')) { sel = n.dataset.node === sel ? null : n.dataset.node; showDet(); }
    else if (!e.target.closest('.mapdet')) { sel = null; showDet(); }
  });
  /* double-click (or double-tap) a moodboard stage to open the board straight away */
  el.addEventListener('dblclick', e => { if (editing) return; const n = e.target.closest('[data-node]'); if (!n || e.target.closest('.mapdet')) return; const r = P.find(p.steps, n.dataset.node); if (r && r.step.key === 'mood' && MSA.board) MSA.board.open(p, r.step); });
  /* keep the map framed when the window is resized */
  if (!el._ro && window.ResizeObserver) { el._ro = new ResizeObserver(() => { if (needFit && dims().w > 0) { needFit = false; fitW(); } if (view) apply(); }); el._ro.observe(el); }
};
P.mapToggleEdit = () => { editing = !editing; sel = null; esel = null; esel_e = -1; };
P.mapEditing = () => editing;
P.mapReset = () => { view = null; sel = null; esel = null; esel_e = -1; };
})();
