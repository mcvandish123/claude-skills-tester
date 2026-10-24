/* ==========================================================================
   Copy to clipboard (Contact window)
   ========================================================================== */
(() => {
  'use strict';

  const { $$, status } = App;

  $$('[data-copy]').forEach((btn) => {
    const label = btn.getAttribute('aria-label');
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.classList.add('is-copied');
        btn.setAttribute('aria-label', 'Copied');
        status.textContent = `${btn.dataset.copy} copied to clipboard`;
        setTimeout(() => {
          btn.classList.remove('is-copied');
          btn.setAttribute('aria-label', label);
        }, 1600);
      } catch {
        status.textContent = 'Copy failed. Select the text instead.';
      }
    });
  });
})();
