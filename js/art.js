/* 3D-style vector illustrations for the four home tiles (pure SVG, no external files) */
(function(){
const MSA = window.MSA = window.MSA || {};
const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
function shade(hex, a){            // a>0 lighten toward white, a<0 darken toward black
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => clamp(a >= 0 ? v + (255 - v) * a : v * (1 + a)));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
const pal = b => ({ t: shade(b, .28), l: b, r: shade(b, -.24), e: shade(b, -.4) });
/* isometric box: B = back corner of the top face, footprint sx × sy, height h */
function box(bx, by, sx, sy, h, c){
  const p0 = [bx, by], p1 = [bx + sx, by + sx / 2], p2 = [bx + sx - sy, by + sx / 2 + sy / 2], p3 = [bx - sy, by + sy / 2];
  const dn = p => [p[0], p[1] + h], j = a => a.map(String).join(' '), st = ' stroke-linejoin="round" stroke-width=".8"';
  return '<polygon points="' + j([p3, p2, dn(p2), dn(p3)]) + '" fill="' + c.l + '" stroke="' + c.l + '"' + st + '/>' +
    '<polygon points="' + j([p1, p2, dn(p2), dn(p1)]) + '" fill="' + c.r + '" stroke="' + c.r + '"' + st + '/>' +
    '<polygon points="' + j([p0, p1, p2, p3]) + '" fill="' + c.t + '" stroke="' + c.t + '"' + st + '/>';
}
/* box whose top-face CENTRE is (cx, cy) */
const boxC = (cx, cy, sx, sy, h, c) => box(cx - (sx - sy) / 2, cy - (sx + sy) / 4, sx, sy, h, c);
const shadow = (id, rx, y) => '<ellipse cx="120" cy="' + (y || 162) + '" rx="' + rx + '" ry="' + rx * .2 + '" fill="#000" opacity=".28" filter="url(#' + id + 'b)"/>';
const defs = (id, glow, extra) => '<defs><filter id="' + id + 'b" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="6"/></filter>' +
  '<radialGradient id="' + id + 'g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="' + glow + '" stop-opacity=".55"/><stop offset="1" stop-color="' + glow + '" stop-opacity="0"/></radialGradient>' + (extra || '') + '</defs>' +
  '<circle cx="120" cy="92" r="92" fill="url(#' + id + 'g)"/>';
const svg = body => '<svg viewBox="0 0 240 190" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + body + '</svg>';
const star = (x, y, r, f) => '<path transform="translate(' + x + ' ' + y + ')" d="M0 ' + -r + ' L' + r * .3 + ' ' + -r * .3 + ' L' + r + ' 0 L' + r * .3 + ' ' + r * .3 + ' L0 ' + r + ' L' + -r * .3 + ' ' + r * .3 + ' L' + -r + ' 0 L' + -r * .3 + ' ' + -r * .3 + 'Z" fill="' + f + '"/>';

/* 1 — projects in progress: layered slabs + check badge + gear + pencil */
function active(){
  const id = 'a', blue = pal('#4f86f0'), navy = pal('#3157b8'), sky = pal('#7db0ff');
  let g = defs(id, '#5b8def', '<linearGradient id="agr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fe3a6"/><stop offset="1" stop-color="#1fae78"/></linearGradient>' +
    '<linearGradient id="ago" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#f08a24"/></linearGradient>');
  g += shadow(id, 78);
  g += boxC(120, 128, 54, 54, 14, navy) + boxC(120, 112, 44, 44, 14, blue) + boxC(120, 96, 34, 34, 14, sky);
  /* progress ring on the top slab */
  g += '<ellipse cx="120" cy="96" rx="11" ry="5.5" fill="none" stroke="#fff" stroke-width="2.4" opacity=".9"/><ellipse cx="120" cy="96" rx="11" ry="5.5" fill="none" stroke="#2fd08d" stroke-width="2.4" stroke-dasharray="22 60" stroke-linecap="round"/>';
  /* check badge */
  g += '<g transform="translate(120 46)"><ellipse cy="26" rx="14" ry="3.5" fill="#000" opacity=".25" filter="url(#' + id + 'b)"/><circle r="21" fill="url(#agr)"/><circle r="21" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/><path d="M-9 1 L-2.5 8 L10 -7" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></g>';
  /* gear */
  let teeth = ''; for (let i = 0; i < 8; i++) teeth += '<rect x="-3.5" y="-21" width="7" height="9" rx="2" transform="rotate(' + i * 45 + ')"/>';
  g += '<g transform="translate(184 74)"><g fill="url(#ago)">' + teeth + '<circle r="15"/></g><circle r="6.5" fill="#b85d10" opacity=".9"/><circle r="6.5" fill="none" stroke="#ffe3b0" stroke-width="1.2"/></g>';
  /* pencil */
  g += '<g transform="translate(62 70) rotate(-38)"><rect x="-5" y="-30" width="10" height="46" rx="2" fill="#ffcf4d"/><rect x="-5" y="-30" width="4" height="46" rx="2" fill="#fff" opacity=".35"/><rect x="-5" y="-36" width="10" height="8" rx="2" fill="#ff7a8a"/><path d="M-5 16 L5 16 L0 28 Z" fill="#f1d4a8"/><path d="M-2 23 L2 23 L0 28 Z" fill="#37414f"/></g>';
  g += star(48, 40, 6, '#cfe0ff') + star(196, 36, 5, '#ffffff') + star(168, 124, 4, '#cfe0ff');
  return svg(g);
}

/* 2 — completed projects: podium + golden trophy */
function done(){
  const id = 'd', gold = pal('#e9a92f'), sil = pal('#9aa7b8'), bro = pal('#c9803c');
  let g = defs(id, '#f0b43c', '<linearGradient id="dcup" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe08a"/><stop offset=".55" stop-color="#f2b232"/><stop offset="1" stop-color="#c47d12"/></linearGradient>');
  g += shadow(id, 92, 172);
  g += boxC(66, 124, 40, 40, 26, sil) + boxC(174, 130, 40, 40, 18, bro) + boxC(120, 112, 46, 46, 38, gold);
  /* trophy */
  g += '<g transform="translate(120 103)"><ellipse cy="8" rx="19" ry="4" fill="#000" opacity=".25"/>' +
    '<path d="M-24 -42 C-42 -42 -42 -14 -20 -10" fill="none" stroke="#e0951c" stroke-width="5" stroke-linecap="round"/><path d="M24 -42 C42 -42 42 -14 20 -10" fill="none" stroke="#c47d12" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M-26 -52 H26 V-34 C26 -14 14 -6 0 -6 C-14 -6 -26 -14 -26 -34 Z" fill="url(#dcup)"/><path d="M-20 -50 H-12 V-30 C-12 -22 -8 -14 -2 -10 C-14 -12 -20 -22 -20 -34 Z" fill="#fff" opacity=".35"/>' +
    '<rect x="-4.5" y="-8" width="9" height="12" fill="#d79120"/><rect x="-15" y="2" width="30" height="7" rx="2.5" fill="#b8730f"/><rect x="-15" y="2" width="30" height="3" rx="1.5" fill="#f2b232"/></g>';
  g += star(120, 30, 9, '#fff3c4') + star(76, 54, 5, '#ffe08a') + star(168, 52, 6, '#ffe08a') + star(40, 100, 4, '#fff') + star(204, 100, 4, '#fff');
  return svg(g);
}

/* 3 — learning: stack of books + graduation cap + play badge */
function learn(){
  const id = 'l', v = pal('#8b5cf6'), p = pal('#e0559b'), b = pal('#3e8ef0'), paper = { t: '#fff', l: '#ece8f7', r: '#d4cfe8' };
  let g = defs(id, '#9b6bff');
  g += shadow(id, 84);
  g += boxC(116, 136, 68, 46, 16, b) + boxC(122, 118, 60, 42, 16, p) + boxC(116, 100, 54, 38, 16, v);
  /* page edges on the front faces */
  [[116, 136, 68, 46, b], [122, 118, 60, 42, p], [116, 100, 54, 38, v]].forEach(([cx, cy, sx, sy]) => {
    const fx = cx + (sx - sy) / 2, fy = cy + (sx + sy) / 4;           // front corner of the top face
    g += '<polygon points="' + [[fx - sy + 3, fy - sy / 2 + 1.5], [fx - 3, fy - 1.5], [fx - 3, fy + 11.5], [fx - sy + 3, fy - sy / 2 + 13]].join(' ') + '" fill="#fff" opacity=".75"/>';
  });
  /* mortarboard */
  g += '<g transform="translate(120 44)"><ellipse cy="38" rx="30" ry="6" fill="#000" opacity=".22" filter="url(#' + id + 'b)"/>' +
    '<path d="M-24 8 V24 C-14 34 14 34 24 24 V8 Z" fill="#2e2a63"/><path d="M-24 8 V24 C-14 34 0 34 0 34 V8Z" fill="#403a85"/>' +
    '<polygon points="0,-18 54,2 0,22 -54,2" fill="#3b3580"/><polygon points="0,-18 54,2 0,10 -54,2" fill="#5a52b3"/><polygon points="0,-18 54,2 0,22 -54,2" fill="none" stroke="#7a72d6" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<circle cx="0" cy="2" r="3.5" fill="#f5c04a"/><path d="M0 2 L40 6 L40 26" fill="none" stroke="#f5c04a" stroke-width="2.2" stroke-linecap="round"/><path d="M40 24 l-3 12 h6 z" fill="#f5c04a"/></g>';
  /* play badge */
  g += '<g transform="translate(188 62)"><circle r="19" fill="#ff5d73"/><circle r="19" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2"/><path d="M-6 -9 L10 0 L-6 9 Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></g>';
  g += star(52, 66, 6, '#e3d6ff') + star(204, 118, 5, '#ffffff') + star(44, 110, 4, '#e3d6ff');
  return svg(g);
}

/* 4 — tasks & notes: checklist card, sticky notes, bell */
function tasks(){
  const id = 't';
  let g = defs(id, '#3ccf91', '<linearGradient id="tcard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6ece9"/></linearGradient>' +
    '<linearGradient id="tclip" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb04a"/><stop offset="1" stop-color="#e8801a"/></linearGradient>');
  g += shadow(id, 86);
  /* sticky notes behind */
  g += '<g transform="translate(176 92) rotate(9)"><rect x="-26" y="-26" width="52" height="52" rx="4" fill="#d9a92e" transform="translate(5 6)"/><rect x="-26" y="-26" width="52" height="52" rx="4" fill="#ffd45e"/><path d="M-26 14 L26 14 L26 22 a4 4 0 0 1 -4 4 H-22 a4 4 0 0 1 -4 -4Z" fill="#f2bd3a"/><rect x="-17" y="-14" width="30" height="4" rx="2" fill="#b98a1e" opacity=".6"/><rect x="-17" y="-5" width="22" height="4" rx="2" fill="#b98a1e" opacity=".6"/><circle cy="-26" r="5" fill="#ff5d73"/></g>';
  g += '<g transform="translate(62 100) rotate(-9)"><rect x="-24" y="-24" width="48" height="48" rx="4" fill="#c4478a" transform="translate(5 6)"/><rect x="-24" y="-24" width="48" height="48" rx="4" fill="#ff8fc0"/><rect x="-16" y="-12" width="28" height="4" rx="2" fill="#a53a74" opacity=".55"/><rect x="-16" y="-3" width="20" height="4" rx="2" fill="#a53a74" opacity=".55"/><circle cy="-24" r="5" fill="#5b8def"/></g>';
  /* main card with thickness */
  g += '<rect x="76" y="40" width="88" height="112" rx="10" fill="#0e8f5f" transform="translate(7 8)"/><rect x="76" y="40" width="88" height="112" rx="10" fill="url(#tcard)"/>';
  [[62, 0], [88, 1], [114, 1]].forEach(([y, c]) => {
    g += '<rect x="88" y="' + (y) + '" width="15" height="15" rx="4" fill="' + (c ? '#2fd08d' : '#f4f6f5') + '" stroke="#2fd08d" stroke-width="2"/>' +
      (c ? '<path d="M91 ' + (y + 8) + ' l3.5 3.8 l6 -7.6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' : '') +
      '<rect x="110" y="' + (y + 2) + '" width="40" height="4.5" rx="2.2" fill="#b9c4be"/><rect x="110" y="' + (y + 9) + '" width="26" height="4.5" rx="2.2" fill="#d6ddd9"/>';
  });
  g += '<rect x="102" y="31" width="36" height="18" rx="6" fill="url(#tclip)"/><rect x="109" y="25" width="22" height="12" rx="6" fill="none" stroke="#c9d1cd" stroke-width="3.5"/><circle cx="120" cy="40" r="3" fill="#fff" opacity=".8"/>';
  /* bell */
  g += '<g transform="translate(150 30) rotate(14)"><path d="M0 -17 C-11 -17 -13 -7 -13 2 C-13 9 -17 11 -17 14 H17 C17 11 13 9 13 2 C13 -7 11 -17 0 -17 Z" fill="#ff7a59"/><path d="M-9 -9 C-12 -2 -9 6 -9 10 H-13 C-13 8 -9 6 -9 2 C-9 -3 -7 -7 -3 -11Z" fill="#fff" opacity=".35"/><circle cy="19" r="4.5" fill="#d9532f"/><circle cy="-19" r="2.5" fill="#ff7a59"/></g>';
  g += star(44, 54, 5, '#c6ffe7') + star(204, 58, 6, '#ffffff');
  return svg(g);
}
MSA.art = { active: active, done: done, learn: learn, tasks: tasks };
})();

