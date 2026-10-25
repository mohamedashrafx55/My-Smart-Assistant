/* Alarms: schedules reminders + the daily alert on the device itself so they fire while the app is closed (Android app via Capacitor Local Notifications). On desktop/web it reports what is possible. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, esc = U.esc;
const S = () => MSA.state, T = (a, e) => MSA.T(a, e);
const LN = () => (MSA.native ? MSA.native('LocalNotifications') : null);
const isEl = /Electron/i.test(navigator.userAgent);
const CH = 'msa-alerts';
const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return (Math.abs(h) % 1800000000) + 1000; };
const askedKey = 'msa_alarm_asked';
let busy = false, again = false, lastSig = '', timer = 0;

function remindMs(x){
  if (!x.remind) return null;
  if (x.remind === 'custom') return U.toMs(x.remindAt);
  const d = U.toMs(x.due); return d == null ? null : d - (+x.remind) * 60000;
}
function plan(){
  const now = Date.now(), out = [], tasks = (S().tasks || []).filter(x => x.type === 'task' && x.status !== 'done');
  tasks.forEach(x => {
    const r = remindMs(x); if (r == null || r < now + 4000 || r > now + 90 * 86400000) return;
    const due = U.toMs(x.due);
    out.push({ id: hash(x.id), at: r, title: x.title || T('تذكير', 'Reminder'), body: due != null ? (MSA.fmtDate ? MSA.fmtDate(due, true) : '') : '', extra: { tid: x.id } });
  });
  out.sort((a, b) => a.at - b.at); out.length = Math.min(out.length, 120);
  const dl = Object.assign({ on: false, time: '08:00' }, S().settings.daily || {}), m = String(dl.time || '08:00').match(/(\d\d):(\d\d)/);
  if (dl.on && m) {
    const name = MSA.myName ? MSA.myName() : '', late = tasks.filter(x => { const d = U.toMs(x.due); return d != null && U.dateKey(new Date(d)) < U.dateKey(new Date()); }).length;
    for (let i = 0; i < 14; i++) {
      const d = new Date(); d.setDate(d.getDate() + i); d.setHours(+m[1], +m[2], 0, 0); if (d.getTime() < now + 4000) continue;
      const key = U.dateKey(d), n = tasks.filter(x => x.due && String(x.due).slice(0, 10) === key).length + late; if (!n) continue;
      out.push({ id: 100 + i, at: d.getTime(), title: T('أهلاً يا ' + name, 'Hi ' + name), body: T('عندك ' + n + ' مهمة النهارده — افتح التطبيق وشوف يومك', 'You have ' + n + ' task(s) today — open the app to see your day'), extra: { today: true } });
    }
  }
  return out;
}
async function perm(ln, ask){
  let p = await ln.checkPermissions();
  if (p.display === 'granted') return true;
  let asked = ''; try { asked = localStorage.getItem(askedKey); } catch (e) {}
  if (!ask && asked) return false;
  try { localStorage.setItem(askedKey, '1'); } catch (e) {}
  p = await ln.requestPermissions(); return p.display === 'granted';
}
async function sync(ask){
  const ln = LN(); if (!ln) return false;
  if (busy) { again = true; return false; } busy = true;
  try {
    const items = plan(), sig = JSON.stringify(items.map(x => [x.id, x.at, x.title, x.body]));
    if (!items.length && !lastSig && !ask) { busy = false; return true; }
    if (!await perm(ln, ask || items.length > 0)) return false;
    if (sig === lastSig && !ask) return true;
    try { await ln.createChannel({ id: CH, name: T('تنبيهات المساعد', 'Assistant alerts'), importance: 4, visibility: 1, vibration: true }); } catch (e) {}
    const pend = await ln.getPending();
    if (pend && pend.notifications && pend.notifications.length) await ln.cancel({ notifications: pend.notifications.map(n => ({ id: n.id })) });
    if (items.length) await ln.schedule({ notifications: items.map(x => ({ id: x.id, title: x.title, body: x.body, channelId: CH, schedule: { at: new Date(x.at), allowWhileIdle: true }, extra: x.extra })) });
    lastSig = sig; return true;
  } catch (e) { return false; } finally { busy = false; if (again) { again = false; setTimeout(() => sync(false), 800); } }
}
function soon(){ clearTimeout(timer); timer = setTimeout(() => sync(false), 3500); }
MSA.alarms = { sync, plan, soon, native: () => !!LN(), electron: isEl };

if (LN()) {
  const _save = MSA.save; MSA.save = function(){ const r = _save.apply(this, arguments); soon(); return r; };
  setTimeout(() => sync(false), 4000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(timer); sync(false); } });
  try { LN().addListener('localNotificationActionPerformed', ev => { const x = (ev && ev.notification && ev.notification.extra) || {}; setTimeout(() => { if (document.getElementById('lock')) return; if (x.today && MSA.openToday) MSA.openToday(); else if (MSA.go) MSA.go('tasks'); }, 600); }); } catch (e) {}
}

async function test(){
  const ln = LN(), name = MSA.myName ? MSA.myName() : '';
  if (ln) {
    if (!await perm(ln, true)) { MSA.toast(T('إذن الإشعارات مش مفعّل — فعّله من إعدادات الموبايل', 'Notification permission is off — enable it in phone settings'), 'err', 5000); return; }
    try { await ln.createChannel({ id: CH, name: T('تنبيهات المساعد', 'Assistant alerts'), importance: 4, visibility: 1, vibration: true }); } catch (e) {}
    await ln.schedule({ notifications: [{ id: 99, title: T('أهلاً يا ' + name, 'Hi ' + name), body: T('ده إشعار تجريبي — اقفل التطبيق وهيظهر بعد 10 ثواني', 'Test alert — close the app and it appears in 10 seconds'), channelId: CH, schedule: { at: new Date(Date.now() + 10000), allowWhileIdle: true } }] });
    MSA.toast(T('اقفل التطبيق دلوقتي — الإشعار هيظهر بعد 10 ثواني', 'Close the app now — the alert shows in 10 seconds'), 'ok', 6000); return;
  }
  try {
    if (!('Notification' in window)) throw 0;
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission !== 'granted') throw 0;
    new Notification(T('أهلاً يا ' + name, 'Hi ' + name), { body: T('الإشعارات شغّالة ✓', 'Notifications work ✓'), icon: 'icons/icon-192.png' });
  } catch (e) { MSA.toast(T('الإشعارات مش متاحة أو محجوبة في الجهاز ده', 'Notifications are unavailable or blocked on this device'), 'err', 5000); }
}
const note = () => LN() ? T('نسخة الموبايل: التنبيهات بتتجدول على الأندرويد نفسه وبتظهر حتى لو التطبيق مقفول.', 'Phone app: alerts are scheduled on Android itself and show even when the app is closed.')
  : isEl ? T('نسخة الكمبيوتر: التنبيهات بتظهر طول ما البرنامج شغال (حتى مصغّر في شريط النظام).', 'Desktop app: alerts show while the program is running (even minimised to the tray).')
  : T('نسخة الويب: التنبيهات بتظهر والتطبيق مفتوح فقط. لتنبيهات والتطبيق مقفول استخدم نسخة الأندرويد.', 'Web version: alerts show only while the app is open. Use the Android app for alerts when it is closed.');
MSA.alarmsHTML = () => '<div class="sec"><h4>' + I('bell', 'sm') + esc(T('الإشعارات والتطبيق مقفول', 'Alerts while closed')) + '</h4><div class="hint" style="margin-bottom:8px">' + esc(note()) + '</div><div class="hint" id="alStat" style="margin-bottom:8px"></div><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" id="alTest">' + I('bell', 'sm') + esc(T('إشعار تجريبي', 'Test alert')) + '</button>' + (LN() ? '<button class="btn sm" id="alExact">' + esc(T('السماح بالمنبّهات الدقيقة', 'Allow exact alarms')) + '</button>' : '') + '</div></div>';
MSA.wireAlarms = el => {
  const t = $('#alTest', el); if (t) t.onclick = test;
  const ex = $('#alExact', el); if (ex) ex.onclick = async () => { try { const r = await LN().checkExactNotificationSetting(); if (r && r.exact_alarm === 'granted') { MSA.toast(T('المنبّهات الدقيقة مسموحة ✓', 'Exact alarms already allowed ✓'), 'ok'); return; } await LN().changeExactNotificationSetting(); } catch (e) { MSA.toast(T('مش متاحة على إصدار الأندرويد ده', 'Not available on this Android version'), 'ok'); } };
  const st = $('#alStat', el); if (st && LN()) { sync(false).then(async () => { try { const p = await LN().getPending(); if (document.body.contains(st)) st.textContent = T('تنبيهات مجدولة على الجهاز: ', 'Alerts scheduled on the device: ') + ((p && p.notifications) || []).length; } catch (e) {} }); }
};
})();
