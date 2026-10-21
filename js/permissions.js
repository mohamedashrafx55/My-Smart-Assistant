/* Permissions centre (Settings): shows the real state of each device permission and lets you grant it */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const t = (k, v) => MSA.t(k, v);
Object.assign(MSA.dict.en, {
  's.perms': 'Permissions', 'perm.hint': 'Allow only what you need. Everything stays on your device — nothing is uploaded.',
  'perm.granted': 'Allowed', 'perm.denied': 'Blocked', 'perm.prompt': 'Not asked yet', 'perm.ask': 'On request', 'perm.unsupported': 'Not available here',
  'perm.allow': 'Allow', 'perm.recheck': 'Refresh', 'perm.blockedHelp': 'Blocked — enable it from the app / browser site settings, then press Refresh.',
  'perm.storage': 'Internal storage', 'perm.storage.d': 'Keeps your projects, files and notes safe from being cleared automatically, and lets you pick files from the device.',
  'perm.notifications': 'Notifications', 'perm.notifications.d': 'Task reminders and deadlines.',
  'perm.camera': 'Camera', 'perm.camera.d': 'Capture photos and videos straight into a project step or a task.',
  'perm.microphone': 'Microphone', 'perm.microphone.d': 'Record voice notes and audio for your steps and tasks.',
  'perm.location': 'Location', 'perm.location.d': 'Tag a shoot location or meeting place on a task.',
  'perm.contacts': 'Contacts', 'perm.contacts.d': 'Pick a client from your contacts to copy their phone or email.',
  'perm.clipboard': 'Clipboard', 'perm.clipboard.d': 'Paste video links quickly into the learning library.',
  'perm.testOk': 'Works', 'perm.testFail': 'Could not get access', 'perm.picked': 'Copied: {v}', 'perm.pick': 'Pick contact',
  'perm.storageInfo': '{u} used of {q}', 'perm.note': 'On Android the app asks the system for these when the APK is built; the contacts picker needs Chrome on Android.'
});
Object.assign(MSA.dict.ar, {
  's.perms': 'الأذونات', 'perm.hint': 'اسمح فقط بما تحتاجه. كل شيء يبقى على جهازك ولا يُرفع لأي مكان.',
  'perm.granted': 'مسموح', 'perm.denied': 'محظور', 'perm.prompt': 'لم يُطلب بعد', 'perm.ask': 'عند الطلب', 'perm.unsupported': 'غير متاح هنا',
  'perm.allow': 'سماح', 'perm.recheck': 'تحديث', 'perm.blockedHelp': 'محظور — فعّله من إعدادات الموقع / التطبيق في الجهاز ثم اضغط تحديث.',
  'perm.storage': 'مساحة التخزين الداخلية', 'perm.storage.d': 'تحمي مشاريعك وملفاتك وملاحظاتك من المسح التلقائي، وتتيح اختيار الملفات من الجهاز.',
  'perm.notifications': 'الإشعارات', 'perm.notifications.d': 'تنبيهات المهام والمواعيد النهائية.',
  'perm.camera': 'الكاميرا', 'perm.camera.d': 'التقاط صور وفيديو مباشرة داخل خطوة في مشروع أو مهمة.',
  'perm.microphone': 'الميكروفون', 'perm.microphone.d': 'تسجيل ملاحظات صوتية وملفات صوت لخطواتك ومهامك.',
  'perm.location': 'الموقع', 'perm.location.d': 'تحديد مكان التصوير أو الاجتماع في المهمة.',
  'perm.contacts': 'جهات الاتصال', 'perm.contacts.d': 'اختيار عميل من جهات الاتصال لنسخ رقمه أو إيميله.',
  'perm.clipboard': 'الحافظة', 'perm.clipboard.d': 'لصق روابط الفيديو بسرعة في مكتبة التعليم.',
  'perm.testOk': 'يعمل', 'perm.testFail': 'تعذّر الحصول على الإذن', 'perm.picked': 'تم النسخ: {v}', 'perm.pick': 'اختيار جهة اتصال',
  'perm.storageInfo': 'مستخدم {u} من {q}', 'perm.note': 'على أندرويد يطلب التطبيق هذه الأذونات من النظام عند بناء الـ APK، واختيار جهات الاتصال يحتاج Chrome على أندرويد.'
});

const LIST = [
  ['storage', 'folder'], ['notifications', 'bell'], ['camera', 'video'], ['microphone', 'music'], ['location', 'pinmap'], ['contacts', 'user'], ['clipboard', 'clip']
];
const stopStream = s => { try { s.getTracks().forEach(x => x.stop()); } catch (e) {} };
const q = async name => { try { return (await navigator.permissions.query({ name })).state; } catch (e) { return null; } };
const media = async (c) => { const s = await navigator.mediaDevices.getUserMedia(c); stopStream(s); };

/* each entry: supported(), state() -> granted|denied|prompt|ask|unsupported, request() */
const API = {
  storage: {
    supported: () => !!(navigator.storage && navigator.storage.persist),
    state: async () => (await navigator.storage.persisted()) ? 'granted' : ((await q('persistent-storage')) === 'denied' ? 'denied' : 'prompt'),
    request: async () => { await navigator.storage.persist(); }
  },
  notifications: {
    supported: () => 'Notification' in window,
    state: async () => ({ granted: 'granted', denied: 'denied', default: 'prompt' })[Notification.permission] || 'prompt',
    request: async () => { await Notification.requestPermission(); }
  },
  camera: {
    supported: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    state: async () => (await q('camera')) || 'ask', request: () => media({ video: true })
  },
  microphone: {
    supported: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    state: async () => (await q('microphone')) || 'ask', request: () => media({ audio: true })
  },
  location: {
    supported: () => !!navigator.geolocation,
    state: async () => (await q('geolocation')) || 'ask',
    request: () => new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 15000, maximumAge: 600000 }))
  },
  contacts: {
    supported: () => !!(navigator.contacts && navigator.contacts.select),
    state: async () => 'ask',
    request: async () => {
      const r = await navigator.contacts.select(['name', 'tel', 'email'], { multiple: false }); if (!r || !r[0]) return;
      const c = r[0], v = (c.tel && c.tel[0]) || (c.email && c.email[0]) || (c.name && c.name[0]) || '';
      try { await navigator.clipboard.writeText(v); } catch (e) {}
      MSA.toast(t('perm.picked', { v: v }));
    }
  },
  clipboard: {
    supported: () => !!(navigator.clipboard && navigator.clipboard.readText),
    state: async () => (await q('clipboard-read')) || 'ask', request: async () => { await navigator.clipboard.readText(); }
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
    const badge = $('.pbadge', row), btn = $('[data-perm-go]', row), x = $('.perm-x', row);
    badge.className = 'pbadge ' + st; badge.textContent = t('perm.' + st);
    x.textContent = ''; btn.hidden = st === 'unsupported' || st === 'denied' || (st === 'granted' && id !== 'contacts');
    btn.textContent = id === 'contacts' ? t('perm.pick') : t('perm.allow');
    if (st === 'denied') x.textContent = t('perm.blockedHelp');
    if (id === 'storage' && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(e => { if (e.usage != null && e.quota) x.textContent = t('perm.storageInfo', { u: U.size(e.usage), q: U.size(e.quota) }); }).catch(() => {});
    }
  };
  const all = () => LIST.forEach(([id]) => paint(id));
  sec.addEventListener('click', async e => {
    const b = e.target.closest('[data-perm-go]'); if (!b) return; const id = b.closest('[data-perm]').dataset.perm;
    b.disabled = true;
    try { await API[id].request(); if (id !== 'contacts') MSA.toast(t('perm.testOk'), 'ok'); }
    catch (err) { if (!(err && err.name === 'AbortError')) MSA.toast(t('perm.testFail'), 'err'); }
    b.disabled = false; paint(id);
  });
  all();
  /* live updates when the user changes a permission in the browser UI */
  [['camera', 'camera'], ['microphone', 'microphone'], ['geolocation', 'location'], ['clipboard-read', 'clipboard']].forEach(([n, id]) => {
    try { navigator.permissions.query({ name: n }).then(r => { r.onchange = () => paint(id); }).catch(() => {}); } catch (e) {}
  });
};
})();

