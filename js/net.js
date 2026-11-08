/* Internet status: green Wi-Fi when online, grey crossed-out Wi-Fi when offline, amber when the link is weak.
   Shows an on-screen notice when the connection drops, becomes weak, or comes back. */
(function(){
'use strict';
const MSA = window.MSA, U = MSA.u, I = MSA.icon, T = (a, e) => MSA.T(a, e), esc = U.esc;
const PROBES = ['https://www.gstatic.com/generate_204', 'https://cp.cloudflare.com/generate_204'];
const SLOW = 2500, TIMEOUT = 5000;
let cur = null, last = null, ms = null, pend = null, pendN = 0, busy = false;

function ping(url){
  return new Promise(res => {
    const t0 = performance.now(), ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const to = setTimeout(() => { if (ctl) ctl.abort(); res(null); }, TIMEOUT);
    fetch(url + '?_=' + Date.now(), { mode: 'no-cors', cache: 'no-store', signal: ctl ? ctl.signal : undefined }).then(() => { clearTimeout(to); res(performance.now() - t0); }, () => { clearTimeout(to); res(null); });
  });
}
const slowLink = () => { const c = navigator.connection; return !!c && (/^(slow-2g|2g)$/.test(c.effectiveType || '') || (c.rtt > 1500) || (c.downlink > 0 && c.downlink < 0.1)); };
async function measure(){
  if (navigator.onLine === false) return { s: 'offline', ms: null };
  const r = (await Promise.all(PROBES.map(ping))).filter(x => x != null);
  if (!r.length) return { s: 'offline', ms: null };
  const best = Math.min.apply(null, r);
  return { s: (best > SLOW || r.length < PROBES.length && best > 1200 || slowLink()) ? 'weak' : 'online', ms: Math.round(best) };
}
const label = s => s === 'online' ? T('متصل بالإنترنت', 'Connected') : s === 'weak' ? T('الاتصال ضعيف', 'Weak connection') : s === 'offline' ? T('غير متصل', 'Offline') : T('جاري الفحص…', 'Checking…');
function rowInner(){
  const s = cur || 'check', on = s === 'online', weak = s === 'weak';
  return '<span class="net-ic net-' + s + '">' + I(s === 'offline' ? 'wifi-off' : 'wifi', 'sm') + '</span><b>' + esc(label(cur)) + '</b>' +
    (ms != null && cur !== 'offline' ? '<span class="hint" dir="ltr">' + ms + ' ms</span>' : '') +
    '<span class="grow"></span><button class="btn sm" data-net="check">' + esc(T('افحص الآن', 'Check now')) + '</button>';
}
function paint(){ document.querySelectorAll('#netRow').forEach(el => { el.className = 'net-row net-r-' + (cur || 'check'); el.innerHTML = rowInner(); }); }
function notify(from, to){
  if (!MSA.toast) return;
  if (to === 'offline') MSA.toast(T('الإنترنت فصل عن البرنامج. شغلك محفوظ على جهازك وهيكمل لما الاتصال يرجع.', 'The internet disconnected. Your work stays saved on your device and sync resumes when it is back.'), 'err', 9000);
  else if (to === 'weak') MSA.toast(T('الاتصال بالإنترنت ضعيف، ممكن التحميل والمزامنة يبطّؤوا.', 'Your connection is weak — loading and sync may be slow.'), 'bell', 8000);
  else if (to === 'online' && from) MSA.toast(T('رجع الاتصال بالإنترنت ✓', 'Back online ✓'), 'ok', 3500);
}
function apply(r, immediate){
  ms = r.ms;
  if (r.s === cur) { pend = null; pendN = 0; paint(); return; }
  if (!immediate && cur !== null) { if (pend === r.s) pendN++; else { pend = r.s; pendN = 1; } if (pendN < 2) { paint(); return; } }
  const from = cur; cur = r.s; pend = null; pendN = 0; last = Date.now(); paint();
  try { window.dispatchEvent(new CustomEvent('msa-net', { detail: { state: cur, from } })); } catch (e) {}
  notify(from, cur);
}
async function check(immediate){
  if (busy) return; busy = true;
  try { apply(await measure(), !!immediate); } finally { busy = false; }
}
MSA.net = { state: () => cur, ms: () => ms, check: () => check(true), row: () => '<div class="field"><label class="f">' + esc(T('حالة الاتصال بالإنترنت', 'Internet connection status')) + '</label><div id="netRow" class="net-row net-r-' + (cur || 'check') + '">' + rowInner() + '</div></div>' };
window.addEventListener('offline', () => apply({ s: 'offline', ms: null }, true));
window.addEventListener('online', () => check(true));
document.addEventListener('visibilitychange', () => { if (!document.hidden) check(false); });
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-net=check]'); if (b) { b.disabled = true; check(true).then(() => { b.disabled = false; }); } });
if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', () => check(false));
setTimeout(() => check(true), 1500);
setInterval(() => { if (!document.hidden) check(false); }, 20000);
})();
