/* Notification sounds: five built-in tones synthesised with Web Audio (no files). Choice saved in settings.sound; 'off' mutes. */
(function(){
'use strict';
const T = MSA.T, esc = MSA.u.esc, I = MSA.icon;
const SPEC = [{"id": "bell", "ar": "جرس", "en": "Bell", "n": [{"f": 880, "t": 0, "d": 1.1, "w": "sine", "g": 0.5}, {"f": 1318.5, "t": 0, "d": 0.9, "w": "sine", "g": 0.3}, {"f": 1760, "t": 0, "d": 0.6, "w": "sine", "g": 0.15}]}, {"id": "digital", "ar": "ديجيتال", "en": "Digital", "n": [{"f": 1000, "t": 0, "d": 0.12, "w": "square", "g": 0.18}, {"f": 1000, "t": 0.2, "d": 0.12, "w": "square", "g": 0.18}, {"f": 1400, "t": 0.4, "d": 0.2, "w": "square", "g": 0.18}]}, {"id": "drop", "ar": "قطرة", "en": "Drop", "n": [{"f": 1300, "f2": 420, "t": 0, "d": 0.28, "w": "sine", "g": 0.6}]}, {"id": "chime", "ar": "كريستال", "en": "Crystal", "n": [{"f": 1046.5, "t": 0, "d": 0.6, "w": "sine", "g": 0.35}, {"f": 1318.5, "t": 0.14, "d": 0.6, "w": "sine", "g": 0.35}, {"f": 1568, "t": 0.28, "d": 0.9, "w": "sine", "g": 0.35}]}, {"id": "soft", "ar": "هادئ", "en": "Soft", "n": [{"f": 523.3, "t": 0, "d": 0.7, "w": "triangle", "g": 0.5}, {"f": 659.3, "t": 0.32, "d": 1.0, "w": "triangle", "g": 0.5}]}];
let ctx = null;
const cur = () => { const s = MSA.state.settings; return s.sound === 'off' || SPEC.some(x => x.id === s.sound) ? s.sound : 'bell'; };
function play(id){
  id = id || cur(); if (id === 'off') return;
  const sp = SPEC.find(x => x.id === id); if (!sp) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = ctx || new AC(); if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime + 0.02;
    sp.n.forEach(n => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = n.w; o.frequency.setValueAtTime(n.f, t0 + n.t);
      if (n.f2) o.frequency.exponentialRampToValueAtTime(n.f2, t0 + n.t + n.d);
      g.gain.setValueAtTime(0.0001, t0 + n.t); g.gain.exponentialRampToValueAtTime(n.g, t0 + n.t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.t + n.d);
      o.connect(g); g.connect(ctx.destination); o.start(t0 + n.t); o.stop(t0 + n.t + n.d + 0.05);
    });
  } catch (e) {}
}
MSA.sound = { play, list: SPEC, current: cur };
MSA.soundHTML = function(){
  const c = cur();
  const btn = (id, label) => '<button class="snd' + (c === id ? ' on' : '') + '" data-snd="' + id + '"><span>' + esc(label) + '</span>' + (id === 'off' ? '' : '<i data-sndp="' + id + '" role="button" aria-label="play">' + I('play', 'sm') + '</i>') + '</button>';
  return '<div class="sec" data-sec="snd"><h4>' + I('bell', 'sm') + esc(T('صوت الإشعارات', 'Notification sound')) + '</h4>' +
    '<div class="hint" style="margin-bottom:10px">' + esc(T('اختار الصوت واضغط ▶ لتسمعه. بيشتغل مع تنبيهات المهام والتنبيه اليومي أثناء فتح التطبيق.', 'Pick a tone and press ▶ to hear it. It plays with task reminders and the daily alert while the app is open.')) + '</div>' +
    '<div class="sndlist">' + SPEC.map(x => btn(x.id, T(x.ar, x.en))).join('') + btn('off', T('بدون صوت', 'Silent')) + '</div></div>';
};
MSA.wireSound = function(root){
  const box = root.querySelector('[data-sec=snd]'); if (!box) return;
  box.onclick = e => {
    const b = e.target.closest('[data-snd]'); if (!b) return; const id = b.dataset.snd;
    MSA.state.settings.sound = id; MSA.save();
    box.querySelectorAll('.snd').forEach(x => x.classList.toggle('on', x.dataset.snd === id));
    play(id);
    try { if (MSA.alarms && MSA.alarms.native()) MSA.alarms.sync(false); } catch (x) {}
  };
};
})();
