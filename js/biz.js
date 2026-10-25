/* Business tools: payments & the money dashboard, ready-made client messages, auto follow-ups,
   saved client identity and stage deadlines. Everything stays on the device. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$, P = MSA.proj;
const S = () => MSA.state, esc = U.esc, T = (a, e) => MSA.T(a, e);
const en = () => S().settings.lang === 'en';
const today = () => U.dateKey(new Date());
const DAY = 864e5;
const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; };
const money = n => (Math.round(n * 100) / 100).toLocaleString(en() ? 'en-US' : 'ar-EG', { maximumFractionDigits: 2 });
const moneyL = n => (Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 });
const dateMs = k => U.toMs(k + 'T00:00');
const fmtD = k => k ? MSA.fmtDate(dateMs(k)) : '';
const plus = MSA.plus = MSA.plus || {};

/* =====================================================================
   1) PAYMENTS
   ===================================================================== */
const hrsOf = tm => (tm.entries || []).reduce((a, e) => a + e.min, 0) / 60;
const total = p => { const tm = p.time; if (!tm) return 0; return (tm.fixed > 0 ? tm.fixed : hrsOf(tm) * (tm.rate || 0)) + (tm.extras || []).reduce((a, e) => a + e.amt, 0); };
const payOf = p => { const y = p.pay = p.pay || {}; y.items = y.items || []; y.due = y.due || ''; return y; };
const paidOf = p => ((p.pay && p.pay.items) || []).reduce((a, x) => a + (+x.amt || 0), 0);
const remOf = p => Math.max(0, total(p) - paidOf(p));
const curOf = p => (p.time && p.time.cur) || 'EGP';
const egp = (v, c) => (MSA.rates && MSA.rates.has(c) ? MSA.rates.toEGP(v, c) : v);
const status = p => { const t = total(p), pd = paidOf(p); if (t <= 0) return pd > 0 ? 'paid' : 'none'; if (remOf(p) <= 0.005) return 'paid'; return pd > 0 ? 'partial' : 'unpaid'; };
const isLate = p => { const d = p.pay && p.pay.due; return !!d && remOf(p) > 0.005 && dateMs(d) < dateMs(today()); };
const STAT = () => ({ none: [T('بلا سعر', 'No price'), '#8a8a86'], unpaid: [T('غير مدفوع', 'Unpaid'), '#e5484d'], partial: [T('مدفوع جزئيًا', 'Partly paid'), '#f0a030'], paid: [T('مدفوع', 'Paid'), '#2fa66d'] });
plus.fmt0 = n => Math.round(n).toLocaleString(en() ? 'en-US' : 'ar-EG');
plus.pay = { total, paid: paidOf, remaining: remOf, status, isLate, cur: curOf };
plus.convertPay = (p, conv) => { if (p.pay) p.pay.items.forEach(x => { x.amt = conv(x.amt); }); };

function addPayment(p, done){
  const rem = remOf(p);
  MSA.modal({
    title: T('تسجيل دفعة', 'Record a payment'),
    body: '<div class="field"><label class="f">' + esc(T('المبلغ', 'Amount')) + ' (' + curOf(p) + ')</label><input id="pyAmt" type="number" min="0" step="any" value="' + (rem > 0 ? Math.round(rem * 100) / 100 : '') + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('التاريخ', 'Date')) + '</label><input id="pyDate" type="date" value="' + today() + '"></div>' +
      '<div class="field" style="margin:0"><label class="f">' + esc(T('ملاحظة (اختياري)', 'Note (optional)')) + '</label><input id="pyNote" type="text" dir="auto" placeholder="' + esc(T('مثال: عربون / تحويل فودافون كاش', 'e.g. deposit / bank transfer')) + '"></div>',
    buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('تسجيل', 'Record'), cls: 'primary', onClick: a => {
      const amt = num($('#pyAmt', a.el).value); if (amt <= 0) { $('#pyAmt', a.el).focus(); return; }
      payOf(p).items.push({ id: U.uid('py'), date: $('#pyDate', a.el).value || today(), amt, note: $('#pyNote', a.el).value.trim() }); MSA.save(); a.close();
      MSA.toast(T('تم تسجيل الدفعة', 'Payment recorded'), 'ok'); done && done();
    } }],
    onMount: el => setTimeout(() => { const i = $('#pyAmt', el); i.focus(); i.select(); }, 30)
  });
}
plus.addPayment = addPayment;

/* the card shown inside the "Time & pricing" tab */
plus.payCard = function(p, host){
  if (!host) return;
  const y = payOf(p), tot = total(p), pd = paidOf(p), rem = remOf(p), c = curOf(p), st = status(p), SL = STAT()[st];
  host.innerHTML = '<div class="card st-card pay-card"><div class="st-h">' + I('check-c', 'sm') + '<b>' + esc(T('المدفوعات', 'Payments')) + '</b><span class="pill-s" style="background:' + SL[1] + '">' + esc(SL[0]) + '</span></div>' +
    '<div class="pay-sum"><div><span>' + esc(T('الإجمالي', 'Total')) + '</span><b dir="ltr">' + money(tot) + ' ' + c + '</b></div><div><span>' + esc(T('المدفوع', 'Paid')) + '</span><b dir="ltr" style="color:var(--ok,#2fa66d)">' + money(pd) + '</b></div><div><span>' + esc(T('المتبقي', 'Remaining')) + '</span><b dir="ltr" style="color:' + (rem > 0 ? '#e5484d' : 'var(--ok,#2fa66d)') + '">' + money(rem) + '</b></div></div>' +
    '<div class="progress" style="margin:10px 0"><i style="width:' + (tot > 0 ? Math.min(100, Math.round(pd / tot * 100)) : 0) + '%"></i></div>' +
    (y.items.length ? '<table class="st-tbl"><tbody>' + y.items.slice().sort((a, b) => a.date.localeCompare(b.date)).map(x => '<tr><td dir="ltr">' + esc(x.date) + '</td><td dir="auto">' + esc(x.note || '—') + '</td><td dir="ltr"><b>' + money(x.amt) + ' ' + c + '</b></td><td><button class="icon-btn sm danger" data-pdel="' + x.id + '" aria-label="delete">' + I('x', 'sm') + '</button></td></tr>').join('') + '</tbody></table>' : '<div class="hint">' + esc(T('لا توجد دفعات مسجلة بعد.', 'No payments recorded yet.')) + '</div>') +
    '<div class="row" style="margin-top:12px"><button class="btn primary sm" data-pa="add">' + I('plus', 'sm') + esc(T('تسجيل دفعة', 'Record payment')) + '</button>' + (rem > 0.005 && tot > 0 ? '<button class="btn sm" data-pa="full">' + I('check', 'sm') + esc(T('تم دفع المتبقي', 'Mark fully paid')) + '</button>' : '') +
    '<button class="btn sm" data-pa="msg">' + I('mail', 'sm') + esc(T('رسائل جاهزة', 'Ready messages')) + '</button>' +
    '<span class="grow"></span><label class="f" style="margin:0">' + esc(T('موعد الاستحقاق', 'Due date')) + '</label><input type="date" id="pyDue" value="' + esc(y.due) + '" style="width:auto"></div></div>';
  const redo = () => { plus.payCard(p, host); };
  $('[data-pa=add]', host).onclick = () => addPayment(p, redo);
  const full = $('[data-pa=full]', host); if (full) full.onclick = () => { payOf(p).items.push({ id: U.uid('py'), date: today(), amt: Math.round(remOf(p) * 100) / 100, note: T('تسوية المتبقي', 'Settlement') }); MSA.save(); redo(); };
  $('[data-pa=msg]', host).onclick = () => plus.messages({ pid: p.id, kind: rem > 0.005 && pd > 0 || y.due ? 'pay' : 'quote' });
  $$('[data-pdel]', host).forEach(b => b.onclick = () => { y.items = y.items.filter(x => x.id !== b.dataset.pdel); MSA.save(); redo(); });
  $('#pyDue', host).onchange = e => { y.due = e.target.value; MSA.save(); };
};

/* the money dashboard (view "money") */
function moneyRows(){ return S().projects.map(p => ({ p, tot: total(p), pd: paidOf(p), rem: remOf(p), cur: curOf(p), st: status(p) })).filter(r => r.tot > 0); }
function moneyRender(host){
  const rows = moneyRows(), ui = S().ui, f = ui.moneyF || 'open';
  const open = rows.filter(r => r.rem > 0.005), late = open.filter(r => isLate(r.p));
  const sumE = (list, k) => list.reduce((a, r) => a + egp(r[k], r.cur), 0);
  const ym = today().slice(0, 7); let monthIn = 0;
  S().projects.forEach(p => ((p.pay && p.pay.items) || []).forEach(x => { if ((x.date || '').slice(0, 7) === ym) monthIn += egp(+x.amt || 0, curOf(p)); }));
  const unpriced = S().projects.filter(p => total(p) <= 0 && p.status !== 'done').length;
  const shown = rows.filter(r => f === 'all' || (f === 'open' ? r.rem > 0.005 : r.rem <= 0.005)).sort((a, b) => (isLate(b.p) - isLate(a.p)) || b.rem - a.rem);
  const groups = new Map(); shown.forEach(r => { const k = MSA.clients.of(r.p) || ''; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
  const sumLbl = n => '<span dir="ltr">' + money(n) + '</span> ' + esc(T('ج.م', 'EGP'));
  host.innerHTML = '<div class="mny"><div class="mny-head"><h1>' + I('check-c', 'lg') + '<span>' + esc(T('المستحقات والمدفوعات', 'Payments & outstanding')) + '</span></h1><div class="hint">' + esc(T('كل مبلغ لم يتم تحصيله بعد، مجمّعًا باسم العميل (بالجنيه المصري حسب أسعار الصرف).', 'Everything not collected yet, grouped by client (in EGP at your rates).')) + '</div></div>' +
    '<div class="mny-kpis"><div class="kp bad"><span>' + esc(T('غير محصّل', 'Outstanding')) + '</span><b>' + sumLbl(sumE(open, 'rem')) + '</b><i>' + open.length + ' ' + esc(T('مشروع', 'project(s)')) + '</i></div>' +
    '<div class="kp ' + (late.length ? 'bad' : '') + '"><span>' + esc(T('متأخر عن موعده', 'Overdue')) + '</span><b>' + sumLbl(sumE(late, 'rem')) + '</b><i>' + late.length + ' ' + esc(T('مشروع', 'project(s)')) + '</i></div>' +
    '<div class="kp ok"><span>' + esc(T('محصّل هذا الشهر', 'Collected this month')) + '</span><b>' + sumLbl(monthIn) + '</b><i></i></div></div>' +
    '<div class="pchips" style="margin:14px 0">' + [['open', T('غير محصّل', 'Outstanding')], ['all', T('الكل', 'All')], ['paid', T('مدفوع بالكامل', 'Paid in full')]].map(x => '<button class="pchip' + (f === x[0] ? ' on' : '') + '" data-ma="f" data-v="' + x[0] + '">' + esc(x[1]) + '</button>').join('') + '</div>' +
    (shown.length ? [...groups.entries()].map(([cl, list]) => '<div class="mny-grp"><div class="mny-gh"><b dir="auto">' + esc(cl || T('بدون عميل', 'No client')) + '</b><span>' + esc(T('المتبقي', 'Remaining')) + ': ' + sumLbl(sumE(list, 'rem')) + '</span></div>' +
      list.map(r => { const SL = STAT()[r.st], late = isLate(r.p), pct = r.tot > 0 ? Math.min(100, Math.round(r.pd / r.tot * 100)) : 0;
        return '<div class="mny-row" data-pid="' + r.p.id + '"><div class="mr-main"><button class="mr-name" data-ma="open" dir="auto">' + esc(r.p.name) + '</button><span class="pill-s" style="background:' + SL[1] + '">' + esc(SL[0]) + '</span>' + (r.p.status === 'done' ? '<span class="pill-s" style="background:#5b8def">' + esc(T('مكتمل', 'Done')) + '</span>' : '') + (late ? '<span class="pill-s" style="background:#e5484d">' + esc(T('متأخر', 'Overdue')) + '</span>' : '') + '</div>' +
          '<div class="mr-nums"><span>' + esc(T('الإجمالي', 'Total')) + ' <b dir="ltr">' + money(r.tot) + ' ' + r.cur + '</b></span><span>' + esc(T('مدفوع', 'Paid')) + ' <b dir="ltr">' + money(r.pd) + '</b></span><span>' + esc(T('متبقي', 'Left')) + ' <b dir="ltr" style="color:' + (r.rem > 0.005 ? '#e5484d' : '#2fa66d') + '">' + money(r.rem) + '</b></span>' + (r.p.pay && r.p.pay.due ? '<span>' + esc(T('الاستحقاق', 'Due')) + ' <b dir="ltr">' + esc(r.p.pay.due) + '</b></span>' : '') + '</div>' +
          '<div class="progress" style="margin:8px 0"><i style="width:' + pct + '%"></i></div>' +
          '<div class="row mr-acts">' + (r.rem > 0.005 ? '<button class="btn sm primary" data-ma="pay">' + I('plus', 'sm') + esc(T('دفعة', 'Payment')) + '</button><button class="btn sm" data-ma="remind">' + I('mail', 'sm') + esc(T('رسالة تذكير', 'Send reminder')) + '</button>' : '<button class="btn sm" data-ma="thanks">' + I('mail', 'sm') + esc(T('رسالة تسليم', 'Delivery message')) + '</button>') + '<button class="btn sm" data-ma="open">' + I('external', 'sm') + esc(T('فتح المشروع', 'Open project')) + '</button></div></div>'; }).join('') + '</div>').join('')
      : MSA.empty('check-c', f === 'open' ? T('كل مستحقاتك محصّلة 🎉', 'Everything is collected 🎉') : T('لا يوجد شيء هنا', 'Nothing here'), rows.length ? '' : T('حدد سعرًا لمشروع من تبويب «الوقت والتسعير» وسيظهر هنا.', 'Set a price on a project (Time & pricing tab) and it will show up here.'))) +
    (unpriced ? '<div class="hint" style="margin-top:14px">' + esc(T(unpriced + ' مشروع قيد التنفيذ بلا سعر محدد (لا يظهر هنا).', unpriced + ' project(s) in progress have no price yet (not listed).')) + '</div>' : '') + '</div>';
  host.onclick = e => {
    const b = e.target.closest('[data-ma]'); if (!b) return; const a = b.dataset.ma;
    if (a === 'f') { ui.moneyF = b.dataset.v; MSA.save(); MSA.rerender(); return; }
    const row = b.closest('[data-pid]'), p = row && S().projects.find(x => x.id === row.dataset.pid); if (!p) return;
    if (a === 'pay') addPayment(p, () => MSA.rerender());
    else if (a === 'remind') plus.messages({ pid: p.id, kind: 'pay' });
    else if (a === 'thanks') plus.messages({ pid: p.id, kind: 'delivery' });
    else if (a === 'open') plus.openProject(p, 'time');
  };
}
MSA.views.money = { render: moneyRender };
plus.openProject = function(p, tab){
  const ui = S().ui;
  if (p.status === 'done') { ui.doneOpen = p.id; MSA.save(); MSA.go('done'); }
  else { ui.project = p.id; ui.ptab = tab || 'plan'; MSA.save(); P.mapReset && P.mapReset(); MSA.go('active'); }
};
plus.topDue = n => moneyRows().filter(r => r.rem > 0.005).sort((a, b) => (isLate(b.p) - isLate(a.p)) || egp(b.rem, b.cur) - egp(a.rem, a.cur)).slice(0, n || 3).map(r => ({ id: r.p.id, name: r.p.name, client: (MSA.clients && MSA.clients.of(r.p)) || '', rem: r.rem, cur: r.cur, late: isLate(r.p) }));
plus.outstanding = () => { const open = moneyRows().filter(r => r.rem > 0.005); return { n: open.length, egp: open.reduce((a, r) => a + egp(r.rem, r.cur), 0), late: open.filter(r => isLate(r.p)).length }; };

/* =====================================================================
   2) READY MESSAGES
   ===================================================================== */
const KINDS = () => [['quote', T('عرض سعر', 'Quote')], ['follow', T('متابعة', 'Follow-up')], ['delivery', T('تسليم', 'Delivery')], ['pay', T('تذكير بالدفع', 'Payment reminder')]];
function msgText(kind, lang, v){
  const ar = lang === 'ar', hi = v.client ? v.client : (ar ? 'حضرتك' : 'there'), me = v.me ? '\n' + v.me : '';
  const proj = v.project ? (ar ? '«' + v.project + '»' : '“' + v.project + '”') : '';
  if (kind === 'quote') return ar
    ? 'أهلاً ' + hi + ' 👋\nبخصوص ' + (proj ? 'مشروع ' + proj : 'طلبك') + '، ده عرض السعر:\n\n• الإجمالي: ' + (v.total || '—') + (v.deliver ? '\n• موعد التسليم المتوقع: ' + v.deliver : '') + '\n\nمرفق ملف عرض السعر بالتفاصيل. العرض ساري لمدة 14 يومًا، ولو حابب نعدّل أي حاجة أنا تحت أمرك.\n\nتحياتي،' + me
    : 'Hi ' + hi + ' 👋\nRegarding ' + (proj ? 'the project ' + proj : 'your request') + ', here is the quotation:\n\n• Total: ' + (v.total || '—') + (v.deliver ? '\n• Expected delivery: ' + v.deliver : '') + '\n\nThe detailed quotation is attached. It is valid for 14 days — happy to adjust anything.\n\nBest regards,' + me;
  if (kind === 'follow') return ar
    ? 'أهلاً ' + hi + ' 🌿\nأتمنى تكون بخير. بسأل عن أخبارك' + (proj ? ' وعن ' + proj : '') + '. لو في أي ملاحظات أو حاجة جديدة عايز نشتغل عليها، أنا جاهز وبسعد أخدمك تاني.\nياريت تطمني على رأيك عشان نكمل بسرعة.\n\nتحياتي،' + me
    : 'Hi ' + hi + ' 🌿\nHope you are well. Just checking in' + (proj ? ' about ' + proj : '') + '. If you have any feedback or something new to work on, I would be glad to help again.\nLet me know your thoughts so we can move quickly.\n\nBest regards,' + me;
  if (kind === 'delivery') return ar
    ? 'أهلاً ' + hi + ' 🎉\nتم الانتهاء من ' + (proj ? 'مشروع ' + proj : 'الشغل') + ' وجاهز للتسليم. الملفات النهائية: [ضع الرابط هنا]\n\nياريت تراجعها وتبلغني بأي ملاحظة. ' + (v.remaining ? 'وبعد الاستلام نقفل المتبقي (' + v.remaining + ').\n\n' : '\n') + 'شكرًا لثقتك، وسعيد بالتعامل معاك 🙏\n' + me
    : 'Hi ' + hi + ' 🎉\n' + (proj ? 'The project ' + proj : 'The work') + ' is finished and ready for delivery. Final files: [paste the link here]\n\nPlease review and tell me about any notes. ' + (v.remaining ? 'Once received, we can settle the remaining balance (' + v.remaining + ').\n\n' : '\n') + 'Thank you for your trust — a pleasure working with you 🙏\n' + me;
  return ar
    ? 'أهلاً ' + hi + '،\nتذكير ودّي بخصوص ' + (proj ? 'مشروع ' + proj : 'الحساب') + ': المتبقي ' + (v.remaining || '—') + (v.total ? ' من إجمالي ' + v.total : '') + (v.due ? '، وموعد الاستحقاق ' + v.due : '') + '.\nلو تم التحويل ياريت تبعتلي إيصال التحويل. شكرًا لتعاونك 🙏\n' + me
    : 'Hi ' + hi + ',\nA friendly reminder about ' + (proj ? 'the project ' + proj : 'your account') + ': the remaining balance is ' + (v.remaining || '—') + (v.total ? ' out of ' + v.total : '') + (v.due ? ', due on ' + v.due : '') + '.\nIf you have already transferred it, please send me the receipt. Thank you 🙏\n' + me;
}
plus.msgText = msgText;
const waNum = v => { let d = String(v || '').replace(/[^\d+]/g, ''); if (d.startsWith('+')) return d.slice(1); if (d.startsWith('00')) return d.slice(2); if (/^01\d{9}$/.test(d)) return '2' + d; return d.replace(/^0+/, ''); };
function copyText(txt){
  const fb = () => { const t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;opacity:0;top:0'; document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} t.remove(); return ok; };
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt).then(() => true, () => fb());
  return Promise.resolve(fb());
}
function clientRow(name){ const k = String(name || '').trim().toLowerCase(); return k ? MSA.clients.data().rows.find(r => String(r.c.name || '').trim().toLowerCase() === k) : null; }
function markContact(name){ const r = clientRow(name) || (name && MSA.clients.ensure(name)); if (!r) return false; r.c.last = today(); delete r.fu; MSA.save(); return true; }
plus.markContact = markContact;

plus.messages = function(o){
  o = o || {}; const projects = S().projects;
  let p = o.pid ? projects.find(x => x.id === o.pid) : null;
  let client = o.client || (p ? MSA.clients.of(p) : '');
  let kind = o.kind || 'follow', lang = o.lang || (en() ? 'en' : 'ar');
  const opts = () => (client ? projects.filter(x => MSA.clients.of(x).toLowerCase() === client.toLowerCase()) : projects);
  const vars = () => {
    const prof = S().profile, pr = p, tot = pr ? total(pr) : 0, c = pr ? curOf(pr) : 'EGP';
    return { client: client, project: pr ? pr.name : '', me: prof.name || '', total: tot > 0 ? moneyL(tot) + ' ' + c : '', remaining: pr && tot > 0 ? moneyL(remOf(pr)) + ' ' + c : '', due: pr && pr.pay && pr.pay.due ? pr.pay.due : '', deliver: pr && pr.deliver ? pr.deliver : '' };
  };
  const m = MSA.modal({
    title: T('رسائل جاهزة للعميل', 'Ready messages'), size: 'wide',
    body: '<div class="msg-top"><div class="field"><label class="f">' + esc(T('العميل', 'Client')) + '</label><input type="text" id="mgClient" dir="auto" list="mgCl" autocomplete="off" value="' + esc(client) + '"><datalist id="mgCl">' + MSA.clients.names().map(n => '<option value="' + esc(n) + '">').join('') + '</datalist></div>' +
      '<div class="field"><label class="f">' + esc(T('المشروع', 'Project')) + '</label><select id="mgProj"></select></div></div>' +
      '<div class="pchips" id="mgKinds" style="margin:0 0 10px">' + KINDS().map(k => '<button class="pchip" data-k="' + k[0] + '">' + esc(k[1]) + '</button>').join('') + '<span class="grow"></span><div class="seg" id="mgLang"><button data-l="ar">العربية</button><button data-l="en">English</button></div></div>' +
      '<textarea id="mgText" dir="auto" rows="11" class="mg-text"></textarea><div class="hint" id="mgHint" style="margin-top:6px"></div>',
    buttons: [
      { label: T('تم التواصل اليوم', 'Mark as contacted'), cls: 'ghost', icon: 'check', onClick: () => { const n = $('#mgClient', m.el).value.trim(); if (!n) { MSA.toast(T('اكتب اسم العميل أولًا', 'Enter a client name first'), 'err'); return; } markContact(n); MSA.toast(T('تم تسجيل آخر تواصل: اليوم', 'Last contact recorded: today'), 'ok'); } },
      { label: T('نسخ', 'Copy'), icon: 'copy', onClick: async () => { const ok = await copyText($('#mgText', m.el).value); MSA.toast(ok ? T('تم النسخ — الصقه في واتساب', 'Copied — paste it into WhatsApp') : T('تعذر النسخ — حدد النص وانسخه يدويًا', 'Could not copy — select the text and copy it manually'), ok ? 'ok' : 'err'); } },
      { label: T('واتساب', 'WhatsApp'), cls: 'primary', icon: 'link', onClick: () => {
        const n = $('#mgClient', m.el).value.trim(), r = clientRow(n), ph = waNum(r && (r.c.wa || r.c.phone)), txt = $('#mgText', m.el).value;
        MSA.openLink('https://wa.me/' + ph + '?text=' + encodeURIComponent(txt));
        if (n) { markContact(n); MSA.toast(ph ? T('فتح واتساب — وتم تسجيل التواصل', 'Opening WhatsApp — contact recorded') : T('لا يوجد رقم للعميل — اختر جهة الاتصال داخل واتساب', 'No number saved for this client — pick the contact inside WhatsApp'), 'ok'); }
      } }
    ],
    onMount: el => {
      const sel = $('#mgProj', el), ta = $('#mgText', el), hint = $('#mgHint', el);
      const fillProj = () => { const l = opts(); if (p && !l.includes(p)) p = null; sel.innerHTML = '<option value="">' + esc(T('— بدون مشروع —', '— No project —')) + '</option>' + l.map(x => '<option value="' + x.id + '"' + (p && p.id === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join(''); };
      const gen = () => {
        $$('#mgKinds .pchip', el).forEach(b => b.classList.toggle('on', b.dataset.k === kind)); $$('#mgLang button', el).forEach(b => b.classList.toggle('on', b.dataset.l === lang));
        ta.value = msgText(kind, lang, vars());
        const r = clientRow(client), hasPh = r && (r.c.wa || r.c.phone);
        hint.textContent = (kind === 'quote' ? T('نزّل عرض السعر PDF من تبويب «الوقت والتسعير» وأرفقه مع الرسالة. ', 'Download the quote PDF from the Time & pricing tab and attach it. ') : '') + (hasPh ? T('سيُرسل إلى رقم العميل المحفوظ في الشيت.', 'It will go to the number saved in the clients sheet.') : T('لا يوجد رقم محفوظ للعميل — ستختار جهة الاتصال داخل واتساب.', 'No number saved for this client — you will pick the contact inside WhatsApp.'));
      };
      fillProj(); gen();
      $('#mgKinds', el).onclick = e => { const b = e.target.closest('[data-k]'); if (b) { kind = b.dataset.k; gen(); } };
      $('#mgLang', el).onclick = e => { const b = e.target.closest('[data-l]'); if (b) { lang = b.dataset.l; gen(); } };
      sel.onchange = () => { p = projects.find(x => x.id === sel.value) || null; if (p && !client) { client = MSA.clients.of(p); $('#mgClient', el).value = client; } gen(); };
      $('#mgClient', el).onchange = e => { client = e.target.value.trim(); fillProj(); gen(); };
    }
  });
};

/* =====================================================================
   3) AUTO FOLLOW-UPS (last-contact column -> task after N days)
   ===================================================================== */
const followDays = () => { const v = parseInt(S().settings.followDays, 10); return v > 0 ? v : 14; };
function mkTask(o){ return Object.assign({ id: U.uid('t'), type: 'task', title: '', desc: '', status: 'todo', priority: 'normal', start: '', due: '', remind: '', remindAt: '', repeat: '', tags: [], checklist: [], atts: [], color: '', pinned: false, created: Date.now(), updated: Date.now(), notified: false }, o); }
plus.checkFollow = function(){
  if (S().settings.followOn === false || !MSA.clients) return 0;
  const d = MSA.clients.data(), t0 = dateMs(today()); let made = 0;
  d.rows.forEach(r => {
    const last = r.c.last; if (!last || !/^\d{4}-\d{2}-\d{2}$/.test(last) || r.fu === last) return;
    const st = String(r.c.status || '').trim().toLowerCase(); if (st === 'متوقف' || st === 'paused') return;
    const lm = dateMs(last); if (lm == null || (t0 - lm) / DAY < followDays()) return;
    const name = r.c.name || '—', days = Math.round((t0 - lm) / DAY);
    S().tasks.unshift(mkTask({ title: T('متابعة العميل: ', 'Follow up with: ') + name, desc: T('مرّ ' + days + ' يومًا على آخر تواصل (' + last + '). افتح «رسائل جاهزة» وأرسل رسالة متابعة.', days + ' days since the last contact (' + last + '). Open “Ready messages” and send a follow-up.'), due: today() + 'T10:00', tags: [T('متابعة', 'follow-up')], priority: 'high', src: { follow: r.id } }));
    r.fu = last; made++;
  });
  if (made) { MSA.save(); MSA.updateCounts && MSA.updateCounts(); MSA.toast(T('تم إنشاء ' + made + ' مهمة متابعة للعملاء', made + ' client follow-up task(s) created'), 'bell', 7000); if (MSA.view === 'tasks' || MSA.view === 'home') MSA.rerender(true); }
  return made;
};
plus.followDays = followDays;

/* =====================================================================
   4) SAVED CLIENT IDENTITY
   ===================================================================== */
const idOf = p => { const id = p.identity = p.identity || { colors: [], fonts: [], icons: [], notes: [], images: [] }; ['colors', 'fonts', 'icons', 'notes', 'images'].forEach(k => id[k] = id[k] || []); return id; };
const logoStep = p => { let hit = null; P.walk(p.steps, s => { if (!hit && s.key === 'logo') hit = s; }); return hit; };
const logoAtts = p => { const o = []; P.walk(p.steps, s => { if (s.key === 'logo') s.atts.filter(a => a.kind === 'image').forEach(a => o.push(a)); }); return o; };
async function dupAtt(a){
  try { const rec = await MSA.files.get(a.id); if (!rec) return null; const f = (typeof File === 'function') ? new File([rec.blob], rec.name || 'file', { type: rec.mime || '' }) : rec.blob; const n = await MSA.files.put(f); return Object.assign({}, n, { name: a.name || n.name }); } catch (e) { return null; }
}
const identCount = i => i ? (i.colors || []).length + (i.fonts || []).length + (i.icons || []).length + (i.notes || []).length + (i.logos || []).length : 0;
plus.identOf = name => { const r = clientRow(name); return r && r.ident && identCount(r.ident) ? r.ident : null; };
plus.saveIdent = async function(p){
  const name = MSA.clients.of(p); if (!name) return false;
  const r = MSA.clients.ensure(name), id = idOf(p);
  if (r.ident && r.ident.logos) await MSA.files.delMany(r.ident.logos);
  const logos = []; for (const a of logoAtts(p).slice(0, 6)) { const d = await dupAtt(a); if (d) logos.push(d); }
  r.ident = { colors: id.colors.slice(), fonts: JSON.parse(JSON.stringify(id.fonts)), icons: id.icons.slice(), notes: id.notes.slice(), logos, saved: Date.now(), from: p.name };
  MSA.save(); return true;
};
plus.applyIdent = async function(p, silent){
  const src = plus.identOf(MSA.clients.of(p)); if (!src) return false;
  const id = idOf(p); let added = 0;
  src.colors.forEach(c => { if (!id.colors.includes(c)) { id.colors.push(c); added++; } });
  src.fonts.forEach(f => { if (!id.fonts.some(x => x.h === f.h && x.b === f.b)) { id.fonts.push(JSON.parse(JSON.stringify(f))); added++; } });
  src.icons.forEach(c => { if (!id.icons.includes(c)) { id.icons.push(c); added++; } });
  src.notes.forEach(c => { if (!id.notes.includes(c)) { id.notes.push(c); added++; } });
  const ls = logoStep(p), have = ls ? ls.atts : id.images;
  if (!have.some(a => a.fromClient)) for (const a of src.logos || []) { const d = await dupAtt(a); if (d) { d.fromClient = true; have.push(d); added++; } }
  p.identApplied = (MSA.clients.of(p) || '').toLowerCase(); MSA.save();
  if (!silent) MSA.toast(T('تم تطبيق هوية العميل على المشروع', 'Client identity applied to the project'), 'ok');
  return added > 0;
};
/* a project that just got a client with a saved identity (and has none of its own) picks it up automatically */
plus.autoIdent = async function(p){
  try {
    const name = MSA.clients.of(p); if (!name || !plus.identOf(name)) return false;
    const id = idOf(p); if (id.colors.length + id.fonts.length + id.icons.length + id.notes.length) return false;
    if (p.identApplied === name.toLowerCase()) return false;
    const ok = await plus.applyIdent(p, true);
    if (ok) { MSA.toast(T('تم تطبيق هوية «' + name + '» المحفوظة (ألوان وخطوط وشعار) على هذا المشروع', 'Applied the saved identity of “' + name + '” (colours, fonts, logo) to this project'), 'ok', 5200); if (MSA.view === 'active') MSA.rerender(true); }
    return ok;
  } catch (e) { return false; }
};
plus.identCard = function(p, box){
  if (!box || !box.isConnected) return;
  const name = MSA.clients.of(p), src = name ? plus.identOf(name) : null, id = idOf(p), mine = id.colors.length + id.fonts.length + id.icons.length;
  const wrap = document.createElement('div'); wrap.className = 'card st-card'; wrap.id = 'idClientCard';
  wrap.innerHTML = '<div class="st-h">' + I('user', 'sm') + '<b>' + esc(T('هوية العميل المحفوظة', 'Saved client identity')) + '</b>' + (name ? '<span class="chip" dir="auto">' + esc(name) + '</span>' : '') + '</div>' +
    (!name ? '<div class="hint">' + esc(T('حدد عميل المشروع أولًا ليمكن حفظ هويته وتطبيقها تلقائيًا على مشاريعه القادمة.', 'Set the project client first so its identity can be saved and reused on its next projects.')) + '</div><div class="row" style="margin-top:10px"><button class="btn sm" data-ic="client">' + I('user', 'sm') + esc(T('تعيين عميل', 'Set client')) + '</button></div>'
      : (src ? '<div class="sw-row">' + src.colors.slice(0, 8).map(c => '<div class="sw-card"><div class="sw-c" style="background:' + c + ';cursor:default;font-size:10px">' + esc(c.toUpperCase()) + '</div></div>').join('') + '</div><div class="hint" style="margin-top:6px">' + (src.fonts.length ? esc(T('الخطوط: ', 'Fonts: ')) + src.fonts.map(f => esc(f.ah === f.h ? f.h : f.ah + ' + ' + f.h)).join(' · ') + ' · ' : '') + esc(T('شعارات: ', 'Logos: ')) + (src.logos || []).length + ' · ' + esc(T('محفوظة من ', 'saved from ')) + '<span dir="auto">' + esc(src.from || '') + '</span></div>' : '<div class="hint">' + esc(T('لم تُحفظ هوية لهذا العميل بعد. اختر الألوان والخطوط ثم احفظها مرة واحدة، وستُطبَّق تلقائيًا على أي مشروع جديد باسمه.', 'No identity saved for this client yet. Pick the colours and fonts, save them once, and they will apply automatically to any new project under this client.')) + '</div>') +
      '<div class="row" style="margin-top:10px">' + (src ? '<button class="btn sm primary" data-ic="apply">' + I('check', 'sm') + esc(T('تطبيق على هذا المشروع', 'Apply to this project')) + '</button>' : '') + '<button class="btn sm' + (src ? '' : ' primary') + '" data-ic="save" ' + (mine || logoAtts(p).length ? '' : 'disabled') + '>' + I('download', 'sm') + esc(src ? T('تحديث من هذا المشروع', 'Update from this project') : T('حفظ هوية هذا المشروع للعميل', 'Save this project’s identity for the client')) + '</button>' + (src ? '<button class="btn sm danger" data-ic="del">' + I('trash', 'sm') + '</button>' : '') + '</div>');
  box.appendChild(wrap);
  const redo = () => { wrap.remove(); plus.identCard(p, box); };
  wrap.addEventListener('click', async e => {
    const b = e.target.closest('[data-ic]'); if (!b) return; const a = b.dataset.ic;
    if (a === 'client') { const v = await MSA.clients.pick('', T('العميل', 'Client')); if (v) { p.client = v; if (p.time) p.time.client = v; MSA.clients.ensure(v); MSA.save(); await plus.autoIdent(p); MSA.rerender(true); } }
    else if (a === 'save') { b.disabled = true; await plus.saveIdent(p); MSA.toast(T('تم حفظ الهوية للعميل «' + name + '»', 'Identity saved for “' + name + '”'), 'ok'); redo(); }
    else if (a === 'apply') { b.disabled = true; await plus.applyIdent(p); MSA.rerender(true); }
    else if (a === 'del') { if (!await MSA.confirm(T('حذف الهوية المحفوظة للعميل «' + name + '»؟ (مشاريعه لا تتأثر)', 'Delete the saved identity of “' + name + '”? (its projects are not affected)'), { danger: true, okLabel: T('حذف', 'Delete') })) return; const r = clientRow(name); if (r && r.ident) { await MSA.files.delMany(r.ident.logos || []); delete r.ident; MSA.save(); } redo(); }
  });
};

/* =====================================================================
   5) STAGE DEADLINES
   ===================================================================== */
const leavesOf = p => (p.steps || []).flatMap(P.leaves);
function dueOf(s){ if (s.children && s.children.length) { let m = ''; s.children.forEach(c => { const d = dueOf(c); if (d && d > m) m = d; }); return m; } return s.due || ''; }
plus.dueOf = dueOf;
plus.dueChip = function(s, cls){
  const d = dueOf(s); if (!d) return '';
  const late = !P.done(s) && dateMs(d) < dateMs(today()), soon = !late && !P.done(s) && dateMs(d) - dateMs(today()) <= 2 * DAY;
  return '<span class="due-chip ' + (cls || '') + (late ? ' late' : soon ? ' soon' : '') + (P.done(s) ? ' ok' : '') + '" title="' + esc(T('موعد المرحلة', 'Stage deadline')) + '">' + I('calendar', 'xs') + '<span dir="ltr">' + esc(d.slice(5).replace('-', '/')) + '</span></span>';
};
function spread(startKey, endKey, n, skipFri){
  let days = []; for (let t = dateMs(startKey); t <= dateMs(endKey); t += DAY) { const d = new Date(t); days.push(U.dateKey(d)); }
  if (skipFri) { const w = days.filter(k => new Date(dateMs(k)).getDay() !== 5); if (w.length) days = w; }
  if (!days.length) days = [endKey];
  const out = []; for (let i = 0; i < n; i++) out.push(days[Math.min(days.length - 1, Math.max(0, Math.round((i + 1) * days.length / n) - 1))]);
  return out;
}
plus.applyDeadlines = function(p, o){
  const L = leavesOf(p).filter(s => !s.done); if (!L.length) return 0;
  const dates = spread(o.start, o.end, L.length, o.skipFri);
  L.forEach((s, i) => { s.due = dates[i]; });
  p.deliver = o.end; p.dlStart = o.start;
  S().tasks = S().tasks.filter(x => !(x.src && x.src.pid === p.id && x.status !== 'done'));
  if (o.tasks) {
    const now = Date.now();
    L.slice().reverse().forEach(s => { const due = s.due + 'T18:00', dm = U.toMs(due); S().tasks.unshift(mkTask({ title: p.name + ' — ' + P.title(s), desc: T('مرحلة من مشروع «' + p.name + '»', 'Stage of the project “' + p.name + '”'), due, remind: dm && dm - 1440 * 60000 > now + 3600000 ? '1440' : '', tags: [p.name], src: { pid: p.id, sid: s.id } })); });
  }
  MSA.save(); MSA.updateCounts && MSA.updateCounts(); return L.length;
};
plus.clearDeadlines = function(p){ P.walk(p.steps, s => { delete s.due; }); delete p.deliver; delete p.dlStart; S().tasks = S().tasks.filter(x => !(x.src && x.src.pid === p.id && x.status !== 'done')); MSA.save(); MSA.updateCounts && MSA.updateCounts(); };
plus.deadlines = function(p){
  if (!p) return;
  const n = leavesOf(p).filter(s => !s.done).length;
  if (!n) { MSA.toast(T('كل مراحل المشروع مكتملة', 'All stages are already done'), 'ok'); return; }
  const def = p.deliver && p.deliver >= today() ? p.deliver : U.dateKey(new Date(Date.now() + 14 * DAY));
  const m = MSA.modal({
    title: T('مواعيد المراحل', 'Stage deadlines'),
    body: '<div class="hint" style="margin-bottom:12px">' + esc(T('حدد موعد التسليم النهائي، والتطبيق يوزّع مواعيد المراحل المتبقية (' + n + ') بالتساوي بينهم حسب ترتيب الخطة.', 'Pick the final delivery date and the app spreads the remaining ' + n + ' stage(s) evenly across the days, in plan order.')) + '</div>' +
      '<div class="st-grid"><div class="field"><label class="f">' + esc(T('تاريخ البدء', 'Start date')) + '</label><input type="date" id="dlS" value="' + (p.dlStart && p.dlStart <= def ? p.dlStart : today()) + '"></div><div class="field"><label class="f">' + esc(T('موعد التسليم', 'Delivery date')) + '</label><input type="date" id="dlE" value="' + def + '"></div></div>' +
      '<label class="row" style="cursor:pointer;margin:4px 0"><input type="checkbox" class="cb" id="dlT" checked><span>' + esc(T('حوّل كل مرحلة إلى مهمة بتنبيه (في «مهام وملاحظات»)', 'Turn every stage into a task with a reminder (in Tasks & notes)')) + '</span></label>' +
      '<label class="row" style="cursor:pointer;margin:4px 0"><input type="checkbox" class="cb" id="dlF"><span>' + esc(T('تجنّب يوم الجمعة', 'Avoid Fridays')) + '</span></label><div class="hint" id="dlPrev" style="margin-top:10px"></div>',
    buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }].concat(p.deliver ? [{ label: T('مسح المواعيد', 'Clear dates'), cls: 'ghost', onClick: a => { plus.clearDeadlines(p); a.close(); MSA.rerender(true); MSA.toast(T('تم مسح المواعيد والمهام المرتبطة', 'Dates and linked tasks cleared'), 'ok'); } }] : []).concat([{ label: T('توزيع المواعيد', 'Spread dates'), cls: 'primary', icon: 'calendar', onClick: a => {
      const s = $('#dlS', a.el).value, e = $('#dlE', a.el).value; if (!s || !e || e < s) { MSA.toast(T('موعد التسليم لازم يكون بعد تاريخ البدء', 'The delivery date must be after the start date'), 'err'); return; }
      const c = plus.applyDeadlines(p, { start: s, end: e, tasks: $('#dlT', a.el).checked, skipFri: $('#dlF', a.el).checked }); a.close(); MSA.rerender(true);
      MSA.toast(T('تم توزيع ' + c + ' مرحلة حتى ' + e, c + ' stage(s) scheduled up to ' + e), 'ok');
    } }]),
    onMount: el => { const pv = () => { const s = $('#dlS', el).value, e = $('#dlE', el).value, days = s && e && e >= s ? Math.round((dateMs(e) - dateMs(s)) / DAY) + 1 : 0; $('#dlPrev', el).textContent = days ? T('المدة ' + days + ' يومًا لـ ' + n + ' مرحلة ≈ مرحلة كل ' + (days / n).toFixed(1) + ' يوم.', days + ' day(s) for ' + n + ' stage(s) ≈ one stage every ' + (days / n).toFixed(1) + ' day(s).') : T('اختر تواريخ صحيحة', 'Pick valid dates'); }; $$('input[type=date]', el).forEach(i => i.onchange = pv); pv(); }
  });
};
/* keep linked tasks in step with the plan: a finished stage closes its task (and re-opens it if un-ticked) */
plus.syncTasks = function(){
  let ch = false; const ps = S().projects;
  S().tasks.slice().forEach(x => {
    if (!x.src || !x.src.pid) return;
    const p = ps.find(q => q.id === x.src.pid);
    if (!p) { if (x.status !== 'done') { S().tasks = S().tasks.filter(y => y !== x); ch = true; } return; }
    const f = P.find(p.steps, x.src.sid); if (!f) return;
    const dn = P.done(f.step);
    if (dn && x.status !== 'done') { x.status = 'done'; x.completedAt = Date.now(); x.autoDone = true; ch = true; }
    else if (!dn && x.status === 'done' && x.autoDone) { x.status = 'todo'; delete x.completedAt; delete x.autoDone; x.notified = false; ch = true; }
  });
  if (ch) { MSA.save(); MSA.updateCounts && MSA.updateCounts(); if (MSA.view === 'tasks') MSA.rerender(true); }
};

/* =====================================================================
   wiring into the existing screens
   ===================================================================== */
const _sr = MSA.studio && MSA.studio.render;
if (_sr) MSA.studio.render = function(tab, p, box){ _sr.apply(this, arguments); if (tab === 'identity') plus.identCard(p, box); };
setTimeout(() => { plus.checkFollow(); plus.syncTasks(); }, 2500);
setInterval(() => { plus.syncTasks(); }, 4000);
setInterval(() => plus.checkFollow(), 30 * 60000);
})();
