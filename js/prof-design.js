/* "Academic professor" content — DESIGN steps.
   Each entry: id -> intro [ar,en], secs [[titleAr,titleEn,explainAr,explainEn]…], acad [[nameAr,nameEn,explainAr,explainEn]…], mist [[ar,en]…] */
(function(){
'use strict';
const D = (window.MSA.profData = window.MSA.profData || {});
const add = (id, intro, secs, acad, mist) => { D[id] = { intro, secs, acad, mist }; };

add('brief', ['الملخص هو «العقد» بينك وبين العميل: كل قرار تصميمي بعد كده بيتقاس عليه.', 'The brief is the “contract” between you and the client: every later design decision is measured against it.'],
 [['الهدف (Objective)', 'Objective', 'جملة واحدة تقول التصميم عايز يحقق إيه بالأرقام لو أمكن (مثلاً: 200 تسجيل في أسبوعين). من غير هدف قابل للقياس مش هتعرف التصميم نجح ولا لأ.', 'One sentence stating what the design must achieve, in numbers if possible (e.g. 200 sign-ups in two weeks). Without a measurable goal you cannot tell if the design worked.'],
  ['الجمهور المستهدف (Target audience)', 'Target audience', 'مش «الكل». حدد السن والاهتمامات والمنصة. تصميم موجّه لطالب جامعة بيختلف في اللون واللغة والإيقاع عن تصميم لمدير شركة.', 'Not “everyone”. Define age, interests and platform. A design for a student differs in colour, language and pace from one for a company director.'],
  ['الرسالة الواحدة (Single-minded proposition)', 'Single-minded proposition', 'فكرة واحدة بس لازم تتفتكر. كل ما زودت رسائل قلّ اللي بيفضل في دماغ المشاهد.', 'One idea only must be remembered. The more messages you add, the less the viewer retains.'],
  ['القيود والمخرجات', 'Constraints & deliverables', 'المقاسات، الصيغ، الميزانية، الموعد، وعدد جولات التعديل. اتفق عليهم كتابةً علشان تتجنب «توسّع النطاق» (Scope creep).', 'Sizes, formats, budget, deadline and revision rounds. Agree in writing to avoid scope creep.']],
 [['نموذج 5W1H', '5W1H framework', 'مين؟ إيه؟ فين؟ إمتى؟ ليه؟ إزاي؟ — قائمة أسئلة بتضمن إن الملخص ما فيهوش ثغرات.', 'Who? What? Where? When? Why? How? — a checklist that makes sure the brief has no gaps.'],
  ['SMART للأهداف', 'SMART goals', 'هدف محدد، قابل للقياس، قابل للتحقيق، واقعي، وله موعد.', 'Specific, Measurable, Achievable, Relevant, Time-bound.']],
 [['بدء التصميم قبل موافقة العميل على الملخص', 'Starting design before the client approves the brief'], ['ملخص فيه أهداف كتير متعارضة (بيع + وعي + شياكة…)', 'A brief with many conflicting goals (sales + awareness + prestige…)']]);

add('idea', ['الفكرة (Concept) هي الجسر بين الملخص والشكل البصري. التصميم الحلو من غير فكرة مجرد زينة.', 'The concept is the bridge between the brief and the visuals. A pretty design without a concept is only decoration.'],
 [['العصف الذهني بالكمية', 'Quantity-first brainstorming', 'اكتب 10–20 فكرة سريعة من غير حكم عليها، وبعدين اختار. أول فكرة غالبًا هي الفكرة اللي كل الناس هتفكر فيها.', 'Write 10–20 quick ideas without judging, then choose. The first idea is usually the one everyone else will have.'],
  ['الاستعارة البصرية (Visual metaphor)', 'Visual metaphor', 'تشبيه الشيء بشيء تاني يوصّل المعنى بسرعة (قفل = أمان، جناح = حرية). اختار استعارة يفهمها جمهورك.', 'Comparing one thing to another conveys meaning fast (lock = security, wing = freedom). Pick a metaphor your audience understands.'],
  ['اختبار الثواني الثلاث', 'The 3-second test', 'لو ما فهمتش الفكرة في 3 ثواني من غير شرح، يبقى محتاجة تبسيط.', 'If the idea is not understood in 3 seconds without explanation, simplify it.'],
  ['السكتشات الأولية', 'Thumbnails first', 'ارسم مصغرات بسيطة بالقلم. الورقة أسرع من البرنامج وبتخليك تجرب أكتر.', 'Draw small sketches by hand. Paper is faster than software and lets you try more.']],
 [['التفكير الإبداعي: التباعد ثم التقارب', 'Divergent then convergent thinking', 'ولّد أفكار كتير (تباعد) وبعدين صفّي وقيّم (تقارب) — ما تعملهمش مع بعض.', 'Generate many ideas (diverge) then filter and evaluate (converge) — never at the same time.'],
  ['SCAMPER', 'SCAMPER', 'استبدل، ادمج، طوّع، عدّل، استخدم لغرض تاني، احذف، اعكس — أسئلة تفتح زوايا جديدة.', 'Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse — prompts that open new angles.']],
 [['اختيار أول فكرة بدون مقارنة', 'Choosing the first idea without comparing'], ['تقليد مرجع شكلاً من غير فهم فكرته', 'Copying a reference’s look without understanding its idea']]);

add('mood', ['المود بورد بيترجم «الإحساس» لصور قبل ما تبدأ التنفيذ، فيتفق عليه الفريق والعميل.', 'The moodboard translates a “feeling” into images before production, so the team and client agree on it.'],
 [['التماسك البصري', 'Visual cohesion', 'اختار مراجع بينها خيط مشترك (لون، إضاءة، ملمس). لو كل صورة بتحكي حاجة مختلفة المود بورد مش بيقول حاجة.', 'Pick references with a common thread (colour, lighting, texture). If every image says something different the board says nothing.'],
  ['تحليل لا نسخ', 'Analyse, don’t copy', 'اكتب جنب كل مرجع إيه اللي عاجبك فيه بالظبط: اللون؟ التركيب؟ الخامة؟ ده اللي هتاخده مش الصورة كلها.', 'Note beside each reference exactly what you like: colour? composition? material? That is what you take, not the whole picture.'],
  ['حدّد 3 كلمات للستايل', 'Define 3 style words', 'مثلاً: دافئ، جريء، بسيط. الكلمات دي بتبقى فلتر لأي قرار بعد كده.', 'E.g. warm, bold, simple. These words become a filter for every later decision.'],
  ['كمية قليلة وجودة عالية', 'Few, high-quality images', '15–30 صورة كفاية. الكتير بيشتّت.', '15–30 images are enough. Too many distract.']],
 [['ربط المشاعر بالتصميم', 'Affective design', 'الناس بتحكم على التصميم عاطفيًا في ثواني قبل ما تفهمه — المود بورد بيستهدف الإحساس ده.', 'People judge a design emotionally within seconds before understanding it — the moodboard targets that feeling.'],
  ['نظرية الألوان العاطفية', 'Colour psychology (with care)', 'للألوان تأثير نفسي نسبي يختلف بالثقافة، فاعتبره توجيه مش قانون.', 'Colours have a relative psychological effect that varies by culture — treat it as guidance, not law.']],
 [['صور كتير من مصادر متضاربة', 'Many images from conflicting sources'], ['تجاهل ثقافة وذوق الجمهور المحلي', 'Ignoring the local audience’s culture and taste']]);

add('foundations', ['الأسس البصرية هي «قواعد اللعبة»: لما تتحدد، أي تصميم جديد بيطلع من نفس العيلة.', 'Visual foundations are the “rules of the game”: once set, every new design comes from the same family.'],
 [['الاتساق (Consistency)', 'Consistency', 'نفس الألوان والخطوط والمسافات في كل المخرجات بتبني تعرّف سريع على البراند.', 'Same colours, fonts and spacing across all outputs build fast brand recognition.'],
  ['التسلسل الهرمي (Hierarchy)', 'Hierarchy', 'قرر إيه الأهم، التاني، الثالث، وعبّر عنه بالحجم والوزن واللون.', 'Decide what is first, second, third in importance and express it with size, weight and colour.'],
  ['المسافات والإيقاع', 'Spacing & rhythm', 'اختار وحدة مسافة (مثلاً 8px) وكرّرها، بيدي نظام وهدوء.', 'Choose a spacing unit (e.g. 8px) and repeat it for order and calm.'],
  ['التوثيق', 'Documentation', 'اكتب القواعد في صفحة واحدة يرجع لها أي حد.', 'Write the rules on one page anyone can use.']],
 [['قانون القرب والتشابه (Gestalt)', 'Gestalt: proximity & similarity', 'العين بتجمّع العناصر القريبة أو المتشابهة كمجموعة واحدة — أساس أي نظام تصميم.', 'The eye groups near or similar elements — the basis of any design system.'],
  ['التصميم الذري', 'Atomic design', 'ابني من عناصر صغيرة (لون، خط، زر) لعناصر أكبر (كارت، صفحة).', 'Build from small elements (colour, font, button) to larger ones (card, page).']],
 [['تعدد الأساليب في مشروع واحد', 'Mixing many styles in one project'], ['قواعد كتيرة معقدة محدّش هيلتزم بيها', 'Too many complex rules nobody will follow']]);

add('colors', ['اللون أسرع وسيلة بتوصّل الإحساس. المهم مش اختيار ألوان حلوة بس، المهم إنها تشتغل مع بعض.', 'Colour is the fastest way to convey feeling. The point is not just pretty colours but colours that work together.'],
 [['تناسق الألوان (Colour harmony)', 'Colour harmony', 'يعني إن الألوان المستخدمة بتدّي إحساس مريح ومنظّم للعين بدل ما تتخانق. بيتحقق بعلاقات ثابتة على عجلة الألوان: ألوان متجاورة (Analogous)، متقابلة (Complementary)، أو ثلاثية. التناسق مش إنك تستخدم ألوان متشابهة، ده إنك تحدد علاقة واضحة بينهم.', 'Means the colours give the eye a comfortable, ordered feeling instead of clashing. It is achieved with fixed relations on the colour wheel: analogous, complementary or triadic. Harmony is not using similar colours; it is setting a clear relation between them.'],
  ['قاعدة 60-30-10', '60-30-10 rule', '60% لون أساسي (غالبًا الخلفية)، 30% لون ثانوي، 10% لون تمييز للأزرار والعناوين. بتمنع الزحمة وبتوجّه العين.', '60% dominant (usually background), 30% secondary, 10% accent for buttons and headlines. It prevents clutter and guides the eye.'],
  ['التباين (Contrast)', 'Contrast', 'الفرق بين لونين في السطوع. النص لازم يتقرا بسهولة: نسبة تباين لا تقل عن 4.5:1. التباين كمان بيحدد إيه اللي العين تشوفه الأول.', 'The difference in lightness between two colours. Text must read easily: at least 4.5:1. Contrast also decides what the eye sees first.'],
  ['درجة اللون والتشبّع والسطوع', 'Hue, saturation, value', 'كل لون له 3 أبعاد. غيّر السطوع والتشبّع بدل ما تضيف ألوان جديدة، فتحصل على نسخ متناسقة من نفس اللون.', 'Every colour has three dimensions. Vary value and saturation instead of adding new hues to get coherent variants of one colour.']],
 [['عجلة الألوان', 'The colour wheel', 'أساس نظرية الألوان: أساسية، ثانوية، وثالثية، ومنها كل العلاقات اللونية.', 'The basis of colour theory: primary, secondary, tertiary and every colour scheme derived from them.'],
  ['ألوان دافئة وباردة', 'Warm vs cool', 'الدافئ بيقرّب ويحمّس، البارد بيبعّد ويهدّي — بتستخدمهم لإعطاء عمق.', 'Warm advances and excites, cool recedes and calms — use them to create depth.'],
  ['RGB مقابل CMYK', 'RGB vs CMYK', 'الشاشة بتضيف ضوء (RGB) والطباعة بتطرح حبر (CMYK)، فاللون ممكن يتغيّر في الطباعة.', 'Screens add light (RGB), print subtracts ink (CMYK), so colours can shift in print.']],
 [['استخدام ألوان كتير مشبعة مع بعض', 'Using many saturated colours together'], ['نص رمادي فاتح على خلفية بيضاء', 'Light grey text on white'], ['تجاهل معنى اللون عند الجمهور', 'Ignoring what a colour means to the audience']]);

add('fonts', ['الخط هو صوت التصميم: نفس الكلمة بتتقال بشكل مختلف تمامًا حسب الخط.', 'Typeface is the voice of the design: the same words sound completely different in different fonts.'],
 [['الشخصية (Personality)', 'Personality', 'خط السيريف رسمي وتقليدي، السانس سيريف حديث ونظيف، الخط المزخرف بيحتاج استخدام محدود. اختار حسب نبرة البراند.', 'Serif feels formal and traditional, sans-serif modern and clean, decorative fonts need limited use. Choose by brand tone.'],
  ['التسلسل الهرمي للنص', 'Type hierarchy', 'عنوان رئيسي، فرعي، نص، تعليق: كل مستوى بحجم ووزن مختلف بوضوح. ٣ أحجام تكفي غالبًا.', 'Title, subtitle, body, caption: each level clearly differs in size and weight. Three sizes are usually enough.'],
  ['القابلية للقراءة (Legibility)', 'Legibility', 'حجم مناسب، تباعد سطور (Leading) حوالي 1.4–1.6 للنص، وطول سطر 45–75 حرف. في العربي خلّي مسافة أكبر للسطور.', 'Adequate size, line spacing about 1.4–1.6 for body, line length of 45–75 characters. Arabic needs a bit more line spacing.'],
  ['الزواج بين الخطوط', 'Font pairing', 'خط واحد للعناوين وخط للنص بتباين واضح، وفي العربي والإنجليزي اختار خطين بنفس الوزن والإحساس.', 'One headline font and one body font with clear contrast; for Arabic + Latin pick two with the same weight and feel.']],
 [['القياس الموديولاري', 'Modular scale', 'نسبة ثابتة (مثلاً 1.25) بين أحجام النص بتدّي تدرج متناغم.', 'A fixed ratio (e.g. 1.25) between text sizes gives a harmonious progression.'],
  ['الكرنينج والتراكينج', 'Kerning & tracking', 'ضبط المسافة بين الحروف مهم في العناوين الكبيرة؛ التباعد الزايد في النص الصغير يضعف القراءة.', 'Letter spacing matters in big headlines; too much spacing weakens small text.']],
 [['أكتر من خطين أو ثلاثة', 'More than two or three fonts'], ['كل الحروف كابيتال في نص طويل', 'All caps in long text'], ['مط الخط أو تشويه نسبته', 'Stretching or distorting a font']]);

add('icons', ['الأيقونات لغة اختصار: وظيفتها إنها تتفهم بسرعة مش إنها تبقى فنية.', 'Icons are a shorthand language: their job is to be understood fast, not to be artistic.'],
 [['الاتساق', 'Consistency', 'نفس سُمك الخط ونفس الزوايا ونفس الأسلوب (خطي أو ممتلئ) في المجموعة كلها.', 'Same stroke weight, corner radius and style (line or filled) across the set.'],
  ['البساطة والوضوح', 'Simplicity & clarity', 'شيل أي تفصيلة زيادة. الأيقونة لازم تتفهم بحجم 16–24px.', 'Remove any extra detail. An icon must read at 16–24px.'],
  ['الشبكة والهوامش', 'Grid & padding', 'اشتغل على شبكة ثابتة (24px) مع هامش أمان علشان الأحجام تتوازن.', 'Work on a fixed grid (24px) with safe padding so sizes balance.'],
  ['الدلالة المألوفة', 'Familiar metaphors', 'استخدم رموز الناس متعودة عليها (بيت، سلة، بحث) ما تخترعش رمز جديد لمعنى معروف.', 'Use symbols people know (home, cart, search); don’t invent a new one for a known meaning.']],
 [['الأيقونة والتعرّف', 'Recognition vs recall', 'التعرّف على رمز مألوف أسرع من تعلّم رمز جديد.', 'Recognising a familiar symbol is faster than learning a new one.'],
  ['الـ Affordance', 'Affordance', 'الشكل لازم يوحي بوظيفته (زر شكله قابل للضغط).', 'The form should suggest its function (a button looks pressable).']],
 [['خلط أيقونات من مكتبات مختلفة', 'Mixing icons from different libraries'], ['أيقونة بدون نص في وظيفة غير مألوفة', 'An icon without a label for an unfamiliar action']]);

add('imagestyle', ['أسلوب الصور بيحدد «العالم» اللي التصميم بيحصل فيه: حقيقي؟ رسم؟ ثلاثي الأبعاد؟', 'Image style defines the “world” the design lives in: photographic? illustrated? 3D?'],
 [['اختيار النوع', 'Choosing the type', 'فوتوغرافي، رسوم، أيقونات، 3D، أو مزيج. اللي يخدم الرسالة والجمهور مش اللي رايج.', 'Photo, illustration, icons, 3D or a mix. Pick what serves the message and audience, not what is trending.'],
  ['الإضاءة والمعالجة', 'Lighting & treatment', 'اتفق على اتجاه إضاءة وتدرج لوني موحد (فلتر، حبيبات) علشان الصور تبان من مصدر واحد.', 'Agree on a lighting direction and colour grade so images look like one source.'],
  ['التركيب والمساحة الفارغة', 'Composition & negative space', 'سيب مساحة للنص. صورة من غير مكان للكلام بتتعب المصمم.', 'Leave space for text. A photo with no room for copy hurts the layout.'],
  ['الأصالة والترخيص', 'Authenticity & licence', 'صور حقيقية أقوى من الستوك الباهت. وتأكد من ترخيص الاستخدام التجاري.', 'Real images beat bland stock. Check the commercial licence.']],
 [['قاعدة الأثلاث', 'Rule of thirds', 'قسّم الصورة 3×3 وحط العنصر المهم على نقط التقاطع.', 'Divide the frame 3×3 and put the key subject on the intersections.'],
  ['خطوط التوجيه', 'Leading lines', 'خطوط في الصورة بتوجّه عين المشاهد للموضوع.', 'Lines in the image that guide the viewer’s eye to the subject.']],
 [['صور مضغوطة أو منخفضة الدقة', 'Compressed or low-resolution images'], ['مزج أساليب صور متناقضة', 'Mixing clashing image styles']]);

add('logo', ['اللوجو علامة تعريف مش وصف. النجاح بيتقاس بالتميّز والاستمرارية مش بالتعقيد.', 'A logo identifies, it does not describe. Success is measured by distinctiveness and longevity, not complexity.'],
 [['البساطة (Simplicity)', 'Simplicity', 'لوجو بسيط بيتفتكر بسرعة وبيشتغل بأي حجم. جرّبه صغير جدًا وبالأبيض والأسود.', 'A simple logo is remembered fast and works at any size. Test it tiny and in black & white.'],
  ['التميّز والملاءمة', 'Distinctiveness & fit', 'لازم يختلف عن المنافسين ويناسب شخصية المجال.', 'Must differ from competitors and suit the sector’s personality.'],
  ['المرونة', 'Versatility', 'نسخ أفقي ورأسي وأيقونة مستقلة ونسخ ملونة وأحادية.', 'Horizontal, stacked, icon-only, coloured and one-colour versions.'],
  ['مساحة الأمان والحد الأدنى', 'Clear space & minimum size', 'حدد مساحة فاضية حواليه وأصغر حجم مسموح.', 'Define clear space around it and a minimum size.']],
 [['أنواع اللوجو', 'Logo types', 'Wordmark، Lettermark، Symbol، Emblem، Combination: كل نوع بيناسب حالة.', 'Wordmark, lettermark, symbol, emblem, combination: each suits a case.'],
  ['السيميائية', 'Semiotics', 'علم العلامات: الرمز بيحمل معنى مباشر وإيحائي، افهم الاتنين قبل ما تختار شكل.', 'The study of signs: a symbol carries denotation and connotation; understand both before choosing a form.'],
  ['الشكل والفراغ', 'Figure–ground', 'استخدام الفراغ السلبي بذكاء بيدّي لوجوهات لا تتنسى (مثل FedEx).', 'Clever use of negative space makes memorable logos (e.g. FedEx).']],
 [['تفاصيل دقيقة وتدرجات معقدة', 'Fine details and complex gradients'], ['اتباع موضة بتعدّي بسرعة', 'Following a fast-fading trend']]);

add('slogan', ['السلوجان جملة قصيرة بتلخّص وعد البراند وبتتكرر كتير، فكل كلمة فيها لها ثمن.', 'A slogan is a short line that sums up the brand promise and gets repeated a lot, so every word has a cost.'],
 [['الوعد', 'The promise', 'ركّز على فايدة واحدة للعميل مش وصف الشركة.', 'Focus on one customer benefit, not a description of the company.'],
  ['الإيجاز والإيقاع', 'Brevity & rhythm', '3–7 كلمات، سهلة النطق، وفيها إيقاع أو سجع بيساعد الحفظ.', '3–7 words, easy to say, with a rhythm or rhyme that helps memory.'],
  ['النبرة', 'Tone', 'اللغة تطابق شخصية البراند (رسمي، مرح، جريء) وتناسب لهجة الجمهور.', 'Language matches brand personality (formal, playful, bold) and the audience’s dialect.'],
  ['الاختبار', 'Testing', 'اقرأه بصوت عالي وجرّبه على ناس. لو احتاج شرح يبقى ضعيف.', 'Read it aloud and test it on people. If it needs explaining it is weak.']],
 [['صيغ الكتابة الإعلانية', 'Copywriting formulas', 'AIDA: انتباه، اهتمام، رغبة، فعل.', 'AIDA: Attention, Interest, Desire, Action.'],
  ['الأمر مقابل الوعد', 'Imperative vs promise', 'الأفعال الأمرية تحفّز، والوعد يبني ثقة — اختار حسب الهدف.', 'Imperatives motivate, promises build trust — choose by goal.']],
 [['كلام عام يصلح لأي شركة', 'Generic claims any company could make'], ['مبالغات مش قابلة للإثبات', 'Unprovable exaggerations']]);

add('templates', ['القوالب بتخلّي الإنتاج أسرع واللوك موحّد، بشرط إنها تسيب مرونة.', 'Templates make production faster and the look consistent, as long as they leave flexibility.'],
 [['الشبكة (Grid)', 'The grid', 'قسّم المساحة لأعمدة وهوامش ثابتة. الشبكة بتدّي ترتيب من غير ما تظهر للمشاهد.', 'Divide the space into columns and fixed margins. A grid gives order without being visible.'],
  ['التنوع داخل النظام', 'Variety within a system', '3–5 تخطيطات مختلفة (صورة، اقتباس، رقم، قائمة) تمنع الملل مع الحفاظ على الهوية.', '3–5 layouts (photo, quote, number, list) prevent boredom while keeping identity.'],
  ['العناصر الثابتة والمتغيرة', 'Fixed vs variable', 'حدد إيه ثابت (لوجو، خط، لون) وإيه بيتغير (صورة، نص).', 'Define what is fixed (logo, font, colour) and what changes (image, text).'],
  ['السهولة لمن بعدك', 'Handoff-friendly', 'سمّي الطبقات ورتبها ووثّق إزاي يتعدّل القالب.', 'Name and organise layers and document how to edit the template.']],
 [['التصميم الشبكي السويسري', 'Swiss / grid design', 'نظام الأعمدة والهرمية الواضحة أساس التصميم المعاصر.', 'Column systems and clear hierarchy underpin contemporary design.'],
  ['التكرار والتباين', 'Repetition & contrast', 'مبدأين من مبادئ التصميم: التكرار بيوحّد، والتباين بيجذب الانتباه.', 'Two design principles: repetition unifies, contrast attracts attention.']],
 [['قوالب جامدة لا تحتمل محتوى مختلف', 'Rigid templates that cannot hold different content'], ['إلغاء الهوامش لحشر محتوى أكتر', 'Removing margins to fit more content']]);

add('designMain', ['هنا بتتجمع كل الأسس في تصميم واحد. الهدف: رسالة واضحة في ثواني.', 'This is where all foundations come together in one design. The goal: a clear message in seconds.'],
 [['التسلسل الهرمي البصري', 'Visual hierarchy', 'العين بتبدأ بالأكبر والأعلى تباينًا. رتّب العناصر بحيث تقرا العنوان ثم الدليل ثم الفعل المطلوب.', 'The eye starts with the biggest and highest-contrast element. Order things so the viewer reads headline, proof, then call to action.'],
  ['توزيع العناصر (Layout)', 'Layout & composition', 'يعني ترتيب العناصر على المساحة بحيث تكون متوازنة وتقود العين. استخدم شبكة، وحاذي العناصر على خطوط مشتركة، واترك مساحات فاضية بين المجموعات. التوزيع الجيد بيخلّي المشاهد يعرف يبدأ منين وينتهي فين.', 'Means arranging elements in the space so they are balanced and lead the eye. Use a grid, align to shared lines, and leave empty space between groups. Good layout tells the viewer where to start and end.'],
  ['المساحة الفارغة (White space)', 'White space', 'مش مساحة ضايعة؛ دي اللي بتدّي التصميم تنفّس وتبرز العناصر المهمة.', 'It is not wasted; it lets the design breathe and makes key elements stand out.'],
  ['التوازن', 'Balance', 'متماثل (رسمي وثابت) أو غير متماثل (ديناميكي). المهم الإحساس بالتوازن في الوزن البصري.', 'Symmetrical (formal, stable) or asymmetrical (dynamic). What matters is balanced visual weight.'],
  ['دعوة لاتخاذ إجراء', 'Call to action', 'عنصر واضح واحد يقول للمشاهد يعمل إيه بعد كده.', 'One clear element telling the viewer what to do next.']],
 [['مبادئ الجشطالت', 'Gestalt principles', 'القرب، التشابه، الإغلاق، الاستمرارية والشكل/الأرضية: إزاي العقل بيجمّع الأشكال.', 'Proximity, similarity, closure, continuity, figure/ground: how the mind groups shapes.'],
  ['نمط F وZ', 'F and Z reading patterns', 'العين بتمسح الصفحة بنمط معروف؛ حط الأهم على مساره (وفي العربي بيتعكس الاتجاه).', 'Eyes scan in known patterns; place key items along them (mirrored for Arabic).'],
  ['قانون هيك', 'Hick’s law', 'كل ما زادت الاختيارات زاد وقت القرار — قلّل العناصر المتنافسة.', 'The more choices, the longer the decision — reduce competing elements.']],
 [['ازدحام بدون تسلسل واضح', 'Clutter with no clear hierarchy'], ['أكتر من رسالة في نفس التصميم', 'More than one message in a design'], ['نص صغير فوق صورة مزدحمة', 'Small text over a busy image']]);

add('poster', ['الإعلان/البوستر بيتشاف وهو بيعدّي: عنده ثواني قليلة يشد وينقل رسالة.', 'A poster/ad is seen in passing: it has only seconds to attract and deliver a message.'],
 [['نقطة الجذب (Focal point)', 'Focal point', 'عنصر واحد مسيطر (صورة أو عنوان) يشد العين أولًا، وباقي العناصر تدعمه.', 'One dominant element (image or headline) pulls the eye first and the rest supports it.'],
  ['تناسق الألوان', 'Colour harmony', 'ألوان قليلة بعلاقة واضحة (60-30-10) مرتبطة بهوية البراند ومنتبهة لتباين النص.', 'Few colours in a clear relation (60-30-10), tied to brand identity, with strong text contrast.'],
  ['توزيع العناصر', 'Element distribution', 'اقسم الإعلان لمناطق: عنوان، صورة، دليل، دعوة للفعل، لوجو. وزّعهم على شبكة وخلّي بينهم مسافات منتظمة.', 'Divide the ad into zones: headline, image, proof, call to action, logo. Place them on a grid with consistent gaps.'],
  ['العنوان', 'Headline', 'فايدة للعميل في أقل كلمات ممكنة، بحجم يتقرا من بعيد.', 'A customer benefit in as few words as possible, large enough to read from afar.'],
  ['الدعوة للفعل (CTA)', 'Call to action', 'فعل واضح (احجز، اطلب، سجّل) بزر أو شكل بارز وتباين عالي.', 'A clear verb (book, order, sign up) in a prominent button/shape with high contrast.']],
 [['نموذج AIDA', 'AIDA model', 'انتباه ← اهتمام ← رغبة ← فعل: هيكل الإعلان الكلاسيكي.', 'Attention → Interest → Desire → Action: the classic ad structure.'],
  ['قاعدة السبع ثواني', 'The seven-second rule', 'المشاهد بيقرر بسرعة هيكمل ولا لأ.', 'The viewer decides quickly whether to continue.'],
  ['التباين البصري', 'Visual contrast', 'بالحجم والمضمون واللون: بيحدد إيه اللي يتشاف الأول.', 'By size, content and colour: it decides what is seen first.']],
 [['صياغة نص طويل في إعلان', 'Long copy in a short-view ad'], ['لوجو ضخم يطغى على الرسالة', 'An oversized logo overpowering the message'], ['عدم وجود دعوة للفعل', 'No call to action']]);

add('social', ['السوشيال بيتشاف في تمرير سريع على موبايل. الوضوح والتميّز في الفيد أهم من التفاصيل.', 'Social is seen while scrolling fast on a phone. Clarity and standing out in the feed matter more than detail.'],
 [['الخطّاف (Hook)', 'The hook', 'أول ثانية: صورة أو جملة تخلّي الشخص يوقف التمرير.', 'The first second: an image or line that stops the scroll.'],
  ['تناسق الفيد', 'Feed consistency', 'ألوان وخطوط وقوالب متكررة بتخلّي الصفحة معروفة من أول نظرة.', 'Repeated colours, fonts and templates make the page recognisable at a glance.'],
  ['المقاسات والمناطق الآمنة', 'Sizes & safe zones', '1080×1350 للبوست و1080×1920 للستوري، وابعد النصوص عن الأطراف اللي بتتقص.', '1080×1350 for posts and 1080×1920 for stories; keep text away from cropped edges.'],
  ['القابلية للقراءة على الموبايل', 'Mobile legibility', 'نص كبير وتباين عالي وكلمات قليلة.', 'Large text, high contrast, few words.'],
  ['التنوع المخطط', 'Planned variety', 'مزيج من (تعليمي، ترويجي، قصة، تفاعلي) يمنع الملل.', 'A mix of educational, promotional, story and interactive prevents boredom.']],
 [['اقتصاد الانتباه', 'Attention economy', 'الانتباه مورد محدود، والتصميم يتنافس عليه.', 'Attention is a limited resource that design competes for.'],
  ['التعرض المتكرر', 'Mere-exposure effect', 'التكرار المتسق للهوية بيبني ألفة وثقة.', 'Consistent repetition of identity builds familiarity and trust.']],
 [['تغيير الستايل كل بوست', 'Changing style every post'], ['كتابة نصوص صغيرة جدًا', 'Tiny text'], ['تجاهل كيفية ظهور المصغّر في الشبكة', 'Ignoring how the grid thumbnail looks']]);

add('onscreen', ['التصميم على الشاشة بيجمع الثابت والمتحرك، والتناسق بينهم هو اللي بيبني الهوية.', 'On-screen design combines static and motion; consistency between them builds identity.'],
 [['توحيد اللغة البصرية', 'One visual language', 'نفس الألوان والخطوط والأيقونات في التصاميم الثابتة والمتحركة.', 'Same colours, fonts and icons in static and motion pieces.'],
  ['المناطق الآمنة', 'Safe areas', 'اترك هامش للنص بعيدًا عن حواف الشاشة وعناصر المنصة.', 'Keep text margins away from screen edges and platform UI.'],
  ['التسلسل والإيقاع', 'Sequence & rhythm', 'نظّم تتابع العناصر ليقود نظر المشاهد.', 'Order the sequence of elements to lead the viewer’s eye.']],
 [['مبادئ الأنيميشن الاثنا عشر', 'The 12 principles of animation', 'التسارع والتباطؤ، التوقع، والمتابعة: أساس حركة طبيعية.', 'Easing, anticipation and follow-through: the basis of natural motion.']],
 [['اختلاف شكل الثابت عن المتحرك', 'Static and motion looking unrelated']]);

add('printing', ['الطباعة تحويل لعالم مادي: الأخطاء هنا مكلفة ومش بتتصلّح بعد الطبع.', 'Print moves to the physical world: errors are costly and cannot be fixed after printing.'],
 [['وضع الألوان CMYK', 'CMYK colour mode', 'اشتغل CMYK من البداية. ألوان RGB الزاهية ممكن تطلع باهتة في الطباعة.', 'Work in CMYK from the start. Vivid RGB colours can print duller.'],
  ['الـ Bleed والـ Safe area', 'Bleed & safe area', '3mm زيادة خارج الحد للقص، و5mm هامش أمان للنصوص.', '3mm extra beyond the trim and a 5mm safe margin for text.'],
  ['الدقة', 'Resolution', '300dpi للصور بالحجم النهائي.', '300dpi for images at final size.'],
  ['الورق والتشطيب', 'Paper & finishing', 'نوع الورق والتغطية (مط/لامع) والتشطيبات (سبوت UV، تذهيب) بتغيّر الإحساس والتكلفة.', 'Paper type, coating (matte/gloss) and finishes (spot UV, foil) change feel and cost.'],
  ['البروفة', 'Proofing', 'اطلب بروفة قبل الطبع الكمي.', 'Ask for a proof before the full run.']],
 [['الطباعة الأربعة ألوان', 'Four-colour process', 'الألوان الكاملة من 4 أحبار؛ وPantone للألوان الخاصة الدقيقة.', 'Full colour from four inks; Pantone for exact spot colours.'],
  ['زيادة النقطة', 'Dot gain', 'الحبر بينتشر على الورق فالألوان بتغمق شوية.', 'Ink spreads on paper so colours get slightly darker.']],
 [['ملف RGB أو دقة منخفضة', 'RGB file or low resolution'], ['نص قريب جدًا من حد القص', 'Text too close to the trim']]);

add('mockups', ['الموك أب بيوريك التصميم في سياق حقيقي وبيقنع العميل. المهم إنه واقعي ومش مبالغ.', 'A mockup shows the design in a real context and convinces the client. It must be realistic, not exaggerated.'],
 [['الواقعية', 'Realism', 'إضاءة وظلال ومنظور متسقين مع البيئة.', 'Lighting, shadows and perspective consistent with the scene.'],
  ['الملاءمة', 'Relevance', 'اختار مشاهد تناسب المجال والجمهور الفعلي.', 'Pick scenes that match the sector and the real audience.'],
  ['التركيز على التصميم', 'Design focus', 'الموك أب خلفية، مش بطل المشهد.', 'The mockup is the stage, not the star.'],
  ['الجودة', 'Quality', 'دقة عالية بدون تشويه المقاس.', 'High resolution without distorting proportions.']],
 [['المنظور', 'Perspective', 'خطوط التلاشي بتدّي العمق والواقعية.', 'Vanishing lines give depth and realism.']],
 [['موك أب مبالغ فيه أو قديم', 'An over-the-top or dated mockup']]);

add('identity', ['الهوية البصرية نظام كامل مش لوجو بس. بتحدد إزاي البراند يبان ويتصرف.', 'Visual identity is a whole system, not just a logo. It defines how the brand looks and behaves.'],
 [['العناصر الأساسية', 'Core elements', 'لوجو، ألوان، خطوط، أيقونات، أسلوب صور، وأنماط.', 'Logo, colours, typography, icons, image style and patterns.'],
  ['القواعد والممنوعات', 'Rules & don’ts', 'أمثلة صح وغلط توضح الاستخدام.', 'Do and don’t examples that clarify usage.'],
  ['التطبيقات', 'Applications', 'اعرض الهوية على مطبوعات وشاشة وسوشيال ولافتات.', 'Show the identity on print, screen, social and signage.'],
  ['صوت البراند', 'Brand voice', 'نبرة الكلام جزء من الهوية.', 'Tone of voice is part of identity.']],
 [['تعريف البراند (Brand essence)', 'Brand essence', 'جوهر البراند: غرضه وقيمه وشخصيته، وده اللي الشكل بيعبّر عنه.', 'The brand’s purpose, values and personality, which the visuals express.'],
  ['الاتساق عبر نقاط الاتصال', 'Consistency across touchpoints', 'نفس التجربة في كل مكان بتبني الثقة.', 'The same experience everywhere builds trust.']],
 [['كتيب هوية معقد بدون أمثلة', 'A complex guide without examples']]);

add('packaging', ['التغليف بيبيع من على الرف: عنده ثانية يشد ويعرّف ويقنع.', 'Packaging sells from the shelf: it has a second to attract, identify and persuade.'],
 [['التسلسل البصري على العبوة', 'On-pack hierarchy', 'اسم البراند، ثم نوع المنتج، ثم الميزة، ثم التفاصيل.', 'Brand name, then product type, then benefit, then details.'],
  ['اللون والتمييز', 'Colour & differentiation', 'الألوان بتفرّق الأنواع والنكهات وبتبرز بين المنافسين.', 'Colours differentiate varieties and flavours and stand out from competitors.'],
  ['البنية والخامة', 'Structure & material', 'الشكل والملمس بيوصلوا إحساس الجودة.', 'Shape and texture convey quality.'],
  ['المتطلبات القانونية', 'Legal requirements', 'المكونات والباركود والوزن والتحذيرات حسب البلد.', 'Ingredients, barcode, weight and warnings by country.'],
  ['الـ Dieline', 'Dieline', 'اشتغل على القالب الفعلي بالطيّات والقص.', 'Work on the real template with folds and cuts.']],
 [['التصميم للرف', 'Shelf impact', 'اختبره بين منتجات منافسة بحجم صغير.', 'Test it among competitors at small size.']],
 [['نصوص قانونية صغيرة جدًا', 'Tiny legal text'], ['عدم اختبار القالب مطبوعًا', 'Not testing the dieline printed']]);

add('menu', ['المنيو أداة بيع. ترتيبه بيوجّه الاختيارات وبيأثر على المبيعات.', 'A menu is a sales tool. Its order guides choices and affects sales.'],
 [['التقسيم والتسلسل', 'Sections & order', 'قسّم لفئات واضحة، وحط الأطباق الأعلى ربحًا في مناطق الانتباه.', 'Divide into clear categories and put high-margin dishes in attention zones.'],
  ['القراءة السهلة', 'Easy reading', 'خط واضح، أسعار بسيطة، وبدون كثرة خطوط.', 'Clear font, simple prices, not many fonts.'],
  ['الصور', 'Photography', 'صور حقيقية لأطباق مختارة، مش كل الأطباق.', 'Real photos for selected dishes, not all.'],
  ['الهوية والأجواء', 'Identity & mood', 'ألوان وخامات المنيو لازم تعكس جو المكان.', 'Menu colours and materials should reflect the venue’s mood.']],
 [['هندسة المنيو', 'Menu engineering', 'تحليل الأطباق حسب الربح والشعبية وترتيبها بناءً عليه.', 'Analysing dishes by profit and popularity and arranging accordingly.']],
 [['أسعار مرتّبة بعمود يشجع المقارنة بالسعر', 'A price column that encourages price comparison']]);

add('presentation', ['العرض التقديمي بيدعم كلامك، مش بيحلّ محلّه.', 'A presentation supports your talk; it does not replace it.'],
 [['فكرة واحدة لكل شريحة', 'One idea per slide', 'شريحة واحدة = رسالة واحدة. العنوان هو الرسالة.', 'One slide = one message. The title is the message.'],
  ['القصة', 'Storytelling', 'ابدأ بالمشكلة، ثم الحل، ثم الدليل، ثم الدعوة للفعل.', 'Start with the problem, then solution, proof, then call to action.'],
  ['التصميم البسيط', 'Simple design', 'نص قليل، صور قوية، خط كبير، وتباين عالي.', 'Little text, strong visuals, big type, high contrast.'],
  ['البيانات', 'Data', 'رسم بياني واحد واضح بدل جدول مزدحم.', 'One clear chart instead of a crowded table.']],
 [['نظرية الحمل المعرفي', 'Cognitive load theory', 'العقل مش بيستوعب نص وصوت بنفس الوقت لو زودت الحمل.', 'The mind cannot absorb dense text and speech at once if the load is too high.'],
  ['قاعدة 10-20-30', '10-20-30 rule', '10 شرائح، 20 دقيقة، خط 30.', '10 slides, 20 minutes, 30pt font.']],
 [['قراءة الشريحة بصوت عالي حرفيًا', 'Reading the slide aloud verbatim'], ['حشو نصوص طويلة', 'Walls of text']]);

add('web', ['الموقع/التطبيق بيتحكم فيه المستخدم، فالتصميم الجيد هو اللي مش بيحتاج شرح.', 'In a site/app the user is in control, so good design is the one that needs no explanation.'],
 [['تدفق المستخدم', 'User flow', 'اعمل الطريق للهدف قصير وواضح (أقل نقرات).', 'Make the path to the goal short and clear (fewest clicks).'],
  ['التسلسل والتخطيط', 'Hierarchy & layout', 'الأهم أعلى الصفحة، وعناصر مجمّعة بالقرب والمسافات.', 'Most important content up top, grouped by proximity and spacing.'],
  ['الاستجابة', 'Responsive design', 'صمم الموبايل أولاً وبعدين الأكبر.', 'Design mobile first, then larger screens.'],
  ['إمكانية الوصول', 'Accessibility', 'تباين، أحجام لمس 44px، ونص بديل للصور.', 'Contrast, 44px touch targets and alt text for images.'],
  ['السرعة', 'Performance', 'صور مضغوطة وخطوط قليلة.', 'Compressed images and few fonts.']],
 [['قوانين نيلسن العشر', 'Nielsen’s 10 heuristics', 'قواعد عامة لتقييم سهولة الاستخدام.', 'General rules for evaluating usability.'],
  ['قانون فيتس', 'Fitts’s law', 'الأزرار الأكبر والأقرب أسهل للوصول.', 'Larger, closer buttons are easier to hit.']],
 [['أزرار صغيرة أو غير واضحة', 'Small or unclear buttons'], ['نسيان الحالات: فراغ، خطأ، تحميل', 'Forgetting empty, error and loading states']]);

add('infographic', ['الإنفوجراف يحوّل معلومات معقدة لقصة مرئية سهلة.', 'An infographic turns complex information into an easy visual story.'],
 [['قصة واحدة', 'One story', 'اختار رسالة رئيسية وكل شيء يدعمها.', 'Choose a main message and make everything support it.'],
  ['اختيار نوع الرسم', 'Choosing the chart', 'مقارنة = أعمدة، تطور زمني = خط، نسبة = دائرة (لحد 5 أجزاء).', 'Comparison = bars, trend = line, share = pie (up to 5 slices).'],
  ['التدفق', 'Flow', 'اتجاه واضح من أعلى لأسفل أو يمين لشمال بحسب اللغة.', 'A clear direction, top-down or right-to-left by language.'],
  ['الدقة', 'Accuracy', 'مصدر الأرقام ومقاييس صحيحة بدون تضليل.', 'Source the numbers and use honest scales.']],
 [['نسبة الحبر للبيانات', 'Data-ink ratio', 'شيل أي زخرفة ما بتنقلش معلومة (إدوارد تافتي).', 'Remove any decoration that carries no information (Edward Tufte).']],
 [['رسم ثلاثي الأبعاد يشوّه الأرقام', '3D charts that distort numbers'], ['ألوان كتير بدون معنى', 'Many colours with no meaning']]);

add('retouch', ['المعالجة بتحسّن الصورة من غير ما تفقدها واقعيتها.', 'Retouching improves a photo without losing its realism.'],
 [['العمل غير المدمّر', 'Non-destructive workflow', 'طبقات وأقنعة وSmart Objects علشان تقدر تتراجع.', 'Layers, masks and smart objects so you can go back.'],
  ['الترتيب', 'Order of work', 'تصحيح التعريض واللون، ثم التنظيف، ثم التفاصيل، ثم اللمسات النهائية.', 'Exposure and colour correction, then cleanup, details, finishing.'],
  ['الحفاظ على الطبيعية', 'Keeping it natural', 'اترك الملمس الطبيعي للبشرة، ما تبالغش في التنعيم.', 'Keep natural skin texture; don’t over-smooth.'],
  ['اتساق الدفعة', 'Batch consistency', 'ضبط واحد للصور المتشابهة.', 'One set of adjustments for similar photos.']],
 [['فصل التردد', 'Frequency separation', 'فصل الملمس عن اللون لتعديل دقيق.', 'Separating texture from colour for fine edits.']],
 [['تنعيم زائد يبان بلاستيك', 'Over-smoothing that looks plastic']]);

add('review', ['المراجعة جزء من التصميم: هدفها تحسين الشغل مش الدفاع عنه.', 'Review is part of design: its aim is to improve the work, not defend it.'],
 [['جمع الملاحظات', 'Collecting feedback', 'جمّع الملاحظات في مكان واحد ورتبها بالأولوية.', 'Gather feedback in one place and prioritise it.'],
  ['فهم السبب', 'Understanding the why', 'اسأل «ليه؟» علشان تفهم المشكلة الحقيقية ورا الحل المقترح.', 'Ask “why?” to find the real problem behind the proposed fix.'],
  ['جولات محددة', 'Defined rounds', 'اتفق على عدد الجولات من البداية.', 'Agree on the number of rounds up front.'],
  ['الاحتفاظ بالنسخ', 'Versioning', 'احفظ كل نسخة باسم وتاريخ.', 'Save each version with name and date.']],
 [['النقد البنّاء', 'Constructive critique', 'اربط الملاحظة بالهدف مش بالذوق الشخصي.', 'Tie feedback to the goal, not personal taste.']],
 [['تعديلات متناقضة من عدة أشخاص بدون قرار واحد', 'Conflicting edits from many people with no single decision-maker']]);

add('delivery', ['التسليم هو آخر انطباع: ملفات منظمة وواضحة بتبني الثقة.', 'Delivery is the last impression: organised, clear files build trust.'],
 [['الصيغ الصحيحة', 'Right formats', 'مصادر (AI/PSD/Figma) + نسخ جاهزة (PNG/PDF/SVG) حسب الاستخدام.', 'Sources (AI/PSD/Figma) + ready copies (PNG/PDF/SVG) by use.'],
  ['التسمية والتنظيم', 'Naming & folders', 'تسمية موحدة ومجلدات واضحة.', 'Consistent names and clear folders.'],
  ['الخطوط والروابط', 'Fonts & links', 'ضمّن الخطوط أو أرفقها مع الصور المرتبطة.', 'Include fonts and linked images.'],
  ['دليل الاستخدام', 'Usage notes', 'ملف مختصر يشرح الألوان والخطوط.', 'A short file explaining colours and fonts.']],
 [['إدارة الأصول الرقمية', 'Digital asset management', 'تنظيم الملفات يوفر وقت الفريق مستقبلًا.', 'Organising files saves the team’s future time.']],
 [['إرسال ملفات بدون خطوط أو روابط', 'Sending files without fonts or links']]);

add('generic', ['مبادئ عامة تنفع في أي خطوة من خطوات المشروع.', 'General principles that apply to any step of the project.'],
 [['وضوح الهدف', 'Clear purpose', 'اسأل: الخطوة دي بتخدم هدف المشروع إزاي؟', 'Ask: how does this step serve the project goal?'],
  ['التبسيط', 'Simplify', 'شيل أي عنصر ما بيخدمش الرسالة.', 'Remove any element that does not serve the message.'],
  ['التجربة والتحقق', 'Test & verify', 'اعرض شغلك على حد من الجمهور قبل التسليم.', 'Show your work to someone from the audience before delivery.'],
  ['التوثيق', 'Document', 'اكتب القرارات والأسباب لتسهيل المراجعة.', 'Write decisions and reasons to ease review.']],
 [['التفكير التصميمي', 'Design thinking', 'تعاطف، تحديد، فكرة، نموذج، اختبار.', 'Empathise, define, ideate, prototype, test.']],
 [['القفز للتنفيذ بدون فهم المشكلة', 'Jumping to execution without understanding the problem']]);
})();
