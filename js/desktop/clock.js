/* ==========================================================================
   Menu bar clock
   ========================================================================== */
(() => {
  'use strict';

  const { $ } = App;

  const clock = $('#clock');
  function tick() {
    const now = new Date();
    const day = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    clock.textContent = `${day}  ${time}`;
    clock.dateTime = now.toISOString();
  }
  tick();
  setTimeout(() => { tick(); setInterval(tick, 60_000); }, (60 - new Date().getSeconds()) * 1000);
})();
