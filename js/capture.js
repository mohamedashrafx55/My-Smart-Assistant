/* Camera / voice capture: "add image / video / audio" can now shoot or record straight inside the app */
(function(){
const MSA = window.MSA, U = MSA.u, I = MSA.icon, $ = MSA.$;
const t = (k, v) => MSA.t(k, v);
Object.assign(MSA.dict.en, {
  'cap.files': 'Choose from device', 'cap.photo': 'Take a photo', 'cap.video': 'Record a video', 'cap.voice': 'Record voice',
  'cap.shutter': 'Capture', 'cap.rec': 'Start recording', 'cap.stop': 'Stop', 'cap.retake': 'Retake', 'cap.use': 'Use it', 'cap.switch': 'Switch camera',
  'cap.denied': 'Camera / microphone access was not allowed. Allow it from Settings → Permissions.', 'cap.title.image': 'Add image', 'cap.title.video': 'Add video', 'cap.title.audio': 'Add audio'
});
Object.assign(MSA.dict.ar, {
  'cap.files': 'اختيار من الجهاز', 'cap.photo': 'التقاط صورة', 'cap.video': 'تسجيل فيديو', 'cap.voice': 'تسجيل صوت',
  'cap.shutter': 'التقاط', 'cap.rec': 'ابدأ التسجيل', 'cap.stop': 'إيقاف', 'cap.retake': 'إعادة', 'cap.use': 'استخدمها', 'cap.switch': 'تبديل الكاميرا',
  'cap.denied': 'لم يتم السماح بالوصول للكاميرا / الميكروفون. فعّله من الإعدادات ← الأذونات.', 'cap.title.image': 'إضافة صورة', 'cap.title.video': 'إضافة فيديو', 'cap.title.audio': 'إضافة صوت'
});
const orig = MSA.addFiles;
const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); };
const pickMime = list => (window.MediaRecorder && list.find(m => MediaRecorder.isTypeSupported(m))) || '';
const canCapture = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

function capture(kind){
  return new Promise(resolve => {
    let stream = null, rec = null, chunks = [], result = null, facing = 'environment', timer = null, t0 = 0, done = false;
    const stop = () => { clearInterval(timer); try { rec && rec.state !== 'inactive' && rec.stop(); } catch (e) {} if (stream) stream.getTracks().forEach(x => x.stop()); stream = null; };
    const finish = f => { if (done) return; done = true; stop(); clearInterval(watch); m.close(); resolve(f ? [f] : []); };
    const m = MSA.modal({ title: t('cap.title.' + kind), footer: false, body: '<div class="capbox" id="capBox"></div>' });
    const watch = setInterval(() => { if (!document.body.contains(m.el)) { done = true; stop(); clearInterval(watch); resolve([]); } }, 400);
    const box = $('#capBox', m.el);
    const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

    async function live(){
      result = null; chunks = [];
      try {
        stream = await navigator.mediaDevices.getUserMedia(kind === 'audio' ? { audio: true } : { video: { facingMode: facing }, audio: kind === 'video' });
      } catch (e) { box.innerHTML = '<p class="muted" style="text-align:center">' + U.esc(t('cap.denied')) + '</p>'; return; }
      box.innerHTML = (kind === 'audio' ? '<div class="capmic"><i></i>' + I('mic', 'lg') + '</div>' : '<video id="capV" autoplay muted playsinline></video>') +
        '<div class="captime" id="capT">' + (kind === 'image' ? '' : '00:00') + '</div>' +
        '<div class="row" style="justify-content:center;gap:10px">' +
        (kind === 'audio' ? '' : '<button class="btn" id="capSw">' + I('repeat', 'sm') + U.esc(t('cap.switch')) + '</button>') +
        '<button class="btn primary" id="capGo">' + I(kind === 'image' ? 'camera' : 'play', 'sm') + '<span>' + U.esc(t(kind === 'image' ? 'cap.shutter' : 'cap.rec')) + '</span></button></div>';
      const v = $('#capV', box); if (v) v.srcObject = stream;
      const sw = $('#capSw', box); if (sw) sw.onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; stop(); live(); };
      $('#capGo', box).onclick = () => kind === 'image' ? shoot(v) : (rec && rec.state === 'recording' ? rec.stop() : startRec());
    }
    function shoot(v){
      const c = document.createElement('canvas'); c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
      c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
      c.toBlob(b => { stop(); review(new File([b], 'photo-' + stamp() + '.jpg', { type: 'image/jpeg' })); }, 'image/jpeg', .92);
    }
    function startRec(){
      const mime = kind === 'video' ? pickMime(['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']) : pickMime(['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']);
      try { rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); } catch (e) { box.innerHTML = '<p class="muted">' + U.esc(t('cap.denied')) + '</p>'; return; }
      rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        const type = (rec.mimeType || mime || (kind === 'video' ? 'video/webm' : 'audio/webm')).split(';')[0];
        const ext = /mp4/.test(type) ? (kind === 'audio' ? 'm4a' : 'mp4') : /ogg/.test(type) ? 'ogg' : 'webm';
        const f = new File([new Blob(chunks, { type })], (kind === 'video' ? 'video-' : 'voice-') + stamp() + '.' + ext, { type });
        stop(); review(f);
      };
      rec.start(500); t0 = Date.now();
      const b = $('#capGo', box); b.querySelector('span').textContent = t('cap.stop'); b.classList.add('danger');
      const mic = $('.capmic', box); if (mic) mic.classList.add('on');
      timer = setInterval(() => { const el = $('#capT', box); if (el) el.textContent = fmt(Math.round((Date.now() - t0) / 1000)); }, 500);
    }
    function review(f){
      result = f; const u = URL.createObjectURL(f);
      box.innerHTML = (kind === 'image' ? '<img src="' + u + '" alt="">' : kind === 'video' ? '<video src="' + u + '" controls playsinline></video>' : '<audio src="' + u + '" controls style="width:100%"></audio>') +
        '<div class="row" style="justify-content:center;gap:10px;margin-top:12px"><button class="btn" id="capRe">' + I('undo', 'sm') + U.esc(t('cap.retake')) + '</button><button class="btn primary" id="capUse">' + I('check', 'sm') + U.esc(t('cap.use')) + '</button></div>';
      $('#capRe', box).onclick = live; $('#capUse', box).onclick = () => finish(result);
    }
    live();
  });
}

MSA.addFiles = async function(kind){
  if (kind === 'doc') return orig(kind);
  const src = await new Promise(res => {
    const lab = { image: ['camera', 'cap.photo'], video: ['video', 'cap.video'], audio: ['mic', 'cap.voice'] }[kind];
    const m = MSA.modal({ title: t('cap.title.' + kind), footer: false, size: 'sm',
      body: '<div class="capchoice"><button class="btn lg" data-s="files">' + I('folder-open') + '<span>' + U.esc(t('cap.files')) + '</span></button>' +
        (canCapture() ? '<button class="btn lg primary" data-s="cam">' + I(lab[0]) + '<span>' + U.esc(t(lab[1])) + '</span></button>' : '') + '</div>',
      onMount: el => { el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { res(b.dataset.s); m.close(); }); } });
    const w = setInterval(() => { if (!document.body.contains(m.el)) { clearInterval(w); res(null); } }, 300);
  });
  if (!src) return [];
  if (src === 'files') return orig(kind);
  const files = await capture(kind), out = [];
  for (const f of files) {
    try { const a = await MSA.files.put(f); a.kind = kind; out.push(a); } catch (e) { MSA.toast(t('fileFail') + ': ' + f.name, 'err'); }
  }
  if (out.length) MSA.toast(t('filesAdded', { n: out.length }));
  return out;
};
})();

