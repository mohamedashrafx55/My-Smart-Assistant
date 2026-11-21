/* "عملاء Upwork": a tab next to the clients sheet. Proposal library (status, connects, links to client / project),
   a Word-ready proposal template, and my Upwork profile + CV notes. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc, S = () => MSA.state;
const num = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
const today = () => U.dateKey(new Date());
const UW = MSA.upwork = {};

UW.data = () => {
  const s = S(), u = s.upwork = s.upwork || {};
  u.profile = u.profile || { url: '', title: '', rate: 0, jss: '', overview: '', skills: '', cvNote: '' };
  u.props = u.props || [];
  if (u.tpl == null) u.tpl = { html: defTpl(), updated: 0 };
  u.ui = u.ui || { tab: 'props', f: '', q: '' };
  return u;
};
const STAT = () => ({ draft: [T('مسودة', 'Draft'), '#8a8a86'], sent: [T('اتبعت', 'Sent'), '#5b8def'], viewed: [T('اتشاف', 'Viewed'), '#9b6bff'], interview: [T('مقابلة', 'Interview'), '#f0a030'], hired: [T('اتوظفت', 'Hired'), '#2fa66d'], declined: [T('اترفض / مفيش رد', 'Declined / no reply'), '#e5484d'] });
function defTpl(){
  return '<h2>Hi {client},</h2><p>I read your job post “<b>{job}</b>” carefully, and this is exactly the kind of work I do every day as a graphic designer and video editor.</p>' +
    '<p><b>How I will approach it:</b></p><ul><li>Understand your goal and audience in the first message.</li><li>Send a first draft quickly so you can react to something real.</li><li>Include revision rounds until you are happy.</li></ul>' +
    '<p><b>Why me:</b></p><ul><li>[Add one relevant past project + link]</li><li>[Add a result: views, sales, a happy client]</li></ul>' +
    '<p>One quick question: [ask one smart question about the job].</p><p>Best regards,<br>{name}</p>';
}
const fill = (html, p) => String(html || '').replace(/\{client\}/g, esc(p.client || 'there')).replace(/\{job\}/g, esc(p.title || '')).replace(/\{name\}/g, esc(S().profile.name || '')).replace(/\{rate\}/g, p.rate ? esc(String(p.rate)) : '');
const plain = h => { const d = document.createElement('div'); d.innerHTML = h || ''; return (d.innerText || d.textContent || '').trim(); };
const toHtml = t => String(t || '').split(/\n{2,}/).map(x => '<p>' + esc(x).replace(/\n/g, '<br>') + '</p>').join('');

UW.stats = () => {
  const L = UW.data().props, sent = L.filter(p => p.status !== 'draft'), pass = ['viewed', 'interview', 'hired'];
  const replied = sent.filter(p => pass.slice(1).includes(p.status)).length, hired = L.filter(p => p.status === 'hired').length, connects = L.reduce((a, p) => a + num(p.connects), 0);
  return { total: L.length, sent: sent.length, viewed: sent.filter(p => pass.includes(p.status)).length, interview: L.filter(p => p.status === 'interview').length, hired, connects, reply: sent.length ? Math.round(replied / sent.length * 100) : 0, cph: hired ? Math.round(connects / hired) : 0 };
};
UW.clients = () => {
  const names = new Map();
  MSA.clients.data().rows.forEach(r => { if (/upwork/i.test(r.c.source || '')) names.set((r.c.name || '').toLowerCase(), r.c.name); });
  UW.data().props.filter(p => p.status === 'hired' && p.client).forEach(p => names.set(p.client.toLowerCase(), p.client));
  return [...names.values()].filter(Boolean).map(n => {
    const ps = S().projects.filter(p => (MSA.clients.of(p) || '').toLowerCase() === n.toLowerCase());
    const val = ps.reduce((a, p) => a + (MSA.rates && MSA.rates.has((p.time && p.time.cur) || 'EGP') ? MSA.rates.toEGP(MSA.plus.pay.total(p), (p.time && p.time.cur) || 'EGP') : MSA.plus.pay.total(p)), 0);
    return { name: n, n: ps.length, val };
  });
};

/* ---------------- proposal editor ---------------- */
UW.edit = function(init, done){
  const u = UW.data(), isNew = !init || !u.props.some(x => x.id === init.id);
  const p = Object.assign({ id: U.uid('up'), title: '', client: '', url: '', status: 'draft', date: today(), connects: 0, budget: '', cur: 'USD', rate: 0, text: '', projectId: '', note: '' }, JSON.parse(JSON.stringify(init || {})));
  const projs = S().projects.slice().sort((a, b) => (b.created || 0) - (a.created || 0)), ST = STAT();
  MSA.modal({
    title: isNew ? T('عرض Upwork جديد', 'New Upwork proposal') : T('تعديل العرض', 'Edit proposal'), size: 'wide',
    body: '<div class="grid2"><div class="field"><label class="f">' + esc(T('عنوان الوظيفة', 'Job title')) + '</label><input id="upT" dir="auto" value="' + esc(p.title) + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('اسم العميل على Upwork', 'Client on Upwork')) + '</label><input id="upC" dir="auto" list="upCl" value="' + esc(p.client) + '"><datalist id="upCl">' + MSA.clients.names().map(n => '<option value="' + esc(n) + '">').join('') + '</datalist></div>' +
      '<div class="field"><label class="f">' + esc(T('رابط الوظيفة', 'Job link')) + '</label><input id="upU" dir="ltr" value="' + esc(p.url) + '" placeholder="https://www.upwork.com/jobs/…"></div>' +
      '<div class="field"><label class="f">' + esc(T('الحالة', 'Status')) + '</label><select id="upS">' + Object.keys(ST).map(k => '<option value="' + k + '"' + (p.status === k ? ' selected' : '') + '>' + esc(ST[k][0]) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="f">' + esc(T('التاريخ', 'Date')) + '</label><input type="date" id="upD" value="' + esc(p.date) + '"></div>' +
      '<div class="field"><label class="f">Connects</label><input type="number" id="upCn" min="0" value="' + (p.connects || '') + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('ميزانية الوظيفة', 'Job budget')) + '</label><input id="upB" dir="auto" value="' + esc(p.budget) + '" placeholder="$25/hr أو $300"></div>' +
      '<div class="field"><label class="f">' + esc(T('سعري المعروض ($)', 'My bid ($)')) + '</label><input type="number" id="upR" min="0" step="any" value="' + (p.rate || '') + '"></div></div>' +
      '<div class="field"><label class="f">' + esc(T('مشروع مرتبط (لو اتوظفت)', 'Linked project (when hired)')) + '</label><select id="upP"><option value="">—</option>' + projs.map(x => '<option value="' + x.id + '"' + (p.projectId === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select></div>' +
      '<div class="field"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><label class="f" style="margin:0">' + esc(T('نص العرض (Proposal)', 'Proposal text')) + '</label><button class="btn sm" id="upTpl">' + I('doc', 'sm') + esc(T('املأ من القالب', 'Fill from template')) + '</button></div><textarea id="upX" rows="9" dir="auto">' + esc(p.text) + '</textarea></div>' +
      '<div class="field"><label class="f">' + esc(T('ملاحظات (إيه اللي نجح / اتعلمته)', 'Notes (what worked / lessons)')) + '</label><textarea id="upN" rows="2" dir="auto">' + esc(p.note) + '</textarea></div>',
    buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() },
      { label: T('ملف Word', 'Word file'), onClick: a => { collect(a); UW.word(p); } },
      { label: T('حفظ', 'Save'), cls: 'primary', onClick: a => { if (!collect(a)) return; a.close(); save(); done && done(); } }],
    onMount: el => { $('#upTpl', el).onclick = () => { collect({ el }); const t = plain(fill(u.tpl.html, p)); $('#upX', el).value = t; }; }
  });
  function collect(a){
    const g = id => $('#' + id, a.el).value;
    Object.assign(p, { title: g('upT').trim(), client: g('upC').trim(), url: g('upU').trim(), status: g('upS'), date: g('upD') || today(), connects: Math.max(0, num(g('upCn'))), budget: g('upB').trim(), rate: Math.max(0, num(g('upR'))), projectId: g('upP'), text: g('upX').trim(), note: g('upN').trim() });
    return true;
  }
  function save(){
    if (!p.title && !p.client) { MSA.toast(T('اكتب عنوان الوظيفة أو اسم العميل', 'Enter the job title or the client'), 'err'); return; }
    const i = u.props.findIndex(x => x.id === p.id); if (i < 0) u.props.unshift(p); else u.props[i] = p;
    if (p.status === 'hired' && p.client) { const r = MSA.clients.ensure(p.client); if (r && !/upwork/i.test(r.c.source || '')) { r.c.source = 'Upwork'; r.c.status = T('نشط', 'Active'); } }
    MSA.save(); MSA.toast(T('اتحفظ العرض', 'Proposal saved'), 'ok');
  }
};
UW.word = function(p){
  const html = '<h1>' + esc(p.title || 'Proposal') + '</h1>' + (p.client ? '<p><b>Client:</b> ' + esc(p.client) + '</p>' : '') + (p.text ? toHtml(p.text) : fill(UW.data().tpl.html, p));
  const bl = MSA.docx.build(html, { title: '', rtl: S().settings.lang !== 'en' && /[؀-ۿ]/.test(p.text || p.title || ''), author: S().profile.name || '' });
  dl(bl, ('proposal-' + (p.client || p.title || 'draft')).replace(/[^\w؀-ۿ\-]+/g, '_') + '.docx');
};
function dl(bl, name){ const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000); }

/* ---------------- view ---------------- */
const tabsHTML = () => '<div class="row cs-tabs"><button class="btn sm" data-uw="done">' + I('trophy', 'sm') + '<span>' + esc(T('المشاريع المكتملة', 'Completed projects')) + '</span></button><button class="btn sm" data-uw="clients">' + I('user', 'sm') + '<span>' + esc(T('شيت العملاء', 'Clients sheet')) + '</span></button><button class="btn sm" data-uw="leads">' + I('flag', 'sm') + '<span>' + esc(T('العملاء المحتملين', 'Leads')) + '</span></button><button class="btn sm primary" disabled>' + I('briefcase', 'sm') + '<span>' + esc(T('عملاء Upwork', 'Upwork clients')) + '</span></button></div>';
UW.tabsHTML = tabsHTML;

function render(host){
  const u = UW.data(), ui = u.ui, st = UW.stats(), ST = STAT();
  const sub = [['props', T('العروض', 'Proposals')], ['clients', T('عملاء Upwork', 'Upwork clients')], ['tpl', T('قالب Word', 'Word template')], ['me', T('بروفايلي وCV', 'Profile & CV')]];
  host.innerHTML = '<div class="page-head"><div><h1>' + I('briefcase', 'lg') + esc(T('عملاء Upwork', 'Upwork clients')) + '</h1><div class="sub">' + esc(T('مكتبة عروضك وعملاءك على Upwork — مربوطة بشيت العملاء والمشاريع', 'Your proposal library and Upwork clients — linked to the clients sheet and projects')) + '</div></div></div>' + tabsHTML() +
    '<div class="mny-kpis uw-k"><div class="kp"><span>' + esc(T('عروض مبعوتة', 'Sent')) + '</span><b>' + st.sent + '</b><i>' + st.total + ' ' + esc(T('إجمالًا', 'total')) + '</i></div><div class="kp"><span>' + esc(T('نسبة الرد', 'Reply rate')) + '</span><b>' + st.reply + '%</b><i>' + st.interview + ' ' + esc(T('مقابلة', 'interviews')) + '</i></div><div class="kp ok"><span>' + esc(T('اتوظفت', 'Hired')) + '</span><b>' + st.hired + '</b><i>' + esc(st.cph ? T('≈ ' + st.cph + ' Connect للوظيفة', '≈ ' + st.cph + ' connects per job') : '') + '</i></div><div class="kp"><span>Connects</span><b>' + st.connects + '</b><i></i></div></div>' +
    '<div class="pchips uw-sub" style="margin:10px 0">' + sub.map(x => '<button class="pchip' + (ui.tab === x[0] ? ' on' : '') + '" data-uw="tab" data-v="' + x[0] + '">' + esc(x[1]) + '</button>').join('') + '</div><div id="uwBody"></div>';
  const body = $('#uwBody', host);
  if (ui.tab === 'props') propsTab(body); else if (ui.tab === 'clients') clientsTab(body); else if (ui.tab === 'tpl') tplTab(body); else meTab(body);
  host.onclick = e => {
    const b = e.target.closest('[data-uw]'); if (!b || b.disabled) return; const a = b.dataset.uw;
    if (a === 'done') { S().ui.doneClient = null; MSA.go('done'); } else if (a === 'clients') MSA.go('clients'); else if (a === 'leads') MSA.go('leads');
    else if (a === 'tab') { ui.tab = b.dataset.v; MSA.save(); MSA.rerender(true); }
  };
}
function propsTab(el){
  const u = UW.data(), ui = u.ui, ST = STAT(), q = (ui.q || '').toLowerCase();
  const all = u.props, list = all.filter(p => (!ui.f || p.status === ui.f) && (!q || (p.title + ' ' + p.client + ' ' + p.text).toLowerCase().includes(q)));
  el.innerHTML = '<div class="row" style="gap:8px;margin-bottom:10px"><div class="cs-search grow">' + I('search', 'sm') + '<input type="search" id="uwQ" dir="auto" placeholder="' + esc(T('ابحث في العروض…', 'Search proposals…')) + '" value="' + esc(ui.q || '') + '"></div><button class="btn primary" data-up="new">' + I('plus', 'sm') + '<span>' + esc(T('عرض جديد', 'New proposal')) + '</span></button></div>' +
    '<div class="pchips" style="margin:0 0 12px"><button class="pchip' + (ui.f ? '' : ' on') + '" data-up="f" data-v="">' + esc(T('الكل', 'All')) + ' · ' + all.length + '</button>' + Object.keys(ST).map(k => '<button class="pchip' + (ui.f === k ? ' on' : '') + '" data-up="f" data-v="' + k + '">' + esc(ST[k][0]) + ' · ' + all.filter(p => p.status === k).length + '</button>').join('') + '</div>' +
    (list.length ? '<div class="uw-list">' + list.map(p => { const pr = p.projectId && S().projects.find(x => x.id === p.projectId); const mcx = MSA.multi.mc(p, true); return '<div class="uw-row' + mcx.cls + '"' + mcx.sty + ' data-id="' + p.id + '"><div class="uw-m"><b dir="auto">' + esc(p.title || '—') + '</b><span class="pill-s" style="background:' + ST[p.status][1] + '">' + esc(ST[p.status][0]) + '</span></div>' +
      '<div class="uw-n"><span dir="auto">' + esc(p.client || '—') + '</span><span dir="ltr">' + esc(p.date) + '</span>' + (p.connects ? '<span>' + p.connects + ' connects</span>' : '') + (p.rate ? '<span dir="ltr">$' + p.rate + '</span>' : '') + (pr ? '<span>' + I('link', 'xs') + esc(pr.name) + '</span>' : '') + '</div>' +
      '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><select data-up="st" aria-label="status">' + Object.keys(ST).map(k => '<option value="' + k + '"' + (p.status === k ? ' selected' : '') + '>' + esc(ST[k][0]) + '</option>').join('') + '</select><button class="btn sm" data-up="edit">' + I('pencil', 'sm') + esc(T('تعديل', 'Edit')) + '</button><button class="btn sm" data-up="word">' + I('download', 'sm') + 'Word</button><button class="btn sm" data-up="copy">' + I('copy', 'sm') + esc(T('نسخ النص', 'Copy')) + '</button>' + (p.url ? '<button class="btn sm" data-up="open">' + I('external', 'sm') + esc(T('الوظيفة', 'Job')) + '</button>' : '') + '<span class="grow"></span><button class="icon-btn sm danger" data-up="del" aria-label="delete">' + I('trash', 'sm') + '</button></div></div>'; }).join('') + '</div>'
      : MSA.empty('briefcase', all.length ? T('لا نتائج مطابقة', 'No matches') : T('لسه مفيش عروض', 'No proposals yet'), all.length ? '' : T('اضغط «عرض جديد» وسجّل أول Proposal. خلّي القالب في تبويب «قالب Word».', 'Tap “New proposal” and log your first one. Keep your template in the “Word template” tab.')));
  const redo = () => { MSA.save(); MSA.rerender(true); };
  $('#uwQ', el).oninput = e => { ui.q = e.target.value; const pos = e.target.selectionStart; propsTab(el); const i = $('#uwQ', el); i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) {} };
  el.onchange = e => { const s = e.target.closest('[data-up=st]'); if (!s) return; const p = u.props.find(x => x.id === s.closest('[data-id]').dataset.id); if (!p) return; p.status = s.value; if (p.status === 'hired' && p.client) { const r = MSA.clients.ensure(p.client); if (r && !/upwork/i.test(r.c.source || '')) r.c.source = 'Upwork'; } redo(); };
  el.onclick = async e => {
    const b = e.target.closest('[data-up]'); if (!b || b.tagName === 'SELECT') return; const a = b.dataset.up, row = b.closest('[data-id]'), p = row && u.props.find(x => x.id === row.dataset.id);
    if (a === 'new') UW.edit(null, () => MSA.rerender(true));
    else if (a === 'f') { ui.f = b.dataset.v; redo(); }
    else if (!p) return;
    else if (a === 'edit') UW.edit(p, () => MSA.rerender(true));
    else if (a === 'word') UW.word(p);
    else if (a === 'copy') { const t = p.text || plain(fill(u.tpl.html, p)); try { await navigator.clipboard.writeText(t); MSA.toast(T('تم النسخ', 'Copied'), 'ok'); } catch (x) { MSA.toast(T('تعذر النسخ', 'Could not copy'), 'err'); } }
    else if (a === 'open') MSA.openLink(p.url);
    else if (a === 'del') { if (await MSA.confirm(T('حذف هذا العرض؟', 'Delete this proposal?'), { danger: true })) { u.props = u.props.filter(x => x !== p); redo(); } }
  };
  MSA.multi.simple(el, { key: 'upwork', item: '.uw-row', get: id => u.props.find(x => x.id === id), btnHost: '.row', name: x => x.title || '', refresh: redo,
    extra: [
      { id: 'edit', label: T('تعديل', 'Edit'), icon: 'pencil', single: true, run: l => UW.edit(l[0], () => MSA.rerender(true)) },
      { id: 'copy', label: T('نسخ النص', 'Copy'), icon: 'copy', single: true, run: async l => { const p = l[0], t = p.text || plain(fill(u.tpl.html, p)); try { await navigator.clipboard.writeText(t); MSA.toast(T('تم النسخ', 'Copied'), 'ok'); } catch (x) { MSA.toast(T('تعذر النسخ', 'Could not copy'), 'err'); } } },
      { id: 'word', label: 'Word', icon: 'download', single: true, run: l => UW.word(l[0]) },
      { id: 'open', label: T('فتح الوظيفة', 'Open job'), icon: 'external', single: true, when: l => !!l[0].url, run: l => MSA.openLink(l[0].url) },
      { id: 'st', label: T('الحالة', 'Status'), icon: 'flag', sub: () => Object.keys(ST).map(k => ({ id: 'st:' + k, label: ST[k][0], dot: ST[k][1] })), run: (l, k) => { l.forEach(p => { p.status = k; if (k === 'hired' && p.client) { const r = MSA.clients.ensure(p.client); if (r && !/upwork/i.test(r.c.source || '')) r.c.source = 'Upwork'; } }); redo(); } }
    ],
    del: async l => { const ids = new Set(l.map(x => x.id)); u.props = u.props.filter(x => !ids.has(x.id)); } });
}
function clientsTab(el){
  const list = UW.clients();
  el.innerHTML = list.length ? '<div class="uw-list">' + list.map(c => '<div class="uw-row"><div class="uw-m"><b dir="auto">' + esc(c.name) + '</b></div><div class="uw-n"><span>' + c.n + ' ' + esc(T('مشروع', 'project(s)')) + '</span><span dir="ltr">' + Math.round(c.val).toLocaleString('en-US') + ' ' + esc(T('ج.م', 'EGP')) + '</span></div><div class="row" style="gap:6px;margin-top:8px"><button class="btn sm" data-uc="msg" data-n="' + esc(c.name) + '">' + I('mail', 'sm') + esc(T('رسالة جاهزة', 'Ready message')) + '</button><button class="btn sm" data-uc="sheet" data-n="' + esc(c.name) + '">' + I('user', 'sm') + esc(T('في شيت العملاء', 'In clients sheet')) + '</button></div></div>').join('') + '</div>'
    : MSA.empty('briefcase', T('لسه مفيش عملاء من Upwork', 'No Upwork clients yet'), T('أي عرض تغيّر حالته لـ«اتوظفت» بيضيف العميل هنا وفي شيت العملاء (المصدر: Upwork) تلقائيًا. تقدر كمان تختار «Upwork» كمصدر لأي عميل في الشيت.', 'Mark a proposal as Hired and its client is added here and to the clients sheet (source: Upwork). You can also set a client’s source to Upwork in the sheet.'));
  el.onclick = e => { const b = e.target.closest('[data-uc]'); if (!b) return; if (b.dataset.uc === 'msg') MSA.plus.messages({ client: b.dataset.n, kind: 'follow' }); else { const d = MSA.clients.data(); d.q = b.dataset.n; d.stat = ''; MSA.save(); MSA.go('clients'); } };
}
function tplTab(el){
  const u = UW.data();
  el.innerHTML = '<div class="hint" style="margin-bottom:8px">' + esc(T('اكتب الـ Proposal بتاعك هنا (هنظبطه مع بعض). استخدم {client} و{job} و{name} و{rate} وهتتبدل تلقائيًا لكل عرض. نزّله Word في أي وقت.', 'Write your proposal here (we will polish it together). Use {client}, {job}, {name} and {rate} — they are replaced per proposal. Download as Word any time.')) + '</div>' +
    '<div class="cd-bar row" style="gap:6px;flex-wrap:wrap;margin-bottom:6px"><button class="btn sm" data-tp="b"><b>B</b></button><button class="btn sm" data-tp="i"><i>I</i></button><button class="btn sm" data-tp="h2">H</button><button class="btn sm" data-tp="ul">• ' + esc(T('قائمة', 'List')) + '</button><button class="btn sm" data-tp="ol">1. ' + esc(T('ترقيم', 'Numbered')) + '</button><button class="btn sm" data-tp="rtl">RTL/LTR</button><span class="grow"></span><button class="btn sm" data-tp="reset">' + esc(T('القالب الافتراضي', 'Default template')) + '</button><button class="btn sm primary" data-tp="dl">' + I('download', 'sm') + esc(T('نزّل Word', 'Download Word')) + '</button></div>' +
    '<div class="cd-ed uw-ed" id="uwEd" contenteditable="true" dir="auto"></div>';
  const ed = $('#uwEd', el); ed.innerHTML = U.sanitize ? U.sanitize(u.tpl.html) : u.tpl.html;
  let tm = null; ed.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { u.tpl.html = ed.innerHTML; u.tpl.updated = Date.now(); MSA.save(); }, 400); });
  el.querySelector('.cd-bar').addEventListener('mousedown', e => { if (e.target.closest('[data-tp]')) e.preventDefault(); });
  el.onclick = async e => {
    const b = e.target.closest('[data-tp]'); if (!b) return; const a = b.dataset.tp; ed.focus();
    if (a === 'b') document.execCommand('bold'); else if (a === 'i') document.execCommand('italic'); else if (a === 'h2') document.execCommand('formatBlock', false, 'h2');
    else if (a === 'ul') document.execCommand('insertUnorderedList'); else if (a === 'ol') document.execCommand('insertOrderedList'); else if (a === 'rtl') ed.dir = ed.dir === 'rtl' ? 'ltr' : 'rtl';
    else if (a === 'reset') { if (await MSA.confirm(T('هترجع للقالب الافتراضي وتتمسح تعديلاتك. متأكد؟', 'Back to the default template — your edits are lost. Sure?'), { danger: true })) { u.tpl.html = defTpl(); MSA.save(); tplTab(el); } return; }
    else if (a === 'dl') { u.tpl.html = ed.innerHTML; MSA.save(); dl(MSA.docx.build(u.tpl.html, { title: '', rtl: ed.dir === 'rtl', author: S().profile.name || '' }), 'upwork-proposal-template.docx'); return; }
    u.tpl.html = ed.innerHTML; u.tpl.updated = Date.now(); MSA.save();
  };
}
function meTab(el){
  const u = UW.data(), p = u.profile;
  const f = (k, l, ph, type) => '<div class="field"><label class="f">' + esc(l) + '</label><input data-mp="' + k + '" type="' + (type || 'text') + '" dir="auto" value="' + esc(p[k] || '') + '" placeholder="' + esc(ph || '') + '"></div>';
  el.innerHTML = '<div class="grid2">' + f('url', T('رابط بروفايل Upwork', 'Upwork profile link'), 'https://www.upwork.com/freelancers/~…') + f('title', T('عنوان البروفايل', 'Profile title'), 'Graphic Designer & Video Editor') + f('rate', T('سعر الساعة ($)', 'Hourly rate ($)'), '', 'number') + f('jss', T('Job Success Score', 'Job Success Score'), '100%') + '</div>' +
    '<div class="field"><label class="f">' + esc(T('المهارات (مفصولة بفواصل)', 'Skills (comma separated)')) + '</label><input data-mp="skills" dir="auto" value="' + esc(p.skills || '') + '"></div>' +
    '<div class="field"><label class="f">' + esc(T('نبذة البروفايل (Overview)', 'Profile overview')) + '</label><textarea data-mp="overview" rows="6" dir="auto">' + esc(p.overview || '') + '</textarea></div>' +
    '<div class="field"><label class="f">' + esc(T('ربط الـ CV: ملاحظات (إيه المشاريع اللي بتحطها في الـ CV وفي الـ Proposal)', 'CV link: notes (which projects you feature in your CV and proposals)')) + '</label><textarea data-mp="cvNote" rows="4" dir="auto">' + esc(p.cvNote || '') + '</textarea></div>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap">' + (p.url ? '<button class="btn sm" data-me="open">' + I('external', 'sm') + esc(T('افتح البروفايل', 'Open profile')) + '</button>' : '') + '<button class="btn sm" data-me="projects">' + I('trophy', 'sm') + esc(T('مشاريعي المكتملة (للـ Portfolio)', 'My completed projects (portfolio)')) + '</button></div>';
  el.onchange = e => { const k = e.target.dataset.mp; if (!k) return; p[k] = k === 'rate' ? num(e.target.value) : e.target.value.trim(); MSA.save(); };
  el.onclick = e => { const b = e.target.closest('[data-me]'); if (!b) return; if (b.dataset.me === 'open') MSA.openLink(p.url); else { S().ui.doneClient = null; MSA.go('done'); } };
}
MSA.views.upwork = { render };

/* add the Upwork tab button to the other tab rows (clients sheet, completed projects, leads) */
const BTN = () => '<button class="btn sm" data-uwgo="1">' + I('briefcase', 'sm') + '<span>' + esc(T('عملاء Upwork', 'Upwork clients')) + '</span></button>';
document.addEventListener('click', e => { const b = e.target.closest('[data-uwgo]'); if (b) MSA.go('upwork'); }, true);
UW.btn = BTN;
})();
