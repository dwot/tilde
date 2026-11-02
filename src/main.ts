import "@xterm/xterm/css/xterm.css";
import "./tokens.css";
import "./style.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { marked } from "marked";
import { chapters, isUnlocked, KIND_LABELS, levelById, levels, type Level } from "./levels";
import { loadState, saveState, starsFor, type Attempt } from "./storage";
import { Machine } from "./vm";
import { check, loadLevel, resize, type CheckResult } from "./game";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const md = (s: string) => marked.parse(s, { async: false });
const starText = (n: number) => "★".repeat(n) + "☆".repeat(3 - n);

const state = loadState();
const starsOf = (id: string) => state.stars[id] ?? 0;

// ---------- Views ----------

type View = "map" | "level" | "sheet";

function showView(v: View) {
  for (const name of ["map", "level", "sheet"]) $(`${name}-view`).classList.toggle("hidden", name !== v);
  $("nav-sheet").classList.toggle("active", v === "sheet");
  updateStarTotal();
}

function updateStarTotal() {
  const total = Object.values(state.stars).reduce((a, b) => a + b, 0);
  $("star-total").innerHTML = `★ ${total} <span class="muted">/ ${levels.length * 3}</span>`;
}

/** Cheat sheet entry added by the last first-time solve, highlighted on the next visit. */
let freshEntry: string | undefined;

// ---------- Terminal and machine ----------

const term = new Terminal({
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: 14,
  cursorBlink: true,
  theme: { background: "#1a1a1c", foreground: "#e8e8ea", cursor: "#e8e8ea" },
});
const fit = new FitAddon();
term.loadAddon(fit);
term.open($("terminal"));

/** The spinner over the terminal, while Linux downloads and starts, and while a level is set up. */
function overlay(text: string | null) {
  $("overlay").hidden = text === null;
  if (text !== null) $("overlay-text").textContent = text;
}

const mb = (n: number) => (n / 1048576).toFixed(1);
const vm = new Machine(
  (bytes) => term.write(bytes),
  ({ file, loaded, total, failed }) => {
    if (failed) overlay("Couldn't download Linux. Reload the page to try again.");
    // The snapshot is the one big download; the rest are small files fetched as they're needed.
    else if (file.includes("state")) overlay(total ? `Downloading Linux… ${mb(loaded)} / ${mb(total)} MB` : "Downloading Linux…");
  },
);
term.onData((d) => vm.type(d));

let resizeTimer = 0;
term.onResize(({ cols, rows }) => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => resize(vm, cols, rows), 150);
});
new ResizeObserver(() => {
  if (!$("level-view").classList.contains("hidden")) fit.fit();
}).observe($("terminal"));

let started = false;
vm.started.then(() => {
  started = true;
  overlay("Starting Linux…");
  if (current && !$("level-view").classList.contains("hidden")) prepare(current);
});

// ---------- Map ----------

function showMap() {
  showView("map");
  $("meta").textContent = `A ${chapters.length * 5}-level course in the shell`;

  const next = levels.find((l) => !starsOf(l.id) && isUnlocked(l, starsOf));
  const hero = next
    ? `<a class="continue" href="#/level/${next.id}">
         <span class="muted">${starsOf(levels[0].id) ? "Continue" : "Start"}</span>
         <b>${next.chapter}-${next.order} · ${esc(next.title)}</b>
       </a>`
    : `<div class="continue"><b>All written levels solved.</b><span class="muted">Go back for missing stars ★</span></div>`;

  const sections = chapters.map((ch) => {
    const inChapter = levels.filter((l) => l.chapter === ch.n);
    const earned = inChapter.reduce((sum, l) => sum + starsOf(l.id), 0);
    const nodes = inChapter.length
      ? inChapter
          .map((l) => {
            const open = isUnlocked(l, starsOf);
            const stars = starsOf(l.id);
            const cls = ["node", l.kind, stars ? "done" : open ? "open" : "locked", l === next ? "next" : ""].join(" ");
            const inner = `
              <span class="node-kind">${KIND_LABELS[l.kind]}</span>
              <span class="node-title">${esc(l.title)}</span>
              ${open ? `<span class="stars">${starText(stars)}</span>` : '<span class="lock">locked</span>'}`;
            return open
              ? `<li><a class="${cls}" href="#/level/${l.id}">${inner}</a></li>`
              : `<li><div class="${cls}">${inner}</div></li>`;
          })
          .join("")
      : '<li class="soon">Coming soon</li>';
    return `
      <section class="chapter ${inChapter.length ? "" : "unwritten"}">
        <div class="chapter-head">
          <span class="chapter-n">Chapter ${ch.n}</span>
          <h2>${esc(ch.title)}</h2>
          ${inChapter.length ? `<span class="chapter-stars">★ ${earned} / ${inChapter.length * 3}</span>` : ""}
          <p>${esc(ch.blurb)}</p>
        </div>
        <ol class="nodes">${nodes}</ol>
      </section>`;
  });

  $("map-view").innerHTML = hero + sections.join("") + `<p class="legal">Also from plaintext.guru: <a href="https://backtick.plaintext.guru">Backtick</a>, for Markdown, and <a href="https://caret.plaintext.guru">Caret</a>, for regular expressions</p><p class="legal"><a href="https://github.com/dwot/tilde">Source on GitHub</a> · <a href="third-party.txt">Licences</a> · Visits are counted with Cloudflare Web Analytics</p>`;
  window.scrollTo(0, 0);
}

// ---------- Cheat sheet ----------

function showSheet() {
  showView("sheet");
  $("meta").textContent = "Cheat sheet";

  const entries = levels.filter((l) => l.sheet);
  const collected = entries.filter((l) => starsOf(l.id)).length;

  const entry = (l: Level) => {
    if (!starsOf(l.id)) {
      const hint = isUnlocked(l, starsOf)
        ? `<a href="#/level/${l.id}">Play ${l.chapter}-${l.order}</a> to add this.`
        : `Solve ${l.chapter}-${l.order} to add this.`;
      return `<article class="entry locked"><h3>${esc(l.title)}</h3><p>${hint}</p></article>`;
    }
    return `
      <article class="entry ${l.id === freshEntry ? "fresh" : ""}" id="entry-${l.id}">
        <div class="entry-head">
          <h3>${esc(l.title)}</h3>
          <a class="replay" href="#/level/${l.id}">${l.chapter}-${l.order}</a>
        </div>
        <div class="entry-body">${md(l.sheet)}</div>
        ${l.tip ? `<div class="entry-tip">${md(l.tip)}</div>` : ""}
      </article>`;
  };

  const sections = chapters
    .filter((ch) => entries.some((l) => l.chapter === ch.n))
    .map(
      (ch) => `
    <section>
      <div class="chapter-head">
        <span class="chapter-n">Chapter ${ch.n}</span>
        <h2>${esc(ch.title)}</h2>
      </div>
      <div class="entries">${entries.filter((l) => l.chapter === ch.n).map(entry).join("")}</div>
    </section>`,
    );

  $("sheet-view").innerHTML = `
    <div class="sheet-head">
      <h2>Cheat sheet</h2>
      <p class="muted">${collected} of ${entries.length} collected. Each lesson you solve adds its commands here.</p>
      <div class="progress"><span style="width: ${(100 * collected) / entries.length}%"></span></div>
    </div>
    ${sections.join("")}`;

  const fresh = freshEntry && document.getElementById(`entry-${freshEntry}`);
  freshEntry = undefined;
  if (fresh) fresh.scrollIntoView({ block: "center" });
  else window.scrollTo(0, 0);
}

// ---------- Level ----------

let current: Level | undefined;
/** The level whose files are in ~/work right now; coming back to it from the map keeps your shell as it was. */
let loaded: Level | undefined;
let busy = false;

function attempt(level: Level): Attempt {
  return (state.attempts[level.id] ??= { help: 0, step: 0 });
}

/** The help panel: what's open, and what this attempt can still earn. */
function renderHelp(level: Level) {
  const a = attempt(level);
  const best = starsOf(level.id);
  $("stakes").textContent =
    `Playing for ${starText(starsFor(a.help))}` + (best ? ` · best so far ${starText(best)}` : "");

  const tools = $<HTMLButtonElement>("btn-tools");
  const steps = $<HTMLButtonElement>("btn-steps");
  tools.hidden = a.help >= 1 || !level.tools;
  tools.innerHTML = `Toolbox <span class="cost">${starText(2)}</span>`;
  steps.hidden = a.help >= 2 || level.steps.length === 0;
  steps.innerHTML = `Walk me through it <span class="cost">${starText(1)}</span>`;

  const toolsCard = $("tools");
  toolsCard.hidden = a.help < 1;
  toolsCard.innerHTML = `<h3>Toolbox</h3>${md(level.tools)}`;

  const stepsCard = $("steps");
  stepsCard.hidden = a.help < 2;
  const shown = level.steps.slice(0, Math.max(1, a.step));
  stepsCard.innerHTML =
    `<h3>Walkthrough</h3><ol>${shown.map((s) => `<li>${md(s)}</li>`).join("")}</ol>` +
    (shown.length < level.steps.length ? `<button id="btn-next-step" class="ghost">Next step</button>` : "");
  $("btn-next-step")?.addEventListener("click", () => {
    attempt(level).step = shown.length + 1;
    saveState(state);
    renderHelp(level);
  });
}

function openHelp(stage: 1 | 2) {
  if (!current) return;
  const a = attempt(current);
  if (a.help >= stage) return;
  a.help = stage;
  if (stage === 2) a.step = 1;
  saveState(state);
  renderHelp(current);
}

function setBusy(b: boolean) {
  busy = b;
  $<HTMLButtonElement>("btn-check").disabled = b;
  $<HTMLButtonElement>("btn-reset").disabled = b;
}

function showLevel(level: Level) {
  showView("level");
  fit.fit();
  $("meta").textContent = `Chapter ${level.chapter} · ${KIND_LABELS[level.kind]}`;
  if (level === current) return;
  current = level;
  $("title").textContent = level.title;
  $("goal").innerHTML = md(level.goal);
  $("result").innerHTML = "";
  $("help").hidden = false;
  renderHelp(level);
  if (started) prepare(level);
}

/** Build the level's files and give it a fresh shell, unless they're already there. */
async function prepare(level: Level, force = false) {
  if (level === loaded && !force) {
    if (!busy) term.focus();
    return;
  }
  // Whatever is running (a setup or a check) calls this again for `current` when it's done.
  if (busy) return;
  setBusy(true);
  overlay("Setting up the level…");
  term.reset();
  await loadLevel(vm, level);
  await resize(vm, term.cols, term.rows);
  loaded = level;
  overlay(null);
  setBusy(false);
  // Moved on while this one was loading: set that one up instead.
  if (current && current !== level) return prepare(current);
  term.focus();
}

function renderResult(level: Level, r: CheckResult, stars: number, firstSolve: boolean) {
  const el = $("result");
  if (r.kind === "no-command") {
    el.innerHTML = `<p class="note">Run a command in the terminal first. <strong>Check</strong> reruns the last one you typed on a fresh copy of the files.</p>`;
    return;
  }
  let html = "";
  if (r.kind === "output") {
    const where = r.dir ? ` in <code>~/work/${esc(r.dir)}</code>` : "";
    html += `<p class="checked">Checked <code>${esc(r.command)}</code>${where}</p>`;
    html += `<div class="tiles">${r.tiles.map((t) => `<span class="tile ${t}"></span>`).join("")}${'<span class="tile extra"></span>'.repeat(Math.min(r.extra, 10))}</div>`;
    if (!r.pass && !r.variantFailed) {
      html += `<div class="compare"><div><h3>Wanted</h3><pre>${esc(r.expected.join("\n"))}</pre></div><div><h3>Got</h3><pre>${esc(r.actual.join("\n")) || "<em>nothing</em>"}</pre></div></div>`;
      if (r.extra) html += `<p class="note">${r.extra} more line${r.extra > 1 ? "s" : ""} than wanted.</p>`;
      if (r.stderr) html += `<p class="note">It also complained:</p><pre class="stderr">${esc(r.stderr)}</pre>`;
    }
    if (r.variantFailed) {
      html += `<p class="note">Right answer for these files, but on a second set of files your command printed something else. Does it work the answer out, or just print it?</p>`;
    }
  } else if (!r.pass) {
    html += `<p class="note">Not yet:</p><pre>${esc(r.problems.join("\n"))}</pre>`;
  }
  if (r.pass) {
    const next = levels[levels.indexOf(level) + 1];
    html += `<p class="solved-msg">Solved <span class="stars">${starText(stars)}</span></p>`;
    if (firstSolve && level.sheet) html += `<p class="sheet-note">New on your <a href="#/sheet">cheat sheet</a>: ${esc(level.title)}</p>`;
    html += `<div class="card debrief"><h3>One way to do it</h3><pre>${esc(level.solution)}</pre>${md(level.debrief)}</div>`;
    html += next
      ? `<p><a class="next" href="#/level/${next.id}">Next: ${esc(next.title)} →</a></p>`
      : `<p><a class="next" href="#/">Back to the map →</a></p>`;
  }
  el.innerHTML = html;
}

$("btn-check").addEventListener("click", async () => {
  const level = current;
  if (busy || !level) return;
  setBusy(true);
  $("result").innerHTML = `<p class="note">Checking…</p>`;
  const r = await check(vm, level);
  let stars = 0;
  let firstSolve = false;
  if ("pass" in r && r.pass) {
    stars = starsFor(attempt(level).help);
    firstSolve = !starsOf(level.id);
    if (firstSolve && level.sheet) freshEntry = level.id;
    state.stars[level.id] = Math.max(starsOf(level.id), stars);
    delete state.attempts[level.id];
    saveState(state);
    updateStarTotal();
    $("help").hidden = true;
  }
  setBusy(false);
  if (level === current) {
    renderResult(level, r, stars, firstSolve);
    term.focus();
  } else if (current) prepare(current);
});

$("btn-tools").addEventListener("click", () => openHelp(1));
$("btn-steps").addEventListener("click", () => openHelp(2));
// ---------- How to play ----------

const modal = $<HTMLDialogElement>("modal");
modal.querySelector(".close")!.addEventListener("click", () => modal.close());
modal.addEventListener("click", (e) => e.target === modal && modal.close());
modal.addEventListener("close", () => {
  if (!$("level-view").classList.contains("hidden") && !busy) term.focus();
});

function showHelp() {
  $("modal-body").innerHTML = `
    <h2>How to play</h2>
    <p>Each level gives you a goal and a real bash shell. Linux runs in your browser, so nothing you type leaves the page, and you can't break anything: <b>Start over</b> resets the level.</p>
    <p>Work in the terminal, then press <b>Check</b>. If a level asks for output, Check reruns your last command.</p>
    <p>Stars reward working from memory:</p>
    <div class="help-rows">
      <div><span class="stars">${starText(3)}</span> No help</div>
      <div><span class="stars">${starText(2)}</span> You opened the Toolbox</div>
      <div><span class="stars">${starText(1)}</span> You opened the walkthrough</div>
    </div>
    <p>You can replay any level later for more stars. Solved levels add to your cheat sheet.</p>`;
  if (!modal.open) modal.showModal();
  $("modal-body").focus();
}

$("btn-help").addEventListener("click", showHelp);
$("btn-reset").addEventListener("click", () => {
  if (!current) return;
  $("result").innerHTML = "";
  $("help").hidden = false;
  renderHelp(current);
  prepare(current, true);
});

// ---------- Routing ----------

function route() {
  if (location.hash === "#/sheet") return showSheet();
  const m = /^#\/level\/(.+)$/.exec(location.hash);
  const level = m && levelById(m[1]);
  if (level && isUnlocked(level, starsOf)) return showLevel(level);
  if (location.hash && location.hash !== "#/") history.replaceState(null, "", "#/");
  showMap();
}

window.addEventListener("hashchange", route);
route();
if (!Object.keys(state.stars).length && !Object.keys(state.attempts).length) showHelp();
