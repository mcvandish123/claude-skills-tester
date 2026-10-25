/* ==========================================================================
   Terminal commands
   Add a command by adding a function to `commands`.
   ========================================================================== */
(() => {
  'use strict';

  const { out, form, input, FOLDERS, line, echo, listFolders } = App.term;
  const { openWin, dockItem } = App.windows;

  const commands = {
    help() {
      [
        'help              list commands',
        'whoami            who runs this machine',
        'portrait          print my face in binary',
        'ls                list Desktop folders',
        'open <folder>     open about, projects, experience or contact',
        'contact           print contact details',
        'clear             clear the screen',
      ].forEach((t) => line(t));
    },
    whoami() { line('Benjamin Asjali', 'term__res term__res--strong'); },
    portrait() { App.playPortrait(out); },
    ls: listFolders,
    contact() {
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
    } else if (name === 'cat' && args[0] === 'portrait.bin') {
      App.playPortrait(out);
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
})();
