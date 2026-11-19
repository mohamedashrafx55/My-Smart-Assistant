/* Smart local layer for the voice assistant (no network, no key). Pure logic — also loaded by node for unit tests.
   Understands what the single-item rules in voice-nlp.js cannot:
   - bulk commands with filters:  "احذف جميع المهام المجدولة" · "خلّص كل مهام النهارده" · "أجّل كل مهام النهارده لبكرة"
   - list / count queries:        "قائمة المهام والملاحظات" · "كام مهمة متأخرة" · "اعرض الملاحظات المثبتة"
   - summary, rename/reopen/priority/pin of one item, several tasks in one sentence
   - tolerant to speech-recognition slips ("بقائمة", "اترك" for "اقرأ", "قم بحذف" ...)
   Output is a PLAN: { intent:'plan', ops:[...], why } executed by voice.js (EX.plan), with confirm + undo.
   pre(text)  -> plan for bulk/filtered commands (runs BEFORE the single-item rules)
   post(text) -> plan for anything else the rules did not understand (runs when intent === 'unknown')
   suggest(text) -> up to 3 example commands closest to the text (for "did you mean") */
(function(root){
'use strict';
const NLP = root.VoiceNLP || (typeof require !== 'undefined' ? require('./voice-nlp.js') : null);
if (!NLP) return;
const norm = NLP.norm1, clip = s => String(s || '').replace(/\s+/g, ' ').trim();
const W = a => new RegExp('(?:^|\\s)(?:' + a + ')(?=\\s|$)');

/* ---------------- vocabulary (all normalized: no hamza/diacritics, ة→ه, ى→ي) ---------------- */
const R = {
  open:    W('افتح|افتحلي|افتحي|روح|روحلي|خدني|وديني|ودني|ادخل|دخلني|فتح|انتقل'),
  del:     W('ب?(?:احذف|احذفلي|احذفي|احذفهم|احذفها|حذف|امسح|امسحلي|امسحي|امسحهم|امسحها|مسح|شيل|شيلي|شيلهم|شيلها|ازل|ازيل|ازاله|ازالتهم|نظف|نظفلي|تنظيف|فضي|فضيلي|فضيهم|ارمي|الغي|الغيلي|الغاء|الغيهم|الغيها)|تخلص من|ريحني من|اتخلص من'),
  reopen:  W('ب?(?:رجع|رجعي|رجعلي|رجعهم|رجعها|ارجع|ارجعهم|ارجعها|اعاده فتح|اعد فتح|افتح تاني|فتحهم تاني|فعل تاني|فعلهم تاني|شغل تاني|الغي انجاز|الغي اتمام|الغي الانجاز)'),
  doneV:   W('ب?(?:خلص|خلصت|خلصنا|خلصي|خلصهم|خلصها|انجز|انجزت|انجزي|انجزهم|كمل|كملت|اكمل|اكملهم|اتمم|اتممت|انهي|انهيت|انهاء|انهيهم|اقفل|قفل|اقفلهم|قفلهم|اغلق)'),
  mark:    W('علم|علمي|علمهم|علمها|اعتبر|اعتبري|اعتبرهم|اعتبرها|حط|حطهم|حطها|خلي|خليهم|خليها|ضع|اجعل|اجعلهم'),
  doneAdj: W('منتهي|منتهيه|مكتمل|مكتمله|منجز|منجزه|منجزين|خلصان|خلصانه|خلصانين|تم|تمت|كمنتهي|كمكتمل|كمنتهيه|كمكتمله|كمنجزه|كمنجز|منتهين|مكتملين'),
  undoneAdj: /(?:^|\s)(?:غير|مش|لسه|لسا|ما)\s*(?:ال)?(?:منتهي|منتهيه|مكتمل|مكتمله|منجز|منجزه|خلصان|خلصانه|خلصت|خلص|تمت|تم|منتهين|مكتملين)/,
  move:    W('اجل|اجلي|اجلهم|اجلها|تاجيل|وجل|اجلو|حرك|حركي|انقل|انقلي|غير ميعاد|غير موعد|غير تاريخ|غيري ميعاد|غيري موعد|زحلق|بدل ميعاد|بدل موعد'),
  count:   W('كام|كم|عدد|اجمالي|مجموع|احسب|احسبلي|عدلي|حساب'),
  list:    W('اعرض|اعرضلي|اعرضها|اعرضهم|وريني|ورني|ورينا|شوفلي|شوف|اقرا|اقرالي|اقراء|اقرأ|اترك|اتركلي|قول|قولي|قوللي|عرفني|هات|هاتلي|جيب|جيبلي|ايه|اي|ما هي|ماهي|ما هو|مين|فين|عندي|لدي|قايمه|قايمة|لسته|لست|لستة|بقايمه|بقايمه|بلسته|ملخص|لخصلي|لخص|اظهر|اظهرلي|عايز اشوف|عاوز اشوف|اشوف|اشوفها|اشوفهم|ابغي|show|list'),
  listN:   W('ب?(?:قايمه|قايمة|لسته|لستة|لست|جدول)'),
  summary: /(?:^|\s)(?:ملخص|لخص|لخصلي|خلاصه|نظره عامه|ايه الاخبار|ايه الجديد|عامل ايه|يومي ايه|ايه اللي ورايا|ايه الي ورايا|ورايا ايه|ايه ورايا|ايه اللي ورايا|ايه الي ورايا|اشتغل ايه|ابدا بايه|ابدا بإيه|اعمل ايه|اركز علي ايه)(?=\s|$)/,
  rename:  /(?:^|\s)(?:غير|غيري|بدل|بدلي|عدل|عدلي|سمي|سميلي)\s+(?:ال)?(?:اسم|عنوان)\s+(?:ال)?(?:مهمه|ملاحظه|تاسك|نوت)?\s*(.+?)\s+(?:ل|الي|الى|لـ|ليكون|يبقي|تبقي|ب)\s*(.+)$/,
  prio:    /(?:^|\s)(?:خلي|خليها|خليهم|اجعل|اجعلها|اجعلهم|حط|حطها|حطهم|علم|علمها|علمهم|غير اولويه|غيري اولويه|اولويه|ضع)\s*(?:ال)?(?:مهمه|مهام|تاسك)?\s*(.*?)\s*(?:اولويه|اهميه)?\s*(?:ال)?(عاجل|عاجله|مستعجل|مستعجله|urgent|مهمه جدا|مهم جدا|عاليه|عالي|high|اهميه عاليه|عادي|عاديه|normal|منخفضه|منخفض|واطيه|واطي|low|مش مهمه|مش مهم)(?=\s|$)/,
  pin:     W('ثبت|ثبتلي|ثبتها|ثبتهم|تثبيت|دبس|دبسها|دبسهم'),
  unpin:   W('الغي تثبيت|فك تثبيت|الغاء تثبيت|فكها من التثبيت|فك التثبيت'),
  add:     W('ضيف|ضيفلي|اضيف|اضف|اضافه|سجل|سجلي|انشئ|انشي|اعمل|اعملي|حط|حطلي|زود|اكتب|اكتبلي|دون|ذكرني|فكرني|نبهني'),
  all:     W('جميع|كل|كافه|كلها|كلهم|الكل|كلو|كله|بالكامل|بالجمله|جمله|جميعها|جميعهم|عمومي|ولا مهمه|كلهن'),
  everything: /(?:^|\s)(?:كل|جميع)\s+(?:حاجه|شي|شيء|شئ|حاجات|الاشياء|الاشيا|اشياء)(?=\s|$)/
};
const TOK_TASK_PL = /^[وبلفك]?(?:ال)?(?:مهام|مهامي|مهامنا|تاسكات|تاسكاتي|تاسكاتنا|اعمال|المهمات|مهمات)$/;
const TOK_TASK_SG = /^[وبلفك]?(?:ال)?(?:مهمه|مهمتي|تاسك|مهمتنا)$/;
const TOK_NOTE_PL = /^[وبلفك]?(?:ال)?(?:ملاحظات|ملاحظاتي|ملاحظاتنا|نوتات|نوتاتي|مذكرات|مذكراتي|ملحوظات|ملاحظتين|ملاحظاتك)$/;
const TOK_NOTE_SG = /^[وبلفك]?(?:ال)?(?:ملاحظه|ملاحظتي|نوت|مذكره|ملحوظه|ملحوظتي)$/;
const TOK_PROJ = /^[وبلفك]?(?:ال)?(?:مشاريع|مشاريعي|مشروع|مشروعي|بروجكتات|بروجكت)$/;
const TOK_CLIENT = /^[وبلفك]?(?:ال)?(?:عملاء|عميل|كلاينتس|كلاينت|عملايا)$/;

/* words that carry no filtering meaning once the verb/object/filters are removed */
const NOISE = new Set(('الموجوده موجوده الموجودين الحاليه حاليه عندي عندنا بتاعتي بتاعتنا بتاعي دي دول ده دا هنا الي اللي التي الذي فيه في فى من علي علي عن الان دلوقتي خالص نهائيا للابد ثم و ف ب ل لل لي ليا ال البرنامج التطبيق جدول الجدول جداول قايمه القايمه لسته اللستة كلها كلهم كل جميع الجميع كافه كله الكل يا مساعد لو سمحت من فضلك ممكن يلا بقا بقى طيب معلش ياريت يا ريت عايز عاوز اريد محتاج قم قوم قومي ب انت انتي ان انه انها يعني بس برضو كمان تماما بالكامل بالجمله هي هو هم المسجله مسجله المسجلين المخزنه مخزنه اللي عملتها عملتها كتبتها ضفتها المضافه الي ضفتها ضفتهم الى لدي لديه جميعا حذف حاجه حاجات شي شيء اشياء الاشياء الاشيا وفقط فقط وبس').split(/\s+/));

/* ---------------- parsing helpers ---------------- */
const tokens = n => n.split(' ').filter(Boolean);
function objectOf(n){
  const tk = tokens(n); const o = { task: 0, note: 0, tpl: false, npl: false, proj: false, client: false };
  tk.forEach(w => {
    if (TOK_TASK_PL.test(w)) { o.task++; o.tpl = true; } else if (TOK_TASK_SG.test(w)) o.task++;
    if (TOK_NOTE_PL.test(w)) { o.note++; o.npl = true; } else if (TOK_NOTE_SG.test(w)) o.note++;
    if (TOK_PROJ.test(w)) o.proj = true;
    if (TOK_CLIENT.test(w)) o.client = true;
  });
  if (R.everything.test(' ' + n + ' ')) { o.task++; o.note++; o.tpl = o.npl = true; o.every = true; }
  o.type = o.task && o.note ? 'both' : o.note ? 'note' : o.task ? 'task' : '';
  o.plural = (o.type === 'task' && o.tpl) || (o.type === 'note' && o.npl) || (o.type === 'both' && (o.tpl || o.npl));
  return o;
}
const DATEWORD = /(?:^|\s)(?:النهارده|انهارده|النهاردا|اليوم|بكره|بكرا|غدا|غد|امبارح|امس|الاسبوع|اسبوع|الشهر|بعد بكره|يوم)(?=\s|$)/;

/* what to keep, from the sentence, as filters */
function filtersOf(n, now, verbKind, obj){
  const f = { type: obj.type || 'task', status: 'any', due: '', text: '', pinned: null, prio: '', _used: [] };
  let s = ' ' + n + ' ';
  const take = (re, fn) => { const m = re.exec(s); if (!m) return false; s = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length); if (fn) fn(m); return true; };

  // free-text filter: "اللي فيها اجتماع" / "بخصوص الرحاب" / "عن اللوجو"
  take(/\s(?:اللي|الي|التي|الذي)?\s*(?:فيها|فيهم|بيها|عنوانها|عنوانهم|اسمها|اسمهم|تحتوي علي|تحتوي|تحتوى|بعنوان|بخصوص|بتاعت|بتاعه|تخص|عن|فيه)\s+(.+?)\s*$/, m => { f.text = clip(m[1].replace(/^(?:كلمه|كلمة|لفظ|اسم)\s+/, '')); });

  take(/\s(?:اللي|الي|التي|الذي)?\s*(?:ال)?(?:خاصه|متعلقه|خاصين|متعلقين)\s*ب(?:ال)?\s*(\S.*?)\s*$/, m => { if (!f.text) f.text = clip(m[1]); });

  // done / open / scheduled flags
  const undone = take(R.undoneAdj);
  if (undone) f.status = 'open';
  if (!undone && verbKind !== 'done' && verbKind !== 'mark') {
    if (take(/\s(?:ال)?(?:منتهي|منتهيه|منتهين|مكتمل|مكتمله|مكتملين|منجز|منجزه|منجزين|خلصان|خلصانه|خلصانين|المنجزات|الانجازات|الي خلصت|اللي خلصت|الي اتنفذت|اللي اتنفذت|تمت)\s/)) f.status = 'done';
  }
  if (f.status === 'any' && take(/\s(?:ال)?(?:مفتوحه|مفتوحين|متبقيه|الباقيه|باقيه|لسه|لسا|الجاريه|جاريه|قيد التنفيذ|نشطه|معلقه|الي لسه|اللي لسه|الي ماخلصتش|اللي ماخلصتش)\s/)) f.status = 'open';
  if (take(/\s(?:ال)?(?:غير مجدوله|بدون ميعاد|من غير ميعاد|بدون موعد|من غير موعد|ملهاش ميعاد|مالهاش ميعاد|ملهاش موعد|بلا موعد|بدون تاريخ|من غير تاريخ|بلا تاريخ)\s/)) f.due = 'none';
  else if (take(/\s(?:ال)?(?:مجدوله|مجدولين|مجدول|ليها ميعاد|فيها ميعاد|ليها موعد|فيها موعد|بمواعيد|بميعاد|بموعد|ذات موعد|ذات ميعاد|ليها تاريخ|بتاريخ|مؤقته|مواعيدها)\s/)) f.due = 'has';
  if (take(/\s(?:ال)?(?:متاخره|متاخرين|متاخرات|فايته|فاتت|فايتين|عدي ميعادها|عدت ميعادها|عدي موعدها|منتهي ميعادها|التاخير|المتاخر|المتاخرات|لسه ما اتعملتش)\s/)) { f.due = 'overdue'; if (f.status === 'any') f.status = 'open'; }
  if (take(/\s(?:ال)?(?:مثبته|مثبتين|المثبتات|مثبتات|المثبت|مدبسه)\s/)) f.pinned = true;
  if (take(/\s(?:ال)?(?:عاجله|عاجل|مستعجله|مستعجل|مهمه جدا|مهم جدا|ذات الاولويه|ذات اولويه|اولويه عاليه|الاولويه العاليه|الاولويه|الحرجه)\s/)) f.prio = 'high';
  else if (take(/\s(?:ال)?(?:منخفضه الاولويه|واطيه|واطي|اقل اهميه|قليله الاهميه)\s/)) f.prio = 'low';

  // periods
  if (!f.due || f.due === 'has') {
    if (take(/\s(?:ال)?(?:اسبوع)\s+(?:الجاي|الجايه|القادم|القادمه|اللي جاي|الي جاي)\s/)) f.due = 'nextweek';
    else if (take(/\s(?:هذا |ده |دا )?(?:ال)?اسبوع(?: ده| دا| هذا| الحالي| الحاليه)?\s/)) f.due = 'week';
    else if (take(/\s(?:هذا |ده |دا )?(?:ال)?شهر(?: ده| دا| هذا| الحالي)?\s/)) f.due = 'month';
  }
  // single day / date via the shared date parser (only when no stronger due filter yet)
  if (!f.due || f.due === 'has') {
    const w = NLP.when(clip(s), now);
    if (w.date) { f.due = 'date:' + w.date; f._dateOnly = true; s = ' ' + w.n + ' '; }
  }
  f._rest = clip(s);
  return f;
}

/* leftover words after removing known grammar */
function leftover(n, obj, extraRegexes){
  let s = ' ' + n + ' ';
  [R.open, R.del, R.reopen, R.doneV, R.mark, R.move, R.count, R.list, R.listN, R.add, R.all, R.pin, R.unpin].forEach(re => { let g; while ((g = re.exec(s))) s = s.slice(0, g.index) + ' ' + s.slice(g.index + g[0].length); });
  (extraRegexes || []).forEach(re => { s = s.replace(re, ' '); });
  const left = tokens(s).filter(w => !TOK_TASK_PL.test(w) && !TOK_TASK_SG.test(w) && !TOK_NOTE_PL.test(w) && !TOK_NOTE_SG.test(w) && !NOISE.has(w) && !NOISE.has(w.replace(/^[وبلف](?=ال)/, '')) && !/^\d+$/.test(w));
  return left;
}

function describe(f){
  const t = f.type === 'note' ? 'الملاحظات' : f.type === 'both' ? 'المهام والملاحظات' : 'المهام';
  const parts = [t];
  if (f.status === 'done') parts.push('المنتهية'); else if (f.status === 'open' && f.due !== 'overdue') parts.push('غير المنتهية');
  if (f.due === 'has') parts.push('المجدولة'); else if (f.due === 'none') parts.push('اللي من غير ميعاد'); else if (f.due === 'overdue') parts.push('المتأخرة');
  else if (f.due === 'week') parts.push('بتاعة الأسبوع ده'); else if (f.due === 'nextweek') parts.push('بتاعة الأسبوع الجاي'); else if (f.due === 'month') parts.push('بتاعة الشهر ده');
  else if (/^date:/.test(f.due)) parts.push('بتاعة ' + NLP.sayDate(f.due.slice(5), new Date()));
  if (f.pinned) parts.push('المثبتة'); if (f.prio === 'high') parts.push('العاجلة'); if (f.prio === 'low') parts.push('قليلة الأهمية');
  if (f.text) parts.push('اللي فيها «' + f.text + '»');
  if (f.not) parts.push('ما عدا ' + describe(f.not));
  return parts.join(' ');
}

/* ---------------- matching tasks (pure; used by voice.js and by the tests) ---------------- */
function match(tasks, f, ctx){
  ctx = ctx || {}; const now = ctx.now || new Date(), toMs = ctx.toMs || (v => { if (v == null || v === '') return null; const t = typeof v === 'number' ? v : Date.parse(v); return isFinite(t) ? t : null; });
  const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = key(now), day = x => { const m = toMs(x.due); return m == null ? '' : key(new Date(m)); };
  const plus = k => key(NLP.addDays(now, k));
  const qn = f.text ? norm(f.text) : '';
  const keep = f.not ? new Set(match(tasks, Object.assign({}, f.not, { not: null, routineToo: f.routineToo }), ctx).map(x => x.id)) : null;
  return tasks.filter(x => {
    if (keep && keep.has(x.id)) return false;
    if (!f.routineToo && x.routine) return false;
    if (f.ids && f.ids.length) { if (!f.ids.includes(x.id)) return false; }
    const isNote = x.type === 'note';
    if (f.type === 'task' && isNote) return false; if (f.type === 'note' && !isNote) return false;
    if (f.status === 'open' && x.status === 'done') return false; if (f.status === 'done' && x.status !== 'done') return false;
    const d = day(x);
    if (f.due === 'has' && !d) return false; if (f.due === 'none' && d) return false;
    if (f.due === 'today' && d !== today) return false;
    if (f.due === 'overdue') { const m = toMs(x.due); if (m == null || m >= now.getTime() || x.status === 'done' || isNote) return false; }
    if (f.due === 'week') { if (!d || d < today || d > plus(6)) return false; }
    if (f.due === 'nextweek') { if (!d || d < plus(7) || d > plus(13)) return false; }
    if (f.due === 'month') { if (!d || d.slice(0, 7) !== today.slice(0, 7)) return false; }
    if (/^date:/.test(f.due || '') && d !== f.due.slice(5)) return false;
    if (f.pinned === true && !x.pinned) return false;
    if (f.prio === 'high' && !(x.priority === 'high' || x.priority === 'urgent')) return false;
    if (f.prio === 'low' && x.priority !== 'low') return false;
    if (qn) { const hay = norm((x.title || '') + ' ' + String(x.desc || '').replace(/<[^>]+>/g, ' ')); const qt = NLP.toks(f.text); const ok = hay.includes(qn) || (qt.length && NLP.best([hay], f.text, s => s).length > 0); if (!ok) return false; }
    return true;
  });
}

/* ---------------- date target for "postpone ... to X" ---------------- */
function splitTarget(n, now){
  const tk = tokens(n);
  for (let i = tk.length - 1; i >= 1; i--) {
    const w = tk[i]; let seg = null;
    if (/^(?:الي|الى|ل|لل|ليوم|لتاريخ|لساعه|للساعه|لموعد)$/.test(w)) seg = tk.slice(i + 1).join(' ');
    else if (/^ل(?!ي$)\S{3,}$/.test(w) && !/^(?:لسه|لسا|لنا|لكل|لجميع)$/.test(w)) seg = [w.slice(1)].concat(tk.slice(i + 1)).join(' ');
    if (seg == null || !seg) continue;
    const t = NLP.when(seg, now); if (t.date || t.time) return { before: tk.slice(0, i).join(' '), date: t.date, time: t.time };
  }
  const t = NLP.when(n, now); if (t.date || t.time) return { before: t.n, date: t.date, time: t.time, whole: true };
  return null;
}

/* ---------------- main ---------------- */
const stripLead = n => clip(n.replace(/^(?:(?:لو سمحت|من فضلك|ممكن|يا ريت|ياريت|عايز|عاوز|اريد|محتاج|عايزك|عاوزك|تقدر|ينفع|هل يمكنك|هل تقدر|يلا|طيب|بقا|بقى|معلش|يا باشا|ياباشا|اوك|ok)\s+)+/, '').replace(/^(?:قم|قوم|قومي|قومو)\s+ب?(?=\S)/, ' ').replace(/^(?:ان|انك)\s+/, ''));
function plan(ops, why, o){ return Object.assign({ intent: 'plan', ops, why }, o || {}); }

function bulkWrite(n, now){
  let notClause = null;
  if (R.del.test(' ' + n + ' ')) {
    const km = /\s(?:و\s*)?(?:فقط\s+|بس\s+)?(?:اترك|اتركلي|اتركهم|اتركها|سيب|سيبلي|سيبهم|سيبها|ابقي|ابقى|ابقيلي|احتفظ ب(?:ال)?|احتفظ بـ|ما ?عدا|باستثناء|الا|غير)\s+(?:فقط\s+|بس\s+)?(\S.*)$/.exec(' ' + n + ' ');
    if (km) { notClause = km[1]; n = clip(n.slice(0, Math.max(0, km.index - 1)).replace(/(?:^|\s)(?:و|فقط|بس|وفقط|وبس)$/, '')); if (!n) return null; }
  }
  const obj = objectOf(n); if (!obj.type) return null;
  let verb = '';
  if (R.del.test(' ' + n + ' ')) verb = 'delete';
  else if (R.reopen.test(' ' + n + ' ') || /(?:^|\s)(?:علم|علمي|علمهم|علمها|اعتبر|اعتبري|حط|حطهم|حطها|خلي|خليهم|خليها)\b.*(?:غير|مش|لسه)\s*(?:ال)?(?:منتهي|مكتمل|منجز|خلصان|خلصت)/.test(' ' + n + ' ')) verb = 'reopen';
  else if (R.doneV.test(' ' + n + ' ') || (R.mark.test(' ' + n + ' ') && R.doneAdj.test(' ' + n + ' ') && !R.undoneAdj.test(' ' + n + ' '))) verb = 'complete';
  else if (R.move.test(' ' + n + ' ')) verb = 'move';
  else if (R.pin.test(' ' + n + ' ') && !R.unpin.test(' ' + n + ' ')) verb = 'pin';
  else if (R.unpin.test(' ' + n + ' ')) verb = 'unpin';
  if (!verb) return null;
  if (verb !== 'reopen' && R.open.test(' ' + n + ' ')) return null;
  const hasAll = R.all.test(' ' + n + ' ') || obj.every;
  const fk = verb === 'complete' ? 'done' : verb === 'reopen' ? 'reopen' : verb;
  // postpone needs a target date: "<source> ل <target>"
  let tgt = null, src = n;
  if (verb === 'move') { tgt = splitTarget(n, now); if (!tgt || tgt.whole) { if (!tgt) return null; } src = tgt.before; }
  let notF = null;
  if (notClause) {
    const kobj = objectOf(notClause); const kf = filtersOf(notClause, now, 'read', kobj.type ? kobj : obj); kf.type = kobj.type || obj.type;
    if (kf.due || kf.text || kf.pinned || kf.prio || kf.status !== 'any' || (kobj.type && kobj.type !== obj.type)) { notF = kf; delete notF._used; delete notF._rest; delete notF._dateOnly; }
  }
  const f = filtersOf(src, now, fk === 'done' ? 'done' : fk, obj);
  const hasFilter = !!(f.due || f.text || f.pinned || f.prio || f.status !== 'any');
  if (verb === 'move' && /^date:/.test(f.due) && tgt && tgt.whole) f.due = '';
  // singular object, no "all", no filter = one specific item -> the single-item rules own it
  if (!obj.plural && !hasAll && !hasFilter) return null;
  const left = leftover(f._rest, obj);
  if (left.length) {
    if (!obj.plural && !hasAll) return null;                 // "احذف مهمة الاجتماع"
    if (!f.text) { if (left.length > 4) return null; f.text = left.join(' '); }
  }
  if (verb === 'complete' && f.status === 'any') f.status = 'open';
  if (verb === 'reopen' && f.status === 'any') f.status = 'done';
  if (verb === 'move' && f.status === 'any') f.status = 'open';
  const set = {};
  if (verb === 'move') { set.date = tgt.date || ''; set.time = tgt.time || ''; if (!set.date && !set.time) return null; }
  const ff = Object.assign({}, f); delete ff._used; delete ff._rest; delete ff._dateOnly; if (notF) ff.not = notF;
  return plan([{ op: 'tasks', act: verb, filter: ff, set }], 'bulk ' + verb);
}

function readOps(n, now, post){
  const sn = ' ' + n + ' ';
  if (R.open.test(sn)) return null;
  const obj = objectOf(n);
  if (obj.proj && !obj.type) {
    if (R.count.test(sn)) return plan([{ op: 'projects', act: 'count' }], 'count projects');
    if (R.list.test(sn) && /(?:اسماء|اسامي|اسم|كل|جميع|قايمه|لسته|مين|ايه|ما هي|هات)/.test(n)) return plan([{ op: 'projects', act: 'list' }], 'list projects');
    return null;
  }
  if (obj.client && !obj.type && !obj.proj) {
    if (R.count.test(sn)) return plan([{ op: 'clients', act: 'count' }], 'count clients');
    if (R.list.test(sn) && /(?:اسماء|اسامي|كل|جميع|قايمه|لسته|مين|ايه|ما هي|هات|عندي)/.test(n)) return plan([{ op: 'clients', act: 'list' }], 'list clients');
    return null;
  }
  if (R.summary.test(sn) && !obj.type) return plan([{ op: 'summary' }], 'summary');
  if (!obj.type) {
    // "قائمة" alone after a misheard verb ("بقائمة") → most likely the tasks list
    if (R.listN.test(sn) && !obj.proj && !obj.client && n.split(' ').length <= 3) return plan([{ op: 'tasks', act: 'list', filter: { type: 'both', status: 'open', due: '', text: '', pinned: null, prio: '' } }], 'list both (bare list word)');
    return null;
  }
  if (R.del.test(sn) || R.doneV.test(sn) || R.reopen.test(sn) || R.move.test(sn) || R.pin.test(sn) || R.add.test(sn) || R.mark.test(sn)) return null;
  const isCount = R.count.test(sn), isList = R.list.test(sn) || R.listN.test(sn);
  if (!isCount && !isList && !post) return null;
  const f = filtersOf(n, now, 'read', obj);
  const left = leftover(f._rest, obj, [/(?:^|\s)(?:ايه|اي|ما|هي|هو|ماهي|مين|فين|عندي|لدي|قايمه|لسته|جدول)(?=\s|$)/g]);
  if (left.length && !f.text && left.length <= 2) { /* "مهام الرحاب" */ f.text = left.join(' '); }
  else if (left.length && !f.text) return null;
  const dateOnly = f.due.startsWith('date:') && f.status === 'any' && !f.text && !f.pinned && !f.prio && obj.type === 'task';
  const hasFilter = !!(f.due || f.text || f.status !== 'any' || f.pinned || f.prio);
  if (!isCount && !isList && !hasFilter) return null;
  if (!post && dateOnly) return null;                 // "إيه مهامي النهارده" keeps its dedicated spoken reply
  if (!post && !hasFilter && !R.listN.test(sn) && obj.type !== 'both' && !isCount) return null;
  if (!post && !hasFilter && isCount && obj.type === 'task' && /^(?:كام|كم)/.test(n)) return null;
  if (f.status === 'any' && !f.due.startsWith('date:') && !isCount && obj.type !== 'note' && !f.text && !f.pinned && !f.prio && f.due === '') f.status = 'open';
  const ff = Object.assign({}, f); delete ff._used; delete ff._rest; delete ff._dateOnly;
  return plan([{ op: 'tasks', act: isCount ? 'count' : 'list', filter: ff }], (isCount ? 'count ' : 'list ') + describe(ff));
}

/* one-item edits that the rules did not know (rename / priority / reopen / pin) */
function oneEdits(n, now){
  let m = R.rename.exec(' ' + n + ' ');
  if (m) { const q = clip(m[1]), v = clip(m[2]); if (q && v) return plan([{ op: 'one', act: 'rename', query: q, value: v }], 'rename'); }
  m = R.prio.exec(' ' + n + ' ');
  if (m && !/(?:كل|جميع)/.test(n)) {
    const wd = m[2]; const val = /عاجل|مستعجل|urgent|جدا|مهمه جدا|مهم جدا/.test(wd) ? 'urgent' : /عاليه|عالي|high/.test(wd) ? 'high' : /منخفض|واطي|low|مش مهم/.test(wd) ? 'low' : 'normal';
    const q = clip((m[1] || '').replace(/(?:^|\s)(?:ال)?(?:مهمه|تاسك|ملاحظه)(?=\s|$)/g, ' ').replace(/(?:^|\s)(?:اولويه|اهميه)(?=\s|$)/g, ' '));
    if (q) return plan([{ op: 'one', act: 'priority', query: q, value: val }], 'priority');
  }
  m = /^(?:ال)?(?:رجع|ارجع|رجعي|فعل|شغل)\s+(?:ال)?(?:مهمه|تاسك)\s+(.+?)(?:\s+تاني|\s+تانيه)?$/.exec(n);
  if (m) return plan([{ op: 'one', act: 'reopen', query: clip(m[1]) }], 'reopen one');
  m = /^(?:ثبت|ثبتلي|دبس)\s+(?:ال)?(?:مهمه|ملاحظه|تاسك)?\s*(.+)$/.exec(n);
  if (m && !R.all.test(' ' + n + ' ')) return plan([{ op: 'one', act: 'pin', query: clip(m[1]) }], 'pin one');
  return null;
}

/* several adds in one sentence: "ضيف مهام: تصميم، مونتاج، فاتورة" / "ضيف مهمة X وضيف مهمة Y" */
function multiAdd(n, d, now, needPlural){
  if (!R.add.test(' ' + n + ' ')) return null;
  const parts = d.split(/\s*(?:[،,؛;\n]|\sثم\s|\sوبعدين\s|\sوكمان\s|\sوضيف\s|\sواضيف\s|\sوأضف\s|\sواضف\s|\sوضيفلي\s)\s*/).map(clip).filter(Boolean);
  if (parts.length < 2) return null;
  const m = /^(?:.*?)(?:ضيف|ضيفلي|أضيف|اضيف|أضف|اضف|سجل|سجلي|اعمل|اعملي|حط|حطلي|اكتب|اكتبلي)\s+(?:لي\s+)?(?:ال)?(مهام|مهمة|مهمه|ملاحظات|ملاحظة|ملاحظه|تاسكات)\s*:?\s*(.*)$/.exec(parts[0]);
  if (!m) return null;
  const isNote = /^ملاح/.test(m[1]);
  if (needPlural && !/^(?:مهام|ملاحظات|تاسكات)$/.test(m[1])) return null;
  const strip = p => clip(p.replace(/^(?:و)?(?:ضيف|أضف|اضف|اضيف|ضيفلي)?\s*(?:ال)?(?:مهمة|مهمه|ملاحظة|ملاحظه|تاسك)\s+/, ''));
  const heads = [m[2]].concat(parts.slice(1)).map(strip).filter(Boolean);
  if (heads.length < 2) return null;
  const ops = heads.map(t => { const q = NLP.parse('ضيف مهمة ' + t, { now }); return { op: 'add', task: { title: clip(q.title || t), type: isNote ? 'note' : 'task', date: q.date || '', time: q.time || '' } }; });
  return plan(ops, 'multi add');
}

/* one item by title, when the old single-item rules refuse (e.g. the title contains "عميل"/"مشروع"/"فيديو") */
function singleEdit(n){
  const sn = ' ' + n + ' '; const obj = objectOf(n);
  if (!obj.type && (obj.proj || obj.client)) return null;
  if (R.open.test(sn)) return null;
  const head = ' ' + n.split(' ').slice(0, 2).join(' ') + ' ';              // the verb must open the sentence ("احذف ...", "خلصت ...")
  let act = R.del.test(head) ? 'delete' : R.doneV.test(head) ? 'complete' : '';
  if (!act) return null;
  const left = leftover(n, obj, [/(?:^|\s)(?:ال)?(?:عميل|مشروع|فيديو)(?=\s|$)/g].slice(0, 0));
  const q = clip(left.join(' ')); if (!q || q.length < 2) return null;
  return plan([{ op: 'one', act, query: q }], 'single ' + act);
}

function pre(text, ctx){
  ctx = ctx || {}; const now = ctx.now || new Date();
  const P = norm(text); if (!P) return null;
  const n = stripLead(P);
  let p = bulkWrite(n, now); if (p) return p;
  p = multiAdd(n, text, now, true); if (p) return p;
  p = readOps(n, now, false); if (p) return p;
  p = oneEdits(n, now); if (p) return p;
  return null;
}
function post(text, ctx){
  ctx = ctx || {}; const now = ctx.now || new Date();
  const P = norm(text); if (!P) return null;
  const n = stripLead(P);
  let p = multiAdd(n, text, now); if (p) return p;
  p = readOps(n, now, true); if (p) return p;
  p = singleEdit(n); if (p) return p;
  /* bare "مهام غدا" / "المهام المتأخرة" with no verb at all → read them */
  const obj = objectOf(n);
  if (obj.type && !R.open.test(' ' + n + ' ')) { const f = filtersOf(n, now, 'read', obj); if (f.due || f.status !== 'any' || f.pinned || f.prio) { const ff = Object.assign({}, f); delete ff._used; delete ff._rest; delete ff._dateOnly; if (ff.status === 'any' && ff.due.startsWith('date:') === false) ff.status = 'open'; return plan([{ op: 'tasks', act: 'list', filter: ff }], 'implicit list'); } }
  return null;
}

/* ---------------- "did you mean" ---------------- */
const EXAMPLES = [
  'ضيف مهمة تصميم بوستر بكرة الساعة 3', 'ذكّرني أكلم العميل بعد ساعتين', 'اكتب ملاحظة فكرة الفيديو الجديد',
  'احذف جميع المهام المجدولة', 'احذف كل المهام المنتهية', 'احذف كل الملاحظات', 'خلّص كل مهام النهارده', 'أجّل كل مهام النهارده لبكرة', 'رجّع كل المهام المنتهية',
  'اعرض المهام المتأخرة', 'قائمة المهام والملاحظات', 'اعرض الملاحظات', 'كام مهمة متأخرة', 'إيه مهامي النهارده', 'قولي مهام بكرة', 'مهام الأسبوع ده',
  'ملخص اليوم', 'إيه مشاريعي', 'مين العملاء', 'افتح المدفوعات', 'افتح مشروع الرحاب', 'ابحث عن لوجو', 'سجّل دفعة 500 من الرحاب',
  'غيّر اسم مهمة المونتاج لـ مونتاج الإعلان', 'خلي مهمة المونتاج عاجلة', 'ثبّت مهمة الاجتماع', 'فعّل الوضع الليلي', 'غيّر اللغة للإنجليزي', 'تراجع'
];
function suggest(text){
  const hit = NLP.best(EXAMPLES, text, x => x).slice(0, 3).map(x => x.item);
  if (hit.length) return hit;
  const n = norm(text), pick = [];
  if (/(?:حذف|امسح|شيل|احذف)/.test(n)) pick.push('احذف جميع المهام المجدولة', 'احذف كل المهام المنتهية');
  if (/(?:مهام|مهمه|تاسك|ملاحظ)/.test(n)) pick.push('قائمة المهام والملاحظات', 'اعرض المهام المتأخرة');
  return pick.slice(0, 3);
}

const api = { pre, post, match, describe, suggest, filtersOf, objectOf, splitTarget, EXAMPLES };
root.VoiceSmart = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
