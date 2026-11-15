/* Voice assistant — free, rule-based, no API key.
   Speech-to-text: Android = Capacitor speech-recognition plugin · Chrome/Edge = Web Speech · Desktop app = local Whisper (transformers.js, downloaded once).
   Text-to-speech: the device's own Arabic voices (speechSynthesis).
   Commands are parsed by VoiceNLP (js/voice-nlp.js); everything here executes them against the app's data. */
(function(){
const MSA = window.MSA, NLP = window.VoiceNLP;
if (!MSA || !NLP) return;
const U = MSA.u, I = MSA.icon, $ = MSA.$, esc = U.esc, T = (a, e) => MSA.T(a, e), S = () => MSA.state;
const isEl = /Electron/i.test(navigator.userAgent);
const V = MSA.voice = { open: false, listening: false, pending: null, undo: [], voiceMode: false };

/* ---------------- settings ---------------- */
const DEF = { on: true, name: 'مساعد', tts: true, gender: '', rate: 1, confirm: true };
const cfg = () => { const s = S().settings; if (!s.voice) s.voice = {}; for (const k in DEF) if (s.voice[k] === undefined) s.voice[k] = DEF[k]; return s.voice; };
/* device-local choices (voice URI differs per device, so they are not synced) */
const dev = () => { try { return Object.assign({ uri: '', engine: 'auto', whisper: 'base' }, JSON.parse(localStorage.getItem('msa_voice_dev') || '{}')); } catch (e) { return { uri: '', engine: 'auto', whisper: 'base' }; } };
const setDev = o => { try { localStorage.setItem('msa_voice_dev', JSON.stringify(Object.assign(dev(), o))); } catch (e) {} };
const AN = () => (cfg().name || 'مساعد').trim() || 'مساعد';

/* ---------------- text to speech ---------------- */
let voices = [];
const loadVoices = () => { try { voices = (window.speechSynthesis && speechSynthesis.getVoices()) || []; } catch (e) { voices = []; } };
if ('speechSynthesis' in window) { loadVoices(); try { speechSynthesis.addEventListener('voiceschanged', () => { loadVoices(); if (V._onVoices) V._onVoices(); }); } catch (e) {} }
const arVoices = () => voices.filter(v => /^ar/i.test(v.lang || ''));
const FEM = /hoda|salma|zariyah|hala|laila|layla|amina|female|fatima|noura|mariam|ar-xa-x-arc|ar-eg-x-aea|ar-xa-x-ara|\bf\b/i;
const MAL = /shakir|hamed|naayf|majed|maged|tarik|male|ar-xa-x-ard|ar-xa-x-arb|ar-eg-x-aeb|\bm\b/i;
const genderOf = v => { const n = (v.name || '') + ' ' + (v.voiceURI || ''); if (/female/i.test(n) || FEM.test(n)) return 'female'; if (MAL.test(n)) return 'male'; return ''; };
V.voices = () => arVoices().map(v => ({ uri: v.voiceURI, name: v.name, lang: v.lang, gender: genderOf(v) }));
function pickVoice(){
  const list = arVoices(); if (!list.length) return null;
  const d = dev(); if (d.uri) { const f = list.find(v => v.voiceURI === d.uri); if (f) return f; }
  const g = cfg().gender;
  const score = v => (/ar[-_]EG/i.test(v.lang) ? 4 : 0) + (g && genderOf(v) === g ? 3 : 0) + (g && genderOf(v) && genderOf(v) !== g ? -3 : 0) + (v.localService ? 1 : 0);
  return list.slice().sort((a, b) => score(b) - score(a))[0];
}
function speak(text, force){
  return new Promise(res => {
    const c = cfg();
    if ((!c.tts && !force) || !text || !('speechSynthesis' in window)) { res(); return; }
    let done = false; const fin = () => { if (!done) { done = true; clearTimeout(tm); res(); } };
    const tm = setTimeout(fin, 1800 + text.length * 110);
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text), v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'ar-EG';
      u.rate = Math.max(.5, Math.min(1.6, +c.rate || 1));
      const vg = v ? genderOf(v) : '';
      u.pitch = (!c.gender || (v && vg === c.gender)) ? 1 : (c.gender === 'male' ? .75 : 1.2);
      u.onend = fin; u.onerror = fin;
      speechSynthesis.speak(u);
    } catch (e) { fin(); }
  });
}
const hush = () => { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {} };
V.speak = speak;

/* ---------------- speech to text ---------------- */
const webSR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
const andSR = () => { try { return MSA.native && MSA.native('SpeechRecognition'); } catch (e) { return null; } };
function engineName(){
  const pref = dev().engine;
  const ok = { android: () => !!andSR(), web: () => !!webSR() && !isEl, whisper: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) };
  if (pref !== 'auto' && ok[pref] && ok[pref]()) return pref;
  if (ok.android()) return 'android';
  if (isEl) return ok.whisper() ? 'whisper' : 'none';
  if (ok.web()) return 'web';
  if (ok.whisper()) return 'whisper';
  return 'none';
}
V.engine = engineName;
const ENGINE_LABEL = { android: ['تعرف الصوت في أندرويد', 'Android speech recognition'], web: ['تعرف الصوت في المتصفح', 'Browser speech recognition'], whisper: ['Whisper محلي (يتنزّل مرة واحدة)', 'Local Whisper (one-time download)'], none: ['مفيش تعرف على الصوت هنا — الكتابة بس', 'No speech recognition here — typing only'] };

let cur = null;   /* { stop() } of the active recognition */
V.stopMic = () => { const c = cur; cur = null; V.listening = false; if (c) try { c.stop(); } catch (e) {} };

const errMsg = e => {
  const m = String((e && (e.message || e.error)) || e || '');
  if (/not-allowed|permission|denied|service-not-allowed/i.test(m)) return 'إذن الميكروفون مش متاح. فعّله من إعدادات الجهاز وجرب تاني.';
  if (/network/i.test(m)) return 'التعرف على الصوت محتاج إنترنت. اتأكد من الاتصال.';
  if (/whisper-load/i.test(m)) return 'معرفتش أحمّل نموذج التعرف على الصوت. اتأكد من الإنترنت (مرة واحدة بس).';
  if (/no-engine/i.test(m)) return 'الجهاز ده مفيهوش تعرف على الصوت. اكتب الأمر في الخانة.';
  if (/audio-capture|NotFound/i.test(m)) return 'مش لاقي ميكروفون على الجهاز.';
  return 'معرفتش أسمعك. جرب تاني أو اكتب الأمر.';
};

function listenWeb(on){
  return new Promise((res, rej) => {
    const SR = webSR(); const r = new SR(); r.lang = 'ar-EG'; r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
    let fin = '', last = '', done = false;
    const finish = (t, err) => { if (done) return; done = true; cur = null; err ? rej(new Error(err)) : res(t || ''); };
    r.onresult = e => { let it = ''; for (let k = e.resultIndex; k < e.results.length; k++) { const x = e.results[k]; if (x.isFinal) fin += x[0].transcript; else it += x[0].transcript; } last = fin + it; on(last); };
    r.onerror = e => { if (e.error === 'no-speech' || e.error === 'aborted') finish(''); else finish(null, e.error); };
    r.onend = () => finish(fin || last);
    cur = { stop: () => { try { r.abort(); } catch (e) {} finish(''); } };
    try { r.start(); } catch (e) { finish(null, String(e)); }
  });
}

async function listenAndroid(on){
  const P = andSR(); if (!P) throw new Error('no-engine');
  try { const a = await P.available(); if (a && a.available === false) throw new Error('no-engine'); } catch (e) { if (/no-engine/.test(String(e.message))) throw e; }
  try { const p = await P.checkPermissions(); if (!p || p.speechRecognition !== 'granted') { const q = await P.requestPermissions(); if (!q || q.speechRecognition !== 'granted') throw new Error('permission'); } } catch (e) { if (/permission/i.test(String(e.message))) throw e; }
  return new Promise(async (res, rej) => {
    let last = '', done = false, silence = null, hard = null; const handles = [];
    const finish = async (err) => {
      if (done) return; done = true; clearTimeout(silence); clearTimeout(hard); cur = null;
      try { await P.stop(); } catch (e) {}
      handles.forEach(h => { try { h.remove(); } catch (e) {} });
      err ? rej(new Error(err)) : res(last);
    };
    const bump = () => { clearTimeout(silence); silence = setTimeout(() => finish(), 1700); };
    try {
      handles.push(await P.addListener('partialResults', d => { const m = d && d.matches && d.matches[0]; if (m) { last = m; on(m); bump(); } }));
      handles.push(await P.addListener('listeningState', d => { if (d && d.status === 'stopped') finish(); }));
      cur = { stop: () => finish() };
      hard = setTimeout(() => finish(), 14000);
      silence = setTimeout(() => { if (!last) finish(); }, 7000);
      await P.start({ language: 'ar-EG', maxResults: 3, partialResults: true, popup: false });
    } catch (e) { finish(String((e && e.message) || e)); }
  });
}

let asr = null, asrLoading = null;
async function loadAsr(progress){
  if (asr) return asr; if (asrLoading) return asrLoading;
  asrLoading = (async () => {
    let mod; try { mod = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'); } catch (e) { throw new Error('whisper-load'); }
    const { pipeline, env } = mod; env.allowLocalModels = false; env.useBrowserCache = true;
    const model = 'Xenova/whisper-' + (dev().whisper === 'small' ? 'small' : 'base');
    try { asr = await pipeline('automatic-speech-recognition', model, { quantized: true, progress_callback: progress }); }
    catch (e) { try { env.useBrowserCache = false; asr = await pipeline('automatic-speech-recognition', model, { quantized: true, progress_callback: progress }); } catch (e2) { throw new Error('whisper-load'); } }
    return asr;
  })();
  asrLoading.catch(() => { asrLoading = null; });
  return asrLoading;
}
function resample(buf, from, to){
  if (from === to) return buf; const ratio = from / to, n = Math.floor(buf.length / ratio), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = i * ratio, a = Math.floor(p), b = Math.min(a + 1, buf.length - 1), f = p - a; out[i] = buf[a] * (1 - f) + buf[b] * f; }
  return out;
}
async function listenWhisper(on){
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) throw new Error('no-engine');
  if (!asr) { on('…' + T('بحمّل نموذج الصوت (مرة واحدة)', 'Loading voice model (once)')); await loadAsr(p => { if (p && p.status === 'progress' && p.progress != null) on('… ' + Math.round(p.progress) + '%'); }); on(''); }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
  const AC = window.AudioContext || window.webkitAudioContext; let ctx; try { ctx = new AC({ sampleRate: 16000 }); } catch (e) { ctx = new AC(); }
  const src = ctx.createMediaStreamSource(stream), proc = ctx.createScriptProcessor(4096, 1, 1), sink = ctx.createGain(); sink.gain.value = 0;
  src.connect(proc); proc.connect(sink); sink.connect(ctx.destination);
  return new Promise((res, rej) => {
    let chunks = [], pre = [], speaking = false, silence = 0, voiced = 0, t = 0, noise = 0, nN = 0, done = false;
    const cleanup = () => { try { proc.disconnect(); src.disconnect(); sink.disconnect(); } catch (e) {} stream.getTracks().forEach(x => x.stop()); try { ctx.close(); } catch (e) {} };
    const finish = async (abort) => {
      if (done) return; done = true; cur = null; cleanup();
      if (abort || voiced < 0.25) { res(''); return; }
      try {
        on('… ' + T('بحلل الصوت', 'Transcribing'));
        let len = 0; chunks.forEach(c => len += c.length); const all = new Float32Array(len); let o = 0; chunks.forEach(c => { all.set(c, o); o += c.length; });
        const a16 = resample(all, ctx.sampleRate, 16000);
        const r = await asr(a16, { language: 'arabic', task: 'transcribe', chunk_length_s: 30 });
        res(((r && r.text) || '').trim());
      } catch (e) { rej(e); }
    };
    cur = { stop: () => finish(true) };
    proc.onaudioprocess = e => {
      if (done) return; const d = e.inputBuffer.getChannelData(0), c = new Float32Array(d);
      let s = 0; for (let i = 0; i < c.length; i++) s += c[i] * c[i]; const rms = Math.sqrt(s / c.length), dt = c.length / ctx.sampleRate; t += dt;
      if (t < .5) { noise += rms; nN++; pre.push(c); if (pre.length > 3) pre.shift(); return; }
      const thr = Math.max(.012, (nN ? noise / nN : 0) * 3.2);
      if (rms > thr) { if (!speaking) { speaking = true; chunks = pre.slice(); } silence = 0; voiced += dt; on('🎙️ …'); }
      else if (speaking) silence += dt; else { pre.push(c); if (pre.length > 3) pre.shift(); }
      if (speaking) chunks.push(c);
      if ((speaking && silence > 1.1) || (speaking && voiced > 14) || (!speaking && t > 9)) finish(false);
    };
  });
}
function listen(on){
  const e = engineName();
  if (e === 'android') return listenAndroid(on);
  if (e === 'web') return listenWeb(on);
  if (e === 'whisper') return listenWhisper(on);
  return Promise.reject(new Error('no-engine'));
}
/* a test can replace the transcriber: MSA.voice._listen = on => Promise<string> */
const doListen = on => (V._listen ? V._listen(on) : listen(on));

/* ---------------- panel UI ---------------- */
let panel = null, fab = null;
const gid = id => document.getElementById(id);
function bubble(who, text, cls){
  const log = gid('vcLog'); if (!log) return;
  const d = document.createElement('div'); d.className = 'vc-b ' + who + (cls ? ' ' + cls : ''); d.dir = 'auto'; d.textContent = text;
  log.appendChild(d); log.scrollTop = log.scrollHeight;
  while (log.children.length > 40) log.removeChild(log.firstChild);
}
function setState(s){ const el = gid('vcState'); if (!el) return; const m = { idle: ['جاهز', 'Ready'], listening: ['بسمعك…', 'Listening…'], thinking: ['بفكر…', 'Thinking…'], speaking: ['بتكلم…', 'Speaking…'] }; el.textContent = T((m[s] || m.idle)[0], (m[s] || m.idle)[1]); const p = gid('vcPanel'); if (p) p.dataset.st = s; const mb = panel && panel.querySelector('[data-vc=mic]'); if (mb) mb.classList.toggle('on', s === 'listening'); }
const live = t => { const l = gid('vcLive'); if (l) l.textContent = t || ''; };
function chipsHTML(){
  const ex = ['إيه مهامي النهارده', 'ضيف مهمة مراجعة الشغل بكرة الساعة 3', 'إيه المستحقات', 'افتح المدفوعات'];
  return ex.map(x => '<button class="vc-chip" data-vc="chip" data-t="' + esc(x) + '">' + esc(x) + '</button>').join('');
}
function build(){
  if (panel) return;
  panel = document.createElement('div'); panel.id = 'vcPanel'; panel.className = 'vc-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', T('المساعد الصوتي', 'Voice assistant'));
  panel.innerHTML =
    '<div class="vc-head"><span class="vc-dot"></span><b id="vcName"></b><span id="vcState" class="vc-state"></span><span class="vc-sp"></span>' +
      '<button class="icon-btn sm" data-vc="stop" title="' + esc(T('إسكات الصوت', 'Silence')) + '">' + I('volume', 'sm') + '</button>' +
      '<button class="icon-btn sm" data-vc="close" aria-label="' + esc(T('إغلاق', 'Close')) + '">' + I('x', 'sm') + '</button></div>' +
    '<div class="vc-log" id="vcLog" aria-live="polite"></div>' +
    '<div class="vc-ask" id="vcAsk"></div>' +
    '<div class="vc-live" id="vcLive" dir="auto"></div>' +
    '<div class="vc-row"><input id="vcIn" type="text" dir="auto" autocomplete="off" placeholder="' + esc(T('اكتب أمر أو اضغط المايك', 'Type a command or tap the mic')) + '">' +
      '<button class="btn sm primary" data-vc="send">' + esc(T('إرسال', 'Send')) + '</button>' +
      '<button class="vc-mic" data-vc="mic" aria-label="' + esc(T('تكلّم', 'Speak')) + '">' + I('mic') + '</button></div>' +
    '<div class="vc-chips" id="vcChips">' + chipsHTML() + '</div>';
  document.body.appendChild(panel);
  panel.addEventListener('click', e => {
    const b = e.target.closest('[data-vc]'); if (!b) return; const a = b.dataset.vc;
    if (a === 'close') closePanel();
    else if (a === 'stop') { hush(); V.stopMic(); setState('idle'); }
    else if (a === 'send') sendTyped();
    else if (a === 'mic') { V.voiceMode = true; micToggle(); }
    else if (a === 'chip') { const i = gid('vcIn'); i.value = b.dataset.t; sendTyped(); }
    else if (a === 'yes') answer(true);
    else if (a === 'no') answer(false);
    else if (a === 'pick') answer(+b.dataset.i);
  });
  gid('vcIn').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendTyped(); } else if (e.key === 'Escape') closePanel(); });
}
function buildFab(){
  if (fab) return;
  fab = document.createElement('button'); fab.id = 'vcFab'; fab.className = 'vc-fab'; fab.type = 'button';
  fab.setAttribute('aria-label', T('المساعد الصوتي', 'Voice assistant')); fab.title = T('المساعد الصوتي (Alt+M)', 'Voice assistant (Alt+M)');
  fab.innerHTML = I('mic'); document.body.appendChild(fab);
  fab.addEventListener('click', () => { if (V.open) closePanel(); else openPanel(true); });
}
function syncFab(){ buildFab(); fab.hidden = !cfg().on; if (!cfg().on && V.open) closePanel(); }
V.refresh = () => { syncFab(); const n = gid('vcName'); if (n) n.textContent = AN(); };

function openPanel(autoMic){
  if (!cfg().on) return; build(); panel.hidden = false; V.open = true; fab && fab.classList.add('open');
  gid('vcName').textContent = AN(); setState('idle');
  if (!gid('vcLog').children.length) bubble('bot', 'أهلاً يا ' + (S().profile.name || '').split(' ')[0] + '، أنا ' + AN() + '. قولّي تحب أعمل إيه، أو اكتب الأمر.');
  setTimeout(() => { const i = gid('vcIn'); if (i && !autoMic) i.focus(); }, 30);
  if (autoMic) { V.voiceMode = true; micToggle(); }
}
function closePanel(){
  V.stopMic(); hush(); V.open = false; V.voiceMode = false;
  if (V.pending) { const p = V.pending; V.pending = null; p.resolve(p.kind === 'yesno' ? false : null); }
  if (panel) panel.hidden = true; fab && fab.classList.remove('open'); live('');
}
V.open_ = openPanel; V.close = closePanel;

async function micToggle(){
  if (V.listening) { V.stopMic(); setState('idle'); return; }
  if (V._busyListen) return;
  if (navigator.onLine === false) { bubble('bot', 'المساعد الصوتي محتاج إنترنت. تقدر تكتب الأمر بدل الكلام.', 'err'); await speak('المساعد الصوتي محتاج إنترنت'); return; }
  hush(); V.listening = true; V._busyListen = true; setState('listening'); live('');
  let text = '';
  try { text = await doListen(t => live(t)); }
  catch (e) { V.listening = false; V._busyListen = false; live(''); setState('idle'); const m = errMsg(e); bubble('bot', m, 'err'); if (V.pending) { /* keep waiting for a tap */ } else await speak(m); return; }
  V.listening = false; V._busyListen = false; live('');
  if (!V.open) return;
  text = (text || '').trim();
  if (!text) { setState('idle'); if (V.pending) { bubble('bot', 'مسمعتش حاجة. اختار من الأزرار أو اتكلم تاني.'); } else bubble('bot', 'مسمعتش حاجة. اضغط المايك وجرب تاني.'); return; }
  await submit(text, 'voice');
}
function sendTyped(){ const i = gid('vcIn'); const t = (i.value || '').trim(); if (!t) return; i.value = ''; V.voiceMode = false; submit(t, 'typed'); }

/* ---------------- dialog helpers ---------------- */
async function reply(say, o){
  o = o || {}; bubble('bot', o.show || say, o.cls); V.lastSay = say; setState('speaking');
  if (o.noSpeak) { setState('idle'); return; }
  await speak(say); if (V.open && !V.listening && !V.pending) setState('idle');
}
function askUI(buttons){ const a = gid('vcAsk'); if (!a) return; a.innerHTML = buttons.map(b => '<button class="btn sm ' + (b.cls || '') + '" data-vc="' + b.act + '"' + (b.i != null ? ' data-i="' + b.i + '"' : '') + '>' + esc(b.label) + '</button>').join(''); }
const clearAsk = () => { const a = gid('vcAsk'); if (a) a.innerHTML = ''; };
function waitAnswer(kind, buttons, extra){
  return new Promise(res => {
    V.pending = Object.assign({ kind, resolve: v => { V.pending = null; clearAsk(); res(v); }, tries: 0 }, extra || {});
    askUI(buttons);
    if (V.voiceMode && V.open && !V.listening) setTimeout(() => { if (V.pending && !V.listening) micToggle(); }, 150);
  });
}
async function confirm(q, always){
  if (!always && !cfg().confirm) return true;
  await reply(q);
  return waitAnswer('yesno', [{ act: 'yes', label: T('أيوه', 'Yes'), cls: 'primary' }, { act: 'no', label: T('لأ', 'No') }]);
}
async function choose(q, labels){
  const ord = ['الأولى', 'التانية', 'التالتة'];
  await reply(q + ' ' + labels.map((l, i) => (i + 1) + ') ' + l).join('، '), { show: q + '\n' + labels.map((l, i) => (i + 1) + ') ' + l).join('\n') });
  return waitAnswer('choose', labels.map((l, i) => ({ act: 'pick', i, label: (i + 1) + ') ' + l })).concat([{ act: 'no', label: T('إلغاء', 'Cancel') }]), { labels, ord });
}
async function askText(q){
  await reply(q);
  return waitAnswer('text', [{ act: 'no', label: T('إلغاء', 'Cancel') }]);
}
/* tap on a button or a spoken/typed answer */
function answer(v){
  const p = V.pending; if (!p) return;
  if (p.kind === 'yesno') p.resolve(!!v);
  else if (p.kind === 'choose') p.resolve(v === false ? null : (typeof v === 'number' ? v : null));
  else p.resolve(v === false ? null : String(v));
}
const ORD = [/^(?:1|واحد|واحده|اول|اولي|اولاني|اولانيه)$/, /^(?:2|اتنين|تاني|تانيه|ثاني|ثانيه)$/, /^(?:3|تلاته|تلات|تالت|تالته|ثالث|ثالثه)$/];
async function feedPending(text){
  const p = V.pending, n = NLP.norm1(text);
  const intent = NLP.parse(text, { now: new Date(), name: AN() }).intent;
  if (p.kind === 'yesno') {
    if (intent === 'yes') return answer(true);
    if (intent === 'no') return answer(false);
    p.tries++; if (p.tries >= 2) return answer(false);
    await reply('قول أيوه أو لأ.'); if (V.pending && V.voiceMode && !V.listening) micToggle(); return;
  }
  if (p.kind === 'choose') {
    if (intent === 'no') return answer(null);
    const w = n.replace(/^(?:رقم|الرقم|تقصد|ال)\s*/, '').trim();
    const k = ORD.findIndex(r => r.test(w)); if (k >= 0 && k < p.labels.length) return answer(k);
    const hit = NLP.best(p.labels.map((l, i) => ({ l, i })), text, x => x.l);
    if (hit.length && (hit.length === 1 || hit[0].score - hit[1].score > .15)) return answer(hit[0].item.i);
    p.tries++; if (p.tries >= 2) return answer(null);
    await reply('مفهمتش. قول رقم: واحد أو اتنين.'); if (V.pending && V.voiceMode && !V.listening) micToggle(); return;
  }
  if (intent === 'no') return answer(null);
  return answer(text);
}

/* ---------------- log & undo ---------------- */
function logEntry(said, intent, say, ok){
  const L = S().voiceLog = S().voiceLog || []; L.unshift({ t: Date.now(), said: String(said).slice(0, 200), intent, say: String(say || '').slice(0, 220), ok: ok !== false }); if (L.length > 40) L.length = 40;
}
function pushUndo(label, fn){ V.undo.push({ label, fn }); if (V.undo.length > 12) V.undo.shift(); }
const taskIdx = id => S().tasks.findIndex(t => t.id === id);
const refresh = () => { try { if (MSA.view !== 'settings') MSA.rerender(true); else if (MSA.refreshSettings) MSA.refreshSettings(); } catch (e) {} };
const saveAll = () => { MSA.save(); refresh(); };
function replaceTask(before){ const i = taskIdx(before.id); const b = JSON.parse(JSON.stringify(before)); if (i >= 0) S().tasks[i] = b; else S().tasks.unshift(b); }

/* ---------------- data helpers ---------------- */
const now = () => new Date();
const today = () => U.dateKey(now());
const hm = ms => U.pad(new Date(ms).getHours()) + ':' + U.pad(new Date(ms).getMinutes());
const dueKey = x => { const m = U.toMs(x.due); return m == null ? '' : U.dateKey(new Date(m)); };
const hasTime = x => { const m = U.toMs(x.due); return m != null && hm(m) !== '23:59'; };
const openTasks = () => S().tasks.filter(x => x.status !== 'done' && !x.routine);
const clientOf = p => { try { return (MSA.clients && MSA.clients.of && MSA.clients.of(p)) || ''; } catch (e) { return ''; } };
const projText = p => (p.name || '') + ' ' + clientOf(p);
const CUR_AR = { EGP: 'جنيه', USD: 'دولار', SAR: 'ريال', EUR: 'يورو', AED: 'درهم' };
const taskText = x => (x.title || '') + (x.type === 'note' ? ' ' + U.stripHtml(x.desc || '').slice(0, 60) : '');
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

async function pickOne(items, query, getText, what, article){
  const res = NLP.best(items, query, getText);
  if (!res.length) { await reply('ملقتش ' + what + ' بالاسم ده: «' + query + '».', { cls: 'warn' }); return null; }
  if (res.length === 1 || (res[0].score >= .85 && res[0].score - res[1].score >= .2)) return res[0].item;
  const top = res.slice(0, 3);
  const i = await choose('تقصد أنهي ' + what + '؟', top.map(x => clip(getText(x.item), 42)));
  return i == null ? null : top[i].item;
}

/* ---------------- command executors ---------------- */
const EX = {};

EX.empty = async () => { await reply('مسمعتش حاجة.'); };
EX.wake = async () => { await reply('أيوه، أنا سامعك.'); };
EX.yes = async () => { await reply('تمام، بس مفيش حاجة مستنية تأكيد.'); };
EX.no = async () => { await reply('ماشي.'); };
EX.stop = async () => { hush(); setState('idle'); };

EX.help = async () => {
  const lines = NLP.COMMANDS.map(c => '• ' + c.g + ': ' + c.ex.join(' — '));
  bubble('bot', 'دي أمثلة للي أقدر أعمله:\n' + lines.join('\n'));
  await reply('أقدر أضيف مهام وملاحظات، وأخلّص وأحذف وأأجّل، وأقرأ لك مهامك ومستحقاتك، وأفتح أي قسم أو مشروع، وأسجّل دفعات، وأغيّر الوضع الليلي واللغة. الأمثلة قدامك على الشاشة.', { noSpeak: false, show: 'تقدر تقول أي أمر من اللي فوق.' });
};

EX.undo = async () => {
  const u = V.undo.pop();
  if (!u) { await reply('مفيش حاجة أتراجع عنها.'); return { noLog: true }; }
  try { u.fn(); } catch (e) {}
  saveAll(); await reply('تمام، رجّعت: ' + u.label + '.');
};

EX.theme = async r => {
  const prev = S().settings.theme; S().settings.theme = r.value; MSA.save(); MSA.applyTheme();
  pushUndo('الوضع ' + (prev === 'dark' ? 'الليلي' : 'النهاري'), () => { S().settings.theme = prev; MSA.applyTheme(); });
  refresh(); await reply(r.value === 'dark' ? 'فعّلت الوضع الليلي.' : 'فعّلت الوضع النهاري.');
};
EX.lang = async r => {
  const prev = S().settings.lang; S().settings.lang = r.value; MSA.save(); MSA.applyLang();
  pushUndo('اللغة', () => { S().settings.lang = prev; MSA.applyLang(); });
  await reply(r.value === 'en' ? 'غيّرت اللغة للإنجليزي.' : 'غيّرت اللغة للعربي.');
};

EX.add_task = async r => {
  let { title, date, time } = r, remind = !!r.remind;
  if (!title) { const t = await askText('إيه عنوان المهمة؟'); if (!t) { await reply('ماشي، ألغيت.'); return { noLog: true }; } const p = NLP.parse('ضيف مهمة ' + t, { now: now() }); title = p.title || t; date = date || p.date; time = time || p.time; }
  if (remind && !time && !date) {
    const t = await askText('أفكّرك امتى؟');
    if (!t) { await reply('ماشي، ألغيت.'); return { noLog: true }; }
    const w = NLP.when(NLP.norm1(t), now()); date = w.date; time = w.time;
    if (!date && !time) { await reply('مفهمتش الميعاد. جرب تقول مثلاً: بكرة الساعة ٣.', { cls: 'warn' }); return; }
  }
  let note = '';
  if (time && !date) { const t = U.toMs(today() + 'T' + time); if (t < Date.now()) { date = NLP.key(NLP.addDays(now(), 1)); note = ' (الوقت ده عدّى النهارده فخليتها بكرة)'; } else date = today(); }
  const due = date ? date + 'T' + (time || '23:59') : '';
  if (time && MSA.sched && MSA.sched.conflicts) {
    const c = MSA.sched.conflicts({ id: '_p', type: 'task', title, due });
    if (c.length) { const ok = await confirm('تنبيه: المهمة دي بتتعارض مع «' + clip(c[0].title, 30) + '». أضيفها برضه؟', true); if (!ok) { await reply('تمام، مضفتهاش.'); return { noLog: true }; } }
  }
  const x = MSA.tasksApi.blank({ title: clip(title, 200), due, remind: remind && due ? '0' : '' });
  S().tasks.unshift(x); saveAll();
  pushUndo('إضافة المهمة «' + clip(title, 30) + '»', () => { const i = taskIdx(x.id); if (i >= 0) S().tasks.splice(i, 1); });
  const when = date ? ' ' + NLP.sayDate(date, now()) + (time ? ' ' + NLP.sayTime(time) : '') : '';
  await reply('تمام، ضفت مهمة «' + clip(title, 60) + '»' + when + (x.remind ? ' وهفكّرك' : '') + '.' + note);
  return { ok: true };
};

EX.add_note = async r => {
  let title = r.title;
  if (!title) { title = await askText('إيه الملاحظة؟'); if (!title) { await reply('ماشي، ألغيت.'); return { noLog: true }; } }
  const long = title.length > 70;
  const x = MSA.tasksApi.blank({ type: 'note', title: clip(title, 70), desc: long ? '<p>' + esc(title) + '</p>' : '' });
  S().tasks.unshift(x); saveAll();
  pushUndo('الملاحظة', () => { const i = taskIdx(x.id); if (i >= 0) S().tasks.splice(i, 1); });
  await reply('كتبت الملاحظة: ' + clip(title, 70) + '.');
};

EX.complete_task = async r => {
  const x = await pickOne(openTasks(), r.query, taskText, 'مهمة'); if (!x) return { noLog: true };
  const before = JSON.parse(JSON.stringify(x));
  MSA.tasksApi.setDone(x, true); saveAll();
  pushUndo('إنهاء «' + clip(x.title, 30) + '»', () => replaceTask(before));
  await reply('تمام، خلّصت «' + clip(x.title, 50) + '».');
};

EX.delete_task = async r => {
  const x = await pickOne(S().tasks.filter(t => !t.routine), r.query, taskText, 'مهمة'); if (!x) return { noLog: true };
  const ok = await confirm('أحذف «' + clip(x.title, 50) + '» فعلاً؟'); if (!ok) { await reply('تمام، مفيش حذف.'); return { noLog: true }; }
  const i = taskIdx(x.id), copy = JSON.parse(JSON.stringify(x)); S().tasks.splice(i, 1); saveAll();
  pushUndo('حذف «' + clip(x.title, 30) + '»', () => { S().tasks.splice(Math.min(i, S().tasks.length), 0, copy); });
  await reply('اتحذفت «' + clip(x.title, 50) + '». لو غلطت قول: تراجع.');
};

EX.reschedule = async r => {
  const x = await pickOne(openTasks(), r.query, taskText, 'مهمة'); if (!x) return { noLog: true };
  const oldMs = U.toMs(x.due), od = oldMs != null ? U.dateKey(new Date(oldMs)) : today(), ot = oldMs != null && hm(oldMs) !== '23:59' ? hm(oldMs) : '';
  const date = r.date || od, time = r.time || ot, due = date + 'T' + (time || '23:59');
  if (time && MSA.sched && MSA.sched.conflicts) {
    const c = MSA.sched.conflicts(Object.assign({}, x, { due }));
    if (c.length) { const ok = await confirm('تنبيه: الميعاد ده بيتعارض مع «' + clip(c[0].title, 30) + '». أأجّلها برضه؟', true); if (!ok) { await reply('تمام، سبتها زي ما هي.'); return { noLog: true }; } }
  }
  const before = JSON.parse(JSON.stringify(x));
  x.due = due; x.notified = false; if (x.status === 'done') x.status = 'todo'; x.updated = Date.now(); saveAll();
  pushUndo('تأجيل «' + clip(x.title, 30) + '»', () => replaceTask(before));
  await reply('غيّرت ميعاد «' + clip(x.title, 50) + '» لـ' + NLP.sayDate(date, now()) + (time ? ' ' + NLP.sayTime(time) : '') + '.');
};

EX.read_tasks = async r => {
  const k = r.date || today(), isToday = k === today();
  const list = openTasks().filter(x => dueKey(x) === k && x.type !== 'note').sort((a, b) => (U.toMs(a.due) || 0) - (U.toMs(b.due) || 0));
  const late = isToday ? openTasks().filter(x => x.type !== 'note' && U.toMs(x.due) != null && dueKey(x) < k) : [];
  const rt = S().tasks.filter(x => x.routine && x.status !== 'done' && dueKey(x) === k).length;
  const day = NLP.sayDate(k, now());
  if (r.count) { await reply('عندك ' + list.length + ' مهمة ' + day + (late.length ? ' و' + late.length + ' متأخرة' : '') + '.'); return; }
  if (!list.length && !late.length) { await reply('مفيش مهام ' + day + (rt ? '، غير ' + rt + ' من الروتين اليومي' : '') + '.'); return; }
  const line = x => (hasTime(x) ? NLP.sayTime(hm(U.toMs(x.due))) + ': ' : '') + clip(x.title, 50);
  const shown = list.slice(0, 6);
  const text = shown.map((x, i) => (i + 1) + '. ' + line(x)).join('\n') + (list.length > 6 ? '\nو' + (list.length - 6) + ' كمان' : '') + (late.length ? '\nمتأخرة: ' + late.slice(0, 4).map(x => clip(x.title, 30)).join('، ') : '');
  const say = 'عندك ' + list.length + ' مهمة ' + day + (list.length ? ': ' + shown.map(line).join('، ') : '') + (list.length > 6 ? '، وغيرهم ' + (list.length - 6) : '') + (late.length ? '. وفيه ' + late.length + ' متأخرة' : '') + '.';
  await reply(say, { show: text });
};

EX.show_routine = async r => {
  if (!r.speak && MSA.sched && MSA.sched.manage) { MSA.sched.manage(); await reply('فتحت إعدادات الروتين.'); return; }
  const k = today(), list = S().tasks.filter(x => x.routine && dueKey(x) === k).sort((a, b) => (U.toMs(a.due) || 0) - (U.toMs(b.due) || 0));
  if (!list.length) { await reply('الروتين مش متفعّل أو مفيش بنود النهارده.'); return; }
  const line = x => (hasTime(x) ? NLP.sayTime(hm(U.toMs(x.due))) + ' ' : '') + clip(x.title, 40) + (x.status === 'done' ? ' (خلص)' : '');
  await reply('الروتين النهارده: ' + list.slice(0, 7).map(line).join('، ') + '.', { show: list.map((x, i) => (i + 1) + '. ' + line(x)).join('\n') });
};

EX.read_money = async () => {
  if (!(MSA.plus && MSA.plus.outstanding)) { await reply('قسم المدفوعات مش متاح.'); return; }
  const o = MSA.plus.outstanding();
  if (!o.n) { await reply('مفيش مستحقات متبقية. كله مدفوع.'); return; }
  const top = (MSA.plus.topDue ? MSA.plus.topDue(3) : []);
  const tail = top.length ? ' أكبرهم: ' + top.map(t => clip(t.name, 28) + ' ' + Math.round(t.rem) + ' ' + (CUR_AR[t.cur] || '')).join('، ') : '';
  await reply('لسه ليك مستحقات في ' + o.n + ' مشروع بإجمالي حوالي ' + MSA.plus.fmt0(o.egp) + ' جنيه' + (o.late ? '، منهم ' + o.late + ' متأخرين' : '') + '.' + tail);
};

EX.open = async r => {
  if (r.section === 'voice') { MSA.go('settings'); setTimeout(() => { const el = document.querySelector('[data-vc-sec]'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 250); await reply('فتحت إعدادات المساعد الصوتي.'); return; }
  if (!MSA.views[r.target]) { await reply('القسم ده مش موجود.', { cls: 'warn' }); return; }
  MSA.go(r.target); await reply('فتحت ' + NLP.NAME_AR[r.target] + '.');
};

EX.open_project = async r => {
  const ps = S().projects || [];
  const p = await pickOne(ps, r.query, projText, 'مشروع'); if (!p) { return r.loose ? { noLog: false } : { noLog: true }; }
  if (MSA.plus && MSA.plus.openProject) MSA.plus.openProject(p); else MSA.go('active');
  await reply('فتحت مشروع «' + clip(p.name, 50) + '».');
};

EX.open_client = async r => {
  const names = Array.from(new Set((S().projects || []).map(clientOf).filter(Boolean)));
  const hit = NLP.best(names, r.query, x => x);
  MSA.go('clients');
  if (S().clients && S().clients.q !== undefined) { S().clients.q = hit.length ? hit[0].item : r.query; MSA.rerender(true); }
  await reply('فتحت العملاء' + (hit.length ? ' وبحثت عن «' + hit[0].item + '».' : '.'));
};

EX.search = async r => {
  if (MSA.plus && MSA.plus.openSearch) MSA.plus.openSearch(r.query || ''); await reply(r.query ? 'بحثت عن «' + r.query + '».' : 'فتحت البحث.');
};

EX.add_payment = async r => {
  const ps = (S().projects || []);
  if (!r.who) { await reply('على أنهي مشروع؟', { cls: 'warn' }); return { noLog: true }; }
  const p = await pickOne(ps, r.who, projText, 'مشروع'); if (!p) return { noLog: true };
  const cur = MSA.plus.pay.cur(p), word = CUR_AR[cur] || cur;
  const mism = r.cur && r.cur !== cur ? ' (المشروع بالـ' + word + '، فهيتسجل بالـ' + word + ')' : '';
  const ok = await confirm('أسجّل دفعة ' + r.amount + ' ' + word + ' على مشروع «' + clip(p.name, 40) + '»؟' + mism);
  if (!ok) { await reply('تمام، مسجلتش حاجة.'); return { noLog: true }; }
  p.pay = p.pay || {}; p.pay.items = p.pay.items || [];
  const item = { id: U.uid('py'), date: today(), amt: r.amount, note: 'بالصوت' }; p.pay.items.push(item); saveAll();
  pushUndo('دفعة ' + r.amount, () => { const q = (S().projects || []).find(z => z.id === p.id); if (q && q.pay) q.pay.items = q.pay.items.filter(z => z.id !== item.id); });
  const rem = MSA.plus.pay.remaining(p);
  await reply('سجلت دفعة ' + r.amount + ' ' + word + ' على «' + clip(p.name, 40) + '»' + (MSA.plus.pay.total(p) > 0 ? '، والمتبقي ' + Math.round(rem) + ' ' + word : '') + '.');
};

EX.study_done = async r => {
  const vids = ((S().learning || {}).videos || []);
  const v = await pickOne(vids, r.query, x => x.title || x.url || '', 'فيديو'); if (!v) return { noLog: true };
  const had = { done: v.done, doneAt: v.doneAt };
  v.done = true; v.doneAt = Date.now(); saveAll();
  pushUndo('علامة الانتهاء', () => { if (had.done) { v.done = had.done; v.doneAt = had.doneAt; } else { delete v.done; delete v.doneAt; } });
  await reply('علّمت «' + clip(v.title || 'الفيديو', 50) + '» إنه خلص.');
};

EX.unknown = async (r, said) => {
  await reply('مفهمتش الأمر. جرب مثلاً: ضيف مهمة، أو إيه مهامي النهارده، أو قول: إيه الأوامر.', { cls: 'warn' });
  return { ok: false };
};

/* ---------------- submit / run ---------------- */
let chain = Promise.resolve();
async function submit(text, via){
  text = String(text || '').trim(); if (!text) return;
  build(); if (!V.open) { panel.hidden = false; V.open = true; fab && fab.classList.add('open'); gid('vcName').textContent = AN(); }
  bubble('me', text);
  if (V.pending) { await feedPending(text); return; }
  return run(text, via);
}
function run(text, via){
  const job = chain.then(async () => {
    setState('thinking'); const r = NLP.parse(text, { now: now(), name: AN() }); let out;
    try { const f = EX[r.intent] || EX.unknown; out = await f(r, text); }
    catch (e) { console.warn('voice exec', e); await reply('حصلت مشكلة وأنا بنفّذ الأمر. جرب تاني.', { cls: 'err' }); out = { ok: false }; }
    if (!(out && out.noLog) && r.intent !== 'empty' && r.intent !== 'yes' && r.intent !== 'no' && r.intent !== 'stop') { logEntry(text, r.intent, V.lastSay, !(out && out.ok === false)); try { MSA.save(); } catch (e) {} }
    if (V.open && !V.listening && !V.pending) setState('idle');
    return { intent: r.intent, say: V.lastSay, ok: !(out && out.ok === false) };
  });
  chain = job.catch(() => {});
  return job;
}
V.run = (text) => { build(); if (!V.open) { panel.hidden = false; V.open = true; fab && fab.classList.add('open'); gid('vcName').textContent = AN(); } bubble('me', text); return V.pending ? feedPending(text) : run(text, 'api'); };
V.parse = (t) => NLP.parse(t, { now: now(), name: AN() });

/* ---------------- settings section ---------------- */
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? T('الآن', 'now') : m < 60 ? m + T(' د', 'm') : m < 1440 ? Math.round(m / 60) + T(' س', 'h') : Math.round(m / 1440) + T(' يوم', 'd'); };
MSA.voiceHTML = () => {
  const c = cfg(), d = dev(), eng = engineName(), L = S().voiceLog || [];
  const chk = (id, on, label) => '<label class="row" style="margin-bottom:10px;cursor:pointer"><input type="checkbox" class="cb" id="' + id + '" ' + (on ? 'checked' : '') + '><span>' + esc(label) + '</span></label>';
  return '<div class="sec" data-vc-sec="1"><h4>' + I('mic', 'sm') + esc(T('المساعد الصوتي', 'Voice assistant')) + '</h4>' +
    '<div class="hint" style="margin-bottom:12px">' + esc(T('بتقوله أوامر محددة جوا البرنامج وهو ينفّذ ويرد عليك بالصوت. مجاني وبدون مفتاح، ومحتاج إنترنت للتعرف على الكلام. تقدر تكتب الأمر كمان.', 'Give it defined commands about anything in the app; it runs them and answers by voice. Free, no key; speech recognition needs internet. You can type commands too.')) + '</div>' +
    chk('vcOn', c.on, T('تفعيل المساعد الصوتي (زر المايك العايم)', 'Enable the voice assistant (floating mic)')) +
    '<div class="field"><label class="f">' + esc(T('اسم المساعد', 'Assistant name')) + '</label><input type="text" id="vcNm" dir="auto" maxlength="20" value="' + esc(c.name) + '" placeholder="' + esc(T('مثلاً: مساعد', 'e.g. Assistant')) + '"></div>' +
    chk('vcTts', c.tts, T('يرد عليا بالصوت', 'Answer by voice')) +
    '<div class="field"><label class="f">' + esc(T('نوع الصوت', 'Voice type')) + '</label><div class="seg" id="vcGender">' +
      [['', 'تلقائي', 'Auto'], ['male', 'راجل', 'Male'], ['female', 'ست', 'Female']].map(x => '<button data-v="' + x[0] + '" class="' + (c.gender === x[0] ? 'on' : '') + '">' + esc(T(x[1], x[2])) + '</button>').join('') + '</div></div>' +
    '<div class="field"><label class="f">' + esc(T('الصوت المستخدم', 'Voice')) + '</label><select id="vcVoice"><option value="">' + esc(T('تلقائي (أقرب صوت عربي مصري)', 'Auto (closest Egyptian Arabic)')) + '</option></select>' +
      '<div class="hint" id="vcVoiceHint" style="margin-top:6px"></div></div>' +
    '<div class="field"><label class="f">' + esc(T('سرعة الكلام', 'Speed')) + ' <span id="vcRateV" dir="ltr">' + (+c.rate).toFixed(1) + '×</span></label><input type="range" id="vcRate" min="0.7" max="1.4" step="0.1" value="' + c.rate + '"></div>' +
    '<div class="field"><label class="f">' + esc(T('التعرف على الصوت', 'Speech recognition')) + '</label><select id="vcEng">' +
      [['auto', 'تلقائي', 'Auto'], ['android', 'أندرويد', 'Android'], ['web', 'المتصفح', 'Browser'], ['whisper', 'Whisper محلي', 'Local Whisper']].map(x => '<option value="' + x[0] + '"' + (d.engine === x[0] ? ' selected' : '') + '>' + esc(T(x[1], x[2])) + '</option>').join('') + '</select>' +
      '<div class="hint" id="vcEngHint" style="margin-top:6px">' + esc(T(ENGINE_LABEL[eng][0], ENGINE_LABEL[eng][1])) + '</div></div>' +
    chk('vcCf', c.confirm, T('اطلب تأكيد قبل الحذف وتسجيل الدفعات', 'Ask to confirm before deleting or recording payments')) +
    '<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:14px"><button class="btn sm" id="vcTest">' + I('volume', 'sm') + esc(T('جرّب الصوت', 'Test voice')) + '</button><button class="btn sm primary" id="vcTry">' + I('mic', 'sm') + esc(T('افتح المساعد', 'Open assistant')) + '</button></div>' +
    '<div class="hint" style="margin-bottom:6px"><b>' + esc(T('أمثلة الأوامر', 'Command examples')) + '</b> — ' + esc(T('اختصار الكيبورد: Alt+M', 'Keyboard: Alt+M')) + '</div>' +
    '<div class="vc-cmds">' + NLP.COMMANDS.map(g => '<div><b>' + esc(g.g) + '</b>: ' + g.ex.map(e => '«' + esc(e) + '»').join(' · ') + '</div>').join('') + '</div>' +
    '<div class="hint" style="margin:12px 0 6px"><b>' + esc(T('آخر الأوامر', 'Recent commands')) + '</b></div>' +
    '<div class="vc-hist" id="vcHist">' + (L.length ? L.slice(0, 8).map(e => '<div class="vc-h' + (e.ok ? '' : ' bad') + '"><span dir="auto">' + esc(e.said) + '</span><i>' + esc(ago(e.t)) + '</i></div>').join('') : '<div class="hint">' + esc(T('لسه مفيش أوامر.', 'No commands yet.')) + '</div>') + '</div>' +
    (L.length ? '<button class="btn sm ghost" id="vcClr" style="margin-top:8px">' + esc(T('مسح السجل', 'Clear log')) + '</button>' : '') +
    '<div class="hint" style="margin-top:12px">' + esc(T('الصوت المصري (ذكر/أنثى) بيعتمد على أصوات العربي المثبّتة على جهازك. في أندرويد نزّل «العربية (مصر)» من إعدادات تحويل النص إلى كلام.', 'Egyptian male/female voices depend on the Arabic voices installed on your device. On Android install "Arabic (Egypt)" in Text-to-speech settings.')) + '</div></div>';
};
MSA.wireVoice = (el, redraw) => {
  const c = cfg(); const g = id => $('#' + id, el); if (!g('vcOn')) return;
  const fill = () => {
    const sel = g('vcVoice'); if (!sel) return; const d = dev(), list = V.voices();
    sel.innerHTML = '<option value="">' + esc(T('تلقائي (أقرب صوت عربي مصري)', 'Auto (closest Egyptian Arabic)')) + '</option>' + list.map(v => '<option value="' + esc(v.uri) + '"' + (d.uri === v.uri ? ' selected' : '') + '>' + esc(v.name + ' — ' + v.lang + (v.gender ? ' · ' + (v.gender === 'male' ? T('راجل', 'male') : T('ست', 'female')) : '')) + '</option>').join('');
    const h = g('vcVoiceHint'); if (h) h.textContent = list.length ? T('الأصوات العربية على جهازك: ', 'Arabic voices on this device: ') + list.length : T('مفيش صوت عربي متاح دلوقتي. نزّل صوت عربي من إعدادات الجهاز، وبعدها يظهر هنا.', 'No Arabic voice found. Install one in the device settings and it will show here.');
  };
  fill(); V._onVoices = fill;
  g('vcOn').onchange = e => { c.on = e.target.checked; MSA.save(); V.refresh(); };
  g('vcNm').onchange = e => { c.name = (e.target.value || '').trim() || 'مساعد'; e.target.value = c.name; MSA.save(); V.refresh(); };
  g('vcTts').onchange = e => { c.tts = e.target.checked; MSA.save(); };
  g('vcCf').onchange = e => { c.confirm = e.target.checked; MSA.save(); };
  g('vcRate').oninput = e => { c.rate = +e.target.value; g('vcRateV').textContent = c.rate.toFixed(1) + '×'; };
  g('vcRate').onchange = () => MSA.save();
  $('#vcGender', el).onclick = e => { const b = e.target.closest('button[data-v]'); if (!b) return; c.gender = b.dataset.v; MSA.save(); $$$('#vcGender button', el).forEach(x => x.classList.toggle('on', x === b)); };
  g('vcVoice').onchange = e => { setDev({ uri: e.target.value }); };
  g('vcEng').onchange = e => { setDev({ engine: e.target.value }); const h = g('vcEngHint'); const k = engineName(); if (h) h.textContent = T(ENGINE_LABEL[k][0], ENGINE_LABEL[k][1]); };
  g('vcTest').onclick = () => { speak('أهلاً، أنا ' + AN() + '. دي تجربة الصوت. أقدر أساعدك في مهامك ومشاريعك.', true); };
  g('vcTry').onclick = () => { if (!c.on) { c.on = true; MSA.save(); V.refresh(); } openPanel(false); };
  const cl = g('vcClr'); if (cl) cl.onclick = () => { S().voiceLog = []; MSA.save(); redraw && redraw(); };
};
const $$$ = (s, r) => Array.from((r || document).querySelectorAll(s));

/* ---------------- boot ---------------- */
function boot(){
  syncFab();
  document.addEventListener('keydown', e => {
    if (e.altKey && !e.ctrlKey && !e.metaKey && (e.code === 'KeyM' || e.key === 'm' || e.key === 'M' || e.key === 'ـ')) { if (!cfg().on) return; e.preventDefault(); if (V.open) closePanel(); else openPanel(true); }
    else if (e.key === 'Escape' && V.open && !document.querySelector('.overlay,.drawer-wrap')) closePanel();
  });
  window.addEventListener('beforeunload', () => { hush(); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0)); else setTimeout(boot, 0);
})();
