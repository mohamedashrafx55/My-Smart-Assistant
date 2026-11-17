/* Quick task box: one input, understands "بكرة الساعة 3" etc. Opened from the FAB-less shortcut paths:
   Android widget / app-icon shortcut (msaquick://add), PWA shortcut (?add=1), keyboard Ctrl+Alt+N, and the home tile. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$;
const T = (a, e) => MSA.T(a, e), esc = U.esc, S = () => MSA.state;
const Q = MSA.quick = {};
const dk = n => { const d = new Date(); d.setDate(d.getDate() + n); return U.dateKey(d); };
let openNow = false;

Q.add = function(o){
  const title = String(o.title || '').trim(); if (!title) return null;
  const due = o.date ? o.date + 'T' + (o.time || '23:59') : '';
  const x = MSA.tasksApi.blank({ title: title.slice(0, 200), due, priority: o.high ? 'high' : 'normal', remind: due && o.time ? '0' : '' });
  S().tasks.unshift(x); MSA.save(); MSA.updateCounts && MSA.updateCounts();
  if (MSA.view === 'tasks' || MSA.view === 'home') MSA.rerender(true);
  return x;
};
Q.open = function(){
  if (openNow || document.getElementById('lock')) return; openNow = true;
  let date = '', time = '', manual = false, high = false, goFn = null;
  const NLP = window.VoiceNLP;
  const m = MSA.modal({
    title: T('مهمة سريعة', 'Quick task'), size: 'sm',
    body: '<div class="field"><input id="qkT" dir="auto" autocomplete="off" placeholder="' + esc(T('اكتب المهمة… مثال: اتصل بالعميل بكرة الساعة 3', 'Type a task… e.g. call the client tomorrow at 3')) + '" style="font-size:17px"></div>' +
      '<div class="pchips" id="qkD" style="margin:8px 0"><button class="pchip" data-d="0">' + esc(T('النهارده', 'Today')) + '</button><button class="pchip" data-d="1">' + esc(T('بكرة', 'Tomorrow')) + '</button><button class="pchip" data-d="7">' + esc(T('بعد أسبوع', 'In a week')) + '</button><button class="pchip" data-d="">' + esc(T('بدون موعد', 'No date')) + '</button><button class="pchip" id="qkH">' + I('flag', 'xs') + esc(T('مهم', 'Important')) + '</button></div>' +
      '<div class="hint" id="qkI" style="min-height:20px"></div>',
    buttons: [{ label: T('إغلاق', 'Close'), cls: 'ghost', onClick: a => a.close() }, { label: T('أضف وكمان واحدة', 'Add & another'), onClick: () => go(true) }, { label: T('أضف', 'Add'), cls: 'primary', onClick: () => go(false) }],
    onClose: () => { openNow = false; },
    onMount: el => {
      const t = $('#qkT', el), info = $('#qkI', el);
      const paint = () => {
        $('#qkD', el).querySelectorAll('[data-d]').forEach(b => { const v = b.dataset.d === '' ? '' : dk(+b.dataset.d); b.classList.toggle('on', manual ? v === date : false); });
        $('#qkH', el).classList.toggle('on', high);
        info.textContent = date ? T('الميعاد: ' + date + (time ? ' ' + time : ''), 'Due: ' + date + (time ? ' ' + time : '')) : T('بدون ميعاد', 'No due date');
      };
      const parse = () => {
        if (manual || !NLP) { paint(); return; }
        const p = NLP.parse('ضيف مهمة ' + t.value, { now: new Date() }); date = (p && p.date) || ''; time = (p && p.time) || ''; paint();
      };
      t.oninput = parse; t.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(e.shiftKey); } };
      $('#qkD', el).onclick = e => { const b = e.target.closest('[data-d]'); if (!b) return; manual = true; date = b.dataset.d === '' ? '' : dk(+b.dataset.d); time = ''; paint(); };
      $('#qkH', el).onclick = () => { high = !high; paint(); };
      goFn = more => {
        const raw = t.value.trim(); if (!raw) { t.focus(); return; }
        let title = raw, d = date, tm = time;
        if (!manual && NLP) { const p = NLP.parse('ضيف مهمة ' + raw, { now: new Date() }); if (p && p.title) title = p.title; d = p.date || ''; tm = p.time || ''; }
        Q.add({ title, date: d, time: tm, high });
        MSA.toast(T('اتضافت: ' + title, 'Added: ' + title), 'ok', 2500);
        if (more) { t.value = ''; manual = false; date = ''; time = ''; high = false; paint(); t.focus(); } else m.close();
      };
      paint(); setTimeout(() => t.focus(), 60);
    }
  });
  function go(more){ goFn && goFn(more); }
  return m;
};

/* entry points */
const fire = () => setTimeout(() => Q.open(), 600);
try { if (/[?&]add=1/.test(location.search)) { history.replaceState(null, '', location.pathname); setTimeout(Q.open, 1800); } } catch (e) {}
document.addEventListener('keydown', e => { if (e.ctrlKey && e.altKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); Q.open(); } });
try {
  const App = MSA.native && MSA.native('App');
  if (App) {
    const hit = u => { if (/^msaquick:/.test(u || '')) fire(); };
    if (App.addListener) App.addListener('appUrlOpen', e => hit(e && e.url));
    if (App.getLaunchUrl) App.getLaunchUrl().then(r => { if (r && r.url) setTimeout(() => hit(r.url), 1500); }).catch(() => {});
  }
} catch (e) {}
})();
