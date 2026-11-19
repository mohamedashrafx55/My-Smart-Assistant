/* Voice assistant — command understanding (pure functions, no DOM, no state).
   Rule based Arabic (Egyptian dialect + Modern Standard) command parser. Free, offline, unlimited.
   parse(text, {now:Date, name:'اسم المساعد'}) -> { intent, ... }  ·  best(items, query, getText) -> fuzzy matches.
   Works in the browser (window.VoiceNLP) and in Node (module.exports) so it can be unit-tested. */
(function(root){
'use strict';

/* ---------- normalisation (1:1 so spans in the normalised text map to the original text) ---------- */
const DIAC = /[ً-ٰٟـ]/g;
const MAP = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي' };
const DIG = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9', '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
const PUNCT = /[،,؟?!.؛;:"“”«»()\[\]{}…\-–—_*]/g;
function clean(raw){ return String(raw == null ? '' : raw).replace(DIAC, '').replace(/\s+/g, ' ').trim(); }
const PSET = new Set('،,؟?!.؛;:"“”«»()[]{}…-–—_*'.split(''));
/* d (display text) and n (normalised text) are built together, character for character, so a word in n is the same word in d */
function prep(raw){
  const c = clean(raw), arr = Array.from(c); let d = '', n = '';
  for (let i = 0; i < arr.length; i++) {
    let ch = arr[i], keep = false;
    if ((ch === '.' || ch === ',' || ch === ':' || ch === '٫') && /[0-9٠-٩۰-۹]/.test(arr[i - 1] || '') && /[0-9٠-٩۰-۹]/.test(arr[i + 1] || '')) keep = true;
    if (PSET.has(ch) && !keep) ch = ' ';
    d += ch; n += (DIG[ch] || MAP[ch] || ch).toLowerCase();
  }
  let D = '', N = '';
  for (let i = 0; i < d.length; i++) { if (d[i] === ' ' && (D === '' || D[D.length - 1] === ' ')) continue; D += d[i]; N += n[i]; }
  if (D.endsWith(' ')) { D = D.slice(0, -1); N = N.slice(0, -1); }
  return { d: D, n: N };
}
function norm1(s){ return prep(s).n; }
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ---------- numbers ---------- */
const NUMW = { 'واحده': 1, 'واحد': 1, 'اتنين': 2, 'اثنين': 2, 'ثنتين': 2, 'تنين': 2, 'تلاته': 3, 'ثلاثه': 3, 'تلات': 3, 'اربعه': 4, 'اربع': 4, 'خمسه': 5, 'خمس': 5, 'سته': 6, 'ست': 6, 'سبعه': 7, 'سبع': 7, 'تمانيه': 8, 'ثمانيه': 8, 'تمان': 8, 'تسعه': 9, 'تسع': 9, 'عشره': 10, 'عشر': 10, 'احداشر': 11, 'حداشر': 11, 'اتناشر': 12, 'اثناشر': 12, 'اتنعشر': 12 };
const NUMRE = '(?:\\d{1,4}(?:[.,]\\d+)?|' + Object.keys(NUMW).sort((a, b) => b.length - a.length).join('|') + ')';
const numOf = s => { s = String(s).trim(); if (NUMW[s] != null) return NUMW[s]; const n = parseFloat(s.replace(',', '.')); return isFinite(n) ? n : null; };
const pad = n => (n < 10 ? '0' : '') + n;
const key = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };

const DOW = { 'الاحد': 0, 'احد': 0, 'الاثنين': 1, 'الاتنين': 1, 'اثنين': 1, 'اتنين': 1, 'الثلاثاء': 2, 'التلات': 2, 'التلاتاء': 2, 'الثلاثا': 2, 'ثلاثاء': 2, 'الاربعاء': 3, 'الاربع': 3, 'الاربعا': 3, 'اربعاء': 3, 'الخميس': 4, 'خميس': 4, 'الجمعه': 5, 'جمعه': 5, 'السبت': 6, 'سبت': 6 };
const MONTH = { 'يناير': 0, 'فبراير': 1, 'مارس': 2, 'ابريل': 3, 'مايو': 4, 'يونيو': 5, 'يوليو': 6, 'اغسطس': 7, 'سبتمبر': 8, 'اكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11 };

/* ---------- date & time inside a sentence ----------
   Returns { n: normalised text with the matched spans blanked, date, time, rel } */
function when(n, now){
  let t = ' ' + n + ' ', date = null, time = null, rel = null, ampm = null, explicitPeriod = false;
  const cut = re => { const m = re.exec(t); if (!m) return null; t = t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length); return m; };

  /* relative: بعد ساعتين / بعد 30 دقيقة / كمان ساعه */
  let m = cut(new RegExp('\\s(?:بعد|كمان|خلال|بعد حوالي)\\s+(نص ساعه|ساعه ونص|ساعتين|دقيقتين|يومين|اسبوعين|اسبوع|ربع ساعه|' + NUMRE + '\\s*(?:ساعات|ساعه|دقايق|دقيقه|دقائق|دقيقة|ايام|يوم|اسابيع))(?=\\s|$)'));
  if (m) {
    const w = m[1]; let mins = 0, days = 0;
    if (w === 'نص ساعه') mins = 30; else if (w === 'ساعه ونص') mins = 90; else if (w === 'ساعتين') mins = 120; else if (w === 'دقيقتين') mins = 2; else if (w === 'ربع ساعه') mins = 15;
    else if (w === 'يومين') days = 2; else if (w === 'اسبوعين') days = 14; else if (w === 'اسبوع') days = 7;
    else { const q = new RegExp('^(' + NUMRE + ')\\s*(.+)$').exec(w); const k = q ? numOf(q[1]) : 1, u = q ? q[2] : w; if (/ساع/.test(u)) mins = k * 60; else if (/دق/.test(u)) mins = k; else if (/اسبوع|اسابيع/.test(u)) days = k * 7; else days = k; }
    if (days) { date = key(addDays(now, days)); } else { const d = new Date(now.getTime() + mins * 60000); date = key(d); time = pad(d.getHours()) + ':' + pad(d.getMinutes()); rel = 'minutes'; }
  }
  /* named days */
  if (!date) {
    if (cut(/\s(?:ل|لل)?بعد (?:بكره|بكرا|غد|غدا)(?=\s|$)/)) date = key(addDays(now, 2));
    else if (cut(/\sل?(?:بكره|بكرا|بكرة|غدا|غد)(?=\s|$)/)) date = key(addDays(now, 1));
    else if (cut(/\s(?:لل|ل)?(?:النهارده|النهارد|اليوم|الليله|انهارده)(?=\s|$)/)) date = key(now);
    else if ((m = cut(/\s(?:الاسبوع|اسبوع)\s+(?:الجاي|القادم|اللي جاي|الجايه|الجاى)(?=\s|$)/))) date = key(addDays(now, 7));
    else if ((m = cut(new RegExp('\\s(?:ليوم\\s+|يوم\\s+|لل|ل)?(' + Object.keys(DOW).sort((a, b) => b.length - a.length).join('|') + ')(?:\\s+(?:الجاي|القادم|اللي جاي))?(?=\\s|$)')))) {
      const want = DOW[m[1]]; let diff = (want - now.getDay() + 7) % 7; if (diff === 0) diff = 7; date = key(addDays(now, diff));
    }
    else if ((m = cut(new RegExp('\\s(?:يوم\\s+)?(\\d{1,2})\\s+(?:من\\s+)?(?:شهر\\s+)?(' + Object.keys(MONTH).join('|') + ')(?=\\s|$)')))) {
      let y = now.getFullYear(), d = new Date(y, MONTH[m[2]], +m[1]); if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d = new Date(y + 1, MONTH[m[2]], +m[1]); date = key(d);
    }
    else if ((m = cut(/\sيوم\s+(\d{1,2})(?=\s|$)/))) {
      const dn = +m[1]; let d = new Date(now.getFullYear(), now.getMonth(), dn); if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d = new Date(now.getFullYear(), now.getMonth() + 1, dn); date = key(d);
    }
    else if ((m = cut(/\s(\d{4})-(\d{2})-(\d{2})(?=\s|$)/))) date = m[1] + '-' + m[2] + '-' + m[3];
  }
  /* period of the day (affects am/pm) */
  const per = cut(/\s(?:بعد\s+)?(الضهر|الظهر|ضهرا|ظهرا|العصر|عصرا|المغرب|مغربا|بالليل|بليل|الليل|ليلا|مساء|المسا|الفجر|فجرا|صباحا|الصبح|الصباح|بالنهار)(?=\s|$)/);
  if (per) { explicitPeriod = true; const p = per[1]; ampm = /الفجر|فجرا|صباحا|الصبح|الصباح/.test(p) ? 'am' : 'pm'; if (/الليل|بليل|بالليل|ليلا/.test(p)) ampm = 'night'; }
  /* clock: الساعة 5 ونص / 5:30 / 5 الا ربع / الساعة تلاتة وربع */
  const FR = '(?:\\s*(?:و|ال)?\\s*(نص|ربع|تلت|ثلث|عشره|خمسه|(?:\\d{1,2})\\s*دقيقه)?)';
  const clockRe = new RegExp('\\s(?:الساعه|ساعه|س)\\s+(' + NUMRE + ')(?::(\\d{2}))?(?:(?:\\s+(الا)\\s+|\\s+و\\s*)(نص|ربع|تلت|ثلث|عشره|خمسه|' + NUMRE + '(?:\\s*دقيقه)?))?(?=\\s|$)');
  const bareRe = new RegExp('\\s(\\d{1,2}):(\\d{2})(?=\\s|$)');
  let h = null, mi = 0;
  if ((m = cut(clockRe))) {
    h = numOf(m[1]); if (m[2]) mi = +m[2];
    if (m[4]) { const f = { 'نص': 30, 'ربع': 15, 'تلت': 20, 'ثلث': 20, 'عشره': 10, 'خمسه': 5 }[m[4]] != null ? { 'نص': 30, 'ربع': 15, 'تلت': 20, 'ثلث': 20, 'عشره': 10, 'خمسه': 5 }[m[4]] : numOf(m[4].replace(/\s*دقيقه/, '')); if (f != null) { if (m[3] === 'الا') { h = h - 1; mi = 60 - f; } else mi = f; } }
  } else if ((m = cut(bareRe))) { h = +m[1]; mi = +m[2]; }
  else if ((m = cut(new RegExp('\\s(' + NUMRE + ')\\s+(الا)\\s+(ربع|تلت|ثلث|عشره|خمسه)(?=\\s|$)')))) { h = numOf(m[1]) - 1; mi = 60 - { 'ربع': 15, 'تلت': 20, 'ثلث': 20, 'عشره': 10, 'خمسه': 5 }[m[3]]; }
  else if ((m = cut(new RegExp('\\s(' + NUMRE + ')\\s+(و)\\s*(نص|ربع|تلت|ثلث)(?=\\s|$)')))) { h = numOf(m[1]); mi = { 'نص': 30, 'ربع': 15, 'تلت': 20, 'ثلث': 20 }[m[3]]; }
  if (h == null && ampm && /\s(?:الساعه)\s*$/.test(t) === false) { /* "الساعة" alone with a period but no number -> ignore */ }
  /* explicit am/pm letters right after the number: "5 م" / "5 ص" / "5pm" */
  if (h != null) {
    const ap = /(?:^|\s)(ص|م|am|pm)(?=\s|$)/.exec(t);
    if (ap && !explicitPeriod) { ampm = (ap[1] === 'ص' || ap[1] === 'am') ? 'am' : 'pm'; t = t.replace(ap[0], ' '); explicitPeriod = true; }
    if (h < 0) h += 12; if (h === 0 && !explicitPeriod) h = 12;
    if (explicitPeriod) {
      if (ampm === 'night') { if (h === 12) h = 0; else if (h >= 6 && h <= 11) h += 12; else if (h < 6) { /* 1-5 بالليل = after midnight */ } }
      else if (ampm === 'pm') { if (h < 12) h += 12; }
      else if (ampm === 'am') { if (h === 12) h = 0; }
    } else if (h <= 12) {
      /* no marker: 1-6 → afternoon/evening, 7-11 → morning, 12 → noon; today: pick the next one still ahead */
      const target = date === key(now);
      let guess = h >= 7 && h <= 11 ? h : (h === 12 ? 12 : h + 12);
      if (target && h >= 1 && h <= 11) { const cur = now.getHours() * 60 + now.getMinutes(); const am = h * 60 + mi, pm = (h + 12) * 60 + mi; if (am > cur) guess = h; else if (pm > cur) guess = h + 12; }
      h = guess;
    }
    if (h > 23 || mi > 59) { h = null; } else time = pad(h) + ':' + pad(mi);
  }
  return { n: t.replace(/\s+/g, ' ').trim(), date, time, rel };
}

/* ---------- vocab ---------- */
const NAV = [
  ['done', /(?:ال)?مشاريع (?:ال)?(?:مكتمله|منتهيه|متكامله|خلصانه|الي خلصت)|(?:ال)?اعمال (?:ال)?(?:مكتمله|منتهيه)|الانجازات|المنجزات/],
  ['leads', /(?:ال)?فرص|العملاء (?:ال)?محتملين|الليدز/],
  ['active', /(?:ال)?مشاريع(?: (?:قيد )?(?:ال)?(?:تنفيذ|جاريه|حاليه))?|مشاريعي|شغلي/],
  ['learn', /(?:ال)?تعلم|(?:ال)?تعليم(?: و(?:ال)?تطوير)?|(?:ال)?تطوير|الكورسات|المراجع|الفيديوهات/],
  ['files', /ملفاتي|(?:ال)?ملفات(?: (?:ال)?شخصيه)?|(?:ال)?مستندات/],
  ['tasks', /(?:ال)?مهام(?: و(?:ال)?ملاحظات)?|(?:ال)?ملاحظات|قايمه (?:ال)?مهام|تاسكاتي/],
  ['media', /(?:ال)?ميديا|(?:ال)?موسيقي|(?:ال)?مشغل|(?:ال)?اغاني|الصوتيات/],
  ['reports', /(?:ال)?تقارير|(?:ال)?تقرير|(?:ال)?احصاييات|(?:ال)?احصائيات|(?:ال)?احصاءات/],
  ['money', /(?:ال)?مدفوعات|(?:ال)?فلوس|(?:ال)?ماليات|(?:ال)?حسابات|(?:ال)?ماليه|المستحقات/],
  ['clients', /(?:ال)?عملاء|(?:ال)?كلاينتس|شيت (?:ال)?عملاء/],
  ['guide', /(?:ال)?دليل|شرح (?:ال)?برنامج|(?:ال)?مساعده/],
  ['settings', /(?:ال)?اعدادات|(?:ال)?ضبط|(?:ال)?سيتنجز/],
  ['home', /(?:ال)?(?:صفحه )?(?:ال)?رييسيه|(?:ال)?بدايه|(?:ال)?هوم|(?:ال)?شاشه (?:ال)?رييسيه/]
];
const NAME_AR = { home: 'الرئيسية', active: 'المشاريع قيد التنفيذ', done: 'المشاريع المكتملة', learn: 'التعليم والتطوير', tasks: 'المهام والملاحظات', media: 'الميديا', reports: 'التقارير', settings: 'الإعدادات', money: 'المدفوعات', clients: 'العملاء', leads: 'الفرص', guide: 'الدليل', files: 'ملفاتي' };

const V_ADD = '(?:ضيف|اضيف|اضف|أضف|اضافه|سجل|سجلي|اعمل|اعملي|انشئ|انشي|حط|حطلي|زود|اكتب|اكتبلي|دون|عايز اضيف|عاوز اضيف|محتاج اضيف|ابتكر)';
const V_DONE = '(?:علم|علمي|خلصنا من|خلصنا|خلصت|خلص|انجزت|انجز|كملت|كمل|اتممت|تم|تمت|اعتبر|قفل|قفلت|خلاص خلصت)';
const V_DEL = '(?:احذف|احذفلي|امسح|امسحلي|شيل|شيلي|ازل|ازيل|الغي|الغيلي|مسح)';
const V_MOVE = '(?:اجل|اجلي|غير|غيري|عدل|عدلي|انقل|انقلي|حرك|حركي|بدل|بدلي|اضبط|زحلق)';
const V_OPEN = '(?:افتح|افتحلي|روح|روحلي|خدني|وديني|اعرض|اعرضلي|وريني|ورينا|شوفلي|فتح|اظهر|ودني|ادخل|دخلني|رجعني)';
const V_READ = '(?:اقرا|اقرالي|اقراء|قول|قولي|قوللي|قولى|عرفني|ايه|اي|عندي ايه|وريني|اعرض|اعرضلي|لخص|لخصلي|كام|شوفلي)';
const FILLER = /^(?:لو سمحت |من فضلك |ممكن |يا ريت |عايز |عاوز |اريد |محتاج |عايزك |عاوزك |تعمللي |تعمل لي |تقدر |هل تقدر |ياريت |طيب |يلا |خلاص |اوكي |ok |تمام |بقي |بقى )+/;

const clip = s => s.replace(/\s+/g, ' ').trim();
const CONN = /^(?:ل|لي|ان|اني|انى|انو|ان ال|عشان|علشان|بتاع|بتاعت|اسمها|اسمه|بعنوان|عنوانها|عنوانه|عنوان|هي|هو|اللي اسمها|اللي اسمه|الي اسمها|ب|بـ|في|ف|عن|علي|ع|الي|الى|ال)\s+/;
const CONN_END = /\s+(?:ل|لي|ان|اني|انى|عشان|علشان|في|ف|عن|الي|الى|ب|ع|علي|و)$/;
function tidyTitle(s){
  s = clip(s);
  for (let i = 0; i < 4; i++) { const b = s; s = s.replace(CONN, ''); s = s.replace(CONN_END, ''); s = s.replace(/^(?:مهمه|تاسك|task|ملاحظه|note|مهمة|لي)\s+/, ''); s = clip(s); if (s === b) break; }
  return s;
}
const stripPrefix = (s, re) => clip(s.replace(re, ' '));

/* title in the user's own spelling: map each normalised word back to the word at the same position in d */
function pickOriginal(d, n, titleNorm){
  if (!titleNorm) return '';
  const dt = d.split(' '), nt = n.split(' '), used = new Set();
  return titleNorm.split(' ').map(w => { for (let i = 0; i < nt.length; i++) if (!used.has(i) && nt[i] === w) { used.add(i); return dt[i] || w; } return w; }).join(' ');
}

/* ---------- fuzzy match against existing items ---------- */
function toks(s){ return norm1(s).split(/\s+/).map(w => w.replace(/^ال/, '').replace(/^(?:و|ب|ل|ف)(?=.{4,})/, '')).filter(w => w.length > 1 && !/^(?:مهمه|تاسك|مشروع|ملاحظه|فيديو|الدرس|كورس|من|في|علي|عن|الي|ده|دي|دا|بتاع|بتاعت|بتاعه|ع)$/.test(w)); }
function score(qt, tt){
  if (!qt.length || !tt.length) return 0;
  let hit = 0;
  qt.forEach(q => { if (tt.some(w => w === q || (q.length >= 3 && (w.startsWith(q) || q.startsWith(w)) && Math.min(w.length, q.length) >= 3) || (q.length >= 4 && w.includes(q)))) hit++; });
  const cover = hit / qt.length, prec = hit / tt.length;
  return cover * 0.8 + prec * 0.2;
}
function best(items, query, getText){
  const qt = toks(query); if (!qt.length) return [];
  getText = getText || (x => x);
  return items.map(it => ({ item: it, score: score(qt, toks(getText(it))) })).filter(x => x.score >= 0.55).sort((a, b) => b.score - a.score);
}

/* ---------- command parser ---------- */
function parse(raw, ctx){
  ctx = ctx || {}; const now = ctx.now || new Date();
  const P0 = prep(raw), d0 = P0.d; let n0 = P0.n;
  const out = (o) => Object.assign({ raw: d0 }, o);
  if (!n0.trim()) return out({ intent: 'empty' });
  let n = n0, d = d0;
  /* assistant name prefix: "يا مساعد ..." / "<name> ..." */
  const nm = ctx.name ? prep(ctx.name).n : '';
  { const heads = ['يا مساعد', 'مساعد', 'يا مساعدي'].concat(nm ? ['يا ' + nm, nm] : []); for (const h of heads) { if (n === h) return out({ intent: 'wake' }); if (n.startsWith(h + ' ')) { n = clip(n.slice(h.length)); d = clip(d.slice(h.length)); break; } } }
  { const f = FILLER.exec(n + ' '); if (f && f[0].trim()) { const k = f[0].length; n = clip(n.slice(k)); d = clip(d.slice(k)); } }

  /* ----- short answers ----- */
  if (/^(?:ايوه|ايوا|ايوه اكد|اه|اها|نعم|تمام|اكد|اكده|ماشي|موافق|نفذ|يلا|اوكي|اوك|اكيد|صح|yes|ok|okay|sure|اه اكد|اكد يا مساعد)$/.test(n)) return out({ intent: 'yes' });
  if (/^(?:لا|لأ|لاء|لا خلاص|الغي|الغاء|لغي|مش عايز|بلاش|ماتعملش|ما تعملش|اوعي|مش موافق|no|cancel|stop|وقف|لا شكرا)$/.test(n)) return out({ intent: 'no' });
  if (/^(?:اسكت|اسكتي|كفايه|بس|وقف الصوت|سكت|اهدا|وقف الكلام|بطل كلام)$/.test(n)) return out({ intent: 'stop' });
  if (/^(?:تراجع|ارجع|رجع|رجعه|رجعها|الغي اخر امر|الغاء اخر امر|تراجع عن اخر امر|ارجع في اخر امر|ارجع اخر امر|اتراجع|ارجع في كلامك|الغي اللي عملته|ارجع عن اللي عملته)$/.test(n)) return out({ intent: 'undo' });
  if (/(?:ايه|اي|ما|ماهي|ما هي|قولي|اعرض|عرفني|وريني|اقرا)\s+(?:هي\s+)?(?:ال)?(?:اوامر|امور|الاوامر)|(?:تقدر|تعرف)\s+تعمل\s+(?:ايه|اي)|^(?:ايه|اي)\s+(?:اللي|الي)\s+(?:تقدر|ينفع)|^(?:انت )?(?:تعمل|بتعمل)\s+(?:ايه|اي)$|^مساعده$|^help$|(?:ايه|اي) الجديد في المساعد|اوامر المساعد/.test(n)) return out({ intent: 'help' });

  /* ----- theme & language ----- */
  if (/(?:ليلي|داكن|غامق|دارك|dark|الليل)/.test(n) && /(?:وضع|ثيم|مظهر|فعل|شغل|خلي|حول|غير|ادخل|بدل|dark)/.test(n) && !/(?:اضف|ضيف|مهمه)/.test(n)) return out({ intent: 'theme', value: 'dark' });
  if (/(?:نهاري|فاتح|لايت|light|النهار)/.test(n) && /(?:وضع|ثيم|مظهر|فعل|شغل|خلي|حول|غير|بدل|light)/.test(n) && !/(?:اضف|ضيف|مهمه)/.test(n)) return out({ intent: 'theme', value: 'light' });
  if (/(?:غير|حول|بدل|خلي|حط)\s+(?:ال)?لغه\s+(?:ل|الي|الى|لل)?\s*(?:ال)?(?:انجليزي|انجليزيه|english|انكليزي)/.test(n) || /^(?:english|انجليزي)$/.test(n)) return out({ intent: 'lang', value: 'en' });
  if (/(?:غير|حول|بدل|خلي|حط)\s+(?:ال)?لغه\s+(?:ل|الي|الى|لل)?\s*(?:ال)?(?:عربي|عربيه|arabic)/.test(n)) return out({ intent: 'lang', value: 'ar' });

  /* ----- payments: "سجل دفعة 500 من أحمد" / "استلمت 2000 جنيه من مشروع الرحاب" ----- */
  { const m = new RegExp('(?:^|\\s)(?:' + V_ADD + '|استلمت|قبضت|وصلني|وصلت|اخدت|استلم|قبض|حصلت|حصل)\\s*(?:لي\\s+)?(?:دفعه|دفعة|مبلغ|فلوس|عربون|قسط|تحويل)?\\s*(?:بقيمه|بمبلغ|قدرها|قيمتها)?\\s*(\\d+(?:[.,]\\d+)?)\\s*(الف|الاف|ألف|k)?\\s*(?:جنيه|جنية|ج\\.?م|جم|egp|دولار|usd|\\$|ريال|يورو|درهم)?\\s*(?:من|ل|لـ|على|علي|في|فى|لمشروع|للمشروع|مشروع|عميل|للعميل|من العميل|من مشروع)?\\s*(.*)$').exec(n);
    if (m && /(?:دفعه|دفعة|مبلغ|فلوس|عربون|قسط|تحويل|استلمت|قبضت|وصلني|وصلت|اخدت|حصلت|جنيه|جم|دولار)/.test(n) && !/(?:مهمه|تاسك|ملاحظه)/.test(n)) {
      let amt = parseFloat(m[1].replace(',', '.')); if (m[2]) amt *= 1000;
      const cur = /دولار|usd|\$/.test(n) ? 'USD' : /ريال/.test(n) ? 'SAR' : /يورو/.test(n) ? 'EUR' : /درهم/.test(n) ? 'AED' : null;
      const who = tidyTitle(m[3].replace(/^(?:مشروع|عميل|العميل|المشروع|دفعه|ال)\s+/, ''));
      if (amt > 0) return out({ intent: 'add_payment', amount: amt, cur, who, whoOrig: pickOriginal(d, n, who) });
    }
  }
  /* money summary */
  if (new RegExp('(?:' + V_READ + ').*(?:مستحقات|فلوس(?: الي| اللي)? (?:لسه|لسا)|متبقي|المتبقي|الفلوس الي لسه|مديونيه|محصلتش|ماتحصلتش|الناس الي عليها فلوس)|(?:كام|ايه).*(?:مستحقات|المتبقي)').test(n)) return out({ intent: 'read_money' });

  /* ----- open / go ----- */
  { const m = new RegExp('^(?:' + V_OPEN + ')(?:\\s+|$)(?:لي\\s+)?(?:(?:ل|الي|الى|علي|على)\\s+)?(?:(?:صفحه|صفحة|قسم|شاشه|تبويب|قايمه)\\s+)?(.+)$').exec(n);
    if (m) {
      const rest = clip(m[1]);
      /* settings → voice tab */
      if (/(?:اعدادات )?(?:ال)?مساعد (?:ال)?صوتي|اعدادات (?:ال)?صوت/.test(rest)) return out({ intent: 'open', target: 'settings', section: 'voice' });
      if (/(?:الروتين|روتيني|الروتين اليومي)/.test(rest)) return out({ intent: 'show_routine' });
      if (/(?:بحث|البحث)(?: الشامل)?$/.test(rest)) return out({ intent: 'search', query: '' });
      const proj = /^(?:مشروع|بروجكت)\s+(.+)$/.exec(rest); if (proj) return out({ intent: 'open_project', query: tidyTitle(proj[1]) });
      const cli = /^(?:العميل|عميل|كلاينت)\s+(.+)$/.exec(rest); if (cli) return out({ intent: 'open_client', query: tidyTitle(cli[1]) });
      const cands = [rest, rest.replace(/^لل/, 'ال'), rest.replace(/^ل/, '')];
      for (const c of cands) for (const [id, re] of NAV) { const r2 = new RegExp('^(?:' + re.source + ')$'); if (r2.test(c)) return out({ intent: 'open', target: id }); }
      for (const c of cands) for (const [id, re] of NAV) { const r2 = new RegExp('^(?:' + re.source + ')(?:\\s|$)'); if (r2.test(c) && c.split(' ').length <= 3) return out({ intent: 'open', target: id }); }
      if (!/(?:مهمه|تاسك|ملاحظه)/.test(rest)) return out({ intent: 'open_project', query: tidyTitle(rest), loose: true });
    }
    for (const [id, re] of NAV) { if (new RegExp('^(?:' + re.source + ')$').test(n)) return out({ intent: 'open', target: id }); }
  }

  /* ----- search ----- */
  { const m = /^(?:ابحث|دور|دورلي|فتش|لاقي|لاقيلي|بحث)\s*(?:لي\s+)?(?:عن|ع|علي|على|في)?\s*(.*)$/.exec(n);
    if (m) { const q = tidyTitle(m[1]); return out({ intent: 'search', query: pickOriginal(d, n, q) }); } }

  /* ----- read tasks / day plan ----- */
  { const w = when(n, now);
    const asksRead = new RegExp('^(?:' + V_READ + ')(?=\\s|$)').test(n) || /^(?:مهامي|جدولي|يومي|برنامجي|عندي ايه|ورايا ايه|ايه الي ورايا|ايه اللي ورايا)/.test(n);
    if (asksRead && /(?:مهام|مهمه|ورايا|عندي|جدول|برنامج|يومي|يوم|اجندا|الي ورايا|اللي ورايا|مواعيد)/.test(n) && !new RegExp('^' + V_ADD).test(n) && !/(?:فيديو|مشروع|فلوس|مدفوعات|روتين)/.test(n)) {
      return out({ intent: 'read_tasks', date: w.date || key(now), count: /^كام|كام مهمه|عدد/.test(n) });
    }
    if (/(?:روتين|الروتين)/.test(n) && asksRead) return out({ intent: 'show_routine', speak: true });
  }

  /* ----- notes: "اكتب ملاحظة ..." ----- */
  { const m = new RegExp('^(?:' + V_ADD + ')(?:\\s+|$)(?:لي\\s+)?(?:ملاحظه|نوت|note|مذكره|فكره)\\s*(.*)$').exec(n);
    if (m) { const t = tidyTitle(m[1]); return out({ intent: 'add_note', title: pickOriginal(d, n, t) }); } }

  /* ----- delete ----- */
  { const m = new RegExp('^(?:' + V_DEL + ')(?:\\s+|$)(?:لي\\s+)?(?:(?:ال)?(?:مهمه|تاسك|ملاحظه)\\s+)?(.+)$').exec(n);
    if (m && !/(?:مشروع|عميل|فيديو|دفعه)/.test(m[1])) { const q = tidyTitle(m[1]); if (q) return out({ intent: 'delete_task', query: pickOriginal(d, n, q) }); } }

  /* ----- reschedule ----- */
  { const m = new RegExp('^(?:' + V_MOVE + ')(?:\\s+|$)(?:لي\\s+)?(?:(?:ميعاد|موعد|وقت|معاد|تاريخ)\\s+)?(?:(?:ال)?(?:مهمه|تاسك|ملاحظه)\\s+)?(.+)$').exec(n);
    if (m) { const w = when(m[1], now); if (w.date || w.time) { const q = tidyTitle(w.n.replace(/\s+(?:ل|الي|الى|ليوم|لتاريخ|لساعه|للساعه)(?=\s|$)/g, ' ').replace(/\s+(?:ل|الي|الى|ليوم)$/, '')); if (q) return out({ intent: 'reschedule', query: pickOriginal(d, n, q), date: w.date, time: w.time }); } } }

  /* study mark: "علّم فيديو X انه اتذاكر" / "خلصت فيديو X" */
  { const m = new RegExp('^(?:' + V_DONE + '|ذاكرت|درست|اتفرجت علي|اتفرجت على|شفت)(?:\\s+|$)(?:لي\\s+)?(?:ال)?(?:فيديو|درس|كورس|مصدر|مرجع|محاضره)\\s+(.+)$').exec(n);
    if (m) { const q = tidyTitle(m[1].replace(/(?:\s+(?:كمنتهي|كمنتهيه|انه|انها|اتذاكر|اتذاكره|خلص|خلصت|خلصان|منتهي))+$/, '')); if (q) return out({ intent: 'study_done', query: pickOriginal(d, n, q) }); } }

  /* ----- complete: "خلصت تصميم البوستر" / "علّم مهمة X كمنتهية" ----- */
  { const m = new RegExp('^(?:' + V_DONE + ')(?:\\s+|$)(?:لي\\s+)?(?:(?:ال)?(?:مهمه|تاسك)\\s+)?(.+)$').exec(n);
    if (m && !/^(?:ال)?(?:فيديو|درس|كورس|مصدر|مرجع)/.test(m[1])) {
      let q = m[1].replace(/\s+(?:كمنتهيه|كمنتهي|كمكتمله|كمكتمل|منتهيه|منتهي|انها|انو|انه)?\s*(?:خلصت|خلصانه|خلصان|اتعملت|تمت|اتنفذت|اتنجزت|منتهيه|مكتمله|كمنتهيه)?$/, '').replace(/\s+(?:كمنتهيه|كمنتهي|كمكتمله|كمكتمل|كمنجزه|خلاص)$/, '');
      q = tidyTitle(q);
      if (q) return out({ intent: 'complete_task', query: pickOriginal(d, n, q) });
    } }
  /* ----- add task / reminder ----- */
  { const addRe = new RegExp('^(?:' + V_ADD + ')(?:\\s+|$)(?:لي\\s+)?(?:مهمه|مهمة|تاسك|task|موعد|ميعاد|تذكير|تنبيه|منبه)?\\s*(.*)$');
    const remRe = /^(?:ذكرني|فكرني|نبهني|فكرنى|فكرني ب|ذكرني ب|نبهني ب|خليك فاكر|هاتلي تنبيه|اعملي تذكير|ظبطلي تنبيه|ضبطلي تنبيه|اضبط تنبيه|اضبطلي تنبيه)\s*(.*)$/;
    let m = remRe.exec(n), remind = false, rest;
    if (m) { remind = true; rest = m[1]; }
    else if ((m = addRe.exec(n)) && /(?:مهمه|مهمة|تاسك|task|موعد|ميعاد|تذكير|تنبيه|منبه)/.test(n.slice(0, 40))) { remind = /تذكير|تنبيه|منبه/.test(n.slice(0, 40)); rest = m[1]; }
    else if ((m = addRe.exec(n)) && m[1] && !/(?:دفعه|مشروع|عميل|ملاحظه|فيديو|رابط|مرجع|صوره|صور)/.test(n)) { rest = m[1]; }
    if (rest != null) {
      const w = when(rest, now);
      let title = tidyTitle(w.n);
      title = title.replace(/^(?:اني|ان|انى|اني |ان اني)\s+/, '');
      if (!title) return out({ intent: 'add_task', title: '', date: w.date, time: w.time, remind, missing: 'title' });
      return out({ intent: 'add_task', title: pickOriginal(d, n, title), date: w.date, time: w.time, remind: remind || !!w.time && /(?:ذكرني|نبهني|فكرني)/.test(n) });
    } }

  /* a bare "<title> بكره الساعة 3" without a verb is not guessed */
  return out({ intent: 'unknown' });
}

/* ---------- speech helpers ---------- */
const AR_NUM = ['صفر', 'واحدة', 'اتنين', 'تلاتة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'تمانية', 'تسعة', 'عشرة', 'حداشر', 'اتناشر'];
function sayTime(hm){
  const m = /^(\d\d):(\d\d)$/.exec(hm || ''); if (!m) return '';
  let h = +m[1], mi = +m[2]; const per = h < 5 ? 'بالليل' : h < 12 ? 'الصبح' : h < 15 ? 'الضهر' : h < 17 ? 'العصر' : h < 20 ? 'المغرب' : 'بالليل';
  let h12 = h % 12; if (h12 === 0) h12 = 12;
  let frac = mi === 0 ? '' : mi === 30 ? ' ونص' : mi === 15 ? ' وربع' : mi === 45 ? ' إلا ربع' : ' و' + mi + ' دقيقة';
  if (mi === 45) { h12 = (h12 % 12) + 1; }
  return 'الساعة ' + AR_NUM[h12] + frac + ' ' + per;
}
function sayDate(k, now){
  const t = key(now), tm = key(addDays(now, 1)), at = key(addDays(now, 2));
  if (k === t) return 'النهارده'; if (k === tm) return 'بكرة'; if (k === at) return 'بعد بكرة';
  const d = new Date(k + 'T00:00'); const names = ['الأحد', 'الاثنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
  const diff = Math.round((d - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
  if (diff > 0 && diff < 7) return 'يوم ' + names[d.getDay()];
  return 'يوم ' + d.getDate() + '/' + (d.getMonth() + 1);
}

const COMMANDS = [
  { g: 'المهام', ex: ['ضيف مهمة تصميم بوستر بكرة الساعة ٣', 'ذكّرني أكلم العميل بعد ساعتين', 'اكتب ملاحظة فكرة الفيديو الجديد'] },
  { g: 'التعديل', ex: ['خلّصت تصميم بوستر', 'أجّل مهمة المونتاج ليوم الخميس الساعة ٧', 'احذف مهمة الاجتماع'] },
  { g: 'أوامر جماعية', ex: ['احذف جميع المهام المجدولة', 'احذف كل المهام واترك مهام بكرة', 'خلّص كل مهام النهارده', 'أجّل كل مهام النهارده لبكرة', 'رجّع كل المهام المنتهية'] },
  { g: 'قوائم وعدّ', ex: ['قائمة المهام والملاحظات', 'اعرض المهام المتأخرة', 'كام مهمة متأخرة', 'ملخص اليوم', 'إيه مشاريعي'] },
  { g: 'الاستعلام', ex: ['إيه مهامي النهارده', 'قولي مهام بكرة', 'إيه المستحقات'] },
  { g: 'التنقل', ex: ['افتح المدفوعات', 'افتح مشروع الرحاب', 'ابحث عن لوجو'] },
  { g: 'المدفوعات', ex: ['سجّل دفعة ٥٠٠ من الرحاب', 'استلمت ٢٠٠٠ جنيه من أحمد'] },
  { g: 'التعلم', ex: ['علّم فيديو الإضاءة إنه خلص'] },
  { g: 'الإعدادات', ex: ['فعّل الوضع الليلي', 'غيّر اللغة للإنجليزي', 'تراجع'] }
];

const api = { parse, when, best, clean, norm1, sayTime, sayDate, key, addDays, NAME_AR, COMMANDS, toks };
root.VoiceNLP = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
