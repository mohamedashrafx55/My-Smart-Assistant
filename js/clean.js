/* Clean-up of old project data, tasks and notes: a one-time question after this update + a button in Settings → Data.
   Nothing is deleted without a confirmation; the user can save a backup first. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$;
const T = (a, e) => MSA.T(a, e), esc = U.esc, S = () => MSA.state;
const FLAG = 'msa_clean_v1';
const DEMO_FOLDERS = ['قهوة وكافيهات', 'ألوان وخطوط', 'تغليف ومطبوعات'];

/* every attachment ({id,name,mime,size,kind}) anywhere inside an object */
function attIds(o, out){
  out = out || new Set();
  if (Array.isArray(o)) o.forEach(x => attIds(x, out));
  else if (o && typeof o === 'object') {
    if (typeof o.id === 'string' && 'mime' in o && 'name' in o && 'size' in o) out.add(o.id);
    Object.keys(o).forEach(k => attIds(o[k], out));
  }
  return out;
}
function scan(){
  const s = S(), tasks = (s.tasks || []).filter(x => x.type !== 'note').length, notes = (s.tasks || []).filter(x => x.type === 'note').length;
  return { projects: (s.projects || []).length, tasks, notes, any: !!((s.projects || []).length || (s.tasks || []).length) };
}
async function wipe(){
  const s = S(), ids = attIds(s.projects); attIds(s.tasks, ids);
  /* the sample reference library that came with the demo project */
  const demoF = (s.refFolders || []).filter(f => DEMO_FOLDERS.includes(f.name)).map(f => f.id);
  const demoR = (s.refs || []).filter(r => demoF.includes(r.folder));
  demoR.forEach(r => { if (r.att) ids.add(r.att.id); });
  for (const id of ids) { try { await MSA.files.del(id); } catch (e) {} }
  s.projects = []; s.tasks = [];
  if (demoF.length) { s.refFolders = s.refFolders.filter(f => !demoF.includes(f.id)); s.refs = s.refs.filter(r => !demoF.includes(r.folder)); }
  if (s.clients && s.clients.rows) s.clients.rows = s.clients.rows.filter(r => !/تدريبي/.test(JSON.stringify(r)));
  s.ui = s.ui || {}; s.ui.project = null; s.ui.doneOpen = null; s.ui.ptab = null;
  try { MSA.proj && MSA.proj.mapReset && MSA.proj.mapReset(); } catch (e) {}
  MSA.saveNow(); MSA.updateCounts && MSA.updateCounts();
  MSA.go('home'); MSA.rerender && MSA.rerender();
}
async function saveBackup(){
  const blob = new Blob([await MSA.exportAll()], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-smart-assistant-backup-before-clean-' + U.dateKey(new Date()) + '.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000);
}
const mark = v => { try { localStorage.setItem(FLAG, v); } catch (e) {} };
function ask(){
  return new Promise(res => {
    const c = scan(); let fin = false; const done = v => { if (!fin) { fin = true; res(v); } };
    const m = MSA.modal({ title: T('تنظيف البيانات القديمة', 'Clean old data'), static: true, footer: false, onClose: () => done('keep'),
      body: '<div style="line-height:1.8;margin-bottom:12px">' + esc(T('هتتمسح نهائيًا من الجهاز ده: ' + c.projects + ' مشروع (بكل ملفاته وصوره)، و' + c.tasks + ' مهمة، و' + c.notes + ' ملاحظة. الإعدادات والعملاء والحسابات والتعليم مش هتتأثر.', 'This permanently deletes from this device: ' + c.projects + ' project(s) with all their files, ' + c.tasks + ' task(s) and ' + c.notes + ' note(s). Settings, clients, accounts and learning are untouched.')) +
        (MSA.sync && MSA.sync.info().linked ? '<br><b>' + esc(T('الجهاز مربوط بالمزامنة، فالمسح هيتنقل لباقي أجهزتك.', 'This device is linked to sync, so the deletion will reach your other devices.')) + '</b>' : '') + '</div>' +
        '<div class="col" style="gap:8px"><button class="btn primary" data-a="bk">' + I('download', 'sm') + esc(T('احفظ نسخة احتياطية ثم امسح (موصى به)', 'Save a backup, then delete (recommended)')) + '</button>' +
        '<button class="btn danger" data-a="del">' + I('trash', 'sm') + esc(T('امسح الآن', 'Delete now')) + '</button>' +
        '<button class="btn ghost" data-a="keep">' + esc(T('إبقاء كل حاجة', 'Keep everything')) + '</button></div>' });
    m.el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { done(b.dataset.a); m.close(); });
  });
}
async function run(){
  const c = scan(); if (!c.any) { MSA.toast(T('مفيش بيانات للمسح', 'Nothing to clean'), 'info'); return false; }
  const v = await ask(); if (v === 'keep') return false;
  try { if (v === 'bk') await saveBackup(); } catch (e) { MSA.toast(T('تعذّر حفظ النسخة — اتلغى المسح', 'Could not save the backup — cleaning cancelled'), 'err'); return false; }
  await wipe(); mark('done'); MSA.toast(T('اتنضّفت البيانات القديمة ✓', 'Old data cleaned ✓'), 'ok'); return true;
}
MSA.clean = { run, scan, wipe };

/* one-time question after the update (never on a fresh install, never twice) */
function once(){
  let f = null; try { f = localStorage.getItem(FLAG); } catch (e) {}
  if (f) return;
  if (!scan().any) { mark('fresh'); return; }
  let tries = 0;
  const t = setInterval(async () => {
    if (++tries > 90) { clearInterval(t); return; }
    if (document.getElementById('lock') || document.getElementById('splash') || document.querySelector('#overlayRoot .overlay')) return;
    clearInterval(t);
    const v = await run(); if (!v) mark('kept');
  }, 1500);
}
setTimeout(once, 3000);
})();
