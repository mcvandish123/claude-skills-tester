/* ==========================================================================
   Doodle shapes
   Backend / DevOps line drawings as SVG path data in a 100 × 100 box,
   absolute commands only. Add a path to App.DOODLES to add a doodle.
   ========================================================================== */
(() => {
  'use strict';

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

  App.DOODLES = [
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
})();
