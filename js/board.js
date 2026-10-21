/* Moodboard — a PureRef-style infinite canvas for a step's images.
   Pan/zoom, drag & drop / paste images, multi-select, move / scale / rotate / flip / crop, arrange, text notes,
   undo / redo, greyscale, lock, z-order, export to PNG. Everything autosaves into step.board; pictures are the step's own attachments. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc;
const BGS = ['#1c1c1e', '#2e2e32', '#6d6d72', '#d6d6da', '#ffffff', '#000000'];
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const GAP = 16, K_MIN = .02, K_MAX = 16;

/* ---------- geometry ---------- */
const ctr = it => ({ x: it.x + it.w / 2, y: it.y + it.h / 2 });
function corners(it){
  const c = ctr(it), a = rad(it.r || 0), co = Math.cos(a), si = Math.sin(a), hw = it.w / 2, hh = it.h / 2;
  return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([dx, dy]) => ({ x: c.x + dx * co - dy * si, y: c.y + dx * si + dy * co }));
}
function bb(it){ const cs = corners(it), xs = cs.map(c => c.x), ys = cs.map(c => c.y); return { l: Math.min(...xs), t: Math.min(...ys), r: Math.max(...xs), b: Math.max(...ys) }; }
function bbAll(list){ const b = list.map(bb); return { l: Math.min(...b.map(x => x.l)), t: Math.min(...b.map(x => x.t)), r: Math.max(...b.map(x => x.r)), b: Math.max(...b.map(x => x.b)) }; }
const rot = (x, y, a) => ({ x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) });
const setCenter = (it, cx, cy) => { it.x = cx - it.w / 2; it.y = cy - it.h / 2; };
const naturalOf = id => new Promise(async res => {
  const u = await MSA.files.url(id); if (!u) { res(null); return; }
  const im = new Image(); im.onload = () => res({ w: im.naturalWidth || 300, h: im.naturalHeight || 300 }); im.onerror = () => res(null); im.src = u;
});

/* justified-rows layout that keeps every aspect ratio, no gaps, roughly screen-shaped */
function layoutRows(list, aspect){
  const L = list.slice().sort((a, b) => (a.z || 0) - (b.z || 0)), n = L.length;
  const area = L.reduce((s, i) => s + i.w * i.h, 0), H = Math.sqrt(area / n), W = Math.sqrt(area * (aspect || 1.6)) + GAP * 2;
  const rows = []; let row = [], rw = 0;
  L.forEach(it => { const w = it.w / it.h * H; row.push({ it, w }); rw += w + GAP; if (rw - GAP >= W) { rows.push(row); row = []; rw = 0; } });
  if (row.length) rows.push(row);
  let y = 0; const out = [];
  rows.forEach((r, ri) => {
    const sum = r.reduce((s, x) => s + x.w, 0); let s = (W - GAP * (r.length - 1)) / sum;
    if (ri === rows.length - 1) s = Math.min(s, 1.15);
    let x = 0; const h = H * s;
    r.forEach(q => { out.push({ it: q.it, x, y, w: q.w * s, h }); x += q.w * s + GAP; });
    y += h + GAP;
  });
  return out;
}

/* ---------- open ---------- */
MSA.board = { open };
function open(proj, step){
  if (document.getElementById('msaBoard')) return;
  const B = step.board = Object.assign({ items: [], view: null, bg: BGS[0], gray: false, placed: [], trash: [] }, step.board || {});
  B.items = B.items || []; B.placed = B.placed || []; B.trash = B.trash || [];
  let items = B.items;
  const sel = new Set(); let view = B.view ? Object.assign({}, B.view) : null;
  const undo = [], redo = []; let clip = null, lastHist = '', lastHistT = 0;
  let tool = (matchMedia('(pointer:coarse)').matches ? 'hand' : 'select'), cropId = null, spaceDown = false, dead = false;
  const els = new Map(), urlOf = new Map();
  const touchy = matchMedia('(pointer:coarse)').matches;

  const root = document.createElement('div'); root.id = 'msaBoard'; root.className = 'bd'; root.setAttribute('role', 'dialog');
  const b = (c, ic, lab, cls) => '<button class="bd-b ' + (cls || '') + '" data-c="' + c + '" title="' + esc(lab) + '" aria-label="' + esc(lab) + '">' + I(ic, 'sm') + '<span>' + esc(lab) + '</span></button>';
  root.innerHTML =
    '<div class="bd-top"><button class="bd-b prim" data-c="close" title="Esc">' + I('check', 'sm') + '<span>' + esc(T('حفظ وإغلاق', 'Save & close')) + '</span></button>' +
    '<div class="bd-title" dir="auto">' + esc(proj.name) + ' · ' + esc(MSA.proj.title(step)) + '</div><div class="bd-sp"></div>' +
    '<div class="bd-tools">' + b('add', 'plus', T('إضافة صور', 'Add images')) + b('text', 'heading', T('نص', 'Text')) + '<i class="bd-sep"></i>' +
    b('tool', 'pin', T('وضع اليد', 'Hand tool'), 'tool') + b('arrange', 'grid', T('ترتيب', 'Arrange')) + '<i class="bd-sep"></i>' +
    b('flipH', 'repeat', T('قلب أفقي', 'Flip horizontal')) + b('flipV', 'repeat', T('قلب رأسي', 'Flip vertical'), 'v') + b('gray', 'eye', T('أبيض وأسود', 'Greyscale')) + b('crop', 'scissors', T('قص', 'Crop')) + b('lock', 'lock', T('تثبيت', 'Lock')) + '<i class="bd-sep"></i>' +
    b('dup', 'copy', T('تكرار', 'Duplicate')) + b('del', 'trash', T('حذف', 'Delete'), 'danger') + b('undo', 'undo', T('تراجع', 'Undo')) + b('redo', 'undo', T('إعادة', 'Redo'), 'redo') + '<i class="bd-sep"></i>' +
    b('fit', 'maximize', T('عرض الكل', 'Fit all')) + b('bg', 'palette', T('الخلفية', 'Background')) + b('export', 'download', T('تصدير', 'Export')) + b('help', 'info', T('اختصارات', 'Shortcuts')) + '</div></div>' +
    '<div class="bd-stage" id="bdStage" tabindex="0"><div class="bd-world" id="bdWorld"><div id="bdItems"></div><div id="bdSel"></div></div>' +
    '<div class="bd-marq" id="bdMarq" hidden></div>' +
    '<div class="bd-empty" id="bdEmpty" hidden><div>' + I('image') + '</div><b>' + esc(T('المود بورد فاضي', 'The board is empty')) + '</b><span>' + esc(T('اسحب صورًا هنا، أو الصق (Ctrl+V)، أو اضغط «إضافة صور».', 'Drop images here, paste (Ctrl+V), or press “Add images”.')) + '</span></div>' +
    '<div class="bd-drop" id="bdDrop" hidden>' + esc(T('أفلت الصور هنا', 'Drop images here')) + '</div></div>' +
    '<div class="bd-status" id="bdStat"></div>';
  document.body.appendChild(root);
  const stage = $('#bdStage', root), world = $('#bdWorld', root), box = $('#bdItems', root), selBox = $('#bdSel', root), marq = $('#bdMarq', root), stat = $('#bdStat', root);
  document.documentElement.classList.add('bd-open');
  stage.style.background = B.bg;
  const hostRect = () => stage.getBoundingClientRect();

  /* ---------- persistence / history ---------- */
  const saveSoon = U.debounce(() => { B.view = Object.assign({}, view); MSA.save(); }, 350);
  const snap = () => JSON.stringify(items);
  function pushHist(key){
    const now = Date.now();
    if (key && key === lastHist && now - lastHistT < 700) { lastHistT = now; return; }
    lastHist = key || ''; lastHistT = now;
    undo.push(snap()); if (undo.length > 80) undo.shift(); redo.length = 0; syncBtns();
  }
  function restore(str){
    items.length = 0; items.push(...JSON.parse(str));
    Array.from(els.keys()).forEach(id => { if (!items.some(i => i.id === id)) { els.get(id).remove(); els.delete(id); } });
    [...sel].forEach(id => { if (!items.some(i => i.id === id)) sel.delete(id); });
    reconcile(); renderAll(); saveSoon();
  }
  function doUndo(){ if (!undo.length) return; endCrop(); redo.push(snap()); restore(undo.pop()); syncBtns(); }
  function doRedo(){ if (!redo.length) return; endCrop(); undo.push(snap()); restore(redo.pop()); syncBtns(); }
  const refd = () => new Set(items.filter(i => i.t === 'img').map(i => i.att));
  /* pictures that nothing on the board uses any more go to the trash (restored by undo); trash is emptied when the board closes */
  function reconcile(){
    const used = refd();
    B.trash = B.trash.filter(a => { if (used.has(a.id)) { step.atts.push(a); return false; } return true; });
    step.atts = step.atts.filter(a => { if (a.kind === 'image' && B.placed.includes(a.id) && !used.has(a.id)) { B.trash.push(a); return false; } return true; });
  }
  async function purge(){ const used = refd(); const gone = B.trash.filter(a => !used.has(a.id)); B.trash = B.trash.filter(a => used.has(a.id)); B.trash.forEach(a => step.atts.push(a)); B.trash = []; for (const a of gone) { try { await MSA.files.del(a.id); } catch (e) {} } B.placed = B.placed.filter(id => step.atts.some(a => a.id === id)); }

  /* ---------- rendering ---------- */
  const nextZ = () => items.reduce((m, i) => Math.max(m, i.z || 0), 0) + 1;
  const minZ = () => items.reduce((m, i) => Math.min(m, i.z || 0), 0) - 1;
  const itemOf = id => items.find(i => i.id === id);
  async function srcFor(it){ if (urlOf.has(it.att)) return urlOf.get(it.att); const u = await MSA.files.url(it.att); if (u) urlOf.set(it.att, u); return u; }
  function mkEl(it){
    const e = document.createElement('div'); e.className = 'bitem' + (it.t === 'txt' ? ' txt' : ''); e.dataset.id = it.id;
    if (it.t === 'txt') e.innerHTML = '<div class="bi-in"><div class="bi-t" dir="auto"></div></div>';
    else { e.innerHTML = '<div class="bi-in"><img class="bi-ghost" alt="" draggable="false"><div class="bi-clip"><img class="bi-img" alt="" draggable="false" decoding="async"></div></div>'; srcFor(it).then(u => { if (u) { $('.bi-img', e).src = u; $('.bi-ghost', e).src = u; } }); }
    box.appendChild(e); els.set(it.id, e); return e;
  }
  function style(it){
    const e = els.get(it.id) || mkEl(it), inn = e.firstChild;
    e.style.left = it.x + 'px'; e.style.top = it.y + 'px'; e.style.width = it.w + 'px'; e.style.height = it.h + 'px';
    e.style.transform = it.r ? 'rotate(' + it.r + 'deg)' : ''; e.style.zIndex = it.z || 0;
    inn.style.transform = (it.fx || it.fy) ? 'scale(' + (it.fx ? -1 : 1) + ',' + (it.fy ? -1 : 1) + ')' : '';
    e.classList.toggle('lk', !!it.lock); e.classList.toggle('cropping', cropId === it.id);
    if (it.t === 'txt') { const t = $('.bi-t', e); t.style.fontSize = it.fs + 'px'; t.style.color = it.col; if (t.textContent !== it.txt && document.activeElement !== t) t.textContent = it.txt; }
    else {
      const c = it.crop || [0, 0, 0, 0], fw = 1 - c[0] - c[2], fh = 1 - c[1] - c[3], FW = it.w / fw, FH = it.h / fh;
      [$('.bi-img', e), $('.bi-ghost', e)].forEach(im => { im.style.width = FW + 'px'; im.style.height = FH + 'px'; im.style.left = (-c[0] * FW) + 'px'; im.style.top = (-c[1] * FH) + 'px'; });
      $('.bi-img', e).style.filter = (it.gray || B.gray) ? 'grayscale(1)' : '';
    }
  }
  function renderAll(){ items.forEach(style); drawSel(); empty(); stats(); syncBtns(); }
  const empty = () => { $('#bdEmpty', root).hidden = items.length > 0; };
  function applyView(){ world.style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.k + ')'; world.style.setProperty('--ik', 1 / view.k); stats(); saveSoon(); }
  const toWorld = (cx, cy) => { const r = hostRect(); return { x: (cx - r.left - view.x) / view.k, y: (cy - r.top - view.y) / view.k }; };
  const viewCenter = () => { const r = hostRect(); return toWorld(r.left + r.width / 2, r.top + r.height / 2); };
  function zoomAt(cx, cy, f){ const r = hostRect(), k = Math.max(K_MIN, Math.min(K_MAX, view.k * f)), q = k / view.k, px = cx - r.left, py = cy - r.top; view.x = px - (px - view.x) * q; view.y = py - (py - view.y) * q; view.k = k; applyView(); }
  function fitTo(list, maxK){
    const r = hostRect(); if (!list.length || !r.width) return;
    const bx = bbAll(list), w = Math.max(40, bx.r - bx.l), h = Math.max(40, bx.b - bx.t), pad = 70;
    const k = Math.max(K_MIN, Math.min(maxK || 2, (r.width - pad * 2) / w, (r.height - pad * 2) / h));
    view = { k, x: r.width / 2 - (bx.l + w / 2) * k, y: r.height / 2 - (bx.t + h / 2) * k }; applyView();
  }
  const sels = () => items.filter(i => sel.has(i.id));
  const targets = () => { const s = sels(); return s.length ? s : items.slice(); };

  /* selection frame with handles (kept at a constant on-screen size via --ik) */
  function frameOf(list){
    if (list.length === 1) { const it = list[0], c = ctr(it); return { cx: c.x, cy: c.y, w: it.w, h: it.h, a: it.r || 0 }; }
    const x = bbAll(list); return { cx: (x.l + x.r) / 2, cy: (x.t + x.b) / 2, w: x.r - x.l, h: x.b - x.t, a: 0 };
  }
  function drawSel(){
    const list = sels(); selBox.innerHTML = '';
    if (!list.length) return;
    if (list.length > 1) list.forEach(it => { const o = document.createElement('div'); o.className = 'bd-ol'; o.style.cssText = 'left:' + it.x + 'px;top:' + it.y + 'px;width:' + it.w + 'px;height:' + it.h + 'px;transform:rotate(' + (it.r || 0) + 'deg)'; selBox.appendChild(o); });
    const f = frameOf(list), locked = list.every(i => i.lock), fr = document.createElement('div'); fr.className = 'bd-fr' + (locked ? ' lk' : '');
    fr.style.cssText = 'left:' + (f.cx - f.w / 2) + 'px;top:' + (f.cy - f.h / 2) + 'px;width:' + f.w + 'px;height:' + f.h + 'px;transform:rotate(' + f.a + 'deg)';
    if (!locked) {
      if (cropId) fr.innerHTML = ['l', 'r', 't', 'b'].map(h => '<i class="bd-h e ' + h + '" data-h="' + h + '"></i>').join('') + ['nw', 'ne', 'sw', 'se'].map(h => '<i class="bd-h c ' + h + '" data-h="c' + h + '"></i>').join('');
      else fr.innerHTML = ['nw', 'ne', 'sw', 'se'].map(h => '<i class="bd-h c ' + h + '" data-h="' + h + '"></i>').join('') + '<i class="bd-h rot" data-h="rot"></i><i class="bd-rl"></i>';
    }
    selBox.appendChild(fr);
  }
  function stats(){
    const s = sels(); let t = Math.round((view ? view.k : 1) * 100) + '% · ' + items.length + ' ' + T('عنصر', 'items');
    if (s.length) { const x = bbAll(s); t += ' · ' + s.length + ' ' + T('محدد', 'selected') + ' (' + Math.round(x.r - x.l) + '×' + Math.round(x.b - x.t) + ')'; }
    stat.textContent = t;
  }
  function syncBtns(){
    const s = sels(), one = s.length === 1, any = s.length > 0;
    const set = (c, on, dis) => { const el = $('[data-c=' + c + ']', root); if (!el) return; el.classList.toggle('on', !!on); el.disabled = !!dis; };
    set('undo', 0, !undo.length); set('redo', 0, !redo.length); set('dup', 0, !any); set('del', 0, !any);
    set('flipH', 0, !any); set('flipV', 0, !any); set('gray', any ? s.every(i => i.gray) : B.gray, 0);
    set('crop', cropId, !(one && s[0].t === 'img')); set('lock', any && s.every(i => i.lock), !any); set('tool', tool === 'hand', 0);
    const tb = $('[data-c=tool] span', root); if (tb) tb.textContent = tool === 'hand' ? T('وضع اليد', 'Hand tool') : T('وضع التحديد', 'Select tool');
    stage.style.cursor = tool === 'hand' ? 'grab' : 'default';
  }
  function select(ids, add){ if (!add) sel.clear(); ids.forEach(id => sel.add(id)); if (cropId && !(sel.size === 1 && sel.has(cropId))) endCrop(); drawSel(); stats(); syncBtns(); }

  /* ---------- editing operations ---------- */
  const commit = () => { renderAll(); MSA.save(); };
  function mkImg(a, nat, at){
    const s = Math.min(1, 520 / Math.max(nat.w, nat.h)), w = Math.max(40, Math.round(nat.w * s)), h = Math.max(40, Math.round(nat.h * s));
    return { id: U.uid('bi'), t: 'img', att: a.id, nw: nat.w, nh: nat.h, x: at.x - w / 2, y: at.y - h / 2, w, h, r: 0, fx: 0, fy: 0, z: nextZ(), crop: [0, 0, 0, 0] };
  }
  async function addAtts(atts, at, silent){
    atts = atts.filter(a => a.kind === 'image'); if (!atts.length) return;
    if (!silent) pushHist();
    const c = at || viewCenter(), added = []; let bad = 0;
    for (const a of atts) { if (!step.atts.some(x => x.id === a.id)) step.atts.push(a); if (!B.placed.includes(a.id)) B.placed.push(a.id); const nat = await naturalOf(a.id);
      if (!nat) { bad++; step.atts = step.atts.filter(x => x.id !== a.id); B.placed = B.placed.filter(x => x !== a.id); try { await MSA.files.del(a.id); } catch (e) {} continue; }
      const it = mkImg(a, nat, c); it.z = nextZ() + added.length; added.push(it); }
    if (added.length > 1) { layoutRows(added, 1.6).forEach(q => { q.it.w = q.w; q.it.h = q.h; q.it.x = q.x; q.it.y = q.y; }); const x = bbAll(added), dx = c.x - (x.l + x.r) / 2, dy = c.y - (x.t + x.b) / 2; added.forEach(i => { i.x += dx; i.y += dy; }); }
    if (bad) MSA.toast(T('صورة أو أكتر مش مدعومة في المتصفح (مثل HEIC) ومااتضافتش', 'Some images are not supported by the browser (e.g. HEIC) and were skipped'), 'err', 4200);
    if (!added.length) return;
    items.push(...added); reconcile(); select(added.map(i => i.id)); commit();
    if (!silent && (items.length === added.length || added.length > 1)) fitTo(items.length === added.length ? items : added, 1);
  }
  async function addFiles(files, at){
    const imgs = files.filter(f => /^image\//.test(f.type) || /\.(png|jpe?g|gif|webp|svg|bmp|avif|heic)$/i.test(f.name));
    if (!imgs.length) { MSA.toast(T('الملفات دي مش صور', 'Those are not images'), 'err'); return; }
    const atts = [];
    for (const f of imgs) { try { const a = await MSA.files.put(f); a.kind = 'image'; atts.push(a); } catch (e) { MSA.toast(T('تعذّر حفظ: ', 'Could not save: ') + f.name, 'err'); } }
    await addAtts(atts, at);
  }
  function addText(at, txt){
    pushHist(); const c = at || viewCenter(), it = { id: U.uid('bt'), t: 'txt', txt: txt || T('نص', 'Text'), fs: 28, col: contrast(), x: c.x - 120, y: c.y - 24, w: 240, h: 50, r: 0, fx: 0, fy: 0, z: nextZ() };
    items.push(it); select([it.id]); commit(); if (!txt) editText(it);
  }
  const contrast = () => { const h = B.bg.replace('#', ''), n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16), l = (((n >> 16) & 255) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11); return l > 140 ? '#111111' : '#f2f2f0'; };
  function editText(it){
    const e = els.get(it.id), t = $('.bi-t', e); if (!e || it.lock) return; e.classList.add('editing'); try { t.contentEditable = 'plaintext-only'; } catch (er) {} if (t.contentEditable !== 'plaintext-only') t.contentEditable = 'true'; t.focus();
    const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    const done = () => { t.removeEventListener('blur', done); t.contentEditable = 'false'; e.classList.remove('editing'); const v = t.innerText.replace(/\n$/, ''); if (!v.trim()) { pushHist(); remove([it.id]); return; } if (v !== it.txt) { pushHist(); it.txt = v; } it.h = Math.max(it.fs * 1.4, t.scrollHeight); commit(); };
    t.addEventListener('blur', done); t.addEventListener('keydown', ev => { if (ev.key === 'Escape') { ev.stopPropagation(); t.blur(); } });
  }
  function remove(ids){
    if (!ids.length) return; pushHist();
    items = B.items = items.filter(i => !ids.includes(i.id)); ids.forEach(id => { const e = els.get(id); if (e) e.remove(); els.delete(id); sel.delete(id); });
    reconcile(); endCrop(); commit();
  }
  const clone = (it, dx, dy) => { const c = JSON.parse(JSON.stringify(it)); c.id = U.uid(it.t === 'txt' ? 'bt' : 'bi'); c.x += dx; c.y += dy; c.z = nextZ(); c.lock = 0; return c; };
  function dupSel(dx, dy){ const s = sels(); if (!s.length) return; pushHist(); const out = s.map((i, n) => { const c = clone(i, dx == null ? 28 : dx, dy == null ? 28 : dy); c.z += n; return c; }); items.push(...out); select(out.map(i => i.id)); commit(); }
  function change(fn, key){ const s = sels(); if (!s.length) return; pushHist(key); s.forEach(fn); commit(); }
  const unlocked = () => sels().filter(i => !i.lock);
  function flip(axis){ change(i => { if (i.lock) return; i[axis] = i[axis] ? 0 : 1; }); }
  function toGray(){ const s = sels(); if (!s.length) { pushHist(); B.gray = !B.gray; commit(); return; } const on = !s.every(i => i.gray); change(i => { i.gray = on ? 1 : 0; }); }
  function lockToggle(){ const s = sels(); if (!s.length) return; const on = !s.every(i => i.lock); change(i => { i.lock = on ? 1 : 0; }); }
  function zorder(front){ pushHist(); sels().sort((a, b) => a.z - b.z).forEach(i => { i.z = front ? nextZ() : minZ(); }); commit(); }
  function resetSize(){ change(i => { if (i.lock || i.t !== 'img') return; const c = ctr(i), cr = i.crop || [0, 0, 0, 0]; i.w = i.nw * (1 - cr[0] - cr[2]); i.h = i.nh * (1 - cr[1] - cr[3]); setCenter(i, c.x, c.y); }); }
  function resetRot(){ change(i => { if (!i.lock) i.r = 0; }); }
  function nudge(dx, dy){ const s = unlocked(); if (!s.length) return; pushHist('nudge'); s.forEach(i => { i.x += dx; i.y += dy; }); commit(); }

  /* ---------- arrange ---------- */
  function arrange(kind){
    const list = targets().filter(i => !i.lock); if (list.length < (kind === 'dist-h' || kind === 'dist-v' ? 3 : 2)) { MSA.toast(T('حدّد عنصرين أو أكتر', 'Select two or more items'), 'err'); return; }
    pushHist(); const x = bbAll(list), cx = (x.l + x.r) / 2, cy = (x.t + x.b) / 2;
    if (kind === 'optimal') {
      const asp = Math.max(1, hostRect().width / Math.max(1, hostRect().height)); const q = layoutRows(list, Math.min(2.2, asp));
      const bw = Math.max(...q.map(a => a.x + a.w)), bh = Math.max(...q.map(a => a.y + a.h));
      q.forEach(a => { a.it.w = a.w; a.it.h = a.h; a.it.r = 0; a.it.x = cx - bw / 2 + a.x; a.it.y = cy - bh / 2 + a.y; });
    } else if (kind === 'col' || kind === 'row') {
      const L = list.slice().sort((a, b) => kind === 'col' ? (ctr(a).y - ctr(b).y) : (ctr(a).x - ctr(b).x)); let p = 0;
      const tot = L.reduce((s, i) => s + (kind === 'col' ? i.h : i.w) + GAP, -GAP);
      L.forEach(i => { i.r = 0; if (kind === 'col') { i.x = cx - i.w / 2; i.y = cy - tot / 2 + p; p += i.h + GAP; } else { i.y = cy - i.h / 2; i.x = cx - tot / 2 + p; p += i.w + GAP; } });
    } else if (kind === 'nh' || kind === 'nw' || kind === 'ns') {
      const avg = list.reduce((s, i) => s + (kind === 'nh' ? i.h : kind === 'nw' ? i.w : Math.sqrt(i.w * i.h)), 0) / list.length;
      list.forEach(i => { const f = avg / (kind === 'nh' ? i.h : kind === 'nw' ? i.w : Math.sqrt(i.w * i.h)), c = ctr(i); i.w *= f; i.h *= f; if (i.t === 'txt') i.fs *= f; setCenter(i, c.x, c.y); });
    } else if (kind.indexOf('al-') === 0) {
      list.forEach(i => { const q = bb(i), c = ctr(i); let dx = 0, dy = 0; if (kind === 'al-l') dx = x.l - q.l; if (kind === 'al-r') dx = x.r - q.r; if (kind === 'al-t') dy = x.t - q.t; if (kind === 'al-b') dy = x.b - q.b; if (kind === 'al-cx') dx = cx - (q.l + q.r) / 2; if (kind === 'al-cy') dy = cy - (q.t + q.b) / 2; i.x += dx; i.y += dy; });
    } else if (kind === 'dist-h' || kind === 'dist-v') {
      const h = kind === 'dist-h', L = list.slice().sort((a, b) => h ? ctr(a).x - ctr(b).x : ctr(a).y - ctr(b).y);
      const size = L.reduce((s, i) => { const q = bb(i); return s + (h ? q.r - q.l : q.b - q.t); }, 0), span = h ? x.r - x.l : x.b - x.t, gap = (span - size) / (L.length - 1); let p = h ? x.l : x.t;
      L.forEach(i => { const q = bb(i); if (h) { i.x += p - q.l; p += (q.r - q.l) + gap; } else { i.y += p - q.t; p += (q.b - q.t) + gap; } });
    }
    commit(); if (kind === 'optimal') fitTo(list, 1.2);
  }
  function arrangeMenu(x, y){
    MSA.ctx(x, y, [
      { icon: 'grid', label: T('ترتيب مثالي (شبكة)', 'Optimal arrange (grid)'), onClick: () => arrange('optimal') },
      { icon: 'list', label: T('في عمود', 'In a column'), onClick: () => arrange('col') }, { icon: 'list', label: T('في صف', 'In a row'), onClick: () => arrange('row') }, '-',
      { icon: 'maximize', label: T('توحيد الارتفاع', 'Normalize height'), onClick: () => arrange('nh') }, { icon: 'maximize', label: T('توحيد العرض', 'Normalize width'), onClick: () => arrange('nw') }, { icon: 'maximize', label: T('توحيد الحجم', 'Normalize size'), onClick: () => arrange('ns') }, '-',
      { icon: 'arrow-l', label: T('محاذاة لليسار', 'Align left'), onClick: () => arrange('al-l') }, { icon: 'arrow-r', label: T('محاذاة لليمين', 'Align right'), onClick: () => arrange('al-r') },
      { icon: 'chev-u', label: T('محاذاة للأعلى', 'Align top'), onClick: () => arrange('al-t') }, { icon: 'chev-d', label: T('محاذاة للأسفل', 'Align bottom'), onClick: () => arrange('al-b') },
      { icon: 'minus', label: T('توسيط أفقي', 'Center horizontally'), onClick: () => arrange('al-cx') }, { icon: 'minus', label: T('توسيط رأسي', 'Center vertically'), onClick: () => arrange('al-cy') }, '-',
      { icon: 'minus', label: T('توزيع أفقي متساوٍ', 'Distribute horizontally'), onClick: () => arrange('dist-h') }, { icon: 'minus', label: T('توزيع رأسي متساوٍ', 'Distribute vertically'), onClick: () => arrange('dist-v') }
    ]);
  }

  /* ---------- crop ---------- */
  const dispCrop = it => { const c = it.crop || [0, 0, 0, 0]; return { l: it.fx ? c[2] : c[0], t: it.fy ? c[3] : c[1], r: it.fx ? c[0] : c[2], b: it.fy ? c[1] : c[3] }; };
  /* set crop (display-space fractions) keeping the picture where it is: the box edge moves, the pixels do not */
  function setCrop(it, o, n){
    const fw0 = 1 - o.l - o.r, fh0 = 1 - o.t - o.b, FW = o.w / fw0, FH = o.h / fh0, a = rad(o.r0 || 0);
    const w = FW * (1 - n.l - n.r), h = FH * (1 - n.t - n.b), d = rot(((n.l - o.l) * FW) + w / 2 - o.w / 2, ((n.t - o.t) * FH) + h / 2 - o.h / 2, a);
    const c = { x: o.cx + d.x, y: o.cy + d.y }; it.w = w; it.h = h; setCenter(it, c.x, c.y);
    it.crop = [it.fx ? n.r : n.l, it.fy ? n.b : n.t, it.fx ? n.l : n.r, it.fy ? n.t : n.b];
    if (!it.crop.some(v => v > 0.0001)) it.crop = [0, 0, 0, 0];
  }
  function startCrop(){ const s = sels(); if (s.length !== 1 || s[0].t !== 'img' || s[0].lock) return; cropId = s[0].id; style(s[0]); drawSel(); syncBtns(); MSA.toast(T('اسحب حواف الإطار للقص — Enter للإنهاء', 'Drag the frame edges to crop — Enter to finish'), 'ok', 2600); }
  function endCrop(){ if (!cropId) return; const it = itemOf(cropId); cropId = null; if (it) style(it); drawSel(); syncBtns(); }
  function resetCrop(){ const it = sels()[0]; if (!it || it.t !== 'img') return; pushHist(); const c = ctr(it); setCrop(it, { ...dispCrop(it), w: it.w, h: it.h, cx: c.x, cy: c.y, r0: it.r }, { l: 0, t: 0, r: 0, b: 0 }); commit(); }

  /* ---------- pointer interaction ---------- */
  const ptrs = new Map(); let drag = null, pinch = null, lpTimer = 0, lastTap = { t: 0, x: 0, y: 0 };
  const hitItem = tg => { const e = tg.closest && tg.closest('.bitem'); return e && root.contains(e) ? itemOf(e.dataset.id) : null; };
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('.bitem.editing')) return;
    stage.focus({ preventScroll: true }); MSA.closeCtx && MSA.closeCtx();
    lastPt = e.pointerType || 'mouse'; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { stage.setPointerCapture(e.pointerId); } catch (x) {}
    if (ptrs.size === 2) { const [a, c] = [...ptrs.values()]; clearTimeout(lpTimer); drag = null; marq.hidden = true; pinch = { d: Math.hypot(a.x - c.x, a.y - c.y) || 1, k: view.k, mx: (a.x + c.x) / 2, my: (a.y + c.y) / 2, vx: view.x, vy: view.y }; return; }
    if (ptrs.size > 2) return;
    const handle = e.target.closest('[data-h]'), it = hitItem(e.target), w0 = toWorld(e.clientX, e.clientY), mod = e.shiftKey || e.ctrlKey || e.metaKey;
    const base = { sx: e.clientX, sy: e.clientY, w0, moved: false, id: e.pointerId };
    if (e.button === 1 || (e.button === 0 && spaceDown)) { drag = { ...base, type: 'pan', vx: view.x, vy: view.y }; stage.classList.add('grabbing'); e.preventDefault(); return; }
    if (e.button === 2) return;
    if (handle && sels().length) { startHandle(handle.dataset.h, base); e.preventDefault(); return; }
    if (it) {
      if (mod) { if (sel.has(it.id)) sel.delete(it.id); else sel.add(it.id); drawSel(); stats(); syncBtns(); drag = null; return; }
      let solo = null; if (!sel.has(it.id)) select([it.id]); else if (sel.size > 1) solo = it.id;
      if (cropId && cropId !== it.id) endCrop();
      drag = { ...base, type: 'move', solo, orig: sels().filter(i => !i.lock).map(i => [i, i.x, i.y]), pre: snap() };
      if (e.pointerType !== 'mouse') lpTimer = setTimeout(() => { if (drag && !drag.moved) { drag = null; showMenu(e.clientX, e.clientY); } }, 600);
      return;
    }
    if (e.pointerType !== 'mouse') lpTimer = setTimeout(() => { if (drag && !drag.moved) { drag = null; showMenu(e.clientX, e.clientY); } }, 650);
    if (tool === 'hand' || e.pointerType === 'touch' && tool !== 'select') drag = { ...base, type: 'pan', vx: view.x, vy: view.y, empty: true };
    else drag = { ...base, type: 'marq', add: mod, was: new Set(sel) };
    if (!mod && drag.type !== 'marq') { /* selection cleared on release if it was only a tap */ }
    if (!mod && drag.type === 'marq') { /* keep until moved so a click clears */ }
  });
  function startHandle(h, base){
    const list = sels().filter(i => !i.lock); if (!list.length) return; const f = frameOf(list), pre = snap();
    if (h === 'rot') { drag = { ...base, type: 'rot', f, a0: Math.atan2(base.w0.y - f.cy, base.w0.x - f.cx), orig: list.map(i => [i, ctr(i), i.r || 0]), pre }; return; }
    if (h.length === 1 || h.charAt(0) === 'c' && h.length === 3) {
      if (cropId) { const it = itemOf(cropId); if (!it) return; const c = ctr(it); drag = { ...base, type: 'crop', h: h.replace(/^c/, ''), it, o: { ...dispCrop(it), w: it.w, h: it.h, cx: c.x, cy: c.y, r0: it.r || 0 }, pre }; return; }
    }
    const key = h.replace(/^c/, ''), sx = key.indexOf('e') >= 0 ? 1 : -1, sy = key.indexOf('s') >= 0 ? 1 : -1, a = rad(f.a);
    const rel = (x, y) => { const q = rot(x * f.w / 2, y * f.h / 2, a); return { x: f.cx + q.x, y: f.cy + q.y }; };
    const corner = rel(sx, sy), anchor = rel(-sx, -sy);
    drag = { ...base, type: 'scale', anchor, d0: Math.hypot(corner.x - anchor.x, corner.y - anchor.y) || 1, orig: list.map(i => [i, ctr(i), i.w, i.h, i.fs || 0]), pre };
  }
  stage.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size >= 2) {
      const [a, c] = [...ptrs.values()], d = Math.hypot(a.x - c.x, a.y - c.y) || 1, mx = (a.x + c.x) / 2, my = (a.y + c.y) / 2, r = hostRect();
      const k = Math.max(K_MIN, Math.min(K_MAX, pinch.k * d / pinch.d)), q = k / pinch.k, px = pinch.mx - r.left, py = pinch.my - r.top;
      view.k = k; view.x = (mx - r.left) - (px - pinch.vx) * q; view.y = (my - r.top) - (py - pinch.vy) * q; applyView(); return;
    }
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    if (!drag.moved) { drag.moved = true; clearTimeout(lpTimer); if (drag.pre) { undo.push(drag.pre); if (undo.length > 80) undo.shift(); redo.length = 0; syncBtns(); } }
    const w = toWorld(e.clientX, e.clientY);
    if (drag.type === 'pan') { view.x = drag.vx + dx; view.y = drag.vy + dy; applyView(); }
    else if (drag.type === 'move') {
      let mx = w.x - drag.w0.x, my = w.y - drag.w0.y; if (e.shiftKey) { if (Math.abs(mx) > Math.abs(my)) my = 0; else mx = 0; }
      drag.orig.forEach(([i, x, y]) => { i.x = x + mx; i.y = y + my; style(i); }); drawSel(); stats();
    } else if (drag.type === 'marq') {
      const r = hostRect(), x1 = Math.min(drag.sx, e.clientX) - r.left, y1 = Math.min(drag.sy, e.clientY) - r.top, x2 = Math.max(drag.sx, e.clientX) - r.left, y2 = Math.max(drag.sy, e.clientY) - r.top;
      marq.hidden = false; marq.style.cssText = 'left:' + x1 + 'px;top:' + y1 + 'px;width:' + (x2 - x1) + 'px;height:' + (y2 - y1) + 'px';
      const a = toWorld(Math.min(drag.sx, e.clientX), Math.min(drag.sy, e.clientY)), c = toWorld(Math.max(drag.sx, e.clientX), Math.max(drag.sy, e.clientY));
      sel.clear(); if (drag.add) drag.was.forEach(id => sel.add(id));
      items.forEach(i => { const q = bb(i); if (q.r >= a.x && q.l <= c.x && q.b >= a.y && q.t <= c.y) sel.add(i.id); });
      drawSel(); stats(); syncBtns();
    } else if (drag.type === 'scale') {
      let f = Math.hypot(w.x - drag.anchor.x, w.y - drag.anchor.y) / drag.d0; f = Math.max(.02, Math.min(60, f));
      drag.orig.forEach(([i, c, ow, oh, ofs]) => { const nc = { x: drag.anchor.x + (c.x - drag.anchor.x) * f, y: drag.anchor.y + (c.y - drag.anchor.y) * f }; i.w = ow * f; i.h = oh * f; if (i.t === 'txt') i.fs = Math.max(4, ofs * f); setCenter(i, nc.x, nc.y); style(i); });
      drawSel(); stats();
    } else if (drag.type === 'rot') {
      let da = Math.atan2(w.y - drag.f.cy, w.x - drag.f.cx) - drag.a0;
      if (e.shiftKey) { const single = drag.orig.length === 1; const base = single ? drag.orig[0][2] : 0; da = rad(Math.round((deg(da) + base) / 15) * 15 - base); }
      drag.orig.forEach(([i, c, r0]) => { const q = rot(c.x - drag.f.cx, c.y - drag.f.cy, da); setCenter(i, drag.f.cx + q.x, drag.f.cy + q.y); i.r = ((r0 + deg(da)) % 360 + 360) % 360; if (i.r > 180) i.r -= 360; style(i); });
      drawSel(); stats();
    } else if (drag.type === 'crop') {
      const it = drag.it, o = drag.o, a = rad(o.r0), loc = rot(w.x - drag.w0.x, w.y - drag.w0.y, -a), FW = o.w / (1 - o.l - o.r), FH = o.h / (1 - o.t - o.b);
      const n = { l: o.l, t: o.t, r: o.r, b: o.b }, min = .04;
      if (drag.h.indexOf('l') >= 0 || drag.h === 'nw' || drag.h === 'sw') n.l = Math.max(0, Math.min(1 - n.r - min, o.l + loc.x / FW));
      if (drag.h === 'r' || drag.h === 'ne' || drag.h === 'se') n.r = Math.max(0, Math.min(1 - n.l - min, o.r - loc.x / FW));
      if (drag.h === 't' || drag.h === 'nw' || drag.h === 'ne') n.t = Math.max(0, Math.min(1 - n.b - min, o.t + loc.y / FH));
      if (drag.h === 'b' || drag.h === 'sw' || drag.h === 'se') n.b = Math.max(0, Math.min(1 - n.t - min, o.b - loc.y / FH));
      setCrop(it, o, n); style(it); drawSel(); stats();
    }
  });
  const endPtr = e => {
    if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId); clearTimeout(lpTimer);
    try { stage.releasePointerCapture(e.pointerId); } catch (x) {}
    if (pinch) { if (ptrs.size < 2) { pinch = null; drag = null; } saveSoon(); return; }
    const d = drag; if (!d || d.id !== e.pointerId) return; drag = null; stage.classList.remove('grabbing'); marq.hidden = true;
    if (!d.moved) {
      if (d.type === 'move' && d.solo) select([d.solo]);
      else if (d.type === 'marq' || d.empty) { if (!d.add) select([]); }
      const now = Date.now(), near = Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 24;
      if (now - lastTap.t < 340 && near) { lastTap.t = 0; tapTwice(e); } else lastTap = { t: now, x: e.clientX, y: e.clientY };
      return;
    }
    if (d.type === 'move' || d.type === 'scale' || d.type === 'rot' || d.type === 'crop') commit(); else if (d.type === 'marq') { syncBtns(); }
    MSA.save();
  };
  stage.addEventListener('pointerup', endPtr); stage.addEventListener('pointercancel', endPtr);
  function tapTwice(e){
    const it = hitItem(document.elementFromPoint(e.clientX, e.clientY) || e.target);
    if (it && it.t === 'txt') { select([it.id]); editText(it); }
    else if (it) { select([it.id]); fitTo([it], 3); }
    else addText(toWorld(e.clientX, e.clientY));
  }
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.altKey && sels().length) { const f = Math.exp(-e.deltaY * .0015), list = unlocked(), x = frameOf(list); pushHist('wheel'); list.forEach(i => { const c = ctr(i), q = { x: x.cx + (c.x - x.cx) * f, y: x.cy + (c.y - x.cy) * f }; i.w *= f; i.h *= f; if (i.t === 'txt') i.fs *= f; setCenter(i, q.x, q.y); }); commit(); return; }
    zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0016) * (e.deltaMode === 1 ? 16 : 1)));
  }, { passive: false });
  stage.addEventListener('contextmenu', e => { e.preventDefault(); const it = hitItem(e.target); if (it && !sel.has(it.id)) select([it.id]); showMenu(e.clientX, e.clientY); });
  stage.addEventListener('dragover', e => { e.preventDefault(); $('#bdDrop', root).hidden = false; });
  stage.addEventListener('dragleave', e => { if (e.target === stage || !stage.contains(e.relatedTarget)) $('#bdDrop', root).hidden = true; });
  stage.addEventListener('drop', e => { e.preventDefault(); $('#bdDrop', root).hidden = true; const fs = [...(e.dataTransfer.files || [])]; if (fs.length) addFiles(fs, toWorld(e.clientX, e.clientY)); });

  /* ---------- clipboard ---------- */
  function copySel(cut){ const s = sels(); if (!s.length) return; clip = JSON.parse(JSON.stringify(s)); if (cut) remove(s.map(i => i.id)); else MSA.toast(T('اتنسخ', 'Copied'), 'ok', 900); }
  function pasteInternal(){ if (!clip) return false; pushHist(); const out = clip.map(c => { const n = JSON.parse(JSON.stringify(c)); n.id = U.uid(c.t === 'txt' ? 'bt' : 'bi'); n.x += 30; n.y += 30; n.z = nextZ(); n.lock = 0; return n; }); clip = JSON.parse(JSON.stringify(out)); items.push(...out); reconcile(); select(out.map(i => i.id)); commit(); return true; }
  const onPaste = e => {
    if (dead || document.querySelector('#overlayRoot .overlay') || /INPUT|TEXTAREA/.test((e.target || {}).tagName) || (e.target && e.target.isContentEditable)) return;
    const fs = [...(e.clipboardData ? e.clipboardData.files : [])].filter(f => /^image\//.test(f.type));
    if (fs.length) { e.preventDefault(); addFiles(fs); return; }
    if (clip) { e.preventDefault(); pasteInternal(); return; }
    const tx = e.clipboardData && e.clipboardData.getData('text/plain'); if (tx && tx.trim()) { e.preventDefault(); addText(null, tx.trim().slice(0, 2000)); }
  };
  document.addEventListener('paste', onPaste);

  /* ---------- export ---------- */
  async function renderPng(list, o){
    o = o || {}; const x = bbAll(list), pad = 40, W = x.r - x.l + pad * 2, H = x.b - x.t + pad * 2;
    const sc = Math.min(o.scale || 1, 4096 / Math.max(W, H), Math.sqrt(16e6 / (W * H))); if (!isFinite(sc) || sc <= 0) throw new Error('size');
    const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(W * sc)); cv.height = Math.max(1, Math.round(H * sc)); const g = cv.getContext('2d');
    g.fillStyle = B.bg; g.fillRect(0, 0, cv.width, cv.height);
    for (const it of list.slice().sort((a, b) => (a.z || 0) - (b.z || 0))) {
      const c = ctr(it); g.save(); g.translate((c.x - x.l + pad) * sc, (c.y - x.t + pad) * sc); g.rotate(rad(it.r || 0)); g.scale(it.fx ? -1 : 1, it.fy ? -1 : 1);
      if (it.t === 'txt') {
        g.fillStyle = it.col; g.font = (it.fs * sc) + 'px "Segoe UI","Noto Sans Arabic",Tahoma,Arial,sans-serif'; g.textBaseline = 'top'; g.direction = /[؀-ۿ]/.test(it.txt) ? 'rtl' : 'ltr'; g.textAlign = g.direction === 'rtl' ? 'right' : 'left';
        const lines = []; it.txt.split('\n').forEach(ln => { let cur = ''; ln.split(' ').forEach(wd => { const t = cur ? cur + ' ' + wd : wd; if (g.measureText(t).width > it.w * sc && cur) { lines.push(cur); cur = wd; } else cur = t; }); lines.push(cur); });
        lines.forEach((ln, n) => g.fillText(ln, g.direction === 'rtl' ? it.w * sc / 2 : -it.w * sc / 2, -it.h * sc / 2 + n * it.fs * sc * 1.25));
      } else {
        const u = await srcFor(it), im = await new Promise(r => { const m = new Image(); m.onload = () => r(m); m.onerror = () => r(null); m.src = u; });
        if (im) {
          const cr = it.crop || [0, 0, 0, 0], sw = im.naturalWidth * (1 - cr[0] - cr[2]), sh = im.naturalHeight * (1 - cr[1] - cr[3]);
          const gray = it.gray || B.gray;
          if (gray && 'filter' in g) g.filter = 'grayscale(1)';
          g.drawImage(im, im.naturalWidth * cr[0], im.naturalHeight * cr[1], sw, sh, -it.w * sc / 2, -it.h * sc / 2, it.w * sc, it.h * sc); g.filter = 'none';
        }
      }
      g.restore();
    }
    if ((list.some(i => i.gray) || B.gray) && !('filter' in g)) { /* browsers without canvas filters: desaturate the whole export only when everything is grey */
      if (B.gray) { const d = g.getImageData(0, 0, cv.width, cv.height), a = d.data; for (let i = 0; i < a.length; i += 4) { const v = a[i] * .3 + a[i + 1] * .59 + a[i + 2] * .11; a[i] = a[i + 1] = a[i + 2] = v; } g.putImageData(d, 0, 0); }
    }
    return new Promise((res, rej) => cv.toBlob(bl => bl ? res(bl) : rej(new Error('blob')), 'image/png'));
  }
  function exportMenu(x, y){
    const s = sels(), nm = 'moodboard-' + String(MSA.proj.title(step)).replace(/[^\w؀-ۿ]+/g, '-').slice(0, 30);
    const go = async (list, how) => {
      if (!list.length) { MSA.toast(T('المود بورد فاضي', 'The board is empty'), 'err'); return; }
      try {
        MSA.toast(T('جاري التصدير…', 'Exporting…'), 'ok', 1200); const bl = await renderPng(list, { scale: 1.5 });
        if (how === 'file') { const f = new File([bl], nm + '.png', { type: 'image/png' }); const a = await MSA.files.put(f); a.kind = 'image'; a.noBoard = true; step.atts.push(a); MSA.save(); MSA.toast(T('اتحفظت كصورة في ملفات المرحلة', 'Saved as an image in the step files')); return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = nm + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 6000);
      } catch (e) { MSA.toast(T('تعذّر التصدير (الصورة كبيرة جدًا؟)', 'Export failed (too large?)'), 'err'); }
    };
    MSA.ctx(x, y, [
      { icon: 'download', label: T('تنزيل المود بورد كله PNG', 'Download whole board (PNG)'), onClick: () => go(items, 'dl') },
      ...(s.length ? [{ icon: 'download', label: T('تنزيل المحدد فقط PNG', 'Download selection (PNG)'), onClick: () => go(s, 'dl') }] : []),
      { icon: 'image', label: T('حفظ كصورة في ملفات المرحلة', 'Save as image in step files'), onClick: () => go(s.length ? s : items, 'file') }
    ]);
  }
  function bgMenu(x, y){
    const el = MSA.ctx(x, y, [{ icon: 'palette', label: T('خلفية …', 'Background …'), onClick: () => {} }]); el.innerHTML = '<div class="bd-bgs">' + BGS.map(c => '<button style="background:' + c + '" data-bg="' + c + '" class="' + (B.bg === c ? 'on' : '') + '" aria-label="' + c + '"></button>').join('') + '<label class="bd-bgc" title="custom"><input type="color" value="' + (/^#[0-9a-f]{6}$/i.test(B.bg) ? B.bg : '#1c1c1e') + '"></label></div>';
    const setBg = c => { B.bg = c; stage.style.background = c; MSA.save(); };
    el.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => { setBg(b.dataset.bg); el.remove(); });
    el.querySelector('input').oninput = e => setBg(e.target.value);
  }
  let lastPt = 'mouse';
  function showMenu(x, y){
    const s = sels(), any = s.length > 0, one = s.length === 1;
    const L = [];
    if (any) {
      L.push({ icon: 'copy', label: T('نسخ', 'Copy') + '  Ctrl+C', onClick: () => copySel(false) }, { icon: 'scissors', label: T('قص', 'Cut') + '  Ctrl+X', onClick: () => copySel(true) }, { icon: 'copy', label: T('تكرار', 'Duplicate') + '  Ctrl+D', onClick: () => dupSel() });
      if (clip) L.push({ icon: 'paste', label: T('لصق', 'Paste') + '  Ctrl+V', onClick: pasteInternal });
      L.push('-', { icon: 'repeat', label: T('قلب أفقي', 'Flip horizontal') + '  Shift+H', onClick: () => flip('fx') }, { icon: 'repeat', label: T('قلب رأسي', 'Flip vertical') + '  Shift+V', onClick: () => flip('fy') },
        { icon: 'eye', label: T('أبيض وأسود', 'Greyscale') + '  G', onClick: toGray }, { icon: 'lock', label: T('تثبيت / فك التثبيت', 'Lock / unlock') + '  L', onClick: lockToggle });
      if (one && s[0].t === 'img') L.push({ icon: 'scissors', label: T('قص', 'Crop') + '  C', onClick: startCrop }, { icon: 'undo', label: T('إلغاء القص', 'Reset crop'), onClick: resetCrop });
      L.push({ icon: 'maximize', label: T('الحجم الأصلي', 'Original size') + '  Ctrl+1', onClick: resetSize }, { icon: 'undo', label: T('تصفير الدوران', 'Reset rotation'), onClick: resetRot }, '-',
        { icon: 'chev-u', label: T('للأمام', 'Bring to front') + '  PgUp', onClick: () => zorder(true) }, { icon: 'chev-d', label: T('للخلف', 'Send to back') + '  PgDn', onClick: () => zorder(false) },
        { icon: 'grid', label: T('ترتيب…', 'Arrange…'), onClick: () => arrangeMenu(x, y) }, '-', { icon: 'trash', label: T('حذف', 'Delete') + '  Del', danger: true, onClick: () => remove([...sel]) });
    } else {
      L.push({ icon: 'paste', label: T('لصق', 'Paste') + '  Ctrl+V', onClick: async () => { if (!pasteInternal()) { try { const cl = await navigator.clipboard.read(); const fs = []; for (const ci of cl) for (const ty of ci.types) if (/^image\//.test(ty)) fs.push(new File([await ci.getType(ty)], 'pasted.png', { type: ty })); if (fs.length) addFiles(fs, toWorld(x, y)); else MSA.toast(T('مفيش صورة في الحافظة — استخدم Ctrl+V', 'No image on the clipboard — use Ctrl+V'), 'err'); } catch (er) { MSA.toast(T('استخدم Ctrl+V للصق', 'Use Ctrl+V to paste'), 'err'); } } } },
        { icon: 'image', label: T('إضافة صور…', 'Add images…'), onClick: () => cmd('add') }, { icon: 'heading', label: T('إضافة نص', 'Add text'), onClick: () => addText(toWorld(x, y)) }, '-',
        { icon: 'checks', label: T('تحديد الكل', 'Select all') + '  Ctrl+A', onClick: () => select(items.map(i => i.id)) }, { icon: 'grid', label: T('ترتيب الكل…', 'Arrange all…'), onClick: () => arrangeMenu(x, y) }, { icon: 'maximize', label: T('عرض الكل', 'Fit all') + '  F', onClick: () => fitTo(items, 1.5) }, { icon: 'download', label: T('تصدير…', 'Export…'), onClick: () => exportMenu(x, y) });
    }
    MSA.ctx(x, y, L, { guard: lastPt !== 'mouse' });
  }

  /* ---------- commands + keyboard ---------- */
  function help(){
    const rows = [['Space + سحب / زر الماوس الأوسط', 'Space + drag / middle mouse', 'تحريك اللوحة', 'Pan'], ['عجلة الماوس', 'Mouse wheel', 'تكبير وتصغير', 'Zoom'], ['Alt + عجلة', 'Alt + wheel', 'تكبير المحدد', 'Scale selection'],
      ['سحب على الفراغ', 'Drag on empty space', 'تحديد متعدد', 'Marquee select'], ['Shift / Ctrl + ضغط', 'Shift / Ctrl + click', 'إضافة للتحديد', 'Add to selection'], ['Ctrl+A', 'Ctrl+A', 'تحديد الكل', 'Select all'],
      ['Ctrl+V', 'Ctrl+V', 'لصق صورة أو نص', 'Paste image or text'], ['سحب ملفات', 'Drop files', 'إضافة صور', 'Add images'], ['ضغطتين على صورة', 'Double-click image', 'تركيز عليها', 'Focus on it'], ['ضغطتين على الفراغ', 'Double-click empty', 'نص جديد', 'New text'],
      ['Shift أثناء السحب', 'Shift while dragging', 'اتجاه واحد', 'Constrain axis'], ['Shift أثناء التدوير', 'Shift while rotating', 'خطوات 15°', 'Snap 15°'], ['الأسهم', 'Arrow keys', 'تحريك دقيق (Shift أكبر)', 'Nudge (Shift = more)'],
      ['Shift+H / Shift+V', 'Shift+H / Shift+V', 'قلب', 'Flip'], ['G', 'G', 'أبيض وأسود', 'Greyscale'], ['C', 'C', 'قص', 'Crop'], ['L', 'L', 'تثبيت', 'Lock'], ['Ctrl+D', 'Ctrl+D', 'تكرار', 'Duplicate'],
      ['PageUp / PageDown', 'PageUp / PageDown', 'للأمام / للخلف', 'Front / back'], ['Ctrl+1', 'Ctrl+1', 'الحجم الأصلي', 'Original size'], ['F', 'F', 'عرض الكل أو المحدد', 'Fit all / selection'], ['Ctrl+Z / Ctrl+Y', 'Ctrl+Z / Ctrl+Y', 'تراجع / إعادة', 'Undo / redo'], ['Delete', 'Delete', 'حذف', 'Delete'], ['Esc', 'Esc', 'إلغاء التحديد ثم إغلاق', 'Deselect, then close'], ['كليك يمين', 'Right-click', 'كل الأوامر', 'All commands']];
    MSA.modal({ title: T('اختصارات المود بورد', 'Moodboard shortcuts'), size: 'wide', footer: false, body: '<div class="bd-help">' + rows.map(r => '<div><kbd dir="ltr">' + esc(T(r[0], r[1])) + '</kbd><span>' + esc(T(r[2], r[3])) + '</span></div>').join('') + '</div><p class="hint">' + esc(T('على الموبايل والتابلت: اسحب بإصبع للتحريك، إصبعين للتكبير، اضغط مطولًا للقائمة.', 'On phones and tablets: one finger pans, two fingers zoom, long-press for the menu.')) + '</p>' });
  }
  async function cmd(c, el){
    const r = el ? el.getBoundingClientRect() : { left: 80, bottom: 80 };
    switch (c) {
      case 'close': return close();
      case 'add': { const a = await MSA.addFiles('image'); if (a.length) addAtts(a); return; }
      case 'text': return addText();
      case 'tool': tool = tool === 'hand' ? 'select' : 'hand'; return syncBtns();
      case 'arrange': return arrangeMenu(r.left, r.bottom + 4);
      case 'flipH': return flip('fx'); case 'flipV': return flip('fy'); case 'gray': return toGray();
      case 'crop': return cropId ? endCrop() : startCrop();
      case 'lock': return lockToggle(); case 'dup': return dupSel(); case 'del': return remove([...sel]);
      case 'undo': return doUndo(); case 'redo': return doRedo();
      case 'fit': return fitTo(sels().length ? sels() : items, 1.5);
      case 'bg': return bgMenu(r.left, r.bottom + 4); case 'export': return exportMenu(r.left, r.bottom + 4); case 'help': return help();
    }
  }
  root.addEventListener('click', e => { const bt = e.target.closest('[data-c]'); if (bt && root.contains(bt)) cmd(bt.dataset.c, bt); });
  const typing = e => { const t = e.target; return t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable); };
  const onKey = e => {
    if (dead) return;
    if (e.key === ' ' && !typing(e)) { if (!document.querySelector('#overlayRoot .overlay')) { spaceDown = true; stage.classList.add('spc'); e.preventDefault(); } return; }
    if (typing(e) || document.querySelector('#overlayRoot .overlay')) return;
    const k = /^Key[A-Z]$/.test(e.code || '') ? e.code.slice(3).toLowerCase() : /^Digit[0-9]$/.test(e.code || '') ? e.code.slice(5) : e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey, st = e.shiftKey;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (cropId) endCrop(); else if (sel.size) select([]); else close(); return; }
    if (e.key === 'Enter' && cropId) { e.preventDefault(); endCrop(); return; }
    if (mod && k === 'a') { e.preventDefault(); select(items.map(i => i.id)); return; }
    if (mod && k === 'z') { e.preventDefault(); st ? doRedo() : doUndo(); return; }
    if (mod && k === 'y') { e.preventDefault(); doRedo(); return; }
    if (mod && k === 'c') { if (sel.size) { e.preventDefault(); copySel(false); } return; }
    if (mod && k === 'x') { if (sel.size) { e.preventDefault(); copySel(true); } return; }
    if (mod && k === 'd') { e.preventDefault(); dupSel(); return; }
    if (mod && k === '1') { e.preventDefault(); const r = hostRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / view.k); return; }
    if (mod) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove([...sel]); return; }
    if (st && k === 'h') { e.preventDefault(); flip('fx'); return; } if (st && k === 'v') { e.preventDefault(); flip('fy'); return; }
    if (!st && k === 'g') { toGray(); return; } if (k === 'c' && !st) { cropId ? endCrop() : startCrop(); return; } if (k === 'l') { lockToggle(); return; } if (k === 'f') { fitTo(sels().length ? sels() : items, 1.5); return; } if (k === 't' && !st) { e.preventDefault(); addText(); return; }
    if (e.key === 'PageUp') { e.preventDefault(); zorder(true); return; } if (e.key === 'PageDown') { e.preventDefault(); zorder(false); return; }
    const step_ = st ? 20 : 2; if (e.key.indexOf('Arrow') === 0 && sel.size) { e.preventDefault(); nudge(e.key === 'ArrowLeft' ? -step_ : e.key === 'ArrowRight' ? step_ : 0, e.key === 'ArrowUp' ? -step_ : e.key === 'ArrowDown' ? step_ : 0); }
  };
  const onKeyUp = e => { if (e.key === ' ') { spaceDown = false; stage.classList.remove('spc'); } };
  document.addEventListener('keydown', onKey, true); document.addEventListener('keyup', onKeyUp, true);
  const onRes = () => { if (view) applyView(); };
  window.addEventListener('resize', onRes);

  async function close(){
    if (dead) return; dead = true; endCrop(); saveSoon.flush && saveSoon.flush(); B.view = Object.assign({}, view);
    document.removeEventListener('paste', onPaste); document.removeEventListener('keydown', onKey, true); document.removeEventListener('keyup', onKeyUp, true); window.removeEventListener('resize', onRes);
    root.remove(); document.documentElement.classList.remove('bd-open');
    B.items = items; await purge(); MSA.save(); MSA.updateCounts && MSA.updateCounts(); MSA.rerender(true);
  }

  /* ---------- start ---------- */
  (async () => {
    /* crash safety: anything left in the trash from a previous session is gone for good */
    await purge();
    items = B.items = items.filter(i => i.t !== 'img' || step.atts.some(a => a.id === i.att));
    items.forEach(i => { if (!i.id) i.id = U.uid('bi'); if (i.t === 'img' && !i.crop) i.crop = [0, 0, 0, 0]; });
    B.placed = B.placed.filter(id => step.atts.some(a => a.id === id) || B.trash.some(a => a.id === id));
    /* pictures attached to the step from the plan view show up on the board automatically */
    const fresh = step.atts.filter(a => a.kind === 'image' && !a.noBoard && !B.placed.includes(a.id) && !items.some(i => i.att === a.id));
    items.forEach(style); renderAll();
    const r = hostRect();
    if (!view) view = { k: 1, x: r.width / 2, y: r.height / 2 }; applyView();
    if (fresh.length) {
      let at = { x: 0, y: 0 }; if (items.length) { const x = bbAll(items); at = { x: (x.l + x.r) / 2, y: x.b + 260 }; }
      await addAtts(fresh, at, true); if (items.length === fresh.length || !B.view) fitTo(items, 1);
    } else if (items.length && !B.view) fitTo(items, 1);
    sel.clear(); items.forEach(style); renderAll(); stage.focus({ preventScroll: true });
  })();
}
})();
