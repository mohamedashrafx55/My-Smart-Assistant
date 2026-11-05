/* Media: music library + player that keeps playing while you work (mini bar, lock-screen service on Android),
   and an in-app video player (files, YouTube / Vimeo / direct links) with a floating mini window. */
(function(){
'use strict';
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$, $$ = MSA.$$;
const T = (a, e) => MSA.T(a, e), esc = U.esc;
Object.assign(MSA.dict.en, { 'nav.media': 'Music & video', 'nav.s.media': 'Media' });
Object.assign(MSA.dict.ar, { 'nav.media': 'الموسيقى والفيديو', 'nav.s.media': 'الميديا' });

const M = () => {
  const s = MSA.state; const m = s.media = s.media || {};
  m.tracks = m.tracks || []; m.lists = m.lists || []; m.videos = m.videos || [];
  if (m.vol == null) m.vol = 1; m.repeat = m.repeat || 'off'; m.shuffle = !!m.shuffle; m.speed = m.speed || 1;
  return m;
};
const fmt = s => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + U.pad(m) : m) + ':' + U.pad(x); };
const fire = () => document.dispatchEvent(new CustomEvent('msa-media'));
const NM = () => { try { return MSA.native && MSA.native('MsaMedia'); } catch (e) { return null; } };

/* ====================================================================== music engine */
const aud = new Audio(); aud.preload = 'auto';
let order = [], pos = -1, curId = null, listCtx = null, loading = false;
const tr = id => M().tracks.find(x => x.id === id);
const idsOf = lid => { const m = M(); const l = lid && m.lists.find(x => x.id === lid); const ids = l ? l.ids : m.tracks.map(x => x.id); return ids.filter(i => tr(i)); };
function buildOrder(startId){
  let ids = idsOf(listCtx).slice();
  if (M().shuffle) { for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } if (startId) { ids = ids.filter(x => x !== startId); ids.unshift(startId); } }
  order = ids; pos = Math.max(0, order.indexOf(startId));
}
async function play(id, lid){
  const t = tr(id); if (!t) return;
  if (lid !== undefined) listCtx = lid || null;
  if (!order.includes(id) || lid !== undefined) buildOrder(id); else pos = order.indexOf(id);
  loading = true; fire();
  const u = await MSA.files.url(t.file); loading = false;
  if (!u) { MSA.toast(T('ملف الأغنية مش موجود', 'The track file is missing'), 'err'); fire(); return; }
  if (MSA.player && MSA.player.pauseVideo) MSA.player.pauseVideo();
  curId = id; aud.src = u; aud.volume = M().vol; aud.playbackRate = 1;
  try { await aud.play(); } catch (e) { MSA.toast(T('تعذّر تشغيل الملف ده', 'Could not play this file'), 'err'); }
  session(); native(); paintMini(); fire();
}
function toggle(){ if (!curId) { const ids = idsOf(listCtx); if (ids.length) play(ids[0], listCtx || null); return; } if (aud.paused) aud.play().catch(() => {}); else aud.pause(); }
function step(dir, auto){
  if (!order.length) return;
  const rep = M().repeat;
  if (auto && rep === 'one') { aud.currentTime = 0; aud.play().catch(() => {}); return; }
  let n = pos + dir;
  if (n >= order.length) { if (rep === 'all' || !auto) n = 0; else { aud.pause(); aud.currentTime = 0; fire(); return; } }
  if (n < 0) n = rep === 'all' || !auto ? order.length - 1 : 0;
  play(order[n]);
}
const next = () => step(1, false), prev = () => { if (aud.currentTime > 3) { aud.currentTime = 0; return; } step(-1, false); };
function stop(){
  try { aud.pause(); } catch (e) {} curId = null; aud.removeAttribute('src'); try { aud.load(); } catch (e) {}
  native(); paintMini(); fire();
}
aud.addEventListener('ended', () => step(1, true));
aud.addEventListener('play', () => { session(); native(); paintMini(); fire(); });
aud.addEventListener('pause', () => { native(); paintMini(); fire(); });
aud.addEventListener('loadedmetadata', () => { const t = tr(curId); if (t && isFinite(aud.duration) && Math.abs((t.dur || 0) - aud.duration) > 1) { t.dur = Math.round(aud.duration); MSA.save(); } fire(); });
let lastTick = 0;
aud.addEventListener('timeupdate', () => { const n = Date.now(); if (n - lastTick > 450) { lastTick = n; document.dispatchEvent(new CustomEvent('msa-media-tick')); } });
aud.addEventListener('error', () => { if (curId) MSA.toast(T('الملف ده مش مدعوم أو تالف', 'This file is not supported or is damaged'), 'err'); });

function session(){
  try {
    if (!('mediaSession' in navigator) || !curId) return; const t = tr(curId); if (!t) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({ title: t.name, artist: 'My Smart Assistant' });
    const set = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch (e) {} };
    set('play', () => aud.play()); set('pause', () => aud.pause()); set('nexttrack', next); set('previoustrack', prev);
    set('seekto', d => { if (d && d.seekTime != null) aud.currentTime = d.seekTime; });
  } catch (e) {}
}
/* Android: a foreground service + notification keeps the music going with the screen off */
let nativeBound = false;
function native(){
  const n = NM(); if (!n) return;
  try {
    if (!nativeBound) {
      nativeBound = true;
      n.addListener('action', e => { const a = e && e.a; if (a === 'play') aud.play().catch(() => {}); else if (a === 'pause') aud.pause(); else if (a === 'next') next(); else if (a === 'prev') prev(); else if (a === 'stop') stop(); });
    }
    const t = tr(curId);
    n.sync({ active: !!t, title: t ? t.name : '', playing: !aud.paused && !!t }).catch(() => {});
  } catch (e) {}
}

/* ---------------------------------------------------------------- floating mini bar */
let mini = null;
function navOffset(){
  const nav = $('#nav'); let h = 0;
  if (nav && nav.offsetParent !== null) { const r = nav.getBoundingClientRect(); if (r.top > innerHeight / 2) h = Math.max(0, innerHeight - r.top); }
  document.documentElement.style.setProperty('--navh', h + 'px');
}
function paintMini(){
  const t = curId && tr(curId);
  if (!t) { if (mini) { mini.remove(); mini = null; } return; }
  if (!mini) {
    mini = document.createElement('div'); mini.id = 'msaMini'; mini.setAttribute('role', 'region'); mini.setAttribute('aria-label', T('مشغّل الموسيقى', 'Music player'));
    mini.innerHTML = '<button class="mm-t" data-mm="open"><span class="mm-ic">' + I('music', 'sm') + '</span><span class="mm-n" dir="auto"></span></button>' +
      '<button class="icon-btn sm" data-mm="prev" aria-label="prev">' + I('skip-b', 'sm') + '</button><button class="icon-btn mm-p" data-mm="play" aria-label="play"></button>' +
      '<button class="icon-btn sm" data-mm="next" aria-label="next">' + I('skip-f', 'sm') + '</button><button class="icon-btn sm" data-mm="stop" aria-label="close">' + I('x', 'sm') + '</button><i class="mm-bar"><b></b></i>';
    mini.addEventListener('click', e => { const b = e.target.closest('[data-mm]'); if (!b) return; const a = b.dataset.mm; if (a === 'play') toggle(); else if (a === 'next') next(); else if (a === 'prev') prev(); else if (a === 'stop') stop(); else if (a === 'open') MSA.go('media'); });
    document.body.appendChild(mini); navOffset();
  }
  $('.mm-n', mini).textContent = t.name; $('.mm-p', mini).innerHTML = I(aud.paused ? 'play' : 'pause');
  mini.classList.toggle('on', !aud.paused);
  const bar = $('.mm-bar b', mini); if (bar) bar.style.width = (aud.duration ? aud.currentTime / aud.duration * 100 : 0) + '%';
}
document.addEventListener('msa-media-tick', () => { if (mini) { const bar = $('.mm-bar b', mini); if (bar) bar.style.width = (aud.duration ? aud.currentTime / aud.duration * 100 : 0) + '%'; } });
addEventListener('resize', () => { navOffset(); });

/* ====================================================================== video / embed player */
const YT = id => 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&playsinline=1&rel=0&modestbranding=1';
/* what can play inside the app: { kind:'embed'|'video', url } or null */
function playable(url){
  if (!url) return null;
  const y = MSA.ytId ? MSA.ytId(url) : null; if (y) return { kind: 'embed', url: YT(y), yt: y };
  let m = String(url).match(/vimeo\.com\/(?:video\/)?(\d{6,})/i); if (m) return { kind: 'embed', url: 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1' };
  if (/\.(mp4|webm|mov|m4v|ogv|mkv)(\?|#|$)/i.test(url)) return { kind: 'video', url };
  return null;
}
let pl = null, vid = null, immersive = false;
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
function build(){
  if (pl) return pl;
  pl = document.createElement('div'); pl.id = 'msaPlayer'; pl.className = 'pl full'; pl.hidden = true;
  pl.innerHTML = '<div class="pl-top"><b class="pl-title" dir="auto"></b><div class="pl-tb"><button class="icon-btn sm" data-pl="mini" aria-label="minimize">' + I('minimize', 'sm') + '</button><button class="icon-btn sm" data-pl="close" aria-label="close">' + I('x', 'sm') + '</button></div></div>' +
    '<div class="pl-stage"></div>' +
    '<div class="pl-ctl"><input type="range" class="pl-seek" min="0" max="1000" value="0" aria-label="seek"><div class="pl-row"><span class="pl-t" dir="ltr">0:00 / 0:00</span><span class="grow"></span>' +
      '<button class="icon-btn" data-pl="rew" aria-label="-10s">' + I('rew10') + '<i>10</i></button><button class="icon-btn pl-pp" data-pl="play" aria-label="play">' + I('play') + '</button><button class="icon-btn" data-pl="fwd" aria-label="+10s">' + I('fwd10') + '<i>10</i></button><span class="grow"></span>' +
      '<button class="btn sm pl-sp" data-pl="speed">1×</button><button class="icon-btn" data-pl="pip" aria-label="pip">' + I('pip') + '</button><button class="icon-btn" data-pl="fs" aria-label="fullscreen">' + I('maximize') + '</button></div></div>' +
    '<div class="pl-mov"><button class="icon-btn sm" data-pl="play" aria-label="play">' + I('play', 'sm') + '</button><button class="icon-btn sm" data-pl="full" aria-label="expand">' + I('maximize', 'sm') + '</button><button class="icon-btn sm" data-pl="close" aria-label="close">' + I('x', 'sm') + '</button></div>';
  document.body.appendChild(pl);
  pl.addEventListener('click', e => {
    const b = e.target.closest('[data-pl]'); if (!b) return; const a = b.dataset.pl;
    if (a === 'close') close(); else if (a === 'mini') setMode('mini'); else if (a === 'full') setMode('full');
    else if (a === 'play') { if (vid) { if (vid.paused) vid.play().catch(() => {}); else vid.pause(); } }
    else if (a === 'rew') { if (vid) vid.currentTime = Math.max(0, vid.currentTime - 10); }
    else if (a === 'fwd') { if (vid) vid.currentTime = Math.min(vid.duration || 1e9, vid.currentTime + 10); }
    else if (a === 'speed') { const m = M(); const i = SPEEDS.indexOf(m.speed); m.speed = SPEEDS[(i + 1) % SPEEDS.length]; MSA.save(); if (vid) vid.playbackRate = m.speed; paintCtl(); }
    else if (a === 'pip') { try { if (document.pictureInPictureElement) document.exitPictureInPicture(); else if (vid && vid.requestPictureInPicture) vid.requestPictureInPicture().catch(() => MSA.toast(T('النافذة المصغّرة غير مدعومة هنا', 'Picture-in-picture is not supported here'))); } catch (x) {} }
    else if (a === 'fs') toggleFs();
  });
  $('.pl-seek', pl).addEventListener('input', e => { if (vid && isFinite(vid.duration)) vid.currentTime = vid.duration * e.target.value / 1000; });
  /* drag the mini window */
  let drag = null;
  pl.addEventListener('pointerdown', e => {
    if (!pl.classList.contains('mini') || e.target.closest('button,input')) return;
    const r = pl.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; pl.setPointerCapture(e.pointerId); pl.classList.add('drag');
  });
  pl.addEventListener('pointermove', e => { if (!drag) return; const w = pl.offsetWidth, h = pl.offsetHeight; pl.style.left = Math.min(Math.max(0, e.clientX - drag.dx), innerWidth - w) + 'px'; pl.style.top = Math.min(Math.max(0, e.clientY - drag.dy), innerHeight - h) + 'px'; pl.style.right = 'auto'; pl.style.bottom = 'auto'; });
  const end = () => { drag = null; pl.classList.remove('drag'); };
  pl.addEventListener('pointerup', end); pl.addEventListener('pointercancel', end);
  document.addEventListener('keydown', e => { if (pl && !pl.hidden && e.key === 'Escape' && !document.querySelector('.overlay')) { if (document.fullscreenElement) return; if (pl.classList.contains('full')) setMode('mini'); } });
  return pl;
}
function paintCtl(){
  if (!pl) return; const sp = $('.pl-sp', pl); if (sp) sp.textContent = M().speed + '×';
  const pp = vid && !vid.paused; $$('[data-pl=play]', pl).forEach(b => { b.innerHTML = I(pp ? 'pause' : 'play', b.classList.contains('pl-pp') ? '' : 'sm'); });
  const tt = $('.pl-t', pl); if (tt && vid) tt.textContent = fmt(vid.currentTime) + ' / ' + fmt(vid.duration);
  const sk = $('.pl-seek', pl); if (sk && vid && vid.duration && document.activeElement !== sk) sk.value = Math.round(vid.currentTime / vid.duration * 1000);
}
function setMode(m){
  build(); pl.classList.toggle('full', m === 'full'); pl.classList.toggle('mini', m === 'mini');
  if (m === 'full') { pl.style.left = pl.style.top = pl.style.right = pl.style.bottom = ''; } else { pl.classList.remove('imm'); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} }
  navOffset();
}
function toggleFs(){
  const full = pl.classList.contains('full'); if (!full) { setMode('full'); return; }
  try {
    if (document.fullscreenElement) { document.exitFullscreen(); pl.classList.remove('imm'); try { screen.orientation.unlock(); } catch (e) {} return; }
    if (pl.requestFullscreen) { pl.requestFullscreen().then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => imm()); return; }
  } catch (e) {}
  imm();
}
function imm(){ pl.classList.toggle('imm'); try { if (pl.classList.contains('imm')) screen.orientation.lock('landscape').catch(() => {}); else screen.orientation.unlock(); } catch (e) {} }
document.addEventListener('fullscreenchange', () => { if (pl && !document.fullscreenElement) { pl.classList.remove('imm'); try { screen.orientation.unlock(); } catch (e) {} } });
function close(){
  if (!pl) return; try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
  try { if (document.pictureInPictureElement) document.exitPictureInPicture(); } catch (e) {}
  const st = $('.pl-stage', pl); st.innerHTML = ''; vid = null; pl.hidden = true; pl.classList.remove('imm');
  try { screen.orientation.unlock(); } catch (e) {}
}

/* A format this device cannot decode (typically .avi, sometimes .mkv): say so plainly and offer the way out. */
function failed(o, st){
  vid = null; const ext = (o.name || '').split('.').pop().toUpperCase().slice(0, 5);
  const ext_ok = !!o.fileId;
  st.innerHTML = '<div class="pl-fail"><div>' + I('video') + '</div><b>' + esc(T('الجهاز مش قادر يشغّل الفيديو ده جوه التطبيق', 'This device can not play this video inside the app')) + '</b>' +
    '<p>' + esc(T('صيغة ' + (ext || 'الملف') + ' ساعات بتحتاج مشغّل تاني. جرّب تفتحه بمشغّل الفيديو اللي على جهازك.', (ext || 'This') + ' files sometimes need another player. Try opening it with a video player on your device.')) + '</p>' +
    (ext_ok ? '<div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn primary" data-plf="ext">' + I('link', 'sm') + esc(T('افتح في مشغّل تاني', 'Open in another player')) + '</button><button class="btn" data-plf="save">' + I('download', 'sm') + esc(T('حفظ نسخة', 'Save a copy')) + '</button></div>' : '') + '</div>';
  paintCtl();
  st.onclick = async e => {
    const b = e.target.closest('[data-plf]'); if (!b) return;
    if (b.dataset.plf === 'save') { if (o.fileId) MSA.downloadAtt({ id: o.fileId, name: o.name || 'video' }); return; }
    openExternal(o, b);
  };
}
const MIME = { mkv: 'video/x-matroska', avi: 'video/x-msvideo', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', m4v: 'video/x-m4v', wmv: 'video/x-ms-wmv', flv: 'video/x-flv' };
async function openExternal(o, btn){
  const N = NM();
  if (!N || !N.stageChunk || !N.openExternal) { MSA.toast(T('الفتح في مشغّل تاني متاح في تطبيق الأندرويد بعد التحديث. استخدم «حفظ نسخة».', 'Opening in another player is available in the Android app. Use "Save a copy".')); return; }
  const rec = await MSA.files.get(o.fileId); if (!rec) { MSA.toast(T('ملف الفيديو مش موجود', 'The video file is missing'), 'err'); return; }
  const name = (o.name || 'video').replace(/[^\w.\-]+/g, '_').slice(-60) || 'video';
  const CH = 3 * 1024 * 1024, blob = rec.blob; if (btn) btn.disabled = true;
  const prog = MSA.toast(T('بجهّز الفيديو…', 'Preparing the video…'));
  try {
    for (let off = 0, first = true; off < blob.size || first; off += CH, first = false) {
      const buf = await blob.slice(off, off + CH).arrayBuffer(); let bin = ''; const u8 = new Uint8Array(buf);
      for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      await N.stageChunk({ name, data: btoa(bin), first });
      if (!blob.size) break;
    }
    await N.openExternal({ name, mime: MIME[name.split('.').pop().toLowerCase()] || 'video/*' });
  } catch (e) { MSA.toast(T('تعذر فتح الفيديو في مشغّل تاني', 'Could not open the video in another player'), 'err'); }
  if (btn) btn.disabled = false;
}
function open(o){
  build(); o = o || {};
  if (!aud.paused) aud.pause();
  const st = $('.pl-stage', pl); st.innerHTML = ''; vid = null;
  $('.pl-title', pl).textContent = o.title || '';
  pl.classList.toggle('emb', !!o.embed);
  if (o.embed) {
    st.innerHTML = '<iframe src="' + esc(o.embed) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
  } else if (o.src || (o.srcs && o.srcs.length)) {
    const list = (o.srcs && o.srcs.length ? o.srcs : [o.src]).slice(); let timer = 0;
    const v = document.createElement('video'); v.controls = false; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; v.autoplay = true;
    v.playbackRate = M().speed; st.appendChild(v); vid = v;
    ['play', 'pause', 'timeupdate', 'loadedmetadata', 'ratechange'].forEach(ev => v.addEventListener(ev, paintCtl));
    v.addEventListener('click', () => { if (v.paused) v.play().catch(() => {}); else v.pause(); });
    const next = () => {
      clearTimeout(timer);
      if (vid !== v) return;
      if (list.length) { v.src = list.shift(); v.load(); timer = setTimeout(() => { if (vid === v && !v.readyState) next(); }, 6000); v.play().catch(() => {}); return; }
      failed(o, st);
    };
    v.addEventListener('loadedmetadata', () => clearTimeout(timer));
    v.addEventListener('error', next);
    next();
    const pip = $('[data-pl=pip]', pl); if (pip) pip.hidden = !v.requestPictureInPicture;
  }
  pl.hidden = false; setMode('full'); paintCtl();
}

/* Play a stored file. mkv/avi are not always decodable by the system WebView: try the file as it is, then re-labelled
   as webm / mp4 (Chromium picks its demuxer from the type), then show the "open in another player" fallback. */
async function openStored(id, title, name){
  const rec = await MSA.files.get(id); if (!rec) { MSA.toast(T('ملف الفيديو مش موجود', 'The video file is missing'), 'err'); return; }
  const nm = name || rec.name || title || '', ext = nm.toLowerCase().split('.').pop();
  const urls = [await MSA.files.url(id)];
  if (ext === 'mkv' || ext === 'avi' || !rec.mime || rec.mime === 'application/octet-stream') {
    ['video/webm', 'video/mp4'].forEach(ty => { try { urls.push(URL.createObjectURL(new Blob([rec.blob], { type: ty }))); } catch (e) {} });
  }
  open({ title: title || nm, srcs: urls, fileId: id, name: nm });
  setTimeout(() => urls.slice(1).forEach(u => { try { if (!pl || pl.hidden) URL.revokeObjectURL(u); } catch (e) {} }), 60000);
}
MSA.player = { openStored, open, close, mini: () => setMode('mini'), full: () => setMode('full'), playable, pauseVideo: () => { if (vid && !vid.paused) vid.pause(); } };

/* ====================================================================== library view */
let tab = 'music', curList = null;
const baseName = n => String(n || '').replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim() || T('بدون اسم', 'Untitled');

async function addTracks(){
  const files = await MSA.pickFiles('audio/*', true); if (!files || !files.length) return;
  let n = 0;
  for (const f of files) {
    try { const a = await MSA.files.put(f); const t = { id: U.uid('m'), name: baseName(f.name), file: a.id, size: f.size || 0, added: Date.now() }; M().tracks.push(t); if (curList) { const l = M().lists.find(x => x.id === curList); if (l) l.ids.push(t.id); } n++; }
    catch (e) { MSA.toast(T('فشل إضافة: ', 'Could not add: ') + f.name, 'err'); }
  }
  if (n) { MSA.save(); MSA.toast(T('تمت إضافة ' + n + ' ملف', n + ' track(s) added'), 'ok'); redraw(); }
}
async function trackMenu(id){
  const t = tr(id); if (!t) return; const m = M();
  const body = '<div class="mmenu">' +
    '<button data-a="ren">' + I('pencil', 'sm') + esc(T('تغيير الاسم', 'Rename')) + '</button>' +
    m.lists.map(l => '<button data-a="l:' + l.id + '">' + I(l.ids.includes(id) ? 'check' : 'plus', 'sm') + esc((l.ids.includes(id) ? T('إزالة من: ', 'Remove from: ') : T('إضافة إلى: ', 'Add to: ')) + l.name) + '</button>').join('') +
    '<button data-a="new">' + I('folder-plus', 'sm') + esc(T('قائمة جديدة وإضافة', 'New list and add')) + '</button>' +
    '<button class="danger" data-a="del">' + I('trash', 'sm') + esc(T('حذف من المكتبة', 'Delete from library')) + '</button></div>';
  const q = MSA.modal({ title: t.name, size: 'sm', footer: false, body, onMount: el => {
    el.addEventListener('click', async e => {
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a; q.close();
      if (a === 'ren') { const v = await MSA.ask({ title: T('اسم الأغنية', 'Track name'), value: t.name }); if (v) { t.name = v; MSA.save(); paintMini(); redraw(); } }
      else if (a === 'del') { if (await MSA.confirm(T('حذف «' + t.name + '» من المكتبة؟', 'Delete “' + t.name + '” from the library?'), { danger: true, okLabel: T('حذف', 'Delete') })) { if (curId === id) stop(); m.tracks = m.tracks.filter(x => x.id !== id); m.lists.forEach(l => { l.ids = l.ids.filter(x => x !== id); }); order = order.filter(x => x !== id); try { await MSA.files.del(t.file); } catch (x) {} MSA.save(); redraw(); } }
      else if (a === 'new') { const v = await MSA.ask({ title: T('اسم القائمة', 'List name') }); if (v) { m.lists.push({ id: U.uid('pl'), name: v, ids: [id] }); MSA.save(); redraw(); } }
      else if (a.indexOf('l:') === 0) { const l = m.lists.find(x => x.id === a.slice(2)); if (l) { l.ids = l.ids.includes(id) ? l.ids.filter(x => x !== id) : l.ids.concat(id); MSA.save(); redraw(); } }
    });
  } });
}
function nowHTML(){
  const t = curId && tr(curId); if (!t) return '';
  const m = M();
  return '<div class="np"><div class="np-art">' + I('music') + '</div><div class="np-n" dir="auto">' + esc(t.name) + '</div>' +
    '<div class="np-seek"><span class="np-c" dir="ltr">' + fmt(aud.currentTime) + '</span><input type="range" class="np-r" min="0" max="1000" value="' + (aud.duration ? Math.round(aud.currentTime / aud.duration * 1000) : 0) + '" aria-label="seek"><span class="np-d" dir="ltr">' + fmt(aud.duration || t.dur) + '</span></div>' +
    '<div class="np-ctl"><button class="icon-btn' + (m.shuffle ? ' on' : '') + '" data-md="shuf" aria-label="shuffle">' + I('shuffle') + '</button><button class="icon-btn" data-md="prev" aria-label="prev">' + I('skip-b') + '</button>' +
    '<button class="icon-btn np-play" data-md="toggle" aria-label="play">' + I(aud.paused ? 'play' : 'pause', 'lg') + '</button><button class="icon-btn" data-md="next" aria-label="next">' + I('skip-f') + '</button>' +
    '<button class="icon-btn' + (m.repeat !== 'off' ? ' on' : '') + '" data-md="rep" aria-label="repeat">' + I('repeat') + (m.repeat === 'one' ? '<i class="rp1">1</i>' : '') + '</button></div>' +
    '<div class="np-vol">' + I('volume', 'sm') + '<input type="range" class="np-v" min="0" max="100" value="' + Math.round(m.vol * 100) + '" aria-label="volume"></div></div>';
}
function musicHTML(){
  const m = M(), ids = idsOf(curList), l = curList && m.lists.find(x => x.id === curList);
  const chips = '<div class="tabs-scroll stab"><button class="ttab ' + (!curList ? 'on' : '') + '" data-md="list" data-id="">' + I('music', 'sm') + esc(T('كل الأغاني', 'All tracks')) + '<span class="cnt">' + m.tracks.length + '</span></button>' +
    m.lists.map(x => '<button class="ttab ' + (curList === x.id ? 'on' : '') + '" data-md="list" data-id="' + x.id + '">' + esc(x.name) + '<span class="cnt">' + x.ids.filter(i => tr(i)).length + '</span></button>').join('') +
    '<button class="ttab" data-md="newlist">' + I('plus', 'sm') + esc(T('قائمة', 'List')) + '</button></div>';
  const rows = ids.map(id => { const t = tr(id), on = id === curId; return '<div class="trk' + (on ? ' on' : '') + '" data-id="' + id + '"><button class="trk-p" data-md="play" data-id="' + id + '" aria-label="play">' + I(on && !aud.paused ? 'pause' : 'play', 'sm') + '</button>' +
    '<button class="trk-n" data-md="play" data-id="' + id + '" dir="auto">' + esc(t.name) + '</button><span class="hint" dir="ltr">' + (t.dur ? fmt(t.dur) : '') + '</span><button class="icon-btn sm" data-md="menu" data-id="' + id + '" aria-label="more">' + I('more', 'sm') + '</button></div>'; }).join('');
  return '<div id="npBox">' + nowHTML() + '</div>' + chips +
    '<div class="row" style="gap:8px;flex-wrap:wrap;margin:10px 0"><button class="btn primary" data-md="add">' + I('plus', 'sm') + esc(T('إضافة موسيقى', 'Add music')) + '</button>' +
    (ids.length ? '<button class="btn" data-md="playall">' + I('play', 'sm') + esc(T('تشغيل الكل', 'Play all')) + '</button>' : '') +
    (l ? '<button class="btn" data-md="dellist">' + I('trash', 'sm') + esc(T('حذف القائمة', 'Delete list')) + '</button>' : '') + '</div>' +
    (rows ? '<div class="trklist">' + rows + '</div>' : MSA.empty('music', T('مفيش موسيقى لسه', 'No music yet'), T('أضف ملفات mp3 أو m4a من جهازك وهتفضل شغالة وانت بتشتغل', 'Add mp3 or m4a files from your device and keep them playing while you work')));
}
async function addVideoLink(){
  const v = await MSA.ask({ title: T('رابط فيديو', 'Video link'), label: T('الصق الرابط (يوتيوب، فيميو، أو ملف mp4 مباشر)', 'Paste the link (YouTube, Vimeo or a direct mp4)'), placeholder: 'https://…' });
  if (!v) return; const lu = MSA.linkUtil; const url = lu ? lu.normUrl(v) : ''; if (!url) { MSA.toast(T('ده مش رابط صحيح', 'That is not a valid link'), 'err'); return; }
  const y = MSA.ytId ? MSA.ytId(url) : null;
  const o = { id: U.uid('v'), title: y ? 'YouTube' : lu.hostOf(url), url, thumb: y ? 'https://i.ytimg.com/vi/' + y + '/hqdefault.jpg' : '', added: Date.now() };
  await lu.meta(o, 'title'); M().videos.unshift(o); MSA.save(); redraw();
}
async function addVideoFile(){
  const files = await MSA.pickFiles(MSA.ACCEPT.video, true); if (!files || !files.length) return;
  for (const f of files) { try { const a = await MSA.files.put(f); M().videos.unshift({ id: U.uid('v'), title: baseName(f.name), file: a.id, size: f.size || 0, added: Date.now() }); } catch (e) { MSA.toast(T('فشل إضافة: ', 'Could not add: ') + f.name, 'err'); } }
  MSA.save(); redraw();
}
async function playVideo(v){
  if (v.file) { await openStored(v.file, v.title); return; }
  const p = playable(v.url);
  if (p && p.kind === 'embed') open({ title: v.title, embed: p.url }); else if (p) open({ title: v.title, src: p.url }); else MSA.openLink(v.url);
}
function videoHTML(){
  const vs = M().videos;
  return '<div class="row" style="gap:8px;flex-wrap:wrap;margin:10px 0"><button class="btn primary" data-md="vlink">' + I('link', 'sm') + esc(T('إضافة رابط فيديو', 'Add video link')) + '</button><button class="btn" data-md="vfile">' + I('video', 'sm') + esc(T('إضافة ملف فيديو', 'Add video file')) + '</button></div>' +
    (vs.length ? '<div class="vgrid">' + vs.map(v => '<div class="vc" data-id="' + v.id + '"><button class="vc-t" data-md="vplay" data-id="' + v.id + '" aria-label="play">' + (v.thumb ? '<img src="' + esc(v.thumb) + '" referrerpolicy="no-referrer" loading="lazy" alt="" onerror="this.remove()">' : '') + '<span class="vc-i">' + I('video') + '</span><span class="vc-pl">' + I('play') + '</span></button>' +
      '<div class="vc-n" dir="auto">' + esc(v.title || '') + '</div><div class="vc-a"><button class="icon-btn sm" data-md="vren" data-id="' + v.id + '" aria-label="rename">' + I('pencil', 'sm') + '</button><button class="icon-btn sm" data-md="vdel" data-id="' + v.id + '" aria-label="delete">' + I('trash', 'sm') + '</button></div></div>').join('') + '</div>'
      : MSA.empty('video', T('مفيش فيديوهات لسه', 'No videos yet'), T('أضف رابط يوتيوب أو فيميو أو ملف فيديو وشغّله جوه التطبيق', 'Add a YouTube / Vimeo link or a video file and play it inside the app')));
}
let host = null;
function redraw(){ if (host && document.body.contains(host)) draw(host); }
function draw(h){
  host = h; const m = M();
  h.innerHTML = '<div class="mediav"><div class="home-head" style="margin-bottom:6px"><h1>' + esc(T('الموسيقى والفيديو', 'Music & video')) + '</h1><div class="sub">' + esc(T('موسيقى تفضل شغالة وانت بتشتغل، وفيديو يتشغّل جوه التطبيق', 'Music that keeps playing while you work, and video inside the app')) + '</div></div>' +
    '<div class="tabs-scroll stab"><button class="ttab ' + (tab === 'music' ? 'on' : '') + '" data-md="tab" data-id="music">' + I('music', 'sm') + esc(T('الموسيقى', 'Music')) + '<span class="cnt">' + m.tracks.length + '</span></button>' +
    '<button class="ttab ' + (tab === 'video' ? 'on' : '') + '" data-md="tab" data-id="video">' + I('video', 'sm') + esc(T('الفيديو', 'Video')) + '<span class="cnt">' + m.videos.length + '</span></button></div>' +
    (tab === 'music' ? musicHTML() : videoHTML()) + '</div>';
}
function wire(h){
  h.addEventListener('click', async e => {
    const b = e.target.closest('[data-md]'); if (!b || !h.contains(b)) return; const a = b.dataset.md, id = b.dataset.id, m = M();
    if (a === 'tab') { tab = id; redraw(); }
    else if (a === 'list') { curList = id || null; redraw(); }
    else if (a === 'newlist') { const v = await MSA.ask({ title: T('اسم القائمة', 'List name') }); if (v) { const l = { id: U.uid('pl'), name: v, ids: [] }; m.lists.push(l); curList = l.id; MSA.save(); redraw(); } }
    else if (a === 'dellist') { const l = m.lists.find(x => x.id === curList); if (l && await MSA.confirm(T('حذف القائمة «' + l.name + '»؟ (الأغاني تفضل في المكتبة)', 'Delete the list “' + l.name + '”? (tracks stay in the library)'), { danger: true, okLabel: T('حذف', 'Delete') })) { m.lists = m.lists.filter(x => x !== l); curList = null; MSA.save(); redraw(); } }
    else if (a === 'add') addTracks();
    else if (a === 'playall') { const ids = idsOf(curList); if (ids.length) play(ids[0], curList || null); }
    else if (a === 'play') { if (id === curId && !aud.paused) aud.pause(); else if (id === curId) aud.play().catch(() => {}); else play(id, curList || null); }
    else if (a === 'menu') trackMenu(id);
    else if (a === 'toggle') toggle(); else if (a === 'next') next(); else if (a === 'prev') prev();
    else if (a === 'shuf') { m.shuffle = !m.shuffle; MSA.save(); if (curId) buildOrder(curId); fire(); }
    else if (a === 'rep') { m.repeat = m.repeat === 'off' ? 'all' : m.repeat === 'all' ? 'one' : 'off'; MSA.save(); fire(); }
    else if (a === 'vlink') addVideoLink(); else if (a === 'vfile') addVideoFile();
    else if (a === 'vplay') { const v = m.videos.find(x => x.id === id); if (v) playVideo(v); }
    else if (a === 'vren') { const v = m.videos.find(x => x.id === id); if (v) { const n = await MSA.ask({ title: T('اسم الفيديو', 'Video name'), value: v.title }); if (n) { v.title = n; MSA.save(); redraw(); } } }
    else if (a === 'vdel') { const v = m.videos.find(x => x.id === id); if (v && await MSA.confirm(T('حذف «' + v.title + '»؟', 'Delete “' + v.title + '”?'), { danger: true, okLabel: T('حذف', 'Delete') })) { if (v.file) { try { await MSA.files.del(v.file); } catch (x) {} } m.videos = m.videos.filter(x => x !== v); MSA.save(); redraw(); } }
  });
  h.addEventListener('input', e => {
    if (e.target.classList.contains('np-r')) { if (aud.duration) aud.currentTime = aud.duration * e.target.value / 1000; }
    else if (e.target.classList.contains('np-v')) { const m = M(); m.vol = e.target.value / 100; aud.volume = m.vol; MSA.save(); }
  });
}
const onChange = () => { if (!host || !document.body.contains(host) || tab !== 'music') return; const nb = $('#npBox', host); if (!nb) { redraw(); return; } const fresh = document.createElement('div'); fresh.innerHTML = nowHTML(); if (document.activeElement && nb.contains(document.activeElement) && document.activeElement.type === 'range') return; nb.innerHTML = fresh.innerHTML; $$('.trk', host).forEach(r => { const on = r.dataset.id === curId; r.classList.toggle('on', on); const p = $('.trk-p', r); if (p) p.innerHTML = I(on && !aud.paused ? 'pause' : 'play', 'sm'); }); };
document.addEventListener('msa-media', onChange);
document.addEventListener('msa-media-tick', () => { if (!host || !document.body.contains(host)) return; const r = $('.np-r', host); if (r && document.activeElement !== r && aud.duration) r.value = Math.round(aud.currentTime / aud.duration * 1000); const c = $('.np-c', host); if (c) c.textContent = fmt(aud.currentTime); const d = $('.np-d', host); if (d && aud.duration) d.textContent = fmt(aud.duration); });
MSA.views.media = { render(h){ draw(h); if (!h._mw) { h._mw = 1; wire(h); } } };
MSA.media = { play, toggle, next, prev, stop, tracks: () => M().tracks, audio: aud, isPlaying: () => !aud.paused };
})();
