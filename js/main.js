/* ═══════════════════════════════════════════════════════════
   Portfolio runtime.
   Renders everything from data/projects.json. Paints instantly
   from a localStorage copy, then revalidates over the network.
   ═══════════════════════════════════════════════════════════ */

const DATA_URL = "data/projects.json";
const CACHE_KEY = "portfolio:data";
const THEME_KEY = "portfolio:theme";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Everything from the JSON goes through here before touching innerHTML. */
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const state = { data: null, filter: "*" };

/* ── Theme: auto → light → dark ───────────────────────────── */
const THEMES = ["auto", "light", "dark"];

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "auto") {
    root.removeAttribute("data-theme");
    try {
      localStorage.removeItem(THEME_KEY);
    } catch {}
  } else {
    root.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }
  $("#theme-label").textContent = theme;
}

function initTheme() {
  let current = "auto";
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (THEMES.includes(stored)) current = stored;
  } catch {}
  applyTheme(current);

  $("#theme-toggle").addEventListener("click", () => {
    current = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    applyTheme(current);
  });
}

/* ── Rendering ────────────────────────────────────────────── */
function bind(name, value) {
  $$(`[data-bind="${name}"]`).forEach((el) => {
    el.textContent = value;
  });
}

function renderProfile(profile, version) {
  document.title = `${profile.name} — ${profile.role}`;
  bind("name", profile.name);
  bind("name-footer", profile.name);
  bind("handle", profile.handle ?? "");
  bind("role", profile.role);
  bind("tagline", profile.tagline ?? "");
  bind("bio", profile.bio ?? "");
  bind("location", profile.location ?? "");
  bind("year", new Date().getFullYear());
  bind("data-version", version ? `rev ${version}` : "");

  const availability = profile.available
    ? (profile.availableLabel ?? "Available for work")
    : "Portfolio";
  bind("availability", availability);
  $$('[data-bind="status-dot"]').forEach((el) => {
    el.hidden = !profile.available;
  });

  const gh = $('[data-bind="link-github"]');
  if (gh && profile.links?.github) gh.href = profile.links.github;

  // Ticker: the list is duplicated so the marquee loops seamlessly.
  const stack = profile.stack ?? [];
  const run = stack.map((s) => `<span>${esc(s)}</span>`).join("");
  $("#ticker-track").innerHTML = run + run;

  $("#stack").innerHTML = stack.map((s) => `<li>${esc(s)}</li>`).join("");

  const labels = { email: "Email", github: "GitHub", linkedin: "LinkedIn" };
  $("#contact-links").innerHTML = Object.entries(profile.links ?? {})
    .filter(([, href]) => href)
    .map(([key, href]) => {
      const url = key === "email" ? `mailto:${href}` : href;
      const external = key !== "email";
      return `<li><a class="btn${key === "email" ? " btn--solid" : ""}" href="${esc(url)}"${
        external ? ' target="_blank" rel="noopener noreferrer"' : ""
      }>${esc(labels[key] ?? key)}</a></li>`;
    })
    .join("");
}

function cardMarkup(project, index) {
  const num = String(index + 1).padStart(2, "0");
  const visual = project.image
    ? `<img class="card__thumb" src="${esc(project.image)}" alt="" loading="lazy" decoding="async" width="600" height="340" />`
    : `<div class="card__sigil" style="--sigil-angle:${(index * 37) % 180}deg" aria-hidden="true"></div>`;

  return `
    <button class="card${project.featured ? " card--featured" : ""}"
            type="button"
            data-id="${esc(project.id)}"
            aria-haspopup="dialog">
      <span class="card__top">
        <span class="card__num">${num}</span>
        <span>${esc(project.year ?? "")}</span>
      </span>
      <span class="card__title">${esc(project.title)}</span>
      <span class="card__summary">${esc(project.summary ?? "")}</span>
      <ul class="tags">${(project.tags ?? []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      ${visual}
    </button>`;
}

function renderProjects() {
  const all = state.data.projects ?? [];
  const visible =
    state.filter === "*" ? all : all.filter((p) => (p.tags ?? []).includes(state.filter));

  const bento = $("#bento");
  bento.innerHTML = visible.map(cardMarkup).join("");
  bento.setAttribute("aria-busy", "false");
  bento.hidden = visible.length === 0;
  $("#empty").hidden = visible.length !== 0;

  bind("visible-count", String(visible.length).padStart(2, "0"));
  bind("count-projects", String(all.length).padStart(2, "0"));
}

function renderFilters() {
  const all = state.data.projects ?? [];
  const counts = new Map();
  all.forEach((p) => (p.tags ?? []).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));

  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  bind("count-tags", String(tags.length).padStart(2, "0"));

  $("#filters").innerHTML = [["*", all.length], ...tags]
    .map(
      ([tag, count]) => `
        <button class="chip" type="button" data-tag="${esc(tag)}"
                aria-pressed="${tag === state.filter}">
          ${tag === "*" ? "All" : esc(tag)}<span class="chip__count">${count}</span>
        </button>`,
    )
    .join("");
}

function render(data, { announce = false } = {}) {
  state.data = data;
  renderProfile(data.profile ?? {}, data.version);
  renderFilters();
  renderProjects();
  if (announce) toast("Content updated");
}

function renderError() {
  $("#bento").innerHTML = "";
  $("#bento").setAttribute("aria-busy", "false");
  const empty = $("#empty");
  empty.hidden = false;
  empty.textContent = "Could not load the project list. Please refresh.";
}

/* ── Project sheet ────────────────────────────────────────── */
const sheet = $("#sheet");

function openSheet(id, sourceCard) {
  const project = (state.data?.projects ?? []).find((p) => p.id === id);
  if (!project) return;

  $("#sheet-year").textContent = project.year ?? "";
  $("#sheet-role").textContent = project.role ?? "";
  $("#sheet-title").textContent = project.title;
  $("#sheet-description").textContent = project.description ?? project.summary ?? "";

  const highlights = project.highlights ?? [];
  $("#sheet-highlights-label").hidden = highlights.length === 0;
  $("#sheet-highlights").innerHTML = highlights.map((h) => `<li>${esc(h)}</li>`).join("");

  $("#sheet-tags").innerHTML = (project.tags ?? [])
    .map((t) => `<li>${esc(t)}</li>`)
    .join("");

  const links = project.links ?? {};
  const actions = [];
  if (links.demo)
    actions.push(
      `<a class="btn btn--solid" href="${esc(links.demo)}" target="_blank" rel="noopener noreferrer">Live demo ↗</a>`,
    );
  if (links.repo)
    actions.push(
      `<a class="btn" href="${esc(links.repo)}" target="_blank" rel="noopener noreferrer">Source ↗</a>`,
    );
  $("#sheet-actions").innerHTML = actions.join("");

  const show = () => sheet.showModal();

  // The card morphs into the sheet where the browser supports it.
  if (document.startViewTransition && sourceCard && !prefersReducedMotion()) {
    sourceCard.style.viewTransitionName = "sheet";
    sheet.style.viewTransitionName = "sheet";
    const transition = document.startViewTransition(show);
    transition.finished.finally(() => {
      sourceCard.style.viewTransitionName = "";
      sheet.style.viewTransitionName = "";
    });
  } else {
    show();
  }
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Toast ────────────────────────────────────────────────── */
let toastTimer;
function toast(message) {
  const el = $("#toast");
  $("#toast-text").textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 3200);
}

/* ── Data: cache first, then revalidate ──────────────────── */
function readCache() {
  try {
    return localStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

async function loadData() {
  const cached = readCache();
  let painted = false;

  if (cached) {
    try {
      render(JSON.parse(cached));
      painted = true;
    } catch {
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {}
    }
  }

  try {
    // no-cache: always ask, but a 304 still costs almost nothing.
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();

    if (text === cached) return; // Already showing the current revision.

    const data = JSON.parse(text);
    render(data, { announce: painted });
    try {
      localStorage.setItem(CACHE_KEY, text);
    } catch {}
  } catch (error) {
    if (!painted) renderError();
    console.warn("[portfolio] revalidation failed:", error);
  }
}

/* ── Service worker: keep the shell fresh ────────────────── */
function initServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // A controller already exists → any swap is a genuine update, not first install.
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) return;
    reloading = true;
    location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("sw.js");
      registration.update();
    } catch (error) {
      console.warn("[portfolio] service worker registration failed:", error);
    }
  });
}

/* ── Wiring ───────────────────────────────────────────────── */
function initEvents() {
  $("#filters").addEventListener("click", (event) => {
    const chip = event.target.closest(".chip");
    if (!chip) return;
    state.filter = chip.dataset.tag;
    $$("#filters .chip").forEach((c) =>
      c.setAttribute("aria-pressed", String(c === chip)),
    );
    renderProjects();
  });

  $("#bento").addEventListener("click", (event) => {
    const card = event.target.closest(".card");
    if (card?.dataset.id) openSheet(card.dataset.id, card);
  });

  $("#empty").addEventListener("click", (event) => {
    if (!event.target.closest("[data-clear-filter]")) return;
    state.filter = "*";
    renderFilters();
    renderProjects();
  });

  $("#sheet-close").addEventListener("click", () => sheet.close());

  // Click on the backdrop (outside the panel) closes the sheet.
  sheet.addEventListener("click", (event) => {
    if (event.target === sheet) sheet.close();
  });
}

initTheme();
initEvents();
initServiceWorker();
loadData();
