# Benjamin Asjali Designing

A personal landing page for **Benjamin Asjali, Backend Engineer & DevOps Engineer**, designed as a macOS-style desktop. Visitors explore the portfolio the way they'd explore a computer: open folders, move windows around, and type commands into a terminal.

## What it does

- **Desktop:** the landing screen shows the name, role and calls to action on an animated wallpaper, with four folders: About, Projects, Experience and Contact.
- **Windows:** each folder opens a window that grows out of its icon. Windows can be dragged by the title bar, brought to the front, minimized to the dock, zoomed (green button or double-click the title bar) and closed (red button or `Esc`).
- **Terminal:** opens on load and types out `whoami`, `cat role.txt` and `ls ~/Desktop`. It accepts commands:

  | Command | What it does |
  | --- | --- |
  | `help` | List commands |
  | `whoami` | Print the owner's name |
| `portrait` / `cat portrait.bin` | Print the binary portrait |
  | `ls` | List the Desktop folders as clickable links |
  | `open <folder>` / `cd <folder>` | Open `about`, `projects`, `experience` or `contact` |
  | `contact` | Print contact details |
  | `clear` | Clear the screen |

- **Projects:** a carousel of project cards with a screenshot, summary, tech stack, repository link and live-site link. Navigate it with the arrow buttons, the dots, the keyboard arrow keys or by swiping.
- **Experience:** a list of companies, styled like Finder's list view, showing logo, role and period.
- **Contact:** a contact card with tap-to-call, email, copy-to-clipboard buttons, and LinkedIn, GitHub and Facebook links.
- **Dock and menu bar:** quick access to every window and social profile, a dot under each open window, and a live clock.

## Design

The visual system combines several design skills from `.claude/skills/agent-skills/`:

- **glass-dark-ui:** frosted dark glass for the menu bar, dock and windows, with masked gradient borders.
- **skeuomorphic-ui:** tactile folders, dock tiles, traffic-light buttons and buttons that press in when clicked. Light always comes from the top.
- **atmosphere-background:** slowly drifting vertical light bands in the accent blue and a glow in the lower-right corner.
- **Sparking doodles:** backend and DevOps line doodles (cloud, database, server rack, terminal, git branch, gear, the DevOps ∞ loop and more) draw themselves with a glowing pen tip that throws sparks, then glint and fade so the next one can start. They avoid your name, the folders and any open windows.
- **no-ai-design-slop:** used as a quality check. The page avoids fake testimonials, logo walls and invented metrics.

## Accessibility and resilience

- **Without JavaScript:** the page still renders as a complete, readable document.
- **Reduced motion:** with `prefers-reduced-motion` on, the intro, typing, window animations and background drift are all skipped, and the doodles appear finished without sparks.
- **Keyboard:** everything is reachable by keyboard, with visible focus states. Focus returns to the folder or button that opened a window when it closes.
- **Phones:** windows open as full-screen sheets and the folders sit in a grid.
- **CDN failures:** GSAP and Iconify load from CDNs. If either fails, the page still works, just without the animations or icons.

## Project structure

Each feature lives in its own file, so you can open just the part you want to change.

```
index.html                  Page markup: menu bar, desktop, windows, dock
css/
  main.css                  Entry point: imports every file below, in cascade order
  base/                     tokens.css (colors, fonts, sizes), reset.css, wallpaper.css
  components/               glass.css, buttons.css, profile.css (avatar + name block)
  desktop/                  menubar.css, hero.css, icons.css, dock.css, layout.css
  windows/                  window.css (frame, traffic lights), about, projects,
                            experience, contact, terminal
  states/                   responsive.css (phones), no-js.css, reduced-motion.css
  background/atmosphere.css Animated light folds and bloom
js/
  core/app.js               Shared helpers ($, $$, motion checks). Loads first.
  desktop/                  clock.js, media.js (missing-image fallbacks), boot.js (intro)
  windows/                  manager.js (open/close/drag/zoom), carousel.js, clipboard.js
  terminal/                 output.js (printing), commands.js (add commands here),
                            intro.js (typed intro), portrait.js (binary portrait)
  background/               doodle-shapes.js (SVG paths), doodles.js (canvas animation)
assets/
  profile.jpg               Your photo
  projects/                 Project screenshots: project-1.jpg, project-2.jpg, ...
  companies/                Company logos: company-1.png, company-2.png, ...
```

The scripts are plain `<script defer>` files, not ES modules, so the page still works when `index.html` is opened directly. They share code through a single `window.App` object: a file adds what others need (for example `App.windows.openWin`) and later files read it. Script order in `index.html` matters.

## Running it

There's no build step. Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Customizing

Every template spot in `index.html` has a comment explaining what to replace.

- **Photo:** save a square image as `assets/profile.jpg`. The avatar stays hidden until the file exists.
- **Projects:** add a screenshot as `assets/projects/project-N.jpg` (16:10 works best), then edit the title, summary and stack. Paste the URLs into `href=""`; empty links show as disabled. Copy an `<article class="slide">` block to add a project; the counter and dots update automatically.
- **Companies:** add a logo as `assets/companies/company-N.png`, then fill in the name, link, role, period and description. Copy an `<li class="list__row">` block to add a company.
- **About:** the summary and focus areas are starting points. Rewrite them to match your actual work.
- **Background:** at the top of `css/background/atmosphere.css`, `--atmo-accent` sets the color. Each fold's `--x`, `--w`, `--a` and `--dur` set its position, width, brightness and speed.

## Built with

- HTML, CSS and vanilla JavaScript
- [GSAP 3.12.5](https://gsap.com/) for the intro and window animations
- [Iconify](https://iconify.design/) with the Solar icon set and SVG Logos
- Inter and JetBrains Mono from Google Fonts. On macOS, the system San Francisco font is used.

## Contact

- Email: [benjaminasjali1@gmail.com](mailto:benjaminasjali1@gmail.com)
- Phone: 0905 338 6927
- LinkedIn: [benjamin-asjali](https://www.linkedin.com/in/benjamin-asjali/)
- GitHub: [mcvandish123](https://github.com/mcvandish123)
- Facebook: [benjamin.asjali.5](https://www.facebook.com/benjamin.asjali.5/)
