// Checks every puzzle scene for physical sense. Run: node scripts/check-puzzles.js
import { COURT } from "../js/court.js";
import { PUZZLES } from "../js/puzzles.js";
import { buildTimeline, mirrorPuzzle, posAt } from "../js/timeline.js";

const MAX_SPRINT = 6.5; // m/s, faster than any padel player over a few meters
let problems = 0;

function fail(p, where, msg) {
  problems++;
  console.log(`failed ${p.id} ${where}: ${msg}`);
}

function checkOption(p, o) {
  const where = o ? `option ${o.id}` : "intro";
  for (const hand of ["right", "left"]) {
    const tl = buildTimeline(p, o, hand);
    // Net hits are only allowed when a shot says so or the answer is about the net.
    const shots = [...p.intro, ...(o?.shots ?? [])];
    const net = tl.events.find((e) => e.kind === "net");
    if (net && !shots.some((s) => s.passNet) && !(o && !o.correct && o.result.toLowerCase().includes("net"))) {
      fail(p, where, `ball hits the net at t=${net.t.toFixed(2)}s (x=${net.p.x.toFixed(2)})`);
    }
    for (const b of tl.ball) {
      if (Math.abs(b.p.x) > COURT.halfWidth + 0.01 || Math.abs(b.p.z) > COURT.halfLength + 0.01) {
        fail(p, where, `ball leaves the court at t=${b.t.toFixed(2)}s`);
        break;
      }
    }
    for (const id of ["you", "partner", "opp1", "opp2"]) {
      const keys = tl.players[id].keys;
      for (let i = 1; i < keys.length; i++) {
        const d = Math.hypot(keys[i].x - keys[i - 1].x, keys[i].z - keys[i - 1].z);
        const dt = keys[i].t - keys[i - 1].t;
        if (d > 0.3 && d / dt > MAX_SPRINT) fail(p, where, `${id} would need ${(d / dt).toFixed(1)} m/s to cover ${d.toFixed(1)} m (hand ${hand})`);
      }
      const end = posAt(tl.players[id], tl.duration);
      if (Math.abs(end.x) > COURT.halfWidth || Math.abs(end.z) > COURT.halfLength) fail(p, where, `${id} ends outside the court`);
    }
    // From your own eyes: the incoming ball must be met in front of you, between knee and chest height.
    if (p.decision && "by" in p.decision && p.decision.by === "you" && (!o || o.correct)) {
      const hit = tl.events.find((e) => e.kind === "hit" && e.t > tl.freezeT);
      if (hit && (hit.p.y < 0.6 || hit.p.y > 1.5)) fail(p, where, `you meet the ball at ${hit.p.y.toFixed(2)} m, outside knee to chest height`);
    }
  }
}

for (const base of PUZZLES) {
  for (const p of [base, mirrorPuzzle(base)]) {
    const correct = p.options.filter((o) => o.correct).length;
    if (correct !== 1) fail(p, "options", `${correct} correct options, expected 1`);
    if (p.options.length !== 3) fail(p, "options", `${p.options.length} options, expected 3`);
    checkOption(p, null);
    for (const o of p.options) checkOption(p, o);
  }
  if (base.sources.length < (base.category === "Rules" ? 1 : 2)) fail(base, "sources", `${base.sources.length} sources`);
}

console.log(problems ? `${problems} problems` : `all ${PUZZLES.length} puzzles passed`);
process.exit(problems ? 1 : 0);
