/* Growth toolkit: leads pipeline, post-delivery follow-up, 3-package quotes, portfolio builder and the "where do I stand" dashboard.
   Every piece is mounted in its own section by the module that owns that section (clients, completed projects, pricing tab, reports, messages). */
(function(){
'use strict';
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc, S = () => MSA.state;
const en = () => S().settings.lang === 'en';
const today = () => U.dateKey(new Date());
const G = MSA.growth = {};
const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; };
const nf = n => Math.round(n).toLocaleString(en() ? 'en-US' : 'ar-EG');
const toEGP = (a, cur) => { try { return !cur || cur === 'EGP' ? a : (MSA.rates && MSA.rates.has(cur) ? MSA.rates.toEGP(a, cur) : a); } catch (e) { return a; } };
const addDays = (key, n) => { const d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return U.dateKey(d); };
const plus = () => MSA.plus || {};
const ym = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
const slug = s => String(s || 'file').replace(/[^\w؀-ۿ]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'file';
const norm = s => String(s || '').trim().toLowerCase();

/* ================================================================ tasks helpers */
function addTask(o){
  const mk = plus().mkTask; if (!mk) return null;
  const t = mk(Object.assign({ tags: [T('نمو', 'growth')] }, o));
  S().tasks.unshift(t); return t;
}
const findTask = pred => (S().tasks || []).find(pred);
function dropTasks(pred){ const keep = []; let n = 0; (S().tasks || []).forEach(t => { if (pred(t) && t.status !== 'done') n++; else keep.push(t); }); if (n) S().tasks = keep; return n; }
function doneTask(pred){ (S().tasks || []).forEach(t => { if (pred(t) && t.status !== 'done') { t.status = 'done'; t.completedAt = Date.now(); } }); }
const refreshTasks = () => { if (MSA.updateCounts) MSA.updateCounts(); if (MSA.view === 'tasks' || MSA.view === 'home') MSA.rerender(true); };

/* ================================================================ 1) LEADS */
const STAGES = [
  ['new', 'سؤال جديد', 'New inquiry', '#5b8def'],
  ['quoted', 'اتبعتله عرض', 'Quote sent', '#9b6bff'],
  ['wait', 'مستني ردّه', 'Waiting', '#f0b43c'],
  ['won', 'اتفقنا ✓', 'Won', '#3ccf91'],
  ['lost', 'ضاع', 'Lost', '#8a8a86']
];
const stName = k => { const s = STAGES.find(x => x[0] === k) || STAGES[0]; return T(s[1], s[2]); };
const stCol = k => (STAGES.find(x => x[0] === k) || STAGES[0])[3];
const isOpen = l => l.stage !== 'won' && l.stage !== 'lost';
const leads = () => S().leads || (S().leads = []);
const srcList = () => (MSA.clients && MSA.clients.SRC) || ['Behance', 'Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Mostaql', 'Khamsat', 'Fiverr', 'Upwork', T('ترشيح من عميل', 'Referral'), T('أخرى', 'Other')];
const leadOf = name => { const k = norm(name); return k ? leads().find(l => norm(l.name) === k) : null; };
G.leads = leads; G.STAGES = STAGES;
G.phoneOf = name => { const l = leadOf(name); return l ? (l.phone || '') : ''; };
G.touch = name => { const l = leadOf(name); if (!l) return false; l.last = today(); hist(l, T('تواصل', 'Contacted')); MSA.save(); return true; };
function hist(l, text){ (l.hist = l.hist || []).push({ ts: Date.now(), text }); }

function syncLeadTask(l){
  const match = t => t.src && t.src.lead === l.id && t.src.k === 'fu';
  if (isOpen(l) && l.next) {
    const due = l.next + 'T10:00', ex = findTask(t => match(t) && t.status !== 'done');
    const title = T('متابعة عميل محتمل: ', 'Follow up with lead: ') + l.name;
    const desc = T('المرحلة: ' + stName(l.stage) + (l.service ? ' · ' + l.service : '') + '. افتح «العملاء المحتملين» وابعت رسالة متابعة جاهزة.', 'Stage: ' + stName(l.stage) + (l.service ? ' · ' + l.service : '') + '. Open “Leads” and send a ready follow-up message.');
    if (ex) { ex.due = due; ex.title = title; ex.desc = desc; ex.updated = Date.now(); ex.notified = false; }
    else addTask({ title, desc, due, priority: 'high', src: { lead: l.id, k: 'fu' } });
  } else dropTasks(match);
}
function saveLead(l){ syncLeadTask(l); MSA.save(); refreshTasks(); }

function leadForm(l, done){
  const isNew = !l; l = l || { id: U.uid('ld'), name: '', phone: '', source: '', service: '', value: 0, cur: 'EGP', stage: 'new', created: Date.now(), next: addDays(today(), 2), notes: '', hist: [] };
  const cur = (MSA.rates && MSA.rates.pricing) ? MSA.rates.pricing([l.cur]) : ['EGP', 'USD'];
  MSA.modal({
    title: isNew ? T('عميل محتمل جديد', 'New lead') : T('تعديل العميل المحتمل', 'Edit lead'), size: 'wide',
    body: '<div class="st-grid">' +
      '<div class="field"><label class="f">' + esc(T('الاسم', 'Name')) + '</label><input id="ldName" type="text" dir="auto" value="' + esc(l.name) + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('واتساب / تليفون', 'WhatsApp / phone')) + '</label><input id="ldPhone" type="tel" dir="ltr" value="' + esc(l.phone || '') + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('جه منين؟ (المصدر)', 'Where from? (source)')) + '</label><input id="ldSrc" type="text" dir="auto" list="ldSrcL" value="' + esc(l.source || '') + '"><datalist id="ldSrcL">' + srcList().map(x => '<option value="' + esc(x) + '">').join('') + '</datalist></div>' +
      '<div class="field"><label class="f">' + esc(T('الخدمة المطلوبة', 'Requested service')) + '</label><input id="ldSvc" type="text" dir="auto" value="' + esc(l.service || '') + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('القيمة المتوقعة', 'Expected value')) + '</label><input id="ldVal" type="number" min="0" value="' + (l.value || '') + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('العملة', 'Currency')) + '</label><select id="ldCur">' + cur.map(c => '<option ' + (c === l.cur ? 'selected' : '') + '>' + c + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="f">' + esc(T('المرحلة', 'Stage')) + '</label><select id="ldStage">' + STAGES.map(s => '<option value="' + s[0] + '"' + (s[0] === l.stage ? ' selected' : '') + '>' + esc(T(s[1], s[2])) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="f">' + esc(T('موعد المتابعة (يتحوّل لمهمة)', 'Follow-up date (becomes a task)')) + '</label><input id="ldNext" type="date" value="' + esc(l.next || '') + '"></div></div>' +
      '<div class="field"><label class="f">' + esc(T('ملاحظات', 'Notes')) + '</label><textarea id="ldNotes" dir="auto" rows="3">' + esc(l.notes || '') + '</textarea></div>',
    buttons: [
      { label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() },
      { label: T('حفظ', 'Save'), cls: 'primary', icon: 'check', onClick: a => {
        const g = id => $('#' + id, a.el).value.trim(), name = g('ldName'); if (!name) { $('#ldName', a.el).focus(); return; }
        const prev = l.stage, nx = g('ldStage');
        Object.assign(l, { name, phone: g('ldPhone'), source: g('ldSrc'), service: g('ldSvc'), value: num(g('ldVal')), cur: g('ldCur') || 'EGP', stage: nx, next: g('ldNext'), notes: $('#ldNotes', a.el).value });
        if (isNew) { hist(l, T('أُضيف', 'Added')); leads().unshift(l); } else if (prev !== nx) hist(l, T('المرحلة: ', 'Stage: ') + stName(nx));
        if (nx === 'won' || nx === 'lost') l.closed = l.closed || Date.now(); else delete l.closed;
        if (nx === 'won' && prev !== 'won') l.wonAt = Date.now();
        saveLead(l); a.close(); if (done) done(l, prev !== nx && nx === 'won');
      } }
    ],
    onMount: el => setTimeout(() => $('#ldName', el).focus(), 30)
  });
}
G.leadForm = leadForm;

/* won -> client (+ optional project) */
G.convert = async function(l, thenProject){
  if (!l) return;
  const c = MSA.clients.ensure(l.name, { source: l.source || '', service: l.service || '', phone: l.phone || '', wa: l.phone || '', status: T('نشط', 'Active') });
  if (c) { if (!c.c.source && l.source) c.c.source = l.source; if (!c.c.phone && l.phone) { c.c.phone = l.phone; c.c.wa = l.phone; } if (!c.c.service && l.service) c.c.service = l.service; if (l.notes && !c.c.notes) c.c.notes = l.notes; }
  l.stage = 'won'; l.client = l.name; l.converted = Date.now(); l.wonAt = l.wonAt || Date.now(); l.closed = l.closed || Date.now(); hist(l, T('تحوّل لعميل', 'Converted to client'));
  saveLead(l); MSA.toast(T('اتضاف «' + l.name + '» في شيت العملاء' + (l.source ? ' (المصدر: ' + l.source + ')' : ''), '“' + l.name + '” added to the client sheet'), 'ok');
  if (thenProject && MSA.newProject) MSA.newProject({ client: l.name });
};
function wonPrompt(l){
  MSA.modal({
    title: T('مبروك! 🎉 اتفقتم', 'Congrats! 🎉 Deal won'), size: '',
    body: '<p style="margin:0 0 6px" dir="auto">' + esc(T('تحب نحوّل «' + l.name + '» لعميل في الشيت ونبدأ مشروعه؟', 'Turn “' + l.name + '” into a client and start the project?')) + '</p><div class="hint">' + esc(T('المصدر والخدمة والرقم بينتقلوا تلقائيًا.', 'Source, service and number are copied over.')) + '</div>',
    buttons: [
      { label: T('لاحقًا', 'Later'), cls: 'ghost', onClick: a => a.close() },
      { label: T('حوّل لعميل بس', 'Client only'), onClick: a => { a.close(); G.convert(l, false).then(() => { if (MSA.view === 'leads') MSA.rerender(true); }); } },
      { label: T('حوّل وابدأ مشروع', 'Convert + start project'), cls: 'primary', icon: 'plus', onClick: a => { a.close(); G.convert(l, true).then(() => { if (MSA.view === 'leads') MSA.rerender(true); }); } }
    ]
  });
}

function stats(){
  const L = leads(), open = L.filter(isOpen), won = L.filter(l => l.stage === 'won'), lost = L.filter(l => l.stage === 'lost');
  const val = open.reduce((a, l) => a + toEGP(num(l.value), l.cur), 0), late = open.filter(l => l.next && l.next < today()).length;
  const closed = won.length + lost.length;
  return { total: L.length, open: open.length, won: won.length, lost: lost.length, val, late, rate: closed ? Math.round(won.length / closed * 100) : null };
}
G.stats = stats;

function leadsRender(host){
  const ui = S().ui; const F = ui.leadF = ui.leadF || { st: '', q: '' };
  const all = leads().slice(); const st = stats();
  const list = all.filter(l => (!F.st || (F.st === 'open' ? isOpen(l) : l.stage === F.st)) && (!F.q || norm([l.name, l.source, l.service, l.notes, l.phone].join(' ')).includes(norm(F.q))));
  list.sort((a, b) => (isOpen(b) - isOpen(a)) || (a.next || '9999').localeCompare(b.next || '9999') || (b.created || 0) - (a.created || 0));
  const kpi = (ic, v, l, c) => '<div class="rp-k" style="--c:' + c + '">' + I(ic) + '<b>' + v + '</b><span>' + esc(l) + '</span></div>';
  const fchips = [['', T('الكل', 'All'), all.length], ['open', T('مفتوحة', 'Open'), st.open]].concat(STAGES.map(s => [s[0], T(s[1], s[2]), all.filter(l => l.stage === s[0]).length]));
  host.innerHTML = '<div class="page-head"><div><h1>' + I('flag', 'lg') + esc(T('العملاء المحتملين', 'Leads')) + '</h1><div class="sub">' + esc(T('كل واحد سأل عن شغلك — تابعه لحد ما يتحوّل لعميل', 'Everyone who asked about your work — follow up until they become a client')) + '</div></div></div>' +
    '<div class="row cs-tabs"><button class="btn sm" data-gr="done">' + I('trophy', 'sm') + '<span>' + esc(T('المشاريع المكتملة', 'Completed projects')) + '</span></button><button class="btn sm" data-gr="clients">' + I('user', 'sm') + '<span>' + esc(T('شيت العملاء', 'Clients sheet')) + '</span></button><button class="btn sm primary" disabled>' + I('flag', 'sm') + '<span>' + esc(T('العملاء المحتملين', 'Leads')) + '</span></button></div>' +
    '<div class="rp-kpis gr-k">' + kpi('flag', nf(st.open), T('مفتوحة دلوقتي', 'Open now'), '#5b8def') + kpi('trend', nf(st.val), T('قيمة المفتوحة (ج.م)', 'Open value (EGP)'), '#9b6bff') + kpi('trophy', st.rate == null ? '—' : st.rate + '٪', T('نسبة التحويل', 'Win rate'), '#3ccf91') + kpi('bell', nf(st.late), T('متابعة فاتت ميعادها', 'Overdue follow-ups'), st.late ? '#ef7b45' : '#8a8a86') + '</div>' +
    '<div class="row" style="margin:6px 0 10px"><div class="cs-search grow">' + I('search', 'sm') + '<input type="search" id="ldQ" dir="auto" value="' + esc(F.q) + '" placeholder="' + esc(T('ابحث بالاسم أو المصدر أو الخدمة…', 'Search name, source or service…')) + '"></div><button class="btn primary" data-gr="new">' + I('plus', 'sm') + '<span>' + esc(T('عميل محتمل', 'New lead')) + '</span></button></div>' +
    '<div class="pchips" style="margin:0 0 12px">' + fchips.map(c => '<button class="pchip' + (F.st === c[0] ? ' on' : '') + '" data-gr="f" data-v="' + c[0] + '">' + esc(c[1]) + ' · ' + c[2] + '</button>').join('') + '</div>' +
    (list.length ? '<div class="gr-list">' + list.map(l => {
      const late = isOpen(l) && l.next && l.next < today();
      return '<div class="card gr-lead" data-id="' + l.id + '" style="--sc:' + stCol(l.stage) + '"><div class="gr-lh"><b dir="auto" class="gr-n">' + esc(l.name) + '</b><button class="gr-stage" data-gr="stage" data-id="' + l.id + '" title="' + esc(T('غيّر المرحلة', 'Change stage')) + '">' + esc(stName(l.stage)) + '</button></div>' +
        '<div class="gr-meta">' + (l.source ? '<span class="tag">' + esc(l.source) + '</span>' : '') + (l.service ? '<span dir="auto">' + esc(l.service) + '</span>' : '') + (l.value ? '<span dir="ltr"><b>' + nf(l.value) + ' ' + esc(l.cur || '') + '</b></span>' : '') + '</div>' +
        '<div class="gr-meta hint">' + (l.next && isOpen(l) ? '<span class="' + (late ? 'gr-late' : '') + '">' + I('calendar', 'xs') + ' ' + esc(T('متابعة', 'Follow-up')) + ': ' + esc(l.next) + (late ? ' · ' + esc(T('فات الميعاد', 'overdue')) : '') + '</span>' : '') + (l.last ? '<span>' + esc(T('آخر تواصل', 'Last contact')) + ': ' + esc(l.last) + '</span>' : '') + (l.converted ? '<span class="gr-ok">' + I('check', 'xs') + ' ' + esc(T('اتحوّل لعميل', 'Now a client')) + '</span>' : '') + '</div>' +
        (l.notes ? '<div class="gr-nt" dir="auto">' + esc(l.notes) + '</div>' : '') +
        '<div class="row gr-act"><button class="btn sm" data-gr="msg" data-id="' + l.id + '">' + I('mail', 'sm') + '<span>' + esc(T('رسالة جاهزة', 'Ready message')) + '</span></button><button class="btn sm" data-gr="log" data-id="' + l.id + '">' + I('note', 'sm') + '<span>' + esc(T('سجّل تواصل', 'Log contact')) + '</span></button>' +
        (l.stage === 'won' && !l.converted ? '<button class="btn sm primary" data-gr="conv" data-id="' + l.id + '">' + I('user', 'sm') + '<span>' + esc(T('حوّل لعميل', 'Make client')) + '</span></button>' : '') + (l.converted ? '<button class="btn sm" data-gr="proj" data-id="' + l.id + '">' + I('plus', 'sm') + '<span>' + esc(T('ابدأ مشروع', 'Start project')) + '</span></button>' : '') +
        '<span class="grow"></span><button class="icon-btn sm" data-gr="hist" data-id="' + l.id + '" title="' + esc(T('السجل', 'History')) + '">' + I('clock', 'sm') + '</button><button class="icon-btn sm" data-gr="edit" data-id="' + l.id + '" title="' + esc(T('تعديل', 'Edit')) + '">' + I('pencil', 'sm') + '</button><button class="icon-btn sm danger" data-gr="del" data-id="' + l.id + '" title="' + esc(T('حذف', 'Delete')) + '">' + I('trash', 'sm') + '</button></div></div>';
    }).join('') + '</div>' : '<div class="cs-empty">' + I('user') + '<div>' + esc(all.length ? T('لا نتائج مطابقة', 'No matching leads') : T('لسه مفيش عملاء محتملين — سجّل أول واحد سأل عن شغلك', 'No leads yet — add the first person who asked about your work')) + '</div></div>');
  const again = () => { MSA.save(); MSA.rerender(true); };
  host.onclick = async e => {
    const b = e.target.closest('[data-gr]'); if (!b) return; const a = b.dataset.gr, l = leads().find(x => x.id === b.dataset.id);
    if (a === 'done') { S().ui.doneClient = null; MSA.go('done'); }
    else if (a === 'clients') MSA.go('clients');
    else if (a === 'new') leadForm(null, (n, won) => { MSA.rerender(true); if (won) wonPrompt(n); });
    else if (a === 'f') { F.st = b.dataset.v; again(); }
    else if (a === 'edit' && l) leadForm(l, (n, won) => { MSA.rerender(true); if (won && !n.converted) wonPrompt(n); });
    else if (a === 'stage' && l) { const rc = b.getBoundingClientRect(); MSA.ctx(rc.left, rc.bottom + 4, STAGES.map(s => ({ label: T(s[1], s[2]), onClick: () => {
      if (l.stage === s[0]) return; l.stage = s[0]; hist(l, T('المرحلة: ', 'Stage: ') + stName(s[0]));
      if (s[0] === 'won' || s[0] === 'lost') l.closed = Date.now(); else delete l.closed; if (s[0] === 'won') l.wonAt = Date.now();
      if (s[0] === 'quoted' && !l.next) l.next = addDays(today(), 3);
      saveLead(l); MSA.rerender(true); if (s[0] === 'won' && !l.converted) wonPrompt(l); } }))); }
    else if (a === 'del' && l) { if (!await MSA.confirm(T('حذف «' + l.name + '» من العملاء المحتملين؟', 'Delete “' + l.name + '” from leads?'), { danger: true, okLabel: T('حذف', 'Delete') })) return; dropTasks(t => t.src && t.src.lead === l.id); S().leads = leads().filter(x => x !== l); again(); refreshTasks(); }
    else if (a === 'msg' && l) plus().messages && plus().messages({ client: l.name, kind: l.stage === 'quoted' || l.stage === 'wait' ? 'quoteFollow' : 'intro' });
    else if (a === 'log' && l) { const v = await MSA.ask({ title: T('سجّل تواصل مع ', 'Log contact with ') + l.name, label: T('اتكلمتوا في إيه؟ (اختياري)', 'What was discussed? (optional)'), multiline: true, required: false }); if (v == null) return; l.last = today(); hist(l, T('تواصل', 'Contact') + (v ? ': ' + v : '')); if (isOpen(l)) l.next = addDays(today(), 3); saveLead(l); MSA.toast(T('اتسجّل — والمتابعة الجاية بعد 3 أيام', 'Logged — next follow-up in 3 days'), 'ok'); MSA.rerender(true); }
    else if (a === 'hist' && l) MSA.modal({ title: T('سجل ', 'History: ') + l.name, size: '', body: '<div class="gr-hist">' + ((l.hist || []).slice().reverse().map(h => '<div><span class="hint" dir="ltr">' + esc(new Date(h.ts).toLocaleString(en() ? 'en-GB' : 'ar-EG', { dateStyle: 'medium', timeStyle: 'short' })) + '</span><div dir="auto">' + esc(h.text) + '</div></div>').join('') || '<div class="hint">—</div>') + '</div>', buttons: [{ label: T('تمام', 'OK'), cls: 'primary', onClick: x => x.close() }] });
    else if (a === 'conv' && l) { await G.convert(l, false); MSA.rerender(true); }
    else if (a === 'proj' && l) MSA.newProject && MSA.newProject({ client: l.name });
  };
  const q = $('#ldQ', host);
  if (q) q.oninput = () => { clearTimeout(q._t); q._t = setTimeout(() => { F.q = q.value; MSA.rerender(true); const n = $('#ldQ', host); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); };
}
MSA.views.leads = { render: leadsRender };

/* ================================================================ 2) POST-DELIVERY FOLLOW-UP */
const GR = () => { const s = S(); return s.growth = s.growth || {}; };
const clientOf = p => (MSA.clients && MSA.clients.of ? MSA.clients.of(p) : p.client) || '';
function msgFor(kind, p){
  const prof = S().profile; if (!plus().msgText) return '';
  return plus().msgText(kind, en() ? 'en' : 'ar', { client: clientOf(p), project: p.name, me: prof.name || '' });
}
function afterTasks(p){
  const A = p.after, c = clientOf(p), base = U.dateKey(new Date(p.completedAt || Date.now()));
  const mk = (k, days, kind, ar, e) => {
    const t = addTask({ title: T(ar + ': ', e + ': ') + c + ' — ' + p.name, desc: msgFor(kind, p), due: addDays(base, days) + 'T10:00', priority: 'normal', src: { after: p.id, k } });
    A[k] = t ? t.id : null;
  };
  mk('w1', 7, 'feedback', 'بعد التسليم بأسبوع — اسأله عن رأيه واطلب تقييم', '1 week after delivery — ask for feedback & a review');
  mk('m1', 30, 'referral', 'بعد التسليم بشهر — اطلب ترشيح لعميل تاني', '1 month after delivery — ask for a referral');
}
G.enableAfter = function(p, silent){
  if (!p || p.after || !clientOf(p)) return false;
  delete p.afterOff; p.after = { on: true, created: Date.now() }; afterTasks(p); MSA.save(); if (!silent) refreshTasks(); return true;
};
G.checkAfter = function(){
  const g = GR(); if (!g.since) { g.since = Date.now() - 60000; MSA.save(); }
  let made = 0;
  (S().projects || []).forEach(p => {
    if (p.status !== 'done') { if (p.after) { dropTasks(t => t.src && t.src.after === p.id); delete p.after; made++; } return; }
    if (p.after || p.afterOff || !p.completedAt || p.completedAt < g.since || !clientOf(p)) return;
    p.after = { on: true, created: Date.now() }; afterTasks(p); made++;
  });
  if (made) { MSA.save(); refreshTasks(); }
  return made;
};
const afterState = (p, k) => {
  const A = p.after || {}, id = A[k], t = id && findTask(x => x.id === id);
  if (A['d_' + k] || (t && t.status === 'done')) return 'done';
  if (!t) return 'none';
  return t.due && t.due.slice(0, 10) < today() ? 'late' : 'wait';
};
G.afterState = afterState;
G.afterModal = function(p, done){
  const A = p.after; p.story = p.story || {};
  const rows = [['w1', T('بعد أسبوع من التسليم', '1 week after delivery'), T('اسأله عن رأيه واطلب تقييم', 'Ask for feedback and a review'), 'feedback'], ['m1', T('بعد شهر من التسليم', '1 month after delivery'), T('اطلب ترشيح لعميل تاني', 'Ask for a referral'), 'referral']];
  const stL = { done: T('تم', 'Done'), late: T('فات ميعاده', 'Overdue'), wait: T('منتظر', 'Pending'), none: '—' };
  MSA.modal({
    title: T('المتابعة بعد التسليم — ', 'Post-delivery follow-up — ') + p.name, size: 'wide',
    body: (A ? rows.map(r => { const s = afterState(p, r[0]), t = findTask(x => x.id === A[r[0]]); return '<div class="gr-ar"><div class="grow"><b>' + esc(r[1]) + '</b><div class="hint">' + esc(r[2]) + (t && t.due ? ' · ' + esc(t.due.slice(0, 10)) : '') + '</div></div><span class="tag gr-s-' + s + '">' + esc(stL[s]) + '</span>' +
      '<button class="btn sm" data-a="msg" data-k="' + r[3] + '">' + I('mail', 'sm') + '<span>' + esc(T('الرسالة', 'Message')) + '</span></button>' + (s === 'done' ? '' : '<button class="btn sm primary" data-a="ok" data-k="' + r[0] + '">' + I('check', 'sm') + '<span>' + esc(T('تم', 'Done')) + '</span></button>') + '</div>'; }).join('') +
      '<div class="row" style="margin:8px 0"><button class="btn sm" data-a="tst">' + I('star', 'sm') + '<span>' + esc(T('رسالة طلب شهادة / رأي', 'Testimonial request')) + '</span></button><span class="grow"></span><button class="btn sm danger" data-a="off">' + esc(T('إيقاف المتابعة لهذا المشروع', 'Stop follow-up for this project')) + '</button></div>'
      : '<p dir="auto">' + esc(clientOf(p) ? T('المتابعة بعد التسليم مش مفعّلة للمشروع ده. فعّلها وهتتضاف مهمتين (بعد أسبوع وبعد شهر) برسائل جاهزة.', 'Follow-up is not on for this project. Turn it on to add two tasks (1 week and 1 month) with ready messages.') : T('حدّد عميل للمشروع الأول.', 'Set a client for this project first.')) + '</p>' + (clientOf(p) ? '<button class="btn primary" data-a="on">' + I('bell', 'sm') + '<span>' + esc(T('فعّل المتابعة', 'Turn on follow-up')) + '</span></button>' : '')) +
      '<div class="field" style="margin-top:12px"><label class="f">' + esc(T('رأي العميل (يظهر في البورتفوليو)', 'Client testimonial (shown in the portfolio)')) + '</label><textarea id="afQ" dir="auto" rows="3" placeholder="' + esc(T('الصق هنا كلام العميل عن الشغل', 'Paste what the client said about the work')) + '">' + esc(p.story.quote || '') + '</textarea></div>',
    buttons: [{ label: T('تمام', 'Done'), cls: 'primary', onClick: a => { p.story.quote = $('#afQ', a.el).value.trim(); MSA.save(); a.close(); if (done) done(); } }],
    onMount: (el, api) => {
      const keep = () => { const q = $('#afQ', el); if (q) p.story.quote = q.value.trim(); };
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
        if (a === 'msg') plus().messages && plus().messages({ pid: p.id, kind: b.dataset.k });
        else if (a === 'tst') plus().messages && plus().messages({ pid: p.id, kind: 'testimonial' });
        else if (a === 'ok') { const k = b.dataset.k; keep(); p.after['d_' + k] = Date.now(); doneTask(t => t.id === p.after[k]); MSA.save(); refreshTasks(); api.close(); G.afterModal(p, done); }
        else if (a === 'on') { keep(); G.enableAfter(p); api.close(); G.afterModal(p, done); }
        else if (a === 'off') { keep(); dropTasks(t => t.src && t.src.after === p.id); delete p.after; p.afterOff = true; MSA.save(); refreshTasks(); api.close(); G.afterModal(p, done); }
      });
    }
  });
};

/* ================================================================ 3) QUOTE WITH 3 PACKAGES (+ follow-up reminder) */
G.quoteReminder = function(p, days, silent){
  days = days > 0 ? days : 3; const c = (p.time && p.time.client) || clientOf(p);
  dropTasks(t => t.src && t.src.quote === p.id);
  const t = addTask({ title: T('متابعة عرض السعر: ', 'Follow up on quote: ') + (c ? c + ' — ' : '') + p.name, desc: msgFor('quoteFollow', p), due: addDays(today(), days) + 'T11:00', priority: 'high', src: { quote: p.id } });
  const l = c && leadOf(c); if (l && l.stage === 'new') { l.stage = 'quoted'; l.next = addDays(today(), days); hist(l, T('اتبعت عرض سعر', 'Quote sent')); syncLeadTask(l); }
  MSA.save(); refreshTasks();
  if (!silent) MSA.toast(T('اتضاف تذكير لمتابعة العرض بعد ' + days + ' أيام في المهام', 'Quote follow-up reminder added to Tasks (' + days + ' days)'), 'bell', 6000);
  return t;
};
const PK_NAMES = () => [T('الباقة الأساسية', 'Basic'), T('الباقة المتوسطة', 'Standard'), T('الباقة الشاملة', 'Complete')];
function pkDefaults(p){
  const tm = p.time || {}, hrs = ((tm.entries || []).reduce((a, e) => a + (e.min || 0), 0)) / 60;
  const base = (tm.fixed > 0 ? tm.fixed : hrs * (tm.rate || 0)) + (tm.extras || []).reduce((a, e) => a + (e.amt || 0), 0);
  const n = PK_NAMES(), r = v => Math.round(v / 10) * 10;
  return [
    { name: n[0], price: base ? r(base * .7) : 0, items: '', rev: 1, days: 0 },
    { name: n[1], price: base ? r(base) : 0, items: '', rev: 3, days: 0, star: true },
    { name: n[2], price: base ? r(base * 1.4) : 0, items: '', rev: 5, days: 0 }
  ];
}
G.pkgModal = function(p){
  const tm = p.time; p.pkgs = p.pkgs || { list: pkDefaults(p), days: 3, remind: true };
  const K = p.pkgs; if (!K.list || K.list.length !== 3) K.list = pkDefaults(p);
  const read = el => {
    $$('[data-f]', el).forEach(i => { const x = K.list[+i.dataset.i]; if (!x) return; const f = i.dataset.f; x[f] = (f === 'price' || f === 'rev' || f === 'days') ? (i.value === '' ? (f === 'rev' ? null : 0) : num(i.value)) : i.value; });
    K.remind = $('#pkRem', el).checked; K.days = Math.max(1, Math.min(30, parseInt($('#pkDays', el).value, 10) || 3));
  };
  MSA.modal({
    title: T('عرض سعر بـ3 باقات', 'Quote with 3 packages'), size: 'wide',
    body: '<p class="hint" style="margin:0 0 10px" dir="auto">' + esc(T('العميل بيختار بدل ما يقول «غالي». اكتب اللي داخل كل باقة (كل بند في سطر) وحدّد السعر. الباقة المتوسطة بتظهر «الأكثر طلبًا».', 'Clients pick a tier instead of saying “too expensive”. List what each package includes (one per line) and set the price. The middle tier is highlighted as “Most popular”.')) + '</p>' +
      '<div class="gr-pk">' + K.list.map((x, i) => '<div class="card gr-pkc' + (x.star ? ' star' : '') + '"><input type="text" dir="auto" data-i="' + i + '" data-f="name" value="' + esc(x.name) + '" class="gr-pkn">' +
        '<label class="f">' + esc(T('السعر', 'Price')) + ' (' + esc(tm.cur) + ')</label><input type="number" min="0" data-i="' + i + '" data-f="price" value="' + (x.price || '') + '">' +
        '<label class="f">' + esc(T('اللي بتشمله', 'What is included')) + '</label><textarea dir="auto" rows="6" data-i="' + i + '" data-f="items" placeholder="' + esc(T('لوجو رئيسي\nملف PNG وPDF\n…', 'Main logo\nPNG + PDF files\n…')) + '">' + esc(x.items || '') + '</textarea>' +
        '<div class="st-grid"><div><label class="f">' + esc(T('تعديلات', 'Revisions')) + '</label><input type="number" min="0" data-i="' + i + '" data-f="rev" value="' + (x.rev == null ? '' : x.rev) + '"></div><div><label class="f">' + esc(T('أيام التسليم', 'Delivery days')) + '</label><input type="number" min="0" data-i="' + i + '" data-f="days" value="' + (x.days || '') + '"></div></div></div>').join('') + '</div>' +
      '<label class="gr-chk"><input type="checkbox" id="pkRem"' + (K.remind !== false ? ' checked' : '') + '> <span>' + esc(T('ضيف تذكير لمتابعة العرض بعد', 'Add a follow-up reminder after')) + '</span> <input type="number" id="pkDays" min="1" max="30" value="' + (K.days || 3) + '" style="width:64px"> <span>' + esc(T('أيام', 'days')) + '</span></label>',
    buttons: [
      { label: T('حفظ فقط', 'Save only'), cls: 'ghost', onClick: a => { read(a.el); MSA.save(); a.close(); } },
      { label: T('حمّل PDF', 'Download PDF'), cls: 'primary', icon: 'download', onClick: a => {
        read(a.el); if (!K.list.some(x => num(x.price) > 0)) { MSA.toast(T('اكتب سعر باقة واحدة على الأقل', 'Enter at least one package price'), 'err'); return; }
        MSA.save(); a.close(); if (MSA.pkgDoc) MSA.pkgDoc(p, K); if (K.remind !== false) G.quoteReminder(p, K.days);
      } }
    ]
  });
};

/* ================================================================ 4) STORY + PORTFOLIO */
const typeName = p => { const d = ((MSA.tpl && MSA.tpl.TYPES) || []).find(x => x[0] === p.type); return d && MSA.tpl.name ? MSA.tpl.name(d) : ''; };
G.storyModal = function(p, done){
  const s = p.story = p.story || {};
  MSA.modal({
    title: T('قصة المشروع للبورتفوليو — ', 'Portfolio story — ') + p.name, size: 'wide',
    body: '<p class="hint" style="margin:0 0 10px" dir="auto">' + esc(T('3 جمل بس: إيه المشكلة، عملت إيه، وإيه النتيجة. دي اللي بتبيع شغلك أكتر من الصور لوحدها.', 'Three short lines: the problem, what you did, the result. This sells your work more than pictures alone.')) + '</p>' +
      [['problem', T('المشكلة / طلب العميل', 'The problem / client brief'), T('العميل كان محتاج…', 'The client needed…')], ['solution', T('الحل اللي عملته', 'What you did'), T('صممت / منتجت…', 'I designed / edited…')], ['result', T('النتيجة', 'The result'), T('زادت المبيعات / اتنشر على…', 'Sales grew / it was published on…')]].map(f => '<div class="field"><label class="f">' + esc(f[1]) + '</label><textarea data-s="' + f[0] + '" dir="auto" rows="3" placeholder="' + esc(f[2]) + '">' + esc(s[f[0]] || '') + '</textarea></div>').join('') +
      '<div class="field"><label class="f">' + esc(T('رأي العميل (اختياري)', 'Client testimonial (optional)')) + '</label><textarea data-s="quote" dir="auto" rows="2">' + esc(s.quote || '') + '</textarea></div>' +
      '<label class="gr-chk"><input type="checkbox" id="stInc"' + (s.inc !== false ? ' checked' : '') + '> <span>' + esc(T('ضمّ المشروع ده للبورتفوليو', 'Include this project in the portfolio')) + '</span></label>',
    buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('حفظ', 'Save'), cls: 'primary', icon: 'check', onClick: a => { $$('[data-s]', a.el).forEach(i => { s[i.dataset.s] = i.value.trim(); }); s.inc = $('#stInc', a.el).checked; MSA.save(); a.close(); MSA.toast(T('اتحفظت قصة المشروع', 'Story saved'), 'ok'); if (done) done(); } }]
  });
};
const hasStory = p => !!(p.story && (p.story.problem || p.story.solution || p.story.result));
G.hasStory = hasStory;
async function imgData(att, max){
  try {
    const rec = await MSA.files.get(att.id); if (!rec || !rec.blob) return null;
    const url = URL.createObjectURL(rec.blob);
    try {
      const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
      const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', .82);
    } finally { URL.revokeObjectURL(url); }
  } catch (e) { return null; }
}
async function projImages(p, n, max){
  const P = MSA.proj, out = [], cov = MSA.cover && MSA.cover.proj ? MSA.cover.proj(p) : null;
  const imgs = P.allAtts(p.steps).filter(a => a.kind === 'image');
  const order = (cov ? [cov] : []).concat(imgs.filter(a => !cov || a.id !== cov.id));
  for (const a of order) { if (out.length >= n) break; const d = await imgData(a, max); if (d) out.push(d); }
  return out;
}
function portCss(acc){ return '*{box-sizing:border-box}.pg{max-width:880px;margin:0 auto;padding:30px 28px;color:#1d1d1c;line-height:1.6}h1{font-size:34px;margin:0 0 4px}h2{font-size:21px;margin:26px 0 4px}h3{font-size:13px;margin:12px 0 2px;color:' + acc + '}.muted{color:#777;font-size:13px}.imgs{display:flex;gap:8px;margin:10px 0}.imgs img{flex:1;min-width:0;height:200px;object-fit:cover;border-radius:10px;background:#eee}.imgs img:only-child{height:260px}p{margin:2px 0 6px;white-space:pre-wrap}blockquote{margin:10px 0 0;padding:8px 14px;border-inline-start:4px solid ' + acc + ';background:#f6f5f2;font-style:italic}.hero{border-bottom:3px solid ' + acc + ';padding-bottom:12px;margin-bottom:6px}.tg{display:inline-block;font-size:12px;background:#f0efe9;border-radius:99px;padding:2px 10px;margin-inline-end:6px}'; }
async function portHTML(sel, o){
  const prof = S().profile, acc = '#5b8def', parts = [];
  parts.push('<div class="hero"><h1>' + esc(o.title || prof.name || T('معرض أعمالي', 'My portfolio')) + '</h1><div class="muted" dir="auto">' + esc([prof.title, prof.email, prof.phone || prof.whatsapp, prof.location].filter(Boolean).join(' · ')) + '</div></div>');
  for (const p of sel) {
    const st = p.story || {}, im = await projImages(p, o.imgs || 3, 900), yr = p.completedAt ? new Date(p.completedAt).getFullYear() : '';
    parts.push('<div class="pj"><h2 dir="auto">' + esc(p.name) + '</h2><div class="muted">' + [typeName(p) ? '<span class="tg">' + esc(typeName(p)) + '</span>' : '', o.client && clientOf(p) ? esc(clientOf(p)) : '', yr].filter(Boolean).join(' ') + '</div>' +
      (im.length ? '<div class="imgs">' + im.map(s => '<img src="' + s + '" alt="">').join('') + '</div>' : '') +
      (st.problem ? '<h3>' + esc(T('المشكلة', 'The problem')) + '</h3><p dir="auto">' + esc(st.problem) + '</p>' : '') + (st.solution ? '<h3>' + esc(T('الحل', 'The solution')) + '</h3><p dir="auto">' + esc(st.solution) + '</p>' : '') + (st.result ? '<h3>' + esc(T('النتيجة', 'The result')) + '</h3><p dir="auto">' + esc(st.result) + '</p>' : '') +
      (st.quote ? '<blockquote dir="auto">“' + esc(st.quote) + '”</blockquote>' : '') + '</div>');
  }
  return { acc, parts };
}
G.portHTML = portHTML;
G.portfolio = function(){
  const P = MSA.proj, done = P.doneList().slice().sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)), prof = S().profile;
  if (!done.length) { MSA.toast(T('لسه مفيش مشاريع مكتملة تتحط في البورتفوليو', 'No completed projects to put in a portfolio yet'), 'err'); return; }
  const sel = new Set(done.filter(p => hasStory(p) && (p.story || {}).inc !== false).map(p => p.id));
  const run = async (a, kind) => {
    const list = done.filter(p => sel.has(p.id)); if (!list.length) { MSA.toast(T('اختار مشروع واحد على الأقل', 'Pick at least one project'), 'err'); return; }
    const o = { title: $('#pfT', a.el).value.trim(), client: $('#pfC', a.el).checked };
    MSA.toast(T('بجهّز الملف…', 'Preparing…'), 'ok', 2500);
    try {
      const r = await portHTML(list, o), name = 'portfolio-' + slug(S().profile.name || 'work');
      if (kind === 'pdf') await MSA.pdf.flow(name + '.pdf', '<div class="pg">' + r.parts.join('') + '</div>', { css: portCss(r.acc), dir: en() ? 'ltr' : 'rtl' });
      else {
        const html = '<!doctype html><html lang="' + (en() ? 'en' : 'ar') + '" dir="' + (en() ? 'ltr' : 'rtl') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(o.title) + '</title><style>body{margin:0;font-family:\'Segoe UI\',\'Noto Sans Arabic\',Tahoma,Arial,sans-serif;background:#fff}' + portCss(r.acc) + '</style></head><body><div class="pg">' + r.parts.join('') + '</div></body></html>';
        const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); l.download = name + '.html'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 4000);
      }
    } catch (e) { MSA.toast(T('تعذّر إنشاء الملف', 'Could not build the file'), 'err'); }
  };
  MSA.modal({
    title: T('بورتفوليو جاهز للإرسال', 'Ready-to-send portfolio'), size: 'wide',
    body: '<div class="field"><label class="f">' + esc(T('عنوان الملف', 'Title')) + '</label><input id="pfT" type="text" dir="auto" value="' + esc((prof.name ? prof.name + ' — ' : '') + T('معرض أعمال', 'Portfolio')) + '"></div>' +
      '<label class="f">' + esc(T('اختار المشاريع (اللي ليها قصة بتظهر بالتفاصيل)', 'Choose projects (those with a story show full details)')) + '</label><div class="gr-pl" id="pfL"></div>' +
      '<label class="gr-chk"><input type="checkbox" id="pfC"> <span>' + esc(T('اظهر اسم العميل', 'Show client names')) + '</span></label><div class="hint" id="pfH"></div>',
    buttons: [
      { label: T('إغلاق', 'Close'), cls: 'ghost', onClick: a => a.close() },
      { label: 'HTML', icon: 'download', onClick: a => run(a, 'html') },
      { label: 'PDF', cls: 'primary', icon: 'download', onClick: a => run(a, 'pdf') }
    ],
    onMount: el => {
      const L = $('#pfL', el), cnt = () => { $('#pfH', el).textContent = T('اتحدد ' + sel.size + ' مشروع', sel.size + ' selected'); };
      const draw = () => { L.innerHTML = done.map(p => '<label class="gr-pi"><input type="checkbox" data-id="' + p.id + '"' + (sel.has(p.id) ? ' checked' : '') + '><span class="grow" dir="auto"><b>' + esc(p.name) + '</b><span class="hint"> ' + esc(clientOf(p)) + '</span></span>' + (hasStory(p) ? '<span class="tag gr-s-done">' + esc(T('فيها قصة', 'story')) + '</span>' : '<button type="button" class="btn sm" data-st="' + p.id + '">' + esc(T('أضف قصة', 'Add story')) + '</button>') + '</label>').join(''); cnt(); };
      L.addEventListener('change', e => { const c = e.target.closest('[data-id]'); if (!c) return; if (c.checked) sel.add(c.dataset.id); else sel.delete(c.dataset.id); cnt(); });
      L.addEventListener('click', e => { const b = e.target.closest('[data-st]'); if (!b) return; e.preventDefault(); const p = done.find(x => x.id === b.dataset.st); if (p) G.storyModal(p, () => { sel.add(p.id); draw(); }); });
      draw();
    }
  });
};

/* ================================================================ 5) "WHERE DO I STAND" dashboard (Reports) + 7) source tracking */
G.numbers = function(){
  const s = S(), now = new Date(), cm = ym(now), pm = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  let col = 0, colPrev = 0;
  (s.projects || []).forEach(p => {
    let cur = 'EGP'; try { cur = plus().pay.cur(p) || 'EGP'; } catch (e) {}
    ((p.pay && p.pay.items) || []).forEach(it => { const d = String(it.date || '').slice(0, 7), a = toEGP(num(it.amt), cur); if (d === cm) col += a; else if (d === pm) colPrev += a; });
  });
  const rows = (MSA.clients && MSA.clients.data ? MSA.clients.data().rows : []);
  const newCl = rows.filter(r => String(r.c.since || '').slice(0, 7) === cm).length;
  const L = leads(), won = L.filter(l => l.stage === 'won').length, lost = L.filter(l => l.stage === 'lost').length, closed = won + lost;
  const byType = {}, bySrc = {};
  (s.projects || []).forEach(p => {
    let tot = 0, cur = 'EGP'; try { tot = plus().pay.total(p) || 0; cur = plus().pay.cur(p) || 'EGP'; } catch (e) {}
    const egp = toEGP(tot, cur); if (!egp) return;
    if (p.status === 'done') { const k = typeName(p) || T('أخرى', 'Other'); byType[k] = (byType[k] || 0) + egp; }
    const c = clientOf(p), r = c && rows.find(x => norm(x.c.name) === norm(c)), sr = r && String(r.c.source || '').trim();
    if (sr) { const o = bySrc[sr] = bySrc[sr] || { egp: 0, clients: new Set() }; o.egp += egp; o.clients.add(norm(c)); }
  });
  rows.forEach(r => { const sr = String(r.c.source || '').trim(); if (sr) { const o = bySrc[sr] = bySrc[sr] || { egp: 0, clients: new Set() }; o.clients.add(norm(r.c.name)); } });
  const srcRows = Object.entries(bySrc).map(([k, o]) => { const ls = L.filter(l => norm(l.source) === norm(k)); return { k, egp: o.egp, clients: o.clients.size, leads: ls.length, won: ls.filter(l => l.stage === 'won').length }; }).sort((a, b) => b.egp - a.egp || b.clients - a.clients);
  const type = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
  return { col, colPrev, newCl, leadsN: L.length, won, lost, rate: closed ? Math.round(won / closed * 100) : null, type, srcRows, ls: stats() };
};
G.dash = function(){
  const n = G.numbers(), hasAny = n.col || n.newCl || n.leadsN || n.type || n.srcRows.length;
  const delta = n.colPrev > 0 ? Math.round((n.col - n.colPrev) / n.colPrev * 100) : null, EGP = T('ج.م', 'EGP');
  const tile = (ic, c, v, l, sub) => '<div class="gr-t" style="--c:' + c + '">' + I(ic) + '<b dir="auto">' + v + '</b><span>' + esc(l) + '</span>' + (sub ? '<em dir="auto">' + esc(sub) + '</em>' : '') + '</div>';
  const best = n.srcRows[0], tips = [];
  if (n.ls.late) tips.push(T('عندك ' + n.ls.late + ' متابعة لعملاء محتملين فات ميعادها — افتح «العملاء المحتملين».', n.ls.late + ' lead follow-up(s) are overdue — open “Leads”.'));
  if (!n.leadsN) tips.push(T('سجّل أي حد بيسألك عن شغلك في «العملاء المحتملين» عشان نحسب نسبة التحويل.', 'Log everyone who asks about your work in “Leads” so we can measure your win rate.'));
  if (best && n.srcRows.length > 1) tips.push(T('أفضل مصدر ليك: ' + best.k + ' — ركّز عليه أكتر.', 'Your best source is ' + best.k + ' — lean into it.'));
  return '<section class="rp-c gr-dash" id="grDash"><h3>' + I('flag', 'sm') + esc(T('أنا واقف فين؟', 'Where do I stand?')) + '</h3>' +
    (hasAny ? '<div class="gr-tiles">' +
      tile('trend', '#3ccf91', nf(n.col) + ' ' + EGP, T('اتحصّل الشهر ده', 'Collected this month'), delta == null ? '' : (delta >= 0 ? '▲ ' : '▼ ') + Math.abs(delta) + '٪ ' + T('عن الشهر اللي فات', 'vs last month')) +
      tile('user', '#5b8def', nf(n.newCl), T('عملاء جداد الشهر ده', 'New clients this month'), n.leadsN ? T('من ' + n.leadsN + ' محتمل مسجّل', 'from ' + n.leadsN + ' leads logged') : '') +
      tile('trophy', '#9b6bff', n.rate == null ? '—' : n.rate + '٪', T('نسبة تحويل العملاء المحتملين', 'Lead conversion rate'), n.rate == null ? T('لسه مفيش صفقات مقفولة', 'No closed deals yet') : T(n.won + ' اتفقوا / ' + n.lost + ' ضاعوا', n.won + ' won / ' + n.lost + ' lost')) +
      tile('star', '#f0b43c', n.type ? esc(n.type[0]) : '—', T('أكتر نوع شغل بيجيب فلوس', 'Best-earning project type'), n.type ? nf(n.type[1]) + ' ' + EGP : T('بعد أول مشروع مكتمل بسعر', 'after your first priced completed project')) +
      tile('pinmap', '#18b4c8', best ? esc(best.k) : '—', T('أفضل مصدر عملاء', 'Best client source'), best ? nf(best.egp) + ' ' + EGP + ' · ' + best.clients + ' ' + T('عميل', 'client(s)') : T('اكتب «المصدر» في شيت العملاء', 'Fill “Source” in the client sheet')) +
      tile('flag', '#ef7b45', nf(n.ls.open), T('محتملين مفتوحين', 'Open leads'), n.ls.val ? nf(n.ls.val) + ' ' + T('ج.م متوقعة', 'EGP expected') : '') + '</div>' +
      (n.srcRows.length ? '<div class="gr-src"><b>' + esc(T('المصادر', 'Sources')) + '</b>' + n.srcRows.slice(0, 6).map(r => '<div class="gr-sr"><span dir="auto">' + esc(r.k) + '</span><span class="hint">' + r.clients + ' ' + esc(T('عميل', 'clients')) + (r.leads ? ' · ' + r.won + '/' + r.leads + ' ' + esc(T('محتمل اتحوّل', 'leads won')) : '') + '</span><b dir="ltr">' + nf(r.egp) + '</b></div>').join('') + '</div>' : '')
      : '<div class="hint">' + esc(T('الأرقام هتظهر هنا لما تسجّل مدفوعات وعملاء وعملاء محتملين.', 'Numbers will show up here once you log payments, clients and leads.')) + '</div>') +
    (tips.length ? '<ul class="gr-tips">' + tips.map(x => '<li dir="auto">' + esc(x) + '</li>').join('') + '</ul>' : '') +
    '<div class="row" style="margin-top:8px"><button class="btn sm" data-gd="leads">' + I('flag', 'sm') + '<span>' + esc(T('العملاء المحتملين', 'Leads')) + '</span></button><button class="btn sm" data-gd="clients">' + I('user', 'sm') + '<span>' + esc(T('شيت العملاء', 'Clients sheet')) + '</span></button></div></section>';
};
G.dashWire = host => { host.addEventListener('click', e => { const b = e.target.closest('[data-gd]'); if (b) MSA.go(b.dataset.gd); }); };

/* ================================================================ boot */
let tmr = null;
setTimeout(() => { const uc = MSA.updateCounts; if (typeof uc === 'function') MSA.updateCounts = function(){ const r = uc.apply(this, arguments); clearTimeout(tmr); tmr = setTimeout(() => { try { G.checkAfter(); } catch (e) {} }, 700); return r; }; }, 0);
setTimeout(() => { try { G.checkAfter(); } catch (e) {} }, 3200);
setInterval(() => { try { G.checkAfter(); } catch (e) {} }, 5000);
})();
