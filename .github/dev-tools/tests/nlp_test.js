const N=require('../../../js/voice-nlp.js');
const now=new Date(2026,10,15,11,0);   // Sunday 15 Nov 2026 11:00
let pass=0,fail=0;
function t(text,exp,ctx){ const r=N.parse(text,Object.assign({now},ctx||{})); const bad=Object.keys(exp).filter(k=>JSON.stringify(r[k])!==JSON.stringify(exp[k])); if(bad.length){fail++;console.log('FAIL',JSON.stringify(text),'\n   got',JSON.stringify(r),'\n   exp',JSON.stringify(exp));} else pass++; }
// add task
t('ضيف مهمة تصميم بوستر بكرة الساعة 3',{intent:'add_task',title:'تصميم بوستر',date:'2026-11-16',time:'15:00'});
t('ضيف مهمة تصميم بوستر بكرة الساعة ٣',{intent:'add_task',title:'تصميم بوستر',date:'2026-11-16',time:'15:00'});
t('أضف مهمة مراجعة العقد النهارده الساعة 5 ونص',{intent:'add_task',title:'مراجعة العقد',date:'2026-11-15',time:'17:30'});
t('اعمل لي مهمة مونتاج الريل يوم الخميس الساعة 10 الصبح',{intent:'add_task',title:'مونتاج الريل',date:'2026-11-19',time:'10:00'});
t('ضيف تاسك اجتماع مع العميل بعد بكرة الساعة 4 العصر',{intent:'add_task',title:'اجتماع مع العميل',date:'2026-11-17',time:'16:00'});
t('سجل مهمة ارسال الفاتورة',{intent:'add_task',title:'ارسال الفاتورة',date:null,time:null});
t('ضيف مهمة شراء كروت الشخصية الساعة 8 بالليل',{intent:'add_task',title:'شراء كروت الشخصية',time:'20:00'});
t('ضيف مهمة تسليم اللوجو يوم 20 نوفمبر',{intent:'add_task',title:'تسليم اللوجو',date:'2026-11-20'});
t('ضيف مهمة تصدير الفيديو الساعة 7 الا ربع',{intent:'add_task',title:'تصدير الفيديو',time:'18:45'});
t('ضيف مهمة قهوة الساعة 12:30',{intent:'add_task',title:'قهوة',time:'12:30'});
t('ضيف مهمة قراءة الساعة تسعة وربع الصبح',{intent:'add_task',title:'قراءة',time:'09:15'});
t('ضيف مهمة رسم الستوري بورد الاسبوع الجاي',{intent:'add_task',title:'رسم الستوري بورد',date:'2026-11-22'});
t('ذكرني اكلم العميل بعد ساعتين',{intent:'add_task',title:'اكلم العميل',time:'13:00',date:'2026-11-15',remind:true});
t('ذكرني اني ادفع الايجار بكرة الساعة 9 الصبح',{intent:'add_task',title:'ادفع الايجار',date:'2026-11-16',time:'09:00',remind:true});
t('فكرني بمكالمة المحاسب بعد نص ساعة',{intent:'add_task',time:'11:30',remind:true});
t('يا مساعد ضيف مهمة طباعة الملف',{intent:'add_task',title:'طباعة الملف'});
t('لو سمحت ضيف مهمة تعديل الخطوط',{intent:'add_task',title:'تعديل الخطوط'});
t('ضيف مهمة',{intent:'add_task',title:'',missing:'title'});
// notes
t('اكتب ملاحظة فكرة فيديو جديد عن الالوان',{intent:'add_note',title:'فكرة فيديو جديد عن الالوان'});
t('ضيف ملاحظة اللون الاساسي ازرق',{intent:'add_note',title:'اللون الاساسي ازرق'});
// complete
t('خلصت تصميم البوستر',{intent:'complete_task',query:'تصميم البوستر'});
t('علّم مهمة مراجعة العقد كمنتهية',{intent:'complete_task',query:'مراجعة العقد'});
t('علم مراجعة العقد انها خلصت',{intent:'complete_task',query:'مراجعة العقد'});
t('خلصنا من المونتاج',{intent:'complete_task',query:'المونتاج'});
// delete
t('احذف مهمة الاجتماع',{intent:'delete_task',query:'الاجتماع'});
t('امسح تاسك شراء الكروت',{intent:'delete_task',query:'شراء الكروت'});
// reschedule
t('أجّل مهمة المونتاج ليوم الخميس الساعة 7',{intent:'reschedule',query:'المونتاج',date:'2026-11-19',time:'07:00'});
t('انقل موعد الاجتماع لبكرة الساعة 2',{intent:'reschedule',query:'الاجتماع',date:'2026-11-16',time:'14:00'});
t('غير ميعاد تسليم اللوجو بعد بكرة',{intent:'reschedule',query:'تسليم اللوجو',date:'2026-11-17'});
// read
t('ايه مهامي النهارده',{intent:'read_tasks',date:'2026-11-15'});
t('قولي مهام بكرة',{intent:'read_tasks',date:'2026-11-16'});
t('عندي ايه النهارده',{intent:'read_tasks',date:'2026-11-15'});
t('ايه اللي ورايا بكرة',{intent:'read_tasks',date:'2026-11-16'});
t('اقرا لي جدول النهارده',{intent:'read_tasks'});
t('ايه المستحقات',{intent:'read_money'});
t('كام فلوس لسه ماتحصلتش',{intent:'read_money'});
// navigation
t('افتح المدفوعات',{intent:'open',target:'money'});
t('افتح المشاريع المكتملة',{intent:'open',target:'done'});
t('افتح المشاريع',{intent:'open',target:'active'});
t('روح للمهام',{intent:'open',target:'tasks'});
t('وريني التقارير',{intent:'open',target:'reports'});
t('افتح الاعدادات',{intent:'open',target:'settings'});
t('افتح التعلم والتطوير',{intent:'open',target:'learn'});
t('افتح الرئيسية',{intent:'open',target:'home'});
t('افتح العملاء',{intent:'open',target:'clients'});
t('افتح اعدادات المساعد الصوتي',{intent:'open',target:'settings',section:'voice'});
t('افتح مشروع الرحاب',{intent:'open_project',query:'الرحاب'});
t('افتح العميل احمد',{intent:'open_client',query:'احمد'});
t('افتح الروتين',{intent:'show_routine'});
t('ابحث عن لوجو',{intent:'search',query:'لوجو'});
t('دور على فاتورة احمد',{intent:'search',query:'فاتورة احمد'});
// payments
t('سجل دفعة 500 من الرحاب',{intent:'add_payment',amount:500,who:'الرحاب'});
t('استلمت 2000 جنيه من احمد',{intent:'add_payment',amount:2000,who:'احمد'});
t('سجل دفعة ٣ الاف لمشروع المنيو',{intent:'add_payment',amount:3000,who:'المنيو'});
t('قبضت 1500 جنيه من مشروع هوية كافيه',{intent:'add_payment',amount:1500,whoOrig:'هوية كافيه'});
// theme, lang
t('فعل الوضع الليلي',{intent:'theme',value:'dark'});
t('خلي الوضع نهاري',{intent:'theme',value:'light'});
t('غير اللغة للانجليزي',{intent:'lang',value:'en'});
// study
t('علم فيديو الاضاءة انه خلص',{intent:'study_done',query:'الاضاءة'});
t('خلصت درس الالوان',{intent:'study_done',query:'الالوان'});
// control
t('تراجع',{intent:'undo'}); t('ايوه',{intent:'yes'}); t('لا',{intent:'no'}); t('اسكت',{intent:'stop'});
t('ايه الاوامر اللي تقدر تعملها',{intent:'help'}); t('تقدر تعمل ايه',{intent:'help'});
t('يا مساعد',{intent:'wake'}); t('اهلا يا زميلي كيفك',{intent:'unknown'}); t('   ',{intent:'empty'});
t('يا جارفيس ضيف مهمة اختبار',{intent:'add_task',title:'اختبار'},{name:'جارفيس'});
// fuzzy
const items=['تصميم بوستر العرض','مراجعة العقد مع الرحاب','مونتاج ريل المنتج','اجتماع مع العميل','شراء كروت الشخصية'];
const b=(q)=>N.best(items,q).map(x=>x.item);
const eq=(a,b,n)=>{ if(JSON.stringify(a)!==JSON.stringify(b)){fail++;console.log('FAIL',n,JSON.stringify(a),'!=',JSON.stringify(b));} else pass++; };
eq(b('تصميم البوستر')[0],'تصميم بوستر العرض','fuzzy1'); eq(b('العقد')[0],'مراجعة العقد مع الرحاب','fuzzy2'); eq(b('المونتاج')[0],'مونتاج ريل المنتج','fuzzy3');
eq(b('الاجتماع')[0],'اجتماع مع العميل','fuzzy4'); eq(b('كروت')[0],'شراء كروت الشخصية','fuzzy5'); eq(b('حاجه تانيه خالص').length,0,'fuzzy none');
// speech
eq(N.sayTime('15:00'),'الساعة تلاتة العصر','say15'); eq(N.sayTime('17:30'),'الساعة خمسة ونص المغرب','say1730'); eq(N.sayTime('09:15'),'الساعة تسعة وربع الصبح','say0915'); eq(N.sayTime('18:45'),'الساعة سبعة إلا ربع المغرب','say1845');
eq(N.sayDate('2026-11-16',now),'بكرة','sayd'); eq(N.sayDate('2026-11-19',now),'يوم الخميس','sayd2');
console.log(pass+'/'+(pass+fail)+' passed');
process.exit(fail?1:0);
