/* Home screen: four big tiles (2 × 2) with 3D illustrations */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$;
const t = (k, v) => MSA.t(k, v);
Object.assign(MSA.dict.en, {
  'home.hi': 'Hello, {n}', 'home.sub': 'Pick a section to start working', 'home.back': 'Home',
  'home.t.active': 'Follow your campaign plan step by step', 'home.t.done': 'Your finished work, ready to present',
  'home.t.learn': 'Videos and courses organised in folders', 'home.t.tasks': 'Tasks, deadlines and notes', 'home.t.media': 'Music that keeps playing and an in-app video player', 'home.t.reports': 'Statistics, charts and your finished work',
  'home.c.active': '{n} in progress', 'home.c.done': '{n} completed', 'home.c.learn': '{n} videos', 'home.c.tasks': '{n} open', 'home.c.media': '{n} tracks', 'home.c.reports': '{n} finished'
});
Object.assign(MSA.dict.ar, {
  'home.hi': 'أهلاً يا {n}', 'home.sub': 'اختر القسم اللي هتشتغل فيه', 'home.back': 'الرئيسية',
  'home.t.active': 'امشِ على خطة الكامبين خطوة بخطوة', 'home.t.done': 'شغلك المنتهي جاهز للعرض',
  'home.t.learn': 'فيديوهات وكورسات مرتبة في مجلدات', 'home.t.tasks': 'مهام ومواعيد وملاحظات', 'home.t.media': 'موسيقى تفضل شغالة ومشغّل فيديو جوه التطبيق', 'home.t.reports': 'إحصائيات ورسوم بيانية وشغلك المنتهي',
  'home.c.active': '{n} قيد التنفيذ', 'home.c.done': '{n} مكتمل', 'home.c.learn': '{n} فيديو', 'home.c.tasks': '{n} مفتوحة', 'home.c.media': '{n} أغنية', 'home.c.reports': '{n} منتهي'
});
const TILES = [['active', '#5b8def'], ['done', '#f0b43c'], ['learn', '#9b6bff'], ['tasks', '#3ccf91'], ['media', '#ff6b9a'], ['reports', '#18b4c8']];
function counts(){
  const s = MSA.state, P = MSA.proj;
  return { active: P.activeList().length, done: P.doneList().length, learn: s.learning.videos.length, tasks: s.tasks.filter(x => x.type === 'task' && x.status !== 'done').length, media: ((s.media && s.media.tracks) || []).length, reports: P.doneList().length };
}
function render(host){
  const c = counts(), first = MSA.myName();
  host.innerHTML = '<div class="home"><div class="home-head"><h1>' + U.esc(t('home.hi', { n: first })) + '</h1><div class="sub">' + U.esc(t('home.sub')) + '</div></div>' +
    '<div class="home-grid">' + TILES.map(([k, col], i) =>
      '<button class="hometile" data-go="' + k + '" style="--c:' + col + ';--i:' + i + '">' +
        '<span class="ht-art">' + MSA.art[k]() + '</span>' +
        '<span class="ht-txt"><span class="ht-title">' + U.esc(t('nav.' + k)) + '</span><span class="ht-sub">' + U.esc(t('home.t.' + k)) + '</span></span>' +
        '<span class="ht-count">' + U.esc(t('home.c.' + k, { n: c[k] })) + '</span>' +
      '</button>').join('') + '</div></div>';
  host.querySelectorAll('[data-go]').forEach(b => b.onclick = () => MSA.go(b.dataset.go));
}
MSA.views.home = { render };
/* back-to-home button in the top bar whenever we are inside a section */
const go = MSA.go;
MSA.go = function(name){
  go(name);
  const b = $('#btnHome'); if (b) { b.hidden = name === 'home'; b.innerHTML = I('home', 'sm') + '<span class="hb-l">' + U.esc(t('home.back')) + '</span>'; }
};
})();

