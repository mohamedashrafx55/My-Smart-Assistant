/* Pro tips per step: a small 💡 icon on every step opens a checklist of what a top-quality result needs for THAT step.
   The list follows the step (by its name) and the kind of project (video vs. design), so it changes as you move between steps. */
(function(){
'use strict';
const MSA = window.MSA, U = MSA.u, I = MSA.icon, esc = U.esc, T = (a, e) => MSA.T(a, e);
const C = {};   /* id -> { h:[ar,en], t:[[ar,en],…] } */
const add = (id, h, tips) => { C[id] = { h, t: tips }; };

/* ---------------- process steps ---------------- */
add('brief', ['الملخص (Brief)', 'The brief'], [
  ['هدف واحد واضح للمشروع (بيع؟ وعي؟ تسجيل؟) مكتوب في جملة', 'One clear goal in a single sentence (sell? awareness? sign-ups?)'],
  ['الجمهور المستهدف: السن والاهتمامات والمنصة اللي بيستخدمها', 'Target audience: age, interests and the platform they use'],
  ['الرسالة الأساسية الوحيدة اللي لازم توصل', 'The single key message that must land'],
  ['المقاسات والصيغ والمنصات المطلوبة من أول يوم', 'Sizes, formats and platforms required from day one'],
  ['الميزانية والموعد النهائي وعدد جولات التعديل المتفق عليها', 'Budget, deadline and the agreed number of revision rounds'],
  ['أمثلة يحبها العميل وأمثلة يكرهها (مرجعيات)', 'Examples the client likes and dislikes (references)'],
  ['المحتوى الجاهز: لوجو، نصوص، صور، ألوان الهوية القديمة', 'Available assets: logo, copy, photos, existing brand colours'],
  ['اكتب الملخص وخلّي العميل يوافق عليه كتابةً قبل ما تبدأ', 'Write it down and get the client to approve it before you start']]);
add('idea', ['الفكرة', 'The idea'], [
  ['ابدأ بفكرة كبيرة واحدة تلخّص الرسالة في صورة أو جملة', 'Start with one big idea that sums the message up in an image or a line'],
  ['اعمل عصف ذهني: 10 أفكار سريعة قبل ما تختار واحدة', 'Brainstorm 10 quick ideas before choosing one'],
  ['اسأل: إيه اللي يميّزنا عن المنافسين؟ وابني عليه', 'Ask what sets us apart from competitors, and build on it'],
  ['اختبر الفكرة: تتفهم في 3 ثواني من غير شرح؟', 'Test it: is it understood in 3 seconds without explanation?'],
  ['خلّي الفكرة تشتغل على كل المنصات مش منصة واحدة بس', 'Make sure it works across platforms, not just one'],
  ['ارسم Thumbnails صغيرة بالقلم قبل ما تفتح البرنامج', 'Sketch small thumbnails by hand before opening the software']]);
add('mood', ['المود بورد', 'Moodboard'], [
  ['15–30 صورة مرجعية فقط، مش مئات: الجودة قبل الكمية', 'Only 15–30 references, not hundreds: quality over quantity'],
  ['غطِّ: الألوان، الإضاءة، التركيب، الخطوط، الملمس، الإحساس العام', 'Cover colours, lighting, composition, type, texture and overall feel'],
  ['اكتب جنب كل مرجع ليه اخترته (إيه اللي عاجبك فيه)', 'Note why you picked each reference (what you like in it)'],
  ['اجمع بين مراجع من نفس المجال ومراجع من مجالات تانية للإلهام', 'Mix references from the same field and from other fields for inspiration'],
  ['اعرضه على العميل قبل التنفيذ للتأكد إنكم في نفس الاتجاه', 'Show it to the client before production to confirm you share a direction'],
  ['حدّد 3 كلمات توصف الستايل (مثلاً: دافئ، جريء، بسيط)', 'Pick 3 words that describe the style (e.g. warm, bold, simple)']]);
add('foundations', ['الأسس البصرية', 'Visual foundations'], [
  ['الأسس = ألوان + خطوط + أيقونات + أسلوب صور: كلها لازم تتفق مع بعض', 'Foundations = colours + fonts + icons + image style: they must agree with each other'],
  ['حدّد قواعد الاستخدام: إيه المسموح وإيه الممنوع', 'Define usage rules: what is allowed and what is not'],
  ['اختبرها على تصميم تجريبي واحد قبل اعتمادها', 'Test them on one sample layout before locking them in'],
  ['وثّقها في صفحة واحدة يرجع لها أي حد في الفريق', 'Document them on one page anyone on the team can use']]);
add('colors', ['الألوان', 'Colour palette'], [
  ['لون أساسي واحد + لون ثانوي + لون تمييز (Accent)، وحيادي للخلفيات', 'One primary + one secondary + one accent, plus a neutral for backgrounds'],
  ['قاعدة 60-30-10 لتوزيع الألوان على التصميم', 'Use the 60-30-10 rule to distribute colours'],
  ['تأكد من التباين: النص على الخلفية يحقق نسبة 4.5:1 على الأقل', 'Check contrast: text on background should reach at least 4.5:1'],
  ['اختبر الألوان بالأبيض والأسود والتدرج الرمادي', 'Test the palette in black & white and greyscale'],
  ['سجّل الأكواد: HEX للشاشة، وCMYK/بانتون للطباعة', 'Record codes: HEX for screens, CMYK/Pantone for print'],
  ['راجع معنى اللون ثقافيًا لجمهورك (الأحمر، الأخضر، الأسود…)', 'Check what each colour means culturally for your audience'],
  ['حضّر نسخة للوضع الداكن لو في تطبيق أو موقع', 'Prepare a dark-mode variant for apps and websites']]);
add('fonts', ['الخطوط', 'Typography'], [
  ['خطّان بحد أقصى: واحد للعناوين وواحد للنصوص', 'Two fonts at most: one for headlines, one for body'],
  ['اختار خط عربي وخط إنجليزي منسجمين في الوزن والإحساس', 'Pick an Arabic and a Latin font that match in weight and feel'],
  ['حدّد مستويات واضحة: عنوان رئيسي، فرعي، نص، تعليق', 'Define clear levels: title, subtitle, body, caption'],
  ['حجم النص لا يقل عن 14px على الشاشة و9pt في الطباعة', 'Body text no smaller than 14px on screen and 9pt in print'],
  ['تأكد من الترخيص التجاري للخط قبل الاستخدام', 'Check the font’s commercial licence before using it'],
  ['اختبر الخط بنص حقيقي بالعربي مش Lorem Ipsum فقط', 'Test the font with real Arabic copy, not just Lorem Ipsum'],
  ['راجع التشكيل والأرقام والرموز المتاحة في الخط', 'Check diacritics, numerals and symbols supported by the font']]);
add('icons', ['الأيقونات', 'Icons'], [
  ['مجموعة واحدة بنفس سُمك الخط والزوايا والأسلوب', 'One set with the same stroke weight, corners and style'],
  ['اشتغل على شبكة ثابتة (24px أو 32px) وهوامش أمان', 'Work on a fixed grid (24px or 32px) with safe margins'],
  ['اختبرها بحجم صغير 16–24px: لازم تتفهم', 'Test at small sizes 16–24px: they must still read'],
  ['خلّيها بسيطة: تفصيل زيادة = ضبابية في الحجم الصغير', 'Keep them simple: extra detail turns muddy at small sizes'],
  ['سلّمها SVG مع نسخ ملونة وأحادية اللون', 'Deliver SVG with coloured and single-colour versions']]);
add('imagestyle', ['أسلوب الصور', 'Image style'], [
  ['حدّد الإضاءة (ناعمة/قوية) ودرجة التباين والتشبّع بشكل ثابت', 'Fix the lighting (soft/hard), contrast and saturation level'],
  ['نفس معالجة الألوان (Preset) على كل الصور عشان تبقى عائلة واحدة', 'Use the same colour treatment (preset) on every photo to keep them a family'],
  ['زوايا التصوير والتكوين ثابتة (قريب، مستوى العين، من فوق)', 'Keep angles and composition consistent (close-up, eye-level, top-down)'],
  ['اتفق على الخلفيات والـ Props والأشخاص (واقعي ولا استوديو)', 'Agree on backgrounds, props and people (real-life or studio)'],
  ['راجع حقوق الصور وتصاريح الأشخاص', 'Check image rights and model releases'],
  ['حضّر أمثلة Do / Don’t للمصوّر أو المصمم', 'Prepare Do / Don’t examples for the photographer or designer']]);
add('logo', ['اللوجو', 'Logo'], [
  ['بسيط وسهل التذكر: يتفهم ويتنسخ بالرسم من الذاكرة', 'Simple and memorable: easy to recall and redraw from memory'],
  ['اشتغل بالأبيض والأسود الأول؛ اللون يجي بعد ما الشكل ينجح', 'Work in black and white first; add colour after the shape works'],
  ['اختبره بأحجام صغيرة (16px) وكبيرة (لوحة إعلانات)', 'Test it tiny (16px) and huge (billboard)'],
  ['نسخ جاهزة: أفقي، رأسي، أيقونة فقط، فاتح، داكن، أحادي اللون', 'Ready versions: horizontal, stacked, icon-only, light, dark, monochrome'],
  ['مساحة أمان حوالين اللوجو وأقل حجم مسموح', 'Clear space around the logo and a minimum size'],
  ['راجع التشابه مع لوجوهات موجودة قبل التسليم', 'Check similarity with existing logos before delivery'],
  ['اعرضه على موكاب حقيقي (كارت، لافتة، أيقونة تطبيق)', 'Show it on real mockups (card, sign, app icon)'],
  ['سلّم: AI/SVG وPNG شفاف وPDF للطباعة', 'Deliver AI/SVG, transparent PNG and print-ready PDF']]);
add('slogan', ['الشعار اللفظي (Slogan)', 'Slogan / tagline'], [
  ['قصير: من 3 إلى 7 كلمات', 'Short: 3 to 7 words'],
  ['يقول الفائدة أو الإحساس، مش وصف المنتج فقط', 'States a benefit or feeling, not only a product description'],
  ['سهل النطق والحفظ ومتناغم (سجع أو إيقاع لو يناسب)', 'Easy to say and remember, with rhythm if it fits'],
  ['اكتب 10 نسخ واختار الأقوى بعد يوم راحة', 'Write 10 versions and choose the strongest after a break'],
  ['راجع إنه مش مستخدم عند منافس', 'Check that a competitor isn’t already using it'],
  ['اختبره بصوت عالي وفي سياق التصميم', 'Read it aloud and test it inside the layout']]);
add('templates', ['القوالب والشبكة', 'Templates & grid'], [
  ['شبكة أعمدة ثابتة (مثلاً 12 عمود) وهوامش متساوية', 'A fixed column grid (e.g. 12 columns) with equal margins'],
  ['مساحات للشعار والعنوان والنص وCTA في أماكن ثابتة', 'Fixed zones for logo, headline, body and CTA'],
  ['قوالب لكل المقاسات المطلوبة (بوست، ستوري، غلاف…)', 'Templates for every required size (post, story, cover…)'],
  ['الطبقات منظّمة ومسمّاة، والنصوص قابلة للتعديل بسهولة', 'Layers organised and named, text easy to edit'],
  ['جرّب القالب بنص طويل وقصير وبالعربي والإنجليزي', 'Test the template with long and short copy, in Arabic and English']]);
add('designMain', ['التصميم الرئيسي', 'Main design'], [
  ['نقطة تركيز واحدة (Focal point) توجّه العين أول ما تشوف التصميم', 'One focal point that guides the eye first'],
  ['تسلسل بصري واضح: العنوان ثم الصورة ثم التفاصيل ثم الدعوة للفعل', 'Clear hierarchy: headline, image, details, then the call-to-action'],
  ['مساحات بيضاء كافية: الزحمة بتقتل الرسالة', 'Enough white space: clutter kills the message'],
  ['تباين قوي بين النص والخلفية وقراءة سهلة', 'Strong contrast between text and background for easy reading'],
  ['التزم بالهوية: ألوان وخطوط ولوجو بنفس القواعد', 'Stick to the brand: colours, fonts and logo as per the rules'],
  ['محاذاة وتباعد ثابتين (Grid)', 'Consistent alignment and spacing (grid)'],
  ['اتأكد من الأخطاء الإملائية قبل التصدير', 'Proofread for typos before export'],
  ['شوف التصميم مصغّر وبالأبيض والأسود: لسه واضح؟', 'View it small and in black & white: is it still clear?']]);
add('poster', ['تصميم بوستر / إعلان', 'Poster / ad design'], [
  ['عنوان ضخم يُقرأ من بعيد في أقل من 3 ثواني', 'A big headline readable from afar in under 3 seconds'],
  ['صورة أو عنصر بصري قوي واحد يعبّر عن الرسالة', 'One strong visual that expresses the message'],
  ['تسلسل: عنوان ← تفاصيل ← دعوة للفعل (CTA) ← لوجو', 'Order: headline → details → call-to-action → logo'],
  ['قلّل النص: المعلومات الأساسية فقط (إيه، إمتى، فين، إزاي)', 'Cut the copy: essentials only (what, when, where, how)'],
  ['زر/جملة CTA واضحة وبارزة', 'A clear, prominent CTA button or line'],
  ['مساحة أمان عن الحواف، وهامش قص (Bleed 3mm) لو للطباعة', 'Safe margins from the edge, and 3mm bleed for print'],
  ['وضّح بيانات التواصل بشكل سهل المسح (QR / رقم / حساب)', 'Make contact details easy to act on (QR / phone / handle)'],
  ['جرّب الاتجاه الأفقي والرأسي والمقاسات المختلفة', 'Try portrait, landscape and the other required sizes']]);
add('social', ['بوست سوشيال / ستوري', 'Social post / story'], [
  ['أول نظرة تشدّ: عنصر جذب في أول ثانية (Hook)', 'Stop the scroll: a hook in the first second'],
  ['مقاس المنصة الصحيح (1080×1350 للبوست، 1080×1920 للستوري)', 'The right platform size (1080×1350 post, 1080×1920 story)'],
  ['ابعد عن مناطق الواجهة في الستوري (أعلى وأسفل 250px)', 'Keep clear of the story UI zones (top and bottom ~250px)'],
  ['نص قليل بخط كبير مقروء على الموبايل', 'Little copy in a big font readable on a phone'],
  ['هوية ثابتة: نفس الألوان والخطوط والقوالب', 'Consistent identity: the same colours, fonts and templates'],
  ['في الكاروسيل: أول سلايد يشد وآخر سلايد فيه CTA', 'For carousels: slide 1 hooks, the last slide has the CTA'],
  ['اكتب كابشن مع هاشتاجات مناسبة وموعد نشر', 'Write the caption with fitting hashtags and a posting time'],
  ['شوف التصميم على موبايل حقيقي قبل التسليم', 'Preview on a real phone before delivering']]);
add('onscreen', ['العرض على الشاشة', 'On-screen'], [
  ['حدّد المنصات والمقاسات ونسب الأبعاد المطلوبة', 'List the platforms, sizes and aspect ratios needed'],
  ['صمّم للموبايل أولاً: أغلب الجمهور بيشاهد عليه', 'Design for mobile first: most of your audience is there'],
  ['صدّر بصيغ وضغط مناسب للويب (WebP/PNG/MP4)', 'Export in web-friendly formats and compression (WebP/PNG/MP4)'],
  ['اختبر على أجهزة وإضاءات مختلفة', 'Test on different devices and brightness levels']]);
add('printing', ['الطباعة', 'Printing'], [
  ['الدقة 300dpi على الأقل بالمقاس النهائي', 'At least 300dpi at final size'],
  ['وضع الألوان CMYK مش RGB، وراجع الألوان الزاهية اللي ممكن تخفت', 'Use CMYK, not RGB, and watch bright colours that may dull'],
  ['هامش قص (Bleed) 3مم وعلامات القص وهوامش أمان 5مم', '3mm bleed, crop marks and 5mm safe margins'],
  ['تحويل الخطوط إلى Outlines أو تضمينها في الـ PDF', 'Outline the fonts or embed them in the PDF'],
  ['اسأل المطبعة عن الورق والتشطيب (مطفي/لامع/سبوت UV) واطلب عينة', 'Ask the printer about paper and finish (matte/gloss/spot UV) and request a proof'],
  ['الأسود الغني للمساحات الكبيرة، والأسود العادي للنص الصغير', 'Rich black for large areas, plain black for small text'],
  ['راجع النصوص والأرقام مرتين قبل إرسال الملف', 'Proofread text and numbers twice before sending the file']]);
add('mockups', ['الموكاب والعرض', 'Mockups & presentation'], [
  ['استخدم موكاب واقعي بإضاءة وظلال تناسب التصميم', 'Use realistic mockups with lighting and shadows matching the design'],
  ['اعرض التصميم في سياقه الحقيقي (كارت، لافتة، أبليكيشن، تغليف)', 'Show the design in context (card, sign, app, packaging)'],
  ['رتّب العرض: الفكرة ← التصميم ← التطبيقات', 'Order the presentation: idea → design → applications'],
  ['اكتب سطرين تشرح بيهم قرارات التصميم', 'Add two lines explaining your design decisions'],
  ['حافظ على جودة عالية من غير ضغط زائد', 'Keep high quality without over-compression']]);
add('identity', ['الهوية البصرية', 'Brand identity'], [
  ['لوجو بنسخه + ألوان + خطوط + أيقونات + أسلوب صور', 'Logo versions + colours + fonts + icons + image style'],
  ['قواعد الاستخدام: المساحة الآمنة، الحد الأدنى للحجم، الممنوعات', 'Usage rules: clear space, minimum size, don’ts'],
  ['تطبيقات حقيقية: ورقيات، سوشيال، تغليف، شاشات', 'Real applications: stationery, social, packaging, screens'],
  ['نبرة الصوت والشخصية مع الجانب البصري', 'Voice and personality alongside the visuals'],
  ['كتيب هوية (Brand Guidelines) مرتب بصيغة PDF', 'A tidy brand-guidelines PDF'],
  ['ملفات مصدر منظمة جاهزة لأي مصمم يكمل بعدك', 'Organised source files any designer can continue from']]);
add('packaging', ['تصميم التغليف', 'Packaging design'], [
  ['ابدأ من الـ Dieline الحقيقي من المطبعة', 'Start from the printer’s real dieline'],
  ['الاسم وفئة المنتج أول ما تقع عليه العين على الرف', 'Brand and product type must read first on the shelf'],
  ['معلومات إلزامية: المكونات، الوزن، تاريخ الصلاحية، الباركود', 'Mandatory info: ingredients, weight, expiry date, barcode'],
  ['مساحات آمنة بعيد عن الطيّات والقص', 'Safe zones away from folds and cuts'],
  ['اطلب موكاب أبيض (Prototype) واختبر الأبعاد', 'Order a white prototype and test dimensions'],
  ['تفاصيل التشطيب: رقائق، بارز، سبوت UV', 'Finishing details: foil, emboss, spot UV']]);
add('menu', ['المنيو / قائمة الطعام', 'Menu design'], [
  ['تقسيم واضح للأقسام وتسلسل مريح للقراءة', 'Clear sections and a comfortable reading order'],
  ['الأسعار محاذية بشكل ثابت وبدون عملة مكررة', 'Prices aligned consistently, without repeating the currency'],
  ['صور قليلة وعالية الجودة لأهم الأصناف', 'A few high-quality photos for key items'],
  ['خط مقروء في الإضاءة الخافتة', 'A font readable in dim lighting'],
  ['راجع الأسماء والأسعار والمكونات مع العميل', 'Verify names, prices and ingredients with the client']]);
add('presentation', ['العرض التقديمي', 'Presentation'], [
  ['فكرة واحدة لكل شريحة وعنوان يلخصها', 'One idea per slide with a headline that sums it up'],
  ['نص قليل وخط كبير، والصور أهم من الفقرات', 'Little text, big font; images matter more than paragraphs'],
  ['قالب ثابت (Master) بالألوان والخطوط', 'A consistent master template with colours and fonts'],
  ['قصة بداية ووسط ونهاية، ونهاية فيها دعوة للفعل', 'A story with beginning, middle and end, closing on a call-to-action'],
  ['اختبر العرض على الشاشة النهائية', 'Test the deck on the final screen']]);
add('web', ['واجهة / موقع / تطبيق', 'UI / website / app'], [
  ['ابدأ بـ Wireframe بسيط قبل التصميم النهائي', 'Start with a simple wireframe before the final design'],
  ['هرمية واضحة وزر رئيسي واحد في كل شاشة', 'A clear hierarchy and one primary button per screen'],
  ['مقاسات اللمس لا تقل عن 44px وتباين مناسب', 'Touch targets of at least 44px and sufficient contrast'],
  ['صمّم الحالات: تحميل، فراغ، خطأ، نجاح', 'Design the states: loading, empty, error, success'],
  ['صمّم للموبايل أولًا ثم الشاشات الأكبر', 'Design mobile-first, then larger screens'],
  ['دعم RTL للعربي: الاتجاهات والأيقونات والمحاذاة', 'Support RTL for Arabic: direction, icons and alignment'],
  ['نظام ثابت: Spacing وألوان ومكوّنات قابلة لإعادة الاستخدام', 'A consistent system: spacing, colours and reusable components']]);
add('infographic', ['إنفوجرافيك', 'Infographic'], [
  ['رسالة واحدة وأرقام قليلة قوية', 'One message and a few powerful numbers'],
  ['تدفق قراءة واضح من أعلى لأسفل', 'A clear top-to-bottom reading flow'],
  ['رسوم بيانية صحيحة النسب وبدون تشويه', 'Charts with true proportions and no distortion'],
  ['أيقونات وألوان متسقة وقليلة', 'Few, consistent icons and colours'],
  ['اذكر المصدر في الأسفل', 'Cite the source at the bottom']]);
add('retouch', ['معالجة الصور', 'Photo retouching'], [
  ['اشتغل غير مدمّر (Layers وSmart Objects وMasks)', 'Work non-destructively (layers, smart objects, masks)'],
  ['صحّح الإضاءة والألوان قبل التفاصيل', 'Fix exposure and colour before details'],
  ['حافظ على ملمس البشرة الطبيعي، ما تبالغش في التنعيم', 'Keep natural skin texture; don’t over-smooth'],
  ['راجع الحواف والقص والظلال', 'Check edges, cut-outs and shadows'],
  ['قارن Before/After وصدّر بالمقاس والجودة المناسبين', 'Compare before/after and export at the right size and quality']]);
add('review', ['مراجعة العميل والتعديلات', 'Client review & revisions'], [
  ['ابعت العمل مع شرح قصير لقرارات التصميم', 'Send the work with a short explanation of your decisions'],
  ['اطلب ملاحظات محددة في ورقة واحدة مش رسائل متفرقة', 'Ask for specific feedback in one list, not scattered messages'],
  ['فرّق بين تعديل داخل النطاق وطلب جديد خارجه', 'Separate in-scope edits from new out-of-scope requests'],
  ['سجّل رقم الجولة وحافظ على النسخ (v1, v2…)', 'Track the round number and keep versions (v1, v2…)'],
  ['اتأكد إن كل ملاحظة اتنفذت قبل إعادة الإرسال', 'Confirm every note is applied before re-sending'],
  ['ثبّت الموافقة النهائية كتابةً', 'Get the final approval in writing']]);
add('delivery', ['التسليم', 'Delivery'], [
  ['كل الصيغ المطلوبة: للويب وللطباعة وللسوشيال', 'All requested formats: web, print and social'],
  ['ملفات منظّمة في مجلدات بأسماء واضحة ومتسقة', 'Files in folders with clear, consistent names'],
  ['الملفات المصدرية المتفق عليها (PSD/AI/Project)', 'The agreed source files (PSD/AI/project)'],
  ['الخطوط المستخدمة وروابط تحميلها وتراخيصها', 'Fonts used, with download links and licences'],
  ['راجع مرة أخيرة: الأسماء، الأخطاء، الجودة', 'A last check: names, typos, quality'],
  ['اكتب رسالة تسليم قصيرة وتأكد من استلام العميل', 'Write a short handover note and confirm receipt'],
  ['اطلب الدفعة المتبقية وتقييمًا أو شهادة عميل', 'Request the remaining payment and a testimonial']]);

/* ---------------- video steps ---------------- */
add('videoMain', ['الفيديو', 'The video'], [
  ['أول 3 ثواني تشدّ المشاهد (Hook) قبل أي مقدمة', 'The first 3 seconds hook the viewer before any intro'],
  ['رسالة واحدة وهدف واحد واضح للفيديو', 'One message and one clear goal'],
  ['إيقاع مناسب للمنصة: ريلز سريع، يوتيوب أهدأ شوية', 'Pace for the platform: fast for reels, calmer for YouTube'],
  ['صوت نظيف أهم من الصورة: المشاهد يتحمل صورة متوسطة لكن مش صوت وحش', 'Clean audio beats image quality: viewers forgive a soft image, not bad sound'],
  ['ترجمة على الشاشة (Captions): معظم الناس بتشاهد بدون صوت', 'On-screen captions: most people watch muted'],
  ['دعوة للفعل (CTA) واضحة في النهاية', 'A clear call-to-action at the end'],
  ['نفس هوية العلامة: ألوان وخطوط ولوجو ثابتين', 'Consistent branding: colours, fonts and logo'],
  ['راجع الفيديو على موبايل وبسماعة قبل التسليم', 'Review on a phone and with headphones before delivery']]);
add('reel', ['ريلز / فيديو قصير', 'Reel / short video'], [
  ['Hook في أول ثانية بسؤال أو مشهد قوي أو نص كبير', 'A hook in the first second: question, strong shot or big text'],
  ['مدة 15–30 ثانية غالبًا، وقصّة بدون فراغات', '15–30 seconds is the sweet spot; no dead air'],
  ['قصّات سريعة كل 1–3 ثواني مع حركة داخل الكادر', 'Quick cuts every 1–3 seconds with movement inside the frame'],
  ['كادر رأسي 9:16 مع مناطق آمنة للنصوص', 'Vertical 9:16 framing with safe zones for text'],
  ['ترجمة كبيرة وواضحة ومتزامنة مع الكلام', 'Big, clear captions synced with speech'],
  ['موسيقى ترند مناسبة مع خفض مستواها تحت الصوت', 'A fitting trending track mixed below the voice'],
  ['نهاية تحفّز على التكرار (Loop) أو الحفظ أو المتابعة', 'An ending that invites replay, saves or follows'],
  ['اكتب كابشن وهاشتاجات وغلاف جذّاب', 'Write the caption, hashtags and an eye-catching cover']]);
add('script', ['السيناريو', 'Script'], [
  ['ابدأ بالهدف والجمهور ثم الرسالة الأساسية', 'Start from goal, audience and the key message'],
  ['Hook قوي في أول جملة', 'A strong hook in the first line'],
  ['كل مشهد له غرض واحد: لو مش بيخدم الرسالة امسحه', 'Every scene has one purpose: cut it if it doesn’t serve the message'],
  ['اكتب بلغة المتحدّث: جمل قصيرة وسهلة النطق', 'Write the way people speak: short, easy-to-say sentences'],
  ['قدّر المدة: حوالي 150 كلمة = دقيقة', 'Estimate duration: roughly 150 words = one minute'],
  ['حدّد مكان اللقطات الإضافية (B-roll) والنصوص على الشاشة', 'Mark where B-roll and on-screen text go'],
  ['نهاية بدعوة للفعل واضحة', 'End with a clear call-to-action'],
  ['اقرأه بصوت عالي وعدّل أي جملة تتعثر فيها', 'Read it aloud and fix any line you stumble on']]);
add('storyboard', ['الستوري بورد', 'Storyboard'], [
  ['رسمة بسيطة لكل لقطة مع رقمها', 'A simple sketch per shot with its number'],
  ['حدّد حجم اللقطة: واسعة، متوسطة، قريبة', 'Mark the shot size: wide, medium, close-up'],
  ['حركة الكاميرا: ثابتة، Pan، Dolly، Handheld', 'Camera movement: static, pan, dolly, handheld'],
  ['اكتب الحوار أو الصوت أو النص تحت كل لقطة', 'Write dialogue, sound or text under each shot'],
  ['تأكد من استمرارية الاتجاهات والشاشة (قاعدة 180°)', 'Keep direction and screen continuity (the 180° rule)'],
  ['قدّر مدة كل لقطة وجمّعها مع المدة الكلية', 'Estimate each shot’s duration and total them up'],
  ['شاركه مع العميل واعتمده قبل التصوير', 'Share it with the client and approve it before shooting']]);
add('shooting', ['التصوير', 'Shooting'], [
  ['الإضاءة أولًا: مصدر رئيسي ناعم، وإضاءة تعبئة، وخلفية', 'Lighting first: a soft key, fill light and background separation'],
  ['صوت نظيف: ميكروفون قريب، واختبر الصوت قبل كل لقطة', 'Clean audio: a close mic, tested before every take'],
  ['ثبّت الكاميرا أو استخدم Gimbal، وتجنب الاهتزاز غير المقصود', 'Stabilise the camera or use a gimbal; avoid accidental shake'],
  ['صوّر لقطات إضافية (B-roll) ولقطات قطع (Cutaways)', 'Shoot B-roll and cutaways'],
  ['قاعدة الأثلاث ومساحة فوق الرأس (Headroom) وخط نظر مناسب', 'Rule of thirds, proper headroom and eye-line'],
  ['ثبّت الإعدادات: FPS، شتر 180°، ISO، وزن الأبيض', 'Lock settings: FPS, 180° shutter, ISO, white balance'],
  ['صوّر أكثر من لقطة لكل مشهد (واسعة، متوسطة، قريبة)', 'Cover each scene with wide, medium and close shots'],
  ['خُذ 5–10 ثواني صمت (Room tone) وراجع اللقطات قبل ما تفك المكان', 'Record 5–10 s of room tone and check footage before wrapping']]);
add('editing', ['المونتاج', 'Editing'], [
  ['رتّب الملفات في مجلدات ورتّب Timeline منظم (فيديو/صوت/مؤثرات)', 'Organise bins and keep a tidy timeline (video/audio/FX)'],
  ['اعمل Rough Cut أولًا لبناء القصة، ثم Fine Cut للإيقاع', 'Rough cut for story first, then fine cut for rhythm'],
  ['قص على الحركة أو الصوت، واشيل كل لحظة ميتة', 'Cut on action or sound and remove every dead moment'],
  ['استخدم J-cut وL-cut لانتقال صوتي سلس', 'Use J-cuts and L-cuts for smooth audio transitions'],
  ['انتقالات بسيطة ومتسقة، وتجنّب الإفراط', 'Simple, consistent transitions; avoid overdoing them'],
  ['غيّر المشهد/الكادر كل بضع ثواني للحفاظ على الانتباه', 'Change the visual every few seconds to hold attention'],
  ['اعرض الفيديو بدون صوت: لسه مفهوم؟ ثم بدون صورة: لسه ممتع؟', 'Watch muted: still clear? Then eyes closed: still engaging?'],
  ['احفظ نسخ المشروع (v1, v2) وأنشئ Proxy للملفات الثقيلة', 'Save project versions (v1, v2) and create proxies for heavy files']]);
add('sound', ['الصوت والموسيقى', 'Sound & music'], [
  ['نظّف الصوت: Noise reduction وEQ وضغط خفيف', 'Clean the voice: noise reduction, EQ and light compression'],
  ['الصوت البشري حوالي -12 إلى -6 dB والموسيقى أقل بـ 15–20 dB تحته', 'Voice around -12 to -6 dB with music 15–20 dB underneath'],
  ['Ducking: خفض الموسيقى أوتوماتيك وقت الكلام', 'Duck the music automatically while speaking'],
  ['مؤثرات صوتية (SFX) خفيفة تدعم الحركة والانتقالات', 'Light sound effects that support motion and transitions'],
  ['موسيقى مرخّصة للاستخدام التجاري', 'Music licensed for commercial use'],
  ['المستوى النهائي حوالي -14 LUFS للسوشيال و-16 لـ YouTube تقريبًا', 'Final loudness around -14 LUFS for social, -16 for YouTube'],
  ['اسمع على سماعة وعلى سماعة موبايل', 'Listen on headphones and on a phone speaker']]);
add('grading', ['تصحيح وتلوين الألوان', 'Colour correction & grading'], [
  ['صحّح أولًا: التعريض ووزن الأبيض والتباين', 'Correct first: exposure, white balance and contrast'],
  ['اضبط تطابق اللقطات (Shot matching) قبل التلوين الإبداعي', 'Match shots before creative grading'],
  ['استخدم Scopes (Waveform/Vectorscope) مش عينك فقط', 'Use the scopes (waveform/vectorscope), not only your eyes'],
  ['حافظ على ألوان البشرة طبيعية (خط Skin Tone)', 'Keep skin tones natural (skin-tone line)'],
  ['ستايل لوني ثابت يخدم المود (دافئ، بارد، سينمائي)', 'A consistent look that serves the mood (warm, cool, cinematic)'],
  ['راجع على شاشة معايَرة وعلى موبايل', 'Check on a calibrated monitor and on a phone']]);
add('subtitles', ['الترجمة والنصوص', 'Subtitles & titles'], [
  ['سطرين كحد أقصى وحوالي 32–42 حرف في السطر', 'Two lines maximum, about 32–42 characters per line'],
  ['خط واضح مع ظل أو خلفية خفيفة لضمان القراءة', 'A clear font with a shadow or light background for legibility'],
  ['تزامن الكلمات مع الصوت وراجع الإملاء', 'Sync with the speech and proofread'],
  ['ابعد عن الحواف ومناطق واجهة المنصة', 'Stay away from the edges and platform UI zones'],
  ['ظهور وحركة بسيطة للعناوين بدون إزعاج', 'Simple title entrances that don’t distract']]);
add('thumbnail', ['الغلاف المصغّر', 'Thumbnail / cover'], [
  ['وجه معبّر أو عنصر واحد قوي في المنتصف', 'An expressive face or one strong subject'],
  ['نص قصير جدًا (2–4 كلمات) بخط ضخم', 'Very short text (2–4 words) in a huge font'],
  ['تباين عالٍ وألوان تلفت الانتباه بين التوصيات', 'High contrast and colours that stand out among suggestions'],
  ['يُقرأ بحجم صغير جدًا على الموبايل', 'Readable at a tiny phone size'],
  ['لا يخالف الفيديو: وعد حقيقي بدون خداع', 'Don’t mislead: promise what the video delivers']]);
add('export', ['التصدير', 'Export'], [
  ['الدقة وFPS مطابقان للمشروع الأصلي', 'Resolution and frame rate match the project'],
  ['صيغة MP4 (H.264) للسوشيال، وProRes أو High-bitrate للأرشيف', 'MP4 (H.264) for social, ProRes or high bitrate for archive'],
  ['Bitrate مناسب: حوالي 10–16 Mbps لـ 1080p', 'A suitable bitrate: about 10–16 Mbps for 1080p'],
  ['شاهد الملف المُصدَّر كاملًا قبل الإرسال', 'Watch the exported file in full before sending'],
  ['اتأكد من الحدود الآمنة والصوت المزامن', 'Confirm safe margins and synced audio'],
  ['صدّر نسخ لكل منصة (9:16، 1:1، 16:9)', 'Export a version per platform (9:16, 1:1, 16:9)']]);
add('motion', ['الموشن جرافيك', 'Motion graphics'], [
  ['حركة بإيقاع ثابت: Ease-in/out بدل الحركة الخطية', 'Consistent timing: ease in/out instead of linear motion'],
  ['تسلسل الحركة: العنصر الأهم يتحرك أول', 'Sequence the motion: the most important element moves first'],
  ['مدة الحركات 0.3–0.8 ثانية للواجهات، وأبطأ للمشاعر', '0.3–0.8 s for UI-style motion, slower for emotional moments'],
  ['Overshoot وFollow-through خفيف لإحساس طبيعي', 'A touch of overshoot and follow-through for a natural feel'],
  ['نفس هوية العلامة في الألوان والخطوط والحركة', 'Keep colours, fonts and motion on-brand'],
  ['قلّل العناصر في الشاشة: حركة واحدة أساسية كل لحظة', 'Fewer elements: one main motion at a time'],
  ['صدّر بدون تشويش واختبر بـ 60/30fps حسب المنصة', 'Export clean and test at 60/30fps as the platform needs']]);
add('generic', ['نصائح للخطوة', 'Step tips'], [
  ['حدّد هدف الخطوة ومعيار نجاحها قبل البدء', 'Define the goal of this step and what “done” means before starting'],
  ['اعمل نسخة أولية سريعة ثم حسّنها بدل الكمال من أول مرة', 'Make a fast first version, then refine it instead of aiming for perfect at once'],
  ['راجع مرجعيات (Moodboard/Brief) وأنت شغال', 'Check your references (moodboard/brief) as you work'],
  ['احفظ نسخًا بأسماء واضحة (v1, v2…)', 'Save versions with clear names (v1, v2…)'],
  ['خدّ استراحة وراجع الشغل بعين جديدة قبل ما تسلّمه', 'Take a break and review the work with fresh eyes before handing it over'],
  ['اطلب رأي شخص تثق فيه قبل العميل', 'Get feedback from someone you trust before the client']]);

/* ---------------- matching ---------------- */
const RULES = [
  ['export', /تصدير|ريندر|render|export|مخرجات الفيديو/],
  ['thumbnail', /thumbnail|غلاف|مصغر|كفر|cover/],
  ['subtitles', /ترجم|subtitle|caption|كابشن فيديو|نصوص على الشاشة|lower third/],
  ['grading', /تلوين|تصحيح الألوان|color\s*grad|colour\s*grad|grading|لوت|lut/],
  ['sound', /صوت|موسيق|مكساج|sound|audio|music|voice|تعليق صوتي|مؤثرات صوتية/],
  ['editing', /مونتاج|montage|edit(ing)?\b|قص الفيديو|تجميع|cut\b/],
  ['shooting', /تصوير|shoot|filming|film\b|لقطات|capture/],
  ['storyboard', /ستوري\s*بورد|storyboard|لقطات مرسومة|shot\s*list/],
  ['script', /سيناريو|script|نص الفيديو|حوار|screenplay/],
  ['reel', /ريلز|reel|shorts?|تيك\s*توك|tiktok/],
  ['motion', /موشن|motion|animation|انيميشن|أنيميشن|حركة/],
  ['slogan', /سلوجان|slogan|tagline|تاج\s*لاين|الشعار اللفظي/],
  ['logo', /لوجو|logo|شعار/],
  ['packaging', /تغليف|عبوة|علبة|packag|label|ليبل|dieline/],
  ['menu', /منيو|menu|قائمة طعام|قائمة الطعام/],
  ['presentation', /بريزنتيشن|presentation|slides?|سلايد|عرض تقديمي|pitch/],
  ['web', /موقع|website|web\b|ui\b|ux\b|واجهة|تطبيق|app\b|landing|لاندنج/],
  ['infographic', /انفوجراف|إنفوجراف|infographic|رسم بياني/],
  ['retouch', /ريتش|retouch|معالجة صور|تعديل صور|تنقية|photo edit/],
  ['identity', /هوية|identity|brand\s*guid|guidelines|كتيب/],
  ['poster', /بوستر|poster|ملصق|flyer|فلاير|اعلان|إعلان|\bad\b|banner|بانر|لافتة|يافطة|بروشور|brochure|كتالوج|catalog/],
  ['social', /سوشيال|social|بوست|post\b|ستوري|story|كاروسيل|carousel|انستجرام|instagram|فيسبوك|facebook/],
  ['mockups', /موكاب|mockup|mock-up/],
  ['printing', /طباعة|print|مطبعة|press/],
  ['colors', /ألوان|الوان|لون|colou?rs?|palette/],
  ['fonts', /خط(?!ة)|خطوط|font|typo|تايبو/],
  ['icons', /أيقون|ايقون|icon/],
  ['imagestyle', /أسلوب الصور|image\s*style|photo|صور/],
  ['templates', /قوال|template|grid|شبكة/],
  ['review', /مراجعة|تعديلات|revision|review|feedback|ملاحظات/],
  ['delivery', /تسليم|deliver|handoff|hand-off|handover/],
  ['mood', /مود|mood|مراجع|references/],
  ['brief', /brief|ملخص|متطلبات|requirements/],
  ['idea', /فكرة|فكره|idea|concept|كونسبت|عصف/]
];
const KEY2 = { brief: 'brief', idea: 'idea', mood: 'mood', foundations: 'foundations', colors: 'colors', fonts: 'fonts', icons: 'icons', imagestyle: 'imagestyle', logo: 'logo', slogan: 'slogan', main: 'designMain', templates: 'templates', onscreen: 'onscreen', static: 'social', motion: 'motion', printing: 'printing', mockups: 'mockups' };
const VIDEO = /فيديو|video|ريلز|reel|مونتاج|montage|يوتيوب|youtube|إعلان مرئي|clip|كليب|shorts?|تيك\s*توك|tiktok|موشن|motion/i;

function isVideoProject(p){ if (!p) return false; let v = VIDEO.test(p.name || ''); if (!v) MSA.proj.walk(p.steps, s => { if (!v && s.title && VIDEO.test(s.title)) v = true; }); return v; }
function parentOf(p, s){ const r = p && MSA.proj.find(p.steps, s.id); return r && r.parent ? r.parent : null; }
function pick(p, s){
  const own = String(s.title || '').toLowerCase(), key = s.key ? KEY2[s.key] : '';
  /* a custom-named step is matched by words; a built-in step by its key (then by its translated title) */
  let id = '';
  if (own) { const hit = RULES.find(r => r[1].test(own)); if (hit) id = hit[0]; }
  if (!id && key) id = key;
  if (!id) { const ti = String(MSA.proj.title(s) || '').toLowerCase(), hit = RULES.find(r => r[1].test(ti)); if (hit) id = hit[0]; }
  if (!id) { const pa = parentOf(p, s); if (pa) { const t = String(MSA.proj.title(pa) || '').toLowerCase(), hit = RULES.find(r => r[1].test(t)); if (hit) id = hit[0]; } }
  const video = isVideoProject(p);
  if (video && (id === 'designMain' || id === 'onscreen' || id === 'social')) id = /(reel|ريلز|shorts?|تيك)/i.test((p.name || '') + ' ' + own) ? 'reel' : 'videoMain';
  if (!id) id = 'generic';
  return id;
}

/* ---------------- UI ---------------- */
const open = new Set();
const sheet = (p, s) => { const id = pick(p, s); return { id, c: C[id] || C.generic }; };
const done = s => Array.isArray(s.tipsDone) ? s.tipsDone : (s.tipsDone = []);

function btnHTML(s, p){
  const r = sheet(p, s);
  return '<button class="icon-btn tips-btn' + (open.has(s.id) ? ' on' : '') + '" data-act="tips" title="' + esc(T('نصائح للوصول لأفضل نتيجة: ', 'Tips for the best result: ') + T(r.c.h[0], r.c.h[1])) + '" aria-label="tips" aria-pressed="' + open.has(s.id) + '">' + I('bulb', 'sm') + '</button>';
}
function boxHTML(s, p){
  if (!open.has(s.id)) return '';
  const r = sheet(p, s), d = done(s), n = r.c.t.filter((x, i) => d.includes(r.id + ':' + i)).length;
  return '<div class="tips-box" data-tips="' + s.id + '"><div class="tips-h">' + I('bulb', 'sm') + '<b>' + esc(T(r.c.h[0], r.c.h[1])) + '</b><span class="tips-n">' + n + '/' + r.c.t.length + '</span></div>' +
    '<div class="tips-sub">' + esc(T('أهم العناصر اللي تخلّي النتيجة احترافية — علّم اللي خلّصته:', 'Key elements for a professional result — tick what you have covered:')) + '</div>' +
    '<ul class="tips-l">' + r.c.t.map((x, i) => { const k = r.id + ':' + i; return '<li><button class="tip' + (d.includes(k) ? ' on' : '') + '" data-act="tip" data-k="' + k + '"><span class="tk">' + I('check', 'xs') + '</span><span dir="auto">' + esc(T(x[0], x[1])) + '</span></button></li>'; }).join('') + '</ul></div>';
}
function toggle(s){ if (open.has(s.id)) open.delete(s.id); else open.add(s.id); }
function tick(s, k, el){
  const d = done(s), i = d.indexOf(k); if (i >= 0) d.splice(i, 1); else d.push(k); MSA.save();
  if (el) { el.classList.toggle('on', d.includes(k)); const box = el.closest('.tips-box'); if (box) { const n = box.querySelectorAll('.tip.on').length, t = box.querySelectorAll('.tip').length, c = box.querySelector('.tips-n'); if (c) c.textContent = n + '/' + t; } }
}
MSA.tips = { btn: btnHTML, box: boxHTML, toggle, tick, pick, cats: C, isVideo: isVideoProject };
})();
