/* Menu 1 — Projects in progress (campaign plan with per-step attachments + done marks) */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const t = (k, v) => MSA.t(k, v);

/* campaign plan template (from the workflow map) */
const TEMPLATE = [
  { key: 'brief' }, { key: 'idea' }, { key: 'mood' },
  { key: 'foundations', children: [{ key: 'colors' }, { key: 'fonts' }, { key: 'icons' }, { key: 'imagestyle' }] },
  { key: 'logo' }, { key: 'slogan' }, { key: 'main' }, { key: 'templates' },
  { key: 'onscreen', children: [{ key: 'static' }, { key: 'motion' }] },
  { key: 'printing' }, { key: 'mockups' }
];
function build(tpl){
  return tpl.map(n => ({ id: U.uid('s'), key: n.key, title: null, done: false, note: '', atts: [], children: n.children ? build(n.children) : [] }));
}
const P = MSA.proj = {
  TEMPLATE,
  makeSteps: kind => {
    if (kind === 'blank') return [];
    if (kind.indexOf('tpl:') === 0) { const id = kind.slice(4), all = P.builtinTpls().concat(MSA.state.templates || []), x = all.find(y => y.id === id); if (x) { const mk = l => l.map(s => ({ id: U.uid('s'), key: s.key || null, title: s.key ? null : s.title, done: false, note: '', atts: [], children: mk(s.children || []) })); return mk(x.steps); } }
    return build(TEMPLATE);
  },
  builtinTpls: () => { const A = (a, e) => ({ title: MSA.T(a, e) }); return [
    { id: 'b-identity', name: MSA.T('هوية بصرية كاملة', 'Full brand identity'), steps: [{ key: 'brief' }, { key: 'mood' }, { key: 'colors' }, { key: 'fonts' }, { key: 'logo' }, { key: 'icons' }, { key: 'mockups' }, A('كتيب الهوية', 'Brand guidelines'), A('التسليم', 'Delivery')] },
    { id: 'b-reel', name: MSA.T('فيديو / ريلز', 'Video / reel'), steps: [{ key: 'brief' }, A('السيناريو', 'Script'), A('ستوري بورد', 'Storyboard'), A('التصوير', 'Shooting'), A('المونتاج', 'Editing'), A('الصوت والموسيقى', 'Sound & music'), A('التلوين', 'Colour grading'), A('التصدير والنشر', 'Export & publish')] },
    { id: 'b-post', name: MSA.T('بوست سوشيال سريع', 'Quick social post'), steps: [{ key: 'brief' }, { key: 'idea' }, { key: 'static' }, A('مراجعة العميل', 'Client review'), A('التسليم', 'Delivery')] }
  ]; },
  title(s){ return s.title || t('step.' + s.key); },
  hint(s){ if (s.title || !s.key) return ''; const k = 'step.' + s.key + '.h'; const v = t(k); return v === k ? '' : v; },
  leaves(s){ return s.children.length ? s.children.flatMap(P.leaves) : [s]; },
  done(s){ return s.children.length ? s.children.every(P.done) : !!s.done; },
  partial(s){ return s.children.length && !P.done(s) && s.children.some(c => P.done(c) || P.partial(c)); },
  progress(p){ const L = p.steps.flatMap(P.leaves); const d = L.filter(s => s.done).length; return { done: d, total: L.length, pct: L.length ? Math.round(d / L.length * 100) : 0 }; },
  find(list, id, parent){ for (let i = 0; i < list.length; i++) { const s = list[i]; if (s.id === id) return { step: s, list, index: i, parent: parent || null }; const r = P.find(s.children, id, s); if (r) return r; } return null; },
  walk(list, fn, depth){ (list || []).forEach(s => { fn(s, depth || 0); P.walk(s.children, fn, (depth || 0) + 1); }); },
  allAtts(list){ const out = []; P.walk(list, s => out.push(...s.atts)); return out; },
  /* every file a stage owns, including moodboard pictures waiting in the board's trash — used when deleting */
  ownedAtts(list){ const out = []; P.walk(list, s => { out.push(...s.atts); if (s.board && s.board.trash) out.push(...s.board.trash); }); return out; },
  setDone(s, v){ if (s.children.length) s.children.forEach(c => P.setDone(c, v)); else s.done = v; },
  activeList(){ return MSA.state.projects.filter(p => p.status !== 'done'); },
  doneList(){ return MSA.state.projects.filter(p => p.status === 'done'); }
};

const openNotes = new Set();
const tab = () => MSA.state.ui.ptab || 'plan';
const mode = () => (MSA.state.ui.projView === 'list' ? 'list' : 'map');
function current(){
  const act = P.activeList();
  let p = act.find(x => x.id === MSA.state.ui.project);
  if (!p) { p = act[0] || null; MSA.state.ui.project = p ? p.id : null; }
  return p;
}

function stepHTML(s, depth){
  const done = P.done(s), part = P.partial(s);
  const hint = P.hint(s);
  const noteOpen = s.note || openNotes.has(s.id);
  const btn = (kind, icon) => '<button class="icon-btn" data-act="add" data-kind="' + kind + '" title="' + U.esc(t('add.' + kind)) + '" aria-label="' + U.esc(t('add.' + kind)) + '">' + I(icon, 'sm') + '</button>';
  return '<div class="step ' + (done ? 'done' : '') + '" data-step="' + s.id + '">' +
    '<div class="step-main">' +
      '<input type="checkbox" class="cb ' + (part ? 'indet' : '') + '" data-act="toggle" ' + (done ? 'checked' : '') + ' aria-label="' + U.esc(t('markDone')) + '">' +
      '<div class="step-title"><span class="ttl">' + U.esc(P.title(s)) + '</span>' + (hint ? '<span class="step-hint">' + U.esc(hint) + '</span>' : '') + '</div>' +
      (MSA.plus && MSA.plus.dueChip ? MSA.plus.dueChip(s) : '') + (done ? '<span class="done-mark">' + I('check', 'sm') + U.esc(t('done')) + '</span>' : '') +
      '<div class="add-btns">' + (s.key === 'mood' ? '<button class="btn sm primary" data-act="board" title="' + U.esc(MSA.T('مود بورد (زي PureRef)', 'Moodboard (PureRef-style)')) + '">' + I('layers', 'sm') + U.esc(MSA.T('فتح المود بورد', 'Open moodboard')) + '</button>' : '') + '<button class="icon-btn" data-act="apps" title="' + U.esc(MSA.T('البرامج المستخدمة', 'Programs used')) + '" aria-label="apps">' + I('grid', 'sm') + '</button><button class="btn sm sug-btn" data-act="sug" title="' + U.esc(MSA.T('اقتراحات لهذه الخطوة','Suggestions for this step')) + '">' + I('sparkles', 'sm') + U.esc(MSA.T('الاقتراحات','Suggestions')) + '</button>' + btn('image', 'image') + btn('doc', 'doc') + btn('video', 'video') + btn('audio', 'music') + (MSA.tips ? MSA.tips.btn(s, current()) : '') +
        '<button class="icon-btn" data-act="note" title="' + U.esc(t('note')) + '" aria-label="' + U.esc(t('note')) + '">' + I('pencil', 'sm') + '</button>' +
        '<button class="icon-btn" data-act="more" aria-label="' + U.esc(t('more')) + '">' + I('more', 'sm') + '</button></div>' +
    '</div>' +
    (s.apps && s.apps.length ? '<div class="step-apps" data-act="apps">' + MSA.apps.chips(s, 26) + '</div>' : '') +
    (MSA.tips ? MSA.tips.box(s, current()) : '') +
    (s.atts.length ? '<div class="atts">' + s.atts.map(a => MSA.attHTML(a, true)).join('') + '</div>' : '') +
    (noteOpen ? '<div class="note-box"><textarea data-note placeholder="' + U.esc(t('notePh')) + '">' + U.esc(s.note) + '</textarea></div>' : '') +
    (s.children.length ? '<div class="sub">' + s.children.map(c => stepHTML(c, depth + 1)).join('') + '</div>' : '') +
  '</div>';
}

P.stepHTML = stepHTML;

function render(host){
  const st = MSA.state, act = P.activeList(), p = current();
  let html = '<div class="page-head"><div><h1>' + I('briefcase', 'lg') + U.esc(t('nav.active')) + '</h1><div class="sub">' + U.esc(t('active.sub')) + '</div></div>' +
    '<button class="btn primary" data-act="new">' + I('plus', 'sm') + U.esc(t('newProject')) + '</button></div>';
  if (!p) {
    html += MSA.empty('briefcase', t('active.empty'), t('active.emptySub')) +
      '<div style="text-align:center;margin-top:16px"><button class="btn primary" data-act="new">' + I('plus', 'sm') + U.esc(t('newProject')) + '</button></div>';
    host.innerHTML = html; bind(host); return;
  }
  html += '<div class="tabs-scroll">' + act.map(x => { const pr = P.progress(x); return '<button class="ptab ' + (x.id === p.id ? 'on' : '') + '" data-act="pick" data-id="' + x.id + '"><span class="n">' + U.esc(x.name) + '</span><span class="pct">' + pr.pct + '%</span></button>'; }).join('') + '</div>';
  const pr = P.progress(p);
  html += '<div class="card proj-top"><div class="row" style="justify-content:space-between;margin-bottom:12px"><div><h2>' + U.esc(p.name) + '</h2><button class="chip clchip" data-act="pclient">' + I('user', 'xs') + '<span>' + U.esc(MSA.clients.of(p) || MSA.T('تعيين عميل', 'Set client')) + '</span></button></div>' +
    '<div class="row">' + (tab() === 'plan' && mode() === 'map' ? '<button class="btn sm' + (P.mapEditing && P.mapEditing() ? ' primary' : '') + '" data-act="medit">' + I('pencil', 'sm') + '<span>' + U.esc(t('map.edit')) + '</span></button>' : '') + (tab() === 'plan' ? '<div class="seg" role="tablist"><button data-act="pview" data-v="map" class="' + (mode() === 'map' ? 'on' : '') + '">' + I('layers', 'sm') + U.esc(t('view.map')) + '</button><button data-act="pview" data-v="list" class="' + (mode() === 'list' ? 'on' : '') + '">' + I('list', 'sm') + U.esc(t('view.list')) + '</button></div><button class="btn sm" data-act="addstep">' + I('plus', 'sm') + U.esc(t('addStep')) + '</button>' + '<button class="btn sm" data-act="savetpl" title="' + U.esc(MSA.T('حفظ كقالب','Save as template')) + '">' + I('copy', 'sm') + '</button>' : '') +
    (tab() === 'plan' ? '<button class="btn sm" data-act="dl" title="' + U.esc(MSA.T('مواعيد المراحل', 'Stage deadlines')) + '">' + I('calendar', 'sm') + '<span>' + U.esc(p.deliver ? MSA.fmtDate(U.toMs(p.deliver + 'T00:00')) : MSA.T('مواعيد المراحل', 'Deadlines')) + '</span></button>' : '') + '<button class="btn sm" data-act="pmsg" title="' + U.esc(MSA.T('رسائل جاهزة', 'Ready messages')) + '">' + I('mail', 'sm') + '<span>' + U.esc(MSA.T('رسائل', 'Messages')) + '</span></button>' +
    '<button class="btn sm" data-act="rename">' + I('pencil', 'sm') + '</button>' +
    '<button class="btn sm danger" data-act="delproj">' + I('trash', 'sm') + '</button>' +
    '<button class="btn sm primary" data-act="complete">' + I('trophy', 'sm') + U.esc(t('markComplete')) + '</button></div></div>' +
    '<div class="row" style="gap:12px"><div class="progress grow"><i style="width:' + pr.pct + '%"></i></div><span class="muted" style="font-size:13px;white-space:nowrap">' + U.esc(t('stepsDone', { a: pr.done, b: pr.total })) + ' · ' + pr.pct + '%</span></div></div>';
  html += MSA.studio.tabBar(tab(), p);
  if (tab() !== 'plan') html += '<div id="stHost"></div>';
  else if (!p.steps.length) html += MSA.empty('list', t('noSteps'), t('noStepsSub'));
  else if (mode() === 'map') html += '<div id="mapHost"></div>';
  else html += '<div class="steps">' + p.steps.map(s => stepHTML(s, 0)).join('') + '</div>';
  host.innerHTML = html; MSA.apps.hydrate(host);
  if (tab() !== 'plan') MSA.studio.render(tab(), p, host.querySelector('#stHost'));
  else if (p.steps.length && mode() === 'map') P.renderMap(host.querySelector('#mapHost'), p);
  bind(host);
}

function bind(host){
  if (host._bound) return; host._bound = true;
  const p = () => current();
  MSA.studio.refreshTabs = () => { const b = host.querySelector('.stab'); if (b && p()) b.outerHTML = MSA.studio.tabBar(tab(), p()); };
  const refresh = () => { MSA.save(); MSA.updateCounts(); MSA.rerender(); };
  const stepOf = el => { const row = el.closest('[data-step]'); return row ? P.find(p().steps, row.dataset.step) : null; };
  MSA.on(host, {
    new: () => newProject(),
    ptab: el => { MSA.state.ui.ptab = el.dataset.t; MSA.save(); P.mapReset && P.mapReset(); MSA.rerender(false); },
    savetpl: async () => { const n = await MSA.ask({ title: MSA.T('اسم القالب','Template name'), value: p().name }); if (!n) return; const strip = l => l.map(s => ({ title: s.title || P.title(s), key: s.key, children: strip(s.children) })); (MSA.state.templates = MSA.state.templates || []).push({ id: U.uid('tp'), name: n, steps: strip(p().steps) }); MSA.save(); MSA.toast(MSA.T('اتحفظ القالب — هتلاقيه في «مشروع جديد»','Template saved — find it in “New project”'), 'ok'); },
    medit: () => { P.mapToggleEdit(); MSA.rerender(); },
    dl: () => MSA.plus && MSA.plus.deadlines(p()),
    pmsg: () => MSA.plus && MSA.plus.messages({ pid: p().id, kind: 'follow' }),
    pclient: async () => { const pr = p(), v = await MSA.clients.pick(MSA.clients.of(pr), MSA.T('العميل', 'Client')); if (v == null) return; pr.client = v; if (pr.time) pr.time.client = v; if (v) MSA.clients.ensure(v); MSA.save(); MSA.rerender(false); if (v && MSA.plus && MSA.plus.autoIdent) MSA.plus.autoIdent(pr); },
    pview: el => { MSA.state.ui.projView = el.dataset.v; MSA.save(); MSA.rerender(); },
    pick: el => { P.mapReset && P.mapReset(); MSA.state.ui.project = el.dataset.id; MSA.save(); MSA.rerender(false); },
    toggle: (el) => { const r = stepOf(el); if (!r) return; P.setDone(r.step, el.checked); refresh(); if (el.checked && P.progress(p()).pct === 100) MSA.toast(t('allDone'), 'ok', 3600); },
    add: async el => { const r = stepOf(el); if (!r) return; const atts = await MSA.addFiles(el.dataset.kind); if (atts.length) { r.step.atts.push(...atts); refresh(); } },
    apps: el => { const r = stepOf(el); if (r) MSA.apps.pick(r.step, () => { MSA.save(); MSA.rerender(true); }); },
    board: el => { const r = stepOf(el); if (r) MSA.board.open(p(), r.step); },
    sug: el => { const r = stepOf(el); if (r && MSA.suggest) MSA.suggest.open(p(), r.step); },
    identity: () => { if (MSA.suggest) MSA.suggest.openIdentity(p()); },
    tips: el => { const r = stepOf(el); if (!r) return; MSA.tips.toggle(r.step); MSA.rerender(true); },
    tip: el => { const r = stepOf(el); if (r) MSA.tips.tick(r.step, el.dataset.k, el); },
    note: el => { const r = stepOf(el); if (!r) return; if (openNotes.has(r.step.id) && !r.step.note) openNotes.delete(r.step.id); else openNotes.add(r.step.id); MSA.rerender(); setTimeout(() => { const ta = $('[data-step="' + r.step.id + '"] textarea[data-note]'); ta && ta.focus(); }, 30); },
    more: (el, e) => {
      const r = stepOf(el); if (!r) return; const rc = el.getBoundingClientRect();
      MSA.ctx(rc.left, rc.bottom + 4, [
        { icon: 'pencil', label: t('rename'), onClick: async () => { const v = await MSA.ask({ title: t('rename'), value: P.title(r.step) }); if (v) { r.step.title = v; refresh(); } } },
        { icon: 'grid', label: MSA.T('البرامج المستخدمة', 'Programs used'), onClick: () => MSA.apps.pick(r.step, () => { MSA.save(); MSA.rerender(true); }) },
        { icon: 'layers', label: MSA.T('فتح كمود بورد', 'Open as moodboard'), onClick: () => MSA.board.open(p(), r.step) },
        { icon: 'plus', label: t('addSubStep'), onClick: async () => { const v = await MSA.ask({ title: t('addSubStep'), placeholder: t('stepName') }); if (v) { r.step.children.push({ id: U.uid('s'), key: null, title: v, done: false, note: '', atts: [], children: [] }); r.step.done = false; refresh(); } } },
        { icon: 'chev-u', label: t('moveUp'), onClick: () => { if (r.index > 0) { const [x] = r.list.splice(r.index, 1); r.list.splice(r.index - 1, 0, x); refresh(); } } },
        { icon: 'chev-d', label: t('moveDown'), onClick: () => { if (r.index < r.list.length - 1) { const [x] = r.list.splice(r.index, 1); r.list.splice(r.index + 1, 0, x); refresh(); } } },
        '-',
        { icon: 'trash', label: t('delete'), danger: true, onClick: async () => { if (await MSA.confirm(t('delStepQ', { n: P.title(r.step) }), { danger: true, okLabel: t('delete') })) { const atts = P.ownedAtts([r.step]); r.list.splice(r.index, 1); await MSA.files.delMany(atts); refresh(); } } }
      ]);
    },
    addstep: async () => { const v = await MSA.ask({ title: t('addStep'), placeholder: t('stepName') }); if (v) { p().steps.push({ id: U.uid('s'), key: null, title: v, done: false, note: '', atts: [], children: [] }); refresh(); } },
    rename: async () => { const v = await MSA.ask({ title: t('renameProject'), value: p().name }); if (v) { p().name = v; refresh(); } },
    delproj: async () => { const pr = p(); if (await MSA.confirm(t('delProjQ', { n: pr.name }), { danger: true, okLabel: t('delete') })) { await MSA.files.delMany(P.ownedAtts(pr.steps)); MSA.state.projects = MSA.state.projects.filter(x => x.id !== pr.id); MSA.state.ui.project = null; refresh(); } },
    complete: async () => {
      const pr = p(), g = P.progress(pr);
      const msg = g.pct < 100 ? t('completeQPartial', { n: pr.name, p: g.pct }) : t('completeQ', { n: pr.name });
      if (!await MSA.confirm(msg, { okLabel: t('markComplete') })) return;
      if (!MSA.clients.of(pr)) { const v = await MSA.clients.pick('', MSA.T('لأي عميل هذا المشروع؟', 'Which client is this project for?')); if (v) { pr.client = v; MSA.clients.ensure(v); } }
      pr.status = 'done'; pr.completedAt = Date.now(); MSA.state.ui.project = null; refresh();
      MSA.toast(t('movedToDone'), 'ok', 3200);
    }
  });
  host.addEventListener('input', e => {
    const ta = e.target.closest('textarea[data-note]'); if (!ta) return;
    const r = P.find(p().steps, ta.closest('[data-step]').dataset.step); if (r) { r.step.note = ta.value; MSA.save(); }
  });
  MSA.bindAtts(host,
    id => { const x = P.walkFind(p().steps, id); return x ? x.atts : null; },
    async id => { const x = P.walkFind(p().steps, id); if (!x) return; if (!await MSA.confirm(t('delFileQ'), { danger: true, okLabel: t('delete') })) return; x.atts = x.atts.filter(a => a.id !== id); await MSA.files.del(id); refresh(); });
}
P.walkFind = function(list, attId){ let hit = null; P.walk(list, s => { if (!hit && s.atts.some(a => a.id === attId)) hit = s; }); return hit; };

function newProject(){
  const TP = MSA.tpl, mine = MSA.state.templates || [];
  const items = [
    { id: 'campaign', cat: 'id', icon: 'list', name: t('tpl.campaign'), desc: t('tpl.campaignHint'), n: P.makeSteps('campaign').flatMap(P.leaves).length },
    ...TP.TYPES.map(d => ({ id: 'type:' + d[0], cat: d[1], icon: d[2], name: TP.name(d), desc: TP.desc(d), n: TP.count(d) })),
    ...mine.map(x => ({ id: 'tpl:' + x.id, cat: 'mine', icon: 'copy', name: x.name, desc: MSA.T('قالب محفوظ', 'Saved template'), n: x.steps.length })),
    { id: 'blank', cat: 'oth', icon: 'file', name: t('tpl.blank'), desc: t('tpl.blankHint'), n: 0 }
  ];
  const cats = TP.CATS.map(c => [c[0], TP.catName(c)]); if (mine.length) cats.push(['mine', MSA.T('قوالبي', 'My templates')]);
  let cat = 'all', q = '', pick = 'campaign';
  const m = MSA.modal({
    title: t('newProject'), size: 'wide',
    body: '<div class="field"><label class="f">' + U.esc(t('projectName')) + '</label><input id="npName" type="text" placeholder="' + U.esc(t('projectNamePh')) + '"></div>' +
      '<div class="field"><label class="f">' + U.esc(MSA.T('العميل (اختياري)', 'Client (optional)')) + '</label><input id="npClient" type="text" dir="auto" list="npCl" autocomplete="off" placeholder="' + U.esc(MSA.T('اختر عميلًا أو اكتب اسمًا جديدًا', 'Pick a client or type a new name')) + '"><datalist id="npCl">' + MSA.clients.names().map(n => '<option value="' + U.esc(n) + '">').join('') + '</datalist></div>' +
      '<div class="field" style="margin:0"><label class="f">' + U.esc(MSA.T('نوع المشروع — لكل نوع خريطة مراحل مناسبة له', 'Project type — each one comes with its own logical stage map')) + '</label>' +
      '<div class="row" style="gap:8px;margin-bottom:8px"><input type="search" id="npQ" class="grow" placeholder="' + U.esc(MSA.T('ابحث: لوجو، منيو، ريلز…', 'Search: logo, menu, reel…')) + '"></div>' +
      '<div class="tabs-scroll" id="npCats">' + cats.map((c, i) => '<button class="pchip' + (i ? '' : ' on') + '" data-c="' + c[0] + '">' + U.esc(c[1]) + '</button>').join('') + '</div>' +
      '<div class="tpick" id="npGrid"></div><div class="hint" id="npHint" style="margin-top:8px"></div>' +
      '<div class="tlegend" id="npLeg">' + Object.keys(TP.PH).map(k => '<span><i style="background:' + TP.PH[k][0] + '"></i>' + U.esc(TP.phaseName(k)) + '</span>').join('') + '</div></div>',
    buttons: [
      { label: t('cancel'), cls: 'ghost', onClick: a => a.close() },
      { label: t('create'), cls: 'primary', icon: 'plus', onClick: a => {
        const name = $('#npName', a.el).value.trim(); if (!name) { $('#npName', a.el).focus(); return; }
        const pr = { id: U.uid('p'), name, created: Date.now(), status: 'active', steps: [] }; const cl = $('#npClient', a.el).value.trim(); if (cl) { pr.client = cl; MSA.clients.ensure(cl); }
        if (pick.indexOf('type:') === 0) { const r = TP.make(pick.slice(5)); pr.steps = r.steps; pr.graph = r.graph; pr.type = pick.slice(5); }
        else pr.steps = P.makeSteps(pick);
        MSA.state.projects.unshift(pr); MSA.state.ui.project = pr.id; MSA.state.ui.ptab = 'plan'; MSA.state.ui.projView = 'map'; MSA.save(); MSA.updateCounts(); a.close(); if (cl && MSA.plus && MSA.plus.autoIdent) MSA.plus.autoIdent(pr);
        if (MSA.view !== 'active') MSA.go('active'); else MSA.rerender(false);
      } }
    ],
    onMount: el => {
      setTimeout(() => $('#npName', el).focus(), 30);
      const grid = $('#npGrid', el);
      const draw = () => {
        const list = items.filter(x => (cat === 'all' || x.cat === cat) && (!q || (x.name + ' ' + x.desc).toLowerCase().includes(q)));
        grid.innerHTML = list.map(x => '<button class="tcard' + (pick === x.id ? ' on' : '') + '" data-k="' + U.esc(x.id) + '">' + I(x.icon, 'sm') + '<span class="tn" dir="auto">' + U.esc(x.name) + '</span>' + (x.n ? '<span class="tc">' + x.n + ' ' + U.esc(MSA.T('مرحلة', 'stages')) + '</span>' : '') + '</button>').join('') || '<div class="hint">' + U.esc(MSA.T('لا نتائج', 'No matches')) + '</div>';
        const cur = items.find(x => x.id === pick); $('#npHint', el).textContent = cur ? cur.name + ' — ' + cur.desc : '';
        $('#npLeg', el).style.display = pick.indexOf('type:') === 0 ? '' : 'none';
      };
      grid.onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; pick = b.dataset.k; draw(); };
      $('#npCats', el).onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; cat = b.dataset.c; $$('#npCats button', el).forEach(x => x.classList.toggle('on', x === b)); draw(); };
      $('#npQ', el).oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
      $('#npName', el).addEventListener('keydown', e => { if (e.key === 'Enter') $('.btn.primary', el).click(); });
      draw();
    }
  });
}
MSA.newProject = newProject;
MSA.views.active = { render };
})();

