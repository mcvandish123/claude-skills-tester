/* ==========================================================================
   Projects carousel
   ========================================================================== */
(() => {
  'use strict';

  const { $, $$, reduceMotion } = App;

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
})();
