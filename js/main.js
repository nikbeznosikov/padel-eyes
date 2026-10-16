import { PUZZLES } from "./puzzles.js";
import { Stage } from "./scene/stage.js";
import { OPTION_COLORS } from "./scene/markers.js";
import { loadProgress, loadSettings, saveProgress, saveSettings } from "./storage.js";
import { buildTimeline, mirrorPuzzle } from "./timeline.js";

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const home = $("#home");
const play = $("#play");
const prompt = $("#prompt");
const panel = $("#panel");
let settings = loadSettings();
let progress = loadProgress();
let stage = null;

// Puzzles are written for one side; players on the other side see them mirrored.
const puzzleFor = (p) => (p.side === settings.side ? { puzzle: p, mirrored: false } : { puzzle: mirrorPuzzle(p), mirrored: true });

const GROUPS = [
  { id: "rules", title: "Rules", text: "The calls that decide a point." },
  { id: "basics", title: "Basics", text: "Where to stand and what to play in everyday moments." },
  { id: "advanced", title: "Advanced", text: "Choices that depend on where they stand." },
];

/** Swap left and right words for players on the other side of the court. */
const localize = (s, mirrored) => s.replace(/\{(left|right)\}/g, (_, w) => (mirrored ? (w === "left" ? "right" : "left") : w));

// ---------- Home ----------

function renderHome() {
  const solved = PUZZLES.filter((p) => progress.solved[p.id]).length;
  $("#solved-count").textContent = `${solved} of ${PUZZLES.length} solved`;
  $("#start").textContent = solved === 0 ? "Start" : "Continue";
  for (const input of document.querySelectorAll("input[name=side]")) input.checked = input.value === settings.side;
  for (const input of document.querySelectorAll("input[name=hand]")) input.checked = input.value === settings.hand;
  for (const dot of document.querySelectorAll("[data-court-side]")) {
    const on = dot.dataset.courtSide === settings.side;
    dot.setAttribute("aria-pressed", String(on));
    dot.classList.toggle("on", on);
  }
  const row = (p) => {
    const done = progress.solved[p.id];
    const status = done ? (done.firstTry ? "Solved" : "Solved, 2nd try") : "New";
    return `<li><button type="button" class="puzzle-row" data-index="${PUZZLES.indexOf(p)}">
      <span class="row-text"><span class="eyebrow">${esc(p.category)}</span><span class="row-title">${esc(p.title)}</span></span>
      <span class="chip ${done ? "chip-done" : ""}">${status}</span>
    </button></li>`;
  };
  $("#puzzle-groups").innerHTML = GROUPS.map((g) => {
    const list = PUZZLES.filter((p) => p.group === g.id);
    const done = list.filter((p) => progress.solved[p.id]).length;
    return `<section class="group" aria-labelledby="group-${g.id}">
      <div class="row-between"><h3 id="group-${g.id}">${g.title}</h3><p class="muted small">${done} of ${list.length}</p></div>
      <p class="muted small group-text">${g.text}</p>
      <ul class="puzzle-list">${list.map(row).join("")}</ul>
    </section>`;
  }).join("");
}

function setSetting(key, value) {
  settings = { ...settings, [key]: value };
  saveSettings(settings);
  renderHome();
}

home.addEventListener("change", (e) => {
  if (e.target.name === "side" || e.target.name === "hand") setSetting(e.target.name, e.target.value);
});
home.addEventListener("click", (e) => {
  const dot = e.target.closest("[data-court-side]");
  if (dot) setSetting("side", dot.dataset.courtSide);
  const row = e.target.closest(".puzzle-row");
  if (row) openPuzzle(Number(row.dataset.index));
});
home.addEventListener("keydown", (e) => {
  const dot = e.target.closest("[data-court-side]");
  if (dot && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    setSetting("side", dot.dataset.courtSide);
  }
});
$("#start").addEventListener("click", () => {
  const i = PUZZLES.findIndex((p) => !progress.solved[p.id]);
  openPuzzle(Math.max(0, i));
});

// ---------- Puzzle ----------

let view = null;

async function openPuzzle(index) {
  const { puzzle, mirrored } = puzzleFor(PUZZLES[index]);
  home.hidden = true;
  play.hidden = false;
  if (!stage) stage = new Stage($("#stage"), { onPick: (id) => pick(id) });
  stage.resize();
  if (stage.assets === null) {
    prompt.hidden = true;
    panel.innerHTML = `<div class="pill"><p class="muted">Loading players…</p></div>`;
    await stage.assetsReady;
  }
  const questionTl = buildTimeline(puzzle, null, settings.hand);
  view = { index, puzzle, mirrored, questionTl, chosenTl: null, phase: "intro", picked: null, tries: 0 };
  $("#play-category").textContent = puzzle.category;
  $("#play-title").textContent = puzzle.title;
  $("#play-count").textContent = `${index + 1}/${PUZZLES.length}`;
  $("#play-count").setAttribute("aria-label", `Puzzle ${index + 1} of ${PUZZLES.length}`);
  stage.setMode("eyes");
  stage.show(questionTl, buildPreviews(puzzle, settings.hand, questionTl), { turnAround: !!puzzle.turnAround });
  stage.setMarkers(false);
  render();
  stage.play(0, questionTl.freezeT, {
    slowLead: puzzle.decision ? 0.7 : 0,
    onStop: () => {
      view.phase = "question";
      stage.setMarkers(true);
      render();
    },
  });
}

function pick(id) {
  if (!view || view.phase !== "question") return;
  const option = view.puzzle.options.find((o) => o.id === id);
  const firstTry = view.tries === 0;
  view.tries += 1;
  view.picked = option;
  if (option.correct && !progress.solved[view.puzzle.id]) {
    progress = { solved: { ...progress.solved, [view.puzzle.id]: { firstTry } } };
    saveProgress(progress);
  }
  if (!view.puzzle.decision) {
    view.phase = "result";
    view.chosenTl = view.questionTl;
    render();
    return;
  }
  view.phase = "playing";
  view.chosenTl = buildTimeline(view.puzzle, option, settings.hand);
  stage.show(view.chosenTl, null, { turnAround: !!view.puzzle.turnAround });
  stage.setMarkers(true, id);
  render();
  // Carry on from the exact frame you stopped at, even if this answer hits the ball earlier.
  stage.play(Math.min(view.questionTl.freezeT, view.chosenTl.freezeT), view.chosenTl.duration, {
    onStop: () => {
      view.phase = "result";
      stage.setMarkers(false);
      render();
    },
  });
}

function replay(mode) {
  stage.setMode(mode);
  const tl = view.chosenTl ?? view.questionTl;
  stage.play(0, tl.duration);
  render();
}

function tryAgain() {
  view.picked = null;
  view.phase = "question";
  stage.setMode("eyes");
  stage.show(view.questionTl, null, { turnAround: !!view.puzzle.turnAround });
  stage.clock.t = view.questionTl.freezeT;
  stage.clock.playing = false;
  stage.setMarkers(true);
  render();
}

function next() {
  openPuzzle((view.index + 1) % PUZZLES.length);
}

function exitPuzzle() {
  stage.clock.playing = false;
  view = null;
  play.hidden = true;
  home.hidden = false;
  renderHome();
}

$("#back").addEventListener("click", exitPuzzle);

panel.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-action]");
  if (!b) return;
  const a = b.dataset.action;
  if (a === "skip") stage.skip();
  else if (a === "pick") pick(b.dataset.id);
  else if (a === "replay") replay("eyes");
  else if (a === "view") replay(stage.mode === "overview" ? "eyes" : "overview");
  else if (a === "again") tryAgain();
  else if (a === "next") next();
});

// Keep the 3D view centred in the space the question card and the bottom panel leave free.
const fitView = () => stage?.setInsets(prompt.hidden ? 0 : prompt.offsetTop + prompt.offsetHeight, panel.offsetHeight);
const panels = new ResizeObserver(fitView);
panels.observe(prompt);
panels.observe(panel);

function render() {
  const { puzzle, phase, picked, mirrored } = view;
  const text = (s) => esc(localize(s, mirrored));
  if (phase === "intro") {
    prompt.hidden = true;
    panel.innerHTML = `<div class="pill"><p class="muted">Watch the play…</p>
      <button type="button" class="btn btn-soft" data-action="skip">Skip</button></div>`;
    fitView();
    return;
  }
  if (phase === "question" || phase === "playing") {
    const onCourt = puzzle.options.some((o) => o.marker?.kind === "target");
    prompt.hidden = false;
    prompt.innerHTML = `<h2 class="question">${text(puzzle.question)}</h2>
      ${phase === "question" ? `<p class="hint">${onCourt ? "The letters on the court show where each shot goes. " : ""}Drag to look around.</p>` : ""}`;
    panel.innerHTML = `<ul class="options">${puzzle.options
      .map((o) => {
        const chosen = picked?.id === o.id;
        return `<li><button type="button" class="option ${chosen ? "chosen" : ""} ${phase === "playing" && !chosen ? "faded" : ""}"
          data-action="pick" data-id="${o.id}" ${phase !== "question" ? "disabled" : ""}>
          <span class="letter" style="background:${OPTION_COLORS[o.id]}">${o.id}</span><span>${text(o.label)}</span></button></li>`;
      })
      .join("")}</ul>`;
    fitView();
    return;
  }
  const correct = puzzle.options.find((o) => o.correct);
  const sourced = puzzle.sources.length > 0;
  prompt.hidden = false;
  prompt.innerHTML = `<p class="verdict ${picked.correct ? "good" : "bad"}">${picked.correct ? "Right call" : "Not the best choice"}</p>
    <p class="result-line">${text(picked.result)}</p>
    <p class="lesson">${text(picked.correct ? puzzle.lesson : puzzle.wrong[picked.id])}</p>`;
  panel.innerHTML = `<div class="result">
    <div class="actions">
      ${!picked.correct ? `<button type="button" class="btn btn-light" data-action="again">Try again</button>` : ""}
      <button type="button" class="btn btn-soft" data-action="replay">Watch again</button>
      <button type="button" class="btn btn-soft" data-action="view">${stage.mode === "overview" ? "Your eyes" : "From behind"}</button>
      <button type="button" class="btn ${picked.correct ? "btn-go" : "btn-soft"} push" data-action="next">Next</button>
    </div>
    <details class="sources">
      <summary>${picked.correct ? `Why${sourced ? ", and sources" : ""}` : `Show the answer (${correct.id})${sourced ? ", and sources" : ""}`}</summary>
      ${!picked.correct ? `<p class="body"><strong>${correct.id}: ${text(correct.label)}.</strong> ${text(puzzle.lesson)}</p>` : ""}
      <p class="body">${text(puzzle.explanation)}</p>
      ${sourced ? `<ul>${puzzle.sources
        .map(
          (s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>
          <span class="lang">(${esc(s.lang)})</span>
          <p class="source-text">${s.kind === "quote" ? `<q>${esc(s.text)}</q>` : `Says: ${esc(s.text)}`}</p></li>`,
        )
        .join("")}</ul>` : ""}
    </details>
  </div>`;
}

/** The flight of your shot for each option, from your racket to where it lands. */
function buildPreviews(puzzle, hand, questionTl) {
  return puzzle.options.map((option) => {
    if (!puzzle.decision || !("by" in puzzle.decision) || option.marker?.kind !== "target") return { option, arc: [] };
    const tl = buildTimeline(puzzle, { ...option, shots: option.shots.slice(0, 1), moves: [] }, hand);
    const hit = tl.events.find((e) => e.kind === "hit" && e.t > questionTl.freezeT - 1e-3);
    if (!hit) return { option, arc: [] };
    const after = tl.events.find((e) => e.t > hit.t + 1e-3 && ["bounce", "glass", "mesh", "net"].includes(e.kind));
    const end = after ? after.t : tl.duration;
    const arc = tl.ball.filter((b) => b.t >= hit.t && b.t <= end).filter((_, i) => i % 4 === 0).map((b) => b.p);
    return { option, arc };
  });
}

renderHome();
