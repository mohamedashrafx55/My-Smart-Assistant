/* Minimal .docx writer (no libraries): HTML from the cell editor -> real Word file (headings, bold / italic / underline,
   bullet + numbered lists, Arabic right-to-left paragraphs). The package is a hand-written ZIP (stored, CRC-32). */
(function(){
'use strict';
const MSA = window.MSA;
const AR = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

/* ---------- zip (store) ---------- */
let CT = null;
const crc = u8 => { if (!CT) { CT = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CT[n] = c >>> 0; } } let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CT[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(files){
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  files.forEach(([name, data]) => {
    const nm = enc.encode(name), u8 = typeof data === 'string' ? enc.encode(data) : data, c = crc(u8);
    const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, c, true); lh.setUint32(18, u8.length, true); lh.setUint32(22, u8.length, true); lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), nm, u8);
    const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, c, true); ch.setUint32(20, u8.length, true); ch.setUint32(24, u8.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
    cen.push(new Uint8Array(ch.buffer), nm);
    off += 30 + nm.length + u8.length;
  });
  const csz = cen.reduce((a, x) => a + x.length, 0), end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, csz, true); end.setUint32(16, off, true);
  return new Blob(parts.concat(cen, [new Uint8Array(end.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

/* ---------- html -> paragraphs ---------- */
const BLOCK = { P: 1, DIV: 1, H1: 1, H2: 1, H3: 1, H4: 1, LI: 1, BLOCKQUOTE: 1, PRE: 1, UL: 1, OL: 1, TABLE: 1, TR: 1 };
function parse(html, defRtl){
  const root = document.createElement('div'); root.innerHTML = String(html || '');
  const paras = []; let cur = null, numCount = 0;
  const open = (o) => { cur = Object.assign({ runs: [], style: '', list: null }, o || {}); paras.push(cur); return cur; };
  const ensure = () => cur || open();
  const addText = (t, f) => { if (!t) return; ensure().runs.push({ t, b: f.b, i: f.i, u: f.u }); };
  const walk = (n, f, ctx) => {
    if (n.nodeType === 3) { addText(n.nodeValue.replace(/\s+/g, ' '), f); return; }
    if (n.nodeType !== 1) return;
    const tg = n.tagName;
    if (tg === 'BR') { ensure().runs.push({ br: true }); return; }
    const nf = Object.assign({}, f);
    if (tg === 'B' || tg === 'STRONG' || /^(bold|[6-9]00)$/.test(n.style.fontWeight || '')) nf.b = true;
    if (tg === 'I' || tg === 'EM' || n.style.fontStyle === 'italic') nf.i = true;
    if (tg === 'U' || /underline/.test(n.style.textDecoration || '')) nf.u = true;
    if (tg === 'UL' || tg === 'OL') {
      const num = tg === 'OL' ? ++numCount : 0;
      Array.from(n.childNodes).forEach(c => { if (c.nodeType === 1 && c.tagName === 'LI') { open({ list: { ord: tg === 'OL', num: num || 0, lvl: Math.min(ctx.lvl, 3) } }); Array.from(c.childNodes).forEach(k => { if (k.nodeType === 1 && (k.tagName === 'UL' || k.tagName === 'OL')) { cur = null; walk(k, nf, { lvl: ctx.lvl + 1 }); } else walk(k, nf, ctx); }); cur = null; } else walk(c, nf, ctx); });
      cur = null; return;
    }
    if (BLOCK[tg]) {
      cur = null; const o = {};
      if (/^H[1-4]$/.test(tg)) o.style = 'Heading' + Math.min(3, +tg[1]);
      if (tg === 'BLOCKQUOTE') o.quote = true;
      const ta = n.style.textAlign || n.getAttribute('align'); if (ta) o.align = ta;
      if (n.getAttribute('dir') === 'rtl') o.rtl = true; else if (n.getAttribute('dir') === 'ltr') o.rtl = false;
      open(o); Array.from(n.childNodes).forEach(c => walk(c, nf, ctx)); cur = null; return;
    }
    Array.from(n.childNodes).forEach(c => walk(c, nf, ctx));
  };
  Array.from(root.childNodes).forEach(c => walk(c, {}, { lvl: 0 }));
  return paras.filter(p => p.runs.length || p.list);
}

/* ---------- paragraphs -> document.xml ---------- */
const FONT = '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>';
function runXml(r, rtl, sz){
  if (r.br) return '<w:r><w:br/></w:r>';
  const pr = FONT + (r.b ? '<w:b/><w:bCs/>' : '') + (r.i ? '<w:i/><w:iCs/>' : '') + (r.u ? '<w:u w:val="single"/>' : '') + (sz ? '<w:sz w:val="' + sz + '"/><w:szCs w:val="' + sz + '"/>' : '') + (rtl ? '<w:rtl/>' : '');
  return '<w:r><w:rPr>' + pr + '</w:rPr><w:t xml:space="preserve">' + xe(r.t) + '</w:t></w:r>';
}
function bodyXml(paras, defRtl){
  const nums = {}; let out = '';
  paras.forEach(p => {
    const txt = p.runs.map(r => r.t || '').join(''), rtl = p.rtl != null ? p.rtl : (AR.test(txt) ? true : (txt.trim() ? false : defRtl));
    let ppr = '';
    if (p.style) ppr += '<w:pStyle w:val="' + p.style + '"/>';
    if (p.list) { const id = p.list.ord ? 2 + p.list.num : 1; nums[id] = p.list.ord ? p.list.num : 0; ppr += '<w:numPr><w:ilvl w:val="' + p.list.lvl + '"/><w:numId w:val="' + id + '"/></w:numPr>'; }
    if (p.quote) ppr += '<w:ind w:left="567"/>';
    if (rtl) ppr += '<w:bidi/>';
    const al = p.align === 'center' ? 'center' : p.align === 'right' ? (rtl ? 'left' : 'right') : p.align === 'left' ? (rtl ? 'right' : 'left') : p.align === 'justify' ? 'both' : '';
    if (al) ppr += '<w:jc w:val="' + al + '"/>';
    out += '<w:p>' + (ppr ? '<w:pPr>' + ppr + '</w:pPr>' : '') + p.runs.map(r => runXml(r, rtl, 0)).join('') + '</w:p>';
  });
  return { xml: out, nums };
}
const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
function numbering(nums){
  const lvl = (i, bullet) => '<w:lvl w:ilvl="' + i + '"><w:start w:val="1"/><w:numFmt w:val="' + (bullet ? 'bullet' : 'decimal') + '"/><w:lvlText w:val="' + (bullet ? '•' : '%' + (i + 1) + '.') + '"/><w:lvlJc w:val="start"/><w:pPr><w:ind w:left="' + (720 + i * 360) + '" w:hanging="360"/></w:pPr>' + (bullet ? '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/></w:rPr>' : '') + '</w:lvl>';
  let x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ' + NS + '><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>' + [0, 1, 2, 3].map(i => lvl(i, true)).join('') + '</w:abstractNum><w:abstractNum w:abstractNumId="2"><w:multiLevelType w:val="hybridMultilevel"/>' + [0, 1, 2, 3].map(i => lvl(i, false)).join('') + '</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>';
  Object.keys(nums).forEach(id => { if (+id >= 3) x += '<w:num w:numId="' + id + '"><w:abstractNumId w:val="2"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>'; });
  return x + '<w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num></w:numbering>';
}
const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ' + NS + '><w:docDefaults><w:rPrDefault><w:rPr>' + FONT + '<w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:bidi="ar-EG"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
  '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
  [[1, 40, 'Title'], [2, 32, ''], [3, 28, '']].map(h => '<w:style w:type="paragraph" w:styleId="Heading' + h[0] + '"><w:name w:val="heading ' + h[0] + '"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="' + (h[0] - 1) + '"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="' + h[1] + '"/><w:szCs w:val="' + h[1] + '"/></w:rPr></w:style>').join('') + '</w:styles>';

/* html (+ optional title) -> Blob */
function build(html, o){
  o = o || {}; const defRtl = o.rtl !== false && (o.rtl === true || (document.documentElement.dir === 'rtl'));
  let paras = parse(html, defRtl);
  if (o.title) paras.unshift({ runs: [{ t: o.title }], style: 'Heading1', list: null });
  if (!paras.length) paras = [{ runs: [], style: '', list: null }];
  const b = bodyXml(paras, defRtl);
  const doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + NS + '><w:body>' + b.xml + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>' + (defRtl ? '<w:bidi/>' : '') + '</w:sectPr></w:body></w:document>';
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  return zip([
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'],
    ['word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>'],
    ['word/document.xml', doc], ['word/styles.xml', STYLES], ['word/numbering.xml', numbering(b.nums)],
    ['docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + xe(o.title || '') + '</dc:title><dc:creator>' + xe(o.author || 'My Smart Assistant') + '</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created></cp:coreProperties>']
  ]);
}
MSA.docx = { build, parse, zip };
})();
