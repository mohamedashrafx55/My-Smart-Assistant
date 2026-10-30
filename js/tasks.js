/* Menu 4 — Tasks & notes (ClickUp-style): list / board / calendar / notes, deadlines, reminders, attachments */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const t = (k, v) => MSA.t(k, v);
const STATUSES = ['todo', 'doing', 'review', 'done'];
const PRIOS = ['urgent', 'high', 'normal', 'low'];
const PRANK = { urgent: 0, high: 1, normal: 2, low: 3 };
const NCOLORS = ['', '#5a4a1e', '#1e4a35', '#1e3a5a', '#4a1e3a', '#4a2a1e', '#3a1e4a'];
const NCOLORS_L = ['', '#fff3c4', '#d6f5e5', '#d7e8fb', '#fbdcea', '#fde2cf', '#e6dcfb'];
const REMIND = [['', 'none'], ['0', 'atDue'], ['5', 'm5'], ['15', 'm15'], ['30', 'm30'], ['60', 'h1'], ['180', 'h3'], ['1440', 'd1'], ['custom', 'custom']];
const T = () => MSA.state.tasks;
let view = null, filt = { q: '', prio: '', tag: '', showDone: false };
let calMonth = null;   // Date at 1st of month

const isDone = x => x.status === 'done';
const dueMs = x => U.toMs(x.due);
const ymd = ms => U.dateKey(new Date(ms));
const toInput = ms => { const d = new Date(ms); return U.dateKey(d) + 'T' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()); };
function remindMs(x){
  if (!x.remind || isDone(x)) return null;
  if (x.remind === 'custom') return U.toMs(x.remindAt);
  const d = dueMs(x); return d == null ? null : d - (+x.remind) * 60000;
}
function allTags(){ const s = new Set(); T().forEach(x => (x.tags || []).forEach(g => s.add(g))); return Array.from(s).sort(); }
function matches(x){
  if (filt.prio && x.priority !== filt.prio) return false;
  if (filt.tag && !(x.tags || []).includes(filt.tag)) return false;
  if (filt.q) { const q = filt.q.toLowerCase(); if (!((x.title || '') + ' ' + U.stripHtml(x.desc) + ' ' + (x.tags || []).join(' ')).toLowerCase().includes(q)) return false; }
  return true;
}
function duePill(x){
  const d = dueMs(x); if (d == null) return '';
  const now = Date.now(), over = d < now && !isDone(x), soon = !over && d - now < 864e5 && !isDone(x);
  return '<span class="pill ' + (over ? 'over' : soon ? 'soon' : '') + '">' + I('clock', 'sm') + U.esc(MSA.fmtDate(d, true)) + '</span>';
}
const prioIcon = p => '<span class="pri-' + p + '" title="' + U.esc(t('prio.' + p)) + '">' + I('flag', 'sm') + '</span>';
const clProg = x => { const c = x.checklist || []; return c.length ? '<span class="pill">' + I('checks', 'sm') + c.filter(i => i.done).length + '/' + c.length + '</span>' : ''; };
const tagChips = x => (x.tags || []).slice(0, 3).map(g => '<span class="pill">#' + U.esc(g) + '</span>').join('');
const metaRow = x => '<div class="meta">' + (x.type === 'task' ? prioIcon(x.priority) : '') + duePill(x) + clProg(x) + (x.atts && x.atts.length ? '<span class="pill">' + I('clip', 'sm') + x.atts.length + '</span>' : '') + (x.remind ? '<span class="pill">' + I('bell', 'sm') + '</span>' : '') + (x.repeat ? '<span class="pill">' + I('repeat', 'sm') + '</span>' : '') + tagChips(x) + '</div>';

/* ---------- completion (with repeat) ---------- */
function setDone(x, v){
  if (v) {
    if (x.repeat && dueMs(x) != null) {
      const step = d => { const n = new Date(d); if (x.repeat === 'daily') n.setDate(n.getDate() + 1); else if (x.repeat === 'weekly') n.setDate(n.getDate() + 7); else n.setMonth(n.getMonth() + 1); return n.getTime(); };
      const sh = s => s ? toInput(step(U.toMs(s))) : '';
      x.due = sh(x.due); x.start = sh(x.start); if (x.remind === 'custom') x.remindAt = sh(x.remindAt);
      x.status = 'todo'; x.notified = false; (x.checklist || []).forEach(c => c.done = false);
      MSA.toast(t('nextOccurrence', { d: MSA.fmtDate(dueMs(x), true) })); return;
    }
    x.status = 'done'; x.completedAt = Date.now();
  } else { x.status = 'todo'; delete x.completedAt; x.notified = false; }
}
const refresh = () => { MSA.save(); MSA.updateCounts(); MSA.rerender(); };

/* ---------- rendering ---------- */
function render(host){
  view = MSA.state.ui.tasksView || 'list';
  const open = T().filter(x => x.type === 'task' && !isDone(x)).length;
  let html = '<div class="page-head"><div><h1>' + I('checks', 'lg') + U.esc(t('nav.tasks')) + '</h1><div class="sub">' + U.esc(t('tasks.sub', { n: open })) + '</div></div>' +
    '<div class="row"><button class="btn" data-act="newnote">' + I('note', 'sm') + U.esc(t('newNote')) + '</button><button class="btn primary" data-act="newtask">' + I('plus', 'sm') + U.esc(t('newTask')) + '</button></div></div>';
  html += '<div class="tbar"><div class="seg" id="tv">' +
    [['list', 'list'], ['board', 'kanban'], ['cal', 'calendar'], ['notes', 'note']].map(v => '<button data-act="view" data-v="' + v[0] + '" class="' + (view === v[0] ? 'on' : '') + '">' + I(v[1], 'sm') + '<span class="vl">' + U.esc(t('view.' + v[0])) + '</span></button>').join('') + '</div>' +
    '<div class="search">' + I('search', 'sm') + '<input type="search" id="tq" value="' + U.esc(filt.q) + '" placeholder="' + U.esc(t('search')) + '"></div>' +
    '<select id="tp" style="width:auto"><option value="">' + U.esc(t('allPriorities')) + '</option>' + PRIOS.map(p => '<option value="' + p + '" ' + (filt.prio === p ? 'selected' : '') + '>' + U.esc(t('prio.' + p)) + '</option>').join('') + '</select>' +
    (allTags().length ? '<select id="tg" style="width:auto"><option value="">' + U.esc(t('allTags')) + '</option>' + allTags().map(g => '<option ' + (filt.tag === g ? 'selected' : '') + '>' + U.esc(g) + '</option>').join('') + '</select>' : '') + '</div>';
  html += view === 'list' ? listHTML() : view === 'board' ? boardHTML() : view === 'cal' ? calHTML() : notesHTML();
  host.innerHTML = html;
  bind(host);
}

function row(x){
  return '<div class="trow ' + (isDone(x) ? 'done' : '') + '" data-id="' + x.id + '" data-act="edit"><input type="checkbox" class="cb" data-act="done" ' + (isDone(x) ? 'checked' : '') + ' aria-label="' + U.esc(t('markDone')) + '">' +
    '<div class="grow"><div class="tt">' + U.esc(x.title) + '</div>' + metaRow(x) + '</div><span class="st st-' + x.status + '">' + U.esc(t('status.' + x.status)) + '</span></div>';
}
function listHTML(){
  const tasks = T().filter(x => x.type === 'task' && matches(x));
  const open = tasks.filter(x => !isDone(x)), done = tasks.filter(isDone);
  const now = Date.now(), today = ymd(now);
  const sortFn = (a, b) => ((dueMs(a) ?? 9e15) - (dueMs(b) ?? 9e15)) || (PRANK[a.priority] - PRANK[b.priority]);
  const groups = [
    ['overdue', open.filter(x => dueMs(x) != null && dueMs(x) < now && ymd(dueMs(x)) !== today || (dueMs(x) != null && dueMs(x) < now))],
    ['today', open.filter(x => dueMs(x) != null && dueMs(x) >= now && ymd(dueMs(x)) === today)],
    ['upcoming', open.filter(x => dueMs(x) != null && ymd(dueMs(x)) > today)],
    ['nodate', open.filter(x => dueMs(x) == null)]
  ];
  let html = '<div class="quick"><input type="text" id="qadd" placeholder="' + U.esc(t('quickAdd')) + '"><button class="btn primary" data-act="qadd">' + I('plus', 'sm') + U.esc(t('add')) + '</button></div>';
  const shown = new Set();
  groups.forEach(([k, arr]) => { arr = arr.filter(x => !shown.has(x.id)); arr.forEach(x => shown.add(x.id)); if (!arr.length) return; html += '<h3 class="muted" style="font-size:13px;margin:16px 2px 8px;' + (k === 'overdue' ? 'color:var(--danger)' : '') + '">' + U.esc(t('grp.' + k)) + ' · ' + arr.length + '</h3>' + arr.sort(sortFn).map(row).join(''); });
  if (!open.length) html += MSA.empty('checks', t('tasks.empty'), t('tasks.emptySub'));
  if (done.length) html += '<div style="margin-top:18px"><button class="btn sm ghost" data-act="showdone">' + I(filt.showDone ? 'chev-d' : 'chev-r', 'sm flip') + U.esc(t('completed')) + ' · ' + done.length + '</button>' + (filt.showDone ? '<div style="margin-top:8px">' + done.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)).map(row).join('') + '</div>' : '') + '</div>';
  return html;
}
function boardHTML(){
  const tasks = T().filter(x => x.type === 'task' && matches(x));
  return '<div class="board">' + STATUSES.map(s => {
    const arr = tasks.filter(x => x.status === s).sort((a, b) => ((dueMs(a) ?? 9e15) - (dueMs(b) ?? 9e15)) || (PRANK[a.priority] - PRANK[b.priority]));
    return '<div class="col" data-status="' + s + '"><h3><span class="st st-' + s + '">' + U.esc(t('status.' + s)) + '</span><span class="muted">' + arr.length + '</span><button class="icon-btn sm" style="margin-inline-start:auto" data-act="coladd" data-s="' + s + '" aria-label="' + U.esc(t('newTask')) + '">' + I('plus', 'sm') + '</button></h3>' +
      arr.map(x => '<div class="kcard" draggable="true" data-id="' + x.id + '" data-act="edit"><div class="row" style="flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" class="cb" style="width:20px;height:20px;border-radius:6px" data-act="done" ' + (isDone(x) ? 'checked' : '') + '><div class="grow tt" style="font-weight:600;' + (isDone(x) ? 'text-decoration:line-through;color:var(--muted)' : '') + '">' + U.esc(x.title) + '</div></div>' + metaRow(x) + '</div>').join('') + '</div>';
  }).join('') + '</div>';
}
function notesHTML(){
  const notes = T().filter(x => x.type === 'note' && matches(x)).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updated || 0) - (a.updated || 0));
  if (!notes.length) return MSA.empty('note', t('notes.empty'), t('notes.emptySub'));
  const light = document.documentElement.dataset.theme === 'light';
  return '<div class="notes-grid">' + notes.map(x => {
    const bg = x.color ? (light ? NCOLORS_L : NCOLORS)[NCOLORS.indexOf(x.color) >= 0 ? NCOLORS.indexOf(x.color) : NCOLORS_L.indexOf(x.color)] || '' : '';
    const imgs = (x.atts || []).filter(a => a.kind === 'image').slice(0, 1);
    return '<article class="ncard" data-id="' + x.id + '" data-act="edit" style="' + (bg ? '--ncol:' + bg : '') + '">' + (x.pinned ? '<span style="position:absolute;top:10px;inset-inline-end:10px;opacity:.7">' + I('pin', 'sm') + '</span>' : '') +
      (imgs.length ? '<div class="att" style="width:100%;height:120px;margin-bottom:8px;cursor:inherit">' + '<img data-thumb="' + imgs[0].id + '" alt=""></div>' : '') +
      '<h4>' + U.esc(x.title) + '</h4><div class="nb rich">' + U.sanitize(x.desc) + '</div>' + metaRow(x) + '</article>';
  }).join('') + '</div>';
}
function calHTML(){
  const lang = MSA.state.settings.lang, startDow = lang === 'ar' ? 6 : 1;   // Saturday / Monday
  if (!calMonth) { const n = new Date(); calMonth = new Date(n.getFullYear(), n.getMonth(), 1); }
  const first = new Date(calMonth), lead = (first.getDay() - startDow + 7) % 7, start = new Date(first); start.setDate(1 - lead);
  const loc = lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB';
  const title = new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(first);
  const dow = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(loc, { weekday: 'short' }).format(new Date(2024, 0, 7 + ((startDow + i) % 7))));
  const byDay = {}; T().filter(x => x.type === 'task' && matches(x) && dueMs(x) != null).forEach(x => (byDay[ymd(dueMs(x))] = byDay[ymd(dueMs(x))] || []).push(x));
  const todayK = ymd(Date.now());
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); const k = U.dateKey(d), evs = byDay[k] || [];
    cells += '<div class="d ' + (d.getMonth() !== first.getMonth() ? 'off' : '') + (k === todayK ? ' today' : '') + '" data-act="calday" data-d="' + k + '"><span class="dn">' + d.getDate() + '</span>' +
      evs.slice(0, 3).map(x => '<span class="ev ' + (isDone(x) ? 'done' : '') + '" data-act="edit" data-id="' + x.id + '" title="' + U.esc(x.title) + '">' + U.esc(x.title) + '</span>').join('') + (evs.length > 3 ? '<span class="hint">+' + (evs.length - 3) + '</span>' : '') + '</div>';
  }
  return '<div class="row" style="justify-content:space-between;margin-bottom:12px"><h3>' + U.esc(title) + '</h3><div class="row"><button class="btn sm" data-act="calprev">' + I('chev-l', 'sm flip') + '</button><button class="btn sm" data-act="caltoday">' + U.esc(t('today')) + '</button><button class="btn sm" data-act="calnext">' + I('chev-r', 'sm flip') + '</button></div></div>' +
    '<div class="cal">' + dow.map(n => '<div class="dh">' + U.esc(n) + '</div>').join('') + cells + '</div>';
}

function bind(host){
  const get = el => { const r = el.closest('[data-id]'); return r ? T().find(x => x.id === r.dataset.id) : null; };
  MSA.on(host, {
    newtask: () => openEditor(null, { type: 'task' }), newnote: () => openEditor(null, { type: 'note' }),
    view: el => { MSA.state.ui.tasksView = el.dataset.v; MSA.save(); MSA.rerender(false); },
    edit: (el, e) => { if (e.target.closest('input.cb')) return; const x = get(el); if (x) { e.stopPropagation(); openEditor(x); } },
    done: (el, e) => { e.stopPropagation(); const x = get(el); if (x) { setDone(x, el.checked); refresh(); } },
    qadd: () => quickAdd(), showdone: () => { filt.showDone = !filt.showDone; MSA.rerender(); },
    coladd: el => openEditor(null, { type: 'task', status: el.dataset.s }),
    calprev: () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); MSA.rerender(false); },
    calnext: () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); MSA.rerender(false); },
    caltoday: () => { calMonth = null; MSA.rerender(false); },
    calday: (el, e) => { if (e.target.closest('.ev')) return; openEditor(null, { type: 'task', due: el.dataset.d + 'T09:00' }); }
  });
  const q = $('#tq', host); if (q) q.addEventListener('input', e => { filt.q = e.target.value; const p = e.target.selectionStart; MSA.rerender(false); const n = $('#tq'); n && (n.focus(), n.setSelectionRange(p, p)); });
  const tp = $('#tp', host); if (tp) tp.onchange = e => { filt.prio = e.target.value; MSA.rerender(false); };
  const tg = $('#tg', host); if (tg) tg.onchange = e => { filt.tag = e.target.value; MSA.rerender(false); };
  const qa = $('#qadd', host); if (qa) qa.addEventListener('keydown', e => { if (e.key === 'Enter') quickAdd(); });
  /* drag cards between board columns */
  host.addEventListener('dragstart', e => { const c = e.target.closest('.kcard'); if (c) { e.dataTransfer.setData('text/task', c.dataset.id); c.classList.add('dragging'); } });
  host.addEventListener('dragend', e => { const c = e.target.closest('.kcard'); if (c) c.classList.remove('dragging'); });
  host.addEventListener('dragover', e => { const c = e.target.closest('.col'); if (c) { e.preventDefault(); c.classList.add('hot'); } });
  host.addEventListener('dragleave', e => { const c = e.target.closest('.col'); if (c) c.classList.remove('hot'); });
  host.addEventListener('drop', e => {
    const c = e.target.closest('.col'); if (!c) return; e.preventDefault();
    const x = T().find(y => y.id === e.dataTransfer.getData('text/task')); if (!x) return;
    if (c.dataset.status === 'done') setDone(x, true); else { x.status = c.dataset.status; delete x.completedAt; x.notified = false; }
    refresh();
  });
}
function blank(o){
  return Object.assign({ id: U.uid('t'), type: 'task', title: '', desc: '', status: 'todo', priority: 'normal', start: '', due: '', remind: '', remindAt: '', repeat: '', tags: [], checklist: [], atts: [], color: '', pinned: false, created: Date.now(), updated: Date.now(), notified: false }, o || {});
}
function quickAdd(){
  const inp = $('#qadd'); const v = inp.value.trim(); if (!v) { inp.focus(); return; }
  T().unshift(blank({ title: v })); refresh(); const n = $('#qadd'); n && n.focus();
}

/* ---------- editor drawer ---------- */
function openEditor(existing, preset){
  const orig = existing, x = existing ? JSON.parse(JSON.stringify(existing)) : blank(preset);
  const added = [];
  const m = MSA.drawer({
    title: existing ? t(x.type === 'note' ? 'editNote' : 'editTask') : t(x.type === 'note' ? 'newNote' : 'newTask'),
    side: 'right', body: '', onMount: null,
    buttons: [
      ...(existing ? [{ label: t('delete'), cls: 'danger', icon: 'trash', onClick: async api => { if (await MSA.confirm(t('delTaskQ', { n: x.title || t('untitled') }), { danger: true, okLabel: t('delete') })) { await MSA.files.delMany(orig.atts); MSA.state.tasks = T().filter(y => y.id !== orig.id); api.close(); refresh(); } } }] : []),
      { label: t('cancel'), cls: 'ghost', onClick: async api => { await MSA.files.delMany(added); api.close(); } },
      { label: t('save'), cls: 'primary', icon: 'check', onClick: async (api, el) => {
        collect(el); if (!x.title.trim()) { $('#tTitle', el).focus(); $('#tTitle', el).style.borderColor = 'var(--danger)'; return; }
        x.title = x.title.trim(); x.updated = Date.now(); x.notified = false;
        if (x.status === 'done' && !x.completedAt) x.completedAt = Date.now();
        const removed = existing ? orig.atts.filter(a => !x.atts.some(b => b.id === a.id)) : [];
        await MSA.files.delMany(removed);
        if (existing) Object.assign(orig, x); else T().unshift(x);
        api.close(); refresh();
        if (x.remind) MSA.askNotifyPermission();
      } }
    ]
  });
  const body = $('.mb', m.el);
  const collect = el => {
    x.title = $('#tTitle', el).value;
    x.desc = U.sanitize($('#tDesc', el).innerHTML);
    if (x.type === 'task') {
      x.status = $('#tStatus', el).value; x.priority = $('#tPrio', el).value;
      x.start = $('#tStart', el).value; x.due = $('#tDue', el).value;
      x.remind = $('#tRemind', el).value; x.remindAt = $('#tRemindAt', el) ? $('#tRemindAt', el).value : '';
      x.repeat = $('#tRepeat', el).value;
    }
  };
  const draw = () => {
    const cur = $('#tTitle', body) ? { title: $('#tTitle', body).value } : null;
    const light = document.documentElement.dataset.theme === 'light';
    body.innerHTML =
      '<div class="seg" id="tType" style="margin-bottom:16px"><button data-t="task" class="' + (x.type === 'task' ? 'on' : '') + '">' + I('checks', 'sm') + U.esc(t('task')) + '</button><button data-t="note" class="' + (x.type === 'note' ? 'on' : '') + '">' + I('note', 'sm') + U.esc(t('note')) + '</button></div>' +
      '<div class="field"><input id="tTitle" type="text" style="font-size:17px;font-weight:600" placeholder="' + U.esc(t(x.type === 'note' ? 'noteTitlePh' : 'taskTitlePh')) + '" value="' + U.esc(x.title) + '"></div>' +
      (x.type === 'task' ?
        '<div class="grid2"><div class="field"><label class="f">' + U.esc(t('statusL')) + '</label><select id="tStatus">' + STATUSES.map(s => '<option value="' + s + '" ' + (x.status === s ? 'selected' : '') + '>' + U.esc(t('status.' + s)) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label class="f">' + U.esc(t('priority')) + '</label><select id="tPrio">' + PRIOS.map(s => '<option value="' + s + '" ' + (x.priority === s ? 'selected' : '') + '>' + U.esc(t('prio.' + s)) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label class="f">' + U.esc(t('startDate')) + '</label><input id="tStart" type="datetime-local" value="' + U.esc(x.start) + '"></div>' +
        '<div class="field"><label class="f">' + U.esc(t('deadline')) + '</label><input id="tDue" type="datetime-local" value="' + U.esc(x.due) + '"></div>' +
        '<div class="field"><label class="f">' + U.esc(t('reminder')) + '</label><select id="tRemind">' + REMIND.map(r => '<option value="' + r[0] + '" ' + (x.remind === r[0] ? 'selected' : '') + '>' + U.esc(t('rem.' + r[1])) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label class="f">' + U.esc(t('repeat')) + '</label><select id="tRepeat">' + [['', 'none'], ['daily', 'daily'], ['weekly', 'weekly'], ['monthly', 'monthly']].map(r => '<option value="' + r[0] + '" ' + (x.repeat === r[0] ? 'selected' : '') + '>' + U.esc(t('rep.' + r[1])) + '</option>').join('') + '</select></div></div>' +
        (x.remind === 'custom' ? '<div class="field"><label class="f">' + U.esc(t('remindAt')) + '</label><input id="tRemindAt" type="datetime-local" value="' + U.esc(x.remindAt) + '"></div>' : '')
        : '<div class="field"><label class="f">' + U.esc(t('noteColor')) + '</label><div class="swatches" id="tCol">' + (light ? NCOLORS_L : NCOLORS).map((c, i) => '<button class="sw ' + ((x.color === NCOLORS[i] || x.color === NCOLORS_L[i]) ? 'on' : '') + '" data-i="' + i + '" style="background:' + (c || 'var(--panel2)') + '"></button>').join('') + '<button class="btn sm ' + (x.pinned ? 'primary' : '') + '" id="tPin" style="margin-inline-start:8px">' + I('pin', 'sm') + U.esc(t('pin')) + '</button></div></div>') +
      '<div class="field"><label class="f">' + U.esc(t('description')) + '</label><div class="etools">' +
        '<button data-c="bold" title="Bold"><b>B</b></button><button data-c="italic" title="Italic"><i>I</i></button><button data-c="underline" title="Underline"><u>U</u></button><button data-c="insertUnorderedList" title="List">' + I('list-ul', 'sm') + '</button><button data-c="h3" title="Heading">' + I('heading', 'sm') + '</button></div>' +
        '<div class="editor" id="tDesc" contenteditable="true" data-ph="' + U.esc(t('descPh')) + '">' + U.sanitize(x.desc) + '</div></div>' +
      '<div class="field"><label class="f">' + U.esc(t('checklist')) + '</label><div id="tCl">' + (x.checklist || []).map(c => '<div class="chk" data-cid="' + c.id + '"><input type="checkbox" class="cb" ' + (c.done ? 'checked' : '') + '><input type="text" value="' + U.esc(c.text) + '"><button class="icon-btn sm danger" data-cdel aria-label="' + U.esc(t('delete')) + '">' + I('x', 'sm') + '</button></div>').join('') + '</div>' +
        '<div class="row" style="margin-top:6px"><input id="tClNew" type="text" placeholder="' + U.esc(t('addChecklistItem')) + '" style="flex:1"><button class="btn sm" id="tClAdd">' + I('plus', 'sm') + '</button></div></div>' +
      '<div class="field"><label class="f">' + U.esc(t('tags')) + '</label><div class="row" id="tTags" style="gap:6px;margin-bottom:6px">' + (x.tags || []).map(g => '<span class="chip">#' + U.esc(g) + '<button data-tdel="' + U.esc(g) + '" aria-label="remove">' + I('x', 'sm') + '</button></span>').join('') + '</div><input id="tTagNew" type="text" placeholder="' + U.esc(t('addTag')) + '"></div>' +
      '<div class="field"><label class="f">' + U.esc(t('attachments')) + '</label><div class="row" style="margin-bottom:10px">' +
        ['image', 'doc', 'video', 'audio'].map(k => '<button class="btn sm" data-add="' + k + '">' + I(k === 'audio' ? 'music' : k, 'sm') + U.esc(t('add.' + k)) + '</button>').join('') + '</div>' +
        '<div class="atts" style="padding:0" id="tAtts">' + (x.atts || []).map(a => MSA.attHTML(a, true)).join('') + '</div></div>';
    if (cur && cur.title !== x.title) { /* keep typed title across redraw */ }
    MSA.hydrateAtts(body);
    wire();
  };
  const wire = () => {
    const el = m.el;
    $$('#tType button', el).forEach(b => b.onclick = () => { collect(el); x.type = b.dataset.t; draw(); });
    $$('.etools button', el).forEach(b => b.onmousedown = e => { e.preventDefault(); const c = b.dataset.c; if (c === 'h3') document.execCommand('formatBlock', false, 'h3'); else document.execCommand(c); });
    const ed = $('#tDesc', el); ed.addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain')); });
    const rm = $('#tRemind', el); if (rm) rm.onchange = () => { collect(el); draw(); if (x.remind) MSA.askNotifyPermission(); };
    $$('#tCol .sw', el).forEach(b => b.onclick = () => { collect(el); x.color = NCOLORS[+b.dataset.i]; draw(); });
    const pin = $('#tPin', el); if (pin) pin.onclick = () => { collect(el); x.pinned = !x.pinned; draw(); };
    const addCl = () => { const i = $('#tClNew', el), v = i.value.trim(); if (!v) return; collect(el); (x.checklist = x.checklist || []).push({ id: U.uid('c'), text: v, done: false }); draw(); setTimeout(() => $('#tClNew', m.el).focus(), 20); };
    $('#tClAdd', el).onclick = addCl; $('#tClNew', el).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCl(); } });
    $('#tCl', el).addEventListener('change', e => { const r = e.target.closest('[data-cid]'); if (!r) return; const c = x.checklist.find(i => i.id === r.dataset.cid); if (c && e.target.type === 'checkbox') c.done = e.target.checked; });
    $('#tCl', el).addEventListener('input', e => { const r = e.target.closest('[data-cid]'); if (!r) return; const c = x.checklist.find(i => i.id === r.dataset.cid); if (c && e.target.type === 'text') c.text = e.target.value; });
    $('#tCl', el).addEventListener('click', e => { const d = e.target.closest('[data-cdel]'); if (!d) return; collect(el); x.checklist = x.checklist.filter(i => i.id !== d.closest('[data-cid]').dataset.cid); draw(); });
    const addTag = () => { const i = $('#tTagNew', el), v = i.value.trim().replace(/^#/, ''); if (!v) return; collect(el); if (!x.tags.includes(v)) x.tags.push(v); draw(); setTimeout(() => $('#tTagNew', m.el).focus(), 20); };
    $('#tTagNew', el).addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } });
    $('#tTags', el).addEventListener('click', e => { const d = e.target.closest('[data-tdel]'); if (!d) return; collect(el); x.tags = x.tags.filter(g => g !== d.dataset.tdel); draw(); });
    $$('[data-add]', el).forEach(b => b.onclick = async () => { collect(el); const atts = await MSA.addFiles(b.dataset.add); if (atts.length) { x.atts.push(...atts); added.push(...atts); draw(); } });
    MSA.bindAtts($('#tAtts', el), () => x.atts, id => { collect(el); x.atts = x.atts.filter(a => a.id !== id); draw(); });
  };
  draw();
  setTimeout(() => { const i = $('#tTitle', m.el); if (i && !existing) i.focus(); }, 60);
}
MSA.openTaskEditor = openEditor;

/* ---------- reminders ---------- */
MSA.askNotifyPermission = function(){ try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {} };
function checkReminders(first){
  const now = Date.now(); let fired = 0, missed = 0;
  T().forEach(x => {
    if (x.type !== 'task' || x.notified) return;
    const r = remindMs(x); if (r == null || r > now) return;
    x.notified = true; fired++;
    const late = now - r > 5 * 60000;
    if (first && late) { missed++; return; }
    const body = (dueMs(x) != null ? t('dueLabel', { d: MSA.fmtDate(dueMs(x), true) }) : '');
    if (MSA.sound) MSA.sound.play();
    MSA.toast('🔔 ' + x.title + (body ? ' — ' + body : ''), 'bell', 9000);
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification(x.title, { body: body, icon: 'data:image/png;base64,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', tag: x.id }); } catch (e) {}
  });
  if (missed) MSA.toast(t('missedReminders', { n: missed }), 'bell', 7000);
  if (fired) { MSA.save(); if (MSA.view === 'tasks') MSA.rerender(); }
}
MSA.startReminders = function(){ setTimeout(() => checkReminders(true), 1500); setInterval(() => checkReminders(false), 15000); };
MSA.taskStats = () => ({ open: T().filter(x => x.type === 'task' && !isDone(x)).length, notes: T().filter(x => x.type === 'note').length });

MSA.tasksApi = { setDone, blank, refresh, toInput };
MSA.views.tasks = { render };
})();

