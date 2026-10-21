/* Android / iOS app shell behaviour (only active inside the Capacitor app) */
(function(){
const MSA = window.MSA;
const App = MSA.native && MSA.native('App');
if (!App || !App.addListener) return;
/* hardware / gesture "back": close the top dialog → go home → minimise the app */
App.addListener('backButton', () => {
  if (document.getElementById('lock')) { try { App.minimizeApp(); } catch (e) {} return; }
  const pres = document.querySelector('#pres [data-p=close]'); if (pres) { pres.click(); return; }
  const tops = [...document.querySelectorAll('.overlay [data-x], .drawer-wrap [data-x]')]; const x = tops[tops.length - 1];
  if (x) { x.click(); return; }
  const bd = document.querySelector('#msaBoard [data-c=close]'); if (bd) { bd.click(); return; }
  if (MSA.view && MSA.view !== 'home') { MSA.go('home'); return; }
  try { App.minimizeApp(); } catch (e) {}
});
})();

