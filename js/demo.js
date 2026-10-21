/* Demo project: a complete "Finjan café" campaign, from brief to delivery — all artwork is vector (SVG) drawn here */
(function(){
const MSA = window.MSA, U = MSA.u, T = (a, e) => MSA.T(a, e);
const ESP = '#2B1B14', COP = '#B8693A', GOLD = '#C5A168', CREAM = '#F4E9D8', TERRA = '#C8503C', MILK = '#FBF5EA';
const AR = "Amiri,'Noto Naskh Arabic','Noto Sans Arabic','Segoe UI','DejaVu Sans',serif";
const LA = "'Cormorant Garamond','Playfair Display',Georgia,serif";
const SA = "Cairo,'Noto Sans Arabic','Segoe UI','DejaVu Sans',sans-serif";
const svg = (w, h, inner, defs) => '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><defs>' + (defs || '') + '</defs>' + inner + '</svg>';
const lg = (id, a, b, x2, y2) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
const rg = (id, a, b) => '<radialGradient id="' + id + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '" stop-opacity="0"/></radialGradient>';
const txt = (x, y, s, size, fill, o) => { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" text-anchor="' + (o.a || 'middle') + '" font-family="' + (o.f || AR) + '"' + (o.w ? ' font-weight="' + o.w + '"' : '') + (o.ls ? ' letter-spacing="' + o.ls + '"' : '') + (o.op ? ' opacity="' + o.op + '"' : '') + (o.dir ? ' direction="' + o.dir + '"' : '') + '>' + s + '</text>'; };
function cup(cx, cy, s, o){
  o = o || {}; const body = o.body || CREAM, cof = o.coffee || '#3a2218', sau = o.saucer || '#E3D3BA', st = o.steam === false ? '' :
    '<g fill="none" stroke="' + (o.steamC || '#fff') + '" stroke-width="5" stroke-linecap="round" opacity=".55"><path d="M-22 -58 C-36 -80 -8 -92 -22 -116"/><path d="M4 -62 C-10 -86 18 -98 4 -124"/><path d="M30 -58 C16 -80 42 -92 30 -112"/></g>';
  return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + s + ')"><ellipse cx="0" cy="62" rx="98" ry="16" fill="#000" opacity=".16"/><ellipse cx="0" cy="56" rx="92" ry="15" fill="' + sau + '"/><ellipse cx="0" cy="52" rx="62" ry="9" fill="#00000014"/>' +
    '<path d="M62 -22 H80 C106 -22 104 22 70 22" fill="none" stroke="' + body + '" stroke-width="11" stroke-linecap="round"/><path d="M-62 -34 H62 V8 C62 42 34 58 0 58 C-34 58 -62 42 -62 8 Z" fill="' + body + '"/><path d="M-62 -34 H62 V8 C62 42 34 58 0 58" fill="none" stroke="#00000012" stroke-width="3"/>' +
    '<ellipse cx="0" cy="-34" rx="62" ry="11" fill="' + body + '"/><ellipse cx="0" cy="-33" rx="54" ry="8.5" fill="' + cof + '"/><ellipse cx="-14" cy="-35" rx="20" ry="3" fill="#fff" opacity=".12"/>' + st + '</g>';
}
const bean = (x, y, r, rot, c) => '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><ellipse rx="' + r + '" ry="' + r * .66 + '" fill="' + (c || '#4a2c1c') + '"/><path d="M' + (-r * .9) + ' 0 C' + (-r * .3) + ' ' + (-r * .3) + ' ' + (r * .3) + ' ' + (r * .3) + ' ' + (r * .9) + ' 0" fill="none" stroke="#00000066" stroke-width="' + r * .12 + '"/></g>';
const beans = (w, h, n, seed, c) => { let o = '', x = seed; const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < n; i++) o += bean(rnd() * w, rnd() * h, 16 + rnd() * 14, rnd() * 180, c || (rnd() > .5 ? '#4a2c1c' : '#3a2015')); return o; };
const seal = (cx, cy, r, fg, bg) => '<g><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + bg + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 8) + '" fill="none" stroke="' + fg + '" stroke-width="3"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 15) + '" fill="none" stroke="' + fg + '" stroke-width="1" stroke-dasharray="2 5"/>' +
  cup(cx, cy - r * .12, r / 230, { body: fg, coffee: bg, saucer: fg, steam: false, steamC: fg }) + txt(cx, cy + r * .52, 'فنجان', r * .34, fg, { w: 700 }) + txt(cx, cy + r * .72, 'FINJAN · CAFÉ', r * .09, fg, { f: LA, ls: r * .02 }) + '</g>';
const frame = (w, h, c, m) => '<rect x="' + m + '" y="' + m + '" width="' + (w - 2 * m) + '" height="' + (h - 2 * m) + '" fill="none" stroke="' + c + '" stroke-width="2"/><rect x="' + (m + 8) + '" y="' + (m + 8) + '" width="' + (w - 2 * m - 16) + '" height="' + (h - 2 * m - 16) + '" fill="none" stroke="' + c + '" stroke-width=".8" opacity=".6"/>';

const ART = {};
ART.brief = () => svg(600, 600, '<rect width="600" height="600" fill="url(#g)"/><ellipse cx="300" cy="470" rx="250" ry="40" fill="#000" opacity=".12"/><circle cx="300" cy="260" r="210" fill="url(#h)"/>' + cup(300, 330, 1.85) + beans(600, 600, 14, 7).replace(/<g /g, '<g opacity=".9" '), lg('g', '#E9D6B8', '#B98B5C') + rg('h', '#fff6e0', '#fff6e0'));
ART.idea = () => svg(800, 500, '<rect width="800" height="500" fill="' + MILK + '"/>' + frame(800, 500, COP, 18) + txt(400, 120, 'فنجان.. طعم الأصالة', 64, ESP, { w: 700 }) + txt(400, 170, 'THE FLAVOUR OF HERITAGE', 20, COP, { f: LA, ls: 6 }) +
  '<g stroke="' + COP + '" stroke-width="2" fill="none" stroke-dasharray="6 6"><path d="M130 260 C230 220 300 330 400 290 S560 240 670 300"/></g>' + cup(400, 350, .9, { steam: true, steamC: COP }) +
  [['فخامة هادئة', 130, 270], ['ضيافة عربية', 670, 270], ['قهوة مختصة', 215, 410], ['دفء وذكريات', 590, 410]].map(a => '<g><rect x="' + (a[1] - 70) + '" y="' + (a[2] - 22) + '" width="140" height="40" rx="20" fill="' + CREAM + '" stroke="' + GOLD + '"/>' + txt(a[1], a[2] + 6, a[0], 20, ESP, { f: SA }) + '</g>').join(''));
const moods = [
  () => svg(500, 500, '<rect width="500" height="500" fill="#2b1a12"/>' + beans(500, 500, 70, 3) + '<rect width="500" height="500" fill="url(#v)"/>' + txt(250, 450, 'حبوب · تحميص غامق', 26, CREAM, { f: SA, op: .9 }), '<radialGradient id="v" cx=".5" cy=".5" r=".7"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></radialGradient>'),
  () => svg(500, 500, '<rect width="500" height="500" fill="url(#g)"/><circle cx="360" cy="150" r="130" fill="url(#h)"/>' + cup(250, 330, 1.3, { body: '#F8EEDB' }) + txt(250, 465, 'ضوء نافذة دافئ', 26, CREAM, { f: SA }), lg('g', '#D9A066', '#6e3a1e') + rg('h', '#ffe6b0', '#ffe6b0')),
  () => svg(500, 500, '<rect width="500" height="500" fill="' + CREAM + '"/>' + frame(500, 500, COP, 22) + '<g fill="none" stroke="' + COP + '" stroke-width="2.5"><path d="M250 120 C200 120 170 160 210 190 C240 212 250 230 250 250 C250 230 260 212 290 190 C330 160 300 120 250 120Z"/><circle cx="250" cy="250" r="8" fill="' + COP + '"/><path d="M150 330 H350 M180 350 H320"/></g>' + txt(250, 430, 'زخرفة عربية تراثية', 26, ESP, { f: SA }), ''),
  () => svg(500, 500, '<rect width="500" height="500" fill="#1d120d"/>' + [[120, 140, 90], [330, 110, 60], [400, 260, 110], [180, 330, 70], [300, 400, 50], [70, 400, 40]].map(c => '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="url(#o)"/>').join('') + txt(250, 462, 'إضاءة ذهبية ناعمة', 26, GOLD, { f: SA }), rg('o', '#ffcf7a', '#ffcf7a'))
];
ART.palette = () => { const cs = [['إسبريسو', ESP, '#2B1B14'], ['نحاسي', COP, '#B8693A'], ['ذهبي', GOLD, '#C5A168'], ['كريمي', CREAM, '#F4E9D8'], ['تيراكوتا', TERRA, '#C8503C']];
  return svg(800, 450, '<rect width="800" height="450" fill="' + MILK + '"/>' + cs.map((c, i) => '<rect x="' + (30 + i * 148) + '" y="40" width="130" height="260" rx="14" fill="' + c[1] + '" stroke="#0002"/>' + txt(95 + i * 148, 335, c[0], 24, ESP, { f: SA, w: 700 }) + txt(95 + i * 148, 365, c[2], 18, '#6a5a50', { f: 'monospace' })).join('') + txt(400, 420, 'لوحة ألوان فنجان — 60% كريمي · 30% إسبريسو · 10% نحاسي', 20, '#6a5a50', { f: SA })); };
ART.fonts = () => svg(800, 450, '<rect width="800" height="450" fill="' + ESP + '"/>' + txt(400, 120, 'فنجان', 100, CREAM, { w: 700 }) + txt(400, 170, 'Amiri — العناوين العربية', 22, GOLD, { f: SA }) + txt(400, 250, 'Finjan Café', 70, CREAM, { f: LA, w: 600 }) + txt(400, 292, 'Cormorant Garamond — Latin headlines', 20, GOLD, { f: SA }) +
  txt(400, 350, 'قهوة تُحمَّص بحب وتُقدَّم بأصالة', 28, '#e8dcc6', { f: SA }) + txt(400, 388, 'Cairo (نصوص) · Lora (text)', 18, '#a99a85', { f: SA }));
ART.icons = () => { const I = [
  '<path d="M-26 -14 H26 V6 C26 24 12 34 0 34 C-12 34 -26 24 -26 6Z M26 -6 H34 C44 -6 44 14 30 14"/><path d="M-12 -24 C-18 -34 -6 -38 -12 -48 M6 -24 C0 -34 12 -38 6 -48"/>',
  '<ellipse rx="26" ry="36" transform="rotate(30)"/><path d="M-14 -22 C4 -8 -4 8 14 22" />',
  '<path d="M0 -40 C20 -16 28 -2 28 14 C28 30 15 40 0 40 C-15 40 -28 30 -28 14 C-28 -2 -20 -16 0 -40Z"/><path d="M0 40 C-8 24 8 12 0 -6"/>',
  '<path d="M-30 -10 H30 L22 34 H-22Z M-24 -10 C-24 -26 24 -26 24 -10"/><path d="M-30 4 H30"/>',
  '<circle r="30"/><path d="M0 -30 V-40 M0 30 V40 M-30 0 H-40 M30 0 H40"/><path d="M-10 -10 L0 0 L12 8"/>',
  '<path d="M-34 -6 C-34 -34 34 -34 34 -6 Z M-38 -6 H38 V6 H-38Z M-30 6 L-24 30 H24 L30 6"/>'];
  return svg(800, 450, '<rect width="800" height="450" fill="' + MILK + '"/>' + I.map((p, i) => { const x = 140 + (i % 3) * 260, y = 130 + Math.floor(i / 3) * 170; return '<g transform="translate(' + x + ' ' + y + ')"><rect x="-70" y="-70" width="140" height="140" rx="26" fill="' + CREAM + '" stroke="' + GOLD + '"/><g fill="none" stroke="' + COP + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">' + p + '</g></g>'; }).join('') + txt(400, 430, 'مجموعة أيقونات خطية — سُمك 4 — أطراف دائرية', 20, '#6a5a50', { f: SA })); };
ART.style1 = () => svg(600, 750, '<rect width="600" height="750" fill="url(#g)"/><circle cx="430" cy="170" r="190" fill="url(#h)"/><rect x="0" y="560" width="600" height="190" fill="#5a3320"/><rect x="0" y="556" width="600" height="8" fill="#c58a52" opacity=".6"/>' + cup(300, 520, 1.9) + '<g transform="translate(0 580)">' + beans(600, 190, 6, 5) + '</g>', lg('g', '#EBC48A', '#8a5230') + rg('h', '#fff0c8', '#fff0c8'));
ART.style2 = () => svg(600, 750, '<rect width="600" height="750" fill="#e6d3b3"/><circle cx="300" cy="360" r="250" fill="' + CREAM + '"/>' + cup(300, 370, 3.0, { steam: false, body: '#fffaf0' }).replace('scale(3', 'scale(2.9') + [[110, 110], [500, 130], [90, 620], [510, 600]].map((a, i) => bean(a[0], a[1], 26, i * 40 + 20)).join('') + txt(300, 705, 'تصوير علوي — Flat lay', 26, ESP, { f: SA, op: .8 }), '');
ART.logo1 = () => svg(600, 600, '<rect width="600" height="600" fill="' + CREAM + '"/>' + seal(300, 300, 230, ESP, CREAM) + '<circle cx="300" cy="300" r="238" fill="none" stroke="' + ESP + '" stroke-width="0"/>');
ART.logo2 = () => svg(600, 600, '<rect width="600" height="600" fill="' + ESP + '"/>' + seal(300, 300, 230, CREAM, ESP) + '<circle cx="300" cy="300" r="268" fill="none" stroke="' + GOLD + '" stroke-width="2"/>');
ART.slogan = () => svg(800, 450, '<rect width="800" height="450" fill="' + TERRA + '"/><rect width="800" height="450" fill="url(#g)" opacity=".5"/>' + frame(800, 450, CREAM, 22) + txt(400, 200, 'فنجان.. طعم الأصالة', 62, CREAM, { w: 700 }) + txt(400, 262, 'Finjan · The flavour of heritage', 28, '#f6d9cf', { f: LA, ls: 2 }) + txt(400, 340, 'بدائل: «قهوة بنكهة الذكريات» · «اشرب القهوة كما كانت»', 21, CREAM, { f: SA, op: .9 }), lg('g', '#ffffff00', '#00000055'));
function poster(w, h, o){
  return svg(w, h, '<rect width="' + w + '" height="' + h + '" fill="' + o.bg + '"/>' + (o.pat ? beans(w, h, 26, 11, '#00000014') : '') + frame(w, h, o.fg, 18) + (o.top || '') + o.body, o.defs || '');
}
ART.main = () => poster(720, 900, { bg: ESP, fg: GOLD, pat: true, defs: rg('h', '#e0a15a', '#e0a15a'), body: '<circle cx="360" cy="420" r="260" fill="url(#h)" opacity=".55"/>' + cup(360, 490, 2.1) + txt(360, 130, 'افتتاح كافيه فنجان', 56, CREAM, { w: 700 }) + txt(360, 175, 'GRAND OPENING', 22, GOLD, { f: LA, ls: 8 }) + txt(360, 780, 'فنجان.. طعم الأصالة', 46, GOLD, { w: 700 }) + txt(360, 830, 'الخميس ٨ أكتوبر · الساعة ٤ مساءً', 24, CREAM, { f: SA, op: .85 }) });
ART.grid = () => { const T9 = [[ESP, 'فنجان'], [CREAM, 'مرحبًا'], [COP, '٤ م'], [GOLD, 'قهوة'], [ESP, 'أصالة'], [TERRA, 'افتتاح'], [CREAM, 'ضيافة'], [ESP, 'حبوب'], [GOLD, 'فنجان']];
  return svg(810, 810, '<rect width="810" height="810" fill="#fff"/>' + T9.map((c, i) => { const x = (i % 3) * 270, y = Math.floor(i / 3) * 270, dark = [ESP, COP, TERRA].includes(c[0]); return '<g><rect x="' + (x + 4) + '" y="' + (y + 4) + '" width="262" height="262" fill="' + c[0] + '"/>' + (i % 2 ? cup(x + 135, y + 150, .9, { body: dark ? CREAM : ESP, coffee: dark ? ESP : CREAM, saucer: dark ? '#e3d3ba' : '#6a5a50', steam: false }) : txt(x + 135, y + 150, c[1], 56, dark ? CREAM : ESP, { w: 700 })) + (i % 2 ? txt(x + 135, y + 240, c[1], 26, dark ? CREAM : ESP, { f: SA }) : '') + '</g>'; }).join('')); };
ART.post1 = (v2) => poster(540, 675, { bg: v2 ? CREAM : TERRA, fg: v2 ? COP : CREAM, body: seal(270, 230, 125, v2 ? ESP : CREAM, v2 ? CREAM : TERRA) + txt(270, 430, 'افتتاح', 74, v2 ? ESP : CREAM, { w: 700 }) + txt(270, 485, 'كافيه فنجان', 40, v2 ? COP : '#f6d9cf', { w: 700 }) + txt(270, 560, v2 ? 'الخميس ٨ أكتوبر · ٤ مساءً' : 'قريبًا', 26, v2 ? ESP : CREAM, { f: SA }) + txt(270, 612, 'القاهرة · وسط البلد', 20, v2 ? '#6a5a50' : '#f6d9cf', { f: SA }) });
ART.post2 = () => poster(540, 675, { bg: CREAM, fg: COP, defs: rg('h', '#e8b878', '#e8b878'), body: '<circle cx="270" cy="300" r="190" fill="url(#h)"/>' + cup(270, 320, 1.7) + txt(270, 560, 'القهوة المحمّصة بحب', 42, ESP, { w: 700 }) + txt(270, 605, 'أول فنجان عليك بس هتحبه', 24, COP, { f: SA }) });
ART.post3 = () => poster(540, 675, { bg: ESP, fg: GOLD, pat: true, body: txt(270, 150, 'حكاية فنجان', 62, CREAM, { w: 700 }) + '<g stroke="' + GOLD + '" stroke-width="2" opacity=".8"><path d="M120 200 H420"/></g>' + txt(270, 300, 'بدأت من ركن صغير في بيت جدي..', 26, '#e8dcc6', { f: SA }) + txt(270, 350, 'حيث كانت القهوة تُحضَّر ببطء', 26, '#e8dcc6', { f: SA }) + txt(270, 400, 'وتُقدَّم بحب لكل ضيف.', 26, '#e8dcc6', { f: SA }) + cup(270, 520, 1.1, { steam: false }) + txt(270, 640, '١ / ٣', 20, GOLD, { f: LA }) });
ART.post4 = () => poster(540, 675, { bg: '#E3CBA5', fg: ESP, body: txt(270, 110, 'قائمة مميّزة', 52, ESP, { w: 700 }) + [['إسبريسو فنجان', '٦٠'], ['قهوة عربية بالهيل', '٥٠'], ['لاتيه بالقرفة', '٨٥'], ['كولد برو', '٩٥']].map((r, i) => '<g>' + txt(60, 230 + i * 78, r[0], 30, ESP, { a: 'start', f: SA, w: 700 }) + txt(480, 230 + i * 78, r[1] + ' ج', 28, COP, { a: 'end', f: SA, w: 700 }) + '<path d="M60 ' + (248 + i * 78) + ' H480" stroke="' + ESP + '" stroke-dasharray="3 7" opacity=".4"/></g>').join('') + cup(270, 600, .6, { steam: false }) });
ART.story = () => { const fr = ['لقطة قريبة: بخار القهوة', 'الصبّ في الفنجان', 'ابتسامة الضيف', 'اللوجو + الشعار', 'عنوان الافتتاح'];
  return svg(1000, 400, '<rect width="1000" height="400" fill="#1d120d"/>' + fr.map((f, i) => { const x = 20 + i * 195; const art = [cup(x + 80, 190, .75, { steam: true }), '<path d="M' + (x + 80) + ' 90 C' + (x + 70) + ' 140 ' + (x + 90) + ' 170 ' + (x + 80) + ' 200" stroke="#6b3b22" stroke-width="12" fill="none"/>' + cup(x + 80, 250, .6, { steam: false }), '<circle cx="' + (x + 80) + '" cy="180" r="50" fill="' + GOLD + '"/><path d="M' + (x + 55) + ' 190 Q' + (x + 80) + ' 215 ' + (x + 105) + ' 190" stroke="' + ESP + '" stroke-width="5" fill="none"/>', seal(x + 80, 190, 70, CREAM, '#1d120d'), txt(x + 80, 200, 'افتتاح', 44, CREAM, { w: 700 })][i];
    return '<g><rect x="' + x + '" y="30" width="160" height="285" rx="12" fill="#2b1a12" stroke="' + GOLD + '" opacity=".95"/>' + art + txt(x + 80, 345, (i + 1) + ' · ' + f, 14, CREAM, { f: SA }) + '</g>'; }).join('')); };
ART.menu = () => svg(600, 850, '<rect width="600" height="850" fill="' + MILK + '"/>' + frame(600, 850, COP, 20) + seal(300, 150, 80, ESP, MILK) + txt(300, 290, 'قائمة المشروبات', 48, ESP, { w: 700 }) +
  [['إسبريسو', '٦٠'], ['قهوة عربية', '٥٠'], ['كابتشينو', '٧٥'], ['لاتيه بالقرفة', '٨٥'], ['موكا فنجان', '٩٠'], ['كولد برو', '٩٥']].map((r, i) => txt(80, 370 + i * 66, r[0], 28, ESP, { a: 'start', f: SA, w: 600 }) + txt(520, 370 + i * 66, r[1] + ' ج', 26, COP, { a: 'end', f: SA, w: 700 }) + '<path d="M80 ' + (386 + i * 66) + ' H520" stroke="' + COP + '" stroke-dasharray="2 6" opacity=".6"/>').join('') + txt(300, 800, 'فنجان.. طعم الأصالة', 24, COP, {}));
ART.mockup = () => svg(800, 600, '<rect width="800" height="600" fill="url(#g)"/><ellipse cx="400" cy="540" rx="300" ry="30" fill="#000" opacity=".15"/>' +
  '<path d="M250 140 H470 L440 520 H280Z" fill="' + CREAM + '"/><path d="M250 140 H470 L462 190 H258Z" fill="' + ESP + '"/><path d="M280 520 H440 L444 500 H276Z" fill="#00000012"/>' + seal(360, 340, 70, ESP, CREAM) +
  '<g transform="translate(560 200)"><path d="M-60 0 H60 V260 H-60Z" fill="' + ESP + '"/><path d="M-30 0 C-30 -70 30 -70 30 0" fill="none" stroke="' + ESP + '" stroke-width="10"/>' + seal(0, 140, 48, CREAM, ESP) + '</g>' + txt(400, 580, 'كوب ورقي + حقيبة قماش — مقترح موك أب', 20, '#fff', { f: SA, op: .9 }), lg('g', '#cdb08a', '#8d6a44'));

const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return U.dateKey(d); };
async function put(name, s){ return MSA.files.put(new File([s], name + '.svg', { type: 'image/svg+xml' })); }
const NOTES = {
  brief: 'العميل: كافيه «فنجان» (وهمي — للتمرين والبورتفوليو).\nالنشاط: قهوة مختصة وضيافة عربية في وسط البلد.\nالهدف: إعلان الافتتاح وبناء هوية بصرية فخمة وكلاسيكية.\nالجمهور: شباب ٢٢–٤٠ يحبون القهوة والأجواء الهادئة.\nالمطلوب: هوية + ٨ تصميمات سوشيال + ريلز ١٥ ثانية + منيو مطبوع.\nالموعد: الافتتاح الخميس ٨ أكتوبر.',
  idea: 'الفكرة المحورية: «فنجان.. طعم الأصالة» — القهوة كذكرى دافئة من بيت الجد.\nثلاث زوايا: (١) المنتج هو البطل، (٢) حكاية البراند، (٣) لحظة الضيافة.',
  mood: 'اتجاه المود: ترابي دافئ + ضوء ذهبي + زخارف عربية خفيفة.\nالمراجع: حبوب غامقة، ضوء نافذة، ورق كريمي بزخرفة، إضاءة بوكيه ذهبية.',
  foundations: 'الأسس البصرية للكامبين: ألوان، خطوط، أيقونات، وأسلوب تصوير موحّد.',
  colors: 'الأساسي إسبريسو #2B1B14 · نحاسي #B8693A · ذهبي #C5A168 · كريمي #F4E9D8 · تيراكوتا #C8503C (للتمييز فقط).\nالنسبة: 60% كريمي / 30% إسبريسو / 10% نحاسي. التباين أُجري وفُحص.',
  fonts: 'العناوين العربية: Amiri — النص العربي: Cairo.\nالعناوين اللاتينية: Cormorant Garamond — النص: Lora.',
  icons: 'أيقونات خطية بسُمك 4 وأطراف دائرية: فنجان، حبة بن، لهب، سلة، ساعة، كروسان.',
  imagestyle: 'تصوير بضوء نافذة دافئ وظلال ناعمة + لقطات علوية Flat lay على خلفية كريمية. تلوين: ظلال بنية ولمسة ذهبية في الإضاءات.',
  logo: 'ختم دائري بإطار مزدوج: فنجان + كلمة «فنجان» بخط ثلث/نسخ مع FINJAN · CAFÉ. نسختان: داكنة على كريمي، وكريمي على داكن. مساحة آمنة بقدر ارتفاع حرف.',
  slogan: 'الأساسي: «فنجان.. طعم الأصالة».\nبدائل: «قهوة بنكهة الذكريات» · «اشرب القهوة كما كانت».',
  main: 'التصميم الرئيسي (بوستر الافتتاح): الفنجان في المنتصف بهالة ذهبية، العنوان أعلى والتاريخ أسفل. يُشتق منه باقي التصاميم.',
  templates: 'شبكة فيد 3×3 بنظام «مربعات متناوبة»: نص / منتج / نص — بحيث تظهر الألوان الأربعة بالتساوي.',
  onscreen: 'مواد العرض على الشاشة: بوستات ثابتة + ريلز موشن.',
  static: '٨ تصاميم مخططة في تبويب «جدول النشر». أُنجزت ٤: إعلان الافتتاح، المنتج البطل، حكاية البراند (كاروسيل)، القائمة المميزة.',
  motion: 'ريلز ١٥ ثانية: ٠–٢ خطّاف بخار القهوة، ٢–٨ الصبّ والتفاصيل، ٨–١٣ الضيافة، ١٣–١٥ اللوجو والتاريخ. موسيقى عود هادئة.',
  printing: 'منيو A5 مطبوع + كروت شكر. مطلوب Bleed ٣مم ووضع CMYK. أُنجز تصميم المنيو.',
  mockups: 'تجهيز موك أب الكوب والحقيبة للعرض في البورتفوليو — قيد العمل.'
};
let busy = false;
MSA.demo = { async load(){
  if (busy) return null; busy = true;
  try {
    const S = MSA.state, P = MSA.proj, steps = P.makeSteps('campaign'), attAdd = {};
    const mk = {
      brief: [['صورة المنتج', ART.brief()]], mood: moods.map((m, i) => ['مود ' + (i + 1), m()]), colors: [['لوحة الألوان', ART.palette()]], fonts: [['الخطوط', ART.fonts()]], icons: [['الأيقونات', ART.icons()]],
      imagestyle: [['ستايل ١', ART.style1()], ['ستايل ٢', ART.style2()]], logo: [['الشعار — داكن', ART.logo1()], ['الشعار — فاتح', ART.logo2()]], idea: [['لوحة الفكرة', ART.idea()]], slogan: [['الشعار النصي', ART.slogan()]],
      main: [['البوستر الرئيسي', ART.main()]], templates: [['شبكة الفيد', ART.grid()]], static: [['إعلان الافتتاح', ART.post1()], ['المنتج البطل', ART.post2()], ['حكاية البراند', ART.post3()], ['القائمة المميزة', ART.post4()]],
      motion: [['ستوري بورد الريلز', ART.story()]], printing: [['المنيو A5', ART.menu()]], mockups: [['موك أب الكوب والحقيبة', ART.mockup()]]
    };
    for (const k of Object.keys(mk)) { attAdd[k] = []; for (const [n, s] of mk[k]) attAdd[k].push(await put(n, s)); }
    P.walk(steps, x => { if (NOTES[x.key]) x.note = NOTES[x.key]; if (attAdd[x.key]) x.atts.push(...attAdd[x.key]); if (x.key && x.key !== 'mockups' && !x.children.length) x.done = true; });
    const id = U.uid('p');
    const p = { id, name: 'كامبين افتتاح كافيه فنجان (مشروع تجريبي)', brand: 'فنجان', created: Date.now(), status: 'active', profile: 'classic', steps,
      identity: { colors: [ESP, COP, GOLD, CREAM, TERRA], fonts: [{ h: 'Cormorant Garamond', b: 'Lora', ah: 'Amiri', ab: 'Cairo' }], icons: ['mdi:coffee-outline', 'lucide:coffee', 'tabler:cup', 'ph:coffee'], notes: ['نبرة فخمة هادئة بدفء أصيل', 'الفنجان هو الرمز الثابت في كل تصميم', 'التيراكوتا للتمييز فقط (١٠٪)'] },
      time: { rate: 250, cur: 'EGP', client: 'كافيه فنجان (تدريبي)', fixed: 0, notes: 'السعر شامل تعديلين. التسليم خلال ٧ أيام من الاعتماد.', run: null, seq: 0, extras: [{ id: U.uid('x'), name: 'تجهيز ملفات الطباعة', amt: 400 }],
        entries: [[-6, 120, 'البريف والبحث'], [-5, 90, 'المود بورد'], [-4, 150, 'الهوية: ألوان وخطوط'], [-3, 180, 'تصميم الشعار'], [-2, 150, 'بوستات الافتتاح'], [-1, 75, 'المنيو + تعديلات']].map(a => ({ id: U.uid('e'), date: day(a[0]), min: a[1], note: a[2] })) },
      posts: ['إعلان الافتتاح', 'المنتج البطل', 'حكاية البراند (كاروسيل)', 'القائمة المميزة', 'لحظة الضيافة', 'خلف الكواليس', 'عرض اليوم الأول', 'شكرًا لزوّارنا'].map((t, i) => ({ id: U.uid('o'), title: t, date: day(-4 + i * 2), time: '19:00', platform: i % 3 === 2 ? 'TikTok' : 'Instagram', status: i < 2 ? 'posted' : i === 2 ? 'ready' : 'planned' })),
      revs: [], delivery: null };
    const v1 = await put('إعلان الافتتاح V1', ART.post1()), v2 = await put('إعلان الافتتاح V2', ART.post1(true)), h1 = await put('المنتج البطل', ART.post2());
    p.revs = [{ id: U.uid('r'), name: 'إعلان الافتتاح', rounds: [{ id: U.uid('x'), date: day(-5), note: 'العميل: كبّر الشعار قليلًا وغيّر الخلفية لدرجة أدفأ، وأضف تاريخ الافتتاح بوضوح.', done: true, atts: [v1] }, { id: U.uid('x'), date: day(-2), note: 'تم التعديل (خلفية كريمية + التاريخ). العميل يطلب تقليل الزخرفة حول الختم.', done: false, atts: [v2] }] },
      { id: U.uid('r'), name: 'المنتج البطل', rounds: [{ id: U.uid('x'), date: day(-3), note: 'اعتماد مبدئي بدون تعديلات.', done: true, atts: [h1] }] }];
    const CH = ['الأبعاد مطابقة لكل منصة (1080×1350 / 1080×1920 …)', 'وضع الألوان صحيح: RGB للشاشة / CMYK للطباعة', 'الخطوط محوّلة Outlines أو مرفقة', 'الـ Bleed وعلامات القص للمطبوعات', 'دقة الصور مناسبة (300dpi للطباعة)', 'مراجعة الإملاء والأرقام وأرقام التواصل', 'أسماء الملفات منظمة وواضحة', 'نسخ المصدر (PSD / AI / Project) محفوظة', 'نسخ التسليم جاهزة (PNG / JPG / PDF / MP4)', 'اعتماد العميل النهائي مكتوب'];
    p.delivery = { items: CH.map((c, i) => ({ id: U.uid('d'), text: c, done: i < 6 })) };
    S.projects.unshift(p); S.ui.project = p.id;
    /* references library with folders */
    S.refFolders = S.refFolders || []; S.refs = S.refs || [];
    const f = (name, color) => { const o = { id: U.uid('d'), parent: null, name, color, created: Date.now() }; S.refFolders.push(o); return o.id; };
    const f1 = f('قهوة وكافيهات', '#ff8a4c'), f2 = f('ألوان وخطوط', '#a56bef'), f3 = f('تغليف ومطبوعات', '#3ccf91');
    const L = (title, url, tags, fo) => S.refs.push({ id: U.uid('rf'), title, url, tags, folder: fo, created: Date.now() });
    L('Behance — هوية كافيه كلاسيكية', 'https://www.behance.net/search/projects?search=coffee%20shop%20branding', ['قهوة', 'هوية'], f1);
    L('Pinterest — قهوة عربية', 'https://www.pinterest.com/search/pins/?q=arabic%20coffee%20branding', ['قهوة', 'عربي'], f1);
    L('Color Hunt — ألوان ترابية', 'https://colorhunt.co/palettes/brown', ['ألوان'], f2);
    L('Google Fonts — Amiri', 'https://fonts.google.com/specimen/Amiri', ['خطوط', 'عربي'], f2);
    L('Behance — تغليف قهوة', 'https://www.behance.net/search/projects?search=coffee%20packaging', ['تغليف'], f3);
    for (const [n, a, fo, tg] of [['مود: حبوب', moods[0](), f1, ['مود']], ['مود: ضوء ذهبي', moods[3](), f1, ['مود', 'إضاءة']], ['مود: زخرفة', moods[2](), f2, ['زخرفة']]]) S.refs.push({ id: U.uid('rf'), att: await put(n, a), title: n, tags: tg, folder: fo, created: Date.now() });
    /* tasks */
    const mt = (title, due, pr) => S.tasks.unshift({ id: U.uid('t'), type: 'task', title, desc: p.name, status: 'todo', priority: pr, start: '', due: due + 'T17:00', remind: '60', remindAt: '', repeat: '', tags: ['فنجان'], checklist: [], atts: [], color: '', pinned: false, created: Date.now(), updated: Date.now(), notified: false });
    mt('تجهيز موك أب الكوب والحقيبة', day(1), 'high'); mt('مراجعة ملاحظات العميل على إعلان الافتتاح', day(0), 'normal'); mt('تصدير ملفات التسليم النهائية', day(3), 'normal');
    MSA.save(); MSA.saveNow && MSA.saveNow(); MSA.updateCounts && MSA.updateCounts();
    return p;
  } finally { busy = false; }
} };
})();

