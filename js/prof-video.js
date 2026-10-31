/* "Academic professor" content — VIDEO steps (same shape as prof-design.js). */
(function(){
'use strict';
const D = (window.MSA.profData = window.MSA.profData || {});
const add = (id, intro, secs, acad, mist) => { D[id] = { intro, secs, acad, mist }; };

add('videoMain', ['الفيديو فن الزمن: كل ثانية لازم تكون ليها وظيفة، والإيقاع هو اللي بيمسك المشاهد.', 'Video is the art of time: every second needs a job, and pacing is what holds the viewer.'],
 [['الهيكل السردي', 'Narrative structure', 'بداية (خطّاف)، وسط (تطوير)، نهاية (حل أو دعوة للفعل). حتى الإعلان القصير ليه هيكل.', 'Beginning (hook), middle (development), end (resolution or call to action). Even a short ad has structure.'],
  ['الإيقاع (Pacing)', 'Pacing', 'سرعة تتابع اللقطات والمعلومات. التغيير في الإيقاع بيمنع الملل وبيبرز اللحظات المهمة.', 'The speed of shots and information. Varying it prevents boredom and highlights key moments.'],
  ['الوضوح البصري والسمعي', 'Visual & audio clarity', 'صورة ثابتة، صوت نظيف، ونص مقروء. الصوت السيئ بيخلّي المشاهد يقفل أسرع من الصورة السيئة.', 'Stable image, clean sound, readable text. Bad audio makes viewers quit faster than bad picture.'],
  ['الاتساق البصري', 'Visual consistency', 'نفس الألوان والخطوط والتصحيح اللوني عبر الفيديو كله.', 'The same colours, fonts and grade across the whole video.']],
 [['هيكل الفصول الثلاثة', 'Three-act structure', 'عرض، مواجهة، حل: أساس أي قصة.', 'Setup, confrontation, resolution: the basis of any story.'],
  ['الاحتفاظ بالمشاهد', 'Audience retention', 'أول 3 ثواني أهم وقت: هنا بيتحدد هيكمل ولا لأ.', 'The first 3 seconds decide whether the viewer stays.']],
 [['مقدمة طويلة قبل الفكرة', 'A long intro before the idea'], ['معلومات كتير في لقطة واحدة', 'Too much information in one shot']]);

add('reel', ['الريلز مساحته ضيقة جدًا: كل ثانية فيها لازم تثبت إنها تستحق.', 'A reel has very little room: every second must earn its place.'],
 [['الخطّاف في أول ثانيتين', 'The 2-second hook', 'سؤال، لقطة مفاجئة، أو نتيجة قبل الشرح. المشاهد بيقرر بسرعة.', 'A question, a surprising shot or the result before the explanation. Viewers decide fast.'],
  ['هيكل 15 ثانية', 'The 15-second structure', '0–2 خطّاف، 2–8 المحتوى، 8–13 الذروة، آخر ثانيتين دعوة للفعل أو لوب.', '0–2 hook, 2–8 content, 8–13 climax, last 2 call to action or loop.'],
  ['التصوير العمودي', 'Vertical framing', 'اعمل التكوين لـ 9:16 وابعد النصوص عن مناطق واجهة المنصة.', 'Compose for 9:16 and keep text clear of platform UI zones.'],
  ['النص على الشاشة', 'On-screen text', 'جمل قصيرة، تباين عالي، لأن ناس كتير بتشاهد بدون صوت.', 'Short lines, high contrast, since many people watch muted.'],
  ['اللوب والصوت الرائج', 'Looping & trending audio', 'نهاية بتوصل للبداية بتزود المشاهدة المتكررة.', 'An ending that connects to the start increases rewatches.']],
 [['اقتصاد الانتباه', 'Attention economy', 'المحتوى القصير بيتنافس على ثواني من انتباه المشاهد.', 'Short content competes for seconds of attention.'],
  ['قاعدة الحذف', 'Cut-to-the-bone editing', 'كل لقطة لازم تدفع القصة قدام.', 'Every shot must move the story forward.']],
 [['بداية بلوجو أو مقدمة', 'Opening with a logo or intro'], ['نص لا يُقرأ بسرعة', 'Text that cannot be read fast']]);

add('script', ['السيناريو هو الأساس: اللي بيتكتب كويس بيتصور ويتقطّع بسهولة.', 'The script is the foundation: what is written well is shot and edited easily.'],
 [['الهدف والرسالة', 'Goal & message', 'جملة واحدة: المشاهد هيعرف أو يحس أو يعمل إيه بعد الفيديو؟', 'One sentence: what will the viewer know, feel or do after the video?'],
  ['الكتابة للأذن', 'Writing for the ear', 'جمل قصيرة وكلام محكي. اقرأ النص بصوت عالي واسمع.', 'Short sentences and spoken language. Read it aloud and listen.'],
  ['الخطّاف والخاتمة', 'Hook & ending', 'ابدأ بحاجة تشد وانهي بدعوة واضحة.', 'Open with something gripping and end with a clear call.'],
  ['الصورة قبل الكلمة', 'Show, don’t tell', 'اللي ممكن يتشاف ما تقولهوش.', 'Do not say what can be shown.'],
  ['المدة', 'Timing', 'تقريبًا 150 كلمة في الدقيقة للتعليق الصوتي.', 'About 150 words per minute for voice-over.']],
 [['هيكل القصة', 'Story structure', 'مشكلة ← رحلة ← حل.', 'Problem → journey → solution.']],
 [['نص طويل ومعقد', 'Long, complex copy'], ['قول نفس الشيء بالصوت والصورة', 'Saying in voice what the picture already shows']]);

add('storyboard', ['الستوري بورد بيخلّيك «تقطّع» الفيديو على الورق قبل ما تصرف وقت التصوير.', 'The storyboard lets you “edit” on paper before you spend shooting time.'],
 [['قائمة اللقطات (Shot list)', 'Shot list', 'لكل لقطة: نوعها، حركة الكاميرا، المدة، والمكان.', 'For each shot: type, camera move, duration and location.'],
  ['أحجام اللقطات', 'Shot sizes', 'واسعة تعرّف المكان، متوسطة تحكي الفعل، قريبة تبرز الإحساس والتفاصيل.', 'Wide establishes place, medium tells the action, close-up shows emotion and detail.'],
  ['استمرارية الاتجاه', 'Screen direction', 'حافظ على اتجاه الحركة بين اللقطات علشان ما يحصلش ارتباك.', 'Keep movement direction across shots to avoid confusion.'],
  ['الانتقالات', 'Transitions', 'خطّط للانتقال بين اللقطات من البداية.', 'Plan the transition between shots from the start.']],
 [['قاعدة الـ 180 درجة', '180-degree rule', 'خلّي الكاميرا على جانب واحد من خط الحركة.', 'Keep the camera on one side of the action line.'],
  ['تأثير كوليشوف', 'Kuleshov effect', 'المعنى بيتولد من ترتيب اللقطات مش من اللقطة وحدها.', 'Meaning comes from shot order, not a single shot.']],
 [['كل اللقطات بنفس الحجم', 'All shots at the same size'], ['تجاهل الاستمرارية', 'Ignoring continuity']]);

add('shooting', ['التصوير الجيد بيوفر وقت المونتاج: اللي بيتصلّح في التصوير أرخص من اللي بيتصلّح بعده.', 'Good shooting saves editing time: fixing it on set is cheaper than fixing it later.'],
 [['الإضاءة', 'Lighting', 'مصدر رئيسي (Key) وتعبئة (Fill) وضوء خلفي (Back). الإضاءة اللينة بتجمّل الوجه.', 'Key, fill and back light. Soft light flatters faces.'],
  ['التكوين', 'Composition', 'قاعدة الأثلاث، مساحة فوق الرأس، وخلفية نظيفة.', 'Rule of thirds, headroom and a clean background.'],
  ['الثبات والحركة', 'Stability & movement', 'تريبود أو جيمبل، وحركة لها غرض.', 'Tripod or gimbal, and movement with purpose.'],
  ['الإعدادات', 'Camera settings', 'معدل إطارات ثابت، شاتر ≈ ضعف معدل الإطارات، وتعريض مضبوط.', 'Consistent frame rate, shutter ≈ twice the frame rate, correct exposure.'],
  ['لقطات التغطية (B-roll)', 'B-roll', 'لقطات إضافية تغطي القطع وتدّي سياق.', 'Extra shots that cover cuts and add context.']],
 [['مثلث التعريض', 'Exposure triangle', 'فتحة العدسة، الشاتر، ISO: أساس التحكم في السطوع والمظهر.', 'Aperture, shutter, ISO: the basis of brightness and look.'],
  ['عمق الميدان', 'Depth of field', 'فتحة كبيرة = خلفية مموهة وتركيز على الموضوع.', 'Wide aperture = blurred background and subject focus.']],
 [['صوت مسجّل من ميكروفون الكاميرا فقط', 'Audio from the camera mic only'], ['إضاءة مختلطة بدرجات حرارة مختلفة', 'Mixed lighting colour temperatures']]);

add('editing', ['المونتاج هو إعادة كتابة القصة: القرار الأهم فيه هو إيه اللي يتشال.', 'Editing is rewriting the story: the key decision is what to remove.'],
 [['الإيقاع والقطع', 'Rhythm & cutting', 'اقطع على الحركة أو الحدث، وغيّر طول اللقطات لإيجاد إيقاع.', 'Cut on movement or action and vary shot lengths to create rhythm.'],
  ['التنظيم', 'Organisation', 'مجلدات وتسميات وألوان للتراكات قبل ما تبدأ.', 'Folders, names and track colours before you start.'],
  ['الاستمرارية', 'Continuity', 'تطابق في الحركة والإضاءة والصوت بين اللقطات.', 'Match movement, lighting and sound across shots.'],
  ['الانتقالات', 'Transitions', 'القطع المباشر هو الأساس؛ التأثيرات بغرض فقط.', 'The straight cut is the default; use effects only with purpose.'],
  ['النسخ الاحتياطي', 'Backup', 'احفظ المشروع والنسخ دوريًا.', 'Save the project and versions regularly.']],
 [['المونتاج التتابعي والتوازي', 'Continuity vs parallel editing', 'ربط الأحداث في الزمن أو عرض خطين بالتوازي.', 'Linking events in time or running two threads in parallel.'],
  ['J-cut وL-cut', 'J-cut & L-cut', 'الصوت يسبق الصورة أو يتأخر عنها لانتقال ناعم.', 'Audio leads or trails the picture for a smooth transition.']],
 [['انتقالات استعراضية كتير', 'Too many flashy transitions'], ['لقطات طويلة بدون هدف', 'Long shots with no purpose']]);

add('sound', ['الصوت نصف الفيديو: الجمهور بيسامح الصورة أكتر من الصوت.', 'Sound is half the video: audiences forgive picture more than audio.'],
 [['وضوح الصوت', 'Voice clarity', 'تسجيل قريب من الميكروفون، وإزالة الضوضاء، وEQ بسيط.', 'Close mic recording, noise removal and gentle EQ.'],
  ['المستويات', 'Levels', 'الصوت حوالي -12 لـ -6 dB والموسيقى أقل بحيث ما تغطّيش الكلام. المعيار -14 LUFS للمنصات.', 'Voice around -12 to -6 dB and music lower so it does not cover speech. About -14 LUFS for platforms.'],
  ['الموسيقى والمؤثرات', 'Music & SFX', 'موسيقى تناسب الإحساس، مؤثرات تدعم الحركة، والالتزام بالترخيص.', 'Music that fits the mood, effects that support action and licence compliance.'],
  ['صمت مقصود', 'Intentional silence', 'السكوت لحظة بتبرز اللي بعده.', 'Silence highlights what follows.']],
 [['التقنيات الصوتية', 'Audio basics', 'الترددات، الضغط (Compression)، والـ Ducking لخفض الموسيقى تلقائيًا تحت الصوت.', 'Frequencies, compression and ducking to lower music under voice.']],
 [['موسيقى عالية تغطي الكلام', 'Loud music covering speech'], ['استخدام موسيقى بدون ترخيص', 'Using unlicensed music']]);

add('grading', ['التلوين بيحوّل لقطات متفرقة لعالم واحد وبيدّي الإحساس.', 'Grading turns scattered shots into one world and sets the mood.'],
 [['التصحيح قبل التلوين', 'Correct then grade', 'اضبط التعريض وتوازن الأبيض الأول، وبعدين اعمل اللوك الفني.', 'Set exposure and white balance first, then apply the creative look.'],
  ['الاتساق', 'Shot matching', 'خلّي ألوان اللقطات متطابقة داخل المشهد.', 'Match colours between shots within a scene.'],
  ['درجات الجلد', 'Skin tones', 'حافظ على لون جلد طبيعي حتى لو لوّنت الباقي بقوة.', 'Keep natural skin tones even when grading the rest heavily.'],
  ['استخدام LUT', 'Using LUTs', 'نقطة بداية فقط، اضبط شدتها حسب اللقطة.', 'A starting point only; adjust strength per shot.'],
  ['الأدوات', 'Scopes', 'Waveform وVectorscope بتوريك الحقيقة أكتر من العين.', 'Waveform and vectorscope show truth better than the eye.']],
 [['نظرية الألوان في السينما', 'Colour in cinema', 'الأخضر/الأزرق للبرودة والتوتر، والبرتقالي للدفء؛ التباين برتقالي/تيل شائع.', 'Cool tones for tension, warm for comfort; orange/teal contrast is common.']],
 [['تشبيع ألوان مبالغ فيه', 'Over-saturation'], ['تلوين على شاشة غير مضبوطة', 'Grading on an uncalibrated screen']]);

add('subtitles', ['الترجمة والنصوص بتفتح الفيديو لجمهور أكبر وبتحسّن المشاهدة بدون صوت.', 'Subtitles and text widen the audience and improve muted viewing.'],
 [['القراءة السهلة', 'Readability', 'سطران بحد أقصى، 35–42 حرف للسطر، وتباين واضح (ظل أو خلفية).', 'Two lines max, 35–42 characters per line, clear contrast (shadow or box).'],
  ['التوقيت', 'Timing', 'النص يظهر مع الكلام ويستمر وقت كافي للقراءة (~17 حرف/ثانية).', 'Text appears with speech and stays long enough to read (~17 chars/sec).'],
  ['المنطقة الآمنة', 'Safe area', 'بعيدًا عن واجهة المنصة وعن الحواف.', 'Away from platform UI and edges.'],
  ['الدقة اللغوية', 'Accuracy', 'راجع الإملاء والتشكيل المهم والأسماء.', 'Check spelling, key diacritics and names.']],
 [['إمكانية الوصول', 'Accessibility', 'الترجمة تخدم ضعاف السمع وتزود الفهم.', 'Captions serve deaf viewers and improve comprehension.']],
 [['نص صغير أو بلا تباين', 'Small text with no contrast'], ['تقسيم الجملة بشكل غير طبيعي', 'Breaking sentences unnaturally']]);

add('thumbnail', ['الغلاف هو إعلان الفيديو: بيتحدد من خلاله هيتفتح ولا لأ.', 'The thumbnail is the video’s ad: it decides whether it gets opened.'],
 [['نقطة تركيز واحدة', 'One focal point', 'وجه معبّر أو عنصر واحد كبير يتفهم بحجم صغير.', 'An expressive face or one big element that reads at small size.'],
  ['نص قليل', 'Minimal text', '3–4 كلمات بخط كبير وتباين عالي.', '3–4 words in big type with high contrast.'],
  ['تباين الألوان', 'Colour contrast', 'ألوان تميّزه بين مقترحات المنصة.', 'Colours that stand out among suggested videos.'],
  ['الاتساق', 'Series consistency', 'قالب موحد بيخلّي القناة معروفة.', 'A shared template makes the channel recognisable.'],
  ['الصدق', 'Honesty', 'الغلاف لازم يعبر عن المحتوى فعلًا.', 'The thumbnail must reflect the content.']],
 [['فجوة الفضول', 'Curiosity gap', 'تشويق يخلّي المشاهد عايز يعرف، بدون خداع.', 'A teaser that makes viewers want to know, without deceit.']],
 [['صورة مزدحمة بتفاصيل صغيرة', 'A busy image with small details'], ['غلاف مضلل', 'A misleading cover']]);

add('export', ['التصدير هو الخطوة اللي بتحدد الجودة النهائية على كل منصة.', 'Export decides final quality on each platform.'],
 [['إعدادات المنصة', 'Platform settings', 'H.264/MP4، نفس دقة المشروع، ومعدل بت مناسب (مثلاً 10–16 Mbps لـ 1080p).', 'H.264/MP4, the project’s resolution and a suitable bitrate (e.g. 10–16 Mbps for 1080p).'],
  ['نسب الأبعاد', 'Aspect ratios', '16:9 يوتيوب، 9:16 ريلز، 1:1 أو 4:5 للفيد.', '16:9 YouTube, 9:16 reels, 1:1 or 4:5 for the feed.'],
  ['المراجعة', 'Final check', 'شاهد النسخة المصدّرة كلها قبل الرفع.', 'Watch the exported file fully before uploading.'],
  ['الأرشفة', 'Archiving', 'احتفظ بنسخة عالية الجودة (ProRes/DNxHR) وبالمشروع.', 'Keep a high-quality master (ProRes/DNxHR) and the project.']],
 [['الضغط وفقدان الجودة', 'Compression', 'كل ضغط بيخسّر جزء؛ اضغط مرة واحدة من الماستر.', 'Each compression loses some quality; compress once from the master.']],
 [['التصدير بإعدادات افتراضية دون اختبار', 'Exporting with defaults, untested'], ['رفع ملف ضخم جدًا', 'Uploading an oversized file']]);

add('motion', ['الموشن بيدّي الحياة للتصميم: الحركة لازم تساعد الفهم مش تزيّن بس.', 'Motion brings design to life: it should aid understanding, not just decorate.'],
 [['التسارع والتباطؤ (Easing)', 'Easing', 'الحركة الطبيعية بتبدأ وتنتهي بنعومة مش بسرعة ثابتة.', 'Natural motion starts and ends smoothly, not at constant speed.'],
  ['التوقيت والمسافات', 'Timing & spacing', 'مدة الحركة تحدد وزنها وإحساسها.', 'Duration defines weight and feel.'],
  ['التدرّج والتتابع', 'Stagger & sequence', 'ظهور العناصر بالتتابع يوجّه العين.', 'Staggered entrances guide the eye.'],
  ['الاتساق', 'Consistency', 'نفس منحنيات الحركة ومدتها في كل التصميم.', 'The same curves and durations across the design.'],
  ['البساطة', 'Restraint', 'حركة قليلة ومقصودة أفضل من كتير.', 'Less, intentional motion beats a lot.']],
 [['مبادئ الأنيميشن الاثنا عشر', 'The 12 principles of animation', 'الضغط والتمدد، التوقع، المتابعة، وغيرها (ديزني).', 'Squash & stretch, anticipation, follow-through and others (Disney).']],
 [['حركة سريعة جدًا لا تُقرأ', 'Motion too fast to read'], ['تأثيرات متعددة بلا هدف', 'Many effects with no purpose']]);
})();
