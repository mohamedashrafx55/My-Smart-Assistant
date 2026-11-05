/* Reports: statistics + infographics (inline SVG) + narrative insights + every project's text, pictures, links and
   videos opened right inside the report (nothing sends you away). Tapping a chart bar / slice filters the project list below. */
(function(){
'use strict';
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc;
const en = () => MSA.state.settings.lang === 'en';
Object.assign(MSA.dict.en, { 'nav.reports': 'Reports', 'nav.s.reports': 'Reports' });
Object.assign(MSA.dict.ar, { 'nav.reports': 'التقارير', 'nav.s.reports': 'التقارير' });

const P = () => MSA.proj;
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
const nf = n => Math.round(n).toLocaleString(en() ? 'en-US' : 'ar-EG');
const toEGP = (a, cur) => { try { return !cur || cur === 'EGP' ? a : (MSA.rates && MSA.rates.has(cur) ? MSA.rates.toEGP(a, cur) : a); } catch (e) { return a; } };
const COL = ['#5b8def', '#3ccf91', '#f0b43c', '#9b6bff', '#ff6b9a', '#18b4c8', '#ef7b45', '#8a8a86'];
const MON_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mname = m => (en() ? MON_EN : MON_AR)[m];
const REP = new WeakMap();
const ST = () => { const u = MSA.state.ui; u.rep = u.rep || { range: 6, open: {}, filter: null }; if (!u.rep.open) u.rep.open = {}; return u.rep; };

/* ---------------------------------------------------------------- data */
function collect(){
  const s = MSA.state, R = ST(), now = new Date();
  const projects = s.projects || [], tasks = (s.tasks || []).filter(x => x.type === 'task');
  const months = [];
  const n = R.range === 0 ? 12 : R.range;
  for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ y: d.getFullYear(), m: d.getMonth(), key: d.getFullYear() + '-' + d.getMonth(), done: 0, money: 0, mins: 0, tasks: 0 }); }
  const mk = ts => { const d = new Date(ts); return d.getFullYear() + '-' + d.getMonth(); };
  const byKey = {}; months.forEach(x => { byKey[x.key] = x; });
  const typeCount = {}, clientMoney = {}, clientCount = {};
  let money = 0, paid = 0, mins = 0, revs = 0, doneN = 0, late = 0;
  const tcat = p => { const d = ((MSA.tpl && MSA.tpl.TYPES) || []).find(x => x[0] === p.type); return d ? d[1] : 'other'; };
  const catName = c => { const d = ((MSA.tpl && MSA.tpl.CATS) || []).find(x => x[0] === c); return d ? T(d[1], d[2]) : T('أخرى', 'Other'); };
  projects.forEach(p => {
    let tot = 0, pd = 0, cur = 'EGP';
    try { tot = MSA.plus.pay.total(p) || 0; pd = MSA.plus.pay.paid(p) || 0; cur = MSA.plus.pay.cur(p) || 'EGP'; } catch (e) {}
    const egp = toEGP(tot, cur), pegp = toEGP(pd, cur);
    const pm = ((p.time && p.time.entries) || []).reduce((a, e) => a + num(e.min), 0);
    const ts = p.status === 'done' ? (p.completedAt || p.created) : null;
    REP.set(p, { egp, pegp, pm, cur, tot, pd });
    if (ts && byKey[mk(ts)]) { const b = byKey[mk(ts)]; b.done++; b.money += egp; }
    if (p.status === 'done' && (ts && byKey[mk(ts)])) {
      doneN++; money += egp; paid += pegp; revs += (p.revs || []).reduce((a, r) => a + Math.max(0, r.rounds.length - 1), 0);
      const cn = catName(tcat(p)); typeCount[cn] = (typeCount[cn] || 0) + 1;
      const cl = (MSA.clients && MSA.clients.of ? MSA.clients.of(p) : p.client) || ''; if (cl) { clientMoney[cl] = (clientMoney[cl] || 0) + egp; clientCount[cl] = (clientCount[cl] || 0) + 1; }
    }
    ((p.time && p.time.entries) || []).forEach(e => { const dt = e.date ? new Date(e.date + 'T12:00:00') : null; if (dt && byKey[dt.getFullYear() + '-' + dt.getMonth()]) { byKey[dt.getFullYear() + '-' + dt.getMonth()].mins += num(e.min); mins += num(e.min); } });
    if (p.status !== 'done' && p.deliver && new Date(p.deliver) < now) late++;
  });
  const tdone = { done: 0, doing: 0, todo: 0 };
  tasks.forEach(x => {
    if (x.status === 'done') { tdone.done++; if (x.completedAt && byKey[mk(x.completedAt)]) byKey[mk(x.completedAt)].tasks++; }
    else if (x.status === 'doing') tdone.doing++; else tdone.todo++;
  });
  return { months, projects, tasks, typeCount, clientMoney, clientCount, money, paid, mins, revs, doneN, late, tdone, active: projects.filter(p => p.status !== 'done').length };
}

/* ---------------------------------------------------------------- charts (inline SVG, theme aware via currentColor / CSS vars) */
function bars(data, o){
  const w = 320, h = 150, pad = 22, bw = Math.min(34, (w - pad * 2) / data.length - 8), max = Math.max(1, ...data.map(d => d.v));
  let g = '';
  data.forEach((d, i) => {
    const x = pad + i * ((w - pad * 2) / data.length) + ((w - pad * 2) / data.length - bw) / 2, bh = Math.max(d.v ? 3 : 0, d.v / max * (h - 42));
    g += '<g class="rp-bar" data-k="' + esc(d.k) + '" tabindex="0" role="button" aria-label="' + esc(d.l + ': ' + d.t) + '"><rect x="' + x + '" y="' + (h - 22 - bh) + '" width="' + bw + '" height="' + bh + '" rx="5" fill="' + (d.c || o.color) + '"/>' +
      (d.v ? '<text x="' + (x + bw / 2) + '" y="' + (h - 26 - bh) + '" text-anchor="middle" class="rp-v">' + esc(d.t) + '</text>' : '') +
      '<text x="' + (x + bw / 2) + '" y="' + (h - 6) + '" text-anchor="middle" class="rp-l">' + esc(d.l) + '</text></g>';
  });
  if (!data.some(d => d.v)) g += '<text x="' + w / 2 + '" y="' + (h / 2 - 14) + '" text-anchor="middle" class="rp-l">' + esc(T('لسه مفيش بيانات في الفترة دي', 'No data in this period yet')) + '</text>';
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="rp-svg" role="img" aria-label="' + esc(o.label) + '" direction="ltr">' + g + '</svg>';
}
function line(data, color, label){
  const w = 320, h = 150, pad = 24, max = Math.max(1, ...data.map(d => d.v)), step = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [pad + i * step, h - 26 - d.v / max * (h - 52)]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = path + ' L' + pts[pts.length - 1][0] + ' ' + (h - 26) + ' L' + pts[0][0] + ' ' + (h - 26) + ' Z';
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="rp-svg" role="img" aria-label="' + esc(label) + '" direction="ltr"><path d="' + area + '" fill="' + color + '" opacity=".14"/><path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
    pts.map((p, i) => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" fill="' + color + '"/>' + (data[i].v ? '<text x="' + p[0] + '" y="' + (p[1] - 8) + '" text-anchor="middle" class="rp-v">' + esc(data[i].t) + '</text>' : '') + '<text x="' + p[0] + '" y="' + (h - 8) + '" text-anchor="middle" class="rp-l">' + esc(data[i].l) + '</text>').join('') + '</svg>';
}
function donut(parts, label, centre){
  const tot = parts.reduce((a, p) => a + p.v, 0); if (!tot) return '';
  const r = 46, C = 2 * Math.PI * r; let off = 0, g = '';
  parts.forEach((p, i) => { const len = p.v / tot * C; g += '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + p.c + '" stroke-width="18" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 60 60)"><title>' + esc(p.l + ': ' + p.v) + '</title></circle>'; off += len; });
  const leg = parts.map(p => '<li><i style="background:' + p.c + '"></i><span>' + esc(p.l) + '</span><b>' + p.v + '</b></li>').join('');
  return '<div class="rp-donut"><svg viewBox="0 0 120 120" role="img" aria-label="' + esc(label) + '">' + g + '<text x="60" y="58" text-anchor="middle" class="rp-big">' + esc(centre) + '</text><text x="60" y="74" text-anchor="middle" class="rp-l">' + esc(label) + '</text></svg><ul class="rp-leg">' + leg + '</ul></div>';
}
function hbars(rows, fmt){
  const max = Math.max(1, ...rows.map(r => r.v));
  return '<div class="rp-h">' + rows.map((r, i) => '<div class="rp-hr"><span class="rp-hn" dir="auto">' + esc(r.l) + '</span><div class="rp-ht"><div style="width:' + Math.max(3, r.v / max * 100) + '%;background:' + COL[i % COL.length] + '"></div></div><b>' + esc(fmt(r.v)) + '</b></div>').join('') + '</div>';
}

/* ---------------------------------------------------------------- narrative */
function insights(d){
  const out = [], best = d.months.slice().sort((a, b) => b.done - a.done)[0];
  if (d.doneN) out.push(T('خلّصت ' + nf(d.doneN) + ' مشروع في الفترة دي' + (d.money ? ' بإجمالي ' + nf(d.money) + ' ج.م' : '') + '.', 'You finished ' + nf(d.doneN) + ' projects in this period' + (d.money ? ', worth ' + nf(d.money) + ' EGP' : '') + '.'));
  else out.push(T('لسه مفيش مشاريع مكتملة في الفترة دي.', 'No completed projects in this period yet.'));
  if (best && best.done > 1) out.push(T('أنشط شهر كان ' + mname(best.m) + ' بـ ' + nf(best.done) + ' مشاريع.', 'Busiest month was ' + mname(best.m) + ' with ' + nf(best.done) + ' projects.'));
  const cl = Object.entries(d.clientMoney).sort((a, b) => b[1] - a[1]);
  if (cl.length && d.money > 0) { const share = Math.round(cl[0][1] / d.money * 100); out.push(T('أكبر عميل: ' + cl[0][0] + ' (' + share + '٪ من الدخل)' + (share > 60 ? ' — اعتمادك عليه كبير، حاول توزّع.' : '.'), 'Top client: ' + cl[0][0] + ' (' + share + '% of income)' + (share > 60 ? ' — heavy reliance, consider diversifying.' : '.'))); }
  if (d.doneN && d.revs) out.push(T('متوسط التعديلات لكل مشروع: ' + (d.revs / d.doneN).toFixed(1) + '.', 'Average revisions per project: ' + (d.revs / d.doneN).toFixed(1) + '.'));
  if (d.mins) out.push(T('سجّلت ' + (d.mins / 60).toFixed(1) + ' ساعة شغل' + (d.doneN ? ' (حوالي ' + (d.mins / 60 / d.doneN).toFixed(1) + ' ساعة للمشروع)' : '') + '.', 'Logged ' + (d.mins / 60).toFixed(1) + ' h of work' + (d.doneN ? ' (~' + (d.mins / 60 / d.doneN).toFixed(1) + ' h per project)' : '') + '.'));
  if (d.money > d.paid + 1) out.push(T('فيه ' + nf(d.money - d.paid) + ' ج.م لسه متحصّلتش من المشاريع المكتملة.', nf(d.money - d.paid) + ' EGP still uncollected on completed projects.'));
  if (d.late) out.push(T('انتبه: ' + nf(d.late) + ' مشروع متأخر عن موعد التسليم.', 'Heads up: ' + nf(d.late) + ' project(s) past their delivery date.'));
  return out;
}

/* ---------------------------------------------------------------- project panel (opens inside the report) */
function stageHTML(s, depth){
  const lk = (s.atts || []).filter(a => a.kind === 'link'), media = (s.atts || []).filter(a => a.kind !== 'link');
  const has = s.note || (s.atts && s.atts.length) || (s.children && s.children.length);
  if (!has && !s.done) return '';
  return '<div class="rp-st' + (s.done ? ' ok' : '') + '" style="margin-inline-start:' + depth * 14 + 'px"><div class="rp-sh">' + I(s.done ? 'check' : 'circle', 'sm') + '<b dir="auto">' + esc(P().title(s)) + '</b></div>' +
    (s.note ? '<p class="rp-nt" dir="auto">' + esc(s.note) + '</p>' : '') +
    (media.length ? '<div class="atts rp-at">' + media.map(a => MSA.attHTML(a)).join('') + '</div>' : '') +
    (lk.length ? '<div class="rp-lk">' + lk.map(a => '<button class="rp-chip" data-att="' + a.id + '">' + I('play', 'sm') + '<span dir="auto">' + esc((a.name || a.url || '').slice(0, 40)) + '</span></button>').join('') + '</div>' : '') + '</div>' +
    (s.children || []).map(c => stageHTML(c, depth + 1)).join('');
}
function panel(p){
  const pr = P().progress(p), r = REP.get(p) || {}, rounds = (p.revs || []).reduce((a, x) => a + Math.max(0, x.rounds.length - 1), 0);
  const facts = [[T('الإنجاز', 'Progress'), pr.pct + '%'], r.tot ? [T('السعر', 'Price'), nf(r.tot) + ' ' + (r.cur || '')] : null, r.pd ? [T('مدفوع', 'Paid'), nf(r.pd) + ' ' + (r.cur || '')] : null, r.pm ? [T('الوقت', 'Time'), (r.pm / 60).toFixed(1) + (en() ? ' h' : ' س')] : null, rounds ? [T('التعديلات', 'Revisions'), nf(rounds)] : null].filter(Boolean);
  return '<div class="rp-pn"><div class="rp-facts">' + facts.map(f => '<div><small>' + esc(f[0]) + '</small><b>' + esc(f[1]) + '</b></div>').join('') + '</div>' +
    (p.brief ? '<p class="rp-nt" dir="auto">' + esc(String(p.brief).slice(0, 600)) + '</p>' : '') +
    (p.steps || []).map(s => stageHTML(s, 0)).join('') + '</div>';
}
function projCard(p){
  const R = ST(), open = !!R.open[p.id], pr = P().progress(p), done = p.status === 'done';
  const cl = (MSA.clients && MSA.clients.of ? MSA.clients.of(p) : p.client) || '';
  return '<div class="rp-pc' + (open ? ' open' : '') + '" data-p="' + p.id + '"><button class="rp-ph" data-tog="' + p.id + '" aria-expanded="' + open + '">' + I(open ? 'chev-d' : 'chev-r', 'sm flip') +
    '<span class="rp-pt" dir="auto">' + esc(p.name || '') + (cl ? '<small dir="auto"> · ' + esc(cl) + '</small>' : '') + '</span>' +
    '<span class="rp-pb"><i style="width:' + pr.pct + '%"></i></span><span class="badge">' + (done ? I('check', 'sm') + esc(MSA.fmtDate ? MSA.fmtDate(p.completedAt || p.created) : '') : pr.pct + '%') + '</span></button>' +
    (open ? panel(p) : '') + '</div>';
}

/* ---------------------------------------------------------------- view */
function draw(h){
  const R = ST(), d = collect();
  const money = d.months.map(m => ({ k: m.key, l: mname(m.m), v: Math.round(m.money), t: nf(m.money) }));
  const done = d.months.map(m => ({ k: m.key, l: mname(m.m), v: m.done, t: String(m.done), c: '#5b8def' }));
  const hours = d.months.map(m => ({ l: mname(m.m), v: Math.round(m.mins / 6) / 10, t: String(Math.round(m.mins / 6) / 10) }));
  const types = Object.entries(d.typeCount).sort((a, b) => b[1] - a[1]).map((e, i) => ({ l: e[0], v: e[1], c: COL[i % COL.length] }));
  const tasks = [{ l: T('تمت', 'Done'), v: d.tdone.done, c: '#3ccf91' }, { l: T('جارية', 'Doing'), v: d.tdone.doing, c: '#f0b43c' }, { l: T('لسه', 'To do'), v: d.tdone.todo, c: '#8a8a86' }].filter(x => x.v);
  const clients = Object.entries(d.clientMoney).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => ({ l: e[0], v: e[1] }));
  const kpi = (ic, v, l, c) => '<div class="rp-k" style="--c:' + c + '">' + I(ic) + '<b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>';
  const rng = [[3, T('٣ شهور', '3 mo')], [6, T('٦ شهور', '6 mo')], [0, T('سنة', '1 year')]];
  const card = (title, body) => '<section class="rp-c"><h3>' + esc(title) + '</h3>' + body + '</section>';
  let list = d.projects.slice().sort((a, b) => (a.status === 'done') - (b.status === 'done') || (b.completedAt || b.created || 0) - (a.completedAt || a.created || 0));
  let flt = '';
  if (R.filter) {
    list = list.filter(p => { const ts = p.status === 'done' ? (p.completedAt || p.created) : 0; if (!ts) return false; const x = new Date(ts); return x.getFullYear() + '-' + x.getMonth() === R.filter; });
    const [y, m] = R.filter.split('-').map(Number); flt = '<div class="rp-flt">' + I('list', 'sm') + '<span>' + esc(mname(m) + ' ' + y) + '</span><button class="btn sm" data-act="clrf">' + I('x', 'sm') + esc(T('إلغاء الفلتر', 'Clear')) + '</button></div>';
  }
  h.innerHTML = '<div class="page-head"><div><h1>' + esc(MSA.t('nav.reports')) + '</h1><p class="sub">' + esc(T('أرقامك ورسومك، وتفاصيل كل مشروع بصوره ولينكاته، كله في مكان واحد', 'Your numbers, charts and every project\'s details — all in one place')) + '</p></div>' +
    '<div class="rp-rng">' + rng.map(r => '<button class="btn sm' + (R.range === r[0] ? ' primary' : '') + '" data-rng="' + r[0] + '">' + esc(r[1]) + '</button>').join('') + '<button class="btn sm" data-act="pdf">' + I('download', 'sm') + 'PDF</button></div></div>' +
    '<div class="rp-kpis">' + kpi('trophy', nf(d.doneN), T('مشاريع مكتملة', 'Completed'), '#f0b43c') + kpi('briefcase', nf(d.active), T('قيد التنفيذ', 'In progress'), '#5b8def') +
    kpi('trend', nf(d.money), T('الدخل (ج.م)', 'Income (EGP)'), '#3ccf91') + kpi('clock', (d.mins / 60).toFixed(1), T('ساعات شغل', 'Hours'), '#9b6bff') + '</div>' +
    '<section class="rp-c rp-ins"><h3>' + I('bulb', 'sm') + esc(T('الخلاصة', 'Summary')) + '</h3><ul>' + insights(d).map(x => '<li dir="auto">' + esc(x) + '</li>').join('') + '</ul></section>' +
    '<div class="rp-grid">' + card(T('مشاريع مكتملة شهريًا', 'Completed per month'), bars(done, { color: '#5b8def', label: T('مشاريع مكتملة شهريًا', 'Completed per month') }) + '<p class="hint">' + esc(T('اضغط على عمود عشان تشوف مشاريع الشهر تحت', 'Tap a bar to list that month\'s projects below')) + '</p>') +
    card(T('الدخل شهريًا (ج.م)', 'Income per month (EGP)'), bars(money, { color: '#3ccf91', label: T('الدخل شهريًا', 'Income per month') })) +
    card(T('ساعات الشغل', 'Work hours'), line(hours, '#9b6bff', T('ساعات الشغل', 'Work hours'))) +
    (types.length ? card(T('أنواع المشاريع', 'Project types'), donut(types, T('مشروع', 'projects'), String(d.doneN))) : '') +
    (tasks.length ? card(T('المهام', 'Tasks'), donut(tasks, T('مهمة', 'tasks'), String(d.tasks.length))) : '') +
    (clients.length ? card(T('أكبر العملاء', 'Top clients'), hbars(clients, v => nf(v))) : '') + '</div>' +
    '<section class="rp-c"><h3>' + I('briefcase', 'sm') + esc(T('تفاصيل المشاريع', 'Project details')) + '</h3>' + flt +
    (list.length ? '<div class="rp-pl">' + list.map(projCard).join('') + '</div>' : '<p class="hint">' + esc(T('مفيش مشاريع هنا', 'No projects here')) + '</p>') + '</section>';
  MSA.hydrateAtts(h);
}

function reportHTML(){
  const d = collect();
  const css = 'h1{font-size:24px;margin:0 0 6px}h2{font-size:16px;margin:16px 0 6px}li,p{font-size:13px}.k{display:inline-block;margin:4px 10px 4px 0;padding:6px 12px;border:1px solid #ddd;border-radius:8px}';
  const body = '<h1>' + esc(MSA.t('nav.reports')) + '</h1>' + [[T('مشاريع مكتملة', 'Completed'), nf(d.doneN)], [T('قيد التنفيذ', 'In progress'), nf(d.active)], [T('الدخل (ج.م)', 'Income (EGP)'), nf(d.money)], [T('ساعات', 'Hours'), (d.mins / 60).toFixed(1)]].map(k => '<span class="k"><b>' + esc(k[1]) + '</b> ' + esc(k[0]) + '</span>').join('') +
    '<h2>' + esc(T('الخلاصة', 'Summary')) + '</h2><ul>' + insights(d).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '<h2>' + esc(T('المشاريع', 'Projects')) + '</h2><ul>' + d.projects.map(p => '<li><b>' + esc(p.name || '') + '</b> — ' + P().progress(p).pct + '%</li>').join('') + '</ul>';
  return { body, css };
}

function wire(h){
  h.addEventListener('click', e => {
    const R = ST(), q = s => e.target.closest(s);
    let b;
    if ((b = q('[data-rng]'))) { R.range = +b.dataset.rng; MSA.save(); draw(h); return; }
    if ((b = q('[data-tog]'))) { const id = b.dataset.tog; R.open[id] = !R.open[id]; draw(h); return; }
    if ((b = q('.rp-bar')) && b.dataset.k) { R.filter = R.filter === b.dataset.k ? null : b.dataset.k; draw(h); const t = $('.rp-pl', h); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if ((b = q('[data-act="clrf"]'))) { R.filter = null; draw(h); return; }
    if ((b = q('[data-act="pdf"]'))) { const r = reportHTML(); if (MSA.pdf && MSA.pdf.flow) MSA.pdf.flow(MSA.t('nav.reports'), r.body, { css: r.css, dir: en() ? 'ltr' : 'rtl' }); return; }
    if ((b = q('.rp-chip[data-att]'))) { const id = b.dataset.att; const a = MSA.state.projects.flatMap(p => P().allAtts(p.steps)).find(x => x.id === id); if (a) { const pb = MSA.player && MSA.player.playable(a.url); if (pb) MSA.player.open(pb.kind === 'embed' ? { title: a.name, embed: pb.url } : { title: a.name, src: pb.url }); else MSA.openLink(a.url); } return; }
    if ((b = q('.att[data-att]'))) { const id = b.dataset.att; const a = MSA.state.projects.flatMap(p => P().allAtts(p.steps)).find(x => x.id === id); if (a) MSA.openAtt(a); }
  });
  h.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('rp-bar')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
}

MSA.views.reports = { render(h){ draw(h); if (!h._rw) { h._rw = 1; wire(h); } } };
})();
