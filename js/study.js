/* Study helpers shared by Learning (videos) and References: notes icon, "studied" check, studied-before message.
   Favourites (star) already exist on both lists and are reused as they are. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, T = (a, e) => MSA.T(a, e), esc = U.esc;
const study = MSA.study = {};
study.noteBtn = (o, act) => '<button class="icon-btn sm note-btn ' + (o.note ? 'on' : '') + '" data-act="' + act + '" data-fid="' + esc(o.id) + '" title="' + esc(T('ملاحظات', 'Notes')) + '" aria-label="' + esc(T('ملاحظات', 'Notes')) + '">' + I('note', 'sm') + '</button>';
study.doneBtn = (o, act) => '<button class="icon-btn sm done-btn ' + (o.done ? 'on' : '') + '" data-act="' + act + '" data-fid="' + esc(o.id) + '" title="' + esc(T(o.done ? 'تم – اضغط للإلغاء' : 'علّم كمُنتهي', o.done ? 'Done – click to undo' : 'Mark as finished')) + '" aria-pressed="' + !!o.done + '">' + I('check-c', 'sm') + '</button>';
study.badge = o => o.done ? '<span class="pill ok" style="margin-top:4px">' + I('check-c', 'sm') + esc(T('تمت دراستها', 'Studied')) + '</span>' : '';
study.toggleDone = o => { o.done = !o.done; if (o.done) o.doneAt = Date.now(); else delete o.doneAt; if (!o.done) delete o.done; MSA.save(); MSA.toast(o.done ? T('اتعلّمت كمُنتهية ✔', 'Marked as finished ✔') : T('اتشال علامة الانتهاء', 'Finished mark removed'), 'ok'); };
/* shown when an already-finished item is opened again */
study.seen = (o, word, title) => {
  if (!o || !o.done) return false;
  const when = o.doneAt ? ' — ' + MSA.fmtDate(o.doneAt) : '';
  MSA.toast(T('تم دراسة هذا (' + word + ') من قبل: «' + title + '»' + when, 'You already studied this (' + word + '): “' + title + '”' + when), 'info', 6500);
  return true;
};
study.notes = (o, title, after) => {
  MSA.modal({ title: T('ملاحظات: ', 'Notes: ') + title, size: 'wide', footer: false,
    body: '<div class="field" style="margin:0"><textarea id="stNote" dir="auto" style="min-height:200px" placeholder="' + esc(T('اكتب ملاحظاتك عن المصدر ده…', 'Write your notes about this resource…')) + '">' + esc(o.note || '') + '</textarea></div>' +
      '<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn primary" id="stOk">' + I('check', 'sm') + esc(T('تم', 'Done')) + '</button></div>',
    onMount: (el, api) => { const ta = $('#stNote', el); ta.addEventListener('input', () => { o.note = ta.value; if (!o.note.trim()) delete o.note; MSA.save(); }); $('#stOk', el).onclick = () => api.close(); setTimeout(() => ta.focus(), 40); },
    onClose: () => { if (after) after(); } });
};
})();
