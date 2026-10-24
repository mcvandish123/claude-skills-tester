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

  // Pass box/w/h when you already measured them, so this only writes.
  // Returns the window's viewport rect, computed rather than read back.
  function setPos(win, x, y, box = area.getBoundingClientRect(), w = win.offsetWidth, h = win.offsetHeight) {
    const left = Math.round(Math.min(Math.max(x, 120 - w), box.width - 120));
    const top = Math.round(Math.min(Math.max(y, 0), box.height - 60));
    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
    return { left: box.left + left, top: box.top + top, width: w, height: h };
  }

  // Reads layout once, then writes. Returns the final rect, or null if nothing moved.
  function place(win) {
    if (win.dataset.placed || phone.matches) return null;
    const box = area.getBoundingClientRect();
    const w = win.offsetWidth;
    const h = win.offsetHeight;
    let rect;
    if (win.dataset.window === 'terminal') {
      // Top right, clear of the folder column and the hero name
      rect = setPos(win, box.width - w - 150, 28, box, w, h);
    } else {
      const step = (cascade++ % 5) * 26;
      rect = setPos(win, (box.width - w) / 2 - 52 + step, Math.max(14, (box.height - h) / 2 - 56) + step, box, w, h);
    }
    win.dataset.placed = '1';
    return rect;
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
  // Callers measure both rects before writing any styles, so starting the tween
  // forces no extra layout. `is-animating` gives the window its own compositor
  // layer and drops the backdrop blur, so each frame is composite-only.
  function fromTo(win, o, r, opening, done) {
    if (!o) { done?.(); return; }
    const offset = {
      x: o.left + o.width / 2 - (r.left + r.width / 2),
      y: o.top + o.height / 2 - (r.top + r.height / 2),
      scale: 0.1,
      opacity: 0,
    };
    const rest = { x: 0, y: 0, scale: 1, opacity: 1 };
    gsap.killTweensOf(win);
    win.classList.add('is-animating');
    gsap.fromTo(win, opening ? offset : rest, {
      ...(opening ? rest : offset),
      duration: opening ? 0.5 : 0.3,
      ease: opening ? 'expo.out' : 'power3.in',
      clearProps: 'transform,opacity',
      onComplete: () => {
        win.classList.remove('is-animating');
        done?.();
      },
    });
  }

  // onOpen runs once the window has finished growing in.
  function openWin(name, opener, { focus = true, onOpen } = {}) {
    const win = wins.get(name);
    if (!win) return;
    if (opener && !opener.closest('.window')) openers.set(name, opener);

    // Read before writing: the icon's rect is free while layout is still clean.
    const wasShown = isShown(win);
    const origin = !wasShown && canAnimate() ? opener || dockItem(name) : null;
    const from = origin?.getBoundingClientRect();

    win.classList.add('is-open');
    win.classList.remove('is-minimized');
    const to = place(win);
    focusWin(win);
    dockItem(name)?.classList.add('is-running');

    if (from) fromTo(win, from, to || win.getBoundingClientRect(), true, onOpen);
    else onOpen?.();
    if (focus) {
      const target = name === 'terminal' ? $('#term-input') : $('.window__title', win);
      target.focus({ preventScroll: true });
    }
  }

  function closeWin(win, { minimize = false } = {}) {
    const name = win.dataset.window;
    const dock = dockItem(name);
    const to = canAnimate() ? dock?.getBoundingClientRect() : null;
    fromTo(win, to, to && win.getBoundingClientRect(), false, () => {
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
