/* Profitability: which client earns per hour and which one drains you. Reads project time + payments. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$;
const T = (a, e) => MSA.T(a, e), esc = U.esc, S = () => MSA.state;
const num = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
const fm = n => Math.round(num(n)).toLocaleString('en-US');
const toE = (v, c) => (MSA.rates && MSA.rates.has(c) ? MSA.rates.toEGP(v, c) : v);
const pf = MSA.profit = {};

pf.target = () => { const s = S().settings; return num(s.targetHourly) > 0 ? num(s.targetHourly) : 150; };
pf.hours = p => ((p.time && p.time.entries) || []).reduce((a, e) => a + (e.min || 0), 0) / 60;
pf.projectRow = p => {
  const c = (p.time && p.time.cur) || 'EGP', tot = toE(MSA.plus.pay.total(p), c), paid = toE(MSA.plus.pay.paid(p), c), h = pf.hours(p);
  return { p, client: MSA.clients.of(p) || '', tot, paid, h, hr: h > 0 ? tot / h : 0, late: MSA.plus.pay.lateDays ? MSA.plus.pay.lateDays(p) : 0 };
};
/* verdict for an hourly figure (EGP/hour) */
pf.verdict = (hr, h, tot) => {
  const t = pf.target();
  if (h < 0.25) return tot > 0 ? 'nohrs' : 'none';
  if (hr >= t) return 'top'; if (hr >= t * .6) return 'ok'; return 'drain';
};
pf.byClient = () => {
  const m = new Map();
  S().projects.forEach(p => {
    const r = pf.projectRow(p); if (r.tot <= 0 && r.h <= 0) return; const k = (r.client || '').toLowerCase() || '—';
    if (!m.has(k)) m.set(k, { name: r.client || T('بدون عميل', 'No client'), tot: 0, paid: 0, h: 0, n: 0, late: 0, rows: [] });
    const g = m.get(k); g.tot += r.tot; g.paid += r.paid; g.h += r.h; g.n++; g.late = Math.max(g.late, r.late); g.rows.push(r);
  });
  return [...m.values()].map(g => Object.assign(g, { hr: g.h > 0 ? g.tot / g.h : 0, v: pf.verdict(g.h > 0 ? g.tot / g.h : 0, g.h, g.tot) }));
};
const VL = () => ({ top: [T('رابح', 'Top earner'), '#2fa66d'], ok: [T('معقول', 'Fair'), '#5b8def'], drain: [T('بيستهلكك', 'Drains you'), '#e5484d'], nohrs: [T('بدون وقت مسجل', 'No time logged'), '#8a8a86'], none: [T('—', '—'), '#8a8a86'] });

pf.render = function(host){
  const list = pf.byClient(), V = VL(), t = pf.target();
  const withH = list.filter(g => g.h >= 0.25).sort((a, b) => b.hr - a.hr), noH = list.filter(g => g.h < 0.25);
  const totH = list.reduce((a, g) => a + g.h, 0), totR = list.reduce((a, g) => a + g.tot, 0), avg = totH > 0 ? totR / totH : 0;
  const best = withH[0], worst = withH.length > 1 ? withH[withH.length - 1] : null;
  host.innerHTML = '<div class="pfx"><div class="pl-head"><div><b>' + esc(T('ربحية العملاء', 'Client profitability')) + '</b><div class="hint">' + esc(T('الإيراد ÷ الساعات المسجلة في «الوقت والتسعير» لكل مشروع، بالجنيه. سجّل وقتك على المشاريع عشان الأرقام تطلع دقيقة.', 'Revenue ÷ the hours logged in each project’s Time & pricing tab, in EGP. Log your time for accurate numbers.')) + '</div></div>' +
    '<div class="row" style="gap:8px;align-items:center"><label class="f" style="margin:0">' + esc(T('هدف ساعتك (ج.م)', 'Your target (EGP/h)')) + '</label><input type="number" id="pfT" min="1" style="width:90px" value="' + t + '"></div></div>' +
    (list.length ? '<div class="mny-kpis"><div class="kp"><span>' + esc(T('متوسط ربح الساعة', 'Average per hour')) + '</span><b><span dir="ltr">' + fm(avg) + '</span> ' + esc(T('ج.م', 'EGP')) + '</b><i>' + fm(totH) + ' ' + esc(T('ساعة', 'h')) + '</i></div>' +
      '<div class="kp ok"><span>' + esc(T('أكتر عميل رابح', 'Best client')) + '</span><b dir="auto">' + esc(best ? best.name : '—') + '</b><i dir="ltr">' + (best ? fm(best.hr) + ' / h' : '') + '</i></div>' +
      '<div class="kp ' + (worst && worst.v === 'drain' ? 'bad' : '') + '"><span>' + esc(T('أكتر عميل مستهلك', 'Biggest drain')) + '</span><b dir="auto">' + esc(worst ? worst.name : '—') + '</b><i dir="ltr">' + (worst ? fm(worst.hr) + ' / h' : '') + '</i></div></div>' +
      '<div class="pf-list">' + withH.map(g => { const w = Math.min(100, Math.round(g.hr / Math.max(t * 1.5, withH[0].hr) * 100)), c = V[g.v][1];
        return '<div class="pf-row" data-v="' + g.v + '"><div class="pf-m"><b dir="auto">' + esc(g.name) + '</b><span class="pill-s" style="background:' + c + '">' + esc(V[g.v][0]) + '</span>' + (g.late > 0 ? '<span class="pill-s" style="background:#e5484d">' + esc(T('متأخر ' + g.late + ' يوم', g.late + ' d late')) + '</span>' : '') + '</div>' +
          '<div class="pf-bar"><i style="width:' + w + '%;background:' + c + '"></i></div>' +
          '<div class="pf-n"><span><b dir="ltr">' + fm(g.hr) + '</b> ' + esc(T('ج.م/ساعة', 'EGP/h')) + '</span><span dir="ltr">' + fm(g.h) + ' h</span><span dir="ltr">' + fm(g.tot) + ' ' + esc(T('ج.م', 'EGP')) + '</span><span>' + g.n + ' ' + esc(T('مشروع', 'project(s)')) + '</span><span>' + esc(T('تحصيل', 'Collected')) + ' <b dir="ltr">' + (g.tot > 0 ? Math.round(g.paid / g.tot * 100) : 0) + '%</b></span></div></div>'; }).join('') + '</div>' +
      (noH.length ? '<div class="hint" style="margin-top:12px">' + esc(T('عملاء بدون ساعات مسجلة (مش داخلين في الحساب): ', 'Clients with no logged hours (not counted): ')) + noH.map(g => esc(g.name)).join('، ') + '</div>' : '')
      : MSA.empty('chart', T('لسه مفيش بيانات كفاية', 'Not enough data yet'), T('حدد سعرًا وسجّل ساعات على مشروع من تبويب «الوقت والتسعير» وهتظهر الربحية هنا.', 'Set a price and log hours on a project (Time & pricing tab) and profitability shows up here.'))) + '</div>';
  const inp = $('#pfT', host); if (inp) inp.onchange = e => { S().settings.targetHourly = Math.max(1, num(e.target.value) || 150); MSA.save(); pf.render(host); };
};
})();
