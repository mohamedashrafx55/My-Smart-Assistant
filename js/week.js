/* Home: weekly to-do board (next to Payments) + daily "what do I have today" alert.
   It works on the same tasks as the Tasks section (priority, time, reminders, repeat, checklist, tags, attachments), so nothing is duplicated. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc;
const S = () => MSA.state, plus = MSA.plus = MSA.plus || {};
const ar = () => S().settings.lang !== 'en';
const loc = () => ar() ? 'ar-u-nu-latn' : 'en-GB';
const API = () => MSA.tasksApi;

/* ---------- date helpers ---------- */
const dk = d => U.dateKey(d);
const todayKey = () => dk(new Date());
const parseKey = k => new Date(k + 'T00:00');
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()), sd = ar() ? 6 : 1; x.setDate(x.getDate() - ((x.getDay() - sd + 7) % 7)); return x; };
const fmt = (d, o) => new Intl.DateTimeFormat(loc(), o).format(d);

/* ---------- task helpers ---------- */
const all = () => (S().tasks || []).filter(x => x.type === 'task');
const keyOf = x => x.due ? String(x.due).slice(0, 10) : '';
const isDone = x => x.status === 'done';
const timeOf = x => { const m = String(x.due || '').match(/T(\d\d):(\d\d)/); return m && !(m[1] === '23' && m[2] === '59') ? m[1] + ':' + m[2] : ''; };
const PR = { urgent: 0, high: 1, normal: 2, low: 3 };
const sorter = (a, b) => (isDone(a) - isDone(b)) || ((timeOf(a) || '99') < (timeOf(b) || '99') ? -1 : (timeOf(a) || '99') > (timeOf(b) || '99') ? 1 : 0) || (PR[a.priority] - PR[b.priority]) || ((a.created || 0) - (b.created || 0));
const overdue = () => all().filter(x => !isDone(x) && keyOf(x) && keyOf(x) < todayKey()).sort((a, b) => keyOf(a) < keyOf(b) ? -1 : 1);
const undated = () => all().filter(x => !isDone(x) && !keyOf(x)).sort(sorter);
const onDay = k => all().filter(x => keyOf(x) === k).sort(sorter);
function setDay(x, k){ x.due = k + 'T' + (timeOf(x) || '23:59'); x.notified = false; x.updated = Date.now(); }
const wk = () => { const u = S().ui; u.wk = u.wk || {}; return u.wk; };

/* ---------- state of the widget ---------- */
let weekStart = null, selKey = null, wEl = null;
function ensure(){
  if (!weekStart) weekStart = startOfWeek(new Date());
  if (!selKey) selKey = todayKey();
}
const mode = () => wk().mode === 'week' ? 'week' : 'day';
const persist = () => { MSA.save(); MSA.updateCounts && MSA.updateCounts(); };

/* ---------- rows ---------- */
function rowHTML(x, o){
  o = o || {};
  const t = timeOf(x), cl = x.checklist || [], d = keyOf(x);
  const meta = [];
  if (x.priority && x.priority !== 'normal') meta.push('<span class="pri-' + x.priority + '" title="' + esc(MSA.t('prio.' + x.priority)) + '">' + I('flag', 'sm') + '</span>');
  if (t) meta.push('<span class="pill">' + I('clock', 'sm') + esc(t) + '</span>');
  if (o.date && d) meta.push('<span class="pill over">' + esc(fmt(parseKey(d), { day: 'numeric', month: 'short' })) + '</span>');
  if (cl.length) meta.push('<span class="pill">' + I('checks', 'sm') + cl.filter(i => i.done).length + '/' + cl.length + '</span>');
  if (x.repeat) meta.push('<span class="pill">' + I('repeat', 'sm') + '</span>');
  if (x.remind) meta.push('<span class="pill">' + I('bell', 'sm') + '</span>');
  if (x.atts && x.atts.length) meta.push('<span class="pill">' + I('clip', 'sm') + x.atts.length + '</span>');
  (x.tags || []).slice(0, 2).forEach(g => meta.push('<span class="pill">#' + esc(g) + '</span>'));
  return '<div class="wk-t p-' + esc(x.priority || 'normal') + (isDone(x) ? ' done' : '') + '" draggable="true" data-id="' + esc(x.id) + '">' +
    '<input type="checkbox" class="cb" data-wk="done" ' + (isDone(x) ? 'checked' : '') + ' aria-label="' + esc(T('تم', 'Done')) + '">' +
    '<div class="wk-b" data-wk="edit" role="button" tabindex="0"><span class="wk-ti" dir="auto">' + esc(x.title || T('بدون عنوان', 'Untitled')) + '</span>' + (meta.length ? '<span class="wk-m">' + meta.join('') + '</span>' : '') + '</div>' +
    '<button class="icon-btn sm" data-wk="more" aria-label="' + esc(T('المزيد', 'More')) + '">' + I('more', 'sm') + '</button></div>';
}
const secHTML = (title, cls, rows, extra) => '<div class="wk-sec ' + (cls || '') + '"><div class="wk-sh"><b>' + esc(title) + '</b><span class="wk-n">' + rows.length + '</span>' + (extra || '') + '</div>' + rows.join('') + '</div>';

/* ---------- widget ---------- */
function widgetHTML(){
  ensure();
  const tk = todayKey(), days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), keys = days.map(dk);
  const wkAll = keys.flatMap(onDay), done = wkAll.filter(isDone).length, tot = wkAll.length, pct = tot ? Math.round(done * 100 / tot) : 0;
  const range = fmt(days[0], { day: 'numeric', month: 'short' }) + ' – ' + fmt(days[6], { day: 'numeric', month: 'short' });
  const hideDone = wk().hideDone === true, m = mode();
  const chips = days.map((d, i) => { const k = keys[i], open = onDay(k).filter(x => !isDone(x)).length;
    return '<button class="wk-d' + (k === selKey ? ' sel' : '') + (k === tk ? ' today' : '') + '" data-wk="day" data-k="' + k + '"><span class="wk-dw">' + esc(fmt(d, { weekday: 'short' })) + '</span><span class="wk-dn">' + d.getDate() + '</span><span class="wk-dc">' + (open ? open : '') + '</span></button>'; }).join('');
  const od = overdue();
  let body = '';
  if (od.length) body += secHTML(T('متأخرة', 'Overdue'), 'bad', od.map(x => rowHTML(x, { date: true })), '<button class="btn sm ghost" data-wk="odtoday">' + esc(T('انقلها لليوم', 'Move to today')) + '</button>');
  const vis = l => hideDone ? l.filter(x => !isDone(x)) : l;
  if (m === 'day') {
    const l = vis(onDay(selKey));
    body += '<div class="wk-sec"><div class="wk-sh"><b>' + esc(selKey === tk ? T('النهارده', 'Today') : fmt(parseKey(selKey), { weekday: 'long', day: 'numeric', month: 'long' })) + '</b><span class="wk-n">' + l.length + '</span></div>' +
      (l.length ? l.map(x => rowHTML(x)).join('') : '<div class="wk-empty">' + esc(T('مفيش مهام لليوم ده — اكتب أول مهمة فوق ✨', 'Nothing planned for this day — add the first task above ✨')) + '</div>') + '</div>';
    if (selKey === tk) { const u = undated(); if (u.length) body += secHTML(T('بدون تاريخ', 'No date'), '', u.map(x => rowHTML(x))); }
  } else {
    keys.forEach((k, i) => { const l = vis(onDay(k)); body += '<div class="wk-sec' + (k === tk ? ' now' : '') + '"><div class="wk-sh"><b>' + esc(fmt(days[i], { weekday: 'long', day: 'numeric', month: 'short' })) + (k === tk ? ' · ' + esc(T('النهارده', 'Today')) : '') + '</b><span class="wk-n">' + l.length + '</span><button class="icon-btn sm" data-wk="addday" data-k="' + k + '" aria-label="+">' + I('plus', 'sm') + '</button></div>' + (l.length ? l.map(x => rowHTML(x)).join('') : '') + '</div>'; });
    const u = undated(); if (u.length) body += secHTML(T('بدون تاريخ', 'No date'), '', u.map(x => rowHTML(x)));
  }
  const dailyOn = daily().on;
  return '<div class="wk-head"><div class="wk-ttl">' + I('checks', 'sm') + '<h3>' + esc(T('جدول المهام الأسبوعي', 'Weekly to-do')) + '</h3></div>' +
    '<div class="wk-nav"><button class="icon-btn sm" data-wk="prev" aria-label="prev">' + I('chev-r', 'sm flip') + '</button><button class="btn sm" data-wk="thisweek">' + esc(range) + '</button><button class="icon-btn sm" data-wk="next" aria-label="next">' + I('chev-l', 'sm flip') + '</button></div></div>' +
    '<div class="wk-bar"><i style="width:' + pct + '%"></i></div><div class="wk-sub"><span>' + esc(T(done + ' من ' + tot + ' اتعملت', done + ' of ' + tot + ' done')) + '</span><span class="wk-tools">' +
      '<div class="seg" role="group"><button data-wk="mode" data-m="day" class="' + (m === 'day' ? 'on' : '') + '">' + esc(T('يوم', 'Day')) + '</button><button data-wk="mode" data-m="week" class="' + (m === 'week' ? 'on' : '') + '">' + esc(T('أسبوع', 'Week')) + '</button></div>' +
      '<button class="icon-btn sm' + (hideDone ? ' on' : '') + '" data-wk="hidedone" title="' + esc(T('إخفاء المكتملة', 'Hide completed')) + '" aria-label="hide done">' + I(hideDone ? 'eye-off' : 'eye', 'sm') + '</button>' +
      '<button class="icon-btn sm' + (dailyOn ? ' on' : '') + '" data-wk="alert" title="' + esc(T('التنبيه اليومي', 'Daily alert')) + '" aria-label="alert">' + I('bell', 'sm') + '</button></span></div>' +
    '<div class="wk-days">' + chips + '</div>' +
    '<div class="wk-add"><input id="wkIn" dir="auto" maxlength="200" placeholder="' + esc(T('أضف مهمة لـ ' + (selKey === tk ? 'النهارده' : fmt(parseKey(selKey), { weekday: 'long' })) + '…', 'Add a task for ' + (selKey === tk ? 'today' : fmt(parseKey(selKey), { weekday: 'long' })) + '…')) + '"><input id="wkTm" type="time" aria-label="' + esc(T('الوقت (اختياري)', 'Time (optional)')) + '"><button class="btn sm primary" data-wk="add">' + I('plus', 'sm') + '</button><button class="btn sm" data-wk="full" title="' + esc(T('تفاصيل كاملة (أولوية، تذكير، تكرار…)', 'Full details (priority, reminder, repeat…)')) + '">' + I('pencil', 'sm') + '</button></div>' +
    '<div class="wk-list">' + body + '</div>' +
    '<div class="wk-foot"><button class="btn sm ghost" data-wk="clear">' + I('trash', 'sm') + esc(T('مسح المكتملة', 'Clear completed')) + '</button><button class="btn sm ghost" data-wk="all">' + esc(T('كل المهام والملاحظات', 'All tasks & notes')) + I('chev-l', 'sm flip') + '</button></div>';
}
function redraw(){ if (!wEl || !document.body.contains(wEl)) return; const f = document.activeElement, keep = f && f.id === 'wkIn' ? f.value : null, tm = $('#wkTm', wEl) ? $('#wkTm', wEl).value : ''; wEl.innerHTML = widgetHTML(); const i = $('#wkIn', wEl); if (keep !== null) { i.value = keep; i.focus(); } if (tm && $('#wkTm', wEl)) $('#wkTm', wEl).value = tm; }
const byId = id => S().tasks.find(x => x.id === id);

function addTask(title, k, time){
  title = (title || '').trim(); if (!title) return false;
  S().tasks.unshift(API().blank({ title: title.slice(0, 200), due: k + 'T' + (time || '23:59') }));
  persist(); return true;
}
function rowMenu(x, ev){
  const tk = todayKey(), tomorrow = dk(addDays(new Date(), 1));
  const mv = (k, msg) => () => { setDay(x, k); persist(); redraw(); MSA.toast(msg, 'ok'); };
  const items = [
    { label: T('تعديل كامل', 'Edit'), icon: 'pencil', onClick: () => MSA.openTaskEditor(x) },
    '-',
    { label: T('انقلها لليوم', 'Move to today'), icon: 'calendar', onClick: mv(tk, T('اتنقلت لليوم', 'Moved to today')) },
    { label: T('انقلها لبكرة', 'Move to tomorrow'), icon: 'arrow-l', onClick: mv(tomorrow, T('اتنقلت لبكرة', 'Moved to tomorrow')) },
    { label: T('انقلها بعد أسبوع', 'Move a week later'), icon: 'repeat', onClick: () => { const b = keyOf(x) ? parseKey(keyOf(x)) : new Date(); setDay(x, dk(addDays(b, 7))); persist(); redraw(); MSA.toast(T('اتنقلت بعد أسبوع', 'Moved a week later'), 'ok'); } },
    { label: x.priority === 'urgent' ? T('أولوية عادية', 'Normal priority') : T('اجعلها عاجلة', 'Mark urgent'), icon: 'flag', onClick: () => { x.priority = x.priority === 'urgent' ? 'normal' : 'urgent'; x.updated = Date.now(); persist(); redraw(); } },
    { label: T('نسخة منها لبكرة', 'Duplicate for tomorrow'), icon: 'copy', onClick: () => { const c = JSON.parse(JSON.stringify(x)); c.id = U.uid('t'); c.status = 'todo'; delete c.completedAt; c.notified = false; c.created = c.updated = Date.now(); c.atts = []; (c.checklist || []).forEach(i => { i.id = U.uid('c'); i.done = false; }); setDay(c, tomorrow); S().tasks.unshift(c); persist(); redraw(); MSA.toast(T('اتعمل نسخة لبكرة', 'Duplicated for tomorrow'), 'ok'); } },
    '-',
    { label: T('حذف', 'Delete'), icon: 'trash', danger: true, onClick: async () => { if (await MSA.confirm(T('حذف «' + (x.title || '') + '»؟', 'Delete “' + (x.title || '') + '”?'), { danger: true, okLabel: T('حذف', 'Delete') })) { try { await MSA.files.delMany(x.atts); } catch (e) {} S().tasks = S().tasks.filter(y => y.id !== x.id); persist(); redraw(); } } }
  ];
  MSA.ctx(ev.clientX, ev.clientY, items);
}
function wire(el){
  el.onclick = async e => {
    const b = e.target.closest('[data-wk]'); if (!b) return; const a = b.dataset.wk, row = b.closest('[data-id]'), x = row ? byId(row.dataset.id) : null;
    if (a === 'done') { if (x) { API().setDone(x, b.checked); persist(); redraw(); } return; }
    if (a === 'edit') { if (x) MSA.openTaskEditor(x); return; }
    if (a === 'more') { if (x) { e.stopPropagation(); const r = b.getBoundingClientRect(); rowMenu(x, { clientX: ar() ? r.left : r.right - 160, clientY: r.bottom + 4 }); } return; }
    if (a === 'day') { selKey = b.dataset.k; redraw(); return; }
    if (a === 'prev' || a === 'next') { weekStart = addDays(weekStart, a === 'next' ? 7 : -7); selKey = dk(weekStart); redraw(); return; }
    if (a === 'thisweek') { weekStart = startOfWeek(new Date()); selKey = todayKey(); redraw(); return; }
    if (a === 'mode') { wk().mode = b.dataset.m; MSA.save(); redraw(); return; }
    if (a === 'hidedone') { wk().hideDone = !wk().hideDone; MSA.save(); redraw(); return; }
    if (a === 'alert') { openAlertSettings(); return; }
    if (a === 'add') { const i = $('#wkIn', el); if (addTask(i.value, selKey, $('#wkTm', el).value)) { i.value = ''; $('#wkTm', el).value = ''; redraw(); $('#wkIn', el).focus(); } else i.focus(); return; }
    if (a === 'addday') { selKey = b.dataset.k; wk().mode = 'day'; MSA.save(); redraw(); const i = $('#wkIn', el); i && i.focus(); return; }
    if (a === 'full') { const i = $('#wkIn', el); const title = i.value.trim(); i.value = ''; MSA.openTaskEditor(null, { type: 'task', title, due: selKey + 'T23:59' }); return; }
    if (a === 'odtoday') { overdue().forEach(y => setDay(y, todayKey())); persist(); redraw(); return; }
    if (a === 'clear') {
      const ds = all().filter(isDone); if (!ds.length) { MSA.toast(T('مفيش مهام مكتملة', 'No completed tasks'), 'info'); return; }
      if (await MSA.confirm(T('مسح ' + ds.length + ' مهمة مكتملة نهائيًا؟', 'Permanently delete ' + ds.length + ' completed task(s)?'), { danger: true, okLabel: T('مسح', 'Delete') })) { for (const y of ds) { try { await MSA.files.delMany(y.atts); } catch (er) {} } const ids = new Set(ds.map(y => y.id)); S().tasks = S().tasks.filter(y => !ids.has(y.id)); persist(); redraw(); }
      return;
    }
    if (a === 'all') { MSA.go('tasks'); return; }
  };
  el.onkeydown = e => {
    if (e.target.id === 'wkIn' && e.key === 'Enter') { e.preventDefault(); const b = $('[data-wk=add]', el); b && b.click(); }
    else if (e.target.dataset && e.target.dataset.wk === 'edit' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.target.click(); }
  };
  el.oncontextmenu = e => { const row = e.target.closest('.wk-t'); if (!row) return; const x = byId(row.dataset.id); if (x) { e.preventDefault(); rowMenu(x, e); } };
  /* drag a task onto a day to move it */
  let dragId = null;
  el.ondragstart = e => { const r = e.target.closest && e.target.closest('.wk-t'); if (!r) return; dragId = r.dataset.id; try { e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; } catch (er) {} r.classList.add('drag'); };
  el.ondragend = () => { dragId = null; $$('.wk-t.drag,.wk-d.over', el).forEach(n => n.classList.remove('drag', 'over')); };
  el.ondragover = e => { const d = e.target.closest('.wk-d'); if (d && dragId) { e.preventDefault(); $$('.wk-d.over', el).forEach(n => n !== d && n.classList.remove('over')); d.classList.add('over'); } };
  el.ondrop = e => { const d = e.target.closest('.wk-d'); if (!d || !dragId) return; e.preventDefault(); const x = byId(dragId); dragId = null; if (x) { setDay(x, d.dataset.k); persist(); redraw(); } };
}

/* ---------- payments card (kept beside the weekly board) ---------- */
function payHTML(){
  const o = plus.outstanding ? plus.outstanding() : { n: 0, egp: 0, late: 0 }, top = plus.topDue ? plus.topDue(3) : [];
  const cur = c => c === 'EGP' ? T('ج.م', 'EGP') : c;
  return '<div class="wk-phead">' + I('check-c', 'sm') + '<h3>' + esc(T('المدفوعات', 'Payments')) + '</h3></div>' +
    (o.n ? '<div class="wk-pbig"><b dir="ltr">' + plus.fmt0(o.egp) + '</b> <span>' + esc(T('ج.م', 'EGP')) + '</span></div><div class="hint">' + esc(T('غير محصّل · ' + o.n + ' مشروع' + (o.late ? ' · ' + o.late + ' متأخر' : ''), 'Outstanding · ' + o.n + ' project(s)' + (o.late ? ' · ' + o.late + ' late' : ''))) + '</div>' +
      '<div class="wk-plist">' + top.map(r => '<button class="wk-pi' + (r.late ? ' late' : '') + '" data-pid="' + esc(r.id) + '"><span class="wk-pn" dir="auto">' + esc(r.client || r.name) + '</span><b dir="ltr">' + plus.fmt0(r.rem) + ' ' + esc(cur(r.cur)) + '</b></button>').join('') + '</div>'
      : '<div class="wk-pok">' + I('check-c', 'lg') + '<span>' + esc(T('مفيش مستحقات متبقية 👌', 'Nothing outstanding 👌')) + '</span></div>') +
    '<button class="btn sm" data-pay="open">' + esc(T('فتح المدفوعات', 'Open payments')) + I('chev-l', 'sm flip') + '</button>';
}

/* ---------- mount on the home screen ---------- */
const hv = MSA.views.home;
if (hv) {
  const hr = hv.render;
  hv.render = function(host){
    hr.apply(this, arguments);
    const strip = $('.home-strip', host), head = $('.home-head', host); if (!(strip || head)) return;
    const mny = strip && $('.hs-money', strip); if (mny) mny.remove();   /* the payments card below replaces the small chip */
    const row = document.createElement('div'); row.className = 'home-row';
    row.innerHTML = '<section class="wk card" id="wkBoard"></section><aside class="wk-pay card" id="wkPay"></aside>';
    (strip || head).after(row);
    wEl = $('#wkBoard', row); wEl.innerHTML = widgetHTML(); wire(wEl);
    const pay = $('#wkPay', row); pay.innerHTML = payHTML();
    pay.onclick = e => { const p = e.target.closest('[data-pid]'); if (p) { const pr = S().projects.find(x => x.id === p.dataset.pid); if (pr && plus.openProject) plus.openProject(pr, 'time'); else MSA.go('money'); } else if (e.target.closest('[data-pay]')) MSA.go('money'); };
  };
}

/* ---------- daily alert ---------- */
const DEF = { on: true, time: '08:00' };
function daily(){ const s = S().settings; s.daily = Object.assign({}, DEF, s.daily || {}); return s.daily; }
const LS = k => 'msa_daily_' + k;
const lsGet = k => { try { return localStorage.getItem(LS(k)); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(LS(k), v); } catch (e) {} };
const todayList = () => ({ late: overdue(), today: onDay(todayKey()).sort(sorter) });
function summary(){
  const l = todayList(), open = l.today.filter(x => !isDone(x)), n = open.length + l.late.length;
  return { n, open, late: l.late, done: l.today.filter(isDone).length };
}
function openToday(){
  if (document.getElementById('lock')) return;
  const s = summary(), name = MSA.myName ? MSA.myName() : '';
  const body = !s.n && !s.done ? '<div class="wk-empty" style="padding:22px 6px">' + esc(T('يومك فاضي يا ' + name + ' — مفيش مهام النهارده 🎉', 'Your day is clear, ' + name + ' — no tasks today 🎉')) + '</div>'
    : (s.late.length ? '<div class="wk-sec bad"><div class="wk-sh"><b>' + esc(T('متأخرة', 'Overdue')) + '</b><span class="wk-n">' + s.late.length + '</span></div>' + s.late.map(x => rowHTML(x, { date: true })).join('') + '</div>' : '') +
      '<div class="wk-sec"><div class="wk-sh"><b>' + esc(T('النهارده', 'Today')) + '</b><span class="wk-n">' + s.open.length + '</span></div>' + (s.open.length ? s.open.map(x => rowHTML(x)).join('') : '<div class="wk-empty">' + esc(T('خلّصت كل مهام النهارده ✅', 'All of today’s tasks are done ✅')) + '</div>') + '</div>' +
      (s.done ? '<div class="hint" style="margin-top:6px">' + esc(T('اتعمل النهارده: ' + s.done, 'Done today: ' + s.done)) + '</div>' : '');
  const m = MSA.modal({ title: T('النهارده عندك يا ' + name, 'Your day, ' + name) + ' · ' + fmt(new Date(), { weekday: 'long', day: 'numeric', month: 'long' }), size: 'wide', footer: false,
    body: '<div class="wk-modal">' + (s.n ? '<div class="wk-big">' + esc(T(s.n + (s.n === 1 ? ' مهمة محتاجة تخلصها' : ' مهام محتاجة تخلصها'), s.n + ' task(s) to finish')) + '</div>' : '') + body +
      '<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-wk="tomorrow">' + esc(T('انقل المتأخرة لليوم', 'Move overdue to today')) + '</button><button class="btn primary" data-wk="board">' + esc(T('افتح الجدول', 'Open the board')) + '</button></div></div>' });
  if (!s.late.length) { const b = $('[data-wk=tomorrow]', m.el); b && b.remove(); }
  m.el.onclick = e => {
    const b = e.target.closest('[data-wk]'); if (!b) return; const a = b.dataset.wk, row = b.closest('[data-id]'), x = row ? byId(row.dataset.id) : null;
    if (a === 'done' && x) { API().setDone(x, b.checked); persist(); if (row) row.classList.toggle('done', isDone(x)); redraw(); MSA.view === 'home' && !document.getElementById('wkBoard') && 0; }
    else if (a === 'edit' && x) { m.close(); MSA.openTaskEditor(x); }
    else if (a === 'more') { e.stopPropagation(); }
    else if (a === 'tomorrow') { overdue().forEach(y => setDay(y, todayKey())); persist(); m.close(); openToday(); MSA.view === 'home' && MSA.rerender(true); }
    else if (a === 'board') { m.close(); selKey = todayKey(); weekStart = startOfWeek(new Date()); MSA.go('home'); setTimeout(() => { const w = document.getElementById('wkBoard'); w && w.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120); }
  };
  $$('[data-wk=more]', m.el).forEach(n => n.remove());
  $$('.wk-t', m.el).forEach(n => n.removeAttribute('draggable'));
}
MSA.openToday = openToday;

async function notify(s){
  const name = MSA.myName ? MSA.myName() : '', titles = s.late.concat(s.open).slice(0, 3).map(x => x.title).join(' • ');
  const title = T('مهامك النهارده يا ' + name, 'Your tasks today, ' + name), body = T(s.n + ' مهمة: ' + titles + (s.n > 3 ? '…' : ''), s.n + ' task(s): ' + titles + (s.n > 3 ? '…' : ''));
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if (reg && reg.showNotification) { await reg.showNotification(title, { body, tag: 'msa-daily', icon: 'icons/icon-192.png', badge: 'icons/favicon.png', data: { today: true } }); return true; }
    const n = new Notification(title, { body, tag: 'msa-daily', icon: 'icons/icon-192.png' }); n.onclick = () => { try { window.focus(); } catch (e) {} openToday(); n.close(); }; return true;
  } catch (e) { return false; }
}
function dueNow(){ const d = daily(), m = String(d.time || '08:00').match(/(\d\d):(\d\d)/); if (!m) return false; const t = new Date(); return t.getHours() * 60 + t.getMinutes() >= (+m[1]) * 60 + (+m[2]); }
let opened = false;
async function tick(force){
  const d = daily(); if (!d.on || document.getElementById('lock') || document.getElementById('splash')) return;
  if (!dueNow() && !force) return;
  const k = todayKey(), s = summary();
  if (!s.n) return;
  if (document.hidden) { if (lsGet('n') !== k) { if (await notify(s)) lsSet('n', k); } return; }
  if (lsGet('m') !== k && !document.querySelector('#overlayRoot .overlay') && !document.getElementById('msaBoard')) { lsSet('m', k); openToday(); }
}
function startDaily(){
  setTimeout(() => tick(), 4500); setInterval(() => tick(), 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(() => tick(), 900); });
  try { if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'msa-today') openToday(); }); } catch (e) {}
  try { if (/[?&]today=1/.test(location.search)) { history.replaceState(null, '', location.pathname); setTimeout(openToday, 2500); } } catch (e) {}
}
startDaily();

/* ---------- settings (modal from the bell + a section in Settings) ---------- */
const permLabel = () => !('Notification' in window) ? T('الإشعارات مش مدعومة في المتصفح ده — هيظهر تنبيه جوه الأداة فقط.', 'Notifications are not supported here — the alert appears inside the app only.')
  : Notification.permission === 'granted' ? T('إشعارات الجهاز شغّالة ✓', 'Device notifications are on ✓')
  : Notification.permission === 'denied' ? T('الإشعارات محجوبة من إعدادات المتصفح/الجهاز — فعّلها من هناك.', 'Notifications are blocked in browser/device settings — enable them there.')
  : T('لسه ماديتش إذن الإشعارات.', 'Notification permission not granted yet.');
function formHTML(){
  const d = daily();
  return '<label class="row" style="margin-bottom:10px;cursor:pointer"><input type="checkbox" class="cb" id="dyOn" ' + (d.on ? 'checked' : '') + '><span>' + esc(T('نبّهني كل يوم بمهام النهارده', 'Alert me every day with today’s tasks')) + '</span></label>' +
    '<div class="row" style="margin-bottom:8px"><label class="f" style="margin:0">' + esc(T('الساعة', 'At')) + '</label><input type="time" id="dyTime" value="' + esc(d.time) + '" style="width:auto"></div>' +
    '<div class="row" style="margin-bottom:8px"><button class="btn sm" id="dyPerm">' + I('bell', 'sm') + esc(T('تفعيل إشعارات الجهاز', 'Enable device notifications')) + '</button><button class="btn sm" id="dyTest">' + esc(T('جرّب الآن', 'Try it now')) + '</button></div>' +
    '<div class="hint" id="dyHint" style="line-height:1.7">' + esc(permLabel()) + '</div>' +
    '<div class="hint" style="margin-top:6px;line-height:1.7">' + esc(T('عند الساعة المحددة: لو الأداة مفتوحة قدامك بيظهر لك ملخص «النهارده عندك إيه». ولو مفتوحة في الخلفية بيوصلك إشعار، وبالضغط عليه يفتح الملخص. الإشعار بيشتغل طول ما الأداة أو التطبيق المثبّت شغّال في الخلفية.', 'At the chosen time: if the app is open you get a “what’s on today” summary; if it is in the background you get a notification, and tapping it opens the summary. Notifications work while the app or installed app is running in the background.')) + '</div>';
}
function wireForm(root){
  const d = daily(), upd = () => { const h = $('#dyHint', root); if (h) h.textContent = permLabel(); };
  $('#dyOn', root).onchange = e => { d.on = e.target.checked; MSA.save(); if (d.on) { MSA.askNotifyPermission && MSA.askNotifyPermission(); setTimeout(upd, 800); } redraw(); };
  $('#dyTime', root).onchange = e => { d.time = e.target.value || '08:00'; lsSet('m', ''); lsSet('n', ''); MSA.save(); };
  $('#dyPerm', root).onclick = async () => { try { if ('Notification' in window) await Notification.requestPermission(); } catch (e) {} upd(); };
  $('#dyTest', root).onclick = async () => { const s = summary(); if (document.querySelector('#overlayRoot .modal') && root.closest('.modal')) { /* keep the settings open, just test the system notification */ } const ok = await notify(s.n ? s : { n: 1, late: [], open: [{ title: T('مهمة تجريبية', 'Test task') }] }); if (!ok) { MSA.toast(T('الإشعار مش متاح دلوقتي — هتشوف الملخص جوه الأداة', 'System notification unavailable — showing the in-app summary'), 'info'); openToday(); } else MSA.toast(T('اتبعت إشعار تجريبي', 'Test notification sent'), 'ok'); };
}
function openAlertSettings(){
  const m = MSA.modal({ title: T('التنبيه اليومي بالمهام', 'Daily task alert'), footer: false, body: '<div id="dyBox">' + formHTML() + '</div>' });
  wireForm(m.el);
}
MSA.dailyHTML = () => '<div class="sec"><h4>' + I('bell', 'sm') + esc(T('التنبيه اليومي بالمهام', 'Daily task alert')) + '</h4><div id="dyBox">' + formHTML() + '</div></div>';
MSA.wireDaily = root => { if ($('#dyBox', root)) wireForm($('#dyBox', root)); };
MSA.week = { redraw, openToday, summary, _tick: tick };
})();
