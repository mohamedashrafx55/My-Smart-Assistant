/* Daily routine as real, editable tasks + schedule-conflict warnings.
   - S().routine = { blocks:[{id,title,from,to}], gen:{ 'blockId|YYYY-MM-DD':1 } }
   - Every block becomes a normal task (tag «روتين») for today and the next days, so it can be edited, ticked, given details/sub-tasks like any task.
   - MSA.sched.conflicts(task) finds timed open tasks that overlap it (same day). */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$, T = (a, e) => MSA.T(a, e), esc = U.esc;
const S = () => MSA.state, sched = MSA.sched = {};
const TAG = 'روتين';
const DEFAULT = [
  ['راحة، استحمام، أكل', '17:30', '18:30'],
  ['وقت الأسرة', '18:30', '20:00', 'عشا وقعدة من غير موبايل'],
  ['تعلم وتطبيق', '20:00', '21:30', 'كورس جرافيك أو مونتاج'],
  ['ألعاب', '21:30', '23:00', 'ساعة ونص'],
  ['تجهيز شنطتك وهدومك لبكرة', '23:00', '23:15'],
  ['محادثة مع زوجتك', '23:15', '23:30'],
  ['نوم', '23:30', '23:30']
];
const dk = d => U.dateKey(d);
const NAME = 'الروتين اليومي';
const R = () => { const s = S(); if (!s.routine) { s.routine = { blocks: DEFAULT.map((d, i) => ({ id: 'rbd' + (i + 1), title: d[0], from: d[1], to: d[2], note: d[3] || '' })), gen: {} }; } s.routine.gen = s.routine.gen || {}; s.routine.blocks = s.routine.blocks || []; return s.routine; };
const toMin = v => { const m = /^(\d\d):(\d\d)$/.exec(v || ''); return m ? +m[1] * 60 + +m[2] : null; };
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return dk(d); };
/* the routine is a repeating template, not a daily task: ONE editable task per block (deterministic id so two devices never duplicate it) */
const mk = (b, k) => { const x = MSA.tasksApi.blank({ title: b.title, desc: b.note ? '<p>' + esc(b.note) + '</p>' : '', start: k + 'T' + b.from, due: k + 'T' + (b.to || b.from), tags: [TAG], priority: 'normal' }); x.routine = b.id; x.rday = k; x.id = 'rt_' + b.id; return x; };
sched.name = () => { const n = (R().name || '').trim(); return n || T(NAME, 'Daily routine'); };
sched.list = () => { const ids = R().blocks.map(b => b.id); return (S().tasks || []).filter(x => x.routine && ids.includes(x.routine)).sort((a, b) => String(a.start || a.due) < String(b.start || b.due) ? -1 : 1); };
const clock = x => { const m = /T(\d\d:\d\d)/.exec(x.start || ''), d = /T(\d\d:\d\d)/.exec(x.due || ''); return { from: m ? m[1] : (d ? d[1] : ''), to: d ? d[1] : (m ? m[1] : '') }; };
const dayOf = (x, k) => { const c = clock(x); x.rday = k; x.start = c.from ? k + 'T' + c.from : ''; x.due = c.to ? k + 'T' + c.to : (c.from ? k + 'T' + c.from : ''); };
sched.ensure = function(){
  if (!MSA.tasksApi) return;
  const r = R(); if (r.off) return; const today = dk(new Date()), tm = tomorrow();
  if (!S().tasks) S().tasks = [];
  let tasks = S().tasks;
  if (!r.v2) {   /* one-time: wipe every scheduled routine day, keep ONE copy dated tomorrow to edit */
    const keep = {}; tasks.forEach(x => { if (x.routine && x.rday === tm && !keep[x.routine]) keep[x.routine] = x; });
    tasks = S().tasks = tasks.filter(x => !x.routine);
    r.blocks.forEach(b => { const x = keep[b.id] || mk(b, tm); x.id = 'rt_' + b.id; x.status = 'todo'; delete x.completedAt; dayOf(x, tm); x.updated = Date.now(); tasks.push(x); });
    r.gen = {}; r.v2 = 1;
  }
  /* self-healing: only the canonical one-per-block task may exist (also drops old-format copies that a sync could bring back) */
  const seen = {}, ids = new Set(r.blocks.map(b => b.id));
  const clean = tasks.filter(x => { if (!x.routine) return true; if (!ids.has(x.routine) || x.id !== 'rt_' + x.routine || seen[x.routine]) return false; seen[x.routine] = 1; return true; });
  if (clean.length !== tasks.length) tasks = S().tasks = clean;
  r.blocks.forEach(b => { if (!seen[b.id]) { tasks.push(mk(b, today)); } });
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  tasks.forEach(x => {   /* a new day: the repeating routine comes back un-ticked and dated today */
    if (!x.routine) return;
    if (x.rday && x.rday < today) { x.status = 'todo'; delete x.completedAt; (x.checklist || []).forEach(c => c.done = false); dayOf(x, today); }
    else if (x.status === 'done' && x.completedAt && x.completedAt < t0.getTime()) { x.status = 'todo'; delete x.completedAt; (x.checklist || []).forEach(c => c.done = false); }
  });
  /* deliberately no MSA.save(): deterministic ids + same state object, so every device converges and it is saved with the next normal save */
};
/* ---------- conflicts ---------- */
const span = x => {
  if (!x || x.type !== 'task' || !x.due) return null;
  const m = /^(\d{4}-\d\d-\d\d)T(\d\d):(\d\d)/.exec(x.due); if (!m || (m[2] === '23' && m[3] === '59')) return null;
  const e = +m[2] * 60 + +m[3]; let s = e;
  const a = /^(\d{4}-\d\d-\d\d)T(\d\d):(\d\d)/.exec(x.start || ''); if (a && a[1] === m[1]) { const v = +a[2] * 60 + +a[3]; if (v < e) s = v; }
  return { day: m[1], s, e };
};
const hm = v => U.pad(Math.floor(v / 60)) + ':' + U.pad(v % 60);
const clash = (a, b) => a.day === b.day && ((a.s < b.e && b.s < a.e) || (a.s === a.e && b.s <= a.s && a.s < b.e) || (b.s === b.e && a.s <= b.s && b.s < a.e) || (a.s === a.e && b.s === b.e && a.s === b.s));
sched.label = x => { const p = span(x); return '«' + (x.title || T('بدون عنوان', 'Untitled')) + '»' + (p ? ' (' + hm(p.s) + (p.e > p.s ? '–' + hm(p.e) : '') + ')' : ''); };
const spanOn = (y, day) => { const p = span(y); if (p && y.routine) p.day = day; return p; };   /* a routine item repeats every day, so it occupies its clock slot on any day */
sched.conflicts = function(x){
  const a = span(x); if (!a || x.status === 'done') return [];
  return (S().tasks || []).filter(y => y.id !== x.id && y.type === 'task' && y.status !== 'done').filter(y => { const b = spanOn(y, a.day); return b && clash(a, b); });
};
sched.dayConflicts = function(k){
  const today = dk(new Date());
  const l = (S().tasks || []).filter(y => y.type === 'task' && (y.routine ? (y.status !== 'done' || k !== today) : y.status !== 'done') && span(y) && (y.routine || span(y).day === k)).map(y => ({ y, p: spanOn(y, k) })), out = [];
  for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) if (clash(l[i].p, l[j].p)) out.push([l[i].y, l[j].y]);
  return out;
};
sched.inConflict = x => sched.conflicts(x).length > 0;
sched.range = x => { const p = span(x); return p && p.e > p.s ? hm(p.s) + '–' + hm(p.e) : ''; };
/* ask before saving a clashing task; resolves true to go on */
sched.confirmSave = async function(x){
  const c = sched.conflicts(x); if (!c.length) return true;
  return MSA.confirm(T('⚠ تعارض مواعيد!\n' + sched.label(x) + ' بيتعارض مع:\n' + c.map(sched.label).join('\n') + '\n\nتحفظها برضه؟', '⚠ Schedule clash!\n' + sched.label(x) + ' overlaps with:\n' + c.map(sched.label).join('\n') + '\n\nSave anyway?'), { okLabel: T('احفظ برضه', 'Save anyway') });
};
/* ---------- routine manager ---------- */
sched.manage = function(done){
  const r = R(), rows = r.blocks.map(b => Object.assign({}, b));
  const m = MSA.modal({ title: T('الروتين اليومي', 'Daily routine'), size: 'wide',
    body: '<label class="lbl">' + esc(T('اسم التبويب', 'Tab name')) + '</label><input type="text" id="rtName" maxlength="40" dir="auto" value="' + esc(R().name || '') + '" placeholder="' + esc(T(NAME, 'Daily routine')) + '" style="margin-bottom:10px"><div class="hint" style="margin-bottom:10px">' + esc(T('الروتين بيتكرر كل يوم من نفسه، وبيظهر في تبويب لوحده جوه الجدول الأسبوعي (مش مع مهام اليوم). كل بند ليه نسخة واحدة بس تقدر تعدّلها وتضيف لها تفاصيل.', 'The routine repeats on its own every day and lives in its own tab inside the weekly table (not with the day tasks). Each item has just one copy you can edit.')) + '</div><div id="rtRows"></div>' +
      '<button class="btn sm" id="rtAdd" style="margin-top:8px">' + I('plus', 'sm') + esc(T('إضافة بند', 'Add item')) + '</button><div id="rtWarn" class="wk-conf" hidden></div>',
    buttons: [{ label: R().off ? T('تشغيل الروتين', 'Turn routine on') : T('إيقاف الروتين', 'Turn routine off'), cls: 'ghost', onClick: async a => { const r = R(); if (r.off) { r.off = false; sched.ensure(); } else { if (!await MSA.confirm(T('إيقاف الروتين؟ هيتمسح من الجدول (البنود نفسها بتفضل محفوظة وتقدر ترجّعه).', 'Turn the routine off? It is removed from the table (the items stay saved, you can turn it back on).'), { danger: true, okLabel: T('إيقاف', 'Turn off') })) return; r.off = true; S().tasks = (S().tasks || []).filter(x => !x.routine); } MSA.save(); MSA.updateCounts && MSA.updateCounts(); a.close(); done && done(); } },
      { label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('حفظ', 'Save'), cls: 'primary', onClick: async a => { if (await apply(rows, a, (document.getElementById('rtName') || {}).value)) { a.close(); done && done(); } } }],
    onMount: el => { const draw = () => {
        $('#rtRows', el).innerHTML = rows.map((b, i) => '<div class="rt-row" data-i="' + i + '"><input type="time" data-f="from" value="' + esc(b.from) + '"><span>–</span><input type="time" data-f="to" value="' + esc(b.to) + '"><input type="text" data-f="title" dir="auto" value="' + esc(b.title) + '" placeholder="' + esc(T('النشاط', 'Activity')) + '"><button class="icon-btn sm" data-del aria-label="delete">' + I('trash', 'sm') + '</button></div>').join('');
        warn(); };
      const warn = () => { const w = $('#rtWarn', el), p = []; rows.forEach((a, i) => rows.forEach((b, j) => { if (j <= i) return; const A = [toMin(a.from), toMin(a.to)], B = [toMin(b.from), toMin(b.to)]; if (A[0] == null || B[0] == null) return; const ae = A[1] == null ? A[0] : A[1], be = B[1] == null ? B[0] : B[1]; if (A[0] < be && B[0] < ae) p.push(a.title + ' ↔ ' + b.title); })); w.hidden = !p.length; w.textContent = p.length ? '⚠ ' + T('تعارض بين: ', 'Overlap: ') + p.join(' | ') : ''; };
      el.addEventListener('input', e => { const row = e.target.closest('[data-i]'); if (!row || !e.target.dataset.f) return; rows[+row.dataset.i][e.target.dataset.f] = e.target.value; warn(); });
      el.addEventListener('click', e => { if (e.target.closest('#rtAdd')) { rows.push({ id: U.uid('rb'), title: '', from: '', to: '' }); draw(); return; } const d = e.target.closest('[data-del]'); if (d) { rows.splice(+d.closest('[data-i]').dataset.i, 1); draw(); } });
      draw(); } });
};
async function apply(rows, a, name){
  const clean = rows.filter(b => b.title.trim() || b.from);
  for (const b of clean) { if (!b.title.trim() || toMin(b.from) == null) { MSA.toast(T('كل بند محتاج عنوان ووقت بداية', 'Each item needs a title and start time'), 'err'); return false; } if (toMin(b.to) == null || toMin(b.to) < toMin(b.from)) b.to = b.from; }
  const r = R(), today = dk(new Date()), ids = new Set(clean.map(b => b.id));
  S().tasks = (S().tasks || []).filter(x => !(x.routine && !ids.has(x.routine)));
  clean.forEach(b => { b.title = b.title.trim();
    (S().tasks || []).forEach(x => { if (x.routine === b.id) { x.title = b.title; const k = x.rday || today; x.start = k + 'T' + b.from; x.due = k + 'T' + b.to; x.updated = Date.now(); } }); });
  r.blocks = clean.map(b => ({ id: b.id, title: b.title, from: b.from, to: b.to, note: b.note || '' }));
  if (typeof name === 'string') r.name = name.trim().slice(0, 40);
  sched.ensure(); MSA.save(); MSA.updateCounts && MSA.updateCounts(); MSA.toast(T('اتحفظ الروتين ✔', 'Routine saved ✔'), 'ok'); return true;
}
})();
