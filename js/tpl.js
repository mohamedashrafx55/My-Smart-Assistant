/* Project-type templates: every kind of design / video job gets its own logical map (stages, arrows, phase colours).
   A type is a list of ROWS; stages in the same row run in parallel and arrows are drawn row → next row. */
(function(){
const MSA = window.MSA, U = MSA.u, P = MSA.proj;
const T = (a, e) => MSA.T(a, e);

const PH = { r: ['#4f8cff', ['بحث وتخطيط', 'Research & planning']], c: ['#f59e0b', ['إبداع وتصميم', 'Creative']], p: ['#10b981', ['تنفيذ وإنتاج', 'Production']], v: ['#ec4899', ['مراجعة واعتماد', 'Review']], d: ['#8b5cf6', ['تسليم', 'Delivery']] };
const KEYS = ['brief', 'idea', 'mood', 'colors', 'fonts', 'icons', 'imagestyle', 'logo', 'slogan', 'main', 'templates', 'onscreen', 'printing', 'static', 'motion', 'mockups'];
const KPH = { brief: 'r', idea: 'r', mood: 'r', colors: 'c', fonts: 'c', icons: 'c', imagestyle: 'c', logo: 'c', slogan: 'c', main: 'p', templates: 'p', onscreen: 'p', printing: 'p', static: 'p', motion: 'p', mockups: 'd' };

/* shared vocabulary: key → [arabic, english, phase] */
const S = {
  research: ['بحث ومنافسين', 'Research & competitors', 'r'], audit: ['تحليل الوضع الحالي', 'Audit what exists', 'r'], content: ['المحتوى والنصوص', 'Content & copy', 'r'],
  assets: ['تجميع الصور والعناصر', 'Gather images & assets', 'r'], refs: ['مراجع وإلهام', 'References & inspiration', 'r'], audience: ['الجمهور والهدف', 'Audience & goal', 'r'],
  sketch: ['اسكتشات أولية', 'Rough sketches', 'c'], concept: ['تطوير الفكرة', 'Develop the concept', 'c'], layout: ['التخطيط والشبكة', 'Layout & grid', 'c'], hierarchy: ['ترتيب العناصر والتسلسل البصري', 'Hierarchy & composition', 'c'],
  script: ['السيناريو', 'Script', 'c'], storyboard: ['ستوري بورد', 'Storyboard', 'c'], wire: ['وايرفريم', 'Wireframes', 'c'], styleframes: ['ستايل فريمز', 'Style frames', 'c'],
  digitize: ['التنفيذ الرقمي', 'Digital build', 'p'], variants: ['نسخ وألوان بديلة', 'Variations & colourways', 'p'], sizes: ['المقاسات والنسخ', 'Sizes & versions', 'p'], prepress: ['تجهيز للطباعة (CMYK/Bleed)', 'Print prep (CMYK / bleed)', 'p'],
  shoot: ['التصوير', 'Shooting', 'p'], rough: ['التجميع المبدئي', 'Rough cut', 'p'], fine: ['القص النهائي', 'Fine cut', 'p'], sound: ['الصوت والموسيقى', 'Sound & music', 'p'], grade: ['التلوين', 'Colour grading', 'p'],
  gfx: ['جرافيك وتيتلات', 'Graphics & titles', 'p'], subs: ['ترجمة / كابشن', 'Subtitles / captions', 'p'], animate: ['الأنيميشن', 'Animation', 'p'], vo: ['تعليق صوتي', 'Voice-over', 'p'], ui: ['تصميم الواجهات', 'UI design', 'p'], proto: ['برتوتايب تفاعلي', 'Interactive prototype', 'p'],
  review: ['مراجعة العميل', 'Client review', 'v'], revise: ['التعديلات', 'Revisions', 'v'], proof: ['بروفة / اختبار', 'Proof / test', 'v'], approve: ['الاعتماد', 'Approval', 'v'],
  files: ['الملفات النهائية', 'Final files', 'd'], deliver: ['التسليم', 'Delivery', 'd'], export: ['التصدير', 'Export', 'd'], publish: ['النشر', 'Publish', 'd'], guide: ['كتيب الاستخدام', 'Usage guide', 'd'], handoff: ['تسليم للمطوّر', 'Developer handoff', 'd']
};
const X = (a, e, p) => [a, e, p || 'p'];   /* inline stage */

/* [id, category, icon, [ar,en], [descAr,descEn], rows] */
const TYPES = [
  /* ---------- identity ---------- */
  ['logo', 'id', 'star', ['شعار فقط', 'Logo only'], ['من الملخص إلى ملفات الشعار النهائية', 'Brief to final logo files'], [['brief'], ['research', 'mood'], ['sketch'], ['digitize'], ['variants', 'mockups'], ['review'], ['revise'], ['files'], ['deliver']]],
  ['logo-refresh', 'id', 'repeat', ['تحديث شعار قائم', 'Logo refresh'], ['تطوير شعار موجود مع الحفاظ على هويته', 'Evolve an existing logo'], [['brief'], ['audit', 'research'], ['concept'], ['digitize'], [X('مقارنة قبل / بعد', 'Before / after', 'v')], ['review'], ['files'], ['deliver']]],
  ['identity', 'id', 'palette', ['هوية بصرية كاملة', 'Full brand identity'], ['لوجو وألوان وخطوط وتطبيقات وكتيب', 'Logo, colour, type, applications, guide'], [['brief'], ['research', 'mood'], ['colors', 'fonts', 'icons', 'imagestyle'], ['logo'], [X('نظام الشعار والاستخدامات', 'Logo system & usage', 'c')], ['mockups', X('مطبوعات إدارية', 'Stationery', 'p'), X('تطبيقات سوشيال', 'Social templates', 'p')], ['guide'], ['review'], ['files'], ['deliver']]],
  ['guidelines', 'id', 'doc', ['كتيب هوية (Brand Guidelines)', 'Brand guidelines book'], ['توثيق قواعد استخدام الهوية', 'Document how to use a brand'], [['brief'], ['audit'], [X('الشعار ومساحاته', 'Logo & clear space', 'c'), 'colors', 'fonts', 'icons', 'imagestyle'], ['layout'], ['review'], ['files'], ['deliver']]],
  ['stationery', 'id', 'file', ['مطبوعات إدارية', 'Stationery set'], ['كارت وورق رسمي وظرف وفاتورة', 'Card, letterhead, envelope, invoice'], [['brief'], ['audit'], [X('كارت شخصي', 'Business card', 'p'), X('ورق رسمي', 'Letterhead', 'p'), X('ظرف', 'Envelope', 'p'), X('فاتورة / عرض سعر', 'Invoice / quote', 'p')], ['mockups'], ['prepress'], ['proof'], ['deliver']]],
  ['bizcard', 'id', 'user', ['كارت شخصي', 'Business card'], ['وجهان بمقاس الطباعة', 'Two sides, print-ready'], [['brief'], ['content'], ['layout'], [X('الوجه الأمامي', 'Front side', 'p'), X('الوجه الخلفي', 'Back side', 'p')], ['prepress'], ['proof'], ['deliver']]],

  /* ---------- print ---------- */
  ['flyer', 'print', 'doc', ['فلاير / بروشور', 'Flyer / brochure'], ['مطبوع دعائي بوجه أو وجهين', 'Promotional print piece'], [['brief'], ['content', 'assets'], ['layout'], ['hierarchy'], ['digitize'], ['review'], ['prepress'], ['proof'], ['deliver']]],
  ['poster', 'print', 'image', ['بوستر / أفيش', 'Poster'], ['تصميم واحد قوي بصريًا', 'One strong visual'], [['brief'], ['refs', 'content'], ['concept'], ['sketch'], ['digitize'], ['review'], ['sizes', 'prepress'], ['files'], ['deliver']]],
  ['menu', 'print', 'list', ['منيو مطعم / كافيه', 'Restaurant / café menu'], ['أقسام وأسعار وصور أطباق', 'Sections, prices, dish photos'], [['brief'], [X('جمع الأصناف والأسعار', 'Collect items & prices', 'r'), 'assets'], [X('هيكل الأقسام', 'Menu structure', 'c'), 'layout'], [X('تصميم الصفحات', 'Design the pages', 'p')], [X('مراجعة الأسعار والإملاء', 'Check prices & spelling', 'v')], ['review'], [X('نسخة الطباعة', 'Print version', 'p'), X('نسخة رقمية / QR', 'Digital / QR version', 'p')], ['deliver']]],
  ['packaging', 'print', 'layers', ['تغليف / ليبل منتج', 'Packaging / product label'], ['من الدايلاين للموك أب', 'Dieline to mockup'], [['brief'], ['research', X('بيانات المنتج واللوائح', 'Product info & regulations', 'r')], ['concept'], [X('الدايلاين والمقاسات', 'Dieline & dimensions', 'c')], ['digitize'], ['mockups'], ['review'], ['prepress'], ['proof'], ['deliver']]],
  ['bookcover', 'print', 'note', ['غلاف كتاب', 'Book cover'], ['غلاف + ظهر + كعب', 'Front, back and spine'], [['brief'], [X('قراءة الكتاب والجمهور', 'Read the book & audience', 'r'), 'refs'], ['concept'], ['sketch'], [X('الغلاف الأمامي', 'Front cover', 'p'), X('الظهر والكعب', 'Back & spine', 'p')], ['mockups'], ['review'], ['prepress'], ['deliver']]],
  ['magazine', 'print', 'grid', ['مجلة / كتالوج', 'Magazine / catalogue'], ['صفحات متعددة بنظام موحّد', 'Multi-page with one system'], [['brief'], ['content', 'assets'], [X('نظام الصفحات والشبكة', 'Page system & grid', 'c'), 'fonts'], [X('الصفحات الرئيسية (Master)', 'Master pages', 'c')], [X('تصميم الصفحات', 'Design the pages', 'p')], ['review'], ['revise'], ['prepress'], ['proof'], ['deliver']]],
  ['banner', 'print', 'maximize', ['بانر / رول أب / لوحة طريق', 'Banner / roll-up / billboard'], ['مقاسات كبيرة ومسافة رؤية', 'Large format & viewing distance'], [['brief'], [X('المقاس ومسافة الرؤية', 'Size & viewing distance', 'r'), 'content'], ['concept'], ['hierarchy'], ['digitize'], ['review'], [X('تجهيز بدقة الطباعة الكبيرة', 'Large-format print prep', 'p')], ['proof'], ['deliver']]],
  ['invite', 'print', 'calendar', ['دعوة / شهادة', 'Invitation / certificate'], ['نص رسمي وتصميم أنيق', 'Formal text, elegant design'], [['brief'], ['content'], ['concept'], ['layout'], ['digitize'], ['review'], [X('نسخة طباعة', 'Print version', 'p'), X('نسخة واتساب / PDF', 'WhatsApp / PDF version', 'p')], ['deliver']]],
  ['merch', 'print', 'tag', ['تيشيرت / ميرش', 'T-shirt / merch'], ['تصميم للطباعة على المنتجات', 'Design for printed goods'], [['brief'], ['refs', X('نوع الطباعة والخامة', 'Print method & fabric', 'r')], ['concept'], ['digitize'], [X('فصل الألوان', 'Colour separation', 'p')], ['mockups'], ['review'], ['files'], ['deliver']]],
  ['sticker', 'print', 'sparkles', ['ستيكر / لصقات', 'Stickers'], ['مجموعة أو ستيكر واحد', 'A set or a single sticker'], [['brief'], ['refs'], ['sketch'], ['digitize'], [X('خط القص (Cut line)', 'Cut line', 'p')], ['mockups'], ['review'], ['files'], ['deliver']]],

  /* ---------- digital ---------- */
  ['social-post', 'dig', 'image', ['بوست سوشيال', 'Social post'], ['تصميم سريع لمنصة محددة', 'Quick design for one platform'], [['brief'], ['idea'], ['static'], ['review'], ['sizes'], ['publish']]],
  ['social-series', 'dig', 'grid', ['سلسلة بوستات / كاروسيل', 'Post series / carousel'], ['عدة تصاميم بنظام واحد', 'Several designs, one system'], [['brief'], ['audience', 'refs'], ['idea'], ['templates'], [X('تصميم كل بوست', 'Design each post', 'p')], ['review'], ['sizes'], [X('جدول النشر', 'Publishing schedule', 'd')], ['publish']]],
  ['story-covers', 'dig', 'circle', ['ستوري / هايلايت كفرز', 'Story / highlight covers'], ['مجموعة أيقونات دائرية موحدة', 'A matching icon set'], [['brief'], ['colors', 'icons'], ['templates'], ['digitize'], ['sizes'], ['deliver']]],
  ['yt-thumb', 'dig', 'play', ['صورة مصغرة يوتيوب (Thumbnail)', 'YouTube thumbnail'], ['عنوان ووجه وتباين عالٍ', 'Title, face, strong contrast'], [['brief'], [X('الفكرة والنص القصير', 'Hook & short text', 'r'), 'refs'], ['concept'], ['digitize'], [X('اختبار الحجم الصغير', 'Small-size test', 'v'), X('نسخة بديلة A/B', 'A/B variant', 'p')], ['export'], ['publish']]],
  ['channel-art', 'dig', 'camera', ['هوية قناة (بانر + أفاتار)', 'Channel art (banner + avatar)'], ['منصات متعددة بمقاسات مختلفة', 'Several platforms, several sizes'], [['brief'], ['colors', 'logo'], [X('بانر القناة', 'Channel banner', 'p'), X('الصورة الشخصية', 'Avatar', 'p'), X('شاشة النهاية', 'End screen', 'p')], ['sizes'], ['review'], ['deliver']]],
  ['ad-banner', 'dig', 'maximize', ['بانرات إعلانية رقمية', 'Digital ad banners'], ['مقاسات الإعلانات المتعددة', 'Multiple ad sizes'], [['brief'], [X('الهدف والـ CTA', 'Goal & call to action', 'r'), 'audience'], ['concept'], [X('التصميم الرئيسي', 'Master design', 'p')], ['sizes'], ['review'], [X('تصدير بوزن مناسب', 'Export at light weight', 'd')], ['deliver']]],
  ['landing', 'dig', 'globe', ['صفحة هبوط / موقع (UI)', 'Landing page / website UI'], ['من الوايرفريم للتسليم للمطوّر', 'Wireframe to dev handoff'], [['brief'], ['audience', 'research'], ['wire'], [X('نظام التصميم', 'Design system', 'c'), 'ui'], [X('نسخة الموبايل', 'Mobile version', 'p')], ['proto'], ['review'], ['handoff'], ['deliver']]],
  ['app-ui', 'dig', 'phone', ['تصميم تطبيق موبايل (UI/UX)', 'Mobile app UI / UX'], ['رحلة مستخدم وشاشات وبروتوتايب', 'User flow, screens, prototype'], [['brief'], ['audience', 'research'], [X('رحلة المستخدم', 'User flow', 'c')], ['wire'], [X('نظام التصميم', 'Design system', 'c')], ['ui'], ['proto'], [X('اختبار المستخدم', 'User testing', 'v')], ['handoff'], ['deliver']]],
  ['presentation', 'dig', 'presentation', ['عرض تقديمي', 'Presentation deck'], ['قصة بصرية بشرائح', 'A visual story in slides'], [['brief'], ['audience', 'content'], [X('هيكل القصة', 'Story outline', 'c')], [X('قالب الشرائح (Master)', 'Slide master', 'c')], [X('تصميم الشرائح', 'Design the slides', 'p')], ['review'], ['export'], ['deliver']]],
  ['infographic', 'dig', 'layers', ['إنفوجرافيك', 'Infographic'], ['بيانات تتحول لقصة بصرية', 'Turn data into a visual story'], [['brief'], [X('جمع البيانات والمصادر', 'Collect data & sources', 'r')], [X('الرسالة الرئيسية', 'Key message', 'c')], ['layout'], [X('الرسوم والأيقونات', 'Charts & icons', 'p')], ['review'], ['sizes'], ['deliver']]],
  ['newsletter', 'dig', 'mail', ['نشرة بريدية', 'Email newsletter'], ['قالب متوافق مع برامج البريد', 'Email-client-safe template'], [['brief'], ['content'], ['wire'], ['ui'], [X('اختبار على برامج البريد', 'Test in email clients', 'v')], ['handoff'], ['deliver']]],

  /* ---------- video & motion ---------- */
  ['reel', 'vid', 'video', ['ريلز / شورت', 'Reel / short'], ['فيديو عمودي قصير', 'Short vertical video'], [['brief'], ['idea', 'refs'], ['script'], ['shoot'], ['rough'], [X('إيقاع وانتقالات', 'Pacing & transitions', 'p'), 'sound'], ['gfx', 'subs'], ['grade'], ['review'], ['export'], ['publish']]],
  ['logo-anim', 'vid', 'play', ['حركة شعار / إنترو', 'Logo animation / intro'], ['ثواني قليلة بجودة عالية', 'A few seconds, high polish'], [['brief'], ['logo'], ['styleframes'], ['storyboard'], ['animate'], ['sound'], ['review'], ['export'], ['deliver']]],
  ['promo', 'vid', 'video', ['فيديو إعلاني / برومو', 'Promo / ad video'], ['رسالة تجارية مركّزة', 'A focused commercial message'], [['brief'], ['audience', 'refs'], ['script'], ['storyboard'], ['shoot'], ['rough'], ['fine'], ['gfx', 'sound', 'vo'], ['grade'], ['review'], ['sizes'], ['export'], ['deliver']]],
  ['yt-edit', 'vid', 'video', ['مونتاج فيديو يوتيوب', 'YouTube video edit'], ['من اللقطات للنشر', 'From footage to upload'], [['brief'], [X('تنظيم اللقطات', 'Organise footage', 'p')], ['rough'], ['fine'], ['gfx', 'sound', 'subs'], ['grade'], [X('صورة مصغرة', 'Thumbnail', 'p')], ['review'], ['export'], ['publish']]],
  ['podcast', 'vid', 'mic', ['بودكاست / مقابلة', 'Podcast / interview edit'], ['تعديل صوت وفيديو متعدد الكاميرات', 'Multi-cam audio & video edit'], [['brief'], [X('مزامنة الكاميرات والصوت', 'Sync cameras & audio', 'p')], [X('الكت المبدئي', 'Rough cut', 'p')], [X('تنظيف الصوت', 'Audio clean-up', 'p'), 'gfx'], [X('مقاطع قصيرة (Clips)', 'Short clips', 'p'), 'subs'], ['review'], ['export'], ['publish']]],
  ['explainer', 'vid', 'sparkles', ['فيديو موشن شرح', 'Motion explainer'], ['رسوم متحركة تشرح فكرة', 'Animated graphics that explain'], [['brief'], ['audience'], ['script'], ['vo'], ['storyboard'], ['styleframes'], ['animate'], ['sound'], ['review'], ['export'], ['deliver']]],
  ['event-video', 'vid', 'camera', ['فيديو فعالية / ملخّص', 'Event highlight video'], ['تصوير وتجميع أفضل اللحظات', 'Capture and cut the best moments'], [['brief'], [X('خطة التصوير', 'Shot list', 'r')], ['shoot'], [X('انتقاء اللقطات', 'Select clips', 'p')], ['rough'], ['sound', 'gfx'], ['grade'], ['review'], ['export'], ['deliver']]],

  /* ---------- other ---------- */
  ['retouch', 'oth', 'camera', ['معالجة صور / ريتاتش', 'Photo retouching'], ['تنظيف وتلوين ودمج', 'Clean-up, colour, composite'], [['brief'], [X('فحص الصورة الأصلية', 'Inspect the original', 'r')], [X('تنظيف وإزالة', 'Clean-up', 'p')], [X('ضبط اللون والإضاءة', 'Colour & light', 'p')], [X('تفاصيل نهائية', 'Finishing touches', 'p')], ['review'], ['files'], ['deliver']]],
  ['illustration', 'oth', 'pencil', ['رسم / إلستريشن', 'Illustration'], ['من الاسكتش للتلوين', 'Sketch to colour'], [['brief'], ['refs', 'mood'], ['sketch'], [X('رسم الخطوط', 'Line art', 'p')], [X('التلوين', 'Colouring', 'p')], [X('الإضاءة والتفاصيل', 'Light & detail', 'p')], ['review'], ['files'], ['deliver']]],
  ['mockup-pack', 'oth', 'layers', ['موك أب / عرض أعمال', 'Mockups / portfolio showcase'], ['عرض الأعمال بشكل احترافي', 'Present work professionally'], [['brief'], ['assets'], [X('اختيار الموك أب', 'Pick mockups', 'c')], ['mockups'], [X('تقديم Behance / PDF', 'Behance / PDF presentation', 'p')], ['review'], ['deliver']]]
];
const CATS = [['all', 'الكل', 'All'], ['id', 'الهوية', 'Identity'], ['print', 'مطبوعات', 'Print'], ['dig', 'ديجيتال', 'Digital'], ['vid', 'فيديو وموشن', 'Video & motion'], ['oth', 'أخرى', 'Other']];

function stageOf(x){
  if (typeof x === 'string') { const d = S[x]; if (d) return { k: x, ar: d[0], en: d[1], ph: d[2], key: null }; return { k: x, ar: x, en: x, ph: KPH[x] || 'p', key: KEYS.includes(x) ? x : null }; }
  return { k: null, ar: x[0], en: x[1], ph: x[2] || 'p', key: null };
}
/* resolve a name that might be a built-in step key with its own translation */
function resolve(x){ const o = stageOf(x); if (typeof x === 'string' && KEYS.includes(x)) { o.key = x; o.ph = KPH[x]; } return o; }

const COL = 260, ROW = 200, PADX = 70, PADY = 70;
function edgesBetween(a, b){
  const n = a.length, m = b.length, e = [];
  if (n === m) a.forEach((_, i) => e.push([i, i]));
  else if (n === 1) b.forEach((_, j) => e.push([0, j]));
  else if (m === 1) a.forEach((_, i) => e.push([i, 0]));
  else {
    const seen = new Set(), add = (i, j) => { const k = i + '>' + j; if (!seen.has(k)) { seen.add(k); e.push([i, j]); } };
    b.forEach((_, j) => add(Math.round(j * (n - 1) / Math.max(1, m - 1)), j));
    a.forEach((_, i) => add(i, Math.round(i * (m - 1) / Math.max(1, n - 1))));
  }
  return e;
}
/* build { steps, graph } for a type */
function make(def){
  const rows = def[5], maxN = Math.max(...rows.map(r => r.length));
  const steps = [], pos = {}, col = {}, ids = [];
  rows.forEach((row, ri) => {
    const rid = [];
    row.forEach((x, ci) => {
      const o = resolve(x), id = U.uid('s');
      steps.push({ id, key: o.key, title: o.key ? null : T(o.ar, o.en), done: false, note: '', atts: [], children: [] });
      pos[id] = [PADX + Math.round(((maxN - row.length) / 2 + ci) * COL / 10) * 10, PADY + ri * ROW];
      col[id] = PH[o.ph][0]; rid.push(id);
    });
    ids.push(rid);
  });
  const edges = [];
  for (let r = 0; r < ids.length - 1; r++) edgesBetween(ids[r], ids[r + 1]).forEach(([i, j]) => edges.push([ids[r][i], ids[r + 1][j]]));
  return { steps, graph: { v: 2, pos, edges, dim: {}, col } };
}

const find = id => TYPES.find(d => d[0] === id);
MSA.tpl = {
  PH, TYPES, CATS, find,
  count: d => d[5].reduce((a, r) => a + r.length, 0),
  name: d => T(d[3][0], d[3][1]), desc: d => T(d[4][0], d[4][1]),
  catName: c => T(c[1], c[2]),
  phaseName: k => T(PH[k][1][0], PH[k][1][1]),
  make: id => { const d = find(id); return d ? make(d) : null; }
};
})();
