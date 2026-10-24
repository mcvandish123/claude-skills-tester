/* ==========================================================================
   Benjamin Asjali — desktop portfolio
   Shared helpers. Loaded first; every other script reads from window.App
   and adds what it wants to share (App.windows, App.term, ...).
   GSAP is optional: without it (or with reduced motion) everything still works.
   ========================================================================== */
window.App = (() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const phone = window.matchMedia('(max-width: 760px)');
  const canAnimate = () => typeof window.gsap !== 'undefined' && !reduceMotion.matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const status = $('#sr-status');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  return { $, $$, reduceMotion, phone, canAnimate, status, sleep };
})();
