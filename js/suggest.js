/* Suggestions: reads the brief (text + reference images) and proposes colours, fonts, icons, templates … for every step of the plan.
   Pinned items form the project's visual identity board. Everything runs on-device; */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$, P = MSA.proj, K = MSA.know, conn = MSA.conn;
const T = MSA.T, esc = U.esc, S = () => MSA.state;
const lg = () => (S().settings.lang === 'en' ? 1 : 0);
const L = a => a[lg()];                       // pick [ar, en]
const REF_KEYS = ['brief', 'idea', 'mood'];
const STYLE_EN = { luxury: 'luxury premium', classic: 'vintage classic', minimal: 'minimal modern', playful: 'playful colorful', bold: 'bold urban', natural: 'natural organic', elegant: 'elegant soft' };
const DEF_PRIMARY = { luxury: '#c9a24b', classic: '#8b5a2b', minimal: '#2f6fed', playful: '#ff7a59', bold: '#ff3b30', natural: '#4f8f5b', elegant: '#d98fa8' };

/* ---------- colour helpers ---------- */
const hex2 = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
const toHex = ([r, g, b]) => '#' + hex2(r) + hex2(g) + hex2(b);
const fromHex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
function rgb2hsl([r, g, b]){
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
function hsl2rgb([h, s, l]){
  h = ((h % 360) + 360) % 360 / 360; if (!s) return [l * 255, l * 255, l * 255];
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q, f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
const hslHex = (h, s, l) => toHex(hsl2rgb([h, Math.max(0, Math.min(1, s)), Math.max(0, Math.min(1, l))]));
const mix = (a, b, t) => toHex(fromHex(a).map((v, i) => v + (fromHex(b)[i] - v) * t));
const relL = h => { const c = fromHex(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const contrast = (a, b) => { const x = relL(a), y = relL(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const inkOn = h => (contrast(h, '#ffffff') >= contrast(h, '#111111') ? '#ffffff' : '#111111');
function nameOf(hex){
  let best = null, bd = 1e9; const c = fromHex(hex);
  K.colorNames.forEach(n => { const m = fromHex(n[0]), d = (c[0] - m[0]) ** 2 + (c[1] - m[1]) ** 2 + (c[2] - m[2]) ** 2; if (d < bd) { bd = d; best = n; } });
  return lg() ? best[2] : best[1];
}
const cmyk = h => { const [r, g, b] = fromHex(h).map(v => v / 255), k = 1 - Math.max(r, g, b); if (k >= 1) return [0, 0, 0, 100]; return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map(v => Math.round(v * 100)); };

/* ---------- gathering the brief ---------- */
const refImages = p => { const o = []; P.walk(p.steps, s => { if (REF_KEYS.includes(s.key)) s.atts.forEach(a => a.kind === 'image' && o.push(a)); }); return o; };
const briefText = p => { let t = p.name || ''; P.walk(p.steps, s => { if (REF_KEYS.includes(s.key)) t += ' ' + (s.note || ''); }); return t; };
const brandOf = p => p.brand || (p.name || '').replace(/كامبين|حملة|افتتاح|إطلاق|مشروع|campaign|launch|opening|project/gi, '').replace(/\s+/g, ' ').trim() || p.name || 'Brand';
const sigOf = refs => refs.map(a => a.id).join(',');

async function pixelsOf(att){
  const rec = await MSA.files.get(att.id); if (!rec || !rec.blob) return null;
  const url = URL.createObjectURL(rec.blob);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    const sc = Math.min(1, 72 / Math.max(img.width || 72, img.height || 72)), w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data, out = []; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) out.push([d[i], d[i + 1], d[i + 2]]);
    return out;
  } catch (e) { return null; } finally { URL.revokeObjectURL(url); }
}
function kmeans(px, k){
  if (px.length < k) return px.map(p => ({ c: p, n: 1 }));
  const lum = p => p[0] * .3 + p[1] * .59 + p[2] * .11, sorted = [...px].sort((a, b) => lum(a) - lum(b));
  let cen = Array.from({ length: k }, (_, i) => sorted[Math.floor((i + .5) * sorted.length / k)].slice()), asg = new Array(px.length).fill(0);
  for (let it = 0; it < 9; it++) {
    const sum = cen.map(() => [0, 0, 0, 0]);
    px.forEach((p, i) => { let b = 0, bd = 1e12; cen.forEach((c, j) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; b = j; } }); asg[i] = b; sum[b][0] += p[0]; sum[b][1] += p[1]; sum[b][2] += p[2]; sum[b][3]++; });
    cen = cen.map((c, j) => sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : c);
  }
  const cnt = cen.map(() => 0); asg.forEach(a => cnt[a]++);
  let cl = cen.map((c, j) => ({ c, n: cnt[j] })).filter(x => x.n); const out = [];
  cl.sort((a, b) => b.n - a.n).forEach(x => { const m = out.find(o => Math.hypot(o.c[0] - x.c[0], o.c[1] - x.c[1], o.c[2] - x.c[2]) < 30); if (m) { const t = m.n + x.n; m.c = m.c.map((v, i) => (v * m.n + x.c[i] * x.n) / t); m.n = t; } else out.push({ c: x.c.slice(), n: x.n }); });
  return out.sort((a, b) => b.n - a.n);
}
async function analyze(p){
  const refs = refImages(p); if (!refs.length) { p.analysis = null; return null; }
  let all = []; for (const a of refs.slice(0, 6)) { const px = await pixelsOf(a); if (px && px.length) all = all.concat(px.length > 3000 ? px.filter((_, i) => i % Math.ceil(px.length / 3000) === 0) : px); }
  if (!all.length) { p.analysis = null; return null; }
  const cl = kmeans(all, 7), tot = cl.reduce((s, x) => s + x.n, 0);
  const cols = cl.map(x => { const hsl = rgb2hsl(x.c); return { hex: toHex(x.c), share: x.n / tot, h: hsl[0], s: hsl[1], l: hsl[2] }; });
  const neutral = c => c.s < .12 || c.l > .93 || c.l < .07, acc = cols.filter(c => !neutral(c));
  const avgL = cols.reduce((s, c) => s + c.l * c.share, 0), sdL = Math.sqrt(cols.reduce((s, c) => s + (c.l - avgL) ** 2 * c.share, 0));
  const at = acc.reduce((s, c) => s + c.share, 0) || 1, sat = acc.reduce((s, c) => s + c.s * c.share, 0) / at;
  const warm = acc.filter(c => c.h < 70 || c.h > 330).reduce((s, c) => s + c.share, 0) / at, cool = acc.filter(c => c.h > 160 && c.h < 270).reduce((s, c) => s + c.share, 0) / at, green = acc.filter(c => c.h >= 75 && c.h <= 165).reduce((s, c) => s + c.share, 0) / at;
  const gold = acc.some(c => c.h > 33 && c.h < 56 && c.s > .38 && c.share > .03);
  const tags = []; tags.push(avgL < .36 ? 'dark' : avgL > .66 ? 'light' : 'mid'); if (acc.length) { tags.push(sat > .5 ? 'vivid' : sat < .28 ? 'muted' : 'balanced'); if (warm > .55) tags.push('warm'); else if (cool > .5) tags.push('cool'); if (green > .5) tags.push('green'); } if (sdL > .26) tags.push('contrast'); if (gold) tags.push('gold');
  p.analysis = { sig: sigOf(refs), cols, tags, avgL, sat, ts: Date.now() };
  return p.analysis;
}
function infer(p, A, ai){
  const txt = briefText(p) + ' ' + ((ai && ai.keywords_en) || []).join(' '), sc = {}; Object.keys(K.profiles).forEach(k => sc[k] = 0);
  Object.keys(K.styleWords).forEach(k => { if (K.styleWords[k].test(txt)) sc[k] += 3; });
  if (A) {
    const t = A.tags, has = x => t.includes(x);
    if (has('dark')) { sc.luxury += 1.5; sc.bold += .6; sc.classic += .4; } if (has('light')) { sc.minimal += 1.5; sc.elegant += 1; sc.natural += .4; }
    if (has('vivid')) { sc.playful += 2; sc.bold += 1; } if (has('muted')) { sc.minimal += 1; sc.classic += 1; sc.natural += .5; sc.elegant += .6; }
    if (has('contrast')) sc.bold += 1.2; if (has('green')) sc.natural += 2; if (has('warm')) { sc.classic += 1; sc.luxury += .4; } if (has('gold')) { sc.luxury += 1.2; sc.classic += .6; }
  }
  const top = Object.keys(sc).sort((a, b) => sc[b] - sc[a]);
  return { top, sc };
}
function subjectOf(p, ai){
  const txt = briefText(p) + ' ' + ((ai && ai.keywords_en) || []).join(' ') + ' ' + ((ai && ai.subject) || '');
  return K.subjects.find(s => s.id !== 'general' && s.re.test(txt)) || K.subjects[K.subjects.length - 1];
}
function context(p){
  const ai = null, A = p.analysis || null, inf = infer(p, A, ai), subj = subjectOf(p, ai);
  const pid = (p.profile && K.profiles[p.profile]) ? p.profile : (ai && K.profiles[ai.profile] ? ai.profile : inf.top[0]), prof = K.profiles[pid];
  /* palette roles */
  let primary, secondary, accent, light, dark;
  const acc = A ? A.cols.filter(c => !(c.s < .12 || c.l > .93 || c.l < .07)).sort((a, b) => b.share * (.4 + b.s) - a.share * (.4 + a.s)) : [];
  primary = acc[0] ? acc[0].hex : DEF_PRIMARY[pid];
  const ph = rgb2hsl(fromHex(primary));
  const sec = acc.find(c => Math.min(Math.abs(c.h - ph[0]), 360 - Math.abs(c.h - ph[0])) > 22);
  secondary = sec ? sec.hex : hslHex(ph[0] + 28, ph[1] * .8, Math.min(.7, ph[2] + .08));
  const oth = acc.filter(c => c.hex !== primary && c.hex !== (sec && sec.hex)).sort((a, b) => b.s - a.s)[0];
  accent = oth ? oth.hex : (pid === 'luxury' || pid === 'classic' ? '#c9a24b' : hslHex(ph[0] + 180, Math.max(.5, ph[1]), .55));
  const lights = A ? A.cols.filter(c => c.l > .55).sort((a, b) => b.l - a.l) : [], darks = A ? A.cols.filter(c => c.l < .35).sort((a, b) => a.l - b.l) : [];
  light = mix(lights[0] ? lights[0].hex : '#f4efe6', '#ffffff', .82); dark = mix(darks[0] ? darks[0].hex : '#241a14', '#000000', .45);
  const isDark = (A ? A.tags.includes('dark') : ['luxury', 'bold'].includes(pid));
  return { p, ai, A, inf, subj, pid, prof, brand: brandOf(p), roles: [[['الأساسي', 'Primary'], primary], [['الثانوي', 'Secondary'], secondary], [['التمييز', 'Accent'], accent], [['الفاتح', 'Light neutral'], light], [['الداكن', 'Dark neutral'], dark]], primary, secondary, accent, light, dark, isDark };
}
const qBase = c => ((c.ai && c.ai.keywords_en && c.ai.keywords_en.length) ? c.ai.keywords_en.slice(0, 3) : c.subj.q.slice(0, 2)).join(' ');
const styleQ = c => STYLE_EN[c.pid];

/* ---------- small renderers ---------- */
const sec = (title, body, icon) => '<section class="sg-sec"><h4>' + (icon ? I(icon, 'sm') : '') + esc(title) + '</h4>' + body + '</section>';
const bullets = a => '<ul class="sg-list">' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const pinBtn = (type, v, label) => '<button class="icon-btn sm" data-sg="pin" data-type="' + type + '" data-v="' + esc(typeof v === 'string' ? v : JSON.stringify(v)) + '" title="' + esc(label || T('أضف إلى هويتي البصرية', 'Add to my visual identity')) + '">' + I('pin', 'sm') + '</button>';
const swatch = (hex, label) => '<div class="sw-card"><button class="sw-c" data-sg="copy" data-v="' + hex + '" style="background:' + hex + ';color:' + inkOn(hex) + '" title="' + esc(T('نسخ', 'Copy')) + '">' + hex.toUpperCase() + '</button><span class="sw-n">' + esc(label ? label : nameOf(hex)) + '</span>' + pinBtn('color', hex) + '</div>';
function searchBox(scope, text, tag){
  return '<div class="sg-search" data-scope="' + scope + '" data-tag="' + esc(tag || '') + '"><div class="sg-srow"><input type="text" dir="auto" value="' + esc(text) + '" aria-label="search"><button class="btn primary" data-sg="explore">' + I('search', 'sm') + '<span>' + esc(T('ابحث داخل البرنامج', 'Search in the app')) + '</span></button></div>' +
    '<details class="ext"><summary>' + esc(T('فتح في المتصفح (اختياري)', 'Open in the browser (optional)')) + '</summary><div class="chips">' + conn.chipsHTML(scope, text, { tag }) + '</div></details></div>';
}
const aiList = (c, key, title) => (c.ai && Array.isArray(c.ai[key]) && c.ai[key].length) ? '<div class="sg-ai"><b>' + I('sparkles', 'xs') + ' ' + esc(title || 'Claude') + '</b>' + bullets(c.ai[key].map(String)) + '</div>' : '';

/* wireframes */
function wf(id, c){
  const bg = c.light, fg = c.dark, ac = c.accent, pm = c.primary, dk = c.isDark; const B = dk ? c.dark : bg, F = dk ? c.light : fg;
  const bars = (x, y, w) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="5" rx="2.5" fill="' + F + '" opacity=".85"/><rect x="' + x + '" y="' + (y + 9) + '" width="' + w * .6 + '" height="3.5" rx="1.75" fill="' + F + '" opacity=".4"/>';
  const prod = (x, y, r) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + pm + '"/><circle cx="' + (x - r * .3) + '" cy="' + (y - r * .3) + '" r="' + r * .35 + '" fill="#fff" opacity=".25"/>';
  let b = '<rect width="100" height="125" rx="6" fill="' + B + '"/>';
  if (id === 'hero') b += '<circle cx="50" cy="52" r="34" fill="' + ac + '" opacity=".25"/>' + prod(50, 52, 24) + bars(22, 96, 56);
  else if (id === 'split') b += '<rect width="50" height="125" rx="6" fill="' + pm + '"/>' + prod(50, 54, 22) + bars(58, 96, 36) + '<rect x="10" y="12" width="14" height="4" rx="2" fill="' + inkOn(pm) + '"/>';
  else if (id === 'diag') b += '<polygon points="0,70 100,30 100,125 0,125" fill="' + pm + '"/>' + prod(50, 48, 22) + '<rect x="12" y="96" width="46" height="6" rx="3" fill="' + inkOn(pm) + '"/><rect x="12" y="108" width="28" height="4" rx="2" fill="' + inkOn(pm) + '" opacity=".6"/>';
  else if (id === 'type') b += '<rect x="12" y="16" width="72" height="12" rx="3" fill="' + F + '"/><rect x="12" y="34" width="56" height="12" rx="3" fill="' + F + '"/><rect x="12" y="52" width="64" height="12" rx="3" fill="' + pm + '"/><circle cx="76" cy="98" r="12" fill="' + ac + '"/>' + bars(12, 94, 40);
  else if (id === 'flatlay') b += '<circle cx="50" cy="60" r="20" fill="' + pm + '"/>' + [[22, 28], [78, 28], [22, 92], [78, 92]].map(q => '<rect x="' + (q[0] - 10) + '" y="' + (q[1] - 10) + '" width="20" height="20" rx="5" fill="' + ac + '" opacity=".7"/>').join('') + bars(24, 108, 52).replace(/y="108"/, 'y="108"');
  else b += '<rect x="8" y="8" width="84" height="109" rx="4" fill="none" stroke="' + ac + '" stroke-width="1.6"/>' + prod(50, 52, 24) + bars(24, 90, 52);
  return '<svg viewBox="0 0 100 125" class="wf" xmlns="http://www.w3.org/2000/svg">' + b + '</svg>';
}
function gridWf(id, c){
  const cell = (i, j, f) => '<rect x="' + (2 + j * 29) + '" y="' + (2 + i * 29) + '" width="27" height="27" rx="2" fill="' + f + '"/>';
  const photo = c.primary, solid = c.isDark ? c.dark : c.light, alt = c.accent; let b = '<rect width="91" height="91" rx="5" fill="' + (c.isDark ? '#111' : '#fff') + '" opacity=".6"/>';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    let f;
    if (id === 'checker') f = (i + j) % 2 ? solid : photo; else if (id === 'rows') f = [photo, alt, c.secondary][i]; else if (id === 'puzzle') f = mix(photo, c.secondary, (i * 3 + j) / 8); else f = (i + j) % 2 ? photo : mix(photo, '#000000', .18);
    b += cell(i, j, f) + (id === 'frame' ? '<rect x="' + (5 + j * 29) + '" y="' + (5 + i * 29) + '" width="21" height="21" rx="1.5" fill="none" stroke="' + alt + '" stroke-width="1"/>' : '');
  }
  return '<svg viewBox="0 0 91 91" class="wf grid" xmlns="http://www.w3.org/2000/svg">' + b + '</svg>';
}
const COMP_N = { hero: ['المنتج في المنتصف', 'Centred hero'], split: ['تقسيم لوني', 'Colour split'], diag: ['قطري ديناميكي', 'Dynamic diagonal'], type: ['تيبوجرافي', 'Typographic'], flatlay: ['عناصر حول المنتج', 'Flat-lay'], frame: ['إطار رفيع', 'Thin frame'] };
const GRID_N = { checker: ['شطرنجي (صورة / لون)', 'Checkerboard (photo / colour)'], rows: ['صفوف بألوان متتابعة', 'Colour rows'], puzzle: ['بازل صورة واحدة', 'One-image puzzle'], frame: ['إطار موحّد', 'Unified frame'] };

/* ---------- fonts / icons live helpers ---------- */
const fontsLoaded = new Set();
function ensureFont(f){ if (!conn.live() || !f || fontsLoaded.has(f)) return; fontsLoaded.add(f); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(f).replace(/%20/g, '+') + '&display=swap'; document.head.appendChild(l); }
const ffam = (f, kind) => "'" + f + "'," + (kind === 'serif' ? 'serif' : 'sans-serif');
async function iconSearch(prefix, q, limit){
  const r = await fetch('https://api.iconify.design/search?query=' + encodeURIComponent(q) + '&prefix=' + prefix + '&limit=' + (limit || 8)); if (!r.ok) throw new Error('x');
  return (await r.json()).icons || [];
}
async function fillIcons(root, c){
  const box = $('[data-icons]', root); if (!box) return; if (!conn.live()) { box.innerHTML = '<div class="hint">' + esc(T('الخدمات المباشرة متوقفة من الإعدادات ← الموصّلات.', 'Live services are off in Settings → Connectors.')) + '</div>'; return; }
  const words = ((box.dataset.words || '').split(',').filter(Boolean)); const pre = c.prof.icon.pre; let html = '';
  try {
    for (const w of words.slice(0, 4)) {
      const ics = await iconSearch(pre, w, 6);
      html += ics.map(id => { const [pf, nm] = id.split(':'); return '<button class="ic-card" data-sg="pin" data-type="icon" data-v="' + id + '" title="' + esc(id) + '"><img loading="lazy" alt="' + esc(nm) + '" src="https://api.iconify.design/' + pf + '/' + nm + '.svg?color=' + encodeURIComponent(c.primary) + '&height=34"></button>'; }).join('');
    }
    box.innerHTML = html || '<div class="hint">' + esc(T('لا نتائج', 'No results')) + '</div>';
  } catch (e) { box.innerHTML = '<div class="hint">' + esc(T('تعذّر الاتصال بخدمة الأيقونات (تحتاج إنترنت). استخدم الروابط أعلاه.', 'Could not reach the icon service (needs internet). Use the links above.')) + '</div>'; }
}

/* ---------- per-step sections ---------- */
const R = {};
R.brief = c => {
  const A = c.A, tags = A ? A.tags : [];
  const tagN = { dark: ['داكنة', 'dark'], light: ['فاتحة', 'light'], mid: ['متوسطة الإضاءة', 'mid-tone'], vivid: ['زاهية', 'vivid'], muted: ['هادئة', 'muted'], balanced: ['متوازنة', 'balanced'], warm: ['دافئة', 'warm'], cool: ['باردة', 'cool'], green: ['خضراء', 'green'], contrast: ['عالية التباين', 'high contrast'], gold: ['لمسة ذهبية', 'golden touch'] };
  const summary = T('البراند: ', 'Brand: ') + c.brand + '\n' + T('المجال: ', 'Sector: ') + L(c.subj.name) + '\n' + T('الطابع المقترح: ', 'Suggested style: ') + L(c.prof.name) + '\n' + T('ألوان مستخلصة: ', 'Extracted colours: ') + c.roles.slice(0, 3).map(r => r[1].toUpperCase()).join(' · ');
  return sec(T('ملخص تحليل البريف', 'Brief analysis'), '<div class="sg-sum"><div><b>' + esc(L(c.subj.name)) + '</b> · ' + esc(L(c.prof.name)) + '<div class="hint">' + esc(L(c.prof.desc)) + '</div></div>' +
    (tags.length ? '<div class="tags">' + tags.map(x => '<span class="tag">' + esc(L(tagN[x] || [x, x])) + '</span>').join('') + '</div>' : '<div class="hint">' + esc(T('أضف صورة المنتج في البريف (من الملفات أو بالكاميرا) لتحليل ألوانها وطابعها.', 'Add the product image to the brief (from files or the camera) to analyse its colours and mood.')) + '</div>') + '</div>' +
    '<div class="sg-actions"><button class="btn sm" data-sg="append" data-v="' + esc(summary) + '">' + I('plus', 'sm') + esc(T('أضف الملخص لملاحظات البريف', 'Add summary to the brief note')) + '</button></div>', 'sparkles') +
    sec(T('أسئلة البريف المقترحة', 'Suggested brief questions'), bullets([T('من الجمهور المستهدف؟ (العمر، الاهتمامات، المدينة)', 'Who is the audience? (age, interests, city)'), T('ما الهدف: تعريف، افتتاح، مبيعات؟', 'What is the goal: awareness, launch, sales?'), T('ما الرسالة الواحدة التي نريد أن تُتذكّر؟', 'What single message should be remembered?'), T('ما نبرة البراند؟ ' + L(c.prof.tone.map(x => x)), 'What is the tone? ' + c.prof.tone.map(x => x[1]).join(' / ')), T('ما المخرجات المطلوبة وعددها؟', 'Which deliverables, and how many?'), T('الموعد النهائي والمنصات؟', 'Deadline and platforms?')]), 'list') +
    aiList(c, 'audience_notes') + sec(T('إلهام', 'Inspiration'), searchBox('idea', qBase(c) + ' ' + styleQ(c) + ' brand', ''), 'search');
};
R.idea = c => {
  const B = c.brand, ang = [
    [T('المنتج هو البطل', 'The product is the hero'), T('اجعل ' + B + ' نجم الكادر: لقطات قريبة وتفاصيل تحكي الجودة.', 'Make ' + B + ' the star of the frame: close-ups and details that tell quality.')],
    [T('لحظة الطقس', 'The ritual moment'), T('ركّز على اللحظة التي يستخدم فيها العميل المنتج، وكيف تغيّر يومه.', 'Focus on the moment the customer uses it and how it changes their day.')],
    [T('الأصالة والحكاية', 'Heritage & story'), T('اروِ من أين بدأ ' + B + ' ولماذا يختلف: مكان، شخص، تقليد.', 'Tell where ' + B + ' started and why it differs: a place, a person, a tradition.')],
    [T('الحرف هو الشعار', 'Lettering as the symbol'), T('حوّل اسم ' + B + ' إلى أيقونة بصرية يمكن أن تقف وحدها.', 'Turn the name ' + B + ' into a visual icon that can stand alone.')]
  ];
  return sec(T('اتجاهات للفكرة', 'Concept angles'), '<div class="sg-cards">' + ang.map(a => '<div class="sg-card"><b>' + esc(a[0]) + '</b><p>' + esc(a[1]) + '</p>' + pinBtn('note', a[0] + ': ' + a[1]) + '</div>').join('') + '</div>', 'sparkles') + aiList(c, 'concept_ideas', T('أفكار من Claude', 'Ideas from Claude')) + sec(T('إلهام', 'Inspiration'), searchBox('idea', qBase(c) + ' advertising campaign idea', ''), 'search');
};
R.mood = c => sec(T('لوحة المزاج', 'Mood palette'), '<div class="sw-row">' + c.roles.map(r => swatch(r[1], L(r[0]))).join('') + '</div>', 'palette') +
  sec(T('ماذا تجمع في المود بورد؟ (12 مرجعًا)', 'What to collect (12 references)'), bullets([T('4 صور تصوير بنفس الطابع واللون', '4 photos with the same mood and colour'), T('3 أمثلة تيبوجرافي (عناوين وشعارات)', '3 typography examples (headlines, logos)'), T('3 أمثلة تغليف أو مطبوعات', '3 packaging or print examples'), T('2 خامات (ورق، خشب، قماش، معدن)', '2 textures (paper, wood, fabric, metal)')]), 'list') +
  sec(T('ابحث عن مراجع', 'Find references'), searchBox('mood', qBase(c) + ' ' + styleQ(c) + ' moodboard', ''), 'search');
R.colors = c => {
  const bg = c.isDark ? c.dark : c.light, hh = rgb2hsl(fromHex(c.primary));
  const harm = [[['متجاورة', 'Analogous'], [hslHex(hh[0] - 30, hh[1], hh[2]), c.primary, hslHex(hh[0] + 30, hh[1], hh[2])]], [['متكاملة', 'Complementary'], [c.primary, hslHex(hh[0] + 180, hh[1] * .9, hh[2])]], [['ثلاثية', 'Triadic'], [c.primary, hslHex(hh[0] + 120, hh[1] * .85, hh[2]), hslHex(hh[0] + 240, hh[1] * .85, hh[2])]], [['أحادية', 'Monochrome'], [hslHex(hh[0], hh[1], .2), hslHex(hh[0], hh[1], .38), c.primary, hslHex(hh[0], hh[1] * .8, .72), hslHex(hh[0], hh[1] * .6, .9)]]];
  const pairs = [[c.dark, c.light, T('نص داكن على فاتح', 'Dark text on light')], [c.light, c.dark, T('نص فاتح على داكن', 'Light text on dark')], [c.primary, bg, T('الأساسي على الخلفية', 'Primary on background')], [c.accent, bg, T('التمييز على الخلفية', 'Accent on background')]];
  return sec(T('لوحة ألوان البراند', 'Brand palette'), '<div class="sw-row">' + c.roles.map(r => swatch(r[1], L(r[0]) + ' · ' + nameOf(r[1]))).join('') + '</div>' +
    '<div class="ratio" title="60 / 30 / 10"><i style="flex:6;background:' + bg + '"></i><i style="flex:3;background:' + c.primary + '"></i><i style="flex:1;background:' + c.accent + '"></i></div><div class="hint">' + esc(T('نسبة الاستخدام المقترحة 60% خلفية · 30% الأساسي · 10% تمييز', 'Suggested usage 60% background · 30% primary · 10% accent')) + '</div>' +
    (c.A ? '' : '<div class="hint warn">' + esc(T('هذه ألوان افتراضية للطابع المختار — أضف صورة في البريف لاستخراج ألوانها الحقيقية.', 'Default colours for the chosen style — add an image to the brief to extract its real colours.')) + '</div>'), 'palette') +
    sec(T('فحص التباين (إمكانية القراءة)', 'Contrast check (legibility)'), '<div class="cp-list">' + pairs.map(x => { const r = contrast(x[0], x[1]); return '<div class="cp" style="background:' + x[1] + ';color:' + x[0] + '"><b>Aa</b><span>' + esc(x[2]) + '</span><em>' + r.toFixed(1) + ':1 · ' + (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA Large' : T('ضعيف', 'Low')) + '</em></div>'; }).join('') + '</div>', 'check') +
    sec(T('تناغمات بديلة', 'Alternative harmonies'), harm.map(h => '<div class="hm"><span>' + esc(L(h[0])) + '</span><div class="sw-mini">' + h[1].map(x => '<button style="background:' + x + '" data-sg="pin" data-type="color" data-v="' + x + '" title="' + x.toUpperCase() + '"></button>').join('') + '</div></div>').join(''), 'layers') +
    sec(T('ابحث عن لوحات', 'Find palettes'), searchBox('colors', qBase(c) + ' color palette ' + styleQ(c), c.prof.hunt), 'search');
};
R.fonts = c => {
  const pairs = c.prof.fonts, ai = (c.ai && c.ai.font_pairings || []).filter(x => x && x.heading_latin).map(x => [x.heading_latin, x.body_latin || x.heading_latin, x.heading_arabic || '', x.body_arabic || '', [x.why || '', x.why || ''], true]);
  const all = ai.concat(pairs); all.forEach(f => [f[0], f[1], f[2], f[3]].forEach(ensureFont));
  const sampleAr = /[؀-ۿ]/.test(c.brand) ? c.brand : 'اسم البراند', sampleEn = /[A-Za-z]/.test(c.brand) ? c.brand : 'Brand Name';
  return sec(T('أزواج خطوط مقترحة', 'Suggested font pairings'), '<div class="font-list">' + all.map((f, i) => {
    const data = { h: f[0], b: f[1], ah: f[2], ab: f[3] };
    return '<div class="font-card"><div class="fc-top"><span class="tag">' + (f[5] ? 'Claude' : T('اقتراح ', 'Option ') + (i - ai.length + 1)) + '</span>' + pinBtn('font', data) + '</div>' +
      '<div class="fc-ar" style="font-family:' + ffam(f[2], 'serif') + '" dir="rtl">' + esc(sampleAr) + '</div><div class="fc-ar2" style="font-family:' + ffam(f[3], 'serif') + '" dir="rtl">نص تجريبي لفقرة قصيرة يُظهر شكل الخط وسهولة قراءته.</div>' +
      '<div class="fc-en" style="font-family:' + ffam(f[0], 'serif') + '" dir="ltr">' + esc(sampleEn) + '</div><div class="fc-en2" style="font-family:' + ffam(f[1], 'sans') + '" dir="ltr">A short paragraph that shows how the typeface reads.</div>' +
      '<div class="hint">' + esc(f[2] + ' + ' + f[0] + ' · ' + f[3] + ' + ' + f[1]) + '</div><div class="hint">' + esc(L(f[4])) + '</div></div>';
  }).join('') + '</div>' + (conn.live() ? '' : '<div class="hint warn">' + esc(T('معاينة الخطوط تحتاج الخدمات المباشرة (الإعدادات ← الموصّلات).', 'Font previews need live services (Settings → Connectors).')) + '</div>'), 'heading') +
    sec(T('قواعد سريعة', 'Quick rules'), bullets([T('خطان فقط: واحد للعناوين وواحد للنصوص (لكل لغة).', 'Two faces only: one for headlines, one for text (per language).'), T('اجعل حجم العنوان ضعف النص تقريبًا على الأقل.', 'Make headlines at least about twice the text size.'), T('لا تخلط أكثر من طابع واحد زخرفي.', 'Never mix more than one decorative style.')]), 'list') +
    sec(T('ابحث عن خطوط', 'Find fonts'), searchBox('fonts', 'arabic ' + styleQ(c), ''), 'search');
};
R.icons = c => {
  const words = ((c.ai && c.ai.icon_keywords_en && c.ai.icon_keywords_en.length) ? c.ai.icon_keywords_en : c.subj.icons).slice(0, 4);
  return sec(T('أسلوب الأيقونات', 'Icon style'), '<p>' + esc(L(c.prof.icon.spec)) + '</p><div class="hint">' + esc(T('مجموعة مقترحة: ', 'Suggested set: ') + c.prof.icon.pre + ' · ' + T('اضغط أيقونة لإضافتها لهويتك', 'tap an icon to add it to your identity')) + '</div>', 'star') +
    sec(T('أيقونات مناسبة لمجالك', 'Icons for your sector'), '<div class="ic-grid" data-icons data-words="' + esc(words.join(',')) + '"><div class="hint">' + esc(T('جارٍ التحميل…', 'Loading…')) + '</div></div><div class="hint">' + esc(T('الكلمات: ', 'Words: ') + words.join(', ')) + '</div>', 'grid') +
    sec(T('ابحث عن أيقونات', 'Find icons'), searchBox('icons', words[0] + ' icon', ''), 'search');
};
R.imagestyle = c => {
  const lo = c.dark, hi = c.accent;
  return sec(T('اتجاه التصوير', 'Photo direction'), bullets(c.prof.image.map(L)) + '<p class="hint">' + esc(T('عناصر مساعدة: ', 'Props: ') + L(c.subj.props)) + '</p>', 'image') +
    sec(T('تلوين الصور (Colour grade)', 'Colour grade'), '<div class="grade"><span style="background:' + lo + ';color:' + inkOn(lo) + '">' + esc(T('الظلال', 'Shadows')) + ' ' + lo.toUpperCase() + '</span><span style="background:' + hi + ';color:' + inkOn(hi) + '">' + esc(T('الإضاءات', 'Highlights')) + ' ' + hi.toUpperCase() + '</span></div><div class="hint">' + esc(T('في Photoshop: Color Balance أو Gradient Map بهذين اللونين مع تقليل الشفافية إلى 20–30%.', 'In Photoshop: Color Balance or a Gradient Map with these two colours at 20–30% opacity.')) + '</div>', 'palette') +
    aiList(c, 'image_direction') + sec(T('ابحث عن مراجع تصوير', 'Find photo references'), searchBox('imagestyle', qBase(c) + ' photography ' + styleQ(c), ''), 'search');
};
R.logo = c => {
  const fnt = c.prof.fonts[0], sA = /[؀-ۿ]/.test(c.brand) ? c.brand : 'شعار'; ensureFont(fnt[2]);
  const tile = (bg, fg) => '<div class="lg-tile" style="background:' + bg + ';color:' + fg + ';font-family:' + ffam(fnt[2], 'serif') + '" dir="rtl">' + esc(sA) + '</div>';
  return sec(T('اتجاهات الشعار', 'Logo directions'), '<div class="sg-cards">' + c.prof.logo.map(x => '<div class="sg-card"><p>' + esc(L(x)) + '</p>' + pinBtn('note', L(x)) + '</div>').join('') + (c.subj.logo || []).map(x => '<div class="sg-card hl"><b>' + I('sparkles', 'xs') + ' ' + esc(L(x)) + '</b>' + pinBtn('note', L(x)) + '</div>').join('') + '</div>' + aiList(c, 'logo_directions'), 'sparkles') +
    sec(T('أنماط الخط العربي المناسبة', 'Arabic calligraphy styles'), '<div class="tags">' + c.prof.cal.map((x, i) => '<span class="tag">' + esc(lg() ? c.prof.calEn[i] : x) + '</span>').join('') + '</div>', 'pencil') +
    sec(T('نسخ الألوان للشعار', 'Logo colour versions'), '<div class="lg-row">' + tile(c.dark, c.light) + tile(c.light, c.dark) + tile(c.primary, inkOn(c.primary)) + '</div>' + bullets([T('احتفظ بنسخة أحادية اللون (أبيض / أسود).', 'Keep a one-colour version (white / black).'), T('اترك حول الشعار مساحة آمنة لا تقل عن ارتفاع أول حرف.', 'Leave clear space of at least the height of the first letter.'), T('اختبر الشعار بحجم 24px قبل اعتماده.', 'Test the logo at 24px before approving.')]), 'layers') +
    sec(T('ابحث عن شعارات', 'Find logo references'), searchBox('logo', qBase(c) + ' logo arabic calligraphy ' + styleQ(c), ''), 'search');
};
R.slogan = c => {
  const own = c.prof.slog.map(s => L(s).replace(/\{B\}/g, c.brand)), ai = (c.ai && (lg() ? c.ai.slogans_en : c.ai.slogans_ar)) || [];
  const card = (s, a) => '<div class="sg-card' + (a ? ' hl' : '') + '"><b>' + (a ? I('sparkles', 'xs') + ' ' : '') + esc(s) + '</b>' + pinBtn('note', s) + '</div>';
  return sec(T('جمل مقترحة', 'Tagline ideas'), '<div class="sg-cards">' + ai.map(s => card(String(s), true)).join('') + own.map(s => card(s)).join('') + '</div><div class="hint">' + esc(T('كلمات النبرة: ', 'Tone words: ') + c.prof.tone.map(x => L(x)).join(' · ')) + '</div>', 'sparkles') +
    sec(T('نصائح للكتابة', 'Writing tips'), bullets([T('من 3 إلى 6 كلمات.', '3 to 6 words.'), T('فكرة واحدة ووعد واحد.', 'One idea, one promise.'), T('جرّبها بصوت عالٍ: هل تُنطق بسهولة؟', 'Say it out loud: does it flow?')]), 'list') + sec(T('ابحث عن أمثلة', 'Find examples'), searchBox('slogan', qBase(c) + ' tagline', ''), 'search');
};
R.main = c => sec(T('تكوينات مقترحة للتصميم الرئيسي', 'Key-visual compositions'), '<div class="wf-row">' + c.prof.comp.map(id => '<div class="wf-card">' + wf(id, c) + '<b>' + esc(L(COMP_N[id])) + '</b></div>').join('') + '</div>', 'layers') +
  sec(T('قواعد التكوين', 'Composition rules'), bullets([T('نقطة تركيز واحدة: المنتج أو العنوان، وليس الاثنين بنفس القوة.', 'One focal point: the product or the headline, not both at equal weight.'), T('اترك 8–10% هوامش حول الكادر.', 'Leave 8–10% margins around the frame.'), T('الشعار في ركن ثابت في كل التصاميم.', 'Place the logo in the same corner across designs.')]), 'list') +
  aiList(c, 'template_notes') + sec(T('ابحث عن مراجع', 'Find references'), searchBox('main', qBase(c) + ' key visual poster ' + styleQ(c), ''), 'search');
R.templates = c => sec(T('شبكات الفيد المقترحة (3×3)', 'Suggested feed grids (3×3)'), '<div class="wf-row">' + c.prof.grid.map(id => '<div class="wf-card">' + gridWf(id, c) + '<b>' + esc(L(GRID_N[id])) + '</b></div>').join('') + '</div>', 'grid') +
  sec(T('المقاسات', 'Sizes'), '<table class="sg-tbl"><tr><td>Post</td><td>1080 × 1350 (4:5)</td></tr><tr><td>Square</td><td>1080 × 1080</td></tr><tr><td>Story / Reel</td><td>1080 × 1920 (' + esc(T('اترك 250px أعلى وأسفل بلا نص', 'keep 250px top and bottom free of text')) + ')</td></tr><tr><td>Carousel</td><td>1080 × 1350</td></tr></table>', 'maximize') +
  sec(T('نظام القالب', 'Template system'), bullets([T('هامش ثابت 64px وشبكة من 12 عمودًا.', 'A fixed 64px margin and a 12-column grid.'), T('ثلاثة أحجام نص فقط: عنوان، فرعي، تفاصيل.', 'Three text sizes only: headline, sub, detail.'), T('لونان للخلفية بالتناوب + لون تمييز للأزرار.', 'Two alternating backgrounds + an accent for buttons.')]), 'list') +
  aiList(c, 'template_notes') + sec(T('ابحث عن قوالب', 'Find templates'), searchBox('templates', 'instagram feed template ' + qBase(c), ''), 'search');
R.static = c => sec(T('8 تصاميم مقترحة للحملة', '8 suggested campaign designs'), '<div class="sg-posts">' + K.posts.map(x => '<div class="post-card">' + wf(x[3], c) + '<div><b>' + esc(L(x)) + '</b><span class="tag">' + esc(x[2]) + '</span><p class="hint">' + esc(L(x[4])) + '</p></div>' + pinBtn('note', L(x) + ' — ' + x[2]) + '</div>').join('') + '</div>', 'image') +
  sec(T('ابحث عن أمثلة', 'Find examples'), searchBox('static', qBase(c) + ' social media post design ' + styleQ(c), ''), 'search');
R.motion = c => sec(T('اتجاه الحركة', 'Motion direction'), bullets(c.prof.motion.map(L)), 'play') +
  sec(T('هيكل ريلز 15 ثانية', '15-second reel structure'), '<div class="tl"><div style="flex:2"><b>0–2s</b><span>' + esc(T('خطّاف: لقطة قوية', 'Hook: a strong shot')) + '</span></div><div style="flex:6"><b>2–8s</b><span>' + esc(T('المنتج والتفاصيل', 'Product and details')) + '</span></div><div style="flex:5"><b>8–13s</b><span>' + esc(T('الهوية والرسالة', 'Brand and message')) + '</span></div><div style="flex:2"><b>13–15s</b><span>CTA</span></div></div><div class="hint">1080×1920 · ' + (c.pid === 'luxury' ? '24' : '30') + ' fps</div>', 'clock') +
  aiList(c, 'motion') + sec(T('ابحث عن أمثلة', 'Find examples'), searchBox('motion', qBase(c) + ' reel motion graphics ' + styleQ(c), ''), 'search');
R.printing = c => sec(T('اتجاه الطباعة', 'Print direction'), bullets(c.prof.print.map(L)), 'doc') +
  sec(T('قيم CMYK تقريبية للألوان', 'Approximate CMYK values'), '<table class="sg-tbl">' + c.roles.map(r => { const k = cmyk(r[1]); return '<tr><td><i class="dot" style="background:' + r[1] + '"></i>' + esc(L(r[0])) + '</td><td dir="ltr">C' + k[0] + ' M' + k[1] + ' Y' + k[2] + ' K' + k[3] + '</td></tr>'; }).join('') + '</table><div class="hint">' + esc(T('تحويل تقريبي؛ اعتمد الألوان النهائية من Illustrator مع ملف ICC للمطبعة. الألوان الزاهية تبهت عند الطباعة.', 'A rough conversion; confirm final colours in Illustrator with the printer ICC profile. Vivid colours dull in print.')) + '</div>', 'palette') +
  sec(T('مواصفات سريعة', 'Quick specs'), bullets([T('Bleed 3mm و Safe area 5mm.', '3mm bleed and 5mm safe area.'), T('دقة 300dpi وملف CMYK.', '300dpi and CMYK file.'), T('بطاقة عمل 90×50mm، قائمة A5 أو A4.', 'Business card 90×50mm, menu A5 or A4.')]), 'list') + aiList(c, 'print') +
  sec(T('ابحث عن أمثلة', 'Find examples'), searchBox('printing', qBase(c) + ' packaging print design ' + styleQ(c), ''), 'search');
R.mockups = c => sec(T('مشاهد موك أب مناسبة', 'Suitable mockup scenes'), '<div class="tags">' + c.subj.mock.map(x => '<span class="tag">' + esc(L(x)) + '</span>').join('') + '</div>', 'layers') + aiList(c, 'mockups') +
  sec(T('ابحث عن موك أب', 'Find mockups'), searchBox('mockups', qBase(c) + ' mockup', ''), 'search');
R.generic = c => R.colors(c) + R.fonts(c);
R.foundations = c => R.colors(c) + R.fonts(c) + R.icons(c) + R.imagestyle(c);
R.onscreen = c => R.static(c) + R.motion(c);

/* ---------- modal ---------- */
let cur = null;
async function open(p, step){
  cur = { p, stepId: step.id, busy: '' };
  const m = MSA.modal({ title: T('الاقتراحات', 'Suggestions'), size: 'wide sgm', footer: false, body: '<div id="sgRoot"></div>' });
  cur.m = m; const root = $('#sgRoot', m.el);
  const refs = refImages(p);
  if (refs.length && (!p.analysis || p.analysis.sig !== sigOf(refs))) { cur.busy = T('جارٍ تحليل صورة البريف…', 'Analysing the brief image…'); draw(root); try { await analyze(p); MSA.save(); } catch (e) {} cur.busy = ''; }
  else if (!refs.length && p.analysis) { p.analysis = null; }
  draw(root); bindRoot(root);
}
function draw(root){
  if (!document.body.contains(root)) return;
  const { p } = cur, c = context(p), step = P.find(p.steps, cur.stepId); if (!step) return; const s = step.step;
  const keys = []; P.walk(p.steps, x => keys.push(x));
  const refs = refImages(p), top = c.inf.top;
  const chip = id => '<button class="pchip' + (id === c.pid ? ' on' : '') + '" data-sg="profile" data-id="' + id + '">' + (top[0] === id ? '★ ' : '') + esc(L(K.profiles[id].name)) + '</button>';
  const head = '<div class="sg-head">' +
    '<div class="sg-top"><select id="sgStep" aria-label="step">' + keys.map(x => '<option value="' + x.id + '"' + (x.id === s.id ? ' selected' : '') + '>' + esc(P.title(x)) + '</option>').join('') + '</select>' +
    '<div class="row"><button class="btn sm" data-sg="addref">' + I('camera', 'sm') + esc(T('إضافة صورة مرجعية', 'Add reference image')) + '</button>' + (refs.length ? '<button class="btn sm" data-sg="reanalyze">' + I('repeat', 'sm') + esc(T('إعادة التحليل', 'Re-analyse')) + '</button>' : '') +
    '<button class="btn sm" data-sg="identity">' + I('palette', 'sm') + esc(T('هويتي البصرية', 'My identity')) + '<span class="cnt">' + ((p.identity ? p.identity.colors.length + p.identity.fonts.length + p.identity.icons.length + p.identity.notes.length : 0)) + '</span></button></div></div>' +
    '<div class="sg-ref">' + (refs.length ? '<div class="thumbs">' + refs.slice(0, 4).map(a => '<img data-thumb="' + a.id + '" alt="">').join('') + '</div>' : '') +
      (c.A ? '<div class="sw-mini big">' + c.A.cols.slice(0, 7).map(x => '<button style="background:' + x.hex + ';flex:' + Math.max(1, Math.round(x.share * 10)) + '" data-sg="copy" data-v="' + x.hex + '" title="' + x.hex.toUpperCase() + '"></button>').join('') + '</div>' : '') + '</div>' +
    '<div class="sg-brand"><label>' + esc(T('اسم البراند', 'Brand name')) + '<input type="text" id="sgBrand" dir="auto" value="' + esc(c.brand) + '"></label><span class="muted">' + esc(L(c.subj.name)) + '</span></div>' +
    '<div class="pchips">' + Object.keys(K.profiles).map(chip).join('') + '</div>' +
    (cur.busy ? '<div class="sg-busy">' + I('sparkles', 'sm') + esc(cur.busy) + '</div>' : '') + '</div>';
  const fn = R[s.key] || R.generic;
  const stepNote = '<div class="sg-for">' + esc(T('اقتراحات لخطوة: ', 'Suggestions for: ')) + '<b>' + esc(P.title(s)) + '</b></div>';
  root.innerHTML = head + stepNote + '<div class="sg-body">' + fn(c) + '</div>';
  MSA.hydrateAtts(root); fillIcons(root, c);
}
function bindRoot(root){
  const redraw = () => draw(root), save = () => MSA.save();
  root.addEventListener('change', e => { if (e.target.id === 'sgStep') { cur.stepId = e.target.value; draw(root); } });
  root.addEventListener('input', e => {
    if (e.target.id === 'sgBrand') { cur.p.brand = e.target.value.trim(); save(); return; }
    const sb = e.target.closest('.sg-search'); if (sb && e.target.tagName === 'INPUT') { sb.querySelector('.chips').innerHTML = conn.chipsHTML(sb.dataset.scope, e.target.value, { tag: sb.dataset.tag }); }
  });
  root.addEventListener('focusout', e => { if (e.target.id === 'sgBrand') redraw(); });
  root.addEventListener('click', async e => {
    const b = e.target.closest('[data-sg]'); if (!b) return; const a = b.dataset.sg, p = cur.p;
    if (a === 'profile') { p.profile = b.dataset.id; save(); redraw(); }
    else if (a === 'copy') { try { await navigator.clipboard.writeText(b.dataset.v); MSA.toast(T('تم النسخ: ', 'Copied: ') + b.dataset.v); } catch (x) { MSA.toast(b.dataset.v); } }
    else if (a === 'pin') pin(p, b.dataset.type, b.dataset.type === 'font' ? JSON.parse(b.dataset.v) : b.dataset.v);
    else if (a === 'identity') openIdentity(p);
    else if (a === 'explore') { const sb = b.closest('.sg-search'), sc = sb.dataset.scope, q = sb.querySelector('input').value.trim(); const tabOf = { colors: 'colors', fonts: 'fonts', icons: 'icons' }; if (MSA.explore) MSA.explore.open(p, { tab: tabOf[sc] || 'images', q, stepId: cur.stepId }); }
    else if (a === 'reanalyze') { cur.busy = T('جارٍ التحليل…', 'Analysing…'); redraw(); await analyze(p); save(); cur.busy = ''; redraw(); }
    else if (a === 'addref') {
      const tgt = (() => { let t = null; P.walk(p.steps, s => { if (!t && s.key === 'brief') t = s; }); return t || p.steps[0]; })(); if (!tgt) return;
      const atts = await MSA.addFiles('image'); if (!atts.length) return; tgt.atts.push(...atts); save(); MSA.updateCounts && MSA.updateCounts();
      cur.busy = T('جارٍ تحليل الصورة…', 'Analysing the image…'); redraw(); await analyze(p); save(); cur.busy = ''; redraw(); MSA.rerender && MSA.rerender(true);
    }
    else if (a === 'append') { let t = null; P.walk(p.steps, s => { if (!t && s.key === 'brief') t = s; }); if (t) { t.note = (t.note ? t.note + '\n\n' : '') + b.dataset.v; save(); MSA.toast(T('أُضيف إلى ملاحظات البريف', 'Added to the brief note')); MSA.rerender && MSA.rerender(true); } }
  });
}
function pin(p, type, v, quiet){
  const id = p.identity = p.identity || { colors: [], fonts: [], icons: [], notes: [], images: [] }; ['colors', 'fonts', 'icons', 'notes', 'images'].forEach(k => id[k] = id[k] || []);
  const list = type === 'color' ? id.colors : type === 'font' ? id.fonts : type === 'icon' ? id.icons : type === 'image' ? id.images : id.notes;
  const key = x => (typeof x === 'string' ? x.toLowerCase() : type === 'image' ? x.full : JSON.stringify(x));
  if (list.some(x => key(x) === key(v))) { if (!quiet) MSA.toast(T('موجود بالفعل في هويتك', 'Already in your identity')); return; }
  list.push(type === 'color' ? v.toLowerCase() : v); MSA.save(); if (!quiet) MSA.toast(T('أُضيف إلى هويتك البصرية', 'Added to your visual identity'), 'ok');
  if (cur && cur.m && document.body.contains(cur.m.el)) { const btn = $('.sg-top .cnt', cur.m.el); if (btn) btn.textContent = id.colors.length + id.fonts.length + id.icons.length + id.notes.length + id.images.length; }
}

/* ---------- identity board ---------- */
function openIdentity(p){
  const id = p.identity = p.identity || { colors: [], fonts: [], icons: [], notes: [], images: [] }; ['colors', 'fonts', 'icons', 'notes', 'images'].forEach(k => id[k] = id[k] || []);
  const m = MSA.modal({ title: T('الهوية البصرية — ', 'Visual identity — ') + brandOf(p), size: 'wide sgm', footer: false, body: '<div id="idRoot"></div>' }); const root = $('#idRoot', m.el);
  const prim = id.colors[0] || '#888888';
  const rm = (k, i) => '<button class="icon-btn sm danger" data-id-rm="' + k + ':' + i + '" aria-label="remove">' + I('x', 'sm') + '</button>';
  function render(){
    id.fonts.forEach(f => [f.h, f.b, f.ah, f.ab].forEach(ensureFont));
    const empty = !(id.colors.length + id.fonts.length + id.icons.length + id.notes.length + id.images.length);
    root.innerHTML = empty ? MSA.empty('palette', T('لا شيء بعد', 'Nothing yet'), T('اضغط على 📌 في أي اقتراح لإضافته هنا.', 'Tap the pin on any suggestion to add it here.')) :
      (id.colors.length ? sec(T('الألوان', 'Colours'), '<div class="sw-row">' + id.colors.map((x, i) => '<div class="sw-card"><button class="sw-c" data-sg="copy" data-v="' + x + '" style="background:' + x + ';color:' + inkOn(x) + '">' + x.toUpperCase() + '</button><span class="sw-n">' + esc(nameOf(x)) + '</span>' + rm('colors', i) + '</div>').join('') + '</div>', 'palette') : '') +
      (id.fonts.length ? sec(T('الخطوط', 'Fonts'), '<div class="font-list">' + id.fonts.map((f, i) => [f, i]).sort((a, b) => (b[0].fav ? 1 : 0) - (a[0].fav ? 1 : 0)).map(([f, i]) => '<div class="font-card' + (f.fav ? ' is-fav' : '') + '"><div class="fc-top"><span class="tag">' + esc(f.ah === f.h ? f.h : f.ah + ' + ' + f.h) + '</span><span class="grow"></span><button class="icon-btn sm fav-btn ' + (f.fav ? 'on' : '') + '" data-id-fav="' + i + '" aria-pressed="' + !!f.fav + '" title="' + esc(T(f.fav ? 'إزالة من المفضلة' : 'إضافة للمفضلة', f.fav ? 'Remove from favourites' : 'Add to favourites')) + '">' + I('star', 'sm') + '</button>' + rm('fonts', i) + '</div><div class="fc-ar" dir="rtl" style="font-family:' + ffam(f.ah, 'serif') + '">' + esc(/[؀-ۿ]/.test(brandOf(p)) ? brandOf(p) : 'اسم البراند') + '</div><div class="fc-en" dir="ltr" style="font-family:' + ffam(f.h, 'serif') + '">' + esc(/[A-Za-z]/.test(brandOf(p)) ? brandOf(p) : 'Brand Name') + '</div><div class="fc-en2" dir="ltr" style="font-family:' + ffam(f.b, 'sans') + '">' + esc(f.b) + ' · ' + esc(f.ab) + '</div></div>').join('') + '</div>', 'heading') : '') +
      (id.icons.length ? sec(T('الأيقونات', 'Icons'), '<div class="ic-grid">' + id.icons.map((x, i) => { const [pf, nm] = x.split(':'); return '<div class="ic-card"><img alt="' + esc(nm) + '" src="https://api.iconify.design/' + pf + '/' + nm + '.svg?color=' + encodeURIComponent(prim) + '&height=34">' + rm('icons', i) + '</div>'; }).join('') + '</div>', 'star') : '') +
      (id.images.length ? sec(T('صور مرجعية', 'Reference images'), '<div class="ex-grid ex-small">' + id.images.map((x, i) => '<figure class="ex-card"><img loading="lazy" referrerpolicy="no-referrer" alt="" src="' + esc(x.thumb) + '"><figcaption><span class="ex-cr" dir="auto">' + esc(x.credit || x.title || x.src || '') + '</span><span class="ex-ac">' + rm('images', i) + '</span></figcaption></figure>').join('') + '</div>', 'image') : '') +
      (id.notes.length ? sec(T('ملاحظات واتجاهات', 'Notes & directions'), '<div class="sg-cards">' + id.notes.map((x, i) => '<div class="sg-card"><p>' + esc(x) + '</p>' + rm('notes', i) + '</div>').join('') + '</div>', 'note') : '') +
      '<div class="sg-actions"><button class="btn sm" data-id-explore>' + I('search', 'sm') + esc(T('استكشاف وإضافة', 'Explore & add')) + '</button><button class="btn sm" data-id-css>' + I('copy', 'sm') + esc(T('نسخ كمتغيّرات CSS', 'Copy as CSS variables')) + '</button></div>';
  }
  render();
  root.addEventListener('click', async e => {
    const fv = e.target.closest('[data-id-fav]'); if (fv) { const f = id.fonts[+fv.dataset.idFav]; if (f) { f.fav = !f.fav; if (!f.fav) delete f.fav; MSA.save(); render(); } return; }
    const r = e.target.closest('[data-id-rm]'); if (r) { const [k, i] = r.dataset.idRm.split(':'); id[k].splice(+i, 1); MSA.save(); render(); return; }
    const cp = e.target.closest('[data-sg=copy]'); if (cp) { try { await navigator.clipboard.writeText(cp.dataset.v); MSA.toast(T('تم النسخ', 'Copied')); } catch (x) {} return; }
    if (e.target.closest('[data-id-explore]')) { MSA.explore && MSA.explore.open(p, {}); return; }
    if (e.target.closest('[data-id-css]')) {
      const css = ':root{\n' + id.colors.map((x, i) => '  --brand-' + (i + 1) + ': ' + x + ';').join('\n') + (id.fonts[0] ? '\n  --font-heading: "' + id.fonts[0].h + '", "' + id.fonts[0].ah + '", serif;\n  --font-body: "' + id.fonts[0].b + '", "' + id.fonts[0].ab + '", sans-serif;' : '') + '\n}';
      try { await navigator.clipboard.writeText(css); MSA.toast(T('تم نسخ CSS', 'CSS copied')); } catch (x) { MSA.toast(css); }
    }
  });
}

MSA.suggest = { open, openIdentity, analyze, context, pin };
})();

