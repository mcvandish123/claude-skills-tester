/* ==========================================================================
   Binary portrait, animated (three.js)
   `cat portrait.bin` prints the portrait as a 3D scene: every digit starts
   deep behind the terminal, spirals forward while flickering between 0 and 1,
   and locks into its cell row by row. The camera is set up so the z = 0 plane
   maps 1:1 onto the text grid, so the last frame lines up with the <pre>
   underneath, and the canvas fades out into the plain text.

   Runs for the typed intro and for the command. three.js loads on first use
   only. Without WebGL, or under reduced motion, the static portrait shows instead.
   ========================================================================== */
(() => {
  'use strict';

  const { reduceMotion, loadScript } = App;
  const THREE_SRC = 'js/vendor/three.min.js';

  const DUR = 1.15;       // seconds each digit takes to travel
  const STAGGER = 0.75;   // top row starts first, bottom row this much later
  const JITTER = 0.25;    // random extra delay so rows don't move as solid bars
  const FOV = 35;

  // Tone level -> [r, g, b, a]; matches .term__art--0..4 in terminal.css
  const ACCENT = [124 / 255, 188 / 255, 1];
  const TONES = [0.1, 0.25, 0.45, 0.7].map((a) => [...ACCENT, a]);
  TONES.push([238 / 255, 242 / 255, 247 / 255, 1]);

  const VERTEX = `
    attribute vec3 aStart;
    attribute vec4 aColor;
    attribute float aDelay;
    attribute float aGlyph;
    attribute float aSeed;
    uniform float uTime;
    uniform float uDur;
    uniform float uSize;
    uniform float uDist;
    varying vec4 vColor;
    varying float vGlyph;

    void main() {
      float t = clamp((uTime - aDelay) / uDur, 0.0, 1.0);
      float e = t >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t); // expo out

      // Spiral in: the start point swings around the z axis as it closes in
      float a = (1.0 - e) * 2.4 * (aSeed - 0.5);
      vec3 s = vec3(aStart.x * cos(a) - aStart.y * sin(a), aStart.x * sin(a) + aStart.y * cos(a), aStart.z);
      vec4 mv = modelViewMatrix * vec4(mix(s, position, e), 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * (uDist / -mv.z);

      // Flicker 0/1 in flight, settle on the real digit on arrival
      float flick = step(0.5, fract(sin(aSeed * 917.3 + floor(uTime * 16.0) * 12.9898) * 43758.5453));
      vGlyph = t >= 1.0 ? aGlyph : flick;

      // Bright while travelling, cooling to the tone colour as it lands
      vColor = vec4(mix(vec3(0.86, 0.94, 1.0), aColor.rgb, e), mix(0.95, aColor.a, e));
      vColor.a *= smoothstep(0.0, 0.12, t);
    }
  `;

  const FRAGMENT = `
    uniform sampler2D uAtlas;
    varying vec4 vColor;
    varying float vGlyph;

    void main() {
      vec2 uv = vec2((gl_PointCoord.x + vGlyph) * 0.5, 1.0 - gl_PointCoord.y);
      float a = texture2D(uAtlas, uv).a * vColor.a;
      if (a < 0.01) discard;
      gl_FragColor = vec4(vColor.rgb, a);
    }
  `;

  // "0" and "1" side by side, white on transparent; the shader tints them
  function glyphAtlas(THREE, font) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 64;
    const ctx = c.getContext('2d');
    ctx.font = `500 52px ${font}`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('0', 32, 34);
    ctx.fillText('1', 96, 34);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }

  function animate(THREE, stage, pre, digits) {
    // One layout read: where the text sits and how big a character cell is
    const css = getComputedStyle(pre);
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = css.font;
    const cw = measure.measureText('0').width;
    const lh = parseFloat(css.lineHeight) || parseFloat(css.fontSize);
    const rows = digits.length;
    const cols = Math.max(...digits.map((r) => r.length));
    const W = Math.ceil(cols * cw);
    const H = Math.ceil(rows * lh);
    const top = pre.offsetTop;
    const left = pre.offsetLeft;

    const canvas = document.createElement('canvas');
    canvas.className = 'term__art-3d';
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, { top: `${top}px`, left: `${left}px`, width: `${W}px`, height: `${H}px` });

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    } catch {
      return null; // no WebGL: caller shows the static text
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    stage.append(canvas);

    // Camera distance where 1 world unit = 1 CSS pixel on the z = 0 plane
    const dist = H / 2 / Math.tan((FOV * Math.PI) / 360);
    const camera = new THREE.PerspectiveCamera(FOV, W / H, 1, dist + 4000);
    camera.position.z = dist;
    const scene = new THREE.Scene();

    // One point per digit
    const target = [];
    const start = [];
    const color = [];
    const delay = [];
    const glyph = [];
    const seed = [];
    App.portrait.LEVELS.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch === ' ') return;
        const x = c * cw + cw / 2 - W / 2;
        const y = H / 2 - (r * lh + lh / 2);
        target.push(x, y, 0);
        start.push(x * 2.6 + (Math.random() - 0.5) * W * 0.6, y * 2.6 + (Math.random() - 0.5) * H * 0.4, -900 - Math.random() * 2200);
        color.push(...TONES[+ch]);
        delay.push((r / rows) * STAGGER + Math.random() * JITTER);
        glyph.push(+digits[r][c]);
        seed.push(Math.random());
      });
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(target, 3));
    geometry.setAttribute('aStart', new THREE.Float32BufferAttribute(start, 3));
    geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(color, 4));
    geometry.setAttribute('aDelay', new THREE.Float32BufferAttribute(delay, 1));
    geometry.setAttribute('aGlyph', new THREE.Float32BufferAttribute(glyph, 1));
    geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));

    const atlas = glyphAtlas(THREE, css.fontFamily);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uDur: { value: DUR },
        uSize: { value: lh * dpr * 1.25 },
        uDist: { value: dist },
        uAtlas: { value: atlas },
      },
      transparent: true,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false; // positions are computed in the shader
    scene.add(points);

    const total = STAGGER + JITTER + DUR;
    let elapsed = 0;
    let last = performance.now();

    function dispose() {
      geometry.dispose();
      material.dispose();
      atlas.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    }

    let landed;
    const done = new Promise((resolve) => { landed = resolve; });

    function finish() {
      pre.classList.remove('is-pending');
      canvas.classList.add('is-done');
      landed();
      // Fade the canvas into the text, then free the GPU context
      setTimeout(dispose, 260);
    }

    function frame(now) {
      // Clamp the step so a hidden tab resumes where it paused, not at the end
      elapsed += Math.min((now - last) / 1000, 1 / 20);
      last = now;
      material.uniforms.uTime.value = elapsed;
      points.rotation.y = 0.5 * (1 - Math.min(elapsed / total, 1)) ** 3;
      renderer.render(scene, camera);
      if (elapsed < total && canvas.isConnected) requestAnimationFrame(frame);
      else finish();
    }
    requestAnimationFrame((now) => { last = now; frame(now); });
    return done;
  }

  // Animates a portrait <pre> that is already in the page. The text is laid out
  // first (hidden) so the terminal reaches its final height straight away.
  // Resolves once the digits have landed, or right away when it can't animate.
  async function animatePortrait(pre) {
    const digits = App.portrait.rollDigits();
    App.renderPortrait(pre, digits);
    if (reduceMotion.matches) return;

    const stage = document.createElement('div');
    stage.className = 'term__art-stage';
    pre.before(stage);
    stage.append(pre);
    pre.classList.add('is-pending');
    try {
      await loadScript(THREE_SRC);
      const landed = stage.isConnected && animate(window.THREE, stage, pre, digits);
      if (landed) { await landed; return; }
    } catch {
      // fall through to the static portrait
    }
    pre.classList.remove('is-pending');
  }

  // For the command: append a new portrait to the terminal output and animate it
  function playPortrait(out) {
    const pre = document.createElement('pre');
    out.append(pre);
    return animatePortrait(pre);
  }

  // Start fetching three.js early (e.g. while the intro types the command)
  const preloadPortrait = () => loadScript(THREE_SRC).catch(() => {});

  Object.assign(App, { animatePortrait, playPortrait, preloadPortrait });
})();
