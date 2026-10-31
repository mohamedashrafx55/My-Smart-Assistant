/* Update check: Settings → "Check for updates". Web: detects a new service worker and offers a reload.
   Android / Windows: reads the latest GitHub Release for this platform and offers the download (Windows can download + start the installer itself). */
(function(){
'use strict';
const MSA = window.MSA, U = MSA.u, I = MSA.icon, esc = U.esc, T = (a, e) => MSA.T(a, e), S = () => MSA.state;
const REPO = 'mohamedashrafx55/My-Smart-Assistant';
const B = () => MSA.build || { ver: '', n: 0, platform: 'web' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cfg = () => { const s = S().settings; s.updates = Object.assign({ auto: true }, s.updates || {}); return s.updates; };
function plat(){
  const p = B().platform; if (p && p !== 'web') return p;
  if (window.msaDesktop) return 'windows';
  try { if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) return 'android'; } catch (e) {}
  return 'web';
}
const platName = p => ({ android: T('أندرويد', 'Android'), windows: T('ويندوز', 'Windows'), web: T('الويب', 'Web') })[p] || p;
let reloadReady = false, busy = false, last = null, dismissed = false;

async function latestRelease(p){
  const r = await fetch('https://api.github.com/repos/' + REPO + '/releases?per_page=30', { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
  if (!r.ok) throw new Error('http ' + r.status);
  const list = await r.json(), pre = p + '-', ext = p === 'android' ? /\.apk$/i : /\.exe$/i; let best = null;
  (Array.isArray(list) ? list : []).forEach(x => {
    if (!x || x.draft || x.prerelease) return; const tag = String(x.tag_name || ''); if (tag.indexOf(pre) !== 0) return;
    const n = parseInt(tag.slice(pre.length), 10); if (!(n > 0)) return;
    const a = (x.assets || []).find(y => ext.test(y.name || '')); if (!a) return;
    if (!best || n > best.n) best = { n, name: x.name || tag, body: String(x.body || ''), url: a.browser_download_url, page: x.html_url, size: a.size || 0, date: x.published_at || '' };
  });
  return best;
}
async function checkWeb(){
  if (!('serviceWorker' in navigator)) return { state: 'unsupported' };
  const reg = await navigator.serviceWorker.getRegistration(); if (!reg) return { state: 'unsupported' };
  if (reloadReady) return { state: 'new', web: true };
  try { await reg.update(); } catch (e) {}
  for (let i = 0; i < 12; i++) { if (reloadReady) return { state: 'new', web: true }; if (i >= 3 && !reg.installing && !reg.waiting) break; await sleep(500); }
  return reloadReady ? { state: 'new', web: true } : { state: 'latest' };
}
async function check(){
  const p = plat();
  if (p === 'web') return checkWeb();
  if (!(B().n > 0)) return { state: 'unknown' };                 /* not built by the GitHub workflow */
  if (navigator.onLine === false) return { state: 'error', msg: T('لا يوجد اتصال بالإنترنت', 'No internet connection') };
  try { const best = await latestRelease(p); if (!best) return { state: 'latest', none: true }; return best.n > B().n ? { state: 'new', info: best } : { state: 'latest' }; }
  catch (e) { return { state: 'error', msg: T('تعذّر الاتصال بـ GitHub', 'Could not reach GitHub') }; }
}
const mb = n => (n / 1048576).toFixed(1) + ' MB';

/* ---------- bottom bar ---------- */
function bar(res){
  let el = document.getElementById('updBar'); if (dismissed || !res || res.state !== 'new') { if (el && (!res || res.state !== 'new')) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'updBar'; el.className = 'updbar'; document.body.appendChild(el); }
  const web = !!res.web, n = res.info ? res.info.n : 0;
  el.innerHTML = '<span class="ub-i">' + I('download', 'sm') + '</span><span class="ub-t" dir="auto">' + esc(web ? T('نسخة جديدة جاهزة — أعد تحميل التطبيق لتفعيلها', 'A new version is ready — reload to use it') : T('نسخة جديدة متاحة (بناء ' + n + ')', 'A new version is available (build ' + n + ')')) + '</span>' +
    '<button class="btn sm primary" data-ub="go">' + esc(web ? T('تحديث الآن', 'Update now') : T('تحديث', 'Update')) + '</button><button class="icon-btn sm" data-ub="x" aria-label="close">' + I('x', 'sm') + '</button>';
  el.onclick = e => { const b = e.target.closest('[data-ub]'); if (!b) return; if (b.dataset.ub === 'x') { dismissed = true; el.remove(); } else install(res, el); };
}
async function install(res, ui){
  if (res.web) { location.reload(); return; }
  const info = res.info, p = plat(), note = ui && ui.querySelector('.ub-t');
  if (p === 'windows' && window.msaDesktop && window.msaDesktop.installUpdate) {
    if (note) note.textContent = T('جاري تنزيل التحديث…', 'Downloading the update…'); MSA.toast(T('جاري تنزيل التحديث… سيُغلق البرنامج ويبدأ التثبيت', 'Downloading… the app will close and the installer will start'), 'ok', 6000);
    try { const r = await window.msaDesktop.installUpdate(info.url); if (r && r.ok) return; } catch (e) {}
    MSA.toast(T('تعذّر التثبيت التلقائي — هيتفتح رابط التحميل', 'Automatic install failed — opening the download page'), 'err', 5000); MSA.openLink(info.page); return;
  }
  MSA.openLink(info.url);
  MSA.toast(T('هينزل الملف — افتحه من إشعارات التحميل واضغط «تثبيت». لو طلب إذن، اسمح بالتثبيت من المتصفح.', 'The file will download — open it from the download notification and tap Install. If asked, allow installs from the browser.'), 'ok', 9000);
}

/* ---------- auto check ---------- */
async function auto(force){
  if (busy || (!force && !cfg().auto)) return; busy = true;
  try { const r = await check(); last = r; cfg().last = Date.now(); MSA.save(); if (r.state === 'new') bar(r); } catch (e) {} finally { busy = false; }
}
if ('serviceWorker' in navigator) {
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!had || reloadReady) return; reloadReady = true; last = { state: 'new', web: true }; bar(last); const st = document.getElementById('updStat'); if (st) refresh(document); });
}
setTimeout(() => auto(false), 9000);
setInterval(() => auto(false), 6 * 3600 * 1000);

/* ---------- Settings section ---------- */
function statusHTML(r){
  if (!r) return '<span class="hint">' + esc(T('لم يتم الفحص بعد.', 'Not checked yet.')) + '</span>';
  if (r.state === 'new') {
    if (r.web) return '<b class="upd-ok">' + esc(T('نسخة جديدة جاهزة', 'A new version is ready')) + '</b> <span class="hint">' + esc(T('أعد تحميل التطبيق لتفعيلها.', 'Reload the app to use it.')) + '</span>';
    const i = r.info; return '<b class="upd-ok">' + esc(T('تحديث متاح: بناء ', 'Update available: build ')) + i.n + '</b> <span class="hint" dir="ltr">' + esc(mb(i.size)) + (i.date ? ' · ' + esc(String(i.date).slice(0, 10)) : '') + '</span>' +
      (i.body.trim() ? '<pre class="upd-notes" dir="auto">' + esc(i.body.trim().slice(0, 700)) + '</pre>' : '');
  }
  if (r.state === 'latest') return '<b>' + esc(T('أنت على آخر نسخة ✓', 'You are up to date ✓')) + '</b>' + (r.none ? ' <span class="hint">' + esc(T('(لا توجد إصدارات منشورة بعد)', '(no published releases yet)')) + '</span>' : '');
  if (r.state === 'unknown') return '<span class="hint">' + esc(T('هذه النسخة لم تُبنَ من GitHub، فلا يمكن مقارنتها. ابنِ نسخة جديدة من Actions وثبّتها مرة واحدة ليعمل الفحص بعدها.', 'This copy was not built by the GitHub workflow, so it can’t be compared. Install one fresh build from Actions and checking will work from then on.')) + '</span>';
  if (r.state === 'unsupported') return '<span class="hint">' + esc(T('التحديث التلقائي غير متاح في هذا المتصفح. أعد تحميل الصفحة يدويًا.', 'Auto-update isn’t available in this browser. Reload the page manually.')) + '</span>';
  return '<span class="upd-err">' + esc(r.msg || T('تعذّر الفحص', 'Check failed')) + '</span>';
}
MSA.updatesHTML = function(){
  const p = plat(), b = B(), c = cfg();
  return '<div class="sec" data-sec="upd"><h4>' + I('download', 'sm') + esc(T('فحص التحديثات', 'Check for updates')) + '</h4>' +
    '<div class="hint" style="margin-bottom:8px" dir="auto">' + esc(T('النسخة الحالية: ', 'Current version: ')) + '<b>v' + esc(b.ver || '?') + '</b>' + (b.n > 0 ? ' · ' + esc(T('بناء ', 'build ')) + b.n : '') + ' · ' + esc(platName(p)) + '</div>' +
    '<div id="updStat" style="margin-bottom:10px">' + statusHTML(last) + '</div>' +
    '<div class="row" style="margin-bottom:10px"><button class="btn sm primary" id="updGo">' + I('repeat', 'sm') + '<span>' + esc(T('افحص الآن', 'Check now')) + '</span></button>' +
      '<button class="btn sm" id="updInstall" ' + (last && last.state === 'new' ? '' : 'hidden') + '>' + I('download', 'sm') + '<span>' + esc(p === 'web' ? T('تحديث الآن', 'Update now') : p === 'windows' ? T('تنزيل وتثبيت', 'Download & install') : T('تنزيل التحديث', 'Download update')) + '</span></button></div>' +
    '<label class="row" style="cursor:pointer;margin-bottom:8px"><input type="checkbox" class="cb" id="updAuto" ' + (c.auto ? 'checked' : '') + '><span>' + esc(T('فحص تلقائي عند فتح التطبيق وكل 6 ساعات', 'Check automatically when the app opens and every 6 hours')) + '</span></label>' +
    '<div class="hint" dir="auto">' + esc(p === 'android' ? T('على الأندرويد: يُنزَّل ملف الـ APK وتضغط «تثبيت» بنفسك (الأندرويد لا يسمح بالتثبيت الصامت).', 'On Android the APK is downloaded and you tap Install (Android doesn’t allow silent installs).')
      : p === 'windows' ? T('على ويندوز: يُنزَّل المُثبّت ويُشغَّل ثم يُغلق البرنامج ليُحدَّث فوق القديم. بياناتك تبقى.', 'On Windows the installer is downloaded and started, and the app closes so it updates in place. Your data stays.')
      : T('على الويب: النسخة الجديدة تُحمَّل في الخلفية وتفعَّل بعد إعادة التحميل.', 'On the web the new version downloads in the background and activates after a reload.')) + '</div></div>';
};
function refresh(root){
  const st = root.querySelector('#updStat'); if (st) st.innerHTML = statusHTML(last);
  const ib = root.querySelector('#updInstall'); if (ib) ib.hidden = !(last && last.state === 'new');
}
MSA.wireUpdates = function(root){
  const box = root.querySelector('[data-sec=upd]'); if (!box) return;
  box.querySelector('#updAuto').onchange = e => { cfg().auto = e.target.checked; MSA.save(); };
  const go = box.querySelector('#updGo');
  go.onclick = async () => {
    if (busy) return; busy = true; go.disabled = true; box.querySelector('#updStat').innerHTML = '<span class="hint">' + esc(T('جاري الفحص…', 'Checking…')) + '</span>';
    try { last = await check(); cfg().last = Date.now(); MSA.save(); } finally { busy = false; go.disabled = false; }
    refresh(box); if (last && last.state === 'new') bar(last);
  };
  box.querySelector('#updInstall').onclick = () => { if (last && last.state === 'new') install(last, null); };
};
MSA.updates = { check, plat, latestRelease, bar };
})();
