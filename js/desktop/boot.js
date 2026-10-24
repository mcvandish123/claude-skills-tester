/* ==========================================================================
   Boot
   Intro choreography: menu bar, name, folders and dock, then the terminal.
   ========================================================================== */
(() => {
  'use strict';

  const { $, phone, canAnimate } = App;

  const { openWin, dockItem } = App.windows;
  const { typeIntro, finishIntro } = App.term;

  function splitName() {
    const h1 = $('.hero__name');
    const text = h1.textContent.trim();
    h1.setAttribute('aria-label', text);
    h1.replaceChildren(...text.split(/\s+/).map((word) => {
      const outer = document.createElement('span');
      outer.className = 'word';
      outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.textContent = word;
      outer.append(inner);
      return outer;
    }));
  }

  function boot() {
    splitName();
    const withTerminal = !phone.matches;

    if (!canAnimate()) {
      if (withTerminal) openWin('terminal', null, { focus: false });
      finishIntro();
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.menubar', { yPercent: -100, duration: 0.6 })
      .from('.hero__name .word > span', { yPercent: 105, duration: 1.1, stagger: 0.09 }, 0.1)
      .from(['.hero__role', '.hero__lede', '.hero__actions'], { y: 14, opacity: 0, duration: 0.8, stagger: 0.07 }, 0.4)
      .from('.icons li', { y: 10, opacity: 0, duration: 0.6, stagger: 0.06 }, 0.45)
      .from('.dock', { y: 110, duration: 0.9 }, 0.3);

    if (withTerminal) {
      tl.add(() => {
        openWin('terminal', dockItem('terminal'), { focus: false });
        typeIntro();
      }, 0.95);
    } else {
      finishIntro();
    }
  }

  // GSAP loads with defer before this script runs; fonts settle the hero metrics.
  boot();
})();
