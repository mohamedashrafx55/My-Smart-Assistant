/* Cell (stage) properties: tabs for Properties / To-do (sections) / Word document, and drag-to-grid frames.
   Anything in a cell's panel (picture, video, file, note, to-do section, Word doc) can be dragged onto the grid, where it becomes a frame like a stage. */
(function(){
'use strict';
const MSA = window.MSA, U = MSA.u, I = MSA.icon, P = MSA.proj;
const T = (a, e) => MSA.T(a, e), esc = U.esc;
const en = () => MSA.state.settings.lang === 'en';
const C = MSA.cell = {};
const COLS = ['#ef5b5b', '#f59e0b', '#10b981', '#4f8cff', '#a56bef', '#8a8a86'];
const GRID = 10, snap = v => Math.round(v / GRID) * GRID;
const slug = s => String(s || 'doc').replace(/[^\w؀-ۿ]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'doc';

/* ================================================================ data */
const todo = s => s.todo && Array.isArray(s.todo.sections) ? s.todo : null;
const tdo = s => s.todo = (todo(s) || { sections: [] });
const counts = s => { const t = todo(s); let a = 0, d = 0; if (t) t.sections.forEach(x => x.items.forEach(i => { a++; if (i.done) d++; })); return { all: a, done: d }; };
C.counts = counts;
C.badge = s => { const c = counts(s); return c.all ? '<span class="mn-todo' + (c.done === c.all ? ' ok' : '') + '" title="To-do">' + I('check-c', 'xs') + c.done + '/' + c.all + '</span>' : ''; };
const plain = html => { const d = document.createElement('div'); d.innerHTML = html || ''; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
const tab = () => MSA.state.ui.celTab || 'props';
const mkSec = (title, col) => ({ id: U.uid('cs'), title, col: col || COLS[3], items: [], fold: false });
const mkItem = text => ({ id: U.uid('ci'), text, done: false });

/* ================================================================ tabs */
C.tabBar = step => {
  const c = counts(step), t = tab(), has = !!(step.doc && step.doc.html);
  const b = (k, ic, lab, n) => '<button class="cel-tab' + (t === k ? ' on' : '') + '" data-ct="' + k + '" role="tab">' + I(ic, 'sm') + '<span>' + esc(lab) + '</span>' + (n ? '<em>' + n + '</em>' : '') + '</button>';
  return '<div class="cel-tabs" role="tablist">' + b('props', 'list', T('الخصائص', 'Properties')) + b('todo', 'check-c', 'To-do', c.all ? c.done + '/' + c.all : '') + b('doc', 'doc', 'Word', has ? '•' : '') + '</div>';
};

/* fill the panel body for the active tab */
C.fill = (body, step, ctx) => {
  const t = tab();
  if (t === 'todo') return todoTab(body, step, ctx);
  if (t === 'doc') return docTab(body, step, ctx);
  body.innerHTML = P.stepHTML(step, 0);
  MSA.hydrateAtts(body); MSA.apps.hydrate(body);
  /* drag handles on every picture / video / file and on the note */
  body.querySelectorAll('.att[data-att]').forEach(a => { a.insertAdjacentHTML('beforeend', '<i class="cgrip" data-cg="att" data-ref="' + a.dataset.att + '" title="' + esc(T('اسحبه على الشبكة', 'Drag onto the grid')) + '">' + I('layers', 'xs') + '</i>'); });
  const nb = body.querySelector('.note-box'); if (nb) nb.insertAdjacentHTML('afterbegin', '<i class="cgrip note" data-cg="note" data-ref="" title="' + esc(T('اسحب الملاحظة على الشبكة', 'Drag the note onto the grid')) + '">' + I('layers', 'xs') + '</i>');
};

/* ================================================================ To-do tab */
function todoTab(body, step, ctx){
  const t = todo(step), c = counts(step), save = () => { ctx.commit(); C.refreshCards(ctx, step.id); ctx.refreshBadge && ctx.refreshBadge(step); };
  const draw = () => {
    const ts = todo(step), cc = counts(step), pct = cc.all ? Math.round(cc.done / cc.all * 100) : 0;
    body.innerHTML = '<div class="cl-wrap"><div class="cl-top"><div class="progress grow"><i style="width:' + pct + '%"></i></div><b>' + cc.done + '/' + cc.all + '</b>' + (ts && ts.sections.length ? '<i class="cgrip inl" data-cg="todo" data-ref="" title="' + esc(T('اسحب القائمة كلها على الشبكة', 'Drag the whole list onto the grid')) + '">' + I('layers', 'xs') + '</i>' : '') + '</div>' +
      '<p class="hint" dir="auto" style="margin:4px 0 8px">' + esc(T('قسّم الخطوة لأقسام (مهم جدًا / مهم / لاحقًا…) واشتغل بالترتيب. اسحب أي قسم على الشبكة ليصبح فريم.', 'Split this step into sections (critical / important / later…) and work in order. Drag any section onto the grid to make it a frame.')) + '</p>' +
      (ts && ts.sections.length ? ts.sections.map(sec => {
        const sd = sec.items.filter(i => i.done).length;
        return '<div class="cl-sec' + (sec.fold ? ' fold' : '') + '" data-sec="' + sec.id + '" style="--sc:' + sec.col + '"><div class="cl-sh"><button class="icon-btn sm" data-cl="fold" title="' + esc(T('طي / فتح', 'Fold')) + '">' + I(sec.fold ? 'chev-r' : 'chev-d', 'sm') + '</button><button class="cl-dot" data-cl="col" title="' + esc(T('اللون', 'Colour')) + '"></button>' +
          '<input class="cl-st" data-cf="title" dir="auto" value="' + esc(sec.title) + '"><span class="cl-cnt">' + sd + '/' + sec.items.length + '</span><i class="cgrip inl" data-cg="todo" data-ref="' + sec.id + '" title="' + esc(T('اسحب القسم على الشبكة', 'Drag the section onto the grid')) + '">' + I('layers', 'xs') + '</i><button class="icon-btn sm danger" data-cl="delsec" title="' + esc(T('حذف القسم', 'Delete section')) + '">' + I('trash', 'sm') + '</button></div>' +
          (sec.fold ? '' : '<div class="cl-items">' + sec.items.map(i => '<div class="cl-it' + (i.done ? ' dn' : '') + '" data-it="' + i.id + '"><input type="checkbox" class="cb" data-cl="chk"' + (i.done ? ' checked' : '') + '><input type="text" class="cl-tx" data-cf="text" dir="auto" value="' + esc(i.text) + '"><button class="icon-btn sm" data-cl="delit" aria-label="delete">' + I('x', 'sm') + '</button></div>').join('') +
          '</div><div class="cl-add"><input type="text" data-cl-add dir="auto" placeholder="' + esc(T('+ بند جديد (Enter)', '+ New item (Enter)')) + '"></div>') + '</div>';
      }).join('') : '<div class="cl-empty">' + I('check-c') + '<div>' + esc(T('لسه مفيش قوائم في الخطوة دي', 'No lists in this step yet')) + '</div></div>') +
      '<div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap"><button class="btn sm primary" data-cl="addsec">' + I('plus', 'sm') + '<span>' + esc(T('قسم جديد', 'New section')) + '</span></button>' +
      '<button class="btn sm" data-cl="preset">' + I('flag', 'sm') + '<span>' + esc(T('نظام الأولويات', 'Priority system')) + '</span></button></div></div>';
  };
  draw();
  body.oninput = e => {
    const f = e.target.closest('[data-cf]'); if (!f) return; const sec = tdo(step).sections.find(x => x.id === f.closest('[data-sec]').dataset.sec); if (!sec) return;
    if (f.dataset.cf === 'title') sec.title = f.value; else { const it = sec.items.find(x => x.id === f.closest('[data-it]').dataset.it); if (it) it.text = f.value; }
    clearTimeout(body._t); body._t = setTimeout(save, 300);
  };
  body.onchange = e => {
    const k = e.target.closest('[data-cl=chk]'); if (!k) return; const sec = tdo(step).sections.find(x => x.id === k.closest('[data-sec]').dataset.sec), it = sec && sec.items.find(x => x.id === k.closest('[data-it]').dataset.it);
    if (it) { it.done = k.checked; save(); draw(); }
  };
  body.onkeydown = e => {
    const a = e.target.closest('[data-cl-add]'); if (!a || e.key !== 'Enter') return; e.preventDefault();
    const v = a.value.trim(); if (!v) return; const sec = tdo(step).sections.find(x => x.id === a.closest('[data-sec]').dataset.sec); if (!sec) return;
    sec.items.push(mkItem(v)); save(); draw(); const n = body.querySelector('[data-sec="' + sec.id + '"] [data-cl-add]'); if (n) n.focus();
  };
  body.onclick = async e => {
    const b = e.target.closest('[data-cl]'); if (!b || b.dataset.cl === 'chk') return; const a = b.dataset.cl, sc = b.closest('[data-sec]'), sec = sc && tdo(step).sections.find(x => x.id === sc.dataset.sec);
    if (a === 'addsec') { const v = await MSA.ask({ title: T('قسم جديد', 'New section'), placeholder: T('مثلًا: مهم جدًا', 'e.g. Critical') }); if (!v) return; tdo(step).sections.push(mkSec(v, COLS[tdo(step).sections.length % COLS.length])); save(); draw(); }
    else if (a === 'preset') { const s0 = tdo(step); [[T('مهم جدًا', 'Critical'), COLS[0]], [T('مهم', 'Important'), COLS[1]], [T('لو فاضي / لاحقًا', 'If time allows / later'), COLS[5]]].forEach(x => { if (!s0.sections.some(y => y.title === x[0])) s0.sections.push(mkSec(x[0], x[1])); }); save(); draw(); }
    else if (a === 'fold' && sec) { sec.fold = !sec.fold; ctx.commit(); draw(); }
    else if (a === 'col' && sec) { sec.col = COLS[(COLS.indexOf(sec.col) + 1) % COLS.length]; save(); draw(); }
    else if (a === 'delsec' && sec) { if (sec.items.length && !await MSA.confirm(T('حذف القسم «' + sec.title + '» وبنوده؟', 'Delete the section “' + sec.title + '” and its items?'), { danger: true, okLabel: T('حذف', 'Delete') })) return; tdo(step).sections = tdo(step).sections.filter(x => x !== sec); save(); draw(); }
    else if (a === 'delit' && sec) { sec.items = sec.items.filter(x => x.id !== b.closest('[data-it]').dataset.it); save(); draw(); }
  };
}

/* ================================================================ Word tab */
function docHTMLFromCell(step){
  let h = ''; const n = (step.note || '').trim();
  if (n) h += n.split(/\n+/).map(l => '<p>' + esc(l) + '</p>').join('');
  const t = todo(step); if (t) t.sections.forEach(s => { h += '<h2>' + esc(s.title) + '</h2><ul>' + s.items.map(i => '<li>' + (i.done ? '✓ ' : '') + esc(i.text) + '</li>').join('') + '</ul>'; });
  return h;
}
function docTab(body, step, ctx){
  const d = step.doc || { title: '', html: '' };
  const rtl = !en();
  body.innerHTML = '<div class="cd-wrap"><div class="field" style="margin-bottom:8px"><label class="f">' + esc(T('عنوان المستند', 'Document title')) + '</label><input type="text" class="cd-title" dir="auto" value="' + esc(d.title || P.title(step)) + '"></div>' +
    '<div class="cd-bar"><button data-cd="b" title="Bold"><b>B</b></button><button data-cd="i" title="Italic"><i>I</i></button><button data-cd="u" title="Underline"><u>U</u></button><span class="sep"></span><button data-cd="h1">H1</button><button data-cd="h2">H2</button><button data-cd="p">¶</button><span class="sep"></span><button data-cd="ul">• ' + esc(T('نقاط', 'List')) + '</button><button data-cd="ol">1. ' + esc(T('أرقام', 'Numbers')) + '</button><span class="sep"></span><button data-cd="rtl">' + esc(T('يمين↔يسار', 'RTL ↔ LTR')) + '</button><i class="cgrip inl" data-cg="doc" data-ref="" title="' + esc(T('اسحب المستند على الشبكة', 'Drag the document onto the grid')) + '">' + I('layers', 'xs') + '</i></div>' +
    '<div class="cd-ed" contenteditable="true" dir="auto" spellcheck="true" role="textbox" aria-multiline="true" data-ph="' + esc(T('اكتب هنا…', 'Write here…')) + '"></div>' +
    '<div class="hint cd-cnt"></div><div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn primary sm" data-cd="dl">' + I('download', 'sm') + '<span>' + esc(T('نزّل Word (.docx)', 'Download Word (.docx)')) + '</span></button><button class="btn sm" data-cd="att">' + I('clip', 'sm') + '<span>' + esc(T('احفظ كمرفق', 'Save as attachment')) + '</span></button><button class="btn sm" data-cd="fill">' + I('sparkles', 'sm') + '<span>' + esc(T('املأ من الخلية', 'Fill from cell')) + '</span></button></div></div>';
  const ed = body.querySelector('.cd-ed'), ti = body.querySelector('.cd-title'), cnt = body.querySelector('.cd-cnt');
  ed.innerHTML = U.sanitize ? U.sanitize(d.html || '') : (d.html || '');
  const words = () => { const t = plain(ed.innerHTML); return t ? t.split(/\s+/).length : 0; };
  const sync = (real) => { d.html = ed.innerHTML; d.title = ti.value; if (real) { d.updated = Date.now(); step.doc = d; } cnt.textContent = T(words() + ' كلمة', words() + ' words'); };
  sync(false);
  let tm = null; const later = () => { sync(true); clearTimeout(tm); tm = setTimeout(() => { ctx.commit(); C.refreshCards(ctx, step.id); ctx.refreshTabs && ctx.refreshTabs(); }, 400); };
  ed.addEventListener('input', later); ti.addEventListener('input', later);
  const build = () => MSA.docx.build(d.html, { title: ti.value.trim() || P.title(step), rtl, author: (MSA.state.profile && MSA.state.profile.name) || '' });
  const fname = () => slug(ti.value || P.title(step)) + '.docx';
  body.querySelector('.cd-bar').addEventListener('mousedown', e => { if (e.target.closest('[data-cd]')) e.preventDefault(); });
  body.addEventListener('click', async e => {
    const b = e.target.closest('[data-cd]'); if (!b) return; const a = b.dataset.cd;
    if (['b', 'i', 'u'].includes(a)) { ed.focus(); document.execCommand({ b: 'bold', i: 'italic', u: 'underline' }[a]); later(); }
    else if (a === 'h1' || a === 'h2' || a === 'p') { ed.focus(); document.execCommand('formatBlock', false, a === 'p' ? 'p' : a); later(); }
    else if (a === 'ul') { ed.focus(); document.execCommand('insertUnorderedList'); later(); }
    else if (a === 'ol') { ed.focus(); document.execCommand('insertOrderedList'); later(); }
    else if (a === 'rtl') { ed.dir = ed.dir === 'rtl' ? 'ltr' : 'rtl'; ed.focus(); }
    else if (a === 'fill') { const h = docHTMLFromCell(step); if (!h) { MSA.toast(T('مفيش ملاحظة أو قوائم في الخلية', 'The cell has no note or lists'), 'err'); return; } if (plain(ed.innerHTML) && !await MSA.confirm(T('إضافة محتوى الخلية في آخر المستند؟', 'Append the cell content at the end of the document?'), { okLabel: T('إضافة', 'Append') })) return; ed.innerHTML += h; later(); }
    else if (a === 'dl') { sync(!!step.doc); const bl = build(), l = document.createElement('a'); l.href = URL.createObjectURL(bl); l.download = fname(); document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000); MSA.toast(T('اتنزّل ملف Word', 'Word file downloaded'), 'ok'); }
    else if (a === 'att') {
      sync(!!step.doc); const bl = build(), f = new File([bl], fname(), { type: bl.type }); const old = step.atts.find(x => x.docOf === 'cell');
      try { const att = await MSA.files.put(f); att.docOf = 'cell'; if (old) { await MSA.files.delMany([old.id]); step.atts = step.atts.filter(x => x !== old); } step.atts.push(att); ctx.commit(); MSA.toast(T('اتحفظ المستند كمرفق في الخلية', 'Document saved as an attachment in the cell'), 'ok'); } catch (x) { MSA.toast(T('تعذّر الحفظ', 'Could not save'), 'err'); }
    }
  });
}

/* ================================================================ grid frames ("cards") */
const SIZE = { att: [200, 150], note: [230, 140], todo: [250, 190], doc: [220, 120] };
const cardsOf = p => (p.graph && p.graph.cards) || [];
C.bounds = p => cardsOf(p).map(c => [c.x + c.w, c.y + c.h]);
C.prune = (p, g) => {
  const list = g.cards = g.cards || []; const keep = list.filter(c => {
    const r = P.find(p.steps, c.s); if (!r) return false; const s = r.step;
    if (c.k === 'att') return s.atts.some(a => a.id === c.ref);
    if (c.k === 'todo') return !!todo(s) && (!c.ref || todo(s).sections.some(x => x.id === c.ref));
    if (c.k === 'doc') return !!s.doc;
    return true;
  });
  if (keep.length !== list.length) { g.cards = keep; return true; } return false;
};
function cardBody(p, c){
  const r = P.find(p.steps, c.s); if (!r) return ''; const s = r.step;
  if (c.k === 'att') { const a = s.atts.find(x => x.id === c.ref); return a ? MSA.attHTML(a, false) : ''; }
  if (c.k === 'note') return '<div class="mc-note" dir="auto">' + esc(s.note || '') + '</div>';
  if (c.k === 'doc') { const d = s.doc || {}; return '<div class="mc-doc">' + I('doc') + '<b dir="auto">' + esc(d.title || P.title(s)) + '</b><span dir="auto">' + esc(plain(d.html).slice(0, 120)) + '</span></div>'; }
  const t = todo(s); if (!t) return '';
  const secs = c.ref ? t.sections.filter(x => x.id === c.ref) : t.sections;
  return '<div class="mc-todo">' + secs.map(sec => '<div class="mc-sec" style="--sc:' + sec.col + '"><b dir="auto">' + esc(sec.title) + ' <em>' + sec.items.filter(i => i.done).length + '/' + sec.items.length + '</em></b>' + sec.items.map(i => '<label class="' + (i.done ? 'dn' : '') + '"><input type="checkbox" class="cb" data-ctg="' + sec.id + ':' + i.id + '"' + (i.done ? ' checked' : '') + '><span dir="auto">' + esc(i.text) + '</span></label>').join('') + '</div>').join('') + '</div>';
}
const KIC = { att: 'clip', note: 'note', todo: 'check-c', doc: 'doc' };
function cardHTML(p, c, editing){
  const r = P.find(p.steps, c.s); if (!r) return '';
  return '<div class="mcard k-' + c.k + (editing ? ' ed' : '') + '" data-card="' + c.id + '" style="left:' + c.x + 'px;top:' + c.y + 'px;width:' + c.w + 'px;height:' + c.h + 'px"><div class="mc-h">' + I(KIC[c.k] || 'doc', 'xs') + '<span dir="auto">' + esc(P.title(r.step)) + '</span>' + (editing ? '<button class="cdel" data-cdel="' + c.id + '" aria-label="delete">' + I('x', 'xs') + '</button>' : '') + '</div><div class="mc-b">' + cardBody(p, c) + '</div>' + (editing ? '<i class="crz" data-crz></i>' : '') + '</div>';
}
C.cardsHTML = (p, L, editing) => cardsOf(p).map(c => cardHTML(p, c, editing)).join('');
C.refreshCards = (ctx, stepId) => {
  cardsOf(ctx.p).filter(c => c.s === stepId).forEach(c => { const el = ctx.world.querySelector('[data-card="' + c.id + '"] .mc-b'); if (el) { el.innerHTML = cardBody(ctx.p, c); MSA.hydrateAtts(el); } });
};
const kindLabel = { att: ['صورة / ملف', 'File'], note: ['ملاحظة', 'Note'], todo: ['To-do', 'To-do'], doc: ['مستند Word', 'Word doc'] };
C.addCard = (ctx, k, stepId, ref, x, y) => {
  const g = ctx.p.graph; g.cards = g.cards || []; const sz = (SIZE[k] || [200, 140]).slice();
  if (k === 'doc') { const r0 = P.find(ctx.p.steps, stepId); if (r0 && !r0.step.doc) r0.step.doc = { title: '', html: '' }; }
  if (k === 'todo') { const s = P.find(ctx.p.steps, stepId); const t = s && todo(s.step); if (t) { const n = ref ? 1 : t.sections.length, items = (ref ? t.sections.filter(z => z.id === ref) : t.sections).reduce((a, z) => a + 1 + z.items.length, 0); sz[1] = Math.max(120, Math.min(380, 44 + items * 26)); } }
  let cx = Math.max(20, snap(x - sz[0] / 2)), cy = Math.max(20, snap(y - 20));
  while (g.cards.some(c => Math.abs(c.x - cx) < 20 && Math.abs(c.y - cy) < 20)) { cx += 30; cy += 30; }
  const c = { id: U.uid('cd'), k, s: stepId, ref: ref || '', x: cx, y: cy, w: sz[0], h: sz[1] };
  g.cards.push(c); ctx.commit(); ctx.redo(); return c;
};

/* ---------- wiring on the map: panel tabs, drag from panel to grid, move / resize / delete frames ---------- */
C.wireMap = ctx => {
  const { el, world, det, p } = ctx;
  /* tabs */
  det.addEventListener('click', e => { const b = e.target.closest('[data-ct]'); if (!b) return; MSA.state.ui.celTab = b.dataset.ct; MSA.save(); ctx.showDet(); });
  /* drag handles */
  let ghost = null, gd = null;
  const hit = e => { const rc = el.getBoundingClientRect(), dr = det.hidden ? null : det.getBoundingClientRect(); const inMap = e.clientX >= rc.left && e.clientX <= rc.right && e.clientY >= rc.top && e.clientY <= rc.bottom; const inDet = dr && e.clientX >= dr.left && e.clientX <= dr.right && e.clientY >= dr.top && e.clientY <= dr.bottom; return inMap && !inDet; };
  det.addEventListener('pointerdown', e => {
    const g = e.target.closest('.cgrip'); if (!g) return; e.preventDefault(); e.stopPropagation();
    const sid = (ctx.sel && ctx.sel()) || null; if (!sid) return;
    gd = { k: g.dataset.cg, ref: g.dataset.ref, sid, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId };
    try { g.setPointerCapture(e.pointerId); } catch (x) {}
  });
  det.addEventListener('pointermove', e => {
    if (!gd || e.pointerId !== gd.id) return;
    if (!gd.moved && Math.hypot(e.clientX - gd.x0, e.clientY - gd.y0) > 6) { gd.moved = true; ghost = document.createElement('div'); ghost.className = 'cghost'; ghost.innerHTML = I(KIC[gd.k] || 'doc', 'sm') + '<span>' + esc(T(kindLabel[gd.k][0], kindLabel[gd.k][1])) + '</span>'; document.body.appendChild(ghost); }
    if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; el.classList.toggle('dropok', hit(e)); }
  });
  const end = e => {
    if (!gd || e.pointerId !== gd.id) return; const d = gd; gd = null; if (ghost) { ghost.remove(); ghost = null; } el.classList.remove('dropok');
    if (d.moved) { if (hit(e)) { const w = ctx.toWorld(e); C.addCard(ctx, d.k, d.sid, d.ref, w.x, w.y); MSA.toast(T('اتضاف فريم على الشبكة', 'Frame added to the grid'), 'ok', 1800); } }
    else { const dm = ctx.dims(), v = ctx.view(); C.addCard(ctx, d.k, d.sid, d.ref, (dm.w / 2 - v.x) / v.k, (dm.h / 2 - v.y) / v.k); MSA.toast(T('اتضاف فريم على الشبكة (اسحب المقبض لتحديد مكانه)', 'Frame added to the grid (drag the handle to choose its place)'), 'ok', 2600); }
  };
  det.addEventListener('pointerup', end); det.addEventListener('pointercancel', end);
  /* frames: toggle to-do boxes, delete, open the cell */
  world.addEventListener('click', e => {
    const cb = e.target.closest('[data-ctg]'); if (cb) { const [sid, iid] = cb.dataset.ctg.split(':'), card = cb.closest('[data-card]'), c = cardsOf(p).find(x => x.id === card.dataset.card), r = c && P.find(p.steps, c.s), t = r && todo(r.step); const it = t && t.sections.flatMap(s => s.items).find(i => i.id === iid); if (it) { it.done = cb.checked; ctx.commit(); C.refreshCards(ctx, c.s); ctx.refreshBadge && ctx.refreshBadge(r.step); } return; }
    const dl = e.target.closest('[data-cdel]'); if (dl) { const g = p.graph; g.cards = (g.cards || []).filter(c => c.id !== dl.dataset.cdel); ctx.commit(); ctx.redo(); return; }
    const card = e.target.closest('.mcard'); if (card && !ctx.editing() && !e.target.closest('.att')) { const c = cardsOf(p).find(x => x.id === card.dataset.card); if (c) { MSA.state.ui.celTab = c.k === 'todo' ? 'todo' : c.k === 'doc' ? 'doc' : 'props'; ctx.open(c.s); } }
  });
  /* move / resize in edit mode */
  el.addEventListener('pointerdown', e => {
    if (!ctx.editing()) return; const card = e.target.closest('.mcard'); if (!card || !el.contains(card) || e.target.closest('.cdel')) return;
    const c = cardsOf(p).find(x => x.id === card.dataset.card); if (!c) return; e.stopImmediatePropagation(); e.preventDefault();
    const rz = !!e.target.closest('[data-crz]'), w0 = ctx.toWorld(e), o = { x: c.x, y: c.y, w: c.w, h: c.h }; try { card.setPointerCapture(e.pointerId); } catch (x) {}
    const mv = ev => { const w = ctx.toWorld(ev); if (rz) { c.w = Math.max(120, Math.min(560, snap(o.w + w.x - w0.x))); c.h = Math.max(70, Math.min(480, snap(o.h + w.y - w0.y))); card.style.width = c.w + 'px'; card.style.height = c.h + 'px'; } else { c.x = Math.max(10, snap(o.x + w.x - w0.x)); c.y = Math.max(10, snap(o.y + w.y - w0.y)); card.style.left = c.x + 'px'; card.style.top = c.y + 'px'; } };
    const up = () => { card.removeEventListener('pointermove', mv); card.removeEventListener('pointerup', up); card.removeEventListener('pointercancel', up); ctx.commit(); };
    card.addEventListener('pointermove', mv); card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
  }, true);
};
})();
