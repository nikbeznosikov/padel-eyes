import { findHitIndex, planOwnWallShot, planShot, planWallShot, simulate, truncatePath } from "./physics.js";
const PLAYER_IDS = ["you", "partner", "opp1", "opp2"];
const RUN_SPEED = 4.5;
const CONTACT_HEIGHT = {
  drive: 0.9,
  lob: 0.75,
  volley: 1.15,
  overhead: 2.55,
  serve: 0.8,
};
// The scene stops while the incoming ball is still this far from your racket, after its bounce,
// so you see it bounce and come up in front of you.
const FREEZE_DISTANCE = 1.8;
// Extra time shown after the last meaningful ball event.
const TAIL = 0.9;
/** Mirror a puzzle written for one side so it plays from the other side. */
export function mirrorPuzzle(p) {
  const mx = (o) => ({ ...o, x: -o.x });
  const shot = (s) => ({
    ...s,
    from: s.from ? mx(s.from) : undefined,
    to: mx(s.to),
    ownWall: s.ownWall ? mx(s.ownWall) : undefined,
    velocity: s.velocity ? mx(s.velocity) : undefined,
  });
  return {
    ...p,
    side: p.side === "right" ? "left" : "right",
    players: {
      you: mx(p.players.you),
      partner: mx(p.players.partner),
      opp1: mx(p.players.opp1),
      opp2: mx(p.players.opp2),
    },
    intro: p.intro.map(shot),
    introMoves: p.introMoves?.map((m) => ({ ...m, to: mx(m.to) })),
    options: p.options.map((o) => ({
      ...o,
      marker: o.marker ? mx(o.marker) : undefined,
      shots: o.shots.map(shot),
      moves: o.moves?.map((m) => ({ ...m, to: mx(m.to) })),
    })),
  };
}
export function posAt(track, t) {
  const k = track.keys;
  if (t <= k[0].t)
    return { x: k[0].x, z: k[0].z, speed: 0 };
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i].t) {
      const a = k[i - 1];
      const b = k[i];
      const span = Math.max(1e-6, b.t - a.t);
      const u = (t - a.t) / span;
      const e = u * u * (3 - 2 * u);
      const dist = Math.hypot(b.x - a.x, b.z - a.z);
      const speed = (dist / span) * 6 * u * (1 - u);
      return { x: a.x + (b.x - a.x) * e, z: a.z + (b.z - a.z) * e, speed };
    }
  }
  const last = k[k.length - 1];
  return { x: last.x, z: last.z, speed: 0 };
}
function moveTo(track, start, to, arrive, speed = RUN_SPEED) {
  const from = posAt(track, start);
  track.keys = track.keys.filter((k) => k.t < start);
  track.keys.push({ t: start, x: from.x, z: from.z });
  const dist = Math.hypot(to.x - from.x, to.z - from.z);
  const end = arrive ?? start + Math.max(0.15, dist / speed);
  track.keys.push({ t: Math.max(start + 0.05, end), x: to.x, z: to.z });
}
export function ballAt(tl, t) {
  const b = tl.ball;
  if (t <= b[0].t)
    return b[0].p;
  if (t >= b[b.length - 1].t)
    return b[b.length - 1].p;
  let lo = 0;
  let hi = b.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (b[mid].t <= t)
      lo = mid;
    else
      hi = mid;
  }
  const a = b[lo];
  const c = b[hi];
  const u = (t - a.t) / Math.max(1e-6, c.t - a.t);
  return { x: a.p.x + (c.p.x - a.p.x) * u, y: a.p.y + (c.p.y - a.p.y) * u, z: a.p.z + (c.p.z - a.p.z) * u };
}
/**
* Build the full rally: the intro shots, then either a stop at the decision
* point (no choice yet) or the chosen option played to the end.
*/
export function buildTimeline(puzzle, choice, hand) {
  const players = {};
  for (const id of PLAYER_IDS) {
    const s = puzzle.players[id];
    const mine = id === "you" || id === "partner";
    players[id] = {
      keys: [{ t: 0, x: s.x, z: s.z }],
      swings: [],
      facing: mine ? 1 : -1,
      handSign: id === "you" && hand === "left" ? -1 : 1,
    };
  }
  const tl = { ball: [], events: [], players, tags: [], duration: 0, freezeT: 0 };
  const steps = [...puzzle.intro];
  const hitDecision = puzzle.decision && "by" in puzzle.decision ? puzzle.decision : null;
  if (hitDecision) {
    if (choice) {
      steps.push(...choice.shots.map((s, i) => (i === 0 ? { ...s, when: s.when ?? hitDecision.when } : s)));
    }
    else {
      steps.push({ by: hitDecision.by, when: hitDecision.when, to: { x: 0, z: 0 }, stroke: "drive", phantom: true });
    }
  }
  else if (choice) {
    steps.push(...choice.shots);
  }
  // Intro moves start at a fixed time; option moves start relative to the decision.
  let decisionT = puzzle.decision && "at" in puzzle.decision ? puzzle.decision.at : null;
  const moves = [
    ...(puzzle.introMoves ?? []).map((m) => ({ ...m, fixed: true })),
    ...(choice?.moves ?? []).map((m) => ({ ...m, fixed: false })),
  ];
  const applyMoves = (until) => {
    const ready = moves
      .map((m) => ({ m, start: m.fixed ? m.at : decisionT === null ? null : decisionT + m.at }))
      .filter((x) => x.start !== null && x.start <= until)
      .sort((a, b) => a.start - b.start);
    for (const { m, start } of ready) {
      moveTo(players[m.who], start, m.to, undefined, m.speed);
      moves.splice(moves.indexOf(m), 1);
    }
  };
  let t = 0;
  let from = null;
  const pushSamples = (samples, offset) => {
    for (const s of samples) {
      const at = offset + s.t;
      if (tl.ball.length && at <= tl.ball[tl.ball.length - 1].t)
        continue;
      tl.ball.push({ t: at, p: s.p });
    }
  };
  for (let i = 0; i < steps.length; i++) {
    const shot = steps[i];
    if (shot.phantom)
      break;
    const hitter = players[shot.by];
    if (i === 0) {
      const at = shot.from ?? { ...posAt(hitter, 0), y: CONTACT_HEIGHT[shot.stroke] };
      from = { x: at.x, y: at.y, z: at.z };
      hitter.swings.push({ t: 0, style: shot.stroke, side: sideFor(hitter, from) });
    }
    const launch = shot.apex !== undefined
      ? { from: from, to: shot.to, apex: shot.apex }
      : { from: from, to: shot.to, speed: shot.speed ?? 18 };
    const simOpts = { stopAtNet: !shot.passNet, maxTime: 7 };
    // A fixed launch velocity (found offline) is used where aiming by target is not enough.
    const path = shot.velocity
      ? simulate(from, shot.velocity, simOpts)
      : shot.ownWall
      ? planOwnWallShot(from, shot.ownWall, shot.to, simOpts)
      : shot.wallHeight !== undefined
      ? planWallShot(from, shot.to, shot.wallHeight, shot.apex ?? 5, simOpts)
      : planShot(launch, simOpts);
    const next = steps[i + 1];
    if (!next) {
      const cut = rallyEnd(path.events, path.duration);
      const done = truncatePath(path, Math.max(0, path.samples.findIndex((s) => s.t >= cut)));
      pushSamples(done.samples, t);
      done.events.forEach((e) => tl.events.push({ ...e, t: e.t + t }));
      addTag(tl, shot, done.samples, t);
      applyMoves(t + done.duration);
      t += done.duration;
      break;
    }
    const nextHitter = players[next.by];
    const approxHit = t + path.duration * 0.5;
    // Only moves that started before this shot was struck; later ones go in after the hit is placed.
    applyMoves(t);
    const when = next.when ?? { kind: "cross" };
    const resolved = when.kind === "cross" && when.z === undefined
      ? { kind: "cross", z: posAt(nextHitter, approxHit).z }
      : when;
    const idx = findHitIndex(path, resolved);
    if (idx < 0) {
      // Never playable: the rally ends with this ball.
      pushSamples(path.samples, t);
      path.events.forEach((e) => tl.events.push({ ...e, t: e.t + t }));
      t += path.duration;
      break;
    }
    const cut = truncatePath(path, idx);
    pushSamples(cut.samples, t);
    cut.events.forEach((e) => tl.events.push({ ...e, t: e.t + t }));
    addTag(tl, shot, cut.samples, t);
    const tHit = t + cut.duration;
    const contact = cut.samples[cut.samples.length - 1].p;
    const side = sideFor(nextHitter, contact);
    const style = next.stroke === "volley" && contact.y > 1.9 ? "overhead" : next.stroke;
    const body = bodyFor(nextHitter, contact, side, style);
    const lastKey = nextHitter.keys[nextHitter.keys.length - 1].t;
    const dist = Math.hypot(body.x - posAt(nextHitter, lastKey).x, body.z - posAt(nextHitter, lastKey).z);
    const start = Math.max(lastKey, tHit - dist / RUN_SPEED - 0.15);
    moveTo(nextHitter, start, body, Math.max(start + 0.05, tHit - 0.04));
    nextHitter.swings.push({ t: tHit, style, side });
    tl.events.push({ t: tHit, kind: "hit", p: contact });
    if (next.phantom || (decisionT === null && hitDecision && i + 1 === puzzle.intro.length)) {
      decisionT = tHit;
      tl.freezeT = freezeTime(cut, t, contact);
      if (next.phantom) {
        t = tHit;
        break;
      }
    }
    t = tHit;
    from = contact;
  }
  applyMoves(Infinity);
  const lastPlayerKey = Math.max(...PLAYER_IDS.map((id) => players[id].keys[players[id].keys.length - 1].t));
  tl.duration = Math.max(t, lastPlayerKey) + (choice || !hitDecision ? 0.4 : 0);
  if (!puzzle.decision)
    tl.freezeT = tl.duration;
  else if ("at" in puzzle.decision)
    tl.freezeT = puzzle.decision.at;
  for (const tag of puzzle.introTags ?? []) addEventTag(tl, tag, 0);
  for (const tag of choice?.eventTags ?? []) addEventTag(tl, tag, decisionT ?? 0);
  return tl;
}
/** Label the nth ball event of a kind (default the first) after a given time. */
function addEventTag(tl, tag, after) {
  const e = tl.events.filter((x) => x.kind === tag.kind && x.t >= after)[(tag.nth ?? 1) - 1];
  if (e)
    tl.tags.push({ t0: e.t, t1: e.t + 1.4, text: tag.text, p: { ...e.p, y: Math.max(e.p.y, 0.3) } });
}
function sideFor(track, ball) {
  const here = track.keys[track.keys.length - 1];
  // Positive when the ball is on the player's racket-hand side.
  const lateral = (ball.x - here.x) * track.facing * track.handSign;
  return lateral >= -0.1 ? "fore" : "back";
}
function bodyFor(track, ball, side, style) {
  const reach = style === "overhead" || style === "serve" ? 0.25 : style === "volley" ? 0.45 : 0.6;
  const s = side === "fore" ? 1 : -1;
  const x = ball.x - reach * s * track.facing * track.handSign;
  // Stand slightly behind the contact point, towards your own back wall.
  // Meet the ball in front of the body, never level with your feet.
  const z = ball.z - track.facing * (style === "overhead" ? 0.35 : 0.4);
  return { x: Math.max(-4.6, Math.min(4.6, x)), z: Math.max(-9.6, Math.min(9.6, z)) };
}
/** The rally is over at the second bounce or when the net stops the ball, whichever comes first. */
function rallyEnd(events, duration) {
  const bounces = events.filter((e) => e.kind === "bounce");
  const net = events.find((e) => e.kind === "net");
  const ends = [duration];
  if (net)
    ends.push(net.t + TAIL);
  if (bounces.length >= 2)
    ends.push(bounces[1].t + TAIL);
  return Math.min(...ends);
}
function addTag(tl, shot, samples, offset) {
  if (!shot.tag || samples.length < 2)
    return;
  let top = samples[0];
  for (const s of samples)
    if (s.p.y > top.p.y)
      top = s;
  tl.tags.push({ t0: offset, t1: offset + samples[samples.length - 1].t, text: shot.tag, p: top.p });
}

function freezeTime(cut, offset, contact) {
  const s = cut.samples;
  const end = s[s.length - 1].t;
  let ft = end;
  for (let i = s.length - 1; i >= 0; i--) {
    const p = s[i].p;
    if (Math.hypot(p.x - contact.x, p.y - contact.y, p.z - contact.z) >= FREEZE_DISTANCE) {
      ft = s[i].t;
      break;
    }
  }
  const bounce = cut.events.filter((e) => e.kind === "bounce").pop();
  if (bounce) ft = Math.max(ft, Math.min(bounce.t + 0.1, end - 0.12));
  return offset + ft;
}
