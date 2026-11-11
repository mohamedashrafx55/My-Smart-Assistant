/* Motion system: one switch for every animation in the app.
   mode (per device, localStorage msa_motion): auto | full | light | off
   auto follows the OS "reduce motion" setting. Applied as html[data-motion]. */
(function(){
'use strict';
const KEY = 'msa_motion';
const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const get = () => { try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; } };
const eff = () => { const m = get(); return m === 'auto' ? (mq && mq.matches ? 'off' : 'full') : (m === 'light' || m === 'off' || m === 'full' ? m : 'full'); };
const apply = () => { document.documentElement.dataset.motion = eff(); };
function set(m){ try { localStorage.setItem(KEY, m); } catch (e) {} apply(); }
if (mq && mq.addEventListener) mq.addEventListener('change', apply);
addEventListener('storage', e => { if (e.key === KEY) apply(); });
apply();

/* close an overlay/drawer with a short exit animation (instant when motion is off).
   The live class is swapped so "is an overlay open?" checks across the app stay correct. */
function out(el){
  if (!el || !el.parentNode) return;
  if (eff() === 'off') { el.remove(); return; }
  const drawer = el.classList.contains('drawer-wrap');
  el.classList.remove('overlay', 'drawer-wrap');
  el.classList.add(drawer ? 'dw-closing' : 'ov-closing');
  el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true');
  let done = false; const fin = () => { if (!done) { done = true; el.remove(); } };
  el.addEventListener('animationend', e => { if (e.target === el) fin(); });
  setTimeout(fin, 260);
}

/* gentle entrance for a single item added to an already-rendered list.
   Bulk renders (several nodes at once) and whole-view swaps are left alone. */
const SKIP = /^(SPAN|I|B|SVG|PATH|OPTION|BR|INPUT|STYLE|SCRIPT|CIRCLE|LINE|RECT|G|TEXT|TSPAN|LABEL|SMALL|STRONG|EM|A|CANVAS|IMG|VIDEO|AUDIO)$/i;
let obs = null;
function watch(){
  const v = document.getElementById('view'); if (!v || obs || !window.MutationObserver) return;
  obs = new MutationObserver(muts => {
    if (eff() !== 'full') return;
    let n = 0; const list = [];
    for (const m of muts) for (const a of m.addedNodes) { if (a.nodeType === 1) { n++; list.push([a, m.target]); } }
    if (n < 1 || n > 2) return;
    for (const [a, par] of list) {
      if (SKIP.test(a.tagName) || a === v.firstChild || par === v || a.classList.contains('view-in')) continue;
      if (par.childElementCount < 2 || par.closest('.mapbox,.mcanvas,#msaBoard,.hide-mo')) continue;
      if (a.closest('.mo-in')) continue;
      a.classList.add('mo-in'); setTimeout(() => a.classList.remove('mo-in'), 320);
    }
  });
  obs.observe(v, { childList: true, subtree: true });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
setTimeout(watch, 1500);

window.MSA = window.MSA || {};
MSA.motion = { get, eff, set, apply, out };
})();
