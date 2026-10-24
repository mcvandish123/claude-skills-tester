/* ==========================================================================
   Terminal intro
   Types out the transcript already in the HTML, one command at a time.
   ========================================================================== */
(() => {
  'use strict';

  const { $, $$, canAnimate, sleep } = App;

  const { out } = App.term;
  App.renderPortrait($('[data-portrait]', out));

  // Typed intro: the HTML already holds the finished transcript.
  let introDone = false;

  function finishIntro() {
    if (introDone) return;
    introDone = true;
    $$('[data-intro]', out).forEach((el) => {
      el.hidden = false;
      const cmd = $('.term__cmd', el);
      if (cmd?.dataset.full) cmd.textContent = cmd.dataset.full;
    });
    $('.term__caret', out)?.remove();
    out.setAttribute('aria-live', 'polite');
    out.removeAttribute('aria-busy');
  }

  async function typeIntro() {
    if (!canAnimate()) { finishIntro(); return; }
    const parts = $$('[data-intro]', out);
    out.setAttribute('aria-busy', 'true');
    parts.forEach((el) => { el.hidden = true; });
    const caret = document.createElement('span');
    caret.className = 'term__caret';
    caret.setAttribute('aria-hidden', 'true');

    for (const el of parts) {
      if (introDone) return;
      el.hidden = false;
      const cmd = $('.term__cmd', el);
      if (cmd) {
        cmd.dataset.full = cmd.textContent;
        cmd.textContent = '';
        cmd.after(caret);
        await sleep(260);
        for (const ch of cmd.dataset.full) {
          if (introDone) return;
          cmd.textContent += ch;
          await sleep(34 + Math.random() * 40);
        }
        await sleep(200);
      } else {
        await sleep(110);
      }
    }
    finishIntro();
  }

  // Any interaction with the terminal skips straight to the finished state
  ['pointerdown', 'keydown'].forEach((type) => {
    $('#win-terminal').addEventListener(type, finishIntro, { once: true });
  });

  Object.assign(App.term, { typeIntro, finishIntro });
})();
