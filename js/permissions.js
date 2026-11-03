/* Permissions centre (Settings): shows the real state of each device permission and lets you grant it */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const t = (k, v) => MSA.t(k, v);
Object.assign(MSA.dict.en, {
  's.perms': 'Permissions', 'perm.hint': 'Allow only what you need. Everything stays on your device — nothing is uploaded.',
  'perm.granted': 'Allowed', 'perm.denied': 'Blocked', 'perm.prompt': 'Not asked yet', 'perm.ask': 'On request', 'perm.unsupported': 'Not available here',
  'perm.sysHelp': 'The system refused. Open the phone Settings → Apps → My Smart Assistant → Permissions, allow it, then come back and press Refresh.', 'perm.allow': 'Allow', 'perm.recheck': 'Refresh', 'perm.blockedHelp': 'Blocked — enable it from the app / browser site settings, then press Refresh.',
  'perm.storage': 'Internal storage', 'perm.storage.d': 'Keeps your projects, files and notes safe from being cleared automatically, and lets you pick files from the device.',
  'perm.notifications': 'Notifications', 'perm.notifications.d': 'Task reminders and deadlines.',
  'perm.camera': 'Camera', 'perm.camera.d': 'Capture photos and videos straight into a project step or a task.',
  'perm.microphone': 'Microphone', 'perm.microphone.d': 'Record voice notes and audio for your steps and tasks.',
  'perm.location': 'Location', 'perm.location.d': 'Tag a shoot location or meeting place on a task.',
  'perm.contacts': 'Contacts', 'perm.contacts.d': 'Pick a client from your contacts to copy their phone or email.',
  'perm.clipboard': 'Clipboard', 'perm.clipboard.d': 'Paste video links quickly into the learning library.',
  'perm.testOk': 'Works', 'perm.testFail': 'Could not get access', 'perm.picked': 'Copied: {v}', 'perm.pick': 'Pick contact',
  'perm.storageInfo': '{u} used of {q}', 'perm.clipNote': 'Android needs no permission for the clipboard — it works automatically while the app is open.', 'perm.note': 'On Android the app asks the system for these when the APK is built; the contacts picker needs Chrome on Android.'
});
Object.assign(MSA.dict.ar, {
  's.perms': 'الأذونات', 'perm.hint': 'اسمح فقط بما تحتاجه. كل شيء يبقى على جهازك ولا يُرفع لأي مكان.',
  'perm.granted': 'مسموح', 'perm.denied': 'محظور', 'perm.prompt': 'لم يُطلب بعد', 'perm.ask': 'عند الطلب', 'perm.unsupported': 'غير متاح هنا',
  'perm.sysHelp': 'النظام رفض الطلب. افتح إعدادات الهاتف ← التطبيقات ← My Smart Assistant ← الأذونات، فعّل الإذن ثم ارجع واضغط تحديث.', 'perm.allow': 'سماح', 'perm.recheck': 'تحديث', 'perm.blockedHelp': 'محظور — فعّله من إعدادات الموقع / التطبيق في الجهاز ثم اضغط تحديث.',
  'perm.storage': 'مساحة التخزين الداخلية', 'perm.storage.d': 'تحمي مشاريعك وملفاتك وملاحظاتك من المسح التلقائي، وتتيح اختيار الملفات من الجهاز.',
  'perm.notifications': 'الإشعارات', 'perm.notifications.d': 'تنبيهات المهام والمواعيد النهائية.',
  'perm.camera': 'الكاميرا', 'perm.camera.d': 'التقاط صور وفيديو مباشرة داخل خطوة في مشروع أو مهمة.',
  'perm.microphone': 'الميكروفون', 'perm.microphone.d': 'تسجيل ملاحظات صوتية وملفات صوت لخطواتك ومهامك.',
  'perm.location': 'الموقع', 'perm.location.d': 'تحديد مكان التصوير أو الاجتماع في المهمة.',
  'perm.contacts': 'جهات الاتصال', 'perm.contacts.d': 'اختيار عميل من جهات الاتصال لنسخ رقمه أو إيميله.',
  'perm.clipboard': 'الحافظة', 'perm.clipboard.d': 'لصق روابط الفيديو بسرعة في مكتبة التعليم.',
  'perm.testOk': 'يعمل', 'perm.testFail': 'تعذّر الحصول على الإذن', 'perm.picked': 'تم النسخ: {v}', 'perm.pick': 'اختيار جهة اتصال',
  'perm.storageInfo': 'مستخدم {u} من {q}', 'perm.clipNote': 'أندرويد لا يطلب إذنًا للحافظة — تعمل تلقائيًا أثناء فتح التطبيق.', 'perm.note': 'على أندرويد يطلب التطبيق هذه الأذونات من النظام عند بناء الـ APK، واختيار جهات الاتصال يحتاج Chrome على أندرويد.'
});

const LIST = [
  ['storage', 'folder'], ['notifications', 'bell'], ['camera', 'video'], ['microphone', 'music'], ['location', 'pinmap'], ['contacts', 'user'], ['clipboard', 'clip']
];
const stopStream = s => { try { s.getTracks().forEach(x => x.stop()); } catch (e) {} };
const NAT = n => { try { return MSA.native ? MSA.native(n) : null; } catch (e) { return null; } };
const isNat = () => !!NAT('App');
const PL = () => NAT('MsaPerms');
const ALIAS = { storage: 'files', camera: 'camera', microphone: 'microphone', location: 'location', contacts: 'contacts' };
const okMem = () => { const S = MSA.state; return (S.permsOk = S.permsOk || {}); };
const nstate = async id => { const P = PL(); if (!P || !ALIAS[id]) return null; try { const r = await P.permState({ name: ALIAS[id] }); return r.state === 'granted' ? 'granted' : (r.state === 'denied' ? 'denied' : 'prompt'); } catch (e) { return null; } };
const nask = async id => { const P = PL(); if (!P) return false; const before = await nstate(id); const r = await P.permAsk({ name: ALIAS[id] }); if (r.state === 'granted') return true; if (before === 'denied') { try { await P.openAppSettings(); } catch (e) {} } throw new Error('denied'); };
/* inside the Android app the WebView's own permissions.query is not reliable, so 'denied' there is only a hint */
const qn = async name => { const r = await q(name); return isNat() && (r === 'denied' || r === null) ? 'prompt' : r; };
const q = async name => { try { return (await navigator.permissions.query({ name })).state; } catch (e) { return null; } };
const media = async (c) => { const s = await navigator.mediaDevices.getUserMedia(c); stopStream(s); };

/* each entry: supported(), state() -> granted|denied|prompt|ask|unsupported, request() */
const API = {
  storage: {
    supported: () => !!(navigator.storage && navigator.storage.persist),
    state: async () => (await nstate('storage')) || ((await navigator.storage.persisted()) ? 'granted' : ((await q('persistent-storage')) === 'denied' ? 'denied' : 'prompt')),
    request: async () => { if (PL()) { await nask('storage'); try { await navigator.storage.persist(); } catch (e) {} return; } await navigator.storage.persist(); }
  },
  notifications: {
    supported: () => 'Notification' in window || !!NAT('LocalNotifications'),
    state: async () => { const ln = NAT('LocalNotifications'); if (ln) { try { const r = await ln.checkPermissions(); return r.display === 'granted' ? 'granted' : r.display === 'denied' ? 'denied' : 'prompt'; } catch (e) {} } return ({ granted: 'granted', denied: 'denied', default: 'prompt' })[Notification.permission] || 'prompt'; },
    request: async () => { const ln = NAT('LocalNotifications'); if (ln) { const r = await ln.requestPermissions(); if (r.display !== 'granted') throw new Error('denied'); return; } await Notification.requestPermission(); }
  },
  camera: {
    supported: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    state: async () => (await nstate('camera')) || (await qn('camera')) || 'ask', request: async () => { if (PL()) await nask('camera'); await media({ video: true }); }
  },
  microphone: {
    supported: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    state: async () => (await nstate('microphone')) || (await qn('microphone')) || 'ask', request: async () => { if (PL()) await nask('microphone'); await media({ audio: true }); }
  },
  location: {
    supported: () => !!navigator.geolocation,
    state: async () => (await nstate('location')) || (await qn('geolocation')) || 'ask',
    request: async () => { if (PL()) await nask('location'); return new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 15000, maximumAge: 600000 })); }
  },
  contacts: {
    supported: () => !!(PL() || (navigator.contacts && navigator.contacts.select)),
    state: async () => (await nstate('contacts')) || 'ask',
    request: async (st) => {
      const P = PL();
      if (P) {
        if (st !== 'granted') { await nask('contacts'); return 'asked'; }
        const r = await P.pickContact(); if (!r || r.cancelled) return;
        const v = r.phone || r.name || ''; try { await P.copyText({ value: v }); } catch (e) {}
        MSA.toast(t('perm.picked', { v: (r.name ? r.name + ' · ' : '') + (r.phone || '') })); return;
      }
      const r = await navigator.contacts.select(['name', 'tel', 'email'], { multiple: false }); if (!r || !r[0]) return;
      const c = r[0], v = (c.tel && c.tel[0]) || (c.email && c.email[0]) || (c.name && c.name[0]) || '';
      try { await navigator.clipboard.writeText(v); } catch (e) {}
      MSA.toast(t('perm.picked', { v: v }));
    }
  },
  clipboard: {
    supported: () => !!(NAT('Clipboard') || (navigator.clipboard && navigator.clipboard.readText)),
    state: async () => isNat() ? 'granted' : ((await q('clipboard-read')) || 'ask'),
    request: async () => { await navigator.clipboard.readText(); }
  }
};

MSA.permsHTML = function(){
  return '<div class="sec" id="permSec"><h4>' + I('shield', 'sm') + U.esc(t('s.perms')) + '</h4><div class="hint" style="margin-bottom:10px">' + U.esc(t('perm.hint')) + '</div>' +
    LIST.map(([id, ic]) => '<div class="perm" data-perm="' + id + '"><div class="perm-ic">' + I(ic, 'sm') + '</div><div class="grow" style="min-width:0"><div class="perm-n">' + U.esc(t('perm.' + id)) +
      '</div><div class="hint">' + U.esc(t('perm.' + id + '.d')) + '</div><div class="hint perm-x"></div></div>' +
      '<div class="perm-r"><span class="pbadge">…</span><button class="btn sm" data-perm-go hidden></button></div></div>').join('') +
    '<div class="hint" style="margin-top:8px">' + U.esc(t('perm.note')) + '</div></div>';
};

MSA.wirePerms = function(root){
  const sec = $('#permSec', root); if (!sec) return;
  const paint = async id => {
    const row = $('[data-perm="' + id + '"]', sec); if (!row) return; const a = API[id];
    let st = 'unsupported'; try { if (a.supported()) st = await a.state(); } catch (e) { st = 'ask'; }
    if ((st === 'ask' || st === 'prompt') && !PL() && okMem()[id]) st = 'granted';   // remembered after a successful request
    row.dataset.st = st;
    const badge = $('.pbadge', row), btn = $('[data-perm-go]', row), x = $('.perm-x', row);
    badge.className = 'pbadge ' + st; badge.textContent = (st === 'prompt' || st === 'ask') ? '' : t('perm.' + st); badge.hidden = !badge.textContent;
    x.textContent = ''; btn.hidden = st === 'unsupported' || (st === 'denied' && !isNat()) || (st === 'granted' && id !== 'contacts') || (id === 'clipboard' && isNat());
    btn.textContent = (id === 'contacts' && st === 'granted') ? t('perm.pick') : t('perm.allow');
    if (st === 'denied') x.textContent = t('perm.blockedHelp');
    if (id === 'clipboard' && isNat()) x.textContent = t('perm.clipNote');
    if (id === 'storage' && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(e => { if (e.usage != null && e.quota) x.textContent = t('perm.storageInfo', { u: U.size(e.usage), q: U.size(e.quota) }); }).catch(() => {});
    }
  };
  const all = () => LIST.forEach(([id]) => paint(id));
  sec.addEventListener('click', async e => {
    const b = e.target.closest('[data-perm-go]'); if (!b) return; const id = b.closest('[data-perm]').dataset.perm;
    b.disabled = true;
    try { const st0 = b.closest('[data-perm]').dataset.st; const rr = await API[id].request(st0); okMem()[id] = true; MSA.save(); if (id !== 'contacts' || rr === 'asked') MSA.toast(t('perm.testOk'), 'ok'); }
    catch (err) { if (!(err && err.name === 'AbortError')) { MSA.toast(t('perm.testFail'), 'err'); const xx = $('.perm-x', b.closest('[data-perm]')); if (xx && isNat()) { b.disabled = false; await paint(id); xx.textContent = t('perm.sysHelp') + (err && (err.name || err.message) ? ' (' + (err.name || err.message) + ')' : ''); return; } } }
    b.disabled = false; paint(id);
  });
  all();
  /* live updates when the user changes a permission in the browser UI */
  [['camera', 'camera'], ['microphone', 'microphone'], ['geolocation', 'location'], ['clipboard-read', 'clipboard']].forEach(([n, id]) => {
    try { navigator.permissions.query({ name: n }).then(r => { r.onchange = () => paint(id); }).catch(() => {}); } catch (e) {}
  });
};
})();

