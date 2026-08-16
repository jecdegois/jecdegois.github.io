# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

GitHub Pages personal site (`jecdegois.github.io`), served straight from `master` at the repo root. No build step, no package manager, no tests, no CI. Every directory is an independent static mini-project reachable at `/<carpeta>/`.

## Running / verifying

Open the HTML file directly, or serve the root so absolute paths resolve like on Pages:

```
python3 -m http.server 8000   # then http://localhost:8000/parati/
```

Serving matters: the service worker and the `fetch` of `projects.json` need `http://localhost`, not `file://`.

Deploy = commit and push to `master`. Nothing else runs.

## Project map

| Path | What it is |
|---|---|
| `index.html`, `css/`, `js/`, `data/`, `sw.js` | The portfolio — the actual site |
| `parati/`, `feliz-cumple/` | Interactive vanilla-JS mini-games (HTML + `styles.css` + `game.js`) |
| `mari/index.html` | Single-file page — HTML, CSS and JS all inline |
| `juego/` | **Built output** of an external Vite + Phaser project; `assets/*.js` are bundles, never edit them |
| `cv/`, `mobileFirst/` | Static layout exercises |

The mini-projects are legacy and deliberately **not linked** from the portfolio. Leave them in place; do not surface them in `data/projects.json` or in any nav.

## Portfolio internals

- **`data/projects.json` is the only content source.** Profile, stack, contact links, projects and tag filters are all rendered from it at runtime. Adding a project means editing that file — never the HTML. Filters are derived from the tags present in the data.
- **`js/main.js`** paints from a `localStorage` copy (`portfolio:data`) on load, then refetches the JSON and re-renders only if the raw text differs. All JSON values pass through `esc()` before hitting `innerHTML`.
- **`sw.js` caches the shell** (`index.html`, `css/styles.css`, `js/main.js`) stale-while-revalidate, and `data/projects.json` network-first. It intentionally ignores every other path so the legacy folders are never cached.
- **Bump `VERSION` in `sw.js` whenever the shell changes.** That is what evicts the old cache; returning visitors get the new SW, which calls `skipWaiting()`, and the page reloads once on `controllerchange`. Content-only changes to `projects.json` need no bump — they propagate on the next visit on their own.
- **Design tokens** live in `:root` in `css/styles.css` and use `light-dark()`. Theme cycles auto → light → dark via `data-theme` on `<html>`, applied by an inline script in `<head>` to avoid a flash. Note `light-dark()` only accepts colors — do not use it for `opacity` or `mix-blend-mode`.
- Motion is CSS-only: one staggered load via `--i`, scroll reveals behind `@supports (animation-timeline: view())`, and `prefers-reduced-motion` kills all of it.

## Conventions that matter

- **Vanilla only.** No frameworks, no bundlers, no npm deps. Third-party assets come from CDNs (Google Fonts) via `<link>`.
- **Screen state machine** (`parati/game.js`, `feliz-cumple/game.js`): all views live in the DOM as `.screen` elements; a single `showScreen()` / `mostrarPantalla()` toggles the `.active` class. Add a new view by adding markup plus a call, not by routing.
- **Data-driven content**: `feliz-cumple/game.js` renders the whole flow from the `PASOS` array (`tipo: 'pregunta' | 'mensaje'`) and `parati/game.js` from its `CONFIG` block at the top. Change copy, goals, or steps there — not in the render functions.
- **Spanish UI, Spanish identifiers** in `feliz-cumple/` and `parati/` (`mostrarPantalla`, `PASOS`, `burbuja`). Match the file you are editing rather than switching to English.
- **Mobile-first, touch-first**: these pages are designed for phones (`maximum-scale=1.0, user-scalable=no`, touch handlers alongside mouse ones). Keep both input paths when touching interaction code.
- `feliz-cumple/game.js` holds a hardcoded `WHATSAPP_NUMERO` used to build the share link.

## Known gotcha

`juego/index.html` loads `/assets/index-DEmo07Sd.js` (root-absolute) while the bundle lives in `juego/assets/`. It only resolves if the file is also present at the site root. If the game is blank, that path is why — fix by making it relative (`./assets/...`) or rebuilding upstream with the right Vite `base`.
