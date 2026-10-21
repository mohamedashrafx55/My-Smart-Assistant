/* Global search (Ctrl/⌘ K), weekly backup reminder / auto-save, settings section and home shortcuts. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$, P = MSA.proj;
const S = () => MSA.state, esc = U.esc, T = (a, e) => MSA.T(a, e);
const plus = MSA.plus = MSA.plus || {};
const today = () => U.dateKey(new Date());
const DAY = 864e5;

/* =====================================================================
   GLOBAL SEARCH
   ===================================================================== */
const norm = s => String(s == null ? '' : s).toLowerCase()
  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
const KIND_ICON = { image: 'image', video: 'video', audio: 'music', doc: 'doc' };
const plain = h => { try { return U.stripHtml(h || ''); } catch (e) { return ''; } };
function buildIndex(){
  const items = [];
  const add = o => { o.hay = norm(o.title + ' ' + (o.sub || '') + ' ' + (o.extra || '')); o.tn = norm(o.title); items.push(o); };
  const ps = S().projects;
  ps.forEach(p => {
    const cl = MSA.clients.of(p), id = p.identity || {};
    add({ g: 'project', icon: p.status === 'done' ? 'trophy' : 'briefcase', title: p.name, sub: [p.brand, cl, p.status === 'done' ? T('مكتمل', 'Done') : T('قيد التنفيذ', 'In progress')].filter(Boolean).join(' · '), extra: [(id.notes || []).join(' '), (id.colors || []).join(' '), (id.fonts || []).map(f => f.h + ' ' + f.ah).join(' ')].join(' '), go: () => plus.openProject(p, 'plan') });
    P.walk(p.steps, s => {
      const ti = P.title(s);
      add({ g: 'step', icon: 'layers', title: ti, sub: p.name, extra: s.note || '', go: () => plus.openProject(p, 'plan') });
      (s.atts || []).forEach(a => add({ g: 'file', icon: KIND_ICON[a.kind] || 'file', title: a.name || 'file', sub: p.name + ' › ' + ti, go: () => MSA.openAtt(a, [a]) }));
    });
  });
  MSA.clients.data().rows.forEach(r => {
    const c = r.c; if (!c.name && !c.company) return;
    add({ g: 'client', icon: 'user', title: c.name || c.company, sub: [c.company && c.name ? c.company : '', c.phone || c.wa || '', c.email || ''].filter(Boolean).join(' · '), extra: Object.keys(c).map(k => c[k]).join(' '), go: () => { MSA.clients.data().q = c.name || c.company; MSA.save(); MSA.go('clients'); } });
  });
  S().tasks.forEach(x => {
    add({ g: x.type === 'note' ? 'note' : 'task', icon: x.type === 'note' ? 'note' : (x.status === 'done' ? 'check-c' : 'checks'), title: x.title || T('(بدون عنوان)', '(untitled)'), sub: (x.tags || []).join(' · '), extra: plain(x.desc) + ' ' + (x.checklist || []).map(c => c.text || c.title || '').join(' '), go: () => { MSA.go('tasks'); setTimeout(() => MSA.openTaskEditor && MSA.openTaskEditor(x), 60); } });
    (x.atts || []).forEach(a => add({ g: 'file', icon: KIND_ICON[a.kind] || 'file', title: a.name || 'file', sub: x.title || '', go: () => MSA.openAtt(a, [a]) }));
  });
  (S().learning.videos || []).forEach(v => add({ g: 'video', icon: 'video', title: v.title || v.url, sub: v.url || '', extra: v.note || '', go: () => { S().ui.learnFolder = v.folder || null; S().ui.ltab = 'videos'; MSA.save(); MSA.go('learn'); } }));
  (S().refs || []).forEach(r => {
    add({ g: 'ref', icon: r.att ? 'image' : 'link', title: r.title || (r.att && r.att.name) || r.url || 'ref', sub: (r.tags || []).join(' · ') || r.url || '', extra: (r.note || '') + ' ' + (r.url || ''), go: () => { S().ui.ltab = 'refs'; MSA.save(); MSA.go('learn'); } });
    if (r.att) add({ g: 'file', icon: 'image', title: r.att.name || 'image', sub: T('المراجع', 'References'), go: () => MSA.openAtt(r.att, [r.att]) });
  });
  return items;
}
const GROUPS = () => [['project', T('المشاريع', 'Projects')], ['client', T('العملاء', 'Clients')], ['task', T('المهام', 'Tasks')], ['note', T('الملاحظات', 'Notes')], ['step', T('مراحل الخطط', 'Plan stages')], ['file', T('الملفات والمرفقات', 'Files & attachments')], ['video', T('فيديوهات التعلم', 'Learning videos')], ['ref', T('المراجع', 'References')]];
plus.search = function(q){
  const toks = norm(q).split(/\s+/).filter(Boolean); if (!toks.length) return [];
  const out = []; buildIndex().forEach(it => { if (toks.every(t => it.hay.includes(t))) { it.score = toks.every(t => it.tn.startsWith(t) || it.tn.includes(' ' + t)) ? 3 : (toks.every(t => it.tn.includes(t)) ? 2 : 1); out.push(it); } });
  return out;
};
let srOpen = null;
plus.openSearch = function(initial){
  if (srOpen && !srOpen.closed && srOpen.el.isConnected) { const i = $('#srQ', srOpen.el); i && i.focus(); return; }
  const lock = document.getElementById('lock'); if (lock) return;
  let sel = 0, flat = [], more = new Set();
  const m = srOpen = MSA.modal({
    title: T('بحث شامل', 'Search everything'), size: 'wide',
    body: '<div class="sr-bar">' + I('search', 'sm') + '<input id="srQ" type="search" dir="auto" autocomplete="off" placeholder="' + esc(T('ابحث في المشاريع والعملاء والمهام والملفات والملاحظات…', 'Search projects, clients, tasks, files, notes…')) + '"></div><div id="srOut" class="sr-out"></div>',
    footer: false,
    onMount: el => {
      const inp = $('#srQ', el), out = $('#srOut', el);
      const idle = () => {
        const o = plus.outstanding && plus.outstanding();
        out.innerHTML = '<div class="hint" style="margin:6px 2px 10px">' + esc(T('اكتب أي كلمة — اسم عميل، اسم ملف، جزء من ملاحظة… ويظهر لك كل مكان موجودة فيه.', 'Type anything — a client, a file name, part of a note… and see everywhere it appears.')) + '</div><div class="pchips">' +
          '<button class="pchip" data-q="money">' + I('check-c', 'xs') + ' ' + esc(T('المستحقات', 'Payments')) + (o && o.n ? ' (' + o.n + ')' : '') + '</button><button class="pchip" data-q="clients">' + I('user', 'xs') + ' ' + esc(T('العملاء', 'Clients')) + '</button><button class="pchip" data-q="tasks">' + I('checks', 'xs') + ' ' + esc(T('المهام', 'Tasks')) + '</button><button class="pchip" data-q="backup">' + I('download', 'xs') + ' ' + esc(T('نسخة احتياطية الآن', 'Back up now')) + '</button></div>';
        flat = [];
      };
      const draw = () => {
        const q = inp.value.trim(); if (!q) { idle(); return; }
        const res = plus.search(q); flat = []; let html = '';
        if (!res.length) { out.innerHTML = '<div class="sr-none">' + esc(T('لا نتائج لـ «' + q + '»', 'No results for “' + q + '”')) + '</div>'; return; }
        GROUPS().forEach(([g, lbl]) => {
          const list = res.filter(x => x.g === g).sort((a, b) => b.score - a.score); if (!list.length) return;
          const lim = more.has(g) ? 60 : 6, shown = list.slice(0, lim);
          html += '<div class="sr-g"><span>' + esc(lbl) + '</span><i>' + list.length + '</i></div>' + shown.map(it => { flat.push(it); return '<button class="sr-it" data-i="' + (flat.length - 1) + '">' + I(it.icon, 'sm') + '<span class="sr-t"><b dir="auto">' + esc(it.title) + '</b>' + (it.sub ? '<em dir="auto">' + esc(it.sub) + '</em>' : '') + '</span></button>'; }).join('') + (list.length > lim ? '<button class="sr-more" data-more="' + g + '">' + esc(T('عرض ' + (list.length - lim) + ' نتيجة أخرى', 'Show ' + (list.length - lim) + ' more')) + '</button>' : '');
        });
        out.innerHTML = html; sel = Math.min(sel, flat.length - 1); mark();
      };
      const mark = () => { $$('.sr-it', out).forEach((b, i) => b.classList.toggle('on', i === sel)); const on = $('.sr-it.on', out); on && on.scrollIntoView({ block: 'nearest' }); };
      const run = it => { m.close(); setTimeout(() => { try { it.go(); } catch (e) { console.warn('search go', e); } }, 30); };
      let tm; inp.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { sel = 0; more.clear(); draw(); }, 120); });
      inp.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(flat.length - 1, sel + 1); mark(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
        else if (e.key === 'Enter') { e.preventDefault(); if (flat[sel]) run(flat[sel]); }
      });
      out.addEventListener('click', e => {
        const b = e.target.closest('[data-i]'); if (b) { run(flat[+b.dataset.i]); return; }
        const mo = e.target.closest('[data-more]'); if (mo) { more.add(mo.dataset.more); draw(); return; }
        const qk = e.target.closest('[data-q]'); if (qk) { m.close(); const k = qk.dataset.q; setTimeout(() => { if (k === 'money') MSA.go('money'); else if (k === 'clients') MSA.go('clients'); else if (k === 'tasks') MSA.go('tasks'); else if (k === 'backup') plus.backupNow(true); }, 30); }
      });
      if (initial) inp.value = initial; draw(); setTimeout(() => inp.focus(), 40);
    },
    onClose: () => { srOpen = null; }
  });
};
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) { e.preventDefault(); plus.openSearch(); }
});

/* =====================================================================
   BACKUP: reminder every N days, silent save on the phone app, one-click save elsewhere
   ===================================================================== */
const bk = () => { const s = S().settings; if (!s.backup) s.backup = { on: false, days: 7, last: 0, snooze: 0, where: '', manual: 1, maxMB: 100 }; const b = s.backup;
  if (!b.manual) { b.manual = 1; b.on = false; MSA.save(); }   /* v19: no automatic backups any more — only when the user asks (the reminder is optional and off by default) */
  if (!(b.maxMB > 0)) b.maxMB = 100; if (!b.last) { b.last = Date.now(); MSA.save(); } b.days = b.days > 0 ? b.days : 7; return b; };
const light = () => { const mb = bk().maxMB; return { maxFile: mb * 1048576, maxTotal: Math.max(300, mb * 2) * 1048576 }; };
const bkName = () => 'my-smart-assistant-backup-' + today() + '.json';
plus.backupInfo = () => { const b = bk(); return { last: b.last, days: b.days, due: b.on && Date.now() - b.last >= b.days * DAY }; };
async function pruneNative(FS){
  try {
    const r = await FS.readdir({ path: 'MySmartAssistant', directory: 'DOCUMENTS' });
    const files = (r.files || []).map(f => f.name || f).filter(n => /^my-smart-assistant-backup-.*\.json$/.test(n)).sort();
    for (const n of files.slice(0, Math.max(0, files.length - 4))) { try { await FS.deleteFile({ path: 'MySmartAssistant/' + n, directory: 'DOCUMENTS' }); } catch (e) {} }
  } catch (e) {}
}
/* returns where the backup went, or '' when the user cancelled */
async function writeBackup(){
  const json = await MSA.exportAll(light()), name = bkName();
  const FS = MSA.native && MSA.native('Filesystem'), SH = MSA.native && MSA.native('Share');
  if (FS) {
    try { await FS.writeFile({ path: 'MySmartAssistant/' + name, data: json, directory: 'DOCUMENTS', encoding: 'utf8', recursive: true }); pruneNative(FS); return T('مجلد المستندات / MySmartAssistant', 'Documents / MySmartAssistant'); } catch (e) {}
    if (SH) { try { const r = await FS.writeFile({ path: name, data: json, directory: 'CACHE', encoding: 'utf8' }); await SH.share({ title: name, url: r.uri, dialogTitle: name }); return T('عبر قائمة المشاركة', 'via the share sheet'); } catch (e) { if (e && /cancel/i.test(String(e.message || e))) return ''; } }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  return T('مجلد التنزيلات', 'Downloads folder');
}
plus.backupNow = async function(announce){
  try {
    const where = await writeBackup(); if (!where) return false;
    const b = bk(); b.last = Date.now(); b.snooze = 0; b.where = where; MSA.save(); hideBanner();
    const sk = MSA.lastExportSkipped | 0;
    MSA.toast(T('تم حفظ النسخة الاحتياطية — ' + where + (sk ? ' (بدون ' + sk + ' ملف كبير)' : ''), 'Backup saved — ' + where + (sk ? ' (' + sk + ' large file(s) left out)' : '')), 'ok', sk ? 7000 : 5000);
    if (MSA.view === 'settings' && MSA.refreshSettings) MSA.refreshSettings();
    return true;
  } catch (e) { console.error('backup', e); MSA.toast(T('تعذر حفظ النسخة الاحتياطية', 'Could not save the backup'), 'err'); return false; }
};
function hideBanner(){ const b = document.getElementById('bkBanner'); if (b) b.remove(); }
function showBanner(){
  if (document.getElementById('bkBanner') || document.getElementById('lock') || document.getElementById('splash')) return;
  const b = bk(), days = Math.floor((Date.now() - b.last) / DAY), el = document.createElement('div'); el.id = 'bkBanner'; el.className = 'bk-banner'; el.setAttribute('role', 'alert');
  el.innerHTML = '<span class="bk-ic">' + I('shield', 'sm') + '</span><div class="bk-t"><b>' + esc(T('وقت النسخة الاحتياطية الأسبوعية', 'Time for your backup')) + '</b><span>' + esc(T('آخر نسخة من ' + days + ' يومًا. شغلك محفوظ على جهازك فقط — احفظ نسخة تأمين.', 'Last backup was ' + days + ' day(s) ago. Your work lives on this device only — save a safety copy.')) + '</span></div><button class="btn sm primary" data-bk="now">' + I('download', 'sm') + esc(T('احفظ الآن', 'Save now')) + '</button><button class="btn sm ghost" data-bk="later">' + esc(T('لاحقًا', 'Later')) + '</button>';
  el.onclick = async e => { const x = e.target.closest('[data-bk]'); if (!x) return; if (x.dataset.bk === 'later') { b.snooze = Date.now() + DAY; MSA.save(); hideBanner(); } else { x.disabled = true; const ok = await plus.backupNow(); if (!ok) x.disabled = false; } };
  document.body.appendChild(el);
}
async function backupTick(){
  const b = bk(); if (!b.on || document.getElementById('lock')) return;
  if (Date.now() - b.last < b.days * DAY) { hideBanner(); return; }
  if (b.snooze && Date.now() < b.snooze) return;
  showBanner();
}
plus.backupTick = backupTick;
/* a manual export counts as a backup too */
const _exp = MSA.exportAll;
MSA.exportAll = async function(){ const r = await _exp.apply(this, arguments); const b = bk(); b.last = Date.now(); b.snooze = 0; MSA.save(); hideBanner(); return r; };
setTimeout(backupTick, 6000); setInterval(backupTick, 20 * 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(backupTick, 1500); });

/* ---------- settings section ---------- */
MSA.plusHTML = function(){
  const s = S().settings, b = bk();
  const last = b.last ? MSA.fmtDate(b.last, true) : '—';
  return '<div class="sec" id="plusSec"><h4>' + I('bell', 'sm') + esc(T('تذكير النسخ ومتابعة العملاء', 'Auto backup & client follow-ups')) + '</h4>' +
    '<label class="row" style="margin-bottom:10px;cursor:pointer"><input type="checkbox" class="cb" id="bkOn" ' + (b.on ? 'checked' : '') + '><span>' + esc(T('ذكّرني بنسخة احتياطية (أنت اللي توافق — مفيش حفظ تلقائي)', 'Remind me to back up (I always confirm — nothing is saved on its own)')) + '</span></label>' +
    '<div class="row" style="margin-bottom:8px"><label class="f" style="margin:0">' + esc(T('كل', 'Every')) + '</label><select id="bkDays" style="width:auto">' + [[1, T('يوم', 'day')], [3, T('3 أيام', '3 days')], [7, T('أسبوع', 'week')], [14, T('أسبوعين', '2 weeks')], [30, T('شهر', 'month')]].map(x => '<option value="' + x[0] + '"' + (b.days === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>').join('') + '</select><button class="btn sm primary" id="bkNow">' + I('download', 'sm') + esc(T('احفظ نسخة الآن', 'Back up now')) + '</button></div>' +
    '<div class="hint">' + esc(T('آخر نسخة: ', 'Last backup: ')) + '<b>' + esc(last) + '</b>' + (b.where ? ' · ' + esc(b.where) : '') + '</div>' +
    '<div class="row" style="margin-top:10px"><label class="f" style="margin:0">' + esc(T('أقصى حجم للملف الواحد في النسخة', 'Max size per file in the backup')) + '</label><select id="bkMax" style="width:auto">' + [15, 50, 100, 200, 400].map(x => '<option value="' + x + '"' + (b.maxMB === x ? ' selected' : '') + '>' + x + ' ' + esc(T('م.ب', 'MB')) + '</option>').join('') + '</select></div>' +
    '<div class="hint" style="margin-top:4px">' + esc(T('النسخة لا تُحفظ إلا عندما تضغط «احفظ نسخة الآن». الملفات الأكبر من الحد المختار تُترك خارج النسخة وتظهر لك رسالة بعددها. كل ما كبر الحد زادت الذاكرة المطلوبة، فلو الجهاز بطيء أو الموبايل ضعيف اختر حدًا أقل.', 'A copy is only saved when you press “Back up now”. Files larger than the chosen limit are left out and you are told how many. A higher limit needs more memory, so pick a lower one on slow devices or weak phones.')) + '</div>' +
    '<hr class="sep" style="margin:16px 0">' +
    '<label class="row" style="margin-bottom:10px;cursor:pointer"><input type="checkbox" class="cb" id="fuOn" ' + (s.followOn !== false ? 'checked' : '') + '><span>' + esc(T('مهمة متابعة تلقائية للعملاء', 'Automatic client follow-up tasks')) + '</span></label>' +
    '<div class="row"><label class="f" style="margin:0">' + esc(T('بعد', 'After')) + '</label><input type="number" id="fuDays" min="1" max="365" value="' + plus.followDays() + '" style="width:90px"><span class="hint">' + esc(T('يومًا من «آخر تواصل» في شيت العملاء', 'days from “Last contact” in the clients sheet')) + '</span></div></div>';
};
MSA.wirePlus = function(root, redraw){
  const b = bk(), s = S().settings;
  $('#bkOn', root).onchange = e => { b.on = e.target.checked; MSA.save(); if (!b.on) hideBanner(); };
  $('#bkDays', root).onchange = e => { b.days = parseInt(e.target.value, 10) || 7; MSA.save(); };
  $('#bkNow', root).onclick = () => plus.backupNow();
  $('#bkMax', root).onchange = e => { b.maxMB = parseInt(e.target.value, 10) || 100; MSA.save(); };
  $('#fuOn', root).onchange = e => { s.followOn = e.target.checked; MSA.save(); };
  $('#fuDays', root).onchange = e => { const v = Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 14)); s.followDays = v; e.target.value = v; MSA.save(); plus.checkFollow && plus.checkFollow(); };
};

/* =====================================================================
   HOME SHORTCUTS + TOP-BAR SEARCH BUTTON
   ===================================================================== */
const hv = MSA.views.home;
if (hv) {
  const hr = hv.render;
  hv.render = function(host){
    hr.apply(this, arguments);
    const head = $('.home-head', host); if (!head) return;
    const o = plus.outstanding ? plus.outstanding() : { n: 0, egp: 0, late: 0 };
    const strip = document.createElement('div'); strip.className = 'home-strip';
    strip.innerHTML = '<button class="hs-search" data-hs="search">' + I('search', 'sm') + '<span>' + esc(T('ابحث في كل شيء…', 'Search everything…')) + '</span><kbd>Ctrl K</kbd></button>' +
      '<button class="hs-money' + (o.late ? ' bad' : '') + '" data-hs="money">' + I('check-c', 'sm') + '<span>' + (o.n ? esc(T('مستحقات: ', 'Outstanding: ')) + '<b dir="ltr">' + plus.fmt0(o.egp) + '</b> ' + esc(T('ج.م', 'EGP')) + ' · ' + o.n : esc(T('المدفوعات', 'Payments'))) + '</span></button>';
    head.after(strip);
    strip.onclick = e => { const b = e.target.closest('[data-hs]'); if (!b) return; if (b.dataset.hs === 'search') plus.openSearch(); else MSA.go('money'); };
  };
}
function topBtn(){
  const tr = $('.top-right'), th = $('#btnTheme'); if (!tr || !th) return;
  let b = $('#btnSearch'); if (!b) { b = document.createElement('button'); b.id = 'btnSearch'; b.className = 'icon-btn'; tr.insertBefore(b, th); b.addEventListener('click', () => plus.openSearch()); }
  b.innerHTML = I('search'); b.title = T('بحث شامل (Ctrl K)', 'Search (Ctrl K)'); b.setAttribute('aria-label', T('بحث', 'Search'));
}
const _al = MSA.applyLang; if (_al) MSA.applyLang = function(){ const r = _al.apply(this, arguments); topBtn(); return r; };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', topBtn); else topBtn();
setTimeout(topBtn, 0);
})();
