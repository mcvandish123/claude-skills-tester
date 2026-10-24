/* ==========================================================================
   Missing media fallbacks
   Hides image slots whose file is missing; disables empty template links.
   ========================================================================== */
(() => {
  'use strict';

  const { $$ } = App;

  $$('img[data-fallback]').forEach((img) => {
    const wrap = img.closest('[data-media]');
    const mark = () => wrap.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') mark();
    img.addEventListener('error', mark);
  });

  /* Empty template links are unavailable, not dead */
  $$('a[href=""]').forEach((a) => {
    a.setAttribute('aria-disabled', 'true');
    a.setAttribute('tabindex', '-1');
    a.removeAttribute('target');
  });
})();
