/* User guide content, part 2: learning, tasks & notes, clients & payments, media. Every text is [arabic, english]. */
(function(){
const D = window.MSA.guideData = window.MSA.guideData || [];
D.push(
{ id: 'learn', ic: 'grad', col: '#9b6bff', go: 'learn', t: ['التعليم والتطوير', 'Learning & development'],
  sum: ['مكتبتك الشخصية للتعلم: فيديوهات، مراجع بصرية، أصول، ترندات، وخطة تعلم أسبوعية.', 'Your personal learning library: videos, visual references, assets, trends and a weekly learning plan.'],
  secs: [
  { id: 'videos', h: ['فيديوهات الكورسات', 'Course videos'], img: 'learn_videos', go: 'learn',
    p: ['الصق لينكات يوتيوب وهتتحول لكروت بصورة وعنوان، ومنظّمة في فولدرات ملوّنة.', 'Paste YouTube links and they turn into cards with picture and title, organised in coloured folders.'],
    steps: [['[[إضافة روابط فيديو]]: الصق رابط أو أكتر (واحد في كل سطر).', '[[Add video links]]: paste one or more links (one per line).'], ['[[مجلد جديد]]: اكتب اسم واختار لون.', '[[New folder]]: type a name and pick a colour.'], ['[[تحديد]] بيخليك تختار كذا عنصر مرة واحدة وتنسخ / تقص / تلصق / تمسح.', '[[Select]] lets you pick several items then copy / cut / paste / delete.'], ['بحث وترتيب بالاسم أو الأحدث. النجمة بتحط العنصر في [[المفضلة]].', 'Search and sort by name or newest. The star puts an item in [[Favourites]].'], ['اضغط على فيديو يتفتح في المشغّل الداخلي (يوتيوب) من غير ما تخرج من البرنامج.', 'Tap a video to play it in the in-app player (YouTube) without leaving the app.']],
    tips: [['الفولدر ممكن يتفتح جواه فولدرات تانية، وشريط المسار فوق بيرجّعك لأي مستوى.', 'A folder can contain other folders; the breadcrumb on top takes you back to any level.']] },
  { id: 'refs', h: ['المراجع (مود بورد عام)', 'References (general moodboard)'], img: 'learn_refs', go: 'learn',
    steps: [['[[إضافة صور]] من جهازك أو [[إضافة رابط]] لمرجع على النت.', '[[Add images]] from your device or [[Add link]] for an online reference.'], ['نظّمها في فولدرات ملونة، وحط وسوم (#قهوة، #هوية…) وفلتر بالوسم.', 'Organise in coloured folders, add tags (#coffee, #identity…) and filter by tag.'], ['نسخ / قص / لصق / تحديد / بحث / سحب وإفلات زي مدير الملفات.', 'Copy / cut / paste / select / search / drag & drop like a file manager.']] },
  { id: 'assets', h: ['مكتبة الأصول', 'Assets library'], img: 'learn_assets', go: 'learn',
    steps: [['[[إضافة أصل]]: خط، لون، تأثير، بريسيت، موسيقى أو أي ملف.', '[[Add asset]]: a font, colour, effect, preset, music or any file.'], ['صنّفهم بالتبويبات (خطوط، ألوان، تأثيرات، بريسيت، موسيقى، أخرى) وحط وسوم للبحث السريع.', 'Sort them with the tabs (fonts, colours, effects, presets, music, other) and add tags for quick search.'], ['النجمة تضيف للمفضلة.', 'The star adds to favourites.']] },
  { id: 'trends', h: ['الترندات', 'Trends'], img: 'learn_trends', go: 'learn',
    p: ['روابط لأشهر مصادر الاتجاهات (Pantone، Pinterest Trends، Dribbble، Behance، Coolors…). البرنامج مش بيسحب أخبار تلقائي.', 'Links to the best trend sources (Pantone, Pinterest Trends, Dribbble, Behance, Coolors…). The app does not pull news automatically.'],
    steps: [['افتح المصادر مرة في الأسبوع.', 'Open the sources once a week.'], ['سجّل اللي لفت نظرك في [[ملاحظات الأسبوع]] مصنّفة: لون، خط، ستايل، أداة، مونتاج.', 'Log what caught your eye in [[Weekly notes]] by type: colour, font, style, tool, editing.']] },
  { id: 'plan', h: ['خطة التعلم', 'Learning plan'], img: 'learn_plan', go: 'learn',
    steps: [['فيه أهداف جاهزة (Photoshop، Illustrator، After Effects، Premiere، DaVinci، Figma…): اضغط + لإضافة الهدف لأسبوعك.', 'Ready goals (Photoshop, Illustrator, After Effects, Premiere, DaVinci, Figma…): tap + to add one to your week.'], ['أضف هدف خاص بيك في الخانة.', 'Add your own goal in the box.'], ['علّم الهدف لما تخلّصه والعدّاد (مثلًا 2/5) بيوريك تقدمك.', 'Tick a goal when done; the counter (e.g. 2/5) shows your progress.']] },
  { id: 'color', h: ['نظرية الألوان', 'Colour theory'], img: 'p_sug', go: 'active',
    p: ['تبويب تفاعلي جوه نافذة الاقتراحات: عجلة ألوان زي Adobe Color مع قواعد التناغم.', 'An interactive tab inside the Suggestions window: an Adobe-Color-like wheel with harmony rules.'],
    steps: [['افتح [[الاقتراحات]] من أي خطوة ثم تبويب [[نظرية الألوان]].', 'Open [[Suggestions]] from any step then the [[Colour theory]] tab.'], ['اختار قاعدة التناغم وحرّك العجلة وشوف البالتة والدرجات الفاتحة والغامقة.', 'Pick a harmony rule, move the wheel and see the palette, tints and shades.'], ['فيه فاحص تباين للنص على الخلفية وكورس قصير عن الألوان.', 'There is a text-on-background contrast checker and a short colour-theory course.']] }
  ] },

{ id: 'tasks', ic: 'checks', col: '#3ccf91', go: 'tasks', t: ['مهام وملاحظات', 'Tasks & notes'],
  sum: ['نظام مهام وملاحظات بأربع طرق عرض، بأولويات ومواعيد وتنبيهات وتكرار.', 'A task and notes system with four views, priorities, deadlines, reminders and repeats.'],
  secs: [
  { id: 'list', h: ['القائمة والإضافة السريعة', 'List and quick add'], img: 't_list', go: 'tasks',
    steps: [['اكتب مهمة في خانة [[أضف مهمة سريعة]] واضغط Enter أو [[إضافة]].', 'Type a task in the [[quick add]] box and press Enter or [[Add]].'], ['المهام متقسّمة: متأخرة، النهارده، القادمة، وبدون ميعاد.', 'Tasks are grouped: overdue, today, upcoming and no date.'], ['فلتر بالأولوية (عاجلة، عالية، عادية، منخفضة) أو بالوسم أو ابحث بالكلمة.', 'Filter by priority (urgent, high, normal, low), by tag, or search.'], ['علامة الصح بتنهي المهمة وتنقلها للمنتهية (فيه زرار [[مكتملة]]).', 'The checkbox completes the task and moves it to Completed (use [[Completed]]).']] },
  { id: 'newtask', h: ['مهمة بكل التفاصيل', 'A task with all the details'], img: 't_new', go: 'tasks',
    steps: [['اضغط [[مهمة جديدة]].', 'Tap [[New task]].'], ['اكتب الاسم واختار الحالة (للتنفيذ، جارية، تمت) والأولوية.', 'Type the title and pick the state (to do, doing, done) and the priority.'], ['حدّد تاريخ البدء والموعد النهائي (Deadline)، وتنبيه (قبل بوقت معين) وتكرار (يومي، أسبوعي…).', 'Set a start date and a deadline, a reminder (some time before) and a repeat (daily, weekly…).'], ['ضيف قايمة فرعية (Checklist) ووسوم وملفات مرفقة، وللملاحظات اختار لون وتثبيت.', 'Add a checklist, tags and file attachments; notes can also get a colour and be pinned.']] },
  { id: 'board', h: ['اللوحة (Kanban)', 'Board (Kanban)'], img: 't_board', go: 'tasks',
    steps: [['اضغط [[لوحة]]: أعمدة للتنفيذ / جارية / تمت.', 'Tap [[Board]]: columns for to do / doing / done.'], ['اسحب المهمة من عمود لعمود لتغيير حالتها.', 'Drag a task between columns to change its state.']] },
  { id: 'cal', h: ['التقويم', 'Calendar'], img: 't_cal', go: 'tasks',
    steps: [['اضغط [[تقويم]] تشوف الشهر بمواعيد مهامك.', 'Tap [[Calendar]] to see the month with your task deadlines.'], ['اضغط على يوم يعرضلك مهامه، وتنقل بين الشهور بالأسهم.', 'Tap a day to see its tasks, move between months with the arrows.']] },
  { id: 'notes', h: ['الملاحظات', 'Notes'], img: 't_notes', go: 'tasks',
    steps: [['اضغط [[ملاحظات]] ثم [[ملاحظة جديدة]].', 'Tap [[Notes]] then [[New note]].'], ['دوّن أفكار، ملخصات شغل، آراء عملاء، وبتقدر تثبّتها وتلوّنها وتبحث فيها.', 'Write ideas, work summaries and client feedback; you can pin, colour and search them.']] },
  { id: 'remind', h: ['التنبيهات', 'Reminders'], img: 't_new', go: 'tasks',
    steps: [['على الأندرويد التنبيهات بتوصلك والتطبيق مقفول لو سمحت بالإشعارات ومنبّهات الوقت.', 'On Android reminders reach you while the app is closed if you allow notifications and exact alarms.'], ['على الكمبيوتر والويب بتظهر والبرنامج مفتوح بس.', 'On computer and web they only show while the app is open.'], ['اختار صوت التنبيه من [[الإعدادات]] ← [[صوت الإشعارات]] (8 نغمات).', 'Pick the alert sound in [[Settings]] → [[Notification sound]] (8 tones).']],
    warn: [['بعض أجهزة شاومي وسامسونج بتقفل التطبيقات في الخلفية؛ لو التنبيهات مش بتوصل قفل توفير البطارية للبرنامج.', 'Some Xiaomi / Samsung phones kill background apps; if reminders do not arrive, turn off battery saving for the app.']] }
  ] },

{ id: 'money', ic: 'trend', col: '#18b4c8', go: 'money', t: ['العملاء والمدفوعات', 'Clients & payments'],
  sum: ['شيت عملاء زي Excel، ولوحة مستحقات بتوريك مين لسه مدفعش، وأسعار صرف العملات.', 'An Excel-like client sheet, a dues dashboard showing who has not paid yet, and currency rates.'],
  secs: [
  { id: 'sheet', h: ['شيت العملاء', 'Client sheet'], img: 'clients', go: 'clients',
    p: ['جدول بنفس شكل البرنامج، بيحفظ نفسه تلقائي، ومربوط بمشاريعك وتسعيرك.', 'A table in the app\'s look that saves itself and is linked to your projects and pricing.'],
    steps: [['[[عميل جديد]] يضيف صف. اكتب مباشرة في الخلايا.', '[[New client]] adds a row. Type directly in the cells.'], ['الأعمدة: الاسم، الشركة، الإيميل، الهاتف، واتساب، المدينة، الخدمة، الحالة، المصدر، أول تعامل، آخر تواصل، ملاحظات. [[عمود]] يضيف عمود مخصص.', 'Columns: name, company, email, phone, WhatsApp, city, service, status, source, first contact, last contact, notes. [[Column]] adds a custom one.'], ['الصق من Excel بـ `Ctrl + V`، و Enter ينزل للخلية التالية، واسحب حافة العنوان لتغيير العرض.', 'Paste from Excel with `Ctrl + V`, Enter moves down, drag a header edge to resize.'], ['[[استيراد]] من Excel / CSV و[[Excel / CSV]] و[[PDF]] للتصدير.', '[[Import]] from Excel / CSV; export as Excel / CSV or PDF.'], ['أعمدة المشاريع المكتملة وقيمة الشغل بتتحسب لوحدها باسم العميل.', 'The completed-projects and work-value columns are computed automatically by client name.']],
    tips: [['بعد عدد أيام تحدده من «آخر تواصل» البرنامج بيعمل مهمة متابعة تلقائية للعميل (من الإعدادات).', 'After a number of days from "last contact" the app creates a follow-up task for the client (set in Settings).']] },
  { id: 'dues', h: ['المستحقات والمدفوعات', 'Dues and payments'], img: 'money', go: 'money',
    steps: [['لوحة فوق: غير محصّل، متأخر عن موعده، محصّل هذا الشهر.', 'Top cards: uncollected, overdue, collected this month.'], ['المبالغ مجمّعة باسم العميل، وكل مشروع بيعرض الإجمالي والمدفوع والمتبقي.', 'Amounts are grouped by client and each project shows total, paid and remaining.'], ['[[دفعة]] تسجّل مبلغ، [[رسالة تذكير]] تجهّز رسالة للعميل، [[فتح المشروع]] يوديك للمشروع.', '[[Payment]] records an amount, [[Reminder message]] prepares a client message, [[Open project]] takes you to it.'], ['فلتر: الكل، غير محصّل، مدفوع بالكامل.', 'Filter: all, uncollected, fully paid.']] },
  { id: 'rates', h: ['أسعار العملات', 'Currency rates'], img: 'money', go: 'money',
    steps: [['كل الأسعار مقابل الجنيه المصري، وبتتحدّث تلقائي كل 12 ساعة لما يكون فيه إنترنت.', 'All rates are against the Egyptian pound and refresh every 12 hours when online.'], ['[[تحديث الأسعار الآن]] للتحديث اليدوي، وتقدر تكتب سعر بنفسك لأي عملة.', '[[Update rates now]] refreshes manually; you can type your own rate for any currency.'], ['المحوّل السريع تحت بيحوّل بين EGP وUSD وEUR وGBP.', 'The quick converter below converts between EGP, USD, EUR and GBP.']] }
  ] },

{ id: 'media', ic: 'music', col: '#ff6b9a', go: 'media', t: ['الموسيقى والفيديو', 'Music & video'],
  sum: ['مشغّل موسيقى بيفضل شغال وإنت بتشتغل، ومشغّل فيديو للملفات واللينكات.', 'A music player that keeps playing while you work, and a video player for files and links.'],
  secs: [
  { id: 'music', h: ['مكتبة الموسيقى', 'Music library'], img: 'media_music', go: 'media',
    steps: [['[[إضافة موسيقى]] واختار ملفات mp3 / m4a / wav من جهازك.', '[[Add music]] and pick mp3 / m4a / wav files from your device.'], ['اضغط على أغنية تشتغل، وبيظهر شريط تحكم صغير تحت بيفضل معاك في كل شاشة.', 'Tap a track to play; a small control bar stays with you on every screen.'], ['[[عشوائي]] و[[تكرار]] (إيقاف / الكل / واحدة) و[[قايمة تشغيل جديدة]].', '[[Shuffle]], [[Repeat]] (off / all / one) and [[New playlist]].'], ['الأغاني بتتحفظ في برنامجك ومتاحة من غير نت.', 'Tracks are stored in the app and work offline.']] },
  { id: 'lock', h: ['الموسيقى والشاشة مقفولة', 'Music with the screen locked'], img: 'media_music', go: 'media',
    steps: [['في تطبيق الأندرويد، لما تشغّل موسيقى بيظهر إشعار فيه أزرار السابق / تشغيل-إيقاف / التالي / إيقاف.', 'In the Android app, playing music shows a notification with previous / play-pause / next / stop buttons.'], ['الموسيقى بتكمّل حتى لو قفلت الشاشة أو بدّلت لتطبيق تاني.', 'Music continues even if you lock the screen or switch apps.']],
    warn: [['ده معتمد على الجهاز: بعض أجهزة شاومي وغيرها بتقفل التطبيقات في الخلفية. لو وقفت الموسيقى عند قفل الشاشة، اسمح للبرنامج يشتغل في الخلفية وقفل توفير البطارية له.', 'This depends on the device: some Xiaomi and other phones close background apps. If music stops when locking, allow the app to run in the background and disable battery saving for it.']] },
  { id: 'video', h: ['مشغّل الفيديو', 'Video player'], img: 'media_video', go: 'media',
    steps: [['[[رابط فيديو]]: يوتيوب أو فيميو أو رابط مباشر لملف، بيتشغّل جوه البرنامج.', '[[Video link]]: YouTube, Vimeo or a direct file link, played inside the app.'], ['[[ملف فيديو]] من جهازك (mp4، webm، mov، mkv، avi).', '[[Video file]] from your device (mp4, webm, mov, mkv, avi).'], ['أزرار المشغّل: سرعة (0.5× إلى 2×)، رجوع/تقديم 10 ثواني، ملء الشاشة، صورة داخل صورة، ونافذة صغيرة عايمة بتفضل معاك وانت بتتنقل.', 'Player buttons: speed (0.5× to 2×), ±10 seconds, fullscreen, picture-in-picture and a small floating window that stays while you navigate.'], ['الفيديوهات المرفقة في خطوات المشاريع بتفتح في نفس المشغّل.', 'Videos attached in project steps open in the same player.']] },
  { id: 'formats', h: ['صيغ الفيديو والمشاكل الشائعة', 'Video formats and common problems'], img: null,
    list: [['**mp4 وwebm وmov**: بتشتغل في الغالب.', '**mp4, webm, mov**: usually play.'], ['**mkv**: البرنامج بيجرّبه بأكتر من طريقة، وبيشتغل غالبًا لو الفيديو H.264 والصوت AAC، بس مش مضمون على كل جهاز.', '**mkv**: the app tries several ways; it usually works with H.264 video and AAC audio, but it is not guaranteed on every device.'], ['**avi**: غالبًا مش هيشتغل جوه البرنامج لأن المتصفح الداخلي مش بيدعمه.', '**avi**: usually does not play inside the app because the built-in browser does not support it.']],
    steps: [['لو الفيديو ماشتغلش بتظهر رسالة واضحة وزرارين: [[افتح في مشغّل تاني]] (على الأندرويد) و[[حفظ نسخة]].', 'If a video can not play a clear message appears with two buttons: [[Open in another player]] (Android) and [[Save a copy]].'], ['بعض فيديوهات يوتيوب مش بتسمح بالتشغيل جوه تطبيق؛ افتحها في المتصفح.', 'Some YouTube videos do not allow embedding; open them in the browser.']],
    tips: [['الفيديوهات الكبيرة جدًا بتاخد وقت لما تفتحها في مشغّل خارجي لأنها بتتجهّز الأول.', 'Very large videos take a while to open in an external player because they are prepared first.']] }
  ] }
);
})();
