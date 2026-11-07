/* "Sites used" — the second tab of the programs picker. A catalogue of visual-identity websites with their real logos,
   plus "add a site from its link": the app fills in the name and the logo by itself.
   Logos are the sites' own icons, fetched live (so they stay current) and shown with a letter fallback when offline. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc;

/* id, name, home page, category, brand colour (only used for the letter fallback) */
const CATS = [['insp', 'إلهام ومشاريع', 'Inspiration'], ['photo', 'صور وفيديو', 'Photos & video'], ['color', 'ألوان', 'Colours'], ['font', 'خطوط', 'Fonts'], ['icon', 'أيقونات وجرافيك', 'Icons & graphics'], ['mock', 'موكاب وقوالب', 'Mockups & templates'], ['brand', 'دلائل هوية وتريندات', 'Brand guides & trends'], ['ai', 'ذكاء اصطناعي', 'AI tools']];
const BUILT = [
  ['behance', 'Behance', 'https://www.behance.net/', 'insp', '#1769ff'], ['dribbble', 'Dribbble', 'https://dribbble.com/', 'insp', '#ea4c89'],
  ['pinterest', 'Pinterest', 'https://www.pinterest.com/', 'insp', '#e60023'], ['awwwards', 'Awwwards', 'https://www.awwwards.com/', 'insp', '#222222'],
  ['mobbin', 'Mobbin', 'https://mobbin.com/', 'insp', '#111111'], ['savee', 'Savee', 'https://savee.it/', 'insp', '#111111'],
  ['unsplash', 'Unsplash', 'https://unsplash.com/', 'photo', '#111111'], ['pexels', 'Pexels', 'https://www.pexels.com/', 'photo', '#05a081'],
  ['pixabay', 'Pixabay', 'https://pixabay.com/', 'photo', '#2ec66d'], ['youtube', 'YouTube', 'https://www.youtube.com/', 'photo', '#ff0000'],
  ['envato', 'Envato Elements', 'https://elements.envato.com/', 'photo', '#82b541'], ['storyblocks', 'Storyblocks', 'https://www.storyblocks.com/', 'photo', '#ff6a3d'],
  ['coolors', 'Coolors', 'https://coolors.co/', 'color', '#0066ff'], ['colorhunt', 'Color Hunt', 'https://colorhunt.co/', 'color', '#f08a5d'],
  ['adobecolor', 'Adobe Color', 'https://color.adobe.com/', 'color', '#fa0f00'], ['pantone', 'Pantone', 'https://www.pantone.com/', 'color', '#1a1a1a'],
  ['gfonts', 'Google Fonts', 'https://fonts.google.com/', 'font', '#4285f4'], ['adobefonts', 'Adobe Fonts', 'https://fonts.adobe.com/', 'font', '#fa0f00'],
  ['fontshare', 'Fontshare', 'https://www.fontshare.com/', 'font', '#111111'], ['dafont', 'DaFont', 'https://www.dafont.com/', 'font', '#3b6ea5'],
  ['whatfont', 'MyFonts WhatTheFont', 'https://www.myfonts.com/pages/whatthefont', 'font', '#e5322d'],
  ['flaticon', 'Flaticon', 'https://www.flaticon.com/', 'icon', '#0aa5f5'], ['noun', 'The Noun Project', 'https://thenounproject.com/', 'icon', '#1d1d1d'],
  ['freepik', 'Freepik', 'https://www.freepik.com/', 'icon', '#1273eb'], ['iconscout', 'IconScout', 'https://iconscout.com/', 'icon', '#1e6cff'],
  ['icons8', 'Icons8', 'https://icons8.com/', 'icon', '#1fb141'], ['lottiefiles', 'LottieFiles', 'https://lottiefiles.com/', 'icon', '#00ddb3'],
  ['canva', 'Canva', 'https://www.canva.com/', 'mock', '#00c4cc'], ['figmacom', 'Figma Community', 'https://www.figma.com/community', 'mock', '#f24e1e'],
  ['mockupworld', 'Mockup World', 'https://www.mockupworld.co/', 'mock', '#222222'], ['graphicburger', 'GraphicBurger', 'https://graphicburger.com/', 'mock', '#f37021'],
  ['brandnew', 'Brand New', 'https://www.underconsideration.com/brandnew/', 'brand', '#d5232a'], ['logolounge', 'LogoLounge', 'https://www.logolounge.com/', 'brand', '#222222'],
  ['brandsoftheworld', 'Brands of the World', 'https://www.brandsoftheworld.com/', 'brand', '#2d8cff'], ['pinterest-trends', 'Pinterest Trends', 'https://trends.pinterest.com/', 'brand', '#e60023'],
  ['midjourney', 'Midjourney', 'https://www.midjourney.com/', 'ai', '#111111'], ['firefly', 'Adobe Firefly', 'https://firefly.adobe.com/', 'ai', '#fa0f00']
];

/* what each site is known for — short, shown next to the site. "متنوع (...)" when it offers several kinds of material. */
const NOTES = {
  behance: ['متنوع (مشاريع هوية، لوجوهات، موشن، تصوير)', 'Mixed (identity projects, logos, motion, photography)'],
  dribbble: ['متنوع (UI/UX، لوجوهات، أيقونات، موشن)', 'Mixed (UI/UX, logos, icons, motion)'],
  pinterest: ['متنوع (مود بورد، ألوان، أفكار وإلهام)', 'Mixed (mood boards, colours, ideas & inspiration)'],
  awwwards: ['تصميم مواقع الويب (أفضل المواقع)', 'Web design (best websites)'],
  mobbin: ['واجهات تطبيقات (UI/UX)', 'App interfaces (UI/UX)'],
  savee: ['إلهام بصري ومراجع', 'Visual inspiration & references'],
  unsplash: ['صور فوتوغرافية مجانية', 'Free photography'],
  pexels: ['متنوع (صور وفيديو ستوك مجاني)', 'Mixed (free stock photos & video)'],
  pixabay: ['متنوع (صور، فيكتور، فيديو، موسيقى)', 'Mixed (photos, vectors, video, music)'],
  youtube: ['فيديوهات وشروحات', 'Videos & tutorials'],
  envato: ['متنوع (قوالب فيديو، موسيقى، خطوط، موكاب) — باشتراك', 'Mixed (video templates, music, fonts, mockups) — subscription'],
  storyblocks: ['فيديو ستوك وموسيقى (باشتراك)', 'Stock video & music (subscription)'],
  coolors: ['باليتات ألوان', 'Colour palettes'],
  colorhunt: ['باليتات ألوان جاهزة', 'Ready-made colour palettes'],
  adobecolor: ['عجلة ألوان وتناسق الألوان', 'Colour wheel & harmony'],
  pantone: ['ألوان معتمدة (Pantone) وألوان العام', 'Standard Pantone colours & Colour of the Year'],
  gfonts: ['خطوط مجانية (مفتوحة المصدر)', 'Free open-source fonts'],
  adobefonts: ['خطوط احترافية (مع اشتراك Adobe)', 'Professional fonts (with Adobe subscription)'],
  fontshare: ['خطوط مجانية بجودة عالية', 'High-quality free fonts'],
  dafont: ['خطوط مجانية (ديكورية ويدوية)', 'Free fonts (decorative & handwritten)'],
  whatfont: ['التعرف على الخط من صورة', 'Identify a font from an image'],
  flaticon: ['أيقونات', 'Icons'],
  noun: ['أيقونات', 'Icons'],
  freepik: ['متنوع (فيكتور، صور، أيقونات، قوالب، موكاب)', 'Mixed (vectors, photos, icons, templates, mockups)'],
  iconscout: ['متنوع (أيقونات، إيلوستريشن، Lottie، 3D)', 'Mixed (icons, illustrations, Lottie, 3D)'],
  icons8: ['متنوع (أيقونات، إيلوستريشن، صور)', 'Mixed (icons, illustrations, photos)'],
  lottiefiles: ['أنيميشن Lottie', 'Lottie animations'],
  canva: ['متنوع (قوالب، صور، فيديو، عناصر)', 'Mixed (templates, photos, video, elements)'],
  figmacom: ['ملفات Figma جاهزة (قوالب وواجهات وأيقونات)', 'Ready Figma files (templates, UI kits, icons)'],
  mockupworld: ['موكاب مجانية', 'Free mockups'],
  graphicburger: ['موكاب وموارد جرافيك مجانية', 'Free mockups & graphic resources'],
  brandnew: ['تحليل تغييرات الهويات واللوجوهات', 'Reviews of brand & logo redesigns'],
  logolounge: ['ترندات وإلهام اللوجوهات', 'Logo trends & inspiration'],
  brandsoftheworld: ['لوجوهات الماركات (فيكتور)', 'Brand logos (vector)'],
  'pinterest-trends': ['ترندات التصميم والبحث', 'Design & search trends'],
  midjourney: ['توليد صور بالذكاء الاصطناعي', 'AI image generation'],
  firefly: ['توليد صور وتأثيرات (Adobe)', 'AI images & effects (Adobe)']
};
const note = id => { const n = NOTES[id]; return n ? T(n[0], n[1]) : ''; };
const st = () => { const s = MSA.state; const a = s.sites = s.sites || {}; a.custom = a.custom || []; return a; };
const all = () => BUILT.map(b => ({ id: b[0], name: b[1], url: b[2], cat: b[3], color: b[4], built: true }))
  .concat(st().custom.map(c => ({ id: c.id, name: c.name, url: c.url, cat: 'mine', color: '#8a8a86', built: false, logo: c.logo })));
const get = id => all().find(x => x.id === id);
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const normUrl = v => { v = (v || '').trim(); if (!v) return null; if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+/, ''); try { const u = new URL(v); if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return null; return u.href; } catch (e) { return null; } };
const guessName = u => { const h = host(u).split('.'); const core = h.length > 2 && /^(co|com|org|net|gov|edu)$/.test(h[h.length - 2]) ? h[h.length - 3] : (h[h.length - 2] || h[0] || ''); return core ? core.charAt(0).toUpperCase() + core.slice(1) : ''; };
const fav = (u, sz) => 'https://www.google.com/s2/favicons?sz=' + (sz || 128) + '&domain=' + encodeURIComponent(host(u));

/* a site's tile: its own logo; letters if the logo cannot load (offline / no icon) */
function badge(id, size){
  const x = get(id); if (!x) return '';
  const sz = size || 24, letter = esc((x.name || '?').trim().charAt(0).toUpperCase());
  const online = !(MSA.conn && MSA.conn.live && !MSA.conn.live());
  return '<span class="appb sitel' + (online ? ' has' : '') + '" data-site="' + esc(id) + '" title="' + esc(x.name) + '" style="width:' + sz + 'px;height:' + sz + 'px;--ac:' + x.color + ';font-size:' + Math.round(sz * .46) + 'px">' +
    (online ? '<img alt="" loading="lazy" decoding="async" data-s1="' + esc(x.logo || '') + '" data-s2="' + esc(fav(x.url, sz > 40 ? 128 : 64)) + '" src="' + esc(x.logo || fav(x.url, sz > 40 ? 128 : 64)) + '">' : '') + '<b class="sl"' + (online ? ' hidden' : '') + '>' + letter + '</b></span>';
}
/* logo chain: stored logo -> site favicon -> letter. Wired once, for every tile, however it was rendered. */
document.addEventListener('error', e => {
  const im = e.target; if (!im || im.tagName !== 'IMG' || !im.closest || !im.closest('.sitel')) return;
  const w = im.closest('.sitel');
  if (im.dataset.s1 && im.src !== im.dataset.s2 && !im.dataset.tried) { im.dataset.tried = '1'; im.src = im.dataset.s2; return; }
  w.classList.remove('has'); im.remove(); const l = w.querySelector('.sl'); if (l) l.hidden = false;
}, true);
document.addEventListener('load', e => {  /* the favicon service answers with a tiny globe when it knows nothing: treat that as "no logo" */
  const im = e.target; if (!im || im.tagName !== 'IMG' || !im.closest || !im.closest('.sitel')) return;
  if (im.naturalWidth && im.naturalWidth < 16) { const w = im.closest('.sitel'); w.classList.remove('has'); im.remove(); const l = w.querySelector('.sl'); if (l) l.hidden = false; }
}, true);

const chips = (s, size) => (s.sites && s.sites.length ? s.sites.map(id => { const x = get(id); return x ? '<span class="sitec" data-url="' + esc(x.url) + '" title="' + esc(x.name) + '">' + badge(id, size) + '</span>' : ''; }).join('') : '');
/* tapping a site chip on a step opens that website */
document.addEventListener('click', e => {
  const c = e.target.closest && e.target.closest('.sitec[data-url]'); if (!c) return;
  e.stopPropagation(); e.preventDefault(); MSA.openLink(c.dataset.url);
}, true);

/* ---- fill in the data of a link: name + logo ---- */
async function lookup(url){
  const out = { name: guessName(url), logo: '' };
  const ctl = typeof AbortController === 'function' ? new AbortController() : null, tm = setTimeout(() => ctl && ctl.abort(), 8000);
  try {
    const r = await fetch('https://api.microlink.io/?url=' + encodeURIComponent(url), ctl ? { signal: ctl.signal } : undefined);
    if (r.ok) {
      const j = await r.json(), d = j && j.data;
      if (d) {
        const pub = (d.publisher || '').trim(), title = (d.title || '').trim();
        /* prefer the publisher / site name; fall back to the first part of the page title */
        const nm = pub || title.split(/\s[|\-–—·•:]\s/)[0].trim();
        if (nm && nm.length <= 40) out.name = nm;
        if (d.logo && d.logo.url) out.logo = d.logo.url;
      }
    }
  } catch (e) {} finally { clearTimeout(tm); }
  return out;
}

function addFromLink(done){
  let meta = null, url = null, tm = null, seq = 0;
  const m = MSA.modal({
    title: T('إضافة موقع من رابط', 'Add a site from a link'), size: '',
    body: '<div class="field"><label class="f">' + esc(T('رابط الموقع', 'Website link')) + '</label><input id="stUrl" type="text" dir="ltr" inputmode="url" autocomplete="off" placeholder="https://www.example.com"></div>' +
      '<div id="stPrev" class="st-prev" hidden></div>' +
      '<div class="field" id="stNameF" hidden><label class="f">' + esc(T('الاسم (اتملّى تلقائي — تقدر تعدّله)', 'Name (filled in automatically — you can edit it)')) + '</label><input id="stName" type="text" dir="auto"></div>',
    buttons: [{ label: T('إلغاء', 'Cancel'), cls: 'ghost', onClick: a => a.close() }, { label: T('إضافة', 'Add'), cls: 'primary', onClick: a => {
      if (!url) { $('#stUrl', a.el).focus(); return; }
      const nm = ($('#stName', a.el).value || '').trim() || guessName(url) || host(url);
      const dup = all().find(x => host(x.url) === host(url) && (x.url.replace(/\/$/, '') === url.replace(/\/$/, '') || x.built));
      const id = dup ? dup.id : U.uid('st');
      if (!dup) st().custom.push({ id, name: nm.slice(0, 40), url, logo: meta && meta.logo || '' });
      MSA.save(); a.close(); done && done(id);
    } }],
    onMount: el => {
      const inp = $('#stUrl', el), prev = $('#stPrev', el), nf = $('#stNameF', el), nm = $('#stName', el);
      setTimeout(() => inp.focus(), 40);
      const run = async () => {
        const u = normUrl(inp.value); url = u; meta = null; const my = ++seq;
        if (!u) { prev.hidden = true; nf.hidden = true; return; }
        prev.hidden = false; nf.hidden = false;
        prev.innerHTML = '<span class="hint">' + esc(T('جاري جلب اسم الموقع ولوجوه…', 'Looking up the site name and logo…')) + '</span>';
        nm.value = guessName(u);
        const r = await lookup(u); if (my !== seq) return;
        meta = r; if (!nm.dataset.edited || !nm.value) nm.value = r.name;
        const letter = esc((r.name || '?').charAt(0).toUpperCase());
        prev.innerHTML = '<span class="appb sitel has" style="width:44px;height:44px;--ac:#8a8a86"><img alt="" data-s1="' + esc(r.logo) + '" data-s2="' + esc(fav(u, 128)) + '" src="' + esc(r.logo || fav(u, 128)) + '"><b class="sl" hidden>' + letter + '</b></span><div class="grow"><b dir="auto">' + esc(r.name) + '</b><div class="hint" dir="ltr">' + esc(host(u)) + '</div></div>';
      };
      inp.oninput = () => { clearTimeout(tm); tm = setTimeout(run, 500); };
      inp.onpaste = () => setTimeout(() => { clearTimeout(tm); run(); }, 30);
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(tm); run().then(() => { const add = [...el.querySelectorAll('.mf .btn')].pop(); add && add.click(); }); } };
      nm.oninput = () => { nm.dataset.edited = '1'; };
    }
  });
}

/* the "Sites used" tab inside the programs picker */
function draw(body, step, redraw){
  step.sites = step.sites || [];
  const q = (body._q || '').trim().toLowerCase();
  const list = all().filter(x => !q || x.name.toLowerCase().includes(q) || host(x.url).includes(q));
  const tile = x => {
    const on = step.sites.includes(x.id);
    return '<div class="ap-tile' + (on ? ' on' : '') + '" data-sid="' + esc(x.id) + '" role="button" tabindex="0">' + badge(x.id, 44) + '<span class="ap-n" dir="auto">' + esc(x.name) + '</span>' + (note(x.id) ? '<span class="ap-note" dir="auto">' + esc(note(x.id)) + '</span>' : (x.built ? '' : '<span class="ap-note" dir="ltr">' + esc(host(x.url)) + '</span>')) +
      (on ? '<i class="ap-ck">' + I('check', 'sm') + '</i>' : '') +
      '<button class="icon-btn sm ap-ed" data-sopen="' + esc(x.id) + '" aria-label="open" title="' + esc(T('فتح الموقع', 'Open the site')) + '">' + I('external', 'sm') + '</button>' +
      (!x.built ? '<button class="icon-btn sm ap-del" data-sdel="' + esc(x.id) + '" aria-label="delete" title="' + esc(T('حذف الموقع', 'Delete the site')) + '">' + I('trash', 'sm') + '</button>' : '') + '</div>';
  };
  const groups = CATS.map(c => [T(c[1], c[2]), list.filter(x => x.cat === c[0])]).concat([[T('مواقعي', 'My sites'), list.filter(x => x.cat === 'mine')]]).filter(g => g[1].length);
  body.innerHTML = '<div class="row" style="gap:8px;margin-bottom:10px"><input id="stQ" type="search" class="grow" placeholder="' + esc(T('ابحث في المواقع…', 'Search sites…')) + '" value="' + esc(body._q || '') + '"><button class="btn primary sm" data-snew>' + I('plus', 'sm') + '<span>' + esc(T('إضافة موقع من رابط', 'Add from link')) + '</span></button></div>' +
    '<div class="hint" style="margin-bottom:10px">' + esc(T('اضغط على الموقع لإضافته للخلية أو إزالته. أيقونة السهم بتفتح الموقع. أي موقع تضيفه من رابط بيجيب البرنامج اسمه ولوجوه لوحده.', 'Tap a site to add or remove it on this cell. The arrow opens the site. A site you add from a link gets its name and logo automatically.')) + '</div>' +
    (groups.length ? groups.map(g => '<div class="ap-cat">' + esc(g[0]) + '</div><div class="ap-grid">' + g[1].map(tile).join('') + '</div>').join('') : '<div class="empty" style="padding:20px">' + esc(T('مفيش نتائج — جرّب «إضافة موقع من رابط».', 'No results — try “Add from link”.')) + '</div>');
  const qi = $('#stQ', body);
  qi.oninput = () => { body._q = qi.value; clearTimeout(body._qt); body._qt = setTimeout(() => { draw(body, step, redraw); const i = $('#stQ', body); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200); };
  $$('.ap-tile[data-sid]', body).forEach(t => t.onclick = e => {
    if (e.target.closest('[data-sopen],[data-sdel]')) return;
    const id = t.dataset.sid, i = step.sites.indexOf(id); if (i >= 0) step.sites.splice(i, 1); else step.sites.push(id);
    MSA.save(); draw(body, step, redraw);
  });
  $$('[data-sopen]', body).forEach(b => b.onclick = e => { e.stopPropagation(); const x = get(b.dataset.sopen); if (x) MSA.openLink(x.url); });
  $$('[data-sdel]', body).forEach(b => b.onclick = async e => {
    e.stopPropagation(); const x = get(b.dataset.sdel); if (!x) return;
    if (!await MSA.confirm(T('حذف «' + x.name + '» من كل الخلايا؟', 'Remove “' + x.name + '” from every cell?'), { danger: true, okLabel: T('حذف', 'Delete') })) return;
    st().custom = st().custom.filter(y => y.id !== x.id);
    MSA.state.projects.forEach(p => MSA.proj.walk(p.steps, s => { if (s.sites) s.sites = s.sites.filter(a => a !== x.id); }));
    MSA.save(); draw(body, step, redraw);
  });
  $('[data-snew]', body).onclick = () => addFromLink(id => { if (!step.sites.includes(id)) step.sites.push(id); MSA.save(); draw(body, step, redraw); });
}
MSA.sites = { note, all, get, badge, chips, draw, addFromLink, lookup, normUrl };
})();
