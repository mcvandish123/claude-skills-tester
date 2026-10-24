/* ==========================================================================
   Terminal output
   Helpers that print lines, echoed commands and folder links.
   ========================================================================== */
(() => {
  'use strict';

  const { $ } = App;

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

  App.term = { out, form, input, FOLDERS, line, echo, listFolders };
})();
