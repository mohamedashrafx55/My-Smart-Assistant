/* Success factors per step, in priority order. Item: [titleAr, titleEn, explainAr, explainEn]. Overrides the shorter lists from prof-design.js / prof-video.js. */
(function(){
'use strict';
const D = (window.MSA.profData = window.MSA.profData || {});
const set = (id, items) => { D[id] = Object.assign(D[id] || { intro: ['', ''], acad: [], mist: [] }, { secs: items }); };

set('social', [
 ['الألوان المتناسقة', 'Color Palette', 'اختيار ألوان تتماشى مع الهوية البصرية للعلامة التجارية وتثير المشاعر المطلوبة.', 'Pick colours that match the brand identity and evoke the intended feeling.'],
 ['التباين', 'Contrast', 'استخدام تباين قوي بين ألوان الخلفية والنصوص أو العناصر الأساسية لضمان سهولة القراءة وجذب العين.', 'Strong contrast between background and text or key elements keeps it readable and eye-catching.'],
 ['التسلسل الهرمي البصري', 'Visual Hierarchy', 'ترتيب العناصر حسب الأهمية (العنوان الرئيسي أولاً، ثم التفاصيل، ثم زر اتخاذ الإجراء) ليوجه نظر المشاهد بشكل طبيعي.', 'Order elements by importance (headline, then details, then the call to action) so the eye is guided naturally.'],
 ['الخطوط الواضحة', 'Typography', 'استخدام خطوط مقروءة وبسيطة تتناسب مع نوع المحتوى والابتعاد عن الخطوط المزعجة أو المعقدة.', 'Use readable, simple fonts that suit the content; avoid noisy or complex ones.'],
 ['البساطة وعدم الازدحام', 'Simplicity', 'التركيز على فكرة ورسالة واحدة في التصميم، وتجنب الحشو أو وضع عناصر كثيرة تشتت انتباه المستخدم.', 'Focus on one idea and one message; avoid filler and too many elements that scatter attention.'],
 ['المساحات الفارغة', 'Breathing Space', 'ترك هوامش ومساحات خالية حول العناصر لتوفير راحة بصرية وتوضيح كل جزء في التصميم.', 'Leave margins and empty space around elements for visual rest and clarity.'],
 ['الصور والرسومات عالية الجودة', 'High-quality visuals', 'استخدام صور أو رسوم أصلية وعالية الدقة تعكس احترافية العلامة التجارية.', 'Use original, high-resolution photos or illustrations that reflect brand professionalism.'],
 ['مراعاة مقاسات المنصات', 'Platform sizes', 'ضبط الأبعاد وفق المنصة (مثل 1080×1350 للمنشور العمودي أو 1080×1920 للقصص) حتى لا تظهر الصورة مقصوصة أو ضبابية.', 'Match each platform’s size (e.g. 1080×1350 for vertical posts, 1080×1920 for stories) so nothing is cropped or blurry.'],
 ['التوازن البصري', 'Visual Balance', 'توزيع العناصر يمينًا ويسارًا أو بشكل مركزي بطريقة متناسقة تمنح التصميم استقرارًا وجاذبية.', 'Distribute elements left/right or centrally in a coordinated way for stability and appeal.']
]);

set('poster', [
 ['فكرة واحدة واضحة', 'One clear message', 'الإعلان بيتشاف في ثواني، فلازم رسالة واحدة تتفهم من أول نظرة من غير شرح.', 'An ad is seen in seconds, so one message must be understood at first glance without explanation.'],
 ['نقطة الجذب', 'Focal Point', 'عنصر واحد مسيطر (صورة أو عنوان) يشد العين أولًا، وباقي العناصر تدعمه ولا تنافسه.', 'One dominant element (image or headline) pulls the eye first; the rest supports it, not competes.'],
 ['العنوان القوي', 'Strong Headline', 'يقول فايدة للعميل بأقل كلمات ممكنة وبحجم يتقرا من بعيد.', 'States the customer benefit in as few words as possible, large enough to read from afar.'],
 ['تناسق الألوان', 'Color Harmony', 'ألوان قليلة بينها علاقة واضحة ومرتبطة بهوية البراند، مع تباين عالي للنص.', 'Few colours with a clear relation, tied to the brand, with high text contrast.'],
 ['توزيع العناصر', 'Layout', 'تقسيم الإعلان لمناطق (عنوان، صورة، دليل، دعوة للفعل، لوجو) على شبكة بمسافات منتظمة.', 'Divide the ad into zones (headline, image, proof, call to action, logo) on a grid with even spacing.'],
 ['الدعوة لاتخاذ إجراء', 'Call to Action', 'فعل واضح (احجز، اطلب، سجّل) في زر أو شكل بارز يعرّف المشاهد يعمل إيه بعد كده.', 'A clear verb (book, order, sign up) in a prominent button that tells the viewer what to do next.'],
 ['المساحات الفارغة', 'Breathing Space', 'مساحة فاضية حوالين العناصر بتخلّي الإعلان مريح وتبرز المهم.', 'Empty space around elements makes the ad comfortable and highlights what matters.'],
 ['جودة الصورة والمقاس', 'Image quality & size', 'صورة عالية الدقة وبمقاس الوسيلة (طباعة أو شاشة) من غير تشويه.', 'A high-resolution image at the medium’s size (print or screen), undistorted.']
]);

set('designMain', [
 ['وضوح الرسالة', 'Clear Message', 'التصميم لازم يجاوب على سؤال واحد: عايز المشاهد يفهم أو يعمل إيه؟ وكل عنصر يخدم الإجابة دي.', 'The design must answer one question: what should the viewer understand or do? Every element serves that answer.'],
 ['التسلسل الهرمي البصري', 'Visual Hierarchy', 'العين تبدأ بالأكبر والأعلى تباينًا، فرتّب العناصر: العنوان ثم الدليل ثم الفعل المطلوب.', 'The eye starts with the biggest, highest-contrast element, so order: headline, proof, then action.'],
 ['توزيع العناصر', 'Layout', 'ترتيب العناصر على شبكة وحاذيها على خطوط مشتركة مع مسافات واضحة بين المجموعات، فيعرف المشاهد يبدأ منين وينتهي فين.', 'Arrange elements on a grid, align them to shared lines with clear gaps between groups, so the viewer knows where to start and end.'],
 ['تناسق الألوان', 'Color Harmony', 'يعني ألوان بينها علاقة واضحة (متجاورة أو متقابلة على عجلة الألوان) فتريح العين بدل ما تتخانق.', 'Colours with a clear relation (analogous or complementary on the colour wheel) that rest the eye instead of clashing.'],
 ['التباين', 'Contrast', 'فرق واضح بين النص والخلفية وبين المهم وغير المهم علشان يتقرا بسهولة.', 'A clear difference between text and background, and between important and secondary, for easy reading.'],
 ['الخطوط', 'Typography', 'خطان بحد أقصى بمستويات واضحة (عنوان، نص، تفاصيل) وحجم مقروء.', 'Two fonts at most with clear levels (title, body, details) at a readable size.'],
 ['المساحات الفارغة والتوازن', 'White Space & Balance', 'مساحة تنفّس وتوزيع متوازن للوزن البصري، فيبدو التصميم مرتبًا ومستقرًا.', 'Breathing space and balanced visual weight make the design look tidy and stable.'],
 ['الاتساق مع الهوية', 'Brand Consistency', 'نفس الألوان والخطوط وأسلوب الصور بتاع البراند علشان يتعرف عليه الناس فورًا.', 'The brand’s colours, fonts and image style so people recognise it instantly.']
]);

set('colors', [
 ['ارتباطها بالهوية والمجال', 'Brand Fit', 'اللون لازم يعبّر عن شخصية البراند وجمهوره (هادئ، جريء، فاخر…) قبل ما يكون «حلو».', 'Colour must express the brand and audience (calm, bold, luxurious…) before being merely “nice”.'],
 ['تناسق الألوان', 'Color Harmony', 'يعني إن الألوان بينها علاقة ثابتة على عجلة الألوان (متجاورة، متقابلة، ثلاثية) فتبان مريحة ومنظمة للعين.', 'A fixed relation between colours on the wheel (analogous, complementary, triadic) so they look comfortable and ordered.'],
 ['قاعدة 60-30-10', '60-30-10 Rule', '60% لون أساسي (الخلفية غالبًا)، 30% ثانوي، 10% لون تمييز للأزرار والعناوين.', '60% dominant (usually background), 30% secondary, 10% accent for buttons and headlines.'],
 ['التباين وسهولة القراءة', 'Contrast', 'النص على الخلفية لازم يحقق نسبة تباين 4.5:1 على الأقل علشان يتقرا بسهولة.', 'Text on its background should reach at least 4.5:1 contrast to read easily.'],
 ['الاتساق بين الوسائط', 'Cross-media Consistency', 'سجّل أكواد الألوان (HEX للشاشة وCMYK للطباعة) علشان اللون يطلع نفسه في كل مكان.', 'Record codes (HEX for screens, CMYK for print) so the colour stays the same everywhere.'],
 ['اختبارها فعليًا', 'Real Testing', 'جرّب الألوان بالأبيض والأسود وعلى الموبايل وفي الوضع الداكن قبل الاعتماد.', 'Test the palette in greyscale, on a phone and in dark mode before approving it.']
]);

set('fonts', [
 ['القابلية للقراءة', 'Legibility', 'خط واضح وحجم مناسب (14px على الأقل للشاشة) وتباعد سطور مريح، خصوصًا في العربي.', 'A clear font at a suitable size (at least 14px on screen) with comfortable line spacing, especially in Arabic.'],
 ['شخصية الخط', 'Personality', 'السيريف رسمي وتقليدي، والسانس سيريف حديث ونظيف، فاختار حسب نبرة البراند.', 'Serif feels formal and traditional, sans-serif modern and clean; choose by brand tone.'],
 ['التسلسل الهرمي للنص', 'Type Hierarchy', 'عنوان رئيسي، فرعي، نص، تعليق، وكل مستوى بحجم ووزن مختلف بوضوح.', 'Title, subtitle, body, caption, each clearly different in size and weight.'],
 ['اقتران الخطوط', 'Font Pairing', 'خطان بحد أقصى (للعناوين وللنص) بتباين واضح، وفي العربي والإنجليزي اختار خطين بنفس الإحساس.', 'Two fonts at most (headlines and body) with clear contrast; for Arabic + Latin pick two with the same feel.'],
 ['الاتساق', 'Consistency', 'نفس الخطوط والأحجام في كل المخرجات علشان الهوية تتثبت.', 'The same fonts and sizes across all outputs to anchor the identity.'],
 ['الترخيص والدعم', 'Licence & support', 'تأكد من الترخيص التجاري ومن دعم التشكيل والأرقام والرموز.', 'Check the commercial licence and support for diacritics, numerals and symbols.']
]);

set('logo', [
 ['البساطة', 'Simplicity', 'لوجو بسيط بيتفتكر بسرعة ويتفهم بأي حجم.', 'A simple logo is remembered fast and understood at any size.'],
 ['التميّز', 'Distinctiveness', 'لازم يختلف عن المنافسين وما يشبهش لوجو تاني.', 'It must differ from competitors and not resemble another logo.'],
 ['الملاءمة', 'Relevance', 'الشكل والألوان يعبّروا عن شخصية المجال والبراند.', 'Shape and colour express the sector and brand personality.'],
 ['المرونة', 'Versatility', 'يشتغل بنسخ أفقي ورأسي وأيقونة لوحدها، وبالألوان وبلون واحد.', 'Works as horizontal, stacked and icon-only versions, in colour and one colour.'],
 ['القابلية للتذكّر', 'Memorability', 'فكرة أو شكل واحد مميز بيثبت في الذاكرة.', 'One distinctive idea or shape that sticks in memory.'],
 ['مساحة الأمان والحد الأدنى', 'Clear space & min size', 'حدد مساحة فاضية حوله وأصغر حجم مسموح.', 'Define clear space around it and a minimum size.']
]);

set('brief', [
 ['الهدف المحدد', 'Clear Objective', 'جملة واحدة تقول التصميم عايز يحقق إيه، وبالأرقام لو أمكن (مثلًا 200 تسجيل).', 'One sentence on what the design must achieve, in numbers if possible (e.g. 200 sign-ups).'],
 ['الجمهور المستهدف', 'Target Audience', 'حدد السن والاهتمامات والمنصة، لأن التصميم لازم يتكلم بلغة الجمهور ده.', 'Define age, interests and platform, because the design must speak that audience’s language.'],
 ['الرسالة الواحدة', 'Key Message', 'فكرة واحدة بس لازم تتفتكر، وكل ما زودت رسائل قلّ اللي بيفضل.', 'Only one idea must be remembered; the more messages, the less sticks.'],
 ['المخرجات والمقاسات', 'Deliverables & sizes', 'اتفق على النوع والعدد والمقاسات والمنصات من أول يوم.', 'Agree on type, count, sizes and platforms from day one.'],
 ['الميزانية والموعد والتعديلات', 'Budget, deadline, revisions', 'اتفق كتابةً على التكلفة والموعد وعدد جولات التعديل لتجنب توسّع النطاق.', 'Agree in writing on cost, deadline and revision rounds to avoid scope creep.'],
 ['موافقة العميل', 'Client Approval', 'اكتب الملخص وخلّي العميل يوافق عليه قبل ما تبدأ.', 'Write the brief and get the client to approve it before starting.']
]);

set('idea', [
 ['أصالة الفكرة', 'Originality', 'فكرة تميّزك عن المنافسين، مش أول فكرة تيجي في بال أي حد.', 'An idea that sets you apart from competitors, not the first one anyone would think of.'],
 ['ارتباطها بالرسالة', 'Message Fit', 'الفكرة لازم تخدم هدف الملخص مش بس تبقى جميلة.', 'The idea must serve the brief’s goal, not just look nice.'],
 ['البساطة', 'Simplicity', 'تتفهم في 3 ثواني من غير شرح.', 'Understood in 3 seconds without explanation.'],
 ['الاستعارة البصرية', 'Visual Metaphor', 'تشبيه بصري يوصّل المعنى بسرعة ويفهمه جمهورك.', 'A visual metaphor that conveys meaning quickly and that your audience understands.'],
 ['صلاحيتها للمنصات', 'Cross-platform', 'الفكرة تشتغل على كل الوسائط مش وسيلة واحدة.', 'The idea works across media, not just one.']
]);

set('reel', [
 ['الخطّاف', 'The Hook', 'أول ثانيتين: لقطة أو جملة تشد المشاهد وتوقفه عن التمرير.', 'The first two seconds: a shot or line that grabs the viewer and stops the scroll.'],
 ['القصة والهيكل', 'Structure', 'خطاف ← محتوى ← ذروة ← دعوة للفعل أو لوب، في 15–30 ثانية.', 'Hook → content → climax → call to action or loop, in 15–30 seconds.'],
 ['الإيقاع السريع', 'Fast Pacing', 'قطع متتابع وكل لقطة تدفع الفكرة قدام بدون حشو.', 'Quick cuts, each shot moving the idea forward with no filler.'],
 ['النص على الشاشة', 'On-screen Text', 'جمل قصيرة ومقروءة بتباين عالي لأن ناس كتير بتشاهد بدون صوت.', 'Short, high-contrast lines since many watch muted.'],
 ['جودة الصوت', 'Audio Quality', 'صوت نظيف وموسيقى مناسبة ومستوى متوازن.', 'Clean audio, fitting music and balanced levels.'],
 ['الإطار العمودي', 'Vertical Framing', 'تكوين 9:16 وابعد النصوص عن مناطق واجهة المنصة.', 'Compose for 9:16 and keep text clear of platform UI.'],
 ['اتساق الهوية', 'Brand Consistency', 'نفس الألوان والخطوط والتلوين في كل الريلز.', 'The same colours, fonts and grade across all reels.']
]);

set('editing', [
 ['الإيقاع والقطع', 'Pacing & Cuts', 'اقطع على الحركة أو الحدث وغيّر طول اللقطات علشان يتكوّن إيقاع يمسك المشاهد.', 'Cut on movement or action and vary shot length to build a rhythm that holds the viewer.'],
 ['خدمة القصة', 'Story First', 'احذف أي لقطة ما بتدفعش القصة، فالمونتاج قرار الحذف أكتر من الإضافة.', 'Remove any shot that does not move the story; editing is more about removing than adding.'],
 ['وضوح الصوت', 'Clear Audio', 'صوت نظيف ومستويات متوازنة، لأن الصوت السيئ يطفّش المشاهد قبل الصورة.', 'Clean sound and balanced levels, because bad audio drives viewers away before bad picture.'],
 ['الاستمرارية', 'Continuity', 'تطابق الحركة والإضاءة والصوت بين اللقطات.', 'Match movement, lighting and sound between shots.'],
 ['انتقالات بسيطة', 'Simple Transitions', 'القطع المباشر هو الأساس، والتأثيرات لغرض فقط.', 'The straight cut is the default; effects only with purpose.'],
 ['التنظيم والنسخ الاحتياطي', 'Organisation & Backup', 'ملفات مسمّاة ومرتبة ونسخ احتياطية دورية للمشروع.', 'Named, organised files and regular project backups.']
]);

set('shooting', [
 ['الإضاءة', 'Lighting', 'ضوء رئيسي ناعم يجمّل الموضوع، وتجنّب الإضاءة المختلطة بدرجات حرارة مختلفة.', 'A soft key light that flatters the subject; avoid mixed lighting of different colour temperatures.'],
 ['ثبات الكاميرا', 'Stability', 'تريبود أو جيمبل، وحركة لها غرض بدل الاهتزاز.', 'Tripod or gimbal, and purposeful movement instead of shake.'],
 ['التكوين', 'Composition', 'قاعدة الأثلاث ومساحة فوق الرأس وخلفية نظيفة.', 'Rule of thirds, headroom and a clean background.'],
 ['جودة الصوت', 'Sound', 'ميكروفون قريب من المصدر، فالصوت أصعب في الإصلاح من الصورة.', 'A mic close to the source; audio is harder to fix than picture.'],
 ['الإعدادات الصحيحة', 'Camera Settings', 'معدل إطارات ثابت، وشاتر ≈ ضعفه، وتعريض مضبوط.', 'A fixed frame rate, shutter ≈ double it and correct exposure.'],
 ['لقطات التغطية', 'B-roll', 'لقطات إضافية تغطي القطع وتدّي سياق.', 'Extra shots that cover cuts and add context.']
]);

set('presentation', [
 ['فكرة واحدة لكل شريحة', 'One Idea per Slide', 'شريحة واحدة = رسالة واحدة، والعنوان هو الرسالة.', 'One slide = one message; the title is the message.'],
 ['قصة واضحة', 'Clear Story', 'مشكلة ← حل ← دليل ← دعوة للفعل.', 'Problem → solution → proof → call to action.'],
 ['نص قليل', 'Minimal Text', 'كلمات قليلة بخط كبير، والتفاصيل تتقال شفهيًا.', 'Few words in large type; details are spoken.'],
 ['صور وبيانات واضحة', 'Clear Visuals & Data', 'صورة قوية أو رسم بياني واحد مفهوم بدل جدول مزدحم.', 'One strong image or clear chart instead of a crowded table.'],
 ['اتساق التصميم', 'Consistent Design', 'نفس الخلفية والخطوط والألوان في كل الشرائح.', 'The same background, fonts and colours on every slide.'],
 ['التباين وسهولة القراءة', 'Contrast', 'نص يتقرا من آخر القاعة بتباين عالي.', 'Text readable from the back of the room with high contrast.']
]);

set('web', [
 ['سهولة الاستخدام', 'Usability', 'المستخدم يوصل لهدفه في أقل نقرات وبدون شرح.', 'Users reach their goal in the fewest clicks without instructions.'],
 ['التسلسل الهرمي', 'Visual Hierarchy', 'الأهم أعلى الصفحة، وعناصر مجمّعة بالقرب والمسافات.', 'The most important at the top, grouped by proximity and spacing.'],
 ['التجاوب مع الشاشات', 'Responsive', 'صمّم الموبايل أولًا، ثم الأكبر.', 'Design mobile first, then larger screens.'],
 ['سهولة القراءة والتباين', 'Readability', 'نصوص واضحة وتباين كافٍ وأحجام لمس لا تقل عن 44px.', 'Clear text, enough contrast and touch targets of at least 44px.'],
 ['الاتساق', 'Consistency', 'نفس الأزرار والألوان والمسافات في كل الصفحات.', 'The same buttons, colours and spacing on every page.'],
 ['السرعة', 'Performance', 'صور مضغوطة وخطوط قليلة علشان الصفحة تفتح بسرعة.', 'Compressed images and few fonts so pages load fast.'],
 ['كل الحالات', 'All States', 'صمّم حالات الفراغ والخطأ والتحميل مش الحالة المثالية بس.', 'Design empty, error and loading states, not just the ideal one.']
]);

set('packaging', [
 ['التأثير على الرف', 'Shelf Impact', 'التصميم يشد العين بين المنتجات المنافسة في ثانية.', 'The design catches the eye among competing products in a second.'],
 ['وضوح البراند والمنتج', 'Brand & Product Clarity', 'اسم البراند ونوع المنتج يتقروا فورًا.', 'The brand name and product type read instantly.'],
 ['التسلسل البصري', 'Hierarchy', 'البراند، ثم نوع المنتج، ثم الميزة، ثم التفاصيل.', 'Brand, product type, benefit, then details.'],
 ['اللون والتمييز', 'Colour Coding', 'ألوان تفرّق بين الأنواع والنكهات وتتميّز عن المنافسين.', 'Colours that separate varieties and stand out from competitors.'],
 ['البنية والخامة', 'Structure & Material', 'الشكل والملمس بيوصّلوا إحساس الجودة.', 'Shape and texture communicate quality.'],
 ['المتطلبات القانونية', 'Legal Info', 'المكونات والباركود والوزن والتحذيرات بحجم مقروء.', 'Ingredients, barcode, weight and warnings at a readable size.']
]);

set('thumbnail', [
 ['نقطة تركيز واحدة', 'Single Focal Point', 'وجه معبّر أو عنصر كبير يتفهم بحجم صغير.', 'An expressive face or big element that reads at small size.'],
 ['التباين والألوان', 'Contrast & Colour', 'ألوان تميّزه بين مقترحات المنصة.', 'Colours that stand out among suggested videos.'],
 ['نص قصير', 'Short Text', '3–4 كلمات بخط كبير وتباين عالي.', '3–4 words in large, high-contrast type.'],
 ['الفضول', 'Curiosity', 'تشويق يخلّي المشاهد عايز يعرف، بدون خداع.', 'A teaser that makes viewers want to know, without deceit.'],
 ['الاتساق', 'Consistency', 'قالب موحد يخلّي القناة معروفة.', 'A shared template that makes the channel recognisable.'],
 ['الصدق', 'Honesty', 'الغلاف يعبّر عن المحتوى فعلًا.', 'The thumbnail truly reflects the content.']
]);

set('sound', [
 ['وضوح الصوت', 'Voice Clarity', 'تسجيل قريب من الميكروفون، وإزالة الضوضاء، وEQ بسيط.', 'Close-mic recording, noise removal and gentle EQ.'],
 ['توازن المستويات', 'Balanced Levels', 'الصوت أعلى من الموسيقى بحيث ما تغطّيش الكلام، والمعيار حوالي -14 LUFS.', 'Voice above music so it never covers speech; about -14 LUFS as the target.'],
 ['موسيقى مناسبة', 'Fitting Music', 'موسيقى تناسب الإحساس وبترخيص صحيح.', 'Music that fits the mood and is properly licensed.'],
 ['المؤثرات', 'Sound Effects', 'مؤثرات تدعم الحركة بدون مبالغة.', 'Effects that support the action without overdoing it.'],
 ['الصمت المقصود', 'Intentional Silence', 'لحظة سكوت تبرز اللي بعدها.', 'A moment of silence that highlights what follows.']
]);

set('onscreen', [
 ['وضوح الرسالة', 'Clear Message', 'رسالة واحدة بتتفهم في ثواني سواء في التصميم الثابت أو المتحرك.', 'One message understood in seconds, in static or motion pieces.'],
 ['توحيد اللغة البصرية', 'One Visual Language', 'نفس الألوان والخطوط والأيقونات بين الثابت والمتحرك علشان الهوية تتثبت.', 'The same colours, fonts and icons across static and motion to anchor the identity.'],
 ['التسلسل الهرمي', 'Visual Hierarchy', 'الأهم يتشاف أولًا بالحجم والتباين وترتيب الظهور.', 'The most important is seen first through size, contrast and order of appearance.'],
 ['المناطق الآمنة', 'Safe Areas', 'ابعد النصوص عن حواف الشاشة وعن واجهة المنصة حتى ما تتقصش.', 'Keep text away from screen edges and platform UI so nothing is cut off.'],
 ['حركة بغرض', 'Purposeful Motion', 'الحركة تساعد الفهم وتوجّه العين، مش زينة بس، وبتسارع وتباطؤ طبيعيين.', 'Motion aids understanding and guides the eye, not mere decoration, with natural easing.']
]);
})();
