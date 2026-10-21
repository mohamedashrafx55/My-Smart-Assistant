/* Identity explorer: search images / palettes / icons / fonts INSIDE the app and pin results to the project's visual identity.
   Keyless sources work out of the box (Openverse, Wikimedia Commons, Art Institute of Chicago, Iconify, Google Fonts);
   Pexels / Unsplash / Pixabay appear when you paste your own free API key in Settings → Connectors. */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = MSA.T, esc = U.esc, conn = MSA.conn, P = MSA.proj;
const S = () => MSA.state;
const enc = encodeURIComponent;

/* ---------- helpers ---------- */
const hex2 = n => ('0' + Math.round(Math.max(0, Math.min(255, n))).toString(16)).slice(-2);
const rgbHex = (r, g, b) => '#' + hex2(r) + hex2(g) + hex2(b);
const toRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
function rgb2hsl(r, g, b){ r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
function hsl2hex(h, s, l){ h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return rgbHex(f(0) * 255, f(8) * 255, f(4) * 255); }
const ink = hex => { const [r, g, b] = toRgb(hex); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111' : '#fff'; };
const strip = h => String(h || '').replace(/<[^>]*>/g, '').trim();
async function fx(url, opt){
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 14000);
  try { const r = await fetch(url, Object.assign({ signal: ctl.signal }, opt || {})); if (!r.ok) throw new Error('http ' + r.status); return await r.json(); }
  finally { clearTimeout(to); }
}
const keys = () => { const c = conn.state(); c.keys = c.keys || {}; return c.keys; };

/* ---------- image sources ---------- */
const SRC = [
  { id: 'openverse', name: 'Openverse', c: '#c9a600', note: T('صور مفتوحة الترخيص من Flickr وغيرها', 'Openly licensed photos'),
    async get(q, pg){ const j = await fx('https://api.openverse.org/v1/images/?q=' + enc(q) + '&page_size=24&page=' + pg + '&mature=false');
      return (j.results || []).map(x => ({ id: 'ov' + x.id, thumb: x.thumbnail || x.url, full: x.url, title: x.title || '', credit: (x.creator || '') + (x.license ? ' · CC ' + String(x.license).toUpperCase() : ''), page: x.foreign_landing_url || x.url, src: 'Openverse' })); } },
  { id: 'commons', name: 'Wikimedia Commons', c: '#006699', note: T('صور وفنون وتصاميم تاريخية', 'Art, history and design images'),
    async get(q, pg){ const j = await fx('https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=24&gsroffset=' + ((pg - 1) * 24) + '&gsrsearch=' + enc(q + ' filetype:bitmap') + '&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=520');
      const pgs = (j.query && j.query.pages) ? Object.values(j.query.pages).sort((a, b) => (a.index || 0) - (b.index || 0)) : [];
      return pgs.filter(x => x.imageinfo && x.imageinfo[0]).map(x => { const ii = x.imageinfo[0], em = ii.extmetadata || {}; return { id: 'wc' + x.pageid, thumb: ii.thumburl || ii.url, full: ii.url, title: String(x.title || '').replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, ''), credit: strip(em.Artist && em.Artist.value) + (em.LicenseShortName ? ' · ' + strip(em.LicenseShortName.value) : ''), page: ii.descriptionurl, src: 'Wikimedia' }; }); } },
  { id: 'artic', name: 'Art Institute of Chicago', c: '#b0272d', note: T('لوحات وتصاميم ومنسوجات وفن زخرفي', 'Paintings, posters, textiles, decorative art'),
    async get(q, pg){ const j = await fx('https://api.artic.edu/api/v1/artworks/search?q=' + enc(q) + '&limit=24&page=' + pg + '&query[term][is_public_domain]=true&fields=id,title,image_id,artist_title,date_display');
      return (j.data || []).filter(x => x.image_id).map(x => ({ id: 'ai' + x.id, thumb: 'https://www.artic.edu/iiif/2/' + x.image_id + '/full/500,/0/default.jpg', full: 'https://www.artic.edu/iiif/2/' + x.image_id + '/full/1200,/0/default.jpg', title: x.title || '', credit: (x.artist_title || '') + (x.date_display ? ' · ' + x.date_display : ''), page: 'https://www.artic.edu/artworks/' + x.id, src: 'Art Institute' })); } },
  { id: 'cleveland', name: 'Cleveland Museum of Art', c: '#8a5a2b', note: T('ملصقات وتصاميم وطباعة — نطاق عام', 'Posters, prints, design — public domain'),
    async get(q, pg){ const j = await fx('https://openaccess-api.clevelandart.org/api/artworks/?q=' + enc(q) + '&has_image=1&cc0=1&limit=24&skip=' + ((pg - 1) * 24));
      return (j.data || []).filter(x => x.images && x.images.web).map(x => ({ id: 'cl' + x.id, thumb: x.images.web.url, full: (x.images.print || x.images.web).url, title: x.title || '', credit: ((x.creators && x.creators[0] && x.creators[0].description) || '') + (x.creation_date ? ' · ' + x.creation_date : ''), page: x.url || '', src: 'Cleveland' })); } },
  { id: 'met', name: 'The Met Museum', c: '#e4002b', note: T('ملايين الأعمال الفنية بدقة عالية', 'Millions of artworks in high resolution'),
    async get(q, pg){ const j = await fx('https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=' + enc(q)); const ids = (j.objectIDs || []).slice((pg - 1) * 16, pg * 16);
      const objs = await Promise.allSettled(ids.map(id => fx('https://collectionapi.metmuseum.org/public/collection/v1/objects/' + id)));
      return objs.filter(o => o.status === 'fulfilled' && o.value.primaryImageSmall).map(o => { const x = o.value; return { id: 'met' + x.objectID, thumb: x.primaryImageSmall, full: x.primaryImage || x.primaryImageSmall, title: x.title || '', credit: (x.artistDisplayName || '') + (x.objectDate ? ' · ' + x.objectDate : ''), page: x.objectURL || '', src: 'The Met' }; }); } },
  { id: 'harvard', name: 'Harvard Art Museums', c: '#a51c30', key: true, note: T('مجموعة فنية — تحتاج مفتاح مجاني', 'Art collection — free key needed'),
    async get(q, pg){ const j = await fx('https://api.harvardartmuseums.org/object?apikey=' + enc(keys().harvard) + '&q=' + enc(q) + '&hasimage=1&size=24&page=' + pg + '&fields=id,title,primaryimageurl,people,dated,url');
      return (j.records || []).filter(x => x.primaryimageurl).map(x => ({ id: 'hv' + x.id, thumb: x.primaryimageurl + '?height=420&width=420', full: x.primaryimageurl, title: x.title || '', credit: ((x.people && x.people[0] && x.people[0].name) || '') + (x.dated ? ' · ' + x.dated : ''), page: x.url || '', src: 'Harvard' })); } },
  { id: 'smithsonian', name: 'Smithsonian', c: '#1a5d8f', key: true, note: T('ملايين الصور المفتوحة — تحتاج مفتاح مجاني', 'Millions of open images — free key needed'),
    async get(q, pg){ const j = await fx('https://api.si.edu/openaccess/api/v1.0/search?q=' + enc(q + ' AND online_media_type:Images') + '&start=' + ((pg - 1) * 24) + '&rows=24&api_key=' + enc(keys().smithsonian));
      return ((j.response && j.response.rows) || []).map(r => { const c = r.content || {}, d = c.descriptiveNonRepeating || {}, m = d.online_media && d.online_media.media && d.online_media.media[0]; if (!m || !m.thumbnail) return null;
        return { id: 'si' + r.id, thumb: m.thumbnail, full: m.content || m.thumbnail, title: (d.title && d.title.content) || r.title || '', credit: d.unit_name || '', page: d.record_link || '', src: 'Smithsonian' }; }).filter(Boolean); } },
  { id: 'europeana', name: 'Europeana', c: '#0a72cc', key: true, note: T('تراث أوروبا الرقمي — يحتاج مفتاح مجاني', 'European cultural heritage — free key needed'),
    async get(q, pg){ const j = await fx('https://api.europeana.eu/record/v2/search.json?wskey=' + enc(keys().europeana) + '&query=' + enc(q) + '&media=true&thumbnail=true&reusability=open&rows=24&start=' + ((pg - 1) * 24 + 1));
      return (j.items || []).filter(x => x.edmPreview && x.edmPreview[0]).map(x => ({ id: 'eu' + x.id, thumb: x.edmPreview[0], full: (x.edmIsShownBy && x.edmIsShownBy[0]) || x.edmPreview[0], title: (x.title && x.title[0]) || '', credit: (x.dataProvider && x.dataProvider[0]) || '', page: (x.guid || ''), src: 'Europeana' })); } },
  { id: 'pexels', name: 'Pexels', c: '#05a081', key: true, note: T('صور احترافية — تحتاج مفتاح مجاني', 'Pro photos — free key needed'),
    async get(q, pg){ const j = await fx('https://api.pexels.com/v1/search?query=' + enc(q) + '&per_page=24&page=' + pg, { headers: { Authorization: keys().pexels } });
      return (j.photos || []).map(x => ({ id: 'px' + x.id, thumb: x.src.medium, full: x.src.large2x || x.src.large, title: x.alt || '', credit: x.photographer || '', page: x.url, src: 'Pexels' })); } },
  { id: 'unsplash', name: 'Unsplash', c: '#111', key: true, note: T('صور فوتوغرافية — تحتاج مفتاح مجاني', 'Photography — free key needed'),
    async get(q, pg){ const j = await fx('https://api.unsplash.com/search/photos?query=' + enc(q) + '&per_page=24&page=' + pg, { headers: { Authorization: 'Client-ID ' + keys().unsplash } });
      return (j.results || []).map(x => ({ id: 'us' + x.id, thumb: x.urls.small, full: x.urls.regular, title: x.alt_description || '', credit: x.user && x.user.name || '', page: x.links && x.links.html, src: 'Unsplash' })); } },
  { id: 'pixabay', name: 'Pixabay', c: '#2ec66d', key: true, note: T('صور وفيكتور — تحتاج مفتاح مجاني', 'Photos & vectors — free key needed'),
    async get(q, pg){ const j = await fx('https://pixabay.com/api/?key=' + enc(keys().pixabay) + '&q=' + enc(q) + '&per_page=24&page=' + pg + '&safesearch=true');
      return (j.hits || []).map(x => ({ id: 'pb' + x.id, thumb: x.webformatURL, full: x.largeImageURL || x.webformatURL, title: x.tags || '', credit: x.user || '', page: x.pageURL, src: 'Pixabay' })); } }
];
const srcOn = s => !conn.state().off[s.id] && (!s.key || (keys()[s.id] || '').trim());
const chosen = () => { const u = S().ui; let sel = u.exSrc; const av = SRC.filter(srcOn).map(s => s.id); sel = (sel || []).filter(x => av.includes(x)); if (!sel.length) sel = av.slice(0, 1); return sel; };

/* ---------- fonts (Google Fonts, previews load on demand) ---------- */
const FONTS = [
  ['Cairo', 1, 'sans'], ['Tajawal', 1, 'sans'], ['Almarai', 1, 'sans'], ['IBM Plex Sans Arabic', 1, 'sans'], ['Readex Pro', 1, 'sans'], ['Noto Kufi Arabic', 1, 'kufi'], ['Reem Kufi', 1, 'kufi'], ['Lemonada', 1, 'display'],
  ['Amiri', 1, 'naskh'], ['Noto Naskh Arabic', 1, 'naskh'], ['Scheherazade New', 1, 'naskh'], ['Lateef', 1, 'naskh'], ['Markazi Text', 1, 'serif'], ['El Messiri', 1, 'display'], ['Aref Ruqaa', 1, 'hand'],
  ['Harmattan', 1, 'sans'], ['Changa', 1, 'display'], ['Lalezar', 1, 'display'], ['Rakkas', 1, 'display'], ['Mada', 1, 'sans'], ['Katibeh', 1, 'hand'], ['Jomhuria', 1, 'display'], ['Baloo Bhaijaan 2', 1, 'display'], ['Mirza', 1, 'naskh'], ['Vibes', 1, 'hand'],
  ['Playfair Display', 0, 'serif'], ['Cormorant Garamond', 0, 'serif'], ['DM Serif Display', 0, 'serif'], ['Lora', 0, 'serif'], ['Libre Baskerville', 0, 'serif'], ['Cinzel', 0, 'serif'], ['Abril Fatface', 0, 'display'], ['Bodoni Moda', 0, 'serif'],
  ['Montserrat', 0, 'sans'], ['Poppins', 0, 'sans'], ['Inter', 0, 'sans'], ['Raleway', 0, 'sans'], ['Rubik', 0, 'sans'], ['Jost', 0, 'sans'], ['Work Sans', 0, 'sans'], ['DM Sans', 0, 'sans'],
  ['Bebas Neue', 0, 'display'], ['Oswald', 0, 'display'], ['Anton', 0, 'display'], ['Lobster', 0, 'hand'], ['Pacifico', 0, 'hand'], ['Great Vibes', 0, 'hand'], ['Dancing Script', 0, 'hand'], ['Caveat', 0, 'hand']
].map(a => ({ n: a[0], ar: !!a[1], k: a[2] }));
const FKIND = { sans: ['بدون زوائد', 'Sans'], serif: ['بزوائد', 'Serif'], display: ['عناوين', 'Display'], hand: ['يدوي', 'Script'], kufi: ['كوفي', 'Kufi'], naskh: ['نسخ', 'Naskh'] };
const loadedF = new Set();
function loadFonts(list){
  const need = list.filter(f => !loadedF.has(f)); if (!need.length || !conn.live()) return; need.forEach(f => loadedF.add(f));
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?' + need.map(f => 'family=' + enc(f).replace(/%20/g, '+')).join('&') + '&display=swap'; document.head.appendChild(l);
}

/* ---------- palette maths ---------- */
const HARM = {
  analogic: [['متجاورة', 'Analogous'], b => [-40, -20, 0, 20, 40].map(d => [b[0] + d, b[1], b[2]])],
  complementary: [['متكاملة', 'Complementary'], b => [[b[0], b[1], b[2]], [b[0], b[1] * .8, Math.min(.85, b[2] + .22)], [b[0] + 180, b[1], b[2]], [b[0] + 180, b[1] * .8, Math.max(.15, b[2] - .18)], [b[0], .08, .95]]],
  triad: [['ثلاثية', 'Triadic'], b => [0, 120, 240].flatMap((d, i) => i ? [[b[0] + d, b[1], b[2]]] : [[b[0], b[1], b[2]]]).concat([[b[0], .1, .94], [b[0], b[1], .18]])],
  split: [['متكاملة مجزأة', 'Split-complementary'], b => [[b[0], b[1], b[2]], [b[0] + 150, b[1], b[2]], [b[0] + 210, b[1], b[2]], [b[0], .1, .95], [b[0], b[1] * .9, .16]]],
  tetrad: [['رباعية', 'Tetradic'], b => [0, 90, 180, 270].map(d => [b[0] + d, b[1], b[2]]).concat([[b[0], .08, .95]])],
  mono: [['أحادية', 'Monochrome'], b => [.92, .75, b[2], .32, .16].map(l => [b[0], b[1], l])]
};
function palette(base, mode){ const [r, g, b] = toRgb(base), hsl = rgb2hsl(r, g, b); return HARM[mode][1](hsl).map(x => hsl2hex(x[0], x[1], x[2])); }
function imgPalette(img, n){
  const c = document.createElement('canvas'), w = 72, h = Math.max(1, Math.round(72 * (img.naturalHeight || 1) / (img.naturalWidth || 1))); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h); const d = g.getImageData(0, 0, w, h).data, bins = {};
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; const k = (d[i] >> 4) + ',' + (d[i + 1] >> 4) + ',' + (d[i + 2] >> 4); const b = bins[k] || (bins[k] = { r: 0, g: 0, b: 0, n: 0 }); b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; b.n++; }
  const arr = Object.values(bins).map(b => ({ r: b.r / b.n, g: b.g / b.n, b: b.b / b.n, n: b.n })).sort((a, b) => b.n - a.n), out = [];
  for (const c0 of arr) { if (out.every(o => Math.hypot(o.r - c0.r, o.g - c0.g, o.b - c0.b) > 48)) out.push(c0); if (out.length >= (n || 6)) break; }
  return out.map(o => rgbHex(o.r, o.g, o.b));
}

/* ---------- the explorer ---------- */
const cur = {};
function open(p, o){
  o = o || {};
  const ctx = (() => { try { return MSA.suggest && MSA.suggest.context(p); } catch (e) { return null; } })();
  const brand = (ctx && ctx.brand) || p.name || '';
  Object.assign(cur, { p, stepId: o.stepId || null, tab: o.tab || S().ui.exTab || 'images', q: o.q || (ctx ? brand : '') || '', page: 1, items: [], busy: false, errs: [], more: false, base: (p.identity && p.identity.colors[0]) || (ctx && ctx.roles && ctx.roles[0] && ctx.roles[0][1]) || '#c9a24b', mode: 'analogic', fq: '', fscope: 'all', fcat: 'all', fshow: 24, sample: brand || 'Aa أبجد', iconSet: '', icons: [], iconQ: '', ctx });
  if (o.tab === 'icons' || o.tab === 'fonts') cur.q = o.q || cur.q;
  const m = MSA.modal({ title: T('مستكشف الهوية البصرية', 'Visual identity explorer'), size: 'xl sgm exm', footer: false, body: '<div id="exRoot"></div>' });
  cur.m = m; const root = $('#exRoot', m.el); cur.root = root;
  draw();
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-ex-q]')) { e.preventDefault(); run(true); } });
  m.el.addEventListener('paste', onPaste);
  if (cur.tab === 'images' && cur.q) run(true); else if (cur.tab === 'icons') runIcons();
  const bg = $('.mb', m.el); if (bg) bg.style.overflow = 'auto';
}
const countId = p => { const i = p.identity; return i ? i.colors.length + i.fonts.length + i.icons.length + i.notes.length + (i.images || []).length : 0; };
function draw(){
  const { root, tab } = cur; if (!root || !document.body.contains(root)) return;
  const tabs = [['images', 'image', T('صور وإلهام', 'Images & inspiration')], ['colors', 'palette', T('ألوان', 'Colours')], ['icons', 'star', T('أيقونات', 'Icons')], ['fonts', 'heading', T('خطوط', 'Fonts')]];
  root.innerHTML = '<div class="ex-top"><div class="ex-tabs" role="tablist">' + tabs.map(x => '<button data-ex-tab="' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '">' + I(x[1], 'sm') + '<span>' + esc(x[2]) + '</span></button>').join('') + '</div>' +
    '<button class="btn sm" data-ex="identity">' + I('pin', 'sm') + '<span>' + esc(T('هويتي', 'My identity')) + '</span><b class="cnt" id="exCnt">' + countId(cur.p) + '</b></button></div>' +
    '<div class="ex-body" id="exBody"></div>';
  drawBody();
}
function drawBody(){
  const b = $('#exBody', cur.root); if (!b) return;
  ({ images: bodyImages, colors: bodyColors, icons: bodyIcons, fonts: bodyFonts })[cur.tab](b);
}
const upd = () => { const c = $('#exCnt', cur.root); if (c) c.textContent = countId(cur.p); };

/* ----- images ----- */
function bodyImages(b){
  const sel = chosen(), avail = SRC.filter(srcOn), locked = SRC.filter(s => s.key && !srcOn(s) && !conn.state().off[s.id]);
  b.innerHTML = '<div class="ex-search"><input type="text" dir="auto" data-ex-q value="' + esc(cur.q) + '" placeholder="' + esc(T('اكتب ما تبحث عنه: قهوة فاخرة، خط عربي، تغليف…', 'Search: luxury coffee, arabic calligraphy, packaging…')) + '"><button class="btn primary" data-ex="search">' + I('search', 'sm') + '<span>' + esc(T('بحث', 'Search')) + '</span></button></div>' +
    '<div class="ex-srcs">' + avail.map(s => '<button class="ex-src ' + (sel.includes(s.id) ? 'on' : '') + '" data-ex-src="' + s.id + '" style="--c:' + s.c + '" title="' + esc(s.note) + '"><i></i>' + esc(s.name) + '</button>').join('') +
      (locked.length ? '<span class="ex-lock">' + I('key', 'xs') + esc(T('أضف مفتاح ', 'Add a key for ')) + locked.map(s => s.name).join(' / ') + esc(T(' من الإعدادات ← الموصّلات', ' in Settings → Connectors')) + '</span>' : '') + '</div>' +
    '<div class="ex-tools"><div class="ex-url"><input type="text" dir="auto" data-ex-url placeholder="' + esc(T('الصق رابط صورة (من Pinterest أو Behance…) أو اضغط Ctrl+V للصق صورة منسوخة', 'Paste an image link (from Pinterest, Behance…) or press Ctrl+V to paste a copied image')) + '"><button class="btn sm" data-ex="addurl">' + I('plus', 'sm') + '<span>' + esc(T('إضافة', 'Add')) + '</span></button></div></div>' +
    '<div id="exRes"></div>';
  drawRes();
}
function drawRes(){
  const r = $('#exRes', cur.root); if (!r) return;
  let h = '';
  if (cur.errs.length) h += '<div class="ex-err">' + I('info', 'sm') + '<span>' + esc(cur.errs.join(' · ')) + '</span></div>';
  if (cur.busy && !cur.items.length) h += '<div class="ex-loading"><i></i><i></i><i></i></div>';
  else if (!cur.items.length) h += cur.searched ? MSA.empty('image', T('لا نتائج', 'No results'), T('جرّب كلمات أخرى أو فعّل مصدرًا آخر', 'Try other words or enable another source')) : '<div class="ex-hint">' + I('sparkles', 'sm') + '<span>' + esc(T('ابحث بكلمة، والنتائج تظهر هنا داخل البرنامج. اضغط 📌 لتثبيت الصورة في هويتك، أو احفظها في المرحلة الحالية.', 'Search a word and results appear right here. Pin an image to your identity or save it to the current step.')) + '</span></div>';
  else {
    h += '<div class="ex-grid">' + cur.items.map((x, i) => '<figure class="ex-card"><button class="ex-img" data-ex="view" data-i="' + i + '"><img loading="lazy" referrerpolicy="no-referrer" alt="' + esc(x.title) + '" src="' + esc(x.thumb) + '" onerror="this.closest(\'figure\').remove()"></button>' +
      '<figcaption><span class="ex-cr" dir="auto">' + esc(x.credit || x.title || x.src) + '</span><span class="ex-ac">' +
      '<button class="icon-btn sm" data-ex="pinimg" data-i="' + i + '" title="' + esc(T('تثبيت في هويتي', 'Pin to my identity')) + '">' + I('pin', 'sm') + '</button>' +
      '<button class="icon-btn sm" data-ex="pal" data-i="' + i + '" title="' + esc(T('استخراج الألوان', 'Extract colours')) + '">' + I('palette', 'sm') + '</button>' +
      '<button class="icon-btn sm" data-ex="save" data-i="' + i + '" title="' + esc(T('حفظ في المرحلة الحالية', 'Save to the current step')) + '">' + I('download', 'sm') + '</button></span></figcaption><span class="ex-badge">' + esc(x.src) + '</span></figure>').join('') + '</div>' +
      (cur.more ? '<div style="text-align:center;margin:14px 0"><button class="btn" data-ex="more">' + (cur.busy ? '…' : esc(T('عرض المزيد', 'Load more'))) + '</button></div>' : '');
  }
  r.innerHTML = h;
}
async function run(reset){
  const q = ($('[data-ex-q]', cur.root) || {}).value != null ? $('[data-ex-q]', cur.root).value.trim() : cur.q; if (!q) return; cur.q = q;
  if (reset) { cur.page = 1; cur.items = []; cur.errs = []; cur.searched = true; } else cur.page++;
  cur.busy = true; const tok = cur.tok = (cur.tok || 0) + 1; drawRes();
  const sel = SRC.filter(s => chosen().includes(s.id));
  const res = await Promise.allSettled(sel.map(s => s.get(q, cur.page)));
  if (tok !== cur.tok || !document.body.contains(cur.root)) return;
  const lists = []; cur.more = false;
  res.forEach((x, i) => { if (x.status === 'fulfilled') { lists.push(x.value); if (x.value.length >= 20) cur.more = true; } else cur.errs.push(sel[i].name + ': ' + (navigator.onLine === false ? T('لا يوجد إنترنت', 'offline') : T('تعذّر الاتصال', 'unreachable'))); });
  const seen = new Set(cur.items.map(x => x.id)), merged = [];
  for (let k = 0; lists.some(l => k < l.length); k++) lists.forEach(l => { if (l[k] && !seen.has(l[k].id)) { seen.add(l[k].id); merged.push(l[k]); } });
  cur.items = cur.items.concat(merged); cur.busy = false; drawRes();
}

/* ----- colours ----- */
function bodyColors(b){
  const base = cur.base, cx = cur.ctx;
  const pal = palette(base, cur.mode);
  const brief = cx ? [...new Set([...(cx.roles || []).map(r => r[1]), ...((cx.A && cx.A.cols) || []).slice(0, 6).map(c => c.hex)])].slice(0, 10) : [];
  const sw = (h, big) => '<div class="sw-card"><button class="sw-c" data-ex="copy" data-v="' + h + '" style="background:' + h + ';color:' + ink(h) + ';' + (big ? 'height:78px' : '') + '">' + h.toUpperCase() + '</button><button class="icon-btn sm" data-ex="pincol" data-v="' + h + '" title="' + esc(T('تثبيت في هويتي', 'Pin to my identity')) + '">' + I('pin', 'sm') + '</button></div>';
  b.innerHTML = '<div class="ex-cbar"><label class="ex-pick"><input type="color" data-ex-base value="' + base + '"><span>' + esc(T('اللون الأساسي', 'Base colour')) + '</span></label><input type="text" dir="ltr" data-ex-basetxt value="' + base.toUpperCase() + '" maxlength="7">' +
    '<button class="btn sm" data-ex="shuffle">' + I('repeat', 'sm') + '<span>' + esc(T('لون عشوائي ذكي', 'Smart random')) + '</span></button></div>' +
    '<div class="ex-modes">' + Object.keys(HARM).map(k => '<button class="pchip ' + (cur.mode === k ? 'on' : '') + '" data-ex-mode="' + k + '">' + esc(T(HARM[k][0][0], HARM[k][0][1])) + '</button>').join('') + '</div>' +
    '<div class="sw-row ex-pal">' + pal.map(h => sw(h, true)).join('') + '</div>' +
    '<div class="ex-actions"><button class="btn sm" data-ex="pinall">' + I('pin', 'sm') + '<span>' + esc(T('تثبيت اللوحة كاملة', 'Pin the whole palette')) + '</span></button></div>' +
    (brief.length ? '<h4 class="ex-h">' + esc(T('من البريف والصور المرجعية', 'From your brief & reference images')) + '</h4><div class="sw-row">' + brief.map(h => sw(h)).join('') + '</div>' : '') +
    '<div class="hint" style="margin-top:12px">' + esc(T('تُحسب الألوان هنا داخل البرنامج بدون إنترنت. ولاستخراج ألوان من أي صورة: من تبويب الصور اضغط أيقونة 🎨 على الصورة.', 'Colours are calculated here, offline. To pull colours from any image: in the Images tab tap the 🎨 icon on it.')) + '</div>';
  nameColors();
}

const cname = {};
async function nameColors(){
  if (!conn.live()) return; const cards = $$('.ex-pal .sw-card, .sw-row .sw-card', cur.root);
  for (const c of cards) {
    const b = $('[data-v]', c); if (!b || $('.sw-n', c)) continue; const h = b.dataset.v.replace('#', '').toLowerCase();
    try { if (!cname[h]) { const j = await fx('https://www.thecolorapi.com/id?hex=' + h); cname[h] = (j.name && j.name.value) || ''; } } catch (e) { return; }
    if (cname[h] && document.body.contains(c)) c.insertAdjacentHTML('beforeend', '<small class="sw-n" dir="ltr">' + esc(cname[h]) + '</small>');
  }
}

/* ----- icons ----- */
const SETS = [['', 'الكل', 'All'], ['lucide', 'Lucide', 'Lucide'], ['tabler', 'Tabler', 'Tabler'], ['ph', 'Phosphor', 'Phosphor'], ['solar', 'Solar', 'Solar'], ['mdi', 'Material', 'Material'], ['fluent', 'Fluent', 'Fluent'], ['ri', 'Remix', 'Remix'], ['simple-icons', 'شعارات ماركات', 'Brand logos'], ['logos', 'شعارات ملوّنة', 'Colour logos']];
function bodyIcons(b){
  b.innerHTML = '<div class="ex-search"><input type="text" dir="auto" data-ex-q value="' + esc(cur.iconQ || cur.q || '') + '" placeholder="' + esc(T('ابحث بالإنجليزية: coffee, cup, bean…', 'Search: coffee, cup, bean…')) + '"><select data-ex-set>' + SETS.map(s => '<option value="' + s[0] + '"' + (cur.iconSet === s[0] ? ' selected' : '') + '>' + esc(T(s[1], s[2])) + '</option>').join('') + '</select><button class="btn primary" data-ex="search">' + I('search', 'sm') + '<span>' + esc(T('بحث', 'Search')) + '</span></button></div>' +
    '<div id="exRes"></div>'; drawIcons();
}
function drawIcons(){
  const r = $('#exRes', cur.root); if (!r) return; const prim = ((cur.p.identity && cur.p.identity.colors[0]) || cur.base).replace('#', '');
  if (cur.busy) { r.innerHTML = '<div class="ex-loading"><i></i><i></i><i></i></div>'; return; }
  if (cur.ierr) { r.innerHTML = '<div class="ex-err">' + I('info', 'sm') + '<span>' + esc(cur.ierr) + '</span></div>'; return; }
  r.innerHTML = cur.icons.length ? '<div class="ic-grid ex-ic">' + cur.icons.map(id => { const [pf, nm] = id.split(':'); return '<button class="ic-card" data-ex="pinicon" data-v="' + esc(id) + '" title="' + esc(id) + '"><img loading="lazy" alt="' + esc(nm) + '" src="https://api.iconify.design/' + pf + '/' + nm + '.svg?color=%23' + prim + '&height=40"><span class="ex-pn">' + I('pin', 'xs') + '</span></button>'; }).join('') + '</div>' +
    '<div class="hint" style="margin-top:8px">' + esc(T('اضغط على الأيقونة لتثبيتها في هويتك.', 'Tap an icon to pin it to your identity.')) + '</div>' : '<div class="ex-hint">' + I('sparkles', 'sm') + '<span>' + esc(T('اكتب كلمة بالإنجليزية للبحث في آلاف الأيقونات.', 'Type a word to search thousands of icons.')) + '</span></div>';
}
async function runIcons(){
  const q = (($('[data-ex-q]', cur.root) || {}).value || cur.iconQ || '').trim(); cur.iconQ = q; if (!q) { cur.icons = []; drawIcons(); return; }
  cur.busy = true; cur.ierr = ''; drawIcons();
  try { const j = await fx('https://api.iconify.design/search?query=' + enc(q) + (cur.iconSet ? '&prefix=' + cur.iconSet : '') + '&limit=64'); cur.icons = j.icons || []; }
  catch (e) { cur.icons = []; cur.ierr = navigator.onLine === false ? T('لا يوجد إنترنت', 'You are offline') : T('تعذّر الاتصال بخدمة الأيقونات', 'Could not reach the icon service'); }
  cur.busy = false; if (cur.tab === 'icons') drawIcons();
}

/* ----- fonts ----- */
function bodyFonts(b){
  const cats = ['all', ...Object.keys(FKIND)];
  loadFontsource();
  b.innerHTML = '<div class="ex-search"><input type="text" dir="auto" data-ex-fq value="' + esc(cur.fq) + '" placeholder="' + esc(T('ابحث باسم الخط…', 'Search a font name…')) + '"><input type="text" dir="auto" data-ex-sample value="' + esc(cur.sample) + '" placeholder="' + esc(T('نص المعاينة', 'Preview text')) + '"></div>' +
    '<div class="ex-modes">' + [['all', 'الكل', 'All'], ['ar', 'عربي', 'Arabic'], ['en', 'لاتيني', 'Latin']].map(x => '<button class="pchip ' + (cur.fscope === x[0] ? 'on' : '') + '" data-ex-fs="' + x[0] + '">' + esc(T(x[1], x[2])) + '</button>').join('') + '<span class="ex-sep"></span>' +
    cats.map(k => '<button class="pchip ' + (cur.fcat === k ? 'on' : '') + '" data-ex-fc="' + k + '">' + esc(k === 'all' ? T('كل الأنواع', 'All styles') : T(FKIND[k][0], FKIND[k][1])) + '</button>').join('') + '</div><div id="exRes"></div>';
  drawFonts();
}
let fsLoaded = false;
const FCAT = { 'sans-serif': 'sans', serif: 'serif', display: 'display', handwriting: 'hand', monospace: 'sans' };
function addFS(arr){
  const have = new Set(FONTS.map(f => f.n)); let n = 0;
  (arr || []).forEach(x => { if (!x.family || have.has(x.family)) return; have.add(x.family); FONTS.push({ n: x.family, ar: (x.subsets || []).includes('arabic'), k: FCAT[x.category] || 'sans', fs: 1 }); n++; });
  return n;
}
async function loadFontsource(){
  if (fsLoaded || !conn.live()) return; fsLoaded = true;
  try { const a = await fx('https://api.fontsource.org/v1/fonts?subsets=arabic'); if (addFS(a) && cur.tab === 'fonts') drawFonts(); } catch (e) { fsLoaded = false; }
}
let fsq = 0;
async function searchFontsource(q){
  if (!conn.live() || q.length < 2) return; const k = ++fsq;
  try { const a = await fx('https://api.fontsource.org/v1/fonts?family=' + enc(q)); if (k === fsq && addFS(a) && cur.tab === 'fonts') drawFonts(); } catch (e) {}
}
function drawFonts(){
  const r = $('#exRes', cur.root); if (!r) return; const q = cur.fq.toLowerCase();
  const list = FONTS.filter(f => (cur.fscope === 'all' || (cur.fscope === 'ar') === f.ar) && (cur.fcat === 'all' || f.k === cur.fcat) && (!q || f.n.toLowerCase().includes(q)));
  const show = list.slice(0, cur.fshow); loadFonts(show.map(f => f.n));
  const pinned = (cur.p.identity && cur.p.identity.fonts || []).map(f => f.h);
  r.innerHTML = '<div class="ex-fonts">' + show.map(f => '<div class="ex-font"><div class="ex-fh"><b>' + esc(f.n) + '</b><span class="tag">' + esc(T(FKIND[f.k][0], FKIND[f.k][1]) + (f.ar ? T(' · عربي', ' · Arabic') : '')) + '</span>' +
    '<button class="icon-btn sm' + (pinned.includes(f.n) ? ' on' : '') + '" data-ex="pinfont" data-v="' + esc(f.n) + '" title="' + esc(T('تثبيت في هويتي', 'Pin to my identity')) + '">' + I('pin', 'sm') + '</button></div>' +
    '<div class="ex-fs" dir="auto" style="font-family:\'' + esc(f.n) + '\',' + (f.k === 'serif' || f.k === 'naskh' ? 'serif' : 'sans-serif') + '">' + esc(cur.sample || 'Aa') + '</div></div>').join('') + '</div>' +
    (list.length > show.length ? '<div style="text-align:center;margin:14px 0"><button class="btn" data-ex="morefonts">' + esc(T('عرض المزيد', 'Show more')) + '</button></div>' : '') + (list.length ? '' : MSA.empty('heading', T('لا خطوط مطابقة', 'No matching fonts')));
  if (!conn.live()) r.insertAdjacentHTML('afterbegin', '<div class="ex-err">' + I('info', 'sm') + '<span>' + esc(T('معاينة الخطوط متوقفة: فعّل "الخدمات المباشرة" من الإعدادات ← الموصّلات.', 'Font previews are off: enable “Live services” in Settings → Connectors.')) + '</span></div>');
}

/* ---------- actions ---------- */
function pinTo(type, v, quiet){
  const pin = MSA.suggest && MSA.suggest.pin; if (!pin) return; pin(cur.p, type, v, quiet); upd();
}
function targetStep(){
  const p = cur.p; let s = cur.stepId && P.find(p.steps, cur.stepId); if (s) return s.step;
  let t = null; P.walk(p.steps, x => { if (!t && x.key === 'mood') t = x; }); if (!t) P.walk(p.steps, x => { if (!t && x.key === 'brief') t = x; }); return t || p.steps[0] || null;
}
async function saveImage(x){
  const st = targetStep(); if (!st) { MSA.toast(T('لا توجد مرحلة لحفظ الصورة فيها', 'No step to save into'), 'err'); return; }
  try {
    const r = await fetch(x.thumb === x.full ? x.full : x.full, { mode: 'cors' }); if (!r.ok) throw 0; const blob = await r.blob();
    const f = new File([blob], (x.title || x.src || 'image').slice(0, 40).replace(/[\\/:*?"<>|]+/g, ' ') + '.' + ((blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')), { type: blob.type || 'image/jpeg' });
    const a = await MSA.files.put(f); a.kind = 'image'; st.atts.push(a); MSA.save(); MSA.updateCounts && MSA.updateCounts(); MSA.toast(T('تم الحفظ في «' + P.title(st) + '»', 'Saved to “' + P.title(st) + '”'), 'ok');
  } catch (e) {
    try { const r = await fetch(x.thumb, { mode: 'cors' }); if (!r.ok) throw 0; const blob = await r.blob(); const f = new File([blob], (x.title || 'image').slice(0, 40) + '.jpg', { type: blob.type || 'image/jpeg' }); const a = await MSA.files.put(f); a.kind = 'image'; st.atts.push(a); MSA.save(); MSA.updateCounts && MSA.updateCounts(); MSA.toast(T('تم الحفظ (بجودة المعاينة) في «' + P.title(st) + '»', 'Saved (preview quality) to “' + P.title(st) + '”'), 'ok'); }
    catch (e2) { pinTo('image', imgRec(x)); MSA.toast(T('هذا المصدر لا يسمح بالتنزيل داخل التطبيق، فتم تثبيت الصورة برابطها في هويتك.', 'This source does not allow downloads here; the image was pinned by link instead.')); }
  }
}
const imgRec = x => ({ thumb: x.thumb, full: x.full, title: (x.title || '').slice(0, 80), credit: (x.credit || '').slice(0, 80), page: x.page || '', src: x.src || '' });
function showPalette(x){
  const m = MSA.modal({ title: T('ألوان الصورة', 'Image colours'), size: 'sm', footer: false, body: '<div class="ex-pal-load">…</div>' }), box = $('.mb', m.el);
  const img = new Image(); img.crossOrigin = 'anonymous'; img.referrerPolicy = 'no-referrer';
  img.onload = () => {
    try {
      const cols = imgPalette(img, 6);
      box.innerHTML = '<img class="ex-pimg" alt="" src="' + esc(x.thumb) + '"><div class="sw-row">' + cols.map(h => '<div class="sw-card"><button class="sw-c" data-pc="copy" data-v="' + h + '" style="background:' + h + ';color:' + ink(h) + '">' + h.toUpperCase() + '</button><button class="icon-btn sm" data-pc="pin" data-v="' + h + '">' + I('pin', 'sm') + '</button></div>').join('') + '</div>';
      box.onclick = async e => { const b = e.target.closest('[data-pc]'); if (!b) return; if (b.dataset.pc === 'pin') pinTo('color', b.dataset.v); else { try { await navigator.clipboard.writeText(b.dataset.v); MSA.toast(T('تم النسخ: ', 'Copied: ') + b.dataset.v); } catch (er) {} } };
    } catch (e) { box.innerHTML = '<div class="ex-err">' + I('info', 'sm') + '<span>' + esc(T('هذا المصدر لا يسمح بقراءة ألوان الصورة. جرّب صورة من Openverse أو Wikimedia.', 'This source does not allow reading the image colours. Try an Openverse or Wikimedia image.')) + '</span></div>'; }
  };
  img.onerror = () => { box.innerHTML = '<div class="ex-err">' + I('info', 'sm') + '<span>' + esc(T('تعذّر تحميل الصورة', 'Could not load the image')) + '</span></div>'; };
  img.src = x.thumb;
}
function view(x){
  const m = MSA.modal({ title: x.title || x.src, size: 'wide', footer: false, body: '<div class="ex-view"><img alt="" referrerpolicy="no-referrer" src="' + esc(x.full || x.thumb) + '" onerror="this.src=\'' + esc(x.thumb) + '\'"><div class="ex-vinfo"><div>' + esc(x.credit || '') + '</div><div class="row"><button class="btn" data-v="pin">' + I('pin', 'sm') + '<span>' + esc(T('تثبيت في هويتي', 'Pin to identity')) + '</span></button><button class="btn" data-v="save">' + I('download', 'sm') + '<span>' + esc(T('حفظ في المرحلة', 'Save to step')) + '</span></button>' + (x.page ? '<button class="btn ghost" data-open="' + esc(x.page) + '">' + I('external', 'sm') + '<span>' + esc(T('صفحة المصدر', 'Source page')) + '</span></button>' : '') + '</div></div></div>' });
  m.el.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; if (b.dataset.v === 'pin') pinTo('image', imgRec(x)); else if (b.dataset.v === 'save') saveImage(x); });
}
async function onPaste(e){
  const items = (e.clipboardData && e.clipboardData.items) || []; const it = [...items].find(i => i.kind === 'file' && i.type.startsWith('image/')); if (!it) return;
  e.preventDefault(); const f = it.getAsFile(); const st = targetStep(); if (!f || !st) return;
  const a = await MSA.files.put(new File([f], 'pasted-' + Date.now() + '.png', { type: f.type })); a.kind = 'image'; st.atts.push(a); MSA.save(); MSA.updateCounts && MSA.updateCounts();
  MSA.toast(T('تم لصق الصورة في «' + P.title(st) + '»', 'Pasted into “' + P.title(st) + '”'), 'ok');
}
function onInput(e){
  const t = e.target;
  if (t.matches('[data-ex-base]')) { cur.base = t.value; if (e.type === 'change') drawBody(); else { const tx = $('[data-ex-basetxt]', cur.root); if (tx) tx.value = t.value.toUpperCase(); } }
  else if (t.matches('[data-ex-basetxt]')) { const v = t.value.trim(); if (/^#?[0-9a-f]{6}$/i.test(v)) { cur.base = (v[0] === '#' ? v : '#' + v).toLowerCase(); if (e.type === 'change') drawBody(); } }
  else if (t.matches('[data-ex-fq]')) { cur.fq = t.value; cur.fshow = 24; drawFonts(); clearTimeout(cur.fqt); cur.fqt = setTimeout(() => searchFontsource(t.value.trim()), 500); }
  else if (t.matches('[data-ex-sample]')) { cur.sample = t.value; $$('.ex-fs', cur.root).forEach(x => x.textContent = t.value || 'Aa'); }
  else if (t.matches('[data-ex-set]')) { cur.iconSet = t.value; runIcons(); }
}
async function onClick(e){
  const tab = e.target.closest('[data-ex-tab]'); if (tab) { cur.tab = tab.dataset.exTab; S().ui.exTab = cur.tab; cur.tok++; cur.busy = false; draw(); if (cur.tab === 'icons' && !cur.icons.length) { if (!cur.iconQ) cur.iconQ = cur.q; runIcons(); } return; }
  const sr = e.target.closest('[data-ex-src]'); if (sr) { let sel = chosen(); const id = sr.dataset.exSrc; sel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]; if (!sel.length) sel = [id]; S().ui.exSrc = sel; MSA.save(); drawBody(); if (cur.q && cur.searched) run(true); return; }
  const md = e.target.closest('[data-ex-mode]'); if (md) { cur.mode = md.dataset.exMode; drawBody(); return; }
  const fs = e.target.closest('[data-ex-fs]'); if (fs) { cur.fscope = fs.dataset.exFs; cur.fshow = 24; drawBody(); return; }
  const fc = e.target.closest('[data-ex-fc]'); if (fc) { cur.fcat = fc.dataset.exFc; cur.fshow = 24; drawBody(); return; }
  const b = e.target.closest('[data-ex]'); if (!b) return; const a = b.dataset.ex, it = b.dataset.i != null ? cur.items[+b.dataset.i] : null;
  if (a === 'search') { if (cur.tab === 'icons') runIcons(); else run(true); }
  else if (a === 'more') run(false);
  else if (a === 'view' && it) view(it);
  else if (a === 'pinimg' && it) pinTo('image', imgRec(it));
  else if (a === 'save' && it) saveImage(it);
  else if (a === 'pal' && it) showPalette(it);
  else if (a === 'addurl') {
    const inp = $('[data-ex-url]', cur.root); const u = (inp.value || '').trim(); if (!/^https?:\/\//i.test(u)) { MSA.toast(T('الصق رابطًا يبدأ بـ http', 'Paste a link starting with http'), 'err'); return; }
    pinTo('image', { thumb: u, full: u, title: '', credit: '', page: u, src: T('رابط', 'Link') }); inp.value = '';
  }
  else if (a === 'pincol') pinTo('color', b.dataset.v);
  else if (a === 'pinall') { palette(cur.base, cur.mode).forEach(h => pinTo('color', h, true)); MSA.toast(T('تم تثبيت اللوحة في هويتك', 'Palette pinned to your identity'), 'ok'); }
  else if (a === 'copy') { try { await navigator.clipboard.writeText(b.dataset.v); MSA.toast(T('تم النسخ: ', 'Copied: ') + b.dataset.v); } catch (x) { MSA.toast(b.dataset.v); } }
  else if (a === 'shuffle') { const h = Math.floor(Math.random() * 360); cur.base = hsl2hex(h, .45 + Math.random() * .35, .38 + Math.random() * .2); drawBody(); }
  else if (a === 'pinicon') pinTo('icon', b.dataset.v);
  else if (a === 'pinfont') { const n = b.dataset.v; pinTo('font', { h: n, b: n, ah: n, ab: n }); drawFonts(); }
  else if (a === 'morefonts') { cur.fshow += 24; drawFonts(); }
  else if (a === 'identity') { MSA.suggest && MSA.suggest.openIdentity(cur.p); }
}
MSA.explore = { open, sources: SRC, keys };

/* ---------- Settings → Connectors: in-app sources + optional free API keys ---------- */
const KEYSRC = [
  ['pexels', 'Pexels', 'https://www.pexels.com/api/', ['افتح الرابط واضغط «Get Started» ثم سجّل بإيميلك', 'أكّد الإيميل واكتب وصفًا بسيطًا لاستخدامك (تطبيق شخصي لتصميم الهوية)', 'يظهر مفتاحك فورًا في صفحة الـ API — انسخه والصقه هنا'], ['Open the link and press “Get Started”, sign up with your email', 'Confirm the email and describe your use (a personal brand-design app)', 'Your key appears right away on the API page — copy it and paste it here']],
  ['unsplash', 'Unsplash (Access Key)', 'https://unsplash.com/developers', ['سجّل حسابًا ثم افتح «Your apps» ← «New Application»', 'وافق على الشروط وسمِّ التطبيق', 'انسخ «Access Key» (وليس Secret) والصقه هنا'], ['Create an account, open “Your apps” → “New Application”', 'Accept the terms and name the app', 'Copy the “Access Key” (not the Secret) and paste it here']],
  ['pixabay', 'Pixabay', 'https://pixabay.com/api/docs/', ['سجّل حسابًا مجانيًا ثم افتح صفحة الـ API docs وأنت داخل حسابك', 'سيظهر مفتاحك أعلى الصفحة في المثال الأول (key=…)', 'انسخه والصقه هنا'], ['Create a free account, then open the API docs while logged in', 'Your key shows in the first example (key=…)', 'Copy it and paste it here']],
  ['harvard', 'Harvard Art Museums', 'https://harvardartmuseums.org/collections/api', ['افتح الرابط واضغط «Request an API key» واملأ الاستمارة', 'يصلك المفتاح على إيميلك خلال دقائق', 'الصقه هنا'], ['Open the link, press “Request an API key”, fill the form', 'The key is emailed to you within minutes', 'Paste it here']],
  ['smithsonian', 'Smithsonian Open Access', 'https://api.data.gov/signup/', ['اكتب اسمك وإيميلك في صفحة التسجيل (خدمة api.data.gov الحكومية)', 'يصلك المفتاح على الإيميل', 'الصقه هنا (نفس المفتاح يصلح لخدمات حكومية أخرى)'], ['Enter your name and email on the sign-up page (the api.data.gov service)', 'The key is emailed to you', 'Paste it here']],
  ['europeana', 'Europeana', 'https://pro.europeana.eu/page/get-api', ['سجّل حسابًا مجانيًا في Europeana', 'من «Get API» اطلب مفتاحًا (wskey)', 'انسخه والصقه هنا']  , ['Create a free Europeana account', 'From “Get API” request a key (wskey)', 'Copy it and paste it here']]
];
MSA.exploreSettingsHTML = function(){
  const k = keys();
  const row = x => { const [id, name, url, ar, enn] = x, has = (k[id] || '').trim();
    return '<div class="field kfield"><label class="f">' + esc(name) + (has ? ' <span class="tag" style="background:var(--ok);color:#fff">' + esc(T('مفعّل', 'Active')) + '</span>' : '') + '</label>' +
      '<div class="row"><input type="password" dir="ltr" autocomplete="off" class="grow" data-exkey="' + id + '" value="' + esc(k[id] || '') + '" placeholder="API key"><button class="btn sm" data-open="' + esc(url) + '">' + I('external', 'sm') + '<span>' + esc(T('سجّل واحصل على المفتاح', 'Sign up & get key')) + '</span></button></div>' +
      '<details class="ksteps"><summary>' + esc(T('الخطوات بالتفصيل', 'Step by step')) + '</summary><ol>' + (lang2() === 'en' ? enn : ar).map(s => '<li>' + esc(s) + '</li>').join('') + '</ol></details></div>'; };
  return '<div class="subsec" style="margin-top:12px"><div class="f-title">' + I('search', 'sm') + esc(T('مصادر الهوية البصرية داخل البرنامج', 'In-app visual identity sources')) + '</div>' +
    '<div class="hint" style="margin-bottom:8px">' + esc(T('تعمل بدون أي إعداد: Openverse وWikimedia وArt Institute وCleveland وThe Met (صور)، وIconify (أيقونات وشعارات ماركات)، وGoogle Fonts وFontsource (خطوط)، وTheColorAPI (أسماء الألوان). ولإضافة مصادر أكثر سجّل بنفسك في أي موقع من التالية والصق مفتاحه. المفاتيح تُحفظ على جهازك فقط ولا تدخل النسخ الاحتياطي. Behance وPinterest وDribbble لا تسمح بعرض محتواها داخل تطبيقات أخرى، فانسخ الصورة والصقها (Ctrl+V) داخل المستكشف.', 'Work with no setup: Openverse, Wikimedia, Art Institute, Cleveland and The Met (images), Iconify (icons & brand logos), Google Fonts and Fontsource (fonts), TheColorAPI (colour names). To add more sources, sign up yourself on any site below and paste its key. Keys stay on this device and are left out of backups. Behance, Pinterest and Dribbble do not allow their content inside other apps, so copy an image there and paste it (Ctrl+V) into the explorer.')) + '</div>' +
    KEYSRC.map(row).join('') + '</div>';
};
const lang2 = () => (S().settings.lang === 'en' ? 'en' : 'ar');
MSA.wireExploreSettings = function(root){
  $$('[data-exkey]', root).forEach(i => i.onchange = () => { keys()[i.dataset.exkey] = i.value.trim(); MSA.save(); const h = i.closest('.kfield'); const l = h && $('label.f', h); if (l) l.innerHTML = l.firstChild.textContent + (i.value.trim() ? ' <span class="tag" style="background:var(--ok);color:#fff">' + esc(T('مفعّل', 'Active')) + '</span>' : ''); });
};
})();
