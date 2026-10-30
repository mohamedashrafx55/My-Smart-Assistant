/* Pro tools: revision counter, stage timer & estimate, paste-notes, shot list, naming + delivery pack, per-type delivery checklists, assets library, monthly report */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const S = () => MSA.state, esc = U.esc, T = (a, e) => MSA.T(a, e);
const en = () => S().settings.lang === 'en';
const today = () => U.dateKey(new Date());
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
const P = () => MSA.proj;
const money = n => (Math.round(n * 100) / 100).toLocaleString(en() ? 'en-US' : 'ar-EG', { maximumFractionDigits: 2 });
const save = () => MSA.save();
const typeCat = p => { const d = ((MSA.tpl && MSA.tpl.TYPES) || []).find(x => x[0] === p.type); return d ? d[1] : ''; };
const isVideo = p => typeCat(p) === 'vid' || !!((p.shots && p.shots.length) || (p.vcom && p.vcom.length));
const clientOf = p => (MSA.clients && MSA.clients.of ? MSA.clients.of(p) : (p.client || '')) || '';
async function copyText(t){
  try { await navigator.clipboard.writeText(t); return true; } catch (e) {}
  try { const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); const ok = document.execCommand('copy'); a.remove(); return ok; } catch (e) { return false; }
}
const tcSec = s => { const m = String(s || '').trim().match(/^(?:(\d{1,2}):)?(\d{1,3}):(\d{2})$/); return m ? (+m[1] || 0) * 3600 + (+m[2]) * 60 + (+m[3]) : 1e9; };
const rounds = p => (p.revs || []).reduce((a, r) => a + Math.max(0, r.rounds.length - 1), 0);

/* sibling cards that live next to a tab's own box and redraw whenever that box redraws */
function attach(box, key, where, draw){
  const par = box.parentNode; if (!par) return;
  $$('[data-pro="' + key + '"]', par).forEach(e => e.remove());
  const el = document.createElement('div'); el.dataset.pro = key;
  par.insertBefore(el, where === 'after' ? box.nextSibling : box);
  const run = () => { if (document.body.contains(el)) draw(el); };
  run();
  box._proObs = box._proObs || {};
  if (box._proObs[key]) box._proObs[key].disconnect();
  let tm = 0; const ob = new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(run, 30); });
  ob.observe(box, { childList: true }); box._proObs[key] = ob;
}

/* =====================================================================
   1) revision counter
   ===================================================================== */
const rvOf = p => (p.rv = Object.assign({ agreed: 2, fee: 0, alerted: 0 }, p.rv || {}));
function extraMsg(p){
  const rv = rvOf(p), used = rounds(p), extra = Math.max(0, used - rv.agreed), cur = (p.time && p.time.cur) || 'EGP', me = S().profile.name || '', cl = clientOf(p);
  const price = rv.fee > 0 ? money(rv.fee * extra) + ' ' + cur : '';
  return en()
    ? 'Hi ' + (cl || '') + ',\nWe agreed on ' + rv.agreed + ' revision round(s) for “' + p.name + '”, and we have now reached round ' + used + ' (' + extra + ' extra).\n' + (rv.fee > 0 ? 'Each extra round is ' + money(rv.fee) + ' ' + cur + ', so the additional cost is ' + price + '.\n' : 'Please let me know how you would like to proceed with the extra rounds.\n') + 'Shall I go ahead with the new notes?\n\nThanks,\n' + me
    : 'أهلاً ' + (cl || '') + '،\nاتفقنا على ' + rv.agreed + ' جولة تعديل لمشروع «' + p.name + '» وبقينا دلوقتي في الجولة رقم ' + used + ' (' + extra + ' جولة زيادة).\n' + (rv.fee > 0 ? 'كل جولة إضافية بـ ' + money(rv.fee) + ' ' + cur + '، يعني التكلفة الإضافية ' + price + '.\n' : 'ياريت نتفق على طريقة التعامل مع الجولات الإضافية.\n') + 'تحب أكمل في الملاحظات الجديدة؟\n\nشكرًا،\n' + me;
}
function cRev(p, el){
  const rv = rvOf(p), used = rounds(p), over = used > rv.agreed, pct = Math.min(100, rv.agreed ? Math.round(used / rv.agreed * 100) : 100);
  if (used < rv.alerted) { rv.alerted = used; save(); }
  if (over && used > rv.alerted) { rv.alerted = used; save(); MSA.toast(T('⚠ تجاوزت عدد جولات التعديل المتفق عليها — جهّز رسالة للعميل', '⚠ Agreed revision rounds exceeded — prepare a message for the client'), 'err', 5200); }
  el.innerHTML = '<div class="card st-card pro-rv ' + (over ? 'over' : '') + '"><div class="st-h">' + I('repeat', 'sm') + '<b>' + esc(T('عدّاد التعديلات', 'Revision counter')) + '</b><span class="grow"></span><span class="tag" ' + (over ? 'style="background:#e5484d;color:#fff"' : '') + '>' + used + ' / ' + rv.agreed + '</span></div>' +
    '<div class="pro-bar"><i style="width:' + pct + '%;background:' + (over ? '#e5484d' : 'var(--accent, #5b8def)') + '"></i></div>' +
    '<div class="row" style="margin-top:10px;gap:10px;flex-wrap:wrap"><label class="row" style="gap:6px">' + esc(T('جولات متفق عليها', 'Agreed rounds')) + '<input type="number" id="rvAg" min="0" style="width:80px" value="' + rv.agreed + '"></label>' +
    '<label class="row" style="gap:6px">' + esc(T('سعر الجولة الإضافية', 'Extra round price')) + '<input type="number" id="rvFee" min="0" style="width:100px" value="' + (rv.fee || '') + '"></label>' +
    (over ? '<button class="btn primary" id="rvMsg">' + I('mail', 'sm') + esc(T('رسالة تعديل إضافي', 'Extra-revision message')) + '</button>' : '') + '</div>' +
    '<div class="hint" style="margin-top:6px">' + esc(over ? T('تجاوزت بـ ' + (used - rv.agreed) + ' جولة. ' + (rv.fee > 0 ? 'التكلفة الإضافية: ' + money(rv.fee * (used - rv.agreed)) : ''), 'Over by ' + (used - rv.agreed) + ' round(s). ' + (rv.fee > 0 ? 'Extra cost: ' + money(rv.fee * (used - rv.agreed)) : '')) : T('الجولة الأولى (V1) هي التسليم الأول؛ كل جولة بعدها تُحسب تعديلًا.', 'V1 is the first delivery; every round after it counts as a revision.')) + '</div></div>';
  MSA.studio.refreshTabs && MSA.studio.refreshTabs();
  $('#rvAg', el).oninput = e => { rv.agreed = Math.max(0, Math.round(num(e.target.value))); save(); };
  $('#rvAg', el).onchange = () => cRev(p, el);
  $('#rvFee', el).oninput = e => { rv.fee = Math.max(0, num(e.target.value)); save(); };
  $('#rvFee', el).onchange = () => cRev(p, el);
  const b = $('#rvMsg', el); if (b) b.onclick = () => {
    const m = MSA.modal({ title: T('رسالة تعديل إضافي', 'Extra-revision message'), size: 'wide', body: '<textarea id="rvTxt" dir="auto" rows="10" class="mg-text">' + esc(extraMsg(p)) + '</textarea>',
      buttons: [{ label: T('نسخ', 'Copy'), icon: 'copy', onClick: async () => { MSA.toast(await copyText($('#rvTxt', m.el).value) ? T('تم النسخ', 'Copied') : T('تعذّر النسخ', 'Copy failed'), 'ok'); } },
        { label: T('واتساب', 'WhatsApp'), cls: 'primary', icon: 'link', onClick: () => { const r = MSA.clients && MSA.clients.data ? MSA.clients.data().rows.find(x => String(x.c.name || '').trim().toLowerCase() === clientOf(p).toLowerCase()) : null; const ph = r ? String(r.c.wa || r.c.phone || '').replace(/[^\d]/g, '') : ''; MSA.openLink('https://wa.me/' + ph + '?text=' + encodeURIComponent($('#rvTxt', m.el).value)); } }] });
  };
}

/* =====================================================================
   7) paste client notes -> revision tasks
   ===================================================================== */
const WA = /^\s*\[?\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4},?\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?m\.?|[صم])?\]?\s*[-–]?\s*/i;
function parseNotes(txt, video){
  const seen = new Set(), out = [];
  String(txt || '').split(/\r?\n/).forEach(raw => {
    let l = raw.trim(); if (!l) return;
    if (WA.test(l)) { l = l.replace(WA, '').replace(/^[^:\n]{1,30}:\s+(?=\S)/, ''); }
    l = l.replace(/^\s*(?:[-*•▪●]+|\d{1,2}[.)\-])\s+/, '').trim();
    if (l.length < 2 || /^(<media omitted>|<attachment>)/i.test(l)) return;
    let tc = ''; const m = l.match(/^\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?\s*[-–:]?\s*(.*)$/);
    if (m && m[2] && video) { tc = m[1]; l = m[2].trim(); }
    const k = (tc + '|' + l).toLowerCase(); if (seen.has(k)) return; seen.add(k); out.push({ text: l, tc });
  });
  return out;
}
function cPaste(p, el){
  const revs = p.revs = p.revs || [];
  el.innerHTML = '<div class="card st-card"><div class="st-h">' + I('paste', 'sm') + '<b>' + esc(T('لصق ملاحظات العميل', 'Paste client notes')) + '</b></div>' +
    '<div class="hint" style="margin-bottom:6px">' + esc(T('الصق رسائل واتساب أو أي ملاحظات — كل سطر يتحوّل لمهمة تعديل داخل المشروع وتتسجّل في جولة جديدة.', 'Paste WhatsApp messages or any notes — each line becomes a revision task and goes into a new round.')) + '</div>' +
    '<textarea id="pnTxt" dir="auto" rows="4" placeholder="' + esc(T('مثال:\n- كبّر اللوجو\n- غيّر اللون للأزرق', 'e.g.\n- Make the logo bigger\n- Change colour to blue')) + '"></textarea>' +
    '<div class="row" style="margin-top:8px;flex-wrap:wrap;gap:8px"><select id="pnWhere" style="width:auto"><option value="">' + esc(T('تصميم جديد', 'New design')) + '</option>' + revs.map(r => '<option value="' + r.id + '">' + esc(r.name) + '</option>').join('') + '</select>' +
    '<label class="row" style="gap:6px"><input type="checkbox" class="cb" id="pnTasks" checked>' + esc(T('أنشئ مهمة لكل سطر', 'Create a task per line')) + '</label><span class="grow"></span><button class="btn primary" id="pnGo">' + I('check', 'sm') + esc(T('حوّل', 'Convert')) + '</button></div></div>';
  $('#pnGo', el).onclick = () => {
    const items = parseNotes($('#pnTxt', el).value, isVideo(p));
    if (!items.length) { MSA.toast(T('اكتب أو الصق ملاحظات أولًا', 'Paste some notes first'), 'err'); return; }
    const plain = items.filter(x => !x.tc);
    if (plain.length) {
      const note = plain.map(x => '• ' + x.text).join('\n'); const wid = $('#pnWhere', el).value; let r = revs.find(x => x.id === wid);
      if (!r) { r = { id: U.uid('r'), name: T('ملاحظات ', 'Notes ') + today(), rounds: [{ id: U.uid('x'), date: today(), note: '', done: true, atts: [] }] }; revs.push(r); }
      r.rounds.push({ id: U.uid('x'), date: today(), note, done: false, atts: [] });
    }
    if (isVideo(p)) { const v = p.vcom = p.vcom || []; items.filter(x => x.tc).forEach(x => v.push({ id: U.uid('vc'), tc: x.tc, text: x.text, done: false })); }
    if ($('#pnTasks', el).checked) { const api = MSA.tasksApi; items.forEach(x => { S().tasks.unshift(api.blank({ title: (x.tc ? '[' + x.tc + '] ' : '') + x.text, desc: T('تعديل من العميل — ', 'Client revision — ') + p.name, tags: [p.name], priority: 'high', src: { pid: p.id, rev: 1 } })); }); MSA.updateCounts && MSA.updateCounts(); }
    save(); MSA.toast(T('تم تسجيل ' + items.length + ' ملاحظة', items.length + ' note(s) recorded'), 'ok'); MSA.rerender(true);
  };
}

/* =====================================================================
   2/3/4) stage timer, default durations, price estimate
   ===================================================================== */
const DEF_MIN = { brief: 30, research: 90, mood: 60, refs: 45, colors: 45, fonts: 30, logo: 240, icons: 120, mockups: 90, idea: 45, concept: 120, sketch: 90, digitize: 120, variants: 90, review: 30, revise: 90, files: 30, deliver: 20, static: 120, motion: 180, templates: 90, content: 60, assets: 45, layout: 120, prepress: 45, proof: 30, sizes: 40, publish: 20, wire: 120, ui: 240, handoff: 60, audit: 60, hierarchy: 40, audience: 40, onscreen: 60, printing: 60, slogan: 40, main: 120 };
const defMin = s => { if (s.key && DEF_MIN[s.key]) return DEF_MIN[s.key]; const t = String(s.title || '').toLowerCase(); if (/مونتاج|montage|edit/.test(t)) return 240; if (/تصوير|shoot/.test(t)) return 180; if (/سيناريو|script|story/.test(t)) return 90; if (/صوت|audio|sound|color|ألوان/.test(t)) return 60; return 60; };
const timeOf = p => { if (!p.time) p.time = {}; const d = { rate: 0, cur: 'EGP', client: '', fixed: 0, notes: '', run: null, entries: [], extras: [], seq: 0 }; Object.keys(d).forEach(k => { if (p.time[k] === undefined) p.time[k] = d[k]; }); return p.time; };
const sttOf = p => { const x = p.stt = p.stt || { run: null, spent: {}, est: {} }; x.spent = x.spent || {}; x.est = x.est || {}; return x; };
const fmtMin = m => { m = Math.round(m); return (m >= 60 ? Math.floor(m / 60) + T('س ', 'h ') : '') + (m % 60) + T('د', 'm'); };
let sTick = 0;
function stopRun(p, quiet){
  const st = sttOf(p); if (!st.run) return;
  const min = Math.max(1, Math.round((Date.now() - st.run.start) / 60000)), f = P().find(p.steps, st.run.sid), ttl = f ? P().title(f.step) : '';
  st.spent[st.run.sid] = (st.spent[st.run.sid] || 0) + min;
  const tm = timeOf(p);
  tm.entries.push({ id: U.uid('e'), date: today(), min, note: ttl }); st.run = null; save(); if (!quiet) MSA.toast(T('تم حفظ ' + min + ' دقيقة', min + ' min saved'), 'ok');
}
function cStage(p, el){
  const st = sttOf(p), leaves = p.steps.flatMap(P().leaves), tm = timeOf(p);
  if (!Object.keys(st.est).length && leaves.length) { leaves.forEach(s => { st.est[s.id] = defMin(s); }); save(); }
  if (!leaves.length) { el.innerHTML = '<div class="card st-card"><div class="st-h">' + I('clock', 'sm') + '<b>' + esc(T('الوقت لكل مرحلة', 'Time per stage')) + '</b></div><div class="hint">' + esc(T('أضف مراحل في تبويب الخطة أولًا.', 'Add stages in the Plan tab first.')) + '</div></div>'; return; }
  const spentOf = s => (st.spent[s.id] || 0) + (st.run && st.run.sid === s.id ? Math.round((Date.now() - st.run.start) / 60000) : 0);
  const est = leaves.reduce((a, s) => a + (st.est[s.id] || 0), 0), spent = leaves.reduce((a, s) => a + spentOf(s), 0);
  const priced = tm.fixed > 0 && tm.rate > 0 ? tm.fixed / tm.rate * 60 : est, sugg = tm.rate > 0 ? Math.round(est / 60 * tm.rate) : 0;
  const cmp = spent > priced * 1.001 ? 'bad' : '';
  el.innerHTML = '<div class="card st-card"><div class="st-h">' + I('clock', 'sm') + '<b>' + esc(T('الوقت لكل مرحلة والتقدير', 'Stage time & estimate')) + '</b><span class="grow"></span><button class="btn sm" id="stAuto">' + esc(T('تقدير تلقائي', 'Auto-estimate')) + '</button></div>' +
    '<table class="st-tbl"><thead><tr><th>' + esc(T('المرحلة', 'Stage')) + '</th><th>' + esc(T('تقدير (د)', 'Est. (min)')) + '</th><th>' + esc(T('فعلي', 'Actual')) + '</th><th></th></tr></thead><tbody>' +
    leaves.map(s => { const run = st.run && st.run.sid === s.id, sp = spentOf(s), over = st.est[s.id] && sp > st.est[s.id]; return '<tr><td dir="auto">' + esc(P().title(s)) + '</td><td><input type="number" min="0" style="width:70px" data-est="' + s.id + '" value="' + (st.est[s.id] || '') + '"></td><td data-sp="' + s.id + '" style="' + (over ? 'color:#e5484d;font-weight:600' : '') + '">' + esc(fmtMin(sp)) + '</td><td><button class="icon-btn sm' + (run ? ' danger' : '') + '" data-run="' + s.id + '" title="' + esc(run ? T('إيقاف', 'Stop') : T('ابدأ', 'Start')) + '">' + I(run ? 'pause' : 'play', 'sm') + '</button></td></tr>'; }).join('') + '</tbody></table>' +
    '<div class="st-total" style="margin-top:10px"><span>' + esc(T('المقدّر', 'Estimated')) + ': <b>' + esc(fmtMin(est)) + '</b></span><span>' + esc(T('المسعّر', 'Priced')) + ': <b>' + esc(fmtMin(priced)) + '</b></span><span class="' + cmp + '" ' + (cmp ? 'style="color:#e5484d"' : '') + '>' + esc(T('الفعلي', 'Actual')) + ': <b>' + esc(fmtMin(spent)) + '</b></span></div>' +
    (tm.rate > 0 ? '<div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap"><span class="hint grow">' + esc(T('السعر المقترح من التقدير: ', 'Suggested price from the estimate: ')) + '<b dir="ltr">' + money(sugg) + ' ' + esc(tm.cur) + '</b></span><button class="btn sm" id="stUse">' + esc(T('استخدمه كسعر ثابت', 'Use as fixed price')) + '</button></div>' : '<div class="hint" style="margin-top:6px">' + esc(T('اكتب سعر الساعة في الأعلى لتظهر المقارنة بالسعر المقترح.', 'Enter an hourly rate above to see a suggested price.')) + '</div>') + '</div>';
  $('#stAuto', el).onclick = () => { leaves.forEach(s => { st.est[s.id] = defMin(s); }); save(); cStage(p, el); };
  const use = $('#stUse', el); if (use) use.onclick = () => { tm.fixed = sugg; save(); MSA.toast(T('تم ضبط السعر الثابت', 'Fixed price set'), 'ok'); MSA.rerender(true); };
  $$('[data-est]', el).forEach(i => { i.oninput = () => { st.est[i.dataset.est] = Math.max(0, Math.round(num(i.value))); save(); }; i.onchange = () => cStage(p, el); });
  $$('[data-run]', el).forEach(b => b.onclick = () => {
    const sid = b.dataset.run;
    if (st.run && st.run.sid === sid) { stopRun(p); MSA.rerender(true); return; }
    if (st.run) stopRun(p, true);
    st.run = { sid, start: Date.now() }; save(); MSA.rerender(true);
  });
  clearInterval(sTick);
  if (st.run) sTick = setInterval(() => { if (!document.body.contains(el) || !st.run) { clearInterval(sTick); return; } const c = $('[data-sp="' + st.run.sid + '"]', el); if (c) c.textContent = fmtMin(spentOf({ id: st.run.sid })); }, 15000);
}

/* =====================================================================
   6) delivery checklists per project type
   ===================================================================== */
const LISTS = {
  print: [['الأبعاد النهائية مطابقة لمقاس الطباعة', 'Final size matches the print size'], ['Bleed 3mm وعلامات القص', '3mm bleed and crop marks'], ['وضع الألوان CMYK', 'Colour mode is CMYK'], ['دقة الصور 300dpi', 'Images are 300 dpi'], ['الخطوط محوّلة Outlines', 'Fonts converted to outlines'], ['الألوان السوداء (Rich black / 100K) مضبوطة', 'Blacks set correctly (rich black / 100K)'], ['مراجعة الإملاء والأرقام وأرقام التواصل', 'Spelling, numbers and contact details proofread'], ['تصدير PDF للطباعة (PDF/X)', 'Print PDF exported (PDF/X)'], ['ملفات المصدر محفوظة (AI / PSD / INDD)', 'Source files saved (AI / PSD / INDD)'], ['اعتماد العميل كتابيًا', 'Client approval in writing']],
  dig: [['المقاسات مطابقة لكل منصة', 'Sizes match each platform'], ['وضع الألوان RGB / sRGB', 'Colour mode RGB / sRGB'], ['المناطق الآمنة (Safe zones) محترمة', 'Safe zones respected'], ['النص مقروء على الموبايل', 'Text is readable on mobile'], ['التصدير PNG / JPG بجودة مناسبة وحجم خفيف', 'Exported PNG / JPG, good quality and light size'], ['مراجعة الإملاء والروابط', 'Spelling and links proofread'], ['تسمية الملفات حسب الاتفاق', 'Files named as agreed'], ['ملفات المصدر محفوظة', 'Source files saved'], ['اعتماد العميل كتابيًا', 'Client approval in writing']],
  vid: [['الدقة ومعدل الإطارات مطابقان (1080p / 4K · 24/30/60)', 'Resolution and frame rate match (1080p / 4K · 24/30/60)'], ['النسب المطلوبة جاهزة (16:9 / 9:16 / 1:1)', 'Required ratios ready (16:9 / 9:16 / 1:1)'], ['التصدير H.264 MP4 بجودة وبت ريت مناسبة', 'Exported H.264 MP4 with a good bitrate'], ['مستوى الصوت متوازن (حوالي -14 LUFS)', 'Audio balanced (about -14 LUFS)'], ['الترجمة / النصوص على الشاشة مراجعة', 'Subtitles / on-screen text proofread'], ['المناطق الآمنة للنصوص محترمة', 'Text safe zones respected'], ['حقوق الموسيقى والخامات سليمة', 'Music and stock licences are fine'], ['صورة مصغرة (Thumbnail) جاهزة', 'Thumbnail ready'], ['المشروع مؤرشف (Project + Media)', 'Project archived (project + media)'], ['اعتماد العميل كتابيًا', 'Client approval in writing']],
  id: [['نسخ الشعار: ملوّن / أحادي / معكوس', 'Logo versions: colour / mono / reversed'], ['صيغ الملفات: AI / SVG / PNG / PDF', 'File formats: AI / SVG / PNG / PDF'], ['المساحة الآمنة وأقل حجم للشعار موثّقة', 'Clear space and minimum size documented'], ['أكواد الألوان (HEX / RGB / CMYK) مرفقة', 'Colour codes (HEX / RGB / CMYK) included'], ['الخطوط المستخدمة وروابطها مرفقة', 'Fonts used and their links included'], ['كتيب الهوية PDF', 'Brand guidelines PDF'], ['ملفات المصدر محفوظة', 'Source files saved'], ['اعتماد العميل كتابيًا', 'Client approval in writing']]
};
function ensureDelivery(p){
  if (p.delivery) return; const l = LISTS[typeCat(p)]; if (!l) return;
  p.delivery = { items: l.map(c => ({ id: U.uid('d'), text: T(c[0], c[1]), done: false })), typed: 1 }; save();
}

/* =====================================================================
   10) shot list + timecoded client comments (video)
   ===================================================================== */
function tShots(p, box){
  const sh = p.shots = p.shots || [], vc = p.vcom = p.vcom || [];
  const draw = () => {
    sh.sort((a, b) => tcSec(a.tc) - tcSec(b.tc)); vc.sort((a, b) => tcSec(a.tc) - tcSec(b.tc));
    const row = (x, k) => '<div class="row pro-row" data-' + k + '="' + x.id + '"><input type="text" dir="ltr" data-f="tc" style="width:84px" placeholder="00:00" value="' + esc(x.tc || '') + '">' + (k === 's' ? '<input type="text" dir="auto" data-f="title" style="width:130px" placeholder="' + esc(T('المشهد', 'Scene')) + '" value="' + esc(x.title || '') + '">' : '') + '<input type="text" dir="auto" data-f="text" class="grow" placeholder="' + esc(k === 's' ? T('وصف اللقطة', 'Shot description') : T('ملاحظة العميل', 'Client comment')) + '" value="' + esc(x.text || '') + '"><label class="row" style="gap:4px;cursor:pointer"><input type="checkbox" class="cb" data-f="done" ' + (x.done ? 'checked' : '') + '></label><button class="icon-btn sm danger" data-del="' + x.id + '">' + I('x', 'sm') + '</button></div>';
    const doneS = sh.filter(x => x.done).length, openC = vc.filter(x => !x.done).length;
    box.innerHTML = '<div class="card st-card"><div class="st-h">' + I('video', 'sm') + '<b>' + esc(T('قائمة اللقطات', 'Shot list')) + '</b><span class="tag">' + doneS + '/' + sh.length + '</span><span class="grow"></span><button class="btn sm" data-a="copy">' + I('copy', 'sm') + esc(T('نسخ', 'Copy')) + '</button></div>' +
      (sh.length ? sh.map(x => row(x, 's')).join('') : '<div class="hint">' + esc(T('أضف لقطات بتوقيتها (مثال 00:15).', 'Add shots with their timecodes (e.g. 00:15).')) + '</div>') +
      '<div style="margin-top:8px"><button class="btn sm" data-a="adds">' + I('plus', 'sm') + esc(T('لقطة', 'Shot')) + '</button></div></div>' +
      '<div class="card st-card"><div class="st-h">' + I('note', 'sm') + '<b>' + esc(T('ملاحظات العميل على التايم لاين', 'Timecoded client comments')) + '</b><span class="tag">' + openC + ' ' + esc(T('مفتوحة', 'open')) + '</span></div>' +
      (vc.length ? vc.map(x => row(x, 'c')).join('') : '<div class="hint">' + esc(T('اكتب التوقيت وما طلبه العميل — أو الصق الملاحظات في تبويب التعديلات وستظهر هنا.', 'Enter the time and what the client asked — or paste notes in the Revisions tab and they appear here.')) + '</div>') +
      '<div style="margin-top:8px"><button class="btn sm" data-a="addc">' + I('plus', 'sm') + esc(T('ملاحظة', 'Comment')) + '</button></div></div>';
    wire();
  };
  const wire = () => {
    const list = k => k === 's' ? sh : vc;
    ['s', 'c'].forEach(k => $$('[data-' + k + ']', box).forEach(r => {
      const x = list(k).find(y => y.id === r.dataset[k]); if (!x) return;
      $$('[data-f]', r).forEach(i => { if (i.dataset.f === 'done') i.onchange = () => { x.done = i.checked; save(); draw(); }; else { i.oninput = () => { x[i.dataset.f] = i.value; save(); }; if (i.dataset.f === 'tc') i.onchange = draw; } });
      $('[data-del]', r).onclick = () => { const l = list(k); l.splice(l.indexOf(x), 1); save(); draw(); };
    }));
    $('[data-a=adds]', box).onclick = () => { sh.push({ id: U.uid('sh'), tc: '00:00', title: '', text: '', done: false }); save(); draw(); };
    $('[data-a=addc]', box).onclick = () => { vc.push({ id: U.uid('vc'), tc: '00:00', text: '', done: false }); save(); draw(); };
    $('[data-a=copy]', box).onclick = async () => { const t = sh.map(x => x.tc + '  ' + (x.title ? x.title + ' — ' : '') + x.text).join('\n') + (vc.length ? '\n\n' + T('ملاحظات العميل', 'Client comments') + ':\n' + vc.map(x => (x.done ? '[x] ' : '[ ] ') + x.tc + '  ' + x.text).join('\n') : ''); MSA.toast(await copyText(t) ? T('تم النسخ', 'Copied') : T('تعذّر النسخ', 'Copy failed'), 'ok'); };
  };
  draw();
}

/* =====================================================================
   8) batch naming + delivery pack (zip)
   ===================================================================== */
const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = u8 => { let c = ~0; for (let i = 0; i < u8.length; i++) c = crcT[(c ^ u8[i]) & 255] ^ (c >>> 8); return (~c) >>> 0; };
async function makeZip(files){
  const parts = [], cen = [], enc = new TextEncoder(); let off = 0; const dt = new Date();
  const dosT = (dt.getHours() << 11) | (dt.getMinutes() << 5) | (dt.getSeconds() >> 1), dosD = ((dt.getFullYear() - 1980) << 9) | ((dt.getMonth() + 1) << 5) | dt.getDate();
  for (const f of files) {
    const data = f.data || new Uint8Array(await f.blob.arrayBuffer()), nm = enc.encode(f.name), c = crc32(data);
    const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(10, dosT, true); h.setUint16(12, dosD, true); h.setUint32(14, c, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true);
    parts.push(h.buffer, nm, data);
    const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(12, dosT, true); ch.setUint16(14, dosD, true); ch.setUint32(16, c, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
    cen.push(ch.buffer, nm); off += 30 + nm.length + data.length;
  }
  let cs = 0; cen.forEach(x => { cs += x.byteLength; });
  const e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
  return new Blob(parts.concat(cen, [e.buffer]), { type: 'application/zip' });
}
const clean = (s, sep) => String(s || '').replace(/[\\\/:*?"<>|\u0000-\u001f]+/g, '').trim().replace(/\s+/g, sep);
const nmOf = p => (p.nm = Object.assign({ client: true, project: true, item: '', ver: true, date: false, sep: '_', v: 1, lower: false }, p.nm || {}));
function baseName(p){
  const n = nmOf(p), sep = n.sep, parts = [];
  if (n.client && clientOf(p)) parts.push(clean(clientOf(p), sep)); if (n.project) parts.push(clean(p.name, sep)); if (n.item) parts.push(clean(n.item, sep));
  if (n.date) parts.push(today().replace(/-/g, '')); if (n.ver) parts.push('v' + Math.max(1, Math.round(n.v || 1)));
  let s = parts.filter(Boolean).join(sep) || 'file'; return n.lower ? s.toLowerCase() : s;
}
function tFiles(p, box){
  const n = nmOf(p), FMT = ['png', 'jpg', 'pdf', 'mp4', 'psd', 'ai', 'svg', 'zip'];
  n.fmts = n.fmts || ['png', 'pdf'];
  const atts = []; P().walk(p.steps, s => s.atts.forEach(a => atts.push({ a, s })));
  const draw = () => {
    const b = baseName(p);
    box.innerHTML = '<div class="card st-card"><div class="st-h">' + I('tag', 'sm') + '<b>' + esc(T('تسمية ملفات التسليم', 'Export file naming')) + '</b></div>' +
      '<div class="row" style="flex-wrap:wrap;gap:12px">' + [['client', T('العميل', 'Client')], ['project', T('المشروع', 'Project')], ['ver', T('رقم النسخة', 'Version')], ['date', T('التاريخ', 'Date')], ['lower', T('أحرف صغيرة', 'Lowercase')]].map(x => '<label class="row" style="gap:5px;cursor:pointer"><input type="checkbox" class="cb" data-nm="' + x[0] + '" ' + (n[x[0]] ? 'checked' : '') + '>' + esc(x[1]) + '</label>').join('') + '</div>' +
      '<div class="row" style="margin-top:10px;flex-wrap:wrap;gap:8px"><input type="text" dir="auto" id="nmItem" style="width:150px" placeholder="' + esc(T('اسم القطعة (اختياري)', 'Item name (optional)')) + '" value="' + esc(n.item) + '"><label class="row" style="gap:5px">v<input type="number" id="nmV" min="1" style="width:70px" value="' + n.v + '"></label><button class="btn sm" id="nmAuto">' + esc(T('من عدد التعديلات', 'From revisions')) + '</button>' +
      '<select id="nmSep" style="width:auto">' + [['_', '_'], ['-', '-'], ['.', '.']].map(x => '<option value="' + x[0] + '" ' + (n.sep === x[0] ? 'selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div>' +
      '<div class="row" style="margin-top:10px;flex-wrap:wrap;gap:10px">' + FMT.map(f => '<label class="row" style="gap:4px;cursor:pointer"><input type="checkbox" class="cb" data-fm="' + f + '" ' + (n.fmts.includes(f) ? 'checked' : '') + '>.' + f + '</label>').join('') + '</div>' +
      '<div class="pro-names" dir="ltr">' + (n.fmts.length ? n.fmts.map(f => '<div>' + esc(b + '.' + f) + '</div>').join('') : '<div>' + esc(b) + '</div>') + '</div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm" id="nmCopy">' + I('copy', 'sm') + esc(T('نسخ الأسماء', 'Copy names')) + '</button></div></div>' +
      '<div class="card st-card"><div class="st-h">' + I('download', 'sm') + '<b>' + esc(T('حزمة التسليم', 'Delivery pack')) + '</b></div>' +
      '<div class="hint" style="margin-bottom:8px">' + esc(T('اختر الملفات المرفقة في المراحل — تُحمَّل في ملف ZIP واحد بأسماء منظّمة، مع ملف نصي بحالة قائمة التسليم.', 'Pick files attached to stages — they download as one ZIP with tidy names, plus a text file with the checklist status.')) + '</div>' +
      (atts.length ? atts.map((x, i) => '<label class="row" style="cursor:pointer;margin-bottom:4px"><input type="checkbox" class="cb" data-pk="' + i + '" checked><span dir="auto" class="grow">' + esc(x.a.name) + '</span><span class="hint">' + esc(P().title(x.s)) + '</span></label>').join('') + '<div style="margin-top:10px"><button class="btn primary" id="pkGo">' + I('download', 'sm') + esc(T('تحميل الحزمة ZIP', 'Download ZIP pack')) + '</button></div>' : '<div class="hint">' + esc(T('لا توجد ملفات مرفقة في المراحل بعد.', 'No files attached to stages yet.')) + '</div>') + '</div>';
    wire();
  };
  const wire = () => {
    $$('[data-nm]', box).forEach(c => c.onchange = () => { n[c.dataset.nm] = c.checked; save(); draw(); });
    $$('[data-fm]', box).forEach(c => c.onchange = () => { n.fmts = FMT.filter(f => f === c.dataset.fm ? c.checked : n.fmts.includes(f)); save(); draw(); });
    $('#nmItem', box).oninput = e => { n.item = e.target.value; save(); }; $('#nmItem', box).onchange = draw;
    $('#nmV', box).onchange = e => { n.v = Math.max(1, Math.round(num(e.target.value)) || 1); save(); draw(); };
    $('#nmAuto', box).onclick = () => { n.v = Math.max(1, (p.revs || []).reduce((a, r) => Math.max(a, r.rounds.length), 1)); save(); draw(); };
    $('#nmSep', box).onchange = e => { n.sep = e.target.value; save(); draw(); };
    $('#nmCopy', box).onclick = async () => { const b = baseName(p), t = (n.fmts.length ? n.fmts.map(f => b + '.' + f) : [b]).join('\n'); MSA.toast(await copyText(t) ? T('تم النسخ', 'Copied') : T('تعذّر النسخ', 'Copy failed'), 'ok'); };
    const go = $('#pkGo', box); if (go) go.onclick = async () => {
      const pick = $$('[data-pk]:checked', box).map(c => atts[+c.dataset.pk]); if (!pick.length) { MSA.toast(T('اختر ملفًا واحدًا على الأقل', 'Pick at least one file'), 'err'); return; }
      go.disabled = true; MSA.toast(T('جاري تجهيز الحزمة…', 'Building the pack…'));
      try {
        const b = baseName(p), files = [], used = new Set(); let i = 0;
        for (const x of pick) { const rec = await MSA.files.get(x.a.id); if (!rec) continue; i++; const ext = (x.a.name.split('.').pop() || 'bin').toLowerCase(); let nm = b + '_' + String(i).padStart(2, '0') + '.' + ext, k = 1; while (used.has(nm)) nm = b + '_' + String(i).padStart(2, '0') + '_' + (++k) + '.' + ext; used.add(nm); files.push({ name: nm, blob: rec.blob }); }
        if (!files.length) { MSA.toast(T('الملفات غير متاحة', 'Files not available'), 'err'); return; }
        const d = p.delivery ? p.delivery.items : [], txt = (T('قائمة التسليم — ', 'Delivery checklist — ') + p.name + '\n\n' + (d.length ? d.map(x => (x.done ? '[x] ' : '[ ] ') + x.text).join('\n') : T('لا توجد قائمة', 'No checklist')) + '\n');
        files.push({ name: 'README.txt', data: new TextEncoder().encode('﻿' + txt) });
        const blob = await makeZip(files), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = b + '_delivery.zip'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000);
        MSA.toast(T('تم تجهيز الحزمة', 'Pack ready'), 'ok');
      } catch (e) { MSA.toast(T('تعذّر تجهيز الحزمة', 'Could not build the pack'), 'err'); } finally { go.disabled = false; }
    };
  };
  draw();
}
MSA.pro = { makeZip, parseNotes, baseName, rounds, extraMsg };

/* =====================================================================
   wire into the project tabs
   ===================================================================== */
const PT = MSA.studio.PTABS;
if (!PT.some(x => x[0] === 'shots')) PT.push(['shots', 'video', 'اللقطات', 'Shots']);
if (!PT.some(x => x[0] === 'files')) PT.push(['files', 'tag', 'التسمية والتسليم', 'Naming & pack']);
const origBar = MSA.studio.tabBar, origRender = MSA.studio.render;
MSA.studio.tabBar = function(cur, p){
  const d = document.createElement('div'); d.innerHTML = origBar(cur, p);
  if (!isVideo(p) && cur !== 'shots') { const b = d.querySelector('[data-t="shots"]'); if (b) b.remove(); }
  const rb = d.querySelector('[data-t="revs"]'); if (rb) { const rv = rvOf(p), u = rounds(p); if (u > rv.agreed) rb.insertAdjacentHTML('beforeend', '<span class="cnt" style="background:#e5484d;color:#fff">!</span>'); }
  const sb = d.querySelector('[data-t="shots"]'); if (sb && p.vcom) { const n = p.vcom.filter(x => !x.done).length; if (n) sb.insertAdjacentHTML('beforeend', '<span class="cnt">' + n + '</span>'); }
  return d.innerHTML;
};
MSA.studio.render = function(tab, p, box){
  clearInterval(sTick);
  if (tab === 'shots') { tShots(p, box); return; }
  if (tab === 'files') { tFiles(p, box); return; }
  if (tab === 'delivery') ensureDelivery(p);
  origRender(tab, p, box);
  if (tab === 'revs') { attach(box, 'rv', 'before', el => cRev(p, el)); attach(box, 'paste', 'after', el => cPaste(p, el)); }
  if (tab === 'time') attach(box, 'stt', 'after', el => cStage(p, el));
};

/* =====================================================================
   5) assets library (a Learn tab)
   ===================================================================== */
const AT = [['font', T('خطوط', 'Fonts')], ['color', T('ألوان', 'Colours')], ['effect', T('تأثيرات', 'Effects')], ['preset', T('بريسيت', 'Presets')], ['music', T('موسيقى', 'Music')], ['other', T('أخرى', 'Other')]];
const atName = k => (AT.find(x => x[0] === k) || AT[5])[1];
const LT = MSA.studio.LTABS;
if (LT && !LT.some(x => x[0] === 'assets')) LT.splice(2, 0, ['assets', 'folder', 'مكتبة الأصول', 'Assets']);
const origLearn = MSA.studio.renderLearn;
MSA.studio.renderLearn = function(tab, box){ if (tab === 'assets') { lAssets(box); return; } origLearn(tab, box); };
let aTag = '', aType = '', aQ = '';
function lAssets(box){
  const list = S().assets = S().assets || [];
  const tags = new Set(); list.forEach(a => (a.tags || []).forEach(t => tags.add(t)));
  const shown = list.filter(a => (!aType || (aType === '__fav' ? a.fav : a.type === aType)) && (!aTag || (a.tags || []).includes(aTag)) && (!aQ || (a.title + ' ' + (a.tags || []).join(' ') + ' ' + (a.value || '') + ' ' + (a.note || '')).toLowerCase().includes(aQ.toLowerCase())));
  box.innerHTML = '<div class="toolbar"><button class="btn primary" data-a="add">' + I('plus', 'sm') + esc(T('إضافة أصل', 'Add asset')) + '</button><div class="grow" style="min-width:140px"><input type="search" id="asQ" placeholder="' + esc(T('ابحث: اسم، وسم…', 'Search: name, tag…')) + '" value="' + esc(aQ) + '"></div></div>' +
    '<div class="tabs-scroll" style="margin:8px 0"><button class="pchip ' + (aType ? '' : 'on') + '" data-ty="">' + esc(T('الكل', 'All')) + '</button><button class="pchip favchip ' + (aType === '__fav' ? 'on' : '') + '" data-ty="__fav">' + I('star', 'sm') + esc(T('المفضلة', 'Favourites')) + ' (' + list.filter(a => a.fav).length + ')</button>' + AT.map(x => '<button class="pchip ' + (aType === x[0] ? 'on' : '') + '" data-ty="' + x[0] + '">' + esc(x[1]) + '</button>').join('') + '</div>' +
    (tags.size ? '<div class="tabs-scroll" style="margin-bottom:8px">' + [...tags].sort().map(t => '<button class="pchip ' + (aTag === t ? 'on' : '') + '" data-tg="' + esc(t) + '">#' + esc(t) + '</button>').join('') + '</div>' : '') +
    (shown.length ? '<div class="pro-assets">' + shown.map(a => '<div class="card pro-asset" data-id="' + a.id + '">' + (a.type === 'color' && /^#?[0-9a-f]{3,8}$/i.test(a.value || '') ? '<div class="pro-sw" style="background:' + (a.value[0] === '#' ? a.value : '#' + a.value) + '"></div>' : '') + '<div class="row"><b dir="auto" class="grow">' + esc(a.title) + '</b><span class="tag">' + esc(atName(a.type)) + '</span></div>' +
      (a.value ? '<div class="hint" dir="auto" style="word-break:break-all">' + esc(a.value) + '</div>' : '') + (a.note ? '<div class="hint" dir="auto">' + esc(a.note) + '</div>' : '') + (a.att ? '<div class="hint">' + I('clip', 'sm') + esc(a.att.name) + '</div>' : '') +
      '<div class="row" style="margin-top:6px;gap:4px;flex-wrap:wrap">' + (a.tags || []).map(t => '<span class="tag">#' + esc(t) + '</span>').join('') + '<span class="grow"></span>' + (a.value ? '<button class="icon-btn sm" data-cp="' + a.id + '" title="' + esc(T('نسخ', 'Copy')) + '">' + I('copy', 'sm') + '</button>' : '') + (/^https?:\/\//i.test(a.value || '') ? '<button class="icon-btn sm" data-op="' + a.id + '">' + I('external', 'sm') + '</button>' : '') + (a.att ? '<button class="icon-btn sm" data-dl="' + a.id + '">' + I('download', 'sm') + '</button>' : '') + '<button class="icon-btn sm fav-btn ' + (a.fav ? 'on' : '') + '" data-fv="' + a.id + '" aria-pressed="' + !!a.fav + '" title="' + esc(T(a.fav ? 'إزالة من المفضلة' : 'إضافة للمفضلة', a.fav ? 'Remove from favourites' : 'Add to favourites')) + '">' + I('star', 'sm') + '</button><button class="icon-btn sm" data-ed="' + a.id + '">' + I('pencil', 'sm') + '</button><button class="icon-btn sm danger" data-rm="' + a.id + '">' + I('trash', 'sm') + '</button></div></div>').join('') + '</div>'
      : MSA.empty('folder', list.length ? T('لا نتائج', 'No results') : T('مكتبة الأصول فاضية', 'Your asset library is empty'), T('احفظ خطوطك وألوانك وتأثيراتك وموسيقاك مع وسوم للبحث السريع.', 'Keep fonts, colours, effects, presets and music with tags for quick search.')));
  $('[data-a=add]', box).onclick = () => editAsset(null, () => lAssets(box));
  $('#asQ', box).oninput = e => { aQ = e.target.value.trim(); const c = e.target.selectionStart; lAssets(box); const n = $('#asQ', box); n.focus(); try { n.setSelectionRange(c, c); } catch (x) {} };
  $$('[data-ty]', box).forEach(b => b.onclick = () => { aType = b.dataset.ty; lAssets(box); });
  $$('[data-tg]', box).forEach(b => b.onclick = () => { aTag = aTag === b.dataset.tg ? '' : b.dataset.tg; lAssets(box); });
  const get = id => list.find(a => a.id === id);
  $$('[data-cp]', box).forEach(b => b.onclick = async () => { MSA.toast(await copyText(get(b.dataset.cp).value) ? T('تم النسخ', 'Copied') : T('تعذّر النسخ', 'Copy failed'), 'ok'); });
  $$('[data-op]', box).forEach(b => b.onclick = () => MSA.openLink(get(b.dataset.op).value));
  $$('[data-dl]', box).forEach(b => b.onclick = async () => { const a = get(b.dataset.dl), rec = await MSA.files.get(a.att.id); if (!rec) return; const l = document.createElement('a'); l.href = URL.createObjectURL(rec.blob); l.download = a.att.name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 8000); });
  $$('[data-fv]', box).forEach(b => b.onclick = () => { const a = get(b.dataset.fv); a.fav = !a.fav; if (!a.fav) delete a.fav; save(); lAssets(box); });
  $$('[data-ed]', box).forEach(b => b.onclick = () => editAsset(get(b.dataset.ed), () => lAssets(box)));
  $$('[data-rm]', box).forEach(b => b.onclick = async () => { const a = get(b.dataset.rm); if (!await MSA.confirm(T('حذف «' + a.title + '»؟', 'Delete “' + a.title + '”?'), { danger: true, okLabel: T('حذف', 'Delete') })) return; if (a.att) await MSA.files.del(a.att.id); list.splice(list.indexOf(a), 1); save(); lAssets(box); });
}
function editAsset(a, done){
  const list = S().assets = S().assets || [], x = a ? Object.assign({}, a, { tags: (a.tags || []).slice() }) : { id: U.uid('as'), type: 'font', title: '', value: '', note: '', tags: [], att: null, created: Date.now() };
  let newAtt = null;
  const m = MSA.modal({ title: a ? T('تعديل أصل', 'Edit asset') : T('إضافة أصل', 'Add asset'), size: 'wide',
    body: '<div class="field"><label class="f">' + esc(T('النوع', 'Type')) + '</label><select id="asT">' + AT.map(t => '<option value="' + t[0] + '" ' + (x.type === t[0] ? 'selected' : '') + '>' + esc(t[1]) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="f">' + esc(T('الاسم', 'Name')) + '</label><input type="text" id="asN" dir="auto" value="' + esc(x.title) + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('القيمة / الرابط (كود لون، رابط تحميل…)', 'Value / link (colour code, download link…)')) + '</label><input type="text" id="asV" dir="auto" value="' + esc(x.value) + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('الوسوم (مفصولة بفاصلة)', 'Tags (comma separated)')) + '</label><input type="text" id="asG" dir="auto" value="' + esc(x.tags.join(', ')) + '"></div>' +
      '<div class="field"><label class="f">' + esc(T('ملاحظة', 'Note')) + '</label><textarea id="asO" dir="auto" rows="2">' + esc(x.note) + '</textarea></div>' +
      '<div class="row"><button class="btn sm" id="asF">' + I('clip', 'sm') + esc(T('إرفاق ملف', 'Attach a file')) + '</button><span class="hint" id="asFn">' + esc(x.att ? x.att.name : '') + '</span></div>',
    buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: async q => { if (newAtt) await MSA.files.del(newAtt.id); q.close(); } },
      { label: T('حفظ', 'Save'), cls: 'primary', icon: 'check', onClick: async q => {
        const title = $('#asN', q.el).value.trim(); if (!title) { $('#asN', q.el).focus(); return; }
        x.type = $('#asT', q.el).value; x.title = title; x.value = $('#asV', q.el).value.trim(); x.note = $('#asO', q.el).value.trim(); x.tags = [...new Set($('#asG', q.el).value.split(/[,،]/).map(s => s.trim().replace(/^#/, '')).filter(Boolean))];
        if (newAtt) { if (a && a.att) await MSA.files.del(a.att.id); x.att = newAtt; }
        if (a) Object.assign(a, x); else list.unshift(x); save(); q.close(); done();
      } }] });
  $('#asF', m.el).onclick = async () => { const f = await MSA.addFiles('doc'); if (f.length) { if (newAtt) await MSA.files.del(newAtt.id); newAtt = f[0]; for (let i = 1; i < f.length; i++) await MSA.files.del(f[i].id); $('#asFn', m.el).textContent = newAtt.name; } };
}

/* =====================================================================
   9) monthly report
   ===================================================================== */
function report(ym){
  const S_ = S(), ps = S_.projects, now = new Date(); ym = ym || now.getFullYear() + '-' + U.pad(now.getMonth() + 1);
  const inM = ms => { if (!ms) return false; const d = new Date(ms); return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) === ym; };
  const egp = (v, c) => (c && c !== 'EGP' && MSA.rates && MSA.rates.has(c)) ? MSA.rates.toEGP(v, c) : v;
  const done = ps.filter(p => p.status === 'done' && inM(p.completedAt));
  let collected = 0; ps.forEach(p => ((p.pay && p.pay.items) || []).forEach(i => { if (String(i.date || '').slice(0, 7) === ym) collected += egp(+i.amt || 0, (p.time && p.time.cur) || 'EGP'); }));
  const mins = p => ((p.time && p.time.entries) || []).reduce((a, e) => a + e.min, 0);
  const byType = {}; done.forEach(p => { const k = p.type || 'other'; (byType[k] = byType[k] || []).push(mins(p)); });
  const tname = k => { const d = ((MSA.tpl && MSA.tpl.TYPES) || []).find(x => x[0] === k); return d ? MSA.tpl.name(d) : T('أخرى', 'Other'); };
  const cl = {}; ps.forEach(p => { const c = clientOf(p) || T('بدون عميل', 'No client'); const o = cl[c] = cl[c] || { revs: 0, min: 0, n: 0 }; if (inM(p.completedAt) || inM(p.created)) { o.revs += rounds(p); o.min += mins(p); o.n++; } });
  const cls = Object.entries(cl).filter(x => x[1].n).sort((a, b) => (b[1].revs - a[1].revs) || (b[1].min - a[1].min));
  const tough = cls.length && (cls[0][1].revs || cls[0][1].min) ? cls[0] : null;
  const months = []; for (let i = 0; i < 12; i++) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push(d.getFullYear() + '-' + U.pad(d.getMonth() + 1)); }
  const body = () => '<div class="field"><select id="rpM">' + months.map(m => '<option ' + (m === ym ? 'selected' : '') + '>' + m + '</option>').join('') + '</select></div>' +
    '<div class="pay-sum"><div><span>' + esc(T('مشاريع منتهية', 'Finished')) + '</span><b>' + done.length + '</b></div><div><span>' + esc(T('المبالغ المحصّلة', 'Collected')) + '</span><b dir="ltr">' + money(collected) + ' ' + esc(T('ج.م', 'EGP')) + '</b></div><div><span>' + esc(T('ساعات مسجّلة', 'Hours logged')) + '</span><b>' + (done.reduce((a, p) => a + mins(p), 0) / 60).toFixed(1) + '</b></div></div>' +
    '<h4 style="margin:14px 0 6px">' + esc(T('متوسط الوقت لكل نوع', 'Average time per type')) + '</h4>' + (Object.keys(byType).length ? '<table class="st-tbl"><tbody>' + Object.entries(byType).map(([k, v]) => '<tr><td>' + esc(tname(k)) + '</td><td>' + v.length + '</td><td dir="ltr">' + (v.reduce((a, b) => a + b, 0) / v.length / 60).toFixed(1) + ' ' + esc(T('ساعة', 'h')) + '</td></tr>').join('') + '</tbody></table>' : '<div class="hint">' + esc(T('لا مشاريع منتهية في هذا الشهر.', 'No finished projects this month.')) + '</div>') +
    '<h4 style="margin:14px 0 6px">' + esc(T('العملاء', 'Clients')) + '</h4>' + (cls.length ? '<table class="st-tbl"><thead><tr><th></th><th>' + esc(T('تعديلات', 'Revisions')) + '</th><th>' + esc(T('ساعات', 'Hours')) + '</th></tr></thead><tbody>' + cls.map(([c, o]) => '<tr><td dir="auto">' + esc(c) + '</td><td>' + o.revs + '</td><td dir="ltr">' + (o.min / 60).toFixed(1) + '</td></tr>').join('') + '</tbody></table>' : '<div class="hint">—</div>') +
    (tough ? '<div class="hint" style="margin-top:8px">' + esc(T('الأكثر إرهاقًا: ', 'Most demanding: ')) + '<b dir="auto">' + esc(tough[0]) + '</b> (' + tough[1].revs + ' ' + esc(T('تعديل', 'revisions')) + ')</div>' : '');
  const m = MSA.modal({ title: T('تقرير الشهر', 'Monthly report'), size: 'wide', body: body(), buttons: [{ label: T('إغلاق', 'Close'), cls: 'ghost', onClick: q => q.close() }, { label: T('PDF', 'PDF'), icon: 'download', cls: 'primary', onClick: () => { const html = '<div class="pg"><h1>' + esc(T('تقرير الشهر ', 'Monthly report ')) + ym + '</h1>' + $('.mb', m.el).innerHTML.replace(/<select[\s\S]*?<\/select>/, '') + '</div>'; MSA.pdf.flow('report-' + ym + '.pdf', html, { css: 'table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:start}.pay-sum{display:flex;gap:20px}.pay-sum span{display:block;font-size:12px;color:#666}', dir: en() ? 'ltr' : 'rtl' }); } }] });
  $('#rpM', m.el).onchange = e => { m.close(); report(e.target.value); };
}
MSA.pro.report = report;
MSA.proHTML = () => '<div class="sec"><h4>' + I('trophy', 'sm') + esc(T('تقرير الشهر', 'Monthly report')) + '</h4><div class="hint" style="margin-bottom:8px">' + esc(T('مشاريع منتهية، مبالغ محصّلة، متوسط الوقت لكل نوع، والعميل الأكثر تعديلًا.', 'Finished projects, money collected, average time per type and the most revision-heavy client.')) + '</div><button class="btn sm" id="sReport">' + I('presentation', 'sm') + esc(T('عرض التقرير', 'Open report')) + '</button></div>';
MSA.wirePro = el => { const b = $('#sReport', el); if (b) b.onclick = () => report(); };
})();
