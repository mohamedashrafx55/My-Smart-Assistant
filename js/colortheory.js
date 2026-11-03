/* Colour theory tab: an interactive colour wheel (like Adobe Color) with harmony rules, palette, tints/shades,
   a contrast checker and a short course on colour theory. Pure functions + DOM, no network. */
(function(){
'use strict';
const MSA = window.MSA, U = MSA.u, I = MSA.icon, esc = U.esc, T = (a, e) => MSA.T(a, e);

/* ---------- colour maths ---------- */
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function hsv2rgb(h, s, v){ h = ((h % 360) + 360) % 360; const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c; let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]; }
function rgb2hsv(r, g, b){ r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
  if (d) { if (mx === r) h = 60 * (((g - b) / d) % 6); else if (mx === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4); }
  return [(h + 360) % 360, mx ? d / mx : 0, mx]; }
const hex = (r, g, b) => '#' + [r, g, b].map(x => clamp(x, 0, 255).toString(16).padStart(2, '0')).join('');
const fromHSV = (h, s, v) => hex(...hsv2rgb(h, s, v));
function parseHex(t){ t = String(t || '').trim().replace(/^#/, ''); if (/^[0-9a-f]{3}$/i.test(t)) t = t.replace(/(.)/g, '$1$1'); if (!/^[0-9a-f]{6}$/i.test(t)) return null; return [0, 2, 4].map(i => parseInt(t.substr(i, 2), 16)); }
const lum = h => { const c = parseHex(h).map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const inkOn = h => (lum(h) > 0.45 ? '#111111' : '#ffffff');
const hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; let s = 0, h = 0;
  if (d) { s = d / (1 - Math.abs(2 * l - 1)); if (mx === r) h = 60 * (((g - b) / d) % 6); else if (mx === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4); } return [Math.round((h + 360) % 360), Math.round(s * 100), Math.round(l * 100)]; };

/* ---------- harmonies ---------- */
const MODES = [
  { id: 'comp', ar: 'متقابلة', en: 'Complementary', off: [0, 180],
    d: ['لونان متقابلان تمامًا على العجلة. أعلى تباين ممكن، فهو ممتاز للأزرار والعناوين اللي لازم تشد العين، لكن استخدم أحدهما كأساس والتاني كلمسة صغيرة.', 'Two colours directly opposite on the wheel. The highest possible contrast, great for buttons and headlines that must pop; use one as the base and the other as a small accent.'] },
  { id: 'analog', ar: 'متجاورة', en: 'Analogous', off: [-40, -20, 0, 20, 40],
    d: ['ألوان متجاورة على العجلة. إحساس هادئ ومتناغم وطبيعي (مثل غروب الشمس)، مناسب للخلفيات والهويات الهادية. انتبه لقلة التباين بينهم.', 'Neighbouring colours on the wheel. A calm, harmonious, natural feel (like a sunset), good for backgrounds and gentle identities. Watch the low contrast between them.'] },
  { id: 'triad', ar: 'ثلاثية', en: 'Triadic', off: [0, 120, 240],
    d: ['ثلاثة ألوان بينها 120° متساوية. حيوية وتنوّع مع توازن، تنفع مع الأطفال والترفيه. خلّي لونًا واحدًا مسيطرًا والباقي للتمييز.', 'Three colours evenly spaced by 120°. Vibrant yet balanced, good for kids and entertainment. Let one colour dominate and use the others as accents.'] },
  { id: 'split', ar: 'متقابلة مجزّأة', en: 'Split-complementary', off: [0, 150, 210],
    d: ['لون أساسي ولونين بجانب مقابله. تباين قوي لكن أهدى وأسهل في الاستخدام من المتقابلة البسيطة، وخيار ممتاز للمبتدئين.', 'A base colour plus the two colours next to its opposite. Strong contrast but gentler and easier to use than plain complementary — a great beginner choice.'] },
  { id: 'square', ar: 'مربعة', en: 'Square', off: [0, 90, 180, 270],
    d: ['أربعة ألوان بينها 90°. غنية جدًا ومتنوعة، فتحتاج ضبط: اختار لونًا للمساحات الكبيرة والباقي بنسب صغيرة.', 'Four colours spaced by 90°. Very rich and varied, so it needs discipline: choose one for large areas and use the others in small amounts.'] },
  { id: 'rect', ar: 'مستطيلة', en: 'Tetradic', off: [0, 60, 180, 240],
    d: ['زوجان من الألوان المتقابلة (مستطيل على العجلة). تنوّع كبير مع إمكانية التوازن بين الدافئ والبارد.', 'Two complementary pairs (a rectangle on the wheel). Lots of variety with room to balance warm and cool.'] },
  { id: 'mono', ar: 'أحادية', en: 'Monochromatic', off: [0],
    d: ['درجات مختلفة من لون واحد (تغيّر التشبّع والسطوع). أنظف وأأمن شكل، وبتدّي هوية متماسكة وراقية. أضف تباينًا بالسطوع علشان ما يبقاش مملًا.', 'Different shades of one hue (varying saturation and brightness). The cleanest, safest look and gives a cohesive, refined identity. Add contrast through brightness so it doesn’t get dull.'] }
];
function harmony(st){
  const m = MODES.find(x => x.id === st.mode) || MODES[0], { h, s, v } = st;
  if (m.id === 'mono') return [[h, s, clamp(v * 0.45, 0.12, 1)], [h, s, clamp(v * 0.72, 0.15, 1)], [h, s, v], [h, s * 0.6, clamp(v + (1 - v) * 0.4, 0, 1)], [h, s * 0.28, clamp(v + (1 - v) * 0.75, 0, 1)]];
  return m.off.map(o => [(h + o + 360) % 360, s, v]);
}
const colorsOf = st => harmony(st).map(x => fromHSV(...x));

/* ---------- state ---------- */
function initial(p){
  const id = p && p.identity && p.identity.colors && p.identity.colors[0], prim = (MSA.suggest && MSA.suggest.context) ? (() => { try { return MSA.suggest.context(p).primary; } catch (e) { return null; } })() : null;
  const rgb = parseHex(id) || parseHex(prim) || [59, 130, 246], [h, s, v] = rgb2hsv(...rgb);
  return { h, s: Math.max(s, 0.25), v: Math.max(v, 0.35), mode: 'comp', fg: 0, bg: -1 };
}

/* ---------- theory text ---------- */
const COURSE = [
  [T('العجلة اللونية: الأساسية والثانوية والثالثية', 'The colour wheel: primary, secondary, tertiary'),
   T('العجلة بترتب الألوان في دايرة. الألوان الأساسية (أحمر، أصفر، أزرق في الرسم التقليدي، أو أحمر وأخضر وأزرق على الشاشة) لا تتكوّن من غيرها. بمزج لونين أساسيين بنحصل على الثانوية (برتقالي، أخضر، بنفسجي)، وبمزج أساسي مع ثانوي مجاور بنحصل على الثالثية. من العجلة بتطلع كل علاقات التناسق.', 'The wheel arranges hues in a circle. Primary colours (red, yellow, blue in traditional painting; red, green, blue on screens) can’t be made from others. Mixing two primaries gives the secondaries (orange, green, purple); mixing a primary with a neighbouring secondary gives the tertiaries. Every harmony rule comes from the wheel.')],
  [T('درجة اللون والتشبّع والسطوع (HSV)', 'Hue, saturation and value (HSV)'),
   T('كل لون له 3 أبعاد: درجة اللون (Hue) وهي مكانه على العجلة، والتشبّع (Saturation) وهو مدى نقاء اللون مقابل الرمادي، والسطوع (Value/Brightness) وهو مدى فتحه أو غمقانه. غيّر التشبّع والسطوع بدل ما تضيف ألوان جديدة، فتحصل على نسخ متناسقة من نفس اللون.', 'Every colour has three dimensions: hue (its place on the wheel), saturation (how pure vs. grey) and value (how light or dark). Vary saturation and value instead of adding new hues to get coherent variations of one colour.')],
  [T('ألوان دافئة وباردة', 'Warm and cool colours'),
   T('الأحمر والبرتقالي والأصفر دافئة: بتقرّب العنصر وتدّي حماس وطاقة. الأزرق والأخضر والبنفسجي باردة: بتبعّد وتدّي هدوء وثقة. استخدم الدافئ للعناصر اللي عايزها تبرز والبارد للخلفيات والعمق.', 'Red, orange and yellow are warm: they advance and bring energy. Blue, green and purple are cool: they recede and feel calm and trustworthy. Use warm for elements that must stand out and cool for backgrounds and depth.')],
  [T('تناسق الألوان (Color Harmony)', 'Colour harmony'),
   T('يعني إن الألوان بينها علاقة محسوبة على العجلة بدل ما تتخانق. جرّب القواعد اللي فوق (متقابلة، متجاورة، ثلاثية…) وشوف الفرق بنفسك. مش قانون جامد، لكنه نقطة بداية مضمونة.', 'Harmony means colours share a calculated relationship on the wheel instead of clashing. Try the rules above and see the difference yourself. It’s not a rigid law but a reliable starting point.')],
  [T('قاعدة 60-30-10', 'The 60-30-10 rule'),
   T('وزّع الألوان على التصميم: 60% للون الأساسي (غالبًا الخلفية)، 30% للثانوي، 10% للون التمييز في الأزرار والعناوين. بتمنع الزحمة وبتوجّه العين.', 'Distribute colours in a design: 60% dominant (usually background), 30% secondary, 10% accent for buttons and headlines. It prevents clutter and guides the eye.')],
  [T('التباين وسهولة القراءة', 'Contrast and legibility'),
   T('التباين هو الفرق في السطوع بين لونين. للنص العادي لازم نسبة 4.5:1 على الأقل (AA)، وللنص الكبير 3:1. استخدم فاحص التباين تحت علشان تتأكد من اختياراتك.', 'Contrast is the difference in lightness between two colours. Body text needs at least 4.5:1 (AA), large text 3:1. Use the contrast checker below to verify your choices.')],
  [T('معاني الألوان (بحذر)', 'What colours mean (with care)'),
   T('أحمر: طاقة وإلحاح وشغف. برتقالي: حماس ودفء. أصفر: تفاؤل وانتباه. أخضر: طبيعة ونمو وصحة. أزرق: ثقة وهدوء وتقنية. بنفسجي: فخامة وإبداع. أسود: أناقة وقوة. أبيض: نقاء وبساطة. المعاني دي نسبية وتختلف من ثقافة لأخرى، فاعتبرها توجيه مش قاعدة.', 'Red: energy, urgency, passion. Orange: enthusiasm, warmth. Yellow: optimism, attention. Green: nature, growth, health. Blue: trust, calm, technology. Purple: luxury, creativity. Black: elegance, power. White: purity, simplicity. These meanings are relative and vary by culture, so treat them as guidance, not rules.')],
  [T('ألوان الشاشة والطباعة (RGB و CMYK)', 'Screen vs print (RGB and CMYK)'),
   T('الشاشة بتضيف ضوء (RGB) فألوانها زاهية، والطباعة بتطرح حبر (CMYK) فألوانها أهدى. اللون الزاهي جدًا على الشاشة ممكن يطلع باهت في الطباعة، فاختبره قبل الاعتماد وسجّل أكواد الاتنين.', 'Screens add light (RGB) so colours look vivid; print subtracts ink (CMYK) so colours are duller. A very vivid screen colour can print dull, so test it and record both codes.')]
];

/* ---------- HTML ---------- */
MSA.colorTheoryHTML = function(p){
  const st = p.colorTheory = Object.assign(initial(p), p.colorTheory || {});
  const cols = colorsOf(st);
  return '<div class="ct" id="ctRoot">' +
    '<div class="ct-intro">' + esc(T('اسحب النقطة على العجلة لتغيير اللون الأساسي، واختر قاعدة التناسق، وهتطلع لك الباليت. اضغط أي لون لنسخه، أو 📌 لإضافته لهويتك.', 'Drag the dot on the wheel to change the base colour, pick a harmony rule and the palette follows. Tap a colour to copy it, or the pin to add it to your identity.')) + '</div>' +
    '<div class="ct-main"><div class="ct-wheelwrap"><div class="ct-wheel" id="ctWheel"><div class="ct-dark" id="ctDark"></div><svg class="ct-lines" id="ctLines" viewBox="0 0 100 100"></svg><div class="ct-dots" id="ctDots"></div></div></div>' +
    '<div class="ct-side"><div class="ct-modes" id="ctModes">' + MODES.map(m => '<button class="pchip' + (st.mode === m.id ? ' on' : '') + '" data-ct-mode="' + m.id + '">' + esc(T(m.ar, m.en)) + '</button>').join('') + '</div>' +
    '<div class="ct-mdesc" id="ctDesc"></div>' +
    '<label class="ct-v"><span>' + esc(T('السطوع', 'Brightness')) + '</span><input type="range" id="ctV" min="10" max="100" value="' + Math.round(st.v * 100) + '"></label>' +
    '<div class="ct-inp"><label>HEX<input id="ctHex" dir="ltr" maxlength="7" spellcheck="false"></label><div class="ct-read" id="ctRead" dir="ltr"></div></div></div></div>' +
    '<section class="sg-sec"><h4>' + I('palette', 'sm') + esc(T('الباليت', 'Palette')) + '</h4><div class="ct-pal" id="ctPal"></div>' +
    '<div class="sg-actions"><button class="btn sm" data-ct="pinall">' + I('pin', 'sm') + esc(T('أضف الباليت لهويتي', 'Add palette to my identity')) + '</button><button class="btn sm" data-ct="css">' + I('copy', 'sm') + esc(T('نسخ كـ CSS', 'Copy as CSS')) + '</button></div></section>' +
    '<section class="sg-sec"><h4>' + I('layers', 'sm') + esc(T('درجات الفتح والغمق للون الأساسي', 'Tints and shades of the base colour')) + '</h4><div class="ct-ramp" id="ctRamp"></div></section>' +
    '<section class="sg-sec"><h4>' + I('eye', 'sm') + esc(T('فاحص التباين', 'Contrast checker')) + '</h4><div class="ct-chk"><label>' + esc(T('النص', 'Text')) + '<select id="ctFg"></select></label><label>' + esc(T('الخلفية', 'Background')) + '<select id="ctBg"></select></label></div><div class="ct-sample" id="ctSample"></div></section>' +
    '<section class="sg-sec"><h4>' + I('note', 'sm') + esc(T('نظرية الألوان باختصار', 'Colour theory in brief')) + '</h4><div class="ct-course">' + COURSE.map((c, i) => '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(c[0]) + '</summary><p>' + esc(c[1]) + '</p></details>').join('') + '</div></section></div>';
};

/* ---------- behaviour ---------- */
MSA.wireColorTheory = function(root, p, pin){
  const st = p.colorTheory, $ = s => root.querySelector(s), wheel = $('#ctWheel'); if (!st || !wheel) return;
  const save = () => MSA.save();
  const pos = (h, s) => { const a = h * Math.PI / 180; return [50 + 50 * s * Math.sin(a), 50 - 50 * s * Math.cos(a)]; };
  function paint(skipInput){
    const hs = harmony(st), cols = hs.map(x => fromHSV(...x)), base = fromHSV(st.h, st.s, st.v);
    $('#ctDark').style.opacity = String(1 - st.v);
    const pts = hs.map(x => pos(x[0], x[1]));
    $('#ctLines').innerHTML = cols.length > 1 ? '<polygon points="' + pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + '" fill="none" stroke="rgba(255,255,255,.85)" stroke-width=".7" stroke-dasharray="1.6 1.2"/>' : '';
    const bi = st.mode === 'mono' ? 2 : 0;
    $('#ctDots').innerHTML = hs.map((x, i) => '<i class="ct-dot' + (i === bi ? ' base' : '') + '" data-i="' + i + '" style="left:' + pts[i][0] + '%;top:' + pts[i][1] + '%;background:' + cols[i] + '"></i>').join('');
    const m = MODES.find(x => x.id === st.mode); $('#ctDesc').textContent = T(m.d[0], m.d[1]);
    if (!skipInput) $('#ctHex').value = base.toUpperCase();
    const rgb = parseHex(base), H = hsl(...rgb); $('#ctRead').textContent = 'RGB ' + rgb.join(', ') + '  ·  HSL ' + H[0] + '°, ' + H[1] + '%, ' + H[2] + '%  ·  HSB ' + Math.round(st.h) + '°, ' + Math.round(st.s * 100) + '%, ' + Math.round(st.v * 100) + '%';
    $('#ctPal').innerHTML = cols.map(c => { const r = parseHex(c); return '<div class="ct-sw"><button class="ct-c" dir="ltr" data-ct-copy="' + c + '" style="background:' + c + ';color:' + inkOn(c) + '" title="' + esc(T('نسخ', 'Copy')) + '">' + c.toUpperCase() + '</button><div class="ct-sub" dir="ltr">' + r.join(', ') + '</div><button class="icon-btn sm" data-ct-pin="' + c + '" aria-label="pin" title="' + esc(T('أضف إلى هويتي البصرية', 'Add to my visual identity')) + '">' + I('pin', 'sm') + '</button></div>'; }).join('');
    const mix = (c, w, t) => { const x = parseHex(c), y = parseHex(w); return hex(...x.map((q, i) => Math.round(q + (y[i] - q) * t))); };
    const ramp = [mix(base, '#ffffff', .8), mix(base, '#ffffff', .6), mix(base, '#ffffff', .4), mix(base, '#ffffff', .2), base, mix(base, '#000000', .2), mix(base, '#000000', .4), mix(base, '#000000', .6), mix(base, '#000000', .8)];
    $('#ctRamp').innerHTML = ramp.map(c => '<button class="ct-r" dir="ltr" data-ct-copy="' + c + '" style="background:' + c + ';color:' + inkOn(c) + '" title="' + c.toUpperCase() + '"><span>' + c.toUpperCase().slice(1) + '</span></button>').join('');
    const opts = cols.concat(['#ffffff', '#000000']), fgS = $('#ctFg'), bgS = $('#ctBg'), fgI = clamp(st.fg, 0, opts.length - 1), bgI = st.bg < 0 ? opts.length - 2 : clamp(st.bg, 0, opts.length - 1);
    const o = opts.map((c, i) => '<option value="' + i + '">' + c.toUpperCase() + '</option>').join(''); fgS.innerHTML = o; bgS.innerHTML = o; fgS.value = String(fgI); bgS.value = String(bgI); checkContrast(opts);
  }
  function checkContrast(opts){
    const f = opts[+$('#ctFg').value], b = opts[+$('#ctBg').value], r = ratio(f, b), rr = r.toFixed(2);
    const tag = (ok, t) => '<span class="ct-tag ' + (ok ? 'ok' : 'no') + '">' + (ok ? '✓ ' : '✗ ') + t + '</span>';
    $('#ctSample').innerHTML = '<div class="ct-prev" style="background:' + b + ';color:' + f + '"><b>' + esc(T('نص تجريبي', 'Sample text')) + '</b><span>Aa 123</span></div><div class="ct-score"><b dir="ltr">' + rr + ' : 1</b>' + tag(r >= 4.5, T('نص عادي AA', 'Body text AA')) + tag(r >= 3, T('نص كبير AA', 'Large text AA')) + tag(r >= 7, T('AAA', 'AAA')) + '</div>';
  }
  const fromEvent = (e, off) => { const r = wheel.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 2 - 1, y = (e.clientY - r.top) / r.height * 2 - 1;
    let h = Math.atan2(x, -y) * 180 / Math.PI; h = (h + 360) % 360; const s = clamp(Math.hypot(x, y), 0, 1); st.h = ((h - (off || 0)) % 360 + 360) % 360; st.s = s; };
  let drag = null;
  wheel.addEventListener('pointerdown', e => { const d = e.target.closest('.ct-dot'); const hs = harmony(st); let off = 0; if (d && st.mode !== 'mono') off = hs[+d.dataset.i][0] - st.h; drag = { off }; try { wheel.setPointerCapture(e.pointerId); } catch (x) {} fromEvent(e, off); paint(); e.preventDefault(); });
  wheel.addEventListener('pointermove', e => { if (!drag) return; fromEvent(e, drag.off); paint(); });
  const end = () => { if (drag) { drag = null; save(); } }; wheel.addEventListener('pointerup', end); wheel.addEventListener('pointercancel', end);
  root.addEventListener('input', e => {
    if (e.target.id === 'ctV') { st.v = clamp(+e.target.value / 100, 0.1, 1); paint(); save(); }
    else if (e.target.id === 'ctHex') { const rgb = parseHex(e.target.value); if (rgb) { const [h, s, v] = rgb2hsv(...rgb); st.h = h; st.s = s; st.v = Math.max(v, 0.1); $('#ctV').value = Math.round(st.v * 100); paint(true); save(); } }
  });
  root.addEventListener('change', e => { if (e.target.id === 'ctFg') { st.fg = +e.target.value; save(); paint(true); } else if (e.target.id === 'ctBg') { st.bg = +e.target.value; save(); paint(true); } });
  root.addEventListener('click', async e => {
    const md = e.target.closest('[data-ct-mode]'); if (md) { st.mode = md.dataset.ctMode; save(); $$all('[data-ct-mode]').forEach(b => b.classList.toggle('on', b === md)); paint(); return; }
    const cp = e.target.closest('[data-ct-copy]'); if (cp) { const v = cp.dataset.ctCopy.toUpperCase(); try { await navigator.clipboard.writeText(v); MSA.toast(T('تم النسخ: ', 'Copied: ') + v, 'ok'); } catch (x) { MSA.toast(v); } return; }
    const pn = e.target.closest('[data-ct-pin]'); if (pn) { pin('color', pn.dataset.ctPin); return; }
    const a = e.target.closest('[data-ct]'); if (!a) return; const cols = colorsOf(st);
    if (a.dataset.ct === 'pinall') { cols.forEach(c => pin('color', c, true)); MSA.toast(T('أُضيفت الباليت إلى هويتك البصرية', 'Palette added to your visual identity'), 'ok'); }
    else if (a.dataset.ct === 'css') { const css = ':root{\n' + cols.map((c, i) => '  --color-' + (i + 1) + ': ' + c + ';').join('\n') + '\n}'; try { await navigator.clipboard.writeText(css); MSA.toast(T('تم نسخ CSS', 'CSS copied'), 'ok'); } catch (x) { MSA.toast(css); } }
  });
  const $$all = s => Array.from(root.querySelectorAll(s));
  paint();
};
MSA.colorTheory = { harmony, colorsOf, hsv2rgb, rgb2hsv, fromHSV, ratio, MODES };
})();
