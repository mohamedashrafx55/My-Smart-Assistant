/* Data status screen + sync-failure alert.
   Rule: this file NEVER starts a sync or a backup by itself. It only tells the user something is wrong
   and offers buttons — the user decides. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc, S = () => MSA.state, DAY = 864e5;
const H = MSA.health = {};
const LC = 'msa_lastchange', SN = 'msa_syfail_snooze';
const lget = k => { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } };
const lset = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) {} };

/* remember when something was last changed on this device (kept outside the synced state) */
const _save = MSA.save;
MSA.save = function(){ lset(LC, Date.now()); return _save.apply(this, arguments); };

const ago = ms => {
  if (!ms) return T('لسه ماحصلش', 'never');
  const m = Math.max(0, Math.round((Date.now() - ms) / 6e4));
  if (m < 1) return T('دلوقتي', 'just now'); if (m < 60) return T('من ' + m + ' دقيقة', m + ' min ago');
  const h = Math.round(m / 60); if (h < 24) return T('من ' + h + ' ساعة', h + ' h ago');
  const d = Math.round(h / 24); return T('من ' + d + ' يوم', d + ' day(s) ago');
};
const dt = ms => ms ? MSA.fmtDate(ms, true) : '—';

/* ---------------- collect ---------------- */
H.collect = async function(){
  const s = S(), sy = MSA.sync ? MSA.sync.info() : { linked: false }, bk = (s.settings && s.settings.backup) || {};
  let est = null, persisted = null, files = 0, fbytes = 0;
  try { if (navigator.storage && navigator.storage.estimate) est = await navigator.storage.estimate(); } catch (e) {}
  try { if (navigator.storage && navigator.storage.persisted) persisted = await navigator.storage.persisted(); } catch (e) {}
  try { const all = await MSA.files.all(); files = all.length; fbytes = all.reduce((a, r) => a + (r.size || (r.blob && r.blob.size) || 0), 0); } catch (e) {}
  let stateBytes = 0; try { stateBytes = JSON.stringify(s).length; } catch (e) {}
  const cl = MSA.clients ? MSA.clients.data().rows.length : 0;
  return {
    sync: sy, backup: { last: bk.last || 0, where: bk.where || '' }, lastChange: lget(LC),
    counts: { tasks: (s.tasks || []).length, projects: (s.projects || []).length, clients: cl, docs: (s.docs || []).length, proposals: ((s.upwork && s.upwork.props) || []).length, files },
    storage: { used: est && est.usage, quota: est && est.quota, persisted, stateBytes, fbytes }
  };
};
H.issues = function(d){
  const out = [], sy = d.sync, now = Date.now();
  if (sy.linked && (sy.err === 'auth')) out.push(['bad', T('المزامنة محتاجة تسجيل دخول تاني', 'Sync needs you to sign in again')]);
  else if (sy.linked && sy.fails >= 2) out.push(['bad', T('المزامنة فشلت ' + sy.fails + ' مرات ورا بعض', 'Sync failed ' + sy.fails + ' times in a row')]);
  if (sy.linked && sy.last && now - sy.last > 3 * DAY) out.push(['warn', T('آخر مزامنة ناجحة من أكتر من 3 أيام', 'Last successful sync is more than 3 days old')]);
  if (d.lastChange && (!d.backup.last || d.lastChange - d.backup.last > 7 * DAY)) out.push(['warn', T('فيه تعديلات من أكتر من أسبوع بعد آخر نسخة احتياطية', 'You have changes older than a week that are not in any backup')]);
  if (!sy.linked && !d.backup.last) out.push(['warn', T('مفيش مزامنة ولا نسخة احتياطية — بياناتك على الجهاز ده بس', 'No sync and no backup — your data lives only on this device')]);
  if (d.storage.persisted === false) out.push(['warn', T('المتصفح ممكن يمسح البيانات لو المساحة قلّت (التخزين غير مثبّت)', 'The browser may clear data when space is low (storage not persistent)')]);
  if (d.storage.quota && d.storage.used / d.storage.quota > .85) out.push(['bad', T('مساحة التخزين قربت تخلص', 'Storage is almost full')]);
  return out;
};

/* ---------------- the screen ---------------- */
const row = (k, v, cls) => '<div class="dh-r"><span>' + esc(k) + '</span><b class="' + (cls || '') + '" dir="auto">' + v + '</b></div>';
H.render = async function(host){
  const d = await H.collect(), sy = d.sync, iss = H.issues(d), st = d.storage;
  const syncLine = !sy.linked ? '<span class="muted">' + esc(T('مش مفعّلة', 'Not connected')) + '</span>'
    : (sy.err && sy.err !== 'offline' ? '<span class="dh-bad">' + esc(sy.err === 'auth' ? T('محتاجة تسجيل دخول', 'Sign-in needed') : T('فشلت', 'Failed')) + '</span> · ' : '') + esc(ago(sy.last));
  host.innerHTML =
    '<div class="dh-sum ' + (iss.some(x => x[0] === 'bad') ? 'bad' : iss.length ? 'warn' : 'ok') + '">' + I(iss.length ? 'shield' : 'check-c', 'sm') + '<span>' + esc(iss.length ? T('فيه ' + iss.length + ' ملاحظة على بياناتك', iss.length + ' thing(s) to look at') : T('بياناتك سليمة ومحفوظة', 'Your data looks safe')) + '</span></div>' +
    (iss.length ? '<ul class="dh-iss">' + iss.map(x => '<li class="' + x[0] + '">' + esc(x[1]) + '</li>').join('') + '</ul>' : '') +
    '<div class="dh-grid">' +
    '<div class="dh-card"><h5>' + esc(T('المزامنة', 'Sync')) + '</h5>' + row(T('الحالة', 'Status'), syncLine) + (sy.linked ? row(T('آخر مزامنة ناجحة', 'Last successful sync'), esc(dt(sy.last))) + row(T('الحساب', 'Account'), esc(sy.email || '—')) : '') +
      '<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">' + (sy.linked ? '<button class="btn sm primary" data-dh="sync">' + I('repeat', 'sm') + esc(T('زامن الآن', 'Sync now')) + '</button>' : '') + '</div></div>' +
    '<div class="dh-card"><h5>' + esc(T('النسخ الاحتياطي', 'Backup')) + '</h5>' + row(T('آخر نسخة', 'Last backup'), esc(d.backup.last ? ago(d.backup.last) : T('لسه ماحصلش', 'never'))) + (d.backup.where ? row(T('المكان', 'Where'), esc(d.backup.where)) : '') + row(T('آخر تعديل على الجهاز', 'Last change here'), esc(dt(d.lastChange))) +
      '<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn sm primary" data-dh="backup">' + I('download', 'sm') + esc(T('احفظ نسخة الآن', 'Back up now')) + '</button><button class="btn sm" data-dh="restore">' + I('upload', 'sm') + esc(T('استرجاع من ملف', 'Restore from file')) + '</button></div></div>' +
    '<div class="dh-card"><h5>' + esc(T('محتوى بياناتك', 'What you have')) + '</h5>' + row(T('مهام', 'Tasks'), d.counts.tasks) + row(T('مشاريع', 'Projects'), d.counts.projects) + row(T('عملاء', 'Clients'), d.counts.clients) + row(T('عروض وفواتير', 'Quotes & invoices'), d.counts.docs) + row(T('عروض Upwork', 'Upwork proposals'), d.counts.proposals) + row(T('ملفات مرفقة', 'Attached files'), d.counts.files + (d.storage.fbytes ? ' · ' + U.size(d.storage.fbytes) : '')) + '</div>' +
    '<div class="dh-card"><h5>' + esc(T('التخزين على الجهاز', 'Device storage')) + '</h5>' + row(T('المستخدم', 'Used'), st.used != null ? esc(U.size(st.used)) + (st.quota ? ' / ' + esc(U.size(st.quota)) : '') : '—') + row(T('حجم البيانات النصية', 'Data size'), esc(U.size(st.stateBytes))) + row(T('تخزين دائم', 'Persistent'), st.persisted == null ? '—' : st.persisted ? esc(T('نعم', 'Yes')) : '<span class="dh-bad">' + esc(T('لا', 'No')) + '</span>') +
      (st.persisted === false && navigator.storage && navigator.storage.persist ? '<div class="row" style="margin-top:10px"><button class="btn sm" data-dh="persist">' + I('shield', 'sm') + esc(T('اطلب تثبيت التخزين', 'Request persistent storage')) + '</button></div>' : '') + '</div></div>' +
    '<div class="hint" style="margin-top:12px">' + esc(T('أنت اللي بتقرر: مفيش مزامنة ولا نسخة بتتعمل من نفسها من الشاشة دي. بنعلّمك بس لو حاجة محتاجة انتباهك.', 'You decide: nothing here syncs or backs up on its own. We only tell you when something needs attention.')) + '</div>';
  host.onclick = async e => {
    const b = e.target.closest('[data-dh]'); if (!b) return; const a = b.dataset.dh; b.disabled = true;
    try {
      if (a === 'sync') { const r = await MSA.sync.run({ force: true }); MSA.toast(r && r.error ? T('تعذّرت المزامنة: ', 'Sync failed: ') + r.error : T('تمت المزامنة', 'Synced'), r && r.error ? 'err' : 'ok'); }
      else if (a === 'backup') { if (MSA.plus && MSA.plus.backupNow) await MSA.plus.backupNow(); }
      else if (a === 'restore') { const [f] = await MSA.pickFiles('.json,application/json', false); if (f && await MSA.confirm(T('الاسترجاع هيستبدل بيانات الجهاز ده بمحتوى الملف. متأكد؟', 'Restoring replaces this device’s data with the file. Sure?'), { danger: true })) { await MSA.importAll(await f.text()); location.reload(); return; } }
      else if (a === 'persist') { const ok = await navigator.storage.persist(); MSA.toast(ok ? T('اتثبّت التخزين', 'Storage is now persistent') : T('المتصفح رفض — جرّب تثبّت التطبيق', 'The browser declined — try installing the app'), ok ? 'ok' : 'err'); }
    } catch (x) { MSA.toast(T('حصل خطأ: ', 'Error: ') + (x && x.message || x), 'err'); }
    if (host.isConnected) H.render(host);
  };
};
H.open = function(){
  const m = MSA.modal({ title: T('حالة البيانات', 'Data status'), size: 'wide', body: '<div id="dhBody" class="dh"></div>', buttons: [{ label: T('إغلاق', 'Close'), cls: 'ghost', onClick: a => a.close() }], onMount: el => { H.render($('#dhBody', el)); } });
  return m;
};

/* settings section */
MSA.dataHTML = function(){
  return '<div class="sec" data-dh-sec="1"><h4>' + I('shield', 'sm') + esc(T('حالة البيانات', 'Data status')) + '</h4><div class="hint" style="margin-bottom:10px">' + esc(T('شوف آخر مزامنة وآخر نسخة احتياطية وحجم بياناتك، وأي حاجة محتاجة انتباهك.', 'See your last sync, last backup, data size and anything that needs attention.')) + '</div><button class="btn sm primary" data-dh-open="1">' + I('shield', 'sm') + esc(T('افتح حالة البيانات', 'Open data status')) + '</button></div>';
};
MSA.wireData = function(root){ const b = $('[data-dh-open]', root); if (b) b.onclick = () => H.open(); };

/* ---------------- sync-failure alert (never forces anything) ---------------- */
const BID = 'syFailBanner';
const hide = () => { const b = document.getElementById(BID); if (b) b.remove(); };
H.shouldAlert = () => {
  if (!MSA.sync) return false; const i = MSA.sync.info();
  if (!i.linked || i.err === 'offline') return false;
  if (!(i.err === 'auth' || i.fails >= 2)) return false;
  return Date.now() > lget(SN);
};
H.check = function(){
  if (!H.shouldAlert()) { hide(); return false; }
  if (document.getElementById(BID) || document.getElementById('lock') || document.getElementById('splash')) return true;
  const i = MSA.sync.info(), el = document.createElement('div'); el.id = BID; el.className = 'bk-banner sy-fail'; el.setAttribute('role', 'alert');
  el.innerHTML = '<span class="bk-ic">' + I('shield', 'sm') + '</span><div class="bk-t"><b>' + esc(i.err === 'auth' ? T('المزامنة محتاجة تسجيل دخول تاني', 'Sync needs you to sign in again') : T('المزامنة فشلت', 'Sync failed')) + '</b><span>' + esc(i.err === 'auth' ? T('بياناتك آمنة على الجهاز. افتح الإعدادات وسجّل الدخول تاني.', 'Your data is safe on this device. Open Settings and sign in again.') : T('آخر مرة نجحت: ' + ago(i.last) + '. بياناتك على الجهاز سليمة — اختار تحاول تاني ولا لا.', 'Last success: ' + ago(i.last) + '. Your data on this device is intact — retry whenever you like.')) + '</span></div>' +
    '<div class="bk-b"><button class="btn sm primary" data-sf="retry">' + esc(T('جرّب تاني', 'Retry')) + '</button><button class="btn sm" data-sf="status">' + esc(T('حالة البيانات', 'Data status')) + '</button><button class="btn sm ghost" data-sf="later">' + esc(T('لاحقًا', 'Later')) + '</button></div>';
  el.onclick = async e => {
    const x = e.target.closest('[data-sf]'); if (!x) return; const a = x.dataset.sf;
    if (a === 'later') { lset(SN, Date.now() + 6 * 36e5); hide(); }
    else if (a === 'status') { H.open(); }
    else if (a === 'retry') { x.disabled = true; const r = await MSA.sync.run({ force: true }); x.disabled = false; if (r && !r.error) { hide(); MSA.toast(T('تمت المزامنة', 'Synced'), 'ok'); } else MSA.toast(T('لسه فشلت: ', 'Still failing: ') + ((r && r.error) || ''), 'err'); }
  };
  document.body.appendChild(el); return true;
};
if (MSA.sync && MSA.sync.listen) MSA.sync.listen(() => { try { H.check(); } catch (e) {} });
setTimeout(() => H.check(), 7000); setInterval(() => H.check(), 5 * 60000);
})();
