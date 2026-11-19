// Unit tests for js/voice-smart.js (pure logic, no browser). Run: node smart_test.js
const S = require('../../../js/voice-smart.js'), NLP = require('../../../js/voice-nlp.js');
const now = new Date('2026-11-18T14:00:00'); let pass = 0, fail = 0;
const plan = t => S.pre(t, { now }) || ((NLP.parse(t, { now }).intent === 'unknown') ? S.post(t, { now }) : null);
const ok = (n, c, i) => { if (c) pass++; else { fail++; console.log('FAIL', n, i === undefined ? '' : JSON.stringify(i)); } };
const T = (phrase, act, chk) => { const p = plan(phrase); const o = p && p.ops[0]; ok(phrase, !!o && o.act === act && (!chk || chk(o, p)), o); };
const F = (k, v) => o => o.filter && o.filter[k] === v;
const and = (...f) => o => f.every(g => g(o));
// bulk delete (many phrasings, speech slips included)
['احذف جميع المهام المجدوله', 'احذف كل المهام المجدولة', 'قم بحذف جميع المهام المجدوله', 'امسح كل المهام اللي ليها ميعاد', 'شيل كل المهام المجدوله', 'عايز احذف جميع المهام المجدولة', 'لو سمحت احذف كل المهام المجدولة', 'نظف كل المهام المجدولة', 'ازل جميع المهام المجدوله']
  .forEach(p => T(p, 'delete', and(F('due', 'has'), F('type', 'task'))));
['قم بحذف جميع المهام الموجوده', 'احذف كل المهام', 'امسح جميع المهام', 'احذف المهام', 'فضي كل المهام', 'شيل المهام كلها'].forEach(p => T(p, 'delete', and(F('type', 'task'), F('status', 'any'), F('due', ''))));
['احذف كل الملاحظات', 'امسح جميع الملاحظات', 'احذف الملاحظات'].forEach(p => T(p, 'delete', F('type', 'note')));
['احذف المهام المنتهيه', 'امسح كل المهام الخلصانه', 'احذف جميع المهام المكتمله'].forEach(p => T(p, 'delete', and(F('status', 'done'), F('type', 'task'))));
T('احذف المهام المتاخره', 'delete', F('due', 'overdue'));
T('احذف كل المهام اللي فيها اجتماع', 'delete', F('text', 'اجتماع'));
T('احذف المهام الخاصه بالرحاب', 'delete', F('text', 'رحاب'));
T('احذف كل حاجه', 'delete', F('type', 'both'));
T('احذف المهام والملاحظات', 'delete', F('type', 'both'));
{ const x = plan('احذف كل مهام بكره'); ok('delete all of tomorrow', x && x.ops[0].filter && x.ops[0].filter.due === 'date:2026-11-19', x); }
// keep / except clauses
T('احذف جميع المهام في جدول المهام وفقط اترك مهام غدا', 'delete', o => o.filter.not && o.filter.not.due === 'date:2026-11-19');
T('احذف جميع المهام المجدوله واترك مهام غدا', 'delete', o => o.filter.due === 'has' && o.filter.not.due === 'date:2026-11-19');
T('احذف كل المهام ما عدا المنتهيه', 'delete', o => o.filter.not.status === 'done');
T('احذف كل المهام باستثناء المثبته', 'delete', o => o.filter.not.pinned === true);
T('احذف كل المهام ماعدا الملاحظات', 'delete', o => o.filter.not.type === 'note' && o.filter.type === 'task');
// complete / reopen / move / pin
T('خلص كل مهام النهارده', 'complete', and(F('status', 'open'), o => o.filter.due === 'date:2026-11-18'));
T('خلصت كل المهام المتاخره', 'complete', F('due', 'overdue'));
T('علم جميع المهام كمنتهيه', 'complete', F('status', 'open'));
T('رجع كل المهام المنتهيه', 'reopen', F('status', 'done'));
T('افتح تاني كل المهام الخلصانه', 'reopen', F('status', 'done'));
T('اجل كل مهام النهارده لبكره', 'move', o => o.filter.due === 'date:2026-11-18' && o.set.date === '2026-11-19');
T('اجل كل المهام المتاخره ليوم الخميس', 'move', o => o.filter.due === 'overdue' && o.set.date === '2026-11-19' || o.set.date === '2026-11-19');
T('ثبت كل المهام العاجله', 'pin', F('prio', 'high'));
// lists / counts
['بقائمة المهام والملاحظات', 'قائمة المهام والملاحظات', 'اعرض لي قايمة المهام والملاحظات', 'عايز اشوف قايمه المهام والملاحظات', 'وريني المهام والملاحظات'].forEach(p => T(p, 'list', F('type', 'both')));
['اعرض المهام المتاخره', 'وريني المهام المتأخرة', 'قولي المهام المتاخره'].forEach(p => T(p, 'list', F('due', 'overdue')));
T('كام مهمه متاخره', 'count', F('due', 'overdue'));
T('عدد المهام المنتهيه', 'count', F('status', 'done'));
T('كام ملاحظه عندي', 'count', F('type', 'note'));
T('اعرض المهام المثبته', 'list', F('pinned', true));
T('اعرض المهام العاجله', 'list', F('prio', 'high'));
T('مهام الاسبوع ده', 'list', F('due', 'week'));
T('اترك مهام غدا', 'list', F('due', 'date:2026-11-19'));
T('قائمة الملاحظات', 'list', F('type', 'note'));
T('المهام المتاخره', 'list', F('due', 'overdue'));
// summary, projects, clients
['ملخص اليوم', 'اعمل ملخص', 'ايه الجديد', 'عندي ايه ورايا'].forEach(p => { const x = plan(p); ok(p, x && x.ops[0].op === 'summary', x); });
{ const x = plan('ايه مشاريعي'); ok('projects list', x && x.ops[0].op === 'projects'); }
{ const x = plan('كام مشروع عندي'); ok('projects count', x && x.ops[0].op === 'projects' && x.ops[0].act === 'count', x); }
{ const x = plan('مين العملاء'); ok('clients list', x && x.ops[0].op === 'clients'); }
// one-item edits & multi add
T('غير اسم مهمة المونتاج الي مونتاج رمضان', 'rename', o => o.query === 'المونتاج' && o.value === 'مونتاج رمضان');
T('خلي مهمة المونتاج عاجله', 'priority', o => o.value === 'urgent');
T('ثبت مهمة الاجتماع', 'pin', o => o.query === 'الاجتماع');
T('احذف مهمة فاتورة العميل', 'delete', o => o.op === 'one' && /فاتوره العميل/.test(o.query));
{ const x = plan('ضيف مهام تصميم لوجو، مونتاج فيديو، ارسال الفاتورة'); ok('multi add 3', x && x.ops.length === 3 && x.ops[2].task.title === 'ارسال الفاتورة', x); }
{ const x = plan('ضيف ملاحظات فكرة، فكرة تانيه'); ok('multi add notes', x && x.ops.length === 2 && x.ops[0].task.type === 'note', x); }
// MUST NOT be hijacked (the single-item rules / navigation own these)
['افتح المهام', 'افتح مشروع الرحاب', 'خلصت تصميم بوستر', 'ضيف مهمة تصميم بوستر بكرة الساعة 3', 'احذف مهمة الاجتماع', 'اجل مهمة المونتاج ليوم الخميس', 'ايه مهامي النهارده', 'سجل دفعه 500 من الرحاب', 'فعل الوضع الليلي', 'افتح الملاحظات', 'اعرض المهام'].forEach(p => {
  const x = S.pre(p, { now }); ok('not hijacked: ' + p, !x || x.ops[0].op === 'one', x && x.ops);
});
// nothing sensible -> null (so AI / suggestions take over), and never a destructive plan
['رتبلي الدنيا كلها', 'هاتلي قهوه', 'احذف', 'مرحبا'].forEach(p => { const x = plan(p); ok('no plan: ' + p, !x || !x.ops.some(o => o.op === 'tasks' && o.act === 'delete'), x); });
// match() semantics
{ const k = n => { const d = new Date(now); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const tasks = [{ id: 'a', title: 'اجتماع', due: k(0) + 'T10:00' }, { id: 'b', title: 'مونتاج', due: k(-1) + 'T09:00' }, { id: 'c', title: 'فاتورة' }, { id: 'd', title: 'قديمة', status: 'done', due: k(-5) + 'T10:00' }, { id: 'n', title: 'فكرة', type: 'note' }, { id: 'r', title: 'روتين', routine: true, due: k(0) + 'T08:00' }];
  const m = f => S.match(tasks, f, { now }).map(x => x.id).join('');
  ok('match scheduled', m({ type: 'task', status: 'any', due: 'has' }) === 'abd');
  ok('match overdue = past due and not done (today 10:00 counts at 14:00)', m({ type: 'task', status: 'open', due: 'overdue' }) === 'ab');
  ok('match never touches routine tasks', !m({ type: 'both', status: 'any', due: '' }).includes('r'));
  ok('match not-clause', m({ type: 'task', status: 'any', due: '', not: { type: 'task', status: 'done', due: '' } }) === 'abc');
  ok('match notes', m({ type: 'note', status: 'any', due: '' }) === 'n');
  ok('match text', m({ type: 'both', status: 'any', due: '', text: 'مونتاج' }) === 'b');
  ok('match ids', m({ type: 'both', status: 'any', due: '', ids: ['c'] }) === 'c'); }
// suggestions
ok('suggest returns examples', S.suggest('احذف الحاجات القديمه').length > 0 && S.suggest('xyz').length >= 0);
console.log(pass + '/' + (pass + fail) + ' passed'); process.exit(fail ? 1 : 0);
