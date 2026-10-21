/* Connectors: smart search links (Behance, Pinterest, …), live services (Iconify, Google Fonts) */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const S = () => MSA.state;
const lang = () => (S().settings.lang === 'en' ? 'en' : 'ar');
const T = (ar, en) => (lang() === 'en' ? en : ar);
MSA.T = T;

const LINKS = [
  { id: 'behance', name: 'Behance', c: '#1769ff', sc: ['idea', 'mood', 'logo', 'main', 'static', 'motion', 'templates', 'printing', 'mockups', 'identity'], url: q => 'https://www.behance.net/search/projects?search=' + q },
  { id: 'pinterest', name: 'Pinterest', c: '#e60023', sc: ['*'], url: q => 'https://www.pinterest.com/search/pins/?q=' + q },
  { id: 'dribbble', name: 'Dribbble', c: '#ea4c89', sc: ['logo', 'main', 'static', 'icons', 'templates', 'motion'], url: q => 'https://dribbble.com/search/' + q },
  { id: 'unsplash', name: 'Unsplash', c: '#111111', sc: ['mood', 'imagestyle', 'main'], url: q => 'https://unsplash.com/s/photos/' + q.replace(/%20/g, '-') },
  { id: 'pexels', name: 'Pexels', c: '#05a081', sc: ['mood', 'imagestyle', 'main'], url: q => 'https://www.pexels.com/search/' + q + '/' },
  { id: 'colorhunt', name: 'Color Hunt', c: '#f08a5d', sc: ['colors'], url: (q, x) => 'https://colorhunt.co/palettes/' + (x && x.tag || 'popular') },
  { id: 'coolors', name: 'Coolors', c: '#0066ff', sc: ['colors'], url: () => 'https://coolors.co/palettes/trending' },
  { id: 'gfonts', name: 'Google Fonts', c: '#4285f4', sc: ['fonts'], url: q => 'https://fonts.google.com/?query=' + q },
  { id: 'adobefonts', name: 'Adobe Fonts', c: '#fa0f00', sc: ['fonts', 'logo'], url: () => 'https://fonts.adobe.com/' },
  { id: 'flaticon', name: 'Flaticon', c: '#0aa5f5', sc: ['icons'], url: q => 'https://www.flaticon.com/search?word=' + q },
  { id: 'noun', name: 'The Noun Project', c: '#1d1d1d', sc: ['icons'], url: q => 'https://thenounproject.com/search/icons/?q=' + q },
  { id: 'freepik', name: 'Freepik', c: '#1273eb', sc: ['icons', 'imagestyle', 'templates', 'mockups', 'main'], url: q => 'https://www.freepik.com/search?query=' + q },
  { id: 'canva', name: 'Canva', c: '#00c4cc', sc: ['templates', 'static', 'main'], url: q => 'https://www.canva.com/templates/?query=' + q },
  { id: 'youtube', name: 'YouTube', c: '#ff0000', sc: ['*'], url: q => 'https://www.youtube.com/results?search_query=' + q + '%20tutorial' }
];
function st(){
  const s = S(); if (!s.connectors) s.connectors = { off: {}, custom: [], live: true };
  const c = s.connectors; c.off = c.off || {}; c.custom = c.custom || []; if (c.live == null) c.live = true; delete c.claude;
  return c;
}
const has = (x, scope) => x.sc.includes('*') || x.sc.includes(scope);
const conn = MSA.conn = {
  state: st,
  all: LINKS,
  live: () => st().live !== false,
  /* enabled connector links for a step scope + search text */
  links(scope, text, ctx){
    const q = encodeURIComponent(text || '');
    const out = LINKS.filter(x => !st().off[x.id] && has(x, scope)).map(x => ({ id: x.id, name: x.name, c: x.c, url: x.url(q, ctx) }));
    st().custom.forEach(x => out.push({ id: x.id, name: x.name, c: '#8a8a86', url: x.url.includes('{q}') ? x.url.replace('{q}', q) : x.url }));
    return out;
  },
  chipsHTML(scope, text, ctx){
    return conn.links(scope, text, ctx).map(l => '<button class="cchip" data-open="' + U.esc(l.url) + '" style="--c:' + l.c + '">' + MSA.conn.logo(l) + U.esc(l.name) + I('external', 'xs') + '</button>').join('');
  }
};

/* ---------- brand badges: coloured tile + glyph; the site's real favicon loads over it when online ---------- */
const GL = { behance: 'Bē', pinterest: 'P', dribbble: '◉', unsplash: 'U', pexels: 'Px', colorhunt: 'CH', coolors: 'Co', gfonts: 'Aa', adobefonts: 'Af', flaticon: 'Fi', noun: 'N', freepik: 'Fr', canva: 'Ca', youtube: '▶' };
const DOM = { behance: 'behance.net', pinterest: 'pinterest.com', dribbble: 'dribbble.com', unsplash: 'unsplash.com', pexels: 'pexels.com', colorhunt: 'colorhunt.co', coolors: 'coolors.co', gfonts: 'fonts.google.com', adobefonts: 'fonts.adobe.com', flaticon: 'flaticon.com', noun: 'thenounproject.com', freepik: 'freepik.com', canva: 'canva.com', youtube: 'youtube.com' };
MSA.conn.logo = function(x){
  let dom = DOM[x.id]; if (!dom && x.url) { try { dom = new URL(x.url.replace('{q}', 'x')).hostname; } catch (e) {} }
  const col = x.c || '#8a8a86', gl = GL[x.id] || (x.name || '?').trim().charAt(0).toUpperCase();
  return '<span class="clogo" style="--c:' + col + '"><b>' + U.esc(gl) + '</b>' + (dom && MSA.conn.live() ? '<img alt="" loading="lazy" src="https://www.google.com/s2/favicons?domain=' + U.esc(dom) + '&sz=64" onerror="this.remove()" onload="if(this.naturalWidth<16)this.remove()">' : '') + '</span>';
};
/* any element with data-open opens its URL in the real browser */
document.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) { e.preventDefault(); MSA.openLink(b.dataset.open); } });

/* ---------- Settings section ---------- */
MSA.connHTML = function(){
  const c = st();
  const row = x => '<label class="conn-row">' + MSA.conn.logo(x) + '<span class="grow"><b>' + U.esc(x.name) + '</b><span class="hint">' + U.esc(x.sc.includes('*') ? T('كل الخطوات', 'All steps') : x.sc.map(k => T(({ idea: 'الفكرة', mood: 'المود بورد', logo: 'اللوجو', main: 'التصميم الرئيسي', static: 'ثابتة', motion: 'موشن', templates: 'القوالب', printing: 'طباعة', mockups: 'موك أب', identity: 'الهوية', colors: 'الألوان', fonts: 'الخطوط', icons: 'الأيقونات', imagestyle: 'أسلوب الصور' })[k] || k, k)).join(' · ')) + '</span></span>' +
    '<input type="checkbox" class="cb" data-conn="' + x.id + '" ' + (c.off[x.id] ? '' : 'checked') + '></label>';
  return '<div class="sec" id="connSec"><h4>' + I('link', 'sm') + U.esc(T('الموصّلات', 'Connectors')) + '</h4>' +
    '<div class="hint" style="margin-bottom:10px">' + U.esc(T('هذه المواقع تظهر كاختصارات بحث اختيارية تفتح في المتصفح. أما البحث الأساسي فيتم داخل البرنامج من «مستكشف الهوية» (زر ابحث داخل البرنامج في كل خطوة).', 'These sites are optional search shortcuts that open in the browser. The main search happens inside the app, in the Identity explorer (the “Search in the app” button on every step).')) + '</div>' +
    '<div class="conn-list">' + LINKS.map(row).join('') + '</div>' + (MSA.exploreSettingsHTML ? MSA.exploreSettingsHTML() : '') +
    (c.custom.length ? '<div class="conn-list" style="margin-top:8px">' + c.custom.map(x => '<div class="conn-row">' + MSA.conn.logo({ id: x.id, name: x.name, url: x.url }) + '<span class="grow"><b>' + U.esc(x.name) + '</b><span class="hint" dir="ltr">' + U.esc(x.url) + '</span></span><button class="icon-btn sm danger" data-conn-del="' + x.id + '" aria-label="' + U.esc(T('حذف', 'Delete')) + '">' + I('trash', 'sm') + '</button></div>').join('') + '</div>' : '') +
    '<div class="subsec" style="margin-top:10px"><div class="f-title">' + I('plus', 'sm') + U.esc(T('موصّل خاص بك', 'Your own connector')) + '</div>' +
      '<div class="field"><label class="f">' + U.esc(T('الاسم', 'Name')) + '</label><input type="text" id="cnName" placeholder="Awwwards"></div>' +
      '<div class="field"><label class="f">' + U.esc(T('رابط البحث (استخدم {q} مكان كلمة البحث)', 'Search URL (use {q} where the search word goes)')) + '</label><input type="text" id="cnUrl" dir="ltr" placeholder="https://www.awwwards.com/search/?text={q}"></div>' +
      '<button class="btn sm" id="cnAdd">' + I('plus', 'sm') + U.esc(T('إضافة', 'Add')) + '</button></div>' +
    '<label class="row" style="margin:12px 0 4px;cursor:pointer"><input type="checkbox" class="cb" id="cnLive" ' + (c.live !== false ? 'checked' : '') + '><span>' + U.esc(T('خدمات مباشرة: بحث أيقونات حي (Iconify) ومعاينة الخطوط (Google Fonts)', 'Live services: live icon search (Iconify) and font previews (Google Fonts)')) + '</span></label>' +
    '<div class="hint">' + U.esc(T('عند التفعيل تتصل الأداة بهذه الخدمات لجلب الأيقونات والخطوط فقط (كلمات البحث، بدون صورك أو ملفاتك).', 'When on, the app contacts these services only to fetch icons and fonts (search words only — never your images or files).')) + '</div>';
};
MSA.wireConn = function(root, redraw){
  const box = $('#connSec', root); if (!box) return; const c = st();
  if (MSA.wireExploreSettings) MSA.wireExploreSettings(box);
  $$('[data-conn]', box).forEach(i => i.onchange = () => { if (i.checked) delete c.off[i.dataset.conn]; else c.off[i.dataset.conn] = true; MSA.save(); });
  $$('[data-conn-del]', box).forEach(b => b.onclick = () => { c.custom = c.custom.filter(x => x.id !== b.dataset.connDel); MSA.save(); redraw(); });
  $('#cnAdd', box).onclick = () => {
    const n = $('#cnName', box).value.trim(); let u = $('#cnUrl', box).value.trim(); if (!n || !u) return;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u; c.custom.push({ id: U.uid('c'), name: n, url: u }); MSA.save(); redraw();
  };
  $('#cnLive', box).onchange = e => { c.live = e.target.checked; MSA.save(); };
};
})();

