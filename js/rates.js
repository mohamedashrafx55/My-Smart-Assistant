/* Currency rates against the Egyptian pound (EGP). Live from open.er-api.com (fallback: jsDelivr currency-api),
   cached on the device, with manual per-currency overrides. Linked to the pricing tab (project → الوقت والتسعير). */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e);
const en = () => MSA.state.settings.lang === 'en';
const esc = U.esc;
/* units of the currency per 1 EGP (snapshot of 2026-10-09, used until the first live refresh) */
const SEED = { USD: .019093, EUR: .017038, GBP: .014446, SAR: .0716, AED: .070121, KWD: .005916, QAR: .0695, OMR: .00734, BHD: .00718, JOD: .01354, TRY: .8, CAD: .0265, AUD: .0295, CHF: .0152, JPY: 2.9, CNY: .136, INR: 1.68, MAD: .176 };
const LIST = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'KWD', 'QAR', 'OMR', 'BHD', 'JOD', 'TRY', 'CAD', 'AUD', 'CHF', 'JPY', 'CNY', 'INR', 'MAD'];
const DEF_PIN = ['USD', 'SAR', 'AED', 'EUR', 'GBP'];
const STALE = 12 * 3600 * 1000;

function st(){
  const s = MSA.state; if (!s.rates) s.rates = {};
  const r = s.rates; r.base = 'EGP'; r.rates = r.rates || Object.assign({}, SEED); r.ts = r.ts || Date.parse('2026-10-09T00:00:00Z'); r.src = r.src || 'seed';
  r.manual = r.manual || {}; r.pins = r.pins || DEF_PIN.slice(); if (r.auto == null) r.auto = true;
  return r;
}
let busy = null;
async function getJSON(url){ const c = new AbortController(), to = setTimeout(() => c.abort(), 12000); try { const x = await fetch(url, { signal: c.signal }); if (!x.ok) throw new Error('http ' + x.status); return await x.json(); } finally { clearTimeout(to); } }
async function refresh(){
  if (busy) return busy;
  busy = (async () => {
    const r = st();
    try {
      const j = await getJSON('https://open.er-api.com/v6/latest/EGP');
      if (j.result !== 'success' || !j.rates) throw new Error('bad');
      r.rates = j.rates; r.ts = (j.time_last_update_unix ? j.time_last_update_unix * 1000 : Date.now()); r.src = 'open.er-api.com';
    } catch (e1) {
      try {
        const j = await getJSON('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/egp.json');
        const o = {}; Object.keys(j.egp || {}).forEach(k => { o[k.toUpperCase()] = j.egp[k]; }); if (!o.USD) throw new Error('bad');
        r.rates = o; r.ts = Date.parse(j.date) || Date.now(); r.src = 'currency-api (jsDelivr)';
      } catch (e2) { busy = null; return false; }
    }
    r.checked = Date.now(); MSA.save(); busy = null; return true;
  })();
  return busy;
}
const rates = MSA.rates = {
  state: st, LIST, refresh,
  stale: () => Date.now() - (st().checked || st().ts) > STALE,
  ensure: async () => { const r = st(); if (r.auto && rates.stale() && navigator.onLine !== false) await refresh(); return r; },
  /* EGP per 1 unit of cur (manual override wins) */
  perUnit(cur){ const r = st(); if (cur === 'EGP') return 1; if (r.manual[cur] > 0) return r.manual[cur]; const v = r.rates[cur]; return v > 0 ? 1 / v : 0; },
  live(cur){ const v = st().rates[cur]; return v > 0 ? 1 / v : 0; },
  has: cur => cur === 'EGP' || rates.perUnit(cur) > 0,
  toEGP: (a, cur) => a * rates.perUnit(cur),
  convert(a, from, to){ if (from === to) return a; const f = rates.perUnit(from), t = rates.perUnit(to); return f > 0 && t > 0 ? a * f / t : a; },
  /* currencies offered in the pricing tab: EGP, the pinned ones, and the one already in use */
  pricing(extra){ const r = st(), o = ['EGP']; r.pins.forEach(c => { if (!o.includes(c)) o.push(c); }); (extra || []).forEach(c => { if (c && !o.includes(c)) o.push(c); }); return o; },
  name(c){ try { return new Intl.DisplayNames([en() ? 'en' : 'ar'], { type: 'currency' }).of(c) || c; } catch (e) { return c; } },
  fmt(n, d){ return (Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: d == null ? 2 : d }); },
  when(){ const r = st(); return new Date(r.ts).toLocaleString(en() ? 'en-GB' : 'ar-EG', { dateStyle: 'medium', timeStyle: 'short' }); }
};

/* ---------- Settings section ---------- */
MSA.ratesHTML = function(){
  const r = st(), all = Array.from(new Set(LIST.concat(Object.keys(r.manual), r.pins))).filter(c => r.rates[c] > 0 || r.manual[c] > 0);
  const opt = (sel) => ['EGP'].concat(all).map(c => '<option value="' + c + '"' + (c === sel ? ' selected' : '') + '>' + c + '</option>').join('');
  const row = c => { const man = r.manual[c] > 0, v = rates.perUnit(c), pinned = r.pins.includes(c);
    return '<div class="fxrow' + (man ? ' man' : '') + '" data-c="' + c + '"><span class="cc">' + c + '</span><span class="nm">' + esc(rates.name(c)) + '</span>' +
      '<input type="number" step="any" min="0" data-fxv value="' + (v ? +v.toFixed(4) : '') + '" aria-label="1 ' + c + ' = EGP">' +
      '<button class="icon-btn sm" data-fxreset title="' + esc(T('رجوع للسعر المباشر', 'Back to the live rate')) + '" ' + (man ? '' : 'hidden') + '>' + I('undo', 'sm') + '</button>' +
      '<button class="icon-btn sm pin' + (pinned ? ' on' : '') + '" data-fxpin title="' + esc(T('إظهارها في التسعير', 'Show in pricing')) + '">' + I('star', 'sm') + '</button></div>'; };
  return '<div class="sec" id="fxSec" data-sec="fx"><h4>' + I('briefcase', 'sm') + esc(T('أسعار العملات', 'Currency rates')) + '</h4>' +
    '<div class="hint" style="margin-bottom:10px">' + esc(T('كل الأسعار مقابل الجنيه المصري (EGP). مربوطة بتبويب «الوقت والتسعير» داخل كل مشروع: العملات المنجّمة ★ تظهر هناك، ويُحسب المعادل بالجنيه تلقائيًا في العرض والفاتورة.', 'All rates are against the Egyptian pound (EGP). Linked to each project’s Time & pricing tab: starred ★ currencies appear there and the EGP equivalent is added to quotes and invoices.')) + '</div>' +
    '<div class="fxbar"><button class="btn sm primary" id="fxRefresh">' + I('repeat', 'sm') + '<span>' + esc(T('تحديث الأسعار الآن', 'Refresh rates now')) + '</span></button>' +
      '<span class="hint" id="fxStamp">' + esc(T('آخر تحديث: ', 'Updated: ')) + esc(rates.when()) + ' · ' + esc(r.src === 'seed' ? T('أسعار مبدئية', 'initial rates') : r.src) + '</span></div>' +
    '<label class="row" style="margin-bottom:12px;cursor:pointer"><input type="checkbox" class="cb" id="fxAuto" ' + (r.auto ? 'checked' : '') + '><span>' + esc(T('تحديث تلقائي كل 12 ساعة عند وجود إنترنت', 'Refresh automatically every 12 hours when online')) + '</span></label>' +
    '<div class="f-title" style="margin-bottom:6px">' + esc(T('محوّل سريع', 'Quick converter')) + '</div>' +
    '<div class="fxconv"><input type="number" step="any" id="fxAmt" value="100" dir="ltr"><select id="fxFrom">' + opt('USD') + '</select><button class="icon-btn" id="fxSwap" aria-label="swap">' + I('repeat', 'sm') + '</button><select id="fxTo">' + opt('EGP') + '</select></div>' +
    '<div class="fxres" id="fxRes"></div>' +
    '<div class="f-title" style="margin:4px 0 6px">' + esc(T('سعر الوحدة بالجنيه (يمكنك كتابة سعرك الخاص)', 'Price of 1 unit in EGP (type your own rate if you like)')) + '</div>' +
    '<div class="fxtbl" id="fxTbl">' + all.map(row).join('') + '</div>' +
    '<div class="hint" style="margin-top:8px">' + esc(T('السعر المباشر مرجعي (متوسط السوق) وقد يختلف عن سعر البنك أو السوق الموازية؛ اكتب سعرك لو تحتاج سعرًا مختلفًا. السعر المكتوب يدويًا يبقى كما هو ولا يتغيّر بالتحديث.', 'Live rates are mid-market references and may differ from your bank or the street rate; type your own if you need another. A manual rate is kept and never overwritten by a refresh.')) + '</div></div>';
};
MSA.wireRates = function(root, redraw){
  const box = $('#fxSec', root); if (!box) return; const r = st();
  const res = () => { const a = parseFloat($('#fxAmt', box).value) || 0, f = $('#fxFrom', box).value, to = $('#fxTo', box).value; $('#fxRes', box).textContent = rates.fmt(a, 4) + ' ' + f + ' = ' + rates.fmt(rates.convert(a, f, to), 2) + ' ' + to; };
  res(); ['fxAmt', 'fxFrom', 'fxTo'].forEach(id => { $('#' + id, box).oninput = res; $('#' + id, box).onchange = res; });
  $('#fxSwap', box).onclick = () => { const a = $('#fxFrom', box), b = $('#fxTo', box), v = a.value; a.value = b.value; b.value = v; res(); };
  $('#fxAuto', box).onchange = e => { r.auto = e.target.checked; MSA.save(); };
  $('#fxRefresh', box).onclick = async () => {
    const b = $('#fxRefresh', box); b.disabled = true; const ok = await refresh(); b.disabled = false;
    if (ok) { MSA.toast(T('تم تحديث الأسعار', 'Rates updated'), 'ok'); redraw && redraw(); } else MSA.toast(T('تعذّر الاتصال — تُستخدم آخر أسعار محفوظة', 'Could not connect — using the last saved rates'), 'err');
  };
  $$('.fxrow', box).forEach(row => {
    const c = row.dataset.c;
    $('[data-fxv]', row).onchange = e => { const v = parseFloat(e.target.value); if (v > 0 && Math.abs(v - rates.live(c)) > 1e-9) r.manual[c] = v; else delete r.manual[c]; MSA.save(); row.classList.toggle('man', !!r.manual[c]); $('[data-fxreset]', row).hidden = !r.manual[c]; res(); };
    $('[data-fxreset]', row).onclick = () => { delete r.manual[c]; MSA.save(); redraw && redraw(); };
    $('[data-fxpin]', row).onclick = e => { const i = r.pins.indexOf(c); if (i >= 0) r.pins.splice(i, 1); else r.pins.push(c); MSA.save(); e.currentTarget.classList.toggle('on', r.pins.includes(c)); };
  });
  /* background refresh when the section is opened with old data */
  if (r.auto && rates.stale() && navigator.onLine !== false && !box._auto) { box._auto = true; refresh().then(ok => { if (ok && document.body.contains(box)) redraw && redraw(); }); }
};
})();
