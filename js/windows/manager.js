/* ==========================================================================
   Window manager
   Open, close, minimize, zoom, focus and drag the desktop windows.
   ========================================================================== */
(() => {
  'use strict';

  const { $, $$, phone, canAnimate } = App;

  const area = $('#windows');
  const wins = new Map($$('[data-window]').map((el) => [el.dataset.window, el]));
  const openers = new Map();
  let zTop = 10;
  let cascade = 0;

  const dockItem = (name) => $(`.dock [data-open="${name}"]`);
  const isShown = (win) => win.classList.contains('is-open') && !win.classList.contains('is-minimized');

  function setPos(win, x, y) {
    const box = area.getBoundingClientRect();
    const maxX = box.width - 120;
    const maxY = box.height - 60;
    win.style.left = `${Math.round(Math.min(Math.max(x, 120 - win.offsetWidth), maxX))}px`;
    win.style.top = `${Math.round(Math.min(Math.max(y, 0), maxY))}px`;
  }

  function place(win) {
    if (win.dataset.placed || phone.matches) return;
    const box = area.getBoundingClientRect();
    const w = win.offsetWidth;
    const h = win.offsetHeight;
    if (win.dataset.window === 'terminal') {
      // Top right, clear of the folder column and the hero name
      setPos(win, box.width - w - 150, 28);
    } else {
      const step = (cascade++ % 5) * 26;
      setPos(win, (box.width - w) / 2 - 52 + step, Math.max(14, (box.height - h) / 2 - 56) + step);
    }
    win.dataset.placed = '1';
  }

  function focusWin(win) {
    wins.forEach((w) => w.classList.toggle('is-focused', w === win));
    win.style.zIndex = ++zTop;
  }

  function topWindow() {
    return [...wins.values()]
      .filter(isShown)
      .sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
  }

  // Grow from (or shrink into) an icon, like the macOS genie but restrained.
  function fromTo(win, origin, opening, done) {
    if (!canAnimate() || !origin) { done?.(); return; }
    const o = origin.getBoundingClientRect();
    const r = win.getBoundingClientRect();
    const offset = {
      x: o.left + o.width / 2 - (r.left + r.width / 2),
      y: o.top + o.height / 2 - (r.top + r.height / 2),
      scale: 0.1,
      opacity: 0,
    };
    const rest = { x: 0, y: 0, scale: 1, opacity: 1 };
    gsap.killTweensOf(win);
    gsap.fromTo(win, opening ? offset : rest, {
      ...(opening ? rest : offset),
      duration: opening ? 0.5 : 0.3,
      ease: opening ? 'expo.out' : 'power3.in',
      clearProps: 'transform,opacity',
      onComplete: done,
    });
  }

  function openWin(name, opener, { focus = true } = {}) {
    const win = wins.get(name);
    if (!win) return;
    if (opener && !opener.closest('.window')) openers.set(name, opener);

    const wasShown = isShown(win);
    win.classList.add('is-open');
    win.classList.remove('is-minimized');
    place(win);
    focusWin(win);
    dockItem(name)?.classList.add('is-running');

    if (!wasShown) fromTo(win, opener || dockItem(name), true);
    if (focus) {
      const target = name === 'terminal' ? $('#term-input') : $('.window__title', win);
      target.focus({ preventScroll: true });
    }
  }

  function closeWin(win, { minimize = false } = {}) {
    const name = win.dataset.window;
    const dock = dockItem(name);
    fromTo(win, dock, false, () => {
      if (minimize) {
        win.classList.add('is-minimized');
      } else {
        win.classList.remove('is-open', 'is-zoomed', 'is-focused');
        dock?.classList.remove('is-running');
      }
      const next = topWindow();
      if (next) {
        focusWin(next);
        $('.window__title', next).focus({ preventScroll: true });
      } else {
        const back = openers.get(name);
        (back && back.offsetParent ? back : dock)?.focus({ preventScroll: true });
      }
    });
  }

  function zoomWin(win) {
    if (phone.matches) return;
    win.classList.toggle('is-zoomed');
  }

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) {
      e.preventDefault();
      openWin(opener.dataset.open, opener);
      return;
    }
    const action = e.target.closest('[data-action]');
    if (action) {
      const win = action.closest('.window');
      if (action.dataset.action === 'close') closeWin(win);
      if (action.dataset.action === 'minimize') closeWin(win, { minimize: true });
      if (action.dataset.action === 'zoom') zoomWin(win);
    }
    if (e.target.closest('a[aria-disabled="true"]')) e.preventDefault();
  });

  // Any press inside a window brings it forward
  area.addEventListener('pointerdown', (e) => {
    const win = e.target.closest('.window');
    if (win && !win.classList.contains('is-focused')) focusWin(win);
  }, true);
  area.addEventListener('focusin', (e) => {
    const win = e.target.closest('.window');
    if (win && !win.classList.contains('is-focused')) focusWin(win);
  });

  // Drag by the title bar
  area.addEventListener('pointerdown', (e) => {
    const bar = e.target.closest('.window__bar');
    if (!bar || e.button !== 0 || e.target.closest('button') || phone.matches) return;
    const win = bar.closest('.window');
    if (win.classList.contains('is-zoomed')) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const originX = win.offsetLeft;
    const originY = win.offsetTop;
    bar.setPointerCapture(e.pointerId);
    win.classList.add('is-dragging');

    const move = (ev) => setPos(win, originX + ev.clientX - startX, originY + ev.clientY - startY);
    const end = () => {
      win.classList.remove('is-dragging');
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', end);
      bar.removeEventListener('pointercancel', end);
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  });

  area.addEventListener('dblclick', (e) => {
    const bar = e.target.closest('.window__bar');
    if (bar && !e.target.closest('button')) zoomWin(bar.closest('.window'));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const win = document.activeElement?.closest('.window') || topWindow();
    if (win && isShown(win)) closeWin(win);
  });

  // Keep windows reachable after the viewport changes
  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (phone.matches) return;
      wins.forEach((win) => {
        if (!isShown(win)) return;
        if (!win.dataset.placed) place(win);
        else setPos(win, win.offsetLeft, win.offsetTop);
      });
    });
  });

  App.windows = { openWin, dockItem };
})();
