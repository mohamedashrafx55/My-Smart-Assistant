/* English / Arabic dictionary. t(key, {vars}) falls back to English, then to the key itself. */
(function(){
const MSA = window.MSA = window.MSA || {};

const en = {
  /* navigation */
  "nav.active": "Projects in progress", "nav.done": "Completed projects", "nav.learn": "Learning & development", "nav.tasks": "Tasks & notes",
  "nav.s.active": "In progress", "nav.s.done": "Completed", "nav.s.learn": "Learning", "nav.s.tasks": "Tasks",
  "settings": "Settings", "theme": "Toggle theme",

  /* common */
  "add": "Add", "cancel": "Cancel", "save": "Save", "close": "Close", "ok": "OK", "confirm": "Confirm", "create": "Create", "delete": "Delete",
  "open": "Open", "back": "Back", "more": "More", "search": "Search…", "rename": "Rename", "copy": "Copy", "cut": "Cut", "paste": "Paste",
  "download": "Download", "select": "Select", "selected": "{n} selected", "done": "Done", "completed": "Completed", "today": "Today",
  "note": "Note", "task": "Task", "custom": "Custom", "files": "files", "folders": "Folders", "videos": "Videos", "untitled": "Untitled",
  "noResults": "No results", "openLink": "Open link", "copyLink": "Copy link", "copied": "Link copied", "pin": "Pin", "tags": "Tags",
  "add.image": "Add image", "add.doc": "Add document", "add.video": "Add video", "add.audio": "Add audio",
  "attachments": "Attachments", "fileFail": "Couldn't add", "filesAdded": "{n} file(s) added", "fileMissing": "File not found",
  "delFileQ": "Remove this file?",

  /* projects in progress */
  "active.sub": "Follow the plan, attach your work, and tick each step when it's done.",
  "active.empty": "No active projects", "active.emptySub": "Start a project and follow the plan step by step.",
  "newProject": "New project", "projectName": "Project name", "projectNamePh": "e.g. Finjan launch campaign",
  "startFrom": "Start from", "tpl.campaign": "Campaign plan", "tpl.blank": "Blank project",
  "tpl.campaignHint": "Brief → idea → mood board → visual foundations → logo & slogan → key visual → templates → on-screen / print → mockups.",
  "tpl.blankHint": "An empty project — add your own steps.",
  "addStep": "Add step", "addSubStep": "Add sub-step", "stepName": "Step name", "moveUp": "Move up", "moveDown": "Move down",
  "markDone": "Mark as done", "markComplete": "Mark project complete", "renameProject": "Rename project",
  "notePh": "Write a note for this step…", "noSteps": "No steps yet", "noStepsSub": "Add the first step of this project.",
  "stepsDone": "{a} of {b} steps done", "allDone": "All steps done — great work!",
  "delStepQ": "Delete the step “{n}” and its files?", "delProjQ": "Delete “{n}” and all its files? This can't be undone.",
  "completeQ": "Move “{n}” to Completed projects?", "completeQPartial": "“{n}” is only {p}% done. Move it to Completed projects anyway?",
  "movedToDone": "Moved to Completed projects",

  /* campaign plan steps */
  "step.brief": "Brief", "step.brief.h": "Goal & audience",
  "step.idea": "Idea", "step.idea.h": "The big idea of the campaign",
  "step.mood": "Mood board", "step.mood.h": "References for feel, light and style",
  "step.foundations": "Visual foundations", "step.foundations.h": "Global rules applied to everything",
  "step.colors": "Colors", "step.colors.h": "The palette",
  "step.fonts": "Fonts", "step.fonts.h": "Headline font + text font",
  "step.icons": "Icons", "step.icons.h": "Icon style",
  "step.imagestyle": "Image style", "step.imagestyle.h": "Photo, illustration or 3D — light and treatment",
  "step.logo": "Logo", "step.logo.h": "The mark and its color versions",
  "step.slogan": "Slogan", "step.slogan.h": "The short line that repeats across the campaign",
  "step.main": "Main design", "step.main.h": "The key visual every other piece comes from",
  "step.templates": "Templates & grid", "step.templates.h": "Fixed spacing and positions for logo and text",
  "step.onscreen": "On-screen", "step.onscreen.h": "Everything shown on screens",
  "step.static": "Static designs", "step.static.h": "Posts, stories, covers",
  "step.motion": "Motion", "step.motion.h": "Reels, teaser, motion graphics",
  "step.printing": "Printing", "step.printing.h": "Posters, flyers, banners",
  "step.mockups": "Mockups & presentation", "step.mockups.h": "Show the work in real contexts for the portfolio",
  "seed.name": "Finjan café — launch campaign",
  "seed.brief": "Practice + portfolio campaign. Goal and audience: to be decided.",
  "seed.idea": "Fictional coffee shop “Finjan” — luxury & classic personality.",
  "seed.logo": "The word «فنجان» in Arabic calligraphy shaped like a coffee cup.",

  /* completed projects & presentation */
  "done.sub": "Your finished work, ready to present.", "done.empty": "No completed projects yet", "done.emptySub": "Finished projects appear here, ready to present.",
  "completedOn": "Completed {d}", "present": "Present", "reopen": "Reopen", "projectSteps": "Project steps",
  "reopenQ": "Move “{n}” back to Projects in progress?", "reopened": "Project reopened",
  "pres.caseStudy": "Case study", "pres.overview": "Overview", "pres.step": "Step {a} of {b}", "pres.thanks": "Thank you",

  /* learning */
  "learn.sub": "Videos and courses you want to learn from, organized in folders.", "learn.root": "Learning",
  "learn.empty": "Nothing here yet", "learn.emptySub": "Paste YouTube links or create folders to organize your learning.",
  "addVideoLinks": "Add video links", "pasteLinks": "Paste one or more links",
  "linksHint": "Separate links with a new line or space. Titles and thumbnails load automatically for YouTube.",
  "linksAdded": "{n} link(s) added", "loadingTitle": "Loading title…", "newFolder": "New folder", "folderName": "Folder name", "folderColor": "Folder color",
  "itemsCount": "{n} items", "sortName": "Sort: name", "sortNew": "Sort: newest", "pasteHere": "Paste into this folder",
  "copiedItems": "{n} item(s) copied — open a folder and paste", "cutItems": "{n} item(s) cut — open a folder and paste", "pasted": "{n} item(s) pasted",
  "delItemQ": "Delete this item? Folders are deleted with everything inside.", "delItemsQ": "Delete {n} items? Folders are deleted with everything inside.",
  "openYoutube": "Open on YouTube", "lessonNotes": "Notes", "lessonNotesPh": "What did you learn?", "copySuffix": "copy",

  /* tasks & notes */
  "tasks.sub": "{n} open tasks", "tasks.empty": "Nothing to do", "tasks.emptySub": "Add a task above to get started.",
  "notes.empty": "No notes yet", "notes.emptySub": "Capture ideas, briefs and client feedback.",
  "newTask": "New task", "newNote": "New note", "editTask": "Edit task", "editNote": "Edit note",
  "taskTitlePh": "Task name", "noteTitlePh": "Note title", "quickAdd": "Quick add a task and press Enter…",
  "view.list": "List", "view.board": "Board", "view.cal": "Calendar", "view.notes": "Notes",
  "allPriorities": "All priorities", "allTags": "All tags",
  "prio.urgent": "Urgent", "prio.high": "High", "prio.normal": "Normal", "prio.low": "Low", "priority": "Priority",
  "status.todo": "To do", "status.doing": "In progress", "status.review": "Review", "status.done": "Done", "statusL": "Status",
  "grp.overdue": "Overdue", "grp.today": "Today", "grp.upcoming": "Upcoming", "grp.nodate": "No date",
  "startDate": "Start", "deadline": "Deadline", "reminder": "Reminder", "remindAt": "Remind me at", "repeat": "Repeat",
  "rem.none": "No reminder", "rem.atDue": "At deadline", "rem.m5": "5 minutes before", "rem.m15": "15 minutes before", "rem.m30": "30 minutes before",
  "rem.h1": "1 hour before", "rem.h3": "3 hours before", "rem.d1": "1 day before", "rem.custom": "Custom time…",
  "rep.none": "Doesn't repeat", "rep.daily": "Daily", "rep.weekly": "Weekly", "rep.monthly": "Monthly",
  "description": "Details", "descPh": "Write details, ideas, links…", "checklist": "Checklist", "addChecklistItem": "Add checklist item", "addTag": "Add a tag and press Enter",
  "noteColor": "Note color", "delTaskQ": "Delete “{n}”?", "completed": "Completed",
  "nextOccurrence": "Done — next one is {d}", "dueLabel": "Due {d}", "missedReminders": "{n} reminder(s) came due while the app was closed",

  /* settings */
  "s.profile": "Personal info", "s.contact": "Contact info", "s.accounts": "Accounts", "s.prefs": "App settings", "s.data": "Data & backup",
  "fullName": "Full name", "jobTitle": "Job title", "bio": "About me", "email": "Email", "phone": "Phone", "location": "Location", "website": "Website",
  "changePhoto": "Change photo", "removePhoto": "Remove photo", "addAccount": "Add account", "noAccounts": "No accounts yet. Add your Behance, Instagram, LinkedIn…",
  "appearance": "Appearance", "themeLight": "Light", "themeDark": "Dark", "themeAuto": "Auto", "language": "Language", "accent": "Accent color",
  "introAnim": "Show intro animation", "enableNotif": "Enable notifications", "notifOn": "Notifications enabled",
  "dataHint": "Everything is stored on this device only. Export a backup regularly.", "storageUsed": "{s} used",
  "exportBackup": "Export backup", "importBackup": "Import backup", "resetAll": "Erase all data", "backupSaved": "Backup saved",
  "importFail": "That file isn't a valid backup", "importQ": "Importing replaces everything currently in the app. Continue?",
  "resetQ": "Erase ALL projects, tasks, notes, files and settings from this device?", "resetQ2": "Last chance — this cannot be undone. Erase everything?"
};

const ar = {
  "nav.active": "المشاريع قيد التنفيذ", "nav.done": "المشاريع المتكاملة", "nav.learn": "التعليم والتطوير", "nav.tasks": "مهام وملاحظات",
  "nav.s.active": "قيد التنفيذ", "nav.s.done": "المتكاملة", "nav.s.learn": "التعليم", "nav.s.tasks": "المهام",
  "settings": "الإعدادات", "theme": "تبديل الوضع",

  "add": "إضافة", "cancel": "إلغاء", "save": "حفظ", "close": "إغلاق", "ok": "موافق", "confirm": "تأكيد", "create": "إنشاء", "delete": "حذف",
  "open": "فتح", "back": "رجوع", "more": "المزيد", "search": "بحث…", "rename": "إعادة تسمية", "copy": "نسخ", "cut": "قص", "paste": "لصق",
  "download": "تنزيل", "select": "تحديد", "selected": "تم تحديد {n}", "done": "تم", "completed": "المكتملة", "today": "اليوم",
  "note": "ملاحظة", "task": "مهمة", "custom": "مخصص", "files": "ملفات", "folders": "المجلدات", "videos": "الفيديوهات", "untitled": "بدون عنوان",
  "noResults": "لا توجد نتائج", "openLink": "فتح الرابط", "copyLink": "نسخ الرابط", "copied": "تم نسخ الرابط", "pin": "تثبيت", "tags": "الوسوم",
  "add.image": "إضافة صورة", "add.doc": "إضافة مستند", "add.video": "إضافة فيديو", "add.audio": "إضافة ملف صوتي",
  "attachments": "المرفقات", "fileFail": "تعذّرت إضافة", "filesAdded": "تمت إضافة {n} ملف", "fileMissing": "الملف غير موجود",
  "delFileQ": "حذف هذا الملف؟",

  "active.sub": "امشِ على الخطة، أرفق شغلك، وعلّم كل خطوة بعلامة صح عند اكتمالها.",
  "active.empty": "لا توجد مشاريع قيد التنفيذ", "active.emptySub": "ابدأ مشروعًا وامشِ على الخطة خطوة بخطوة.",
  "newProject": "مشروع جديد", "projectName": "اسم المشروع", "projectNamePh": "مثال: كامبين افتتاح فنجان",
  "startFrom": "ابدأ من", "tpl.campaign": "خطة الكامبين", "tpl.blank": "مشروع فارغ",
  "tpl.campaignHint": "الملخص ← الفكرة ← المود بورد ← الأسس البصرية ← اللوجو والشعار ← التصميم الرئيسي ← القوالب ← الشاشة / المطبوعات ← الموك أب.",
  "tpl.blankHint": "مشروع فارغ — أضف خطواتك بنفسك.",
  "addStep": "إضافة خطوة", "addSubStep": "إضافة خطوة فرعية", "stepName": "اسم الخطوة", "moveUp": "نقل لأعلى", "moveDown": "نقل لأسفل",
  "markDone": "تعليم كمكتمل", "markComplete": "إنهاء المشروع", "renameProject": "إعادة تسمية المشروع",
  "notePh": "اكتب ملاحظة لهذه الخطوة…", "noSteps": "لا توجد خطوات بعد", "noStepsSub": "أضف أول خطوة في هذا المشروع.",
  "stepsDone": "اكتملت {a} من {b} خطوة", "allDone": "اكتملت كل الخطوات — شغل ممتاز!",
  "delStepQ": "حذف الخطوة «{n}» وملفاتها؟", "delProjQ": "حذف «{n}» وكل ملفاته؟ لا يمكن التراجع عن ذلك.",
  "completeQ": "نقل «{n}» إلى المشاريع المتكاملة؟", "completeQPartial": "«{n}» مكتمل بنسبة {p}% فقط. تنقله إلى المشاريع المتكاملة رغم ذلك؟",
  "movedToDone": "تم النقل إلى المشاريع المتكاملة",

  "step.brief": "الملخص (Brief)", "step.brief.h": "الهدف والجمهور",
  "step.idea": "الفكرة", "step.idea.h": "الفكرة الأساسية للحملة",
  "step.mood": "المود بورد", "step.mood.h": "مراجع للإحساس والإضاءة والستايل",
  "step.foundations": "الأسس البصرية", "step.foundations.h": "قواعد عامة تُطبَّق على كل شيء",
  "step.colors": "الألوان", "step.colors.h": "لوحة الألوان",
  "step.fonts": "الخطوط", "step.fonts.h": "خط العناوين وخط النص",
  "step.icons": "الأيقونات", "step.icons.h": "نمط الأيقونات",
  "step.imagestyle": "أسلوب الصور", "step.imagestyle.h": "تصوير أم رسم أم 3D — الإضاءة والمعالجة",
  "step.logo": "اللوجو", "step.logo.h": "العلامة ونسخها الملوّنة",
  "step.slogan": "الشعار", "step.slogan.h": "الجملة القصيرة التي تتكرر في الحملة",
  "step.main": "التصميم الرئيسي", "step.main.h": "الكي فيجوال الذي تتفرع منه كل القطع",
  "step.templates": "القوالب والشبكة", "step.templates.h": "مسافات ومواضع ثابتة للوجو والنص",
  "step.onscreen": "العرض على الشاشة", "step.onscreen.h": "كل ما يُعرض على الشاشات",
  "step.static": "تصميمات ثابتة", "step.static.h": "بوستات وستوريز وأغلفة",
  "step.motion": "موشن", "step.motion.h": "ريلز وتيزر وموشن جرافيك",
  "step.printing": "المطبوعات", "step.printing.h": "بوسترات وفلايرز وبانرات",
  "step.mockups": "الموك أب والعرض النهائي", "step.mockups.h": "عرض الشغل في سياقات حقيقية للبورتفوليو",
  "seed.name": "كامبين افتتاح كافيه فنجان",
  "seed.brief": "كامبين للتمرين والبورتفوليو. الهدف والجمهور: لسه هيتحددوا.",
  "seed.idea": "كافيه وهمي اسمه «فنجان» بشخصية فخمة وكلاسيكية.",
  "seed.logo": "كلمة «فنجان» بخط عربي على شكل فنجان القهوة.",

  "done.sub": "شغلك المنتهي، جاهز للعرض.", "done.empty": "لا توجد مشاريع مكتملة بعد", "done.emptySub": "المشاريع المنتهية تظهر هنا جاهزة للعرض.",
  "completedOn": "اكتمل في {d}", "present": "عرض تقديمي", "reopen": "إعادة فتح", "projectSteps": "خطوات المشروع",
  "reopenQ": "إعادة «{n}» إلى المشاريع قيد التنفيذ؟", "reopened": "تمت إعادة فتح المشروع",
  "pres.caseStudy": "دراسة حالة", "pres.overview": "نظرة عامة", "pres.step": "الخطوة {a} من {b}", "pres.thanks": "شكرًا لكم",

  "learn.sub": "فيديوهات ودورات تتعلم منها، منظّمة في مجلدات.", "learn.root": "التعليم",
  "learn.empty": "لا يوجد شيء هنا بعد", "learn.emptySub": "الصق روابط يوتيوب أو أنشئ مجلدات لتنظيم تعلّمك.",
  "addVideoLinks": "إضافة روابط فيديو", "pasteLinks": "الصق رابطًا أو أكثر",
  "linksHint": "افصل الروابط بسطر جديد أو مسافة. العنوان والصورة المصغّرة يظهران تلقائيًا لروابط يوتيوب.",
  "linksAdded": "تمت إضافة {n} رابط", "loadingTitle": "جارٍ تحميل العنوان…", "newFolder": "مجلد جديد", "folderName": "اسم المجلد", "folderColor": "لون المجلد",
  "itemsCount": "{n} عنصر", "sortName": "ترتيب: الاسم", "sortNew": "ترتيب: الأحدث", "pasteHere": "لصق داخل هذا المجلد",
  "copiedItems": "تم نسخ {n} عنصر — افتح مجلدًا والصق", "cutItems": "تم قص {n} عنصر — افتح مجلدًا والصق", "pasted": "تم لصق {n} عنصر",
  "delItemQ": "حذف هذا العنصر؟ المجلدات تُحذف بكل ما بداخلها.", "delItemsQ": "حذف {n} عنصر؟ المجلدات تُحذف بكل ما بداخلها.",
  "openYoutube": "فتح على يوتيوب", "lessonNotes": "ملاحظات", "lessonNotesPh": "ماذا تعلّمت؟", "copySuffix": "نسخة",

  "tasks.sub": "{n} مهمة مفتوحة", "tasks.empty": "لا توجد مهام", "tasks.emptySub": "أضف مهمة من الأعلى لتبدأ.",
  "notes.empty": "لا توجد ملاحظات بعد", "notes.emptySub": "دوّن أفكارك وملخصات الشغل وآراء العملاء.",
  "newTask": "مهمة جديدة", "newNote": "ملاحظة جديدة", "editTask": "تعديل المهمة", "editNote": "تعديل الملاحظة",
  "taskTitlePh": "اسم المهمة", "noteTitlePh": "عنوان الملاحظة", "quickAdd": "أضف مهمة سريعة واضغط Enter…",
  "view.list": "قائمة", "view.board": "لوحة", "view.cal": "تقويم", "view.notes": "ملاحظات",
  "allPriorities": "كل الأولويات", "allTags": "كل الوسوم",
  "prio.urgent": "عاجلة", "prio.high": "عالية", "prio.normal": "عادية", "prio.low": "منخفضة", "priority": "الأولوية",
  "status.todo": "للتنفيذ", "status.doing": "قيد التنفيذ", "status.review": "مراجعة", "status.done": "تم", "statusL": "الحالة",
  "grp.overdue": "متأخرة", "grp.today": "اليوم", "grp.upcoming": "القادمة", "grp.nodate": "بدون موعد",
  "startDate": "البداية", "deadline": "الموعد النهائي (ديدلاين)", "reminder": "التنبيه", "remindAt": "نبّهني في", "repeat": "التكرار",
  "rem.none": "بدون تنبيه", "rem.atDue": "عند الموعد النهائي", "rem.m5": "قبلها بـ 5 دقائق", "rem.m15": "قبلها بـ 15 دقيقة", "rem.m30": "قبلها بـ 30 دقيقة",
  "rem.h1": "قبلها بساعة", "rem.h3": "قبلها بـ 3 ساعات", "rem.d1": "قبلها بيوم", "rem.custom": "وقت مخصص…",
  "rep.none": "لا تتكرر", "rep.daily": "يوميًا", "rep.weekly": "أسبوعيًا", "rep.monthly": "شهريًا",
  "description": "التفاصيل", "descPh": "اكتب التفاصيل والأفكار والروابط…", "checklist": "قائمة مهام فرعية", "addChecklistItem": "أضف بندًا", "addTag": "أضف وسمًا واضغط Enter",
  "noteColor": "لون الملاحظة", "delTaskQ": "حذف «{n}»؟",
  "nextOccurrence": "تم — الموعد القادم {d}", "dueLabel": "الموعد {d}", "missedReminders": "حان موعد {n} تنبيه أثناء إغلاق التطبيق",

  "s.profile": "البيانات الشخصية", "s.contact": "بيانات الاتصال", "s.accounts": "الحسابات", "s.prefs": "إعدادات الأداة", "s.data": "البيانات والنسخ الاحتياطي",
  "fullName": "الاسم الكامل", "jobTitle": "المسمى الوظيفي", "bio": "نبذة عني", "email": "البريد الإلكتروني", "phone": "الهاتف", "location": "الموقع", "website": "الموقع الإلكتروني",
  "changePhoto": "تغيير الصورة", "removePhoto": "إزالة الصورة", "addAccount": "إضافة حساب", "noAccounts": "لا توجد حسابات بعد. أضف Behance وInstagram وLinkedIn…",
  "appearance": "المظهر", "themeLight": "نهاري", "themeDark": "ليلي", "themeAuto": "تلقائي", "language": "اللغة", "accent": "لون التمييز",
  "introAnim": "إظهار أنيميشن الافتتاح", "enableNotif": "تفعيل الإشعارات", "notifOn": "الإشعارات مفعّلة",
  "dataHint": "كل شيء يُحفظ على هذا الجهاز فقط. صدّر نسخة احتياطية بانتظام.", "storageUsed": "المستخدم {s}",
  "exportBackup": "تصدير نسخة احتياطية", "importBackup": "استيراد نسخة احتياطية", "resetAll": "مسح كل البيانات", "backupSaved": "تم حفظ النسخة الاحتياطية",
  "importFail": "هذا الملف ليس نسخة احتياطية صالحة", "importQ": "الاستيراد يستبدل كل ما في الأداة حاليًا. هل تتابع؟",
  "resetQ": "مسح كل المشاريع والمهام والملاحظات والملفات والإعدادات من هذا الجهاز؟", "resetQ2": "فرصة أخيرة — لا يمكن التراجع. مسح كل شيء؟"
};

const D = { en, ar };
MSA.dict = D;
MSA.t = function(key, vars){
  const lang = (MSA.state && MSA.state.settings && MSA.state.settings.lang) || 'ar';
  let s = (D[lang] && D[lang][key]);
  if (s == null) s = D.en[key];
  if (s == null) return key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  return s;
};
})();

