/* ==========================================================================
   Benjamin Asjali — desktop portfolio
   Window manager, terminal, carousel and boot choreography.
   GSAP is optional: without it (or with reduced motion) everything still works.
   ========================================================================== */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const phone = window.matchMedia('(max-width: 760px)');
  const canAnimate = () => typeof window.gsap !== 'undefined' && !reduceMotion.matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const status = $('#sr-status');

  /* ---------- Menu bar clock ---------- */
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

  /* ---------- Missing media fallbacks ---------- */
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

  /* ==========================================================================
     Window manager
     ========================================================================== */
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

  /* ==========================================================================
     Projects carousel
     ========================================================================== */
  $$('[data-carousel]').forEach((carousel) => {
    const track = $('.carousel__track', carousel);
    const slides = [...track.children];
    const current = $('[data-carousel-current]', carousel);
    const dotsWrap = $('[data-carousel-dots]', carousel);
    const total = slides.length;
    let index = 0;

    $('[data-carousel-total]', carousel).textContent = total;

    const dots = slides.map((slide, i) => {
      slide.setAttribute('aria-label', `${i + 1} of ${total}`);
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', `Show project ${i + 1}`);
      dot.addEventListener('click', () => go(i));
      dotsWrap.append(dot);
      return dot;
    });

    function go(i) {
      index = (i + total) % total;
      track.scrollTo({ left: slides[index].offsetLeft, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      sync(index);
    }

    function sync(i) {
      current.textContent = i + 1;
      dots.forEach((d, n) => d.setAttribute('aria-current', String(n === i)));
    }

    let frame;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== index) { index = i; sync(i); }
      });
    }, { passive: true });

    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    });
    $('[data-carousel-prev]', carousel).addEventListener('click', () => go(index - 1));
    $('[data-carousel-next]', carousel).addEventListener('click', () => go(index + 1));

    sync(0);
  });

  /* ==========================================================================
     Copy to clipboard
     ========================================================================== */
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

  /* ==========================================================================
     Terminal
     ========================================================================== */
  const out = $('#term-out');
  const form = $('#term-form');
  const input = $('#term-input');
  const PROMPT = 'benjamin@workstation ~ %';
  const FOLDERS = ['about', 'projects', 'experience', 'contact'];

  function line(text, cls = 'term__res') {
    const p = document.createElement('p');
    p.className = cls;
    p.textContent = text;
    out.append(p);
    return p;
  }

  function echo(cmd) {
    const p = document.createElement('p');
    p.className = 'term__line';
    const prompt = document.createElement('span');
    prompt.className = 'term__prompt';
    prompt.textContent = PROMPT;
    const text = document.createElement('span');
    text.className = 'term__cmd';
    text.textContent = cmd;
    p.append(prompt, ' ', text);
    out.append(p);
  }

  function listFolders() {
    const p = document.createElement('p');
    p.className = 'term__res term__ls';
    FOLDERS.forEach((name) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.open = name;
      b.textContent = `${name[0].toUpperCase()}${name.slice(1)}/`;
      p.append(b);
    });
    out.append(p);
  }

  const commands = {
    help() {
      [
        'help              list commands',
        'whoami            who runs this machine',
        'ls                list Desktop folders',
        'open <folder>     open about, projects, experience or contact',
        'contact           print contact details',
        'clear             clear the screen',
      ].forEach((t) => line(t));
    },
    whoami() { line('Benjamin Asjali', 'term__res term__res--strong'); },
    ls: listFolders,
    contact() {
      line('mobile    0905 338 6927');
      line('email     benjaminasjali1@gmail.com');
      line('linkedin  linkedin.com/in/benjamin-asjali');
      line('github    github.com/mcvandish123');
    },
    clear() { out.replaceChildren(); },
    open(arg) {
      const name = (arg || '').replace(/\/$/, '').toLowerCase();
      if (FOLDERS.includes(name)) {
        line(`Opening ${name}…`, 'term__res term__muted');
        openWin(name, dockItem(name));
      } else {
        line(arg ? `open: ${arg}: no such folder` : 'usage: open <folder>', 'term__res term__error');
      }
    },
  };
  commands.cd = commands.open;
  FOLDERS.filter((f) => f !== 'contact').forEach((f) => { commands[f] = () => commands.open(f); });

  function run(raw) {
    const cmd = raw.trim();
    echo(cmd);
    if (!cmd) return;
    const [name, ...args] = cmd.split(/\s+/);
    if (name === 'cat' && args[0] === 'role.txt') {
      line('Backend Engineer & DevOps Engineer');
    } else if (name === 'sudo') {
      line('Nice try. This incident will be reported.', 'term__res term__muted');
    } else if (commands[name.toLowerCase()]) {
      commands[name.toLowerCase()](args.join(' '));
    } else {
      line(`zsh: command not found: ${name}. Type help.`, 'term__res term__error');
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run(input.value);
    input.value = '';
    out.parentElement.scrollTop = out.parentElement.scrollHeight;
  });

  // Typed intro: the HTML already holds the finished transcript.
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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

  /* ==========================================================================
     Boot
     ========================================================================== */
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
