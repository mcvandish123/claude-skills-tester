/* ==========================================================================
   Doodle layer
   Backend / DevOps line doodles that draw themselves with a sparking pen tip,
   burst when finished, glint while they rest, then fade for the next one.
   Canvas only, DPR capped, paused when the tab is hidden, static under
   reduced motion. Styles live in animation.css.
   ========================================================================== */
(() => {
  'use strict';

  const canvas = document.querySelector('.doodles');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const phone = window.matchMedia('(max-width: 760px)');

  /* ---------- Doodles: drawn in a 100 × 100 box, absolute commands only ---------- */
  function gear() {
    const teeth = 8, inner = 27, outer = 36, step = (Math.PI * 2) / teeth;
    const pt = (r, a) => `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
    let d = `M${pt(inner, 0)}`;
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      d += ` L${pt(outer, a + step * 0.12)} L${pt(outer, a + step * 0.42)} L${pt(inner, a + step * 0.54)} L${pt(inner, a + step)}`;
    }
    return `${d} M61 50 A11 11 0 1 1 39 50 A11 11 0 1 1 61 50`;
  }

  const DOODLES = [
    // cloud
    'M30 68 H72 C84 68 86 50 74 46 C74 30 54 24 46 36 C40 30 28 34 30 46 C18 48 18 68 30 68',
    // database
    'M24 28 A26 9 0 0 0 76 28 A26 9 0 0 0 24 28 V72 A26 9 0 0 0 76 72 V28 M24 50 A26 9 0 0 0 76 50',
    // server rack
    'M22 20 H78 V44 H22 Z M22 56 H78 V80 H22 Z M31 32 H35 M31 68 H35 M50 32 H69 M50 68 H69',
    // terminal
    'M16 24 H84 V76 H16 Z M16 34 H84 M28 46 L40 55 L28 64 M46 66 H62',
    // curly braces
    'M40 16 C29 16 32 30 32 40 C32 46 28 50 22 50 C28 50 32 54 32 60 C32 70 29 84 40 84 M60 16 C71 16 68 30 68 40 C68 46 72 50 78 50 C72 50 68 54 68 60 C68 70 71 84 60 84',
    // </>
    'M36 28 L16 50 L36 72 M64 28 L84 50 L64 72 M57 22 L43 78',
    // gear
    gear(),
    // git branch
    'M36 22 A6 6 0 1 1 24 22 A6 6 0 1 1 36 22 M30 28 V72 M36 78 A6 6 0 1 1 24 78 A6 6 0 1 1 36 78 M76 30 A6 6 0 1 1 64 30 A6 6 0 1 1 76 30 M70 36 C70 56 30 48 30 64',
    // container (isometric box)
    'M50 16 L82 33 V67 L50 84 L18 67 V33 Z M18 33 L50 50 L82 33 M50 50 V84',
    // DevOps loop
    'M50 50 C40 34 14 34 14 50 C14 66 40 66 50 50 C60 34 86 34 86 50 C86 66 60 66 50 50',
    // rocket (deploy)
    'M50 12 C65 24 67 46 60 64 H40 C33 46 35 24 50 12 Z M50 30 A6 6 0 1 1 49.9 30 M40 54 L27 70 L40 67 M60 54 L73 70 L60 67 M45 72 L50 86 L55 72',
    // lock
    'M30 46 H70 V82 H30 Z M38 46 V36 A12 12 0 0 1 62 36 V46 M50 58 V68',
    // coffee
    'M26 42 H66 V62 A16 16 0 0 1 50 78 H42 A16 16 0 0 1 26 62 Z M66 48 H71 A7 7 0 0 1 71 62 H66 M38 20 C34 26 42 30 38 36 M50 20 C46 26 54 30 50 36',
  ];

  /* Measure each sub-path once so the pen can draw them in order */
  const SAMPLE = 1.5;
  const shapes = (() => {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    document.body.append(svg);
    const built = DOODLES.map((d) => {
      const segs = d.split(/(?=M)/).map((sub) => {
        const el = document.createElementNS(ns, 'path');
        el.setAttribute('d', sub);
        svg.append(el);
        const length = el.getTotalLength();
        const pts = [];
        for (let l = 0; l <= length; l += SAMPLE) {
          const p = el.getPointAtLength(l);
          pts.push(p.x, p.y);
        }
        const end = el.getPointAtLength(length);
        pts.push(end.x, end.y);
        return { path: new Path2D(sub), length, pts };
      });
      return { segs, total: segs.reduce((sum, s) => sum + s.length, 0) };
    });
    svg.remove();
    return built;
  })();

  /* ---------- Palette (from --accent) ---------- */
  const STROKE = 'rgba(226, 240, 255, 0.72)';
  const STROKE_ECHO = 'rgba(160, 205, 255, 0.28)';
  const GLOW = 'rgba(124, 188, 255, 0.85)';
  const SPARK_COLORS = ['255, 255, 255', '214, 234, 255', '160, 208, 255', '255, 226, 160'];

  /* ---------- Canvas sizing ---------- */
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    if (reduceMotion.matches) drawStatic();
  }

  /* ---------- Helpers ---------- */
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const easeInOut = (t) => 0.5 - Math.cos(Math.PI * t) / 2;

  function toScreen(d, x, y) {
    const lx = (x - 50) * d.scale;
    const ly = (y - 50) * d.scale;
    return [d.x + lx * d.cos - ly * d.sin, d.y + lx * d.sin + ly * d.cos];
  }

  // Where the pen is after drawing `len` units of the shape
  function pointAt(shape, len) {
    for (const seg of shape.segs) {
      if (len <= seg.length) {
        const i = Math.min(Math.floor(len / SAMPLE), seg.pts.length / 2 - 1) * 2;
        return [seg.pts[i], seg.pts[i + 1]];
      }
      len -= seg.length;
    }
    const last = shape.segs[shape.segs.length - 1].pts;
    return [last[last.length - 2], last[last.length - 1]];
  }

  function sparkle(x, y, r, alpha, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.quadraticCurveTo(0, 0, 0, r);
    ctx.quadraticCurveTo(0, 0, -r, 0);
    ctx.quadraticCurveTo(0, 0, 0, -r);
    ctx.fillStyle = '#f4f9ff';
    ctx.fill();
    ctx.restore();
  }

  /* ---------- Placement: keep doodles off the name, folders and open windows ---------- */
  function blockedRects() {
    const sel = '.hero, .icons, .menubar, .dock, .window.is-open:not(.is-minimized)';
    return [...document.querySelectorAll(sel)].map((el) => el.getBoundingClientRect());
  }

  const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

  function findSpot(size, others) {
    const blocked = blockedRects();
    const half = size / 2 + 8;
    for (let i = 0; i < 40; i++) {
      const x = rand(half + 12, W - half - 12);
      const y = rand(half + 40, H - half - 20);
      const box = { left: x - half, right: x + half, top: y - half, bottom: y + half };
      if (blocked.some((r) => overlaps(box, r))) continue;
      if (others.some((o) => overlaps(box, o.box))) continue;
      return { x, y, box: { left: box.left - 24, right: box.right + 24, top: box.top - 24, bottom: box.bottom + 24 } };
    }
    return null;
  }

  /* ---------- State ---------- */
  const doodles = [];
  const sparks = [];
  const twinkles = [];
  const recent = [];
  let nextSpawn = 0;

  function pickShape() {
    const busy = new Set([...doodles.map((d) => d.index), ...recent]);
    const free = shapes.map((_, i) => i).filter((i) => !busy.has(i));
    const pool = free.length ? free : shapes.map((_, i) => i);
    const index = pool[Math.floor(Math.random() * pool.length)];
    recent.push(index);
    if (recent.length > 5) recent.shift();
    return index;
  }

  function spawn(now, finished = false) {
    const small = phone.matches;
    const scale = small ? rand(0.7, 0.95) : rand(1.0, 1.45);
    const spot = findSpot(100 * scale, doodles);
    if (!spot) return false;
    const index = pickShape();
    const shape = shapes[index];
    const rot = rand(-0.2, 0.2);
    doodles.push({
      index, shape, scale, rot,
      x: spot.x, y: spot.y, box: spot.box,
      cos: Math.cos(rot), sin: Math.sin(rot),
      start: now,
      draw: Math.min(3.6, Math.max(1.8, shape.total / 150)) * 1000,
      hold: rand(2400, 3400),
      fade: 1400,
      burst: finished,
      finished,
    });
    return true;
  }

  function emit(x, y, count, power) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = rand(0.4, power);
      const life = rand(26, 58);
      sparks.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 0.4,
        life, max: life,
        size: rand(0.8, 2.1),
        color: SPARK_COLORS[Math.random() < 0.22 ? 3 : Math.floor(Math.random() * 3)],
      });
    }
  }

  function seedTwinkles() {
    twinkles.length = 0;
    const count = phone.matches ? 10 : 18;
    for (let i = 0; i < count; i++) {
      twinkles.push({ x: rand(0, W), y: rand(0, H), r: rand(2, 4.5), speed: rand(0.5, 1.2), phase: rand(0, Math.PI * 2), last: 0 });
    }
  }

  /* ---------- Rendering ---------- */
  function strokeShape(d, progress, alpha) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.scale(d.scale, d.scale);
    ctx.translate(-50, -50);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Two passes, slightly offset, for a hand-drawn feel
    for (const pass of [0, 1]) {
      let remaining = progress * d.shape.total;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = (pass ? 1 : 1.6) / d.scale;
      ctx.strokeStyle = pass ? STROKE_ECHO : STROKE;
      ctx.shadowColor = GLOW;
      ctx.shadowBlur = pass ? 0 : 8;
      if (pass) ctx.translate(0.9, 0.7);
      for (const seg of d.shape.segs) {
        if (remaining <= 0) break;
        ctx.setLineDash(remaining >= seg.length ? [] : [remaining, seg.length]);
        ctx.stroke(seg.path);
        remaining -= seg.length;
      }
    }
    ctx.restore();
  }

  function drawPen(x, y, now) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    g.addColorStop(0.25, 'rgba(190, 225, 255, 0.55)');
    g.addColorStop(1, 'rgba(124, 188, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    sparkle(x, y, 7 + Math.sin(now / 60) * 2, 0.9, now / 400);
  }

  function frame(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    // Ambient twinkles: mostly dark, occasionally a sharp glint
    const t = now / 1000;
    for (const s of twinkles) {
      const v = Math.sin(t * s.speed + s.phase);
      if (s.last < 0 && v >= 0) { s.x = rand(0, W); s.y = rand(0, H); }
      s.last = v;
      const a = Math.pow(Math.max(0, v), 6) * 0.75;
      if (a > 0.01) sparkle(s.x, s.y, s.r, a, s.phase);
    }

    // Spawn
    const want = phone.matches ? 2 : 3;
    if (doodles.length < want && now >= nextSpawn) {
      nextSpawn = now + (spawn(now) ? rand(1400, 2600) : 700);
    }

    // Doodles
    for (let i = doodles.length - 1; i >= 0; i--) {
      const d = doodles[i];
      const age = now - d.start;
      const p = clamp01(age / d.draw);
      const eased = easeInOut(p);
      let alpha = 1;
      if (age > d.draw + d.hold) alpha = 1 - (age - d.draw - d.hold) / d.fade;
      if (alpha <= 0) { doodles.splice(i, 1); continue; }

      ctx.globalCompositeOperation = 'source-over';
      strokeShape(d, eased, alpha);
      ctx.globalCompositeOperation = 'lighter';

      if (p < 1) {
        const [lx, ly] = pointAt(d.shape, eased * d.shape.total);
        const [x, y] = toScreen(d, lx, ly);
        emit(x, y, 5, 2.9);
        drawPen(x, y, now);
      } else if (!d.burst) {
        d.burst = true;
        const [lx, ly] = pointAt(d.shape, d.shape.total);
        const [x, y] = toScreen(d, lx, ly);
        emit(x, y, 40, 3.8);
      } else if (alpha === 1 && Math.random() < 0.06) {
        // Resting glint somewhere along the line
        const [lx, ly] = pointAt(d.shape, Math.random() * d.shape.total);
        const [x, y] = toScreen(d, lx, ly);
        sparkle(x, y, rand(3, 6), 0.85, Math.random());
        emit(x, y, 2, 1.2);
      }
    }

    // Sparks: short streaks that fall and fade
    ctx.lineCap = 'round';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.975;
      s.vy = s.vy * 0.975 + 0.045;
      s.life -= 1;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const k = s.life / s.max;
      ctx.strokeStyle = `rgba(${s.color}, 1)`;
      ctx.beginPath();
      ctx.moveTo(s.x - s.vx * 3, s.y - s.vy * 3);
      ctx.lineTo(s.x, s.y);
      // soft halo, then the hot core
      ctx.globalAlpha = k * 0.25;
      ctx.lineWidth = s.size * 4;
      ctx.stroke();
      ctx.globalAlpha = k;
      ctx.lineWidth = s.size * (0.6 + k);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* Reduced motion: a few finished doodles, nothing moves */
  function drawStatic() {
    doodles.length = 0;
    sparks.length = 0;
    const now = performance.now();
    for (let i = 0; i < (phone.matches ? 2 : 3); i++) spawn(now, true);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    doodles.forEach((d) => strokeShape(d, 1, 0.8));
  }

  /* ---------- Loop control ---------- */
  let raf = 0;
  const loop = (now) => { frame(now); raf = requestAnimationFrame(loop); };
  function start() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (reduceMotion.matches) { drawStatic(); return; }
    if (!document.hidden) raf = requestAnimationFrame(loop);
  }

  resize();
  seedTwinkles();
  nextSpawn = performance.now() + 1200; // let the intro land first

  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { resize(); seedTwinkles(); });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else start();
  });
  reduceMotion.addEventListener('change', start);

  // Wait one frame so the intro layout (hero, icons) exists before placing doodles
  requestAnimationFrame(start);
})();
