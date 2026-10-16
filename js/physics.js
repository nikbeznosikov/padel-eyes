import { COURT, isDoorOpening, netHeightAt, sideGlassHeightAt, sideTopAt } from "./court.js";
const G = 9.81;
const R = COURT.ball.radius;
const DT = 1 / 240;
// Floor rebound from the FIP ball spec (135 to 145 cm bounce from 2.54 m gives 0.73 to 0.76).
// Glass and mesh values are estimates.
const FLOOR_RESTITUTION = 0.74;
const FLOOR_FRICTION = 0.82;
const GLASS_RESTITUTION = 0.68;
const MESH_RESTITUTION = 0.25;
// Light air drag so long lobs slow down near the end of their flight.
const DRAG = 0.035;
/** Initial velocity that lands the ball at `to` (ignoring drag; drag is small and corrected below). */
export function launchVelocity(shot) {
  const dx = shot.to.x - shot.from.x;
  const dz = shot.to.z - shot.from.z;
  const d = Math.hypot(dx, dz);
  const y0 = shot.from.y;
  let vy;
  let T;
  if ("apex" in shot) {
    const apex = Math.max(shot.apex, y0 + 0.05);
    vy = Math.sqrt(2 * G * (apex - y0));
    T = vy / G + Math.sqrt((2 * (apex - R)) / G);
  }
  else {
    T = d / shot.speed;
    vy = (R - y0 + 0.5 * G * T * T) / T;
  }
  const vh = d / T;
  return { x: (dx / d) * vh, y: vy, z: (dz / d) * vh };
}
/** Simulate flight with floor, net, glass and mesh contacts. */
export function simulate(from, v0, opts = {}) {
  const maxTime = opts.maxTime ?? 6;
  const p = { ...from };
  const v = { ...v0 };
  const samples = [{ t: 0, p: { ...p }, v: { ...v } }];
  const events = [];
  let t = 0;
  let stopped = false;
  while (t < maxTime && !stopped) {
    const speed = Math.hypot(v.x, v.y, v.z);
    v.x -= DRAG * speed * v.x * DT;
    v.y -= (G + DRAG * speed * v.y) * DT;
    v.z -= DRAG * speed * v.z * DT;
    const prevZ = p.z;
    p.x += v.x * DT;
    p.y += v.y * DT;
    p.z += v.z * DT;
    t += DT;
    // Net: a ball just under the tape rolls over it (net cord), anything lower is stopped.
    if (!opts.ignoreNet && Math.sign(prevZ) !== Math.sign(p.z) && prevZ !== 0) {
      const top = netHeightAt(p.x);
      if (p.y - R < top) {
        events.push({ t, kind: "net", p: { ...p } });
        const cord = top - (p.y - R) < 0.06 && opts.stopAtNet === false;
        if (cord) {
          p.y = top + R;
          v.z *= 0.45;
          v.x *= 0.6;
          v.y = Math.abs(v.y) * 0.3 + 0.8;
        }
        else {
          p.z = prevZ;
          v.z *= -0.15;
          v.x *= 0.3;
          if (opts.stopAtNet !== false)
            stopped = true;
        }
      }
    }
    // Floor
    if (p.y < R) {
      p.y = R;
      if (Math.abs(v.y) < 0.6) {
        v.y = 0;
        v.x *= 0.98;
        v.z *= 0.98;
      }
      else {
        v.y = -v.y * FLOOR_RESTITUTION;
        v.x *= FLOOR_FRICTION;
        v.z *= FLOOR_FRICTION;
        events.push({ t, kind: "bounce", p: { ...p } });
      }
    }
    // Back walls: glass to 3 m, mesh above it.
    if (Math.abs(p.z) > COURT.halfLength - R && Math.sign(v.z) === Math.sign(p.z)) {
      p.z = Math.sign(p.z) * (COURT.halfLength - R);
      if (p.y <= COURT.backWall.glassHeight) {
        v.z = -v.z * GLASS_RESTITUTION;
        events.push({ t, kind: "glass", p: { ...p } });
      }
      else if (p.y <= COURT.backWall.meshTop) {
        v.z = -v.z * MESH_RESTITUTION;
        v.x *= 0.6;
        events.push({ t, kind: "mesh", p: { ...p } });
      }
      else {
        // Out of the court over the back wall.
        events.push({ t, kind: "mesh", p: { ...p } });
        stopped = true;
      }
    }
    // Side walls: glass at the ends, mesh in the middle, door openings at the net.
    if (Math.abs(p.x) > COURT.halfWidth - R && Math.sign(v.x) === Math.sign(p.x)) {
      if (isDoorOpening(p.z, p.y)) {
        events.push({ t, kind: "out", p: { ...p } });
        stopped = true;
        samples.push({ t, p: { ...p }, v: { ...v } });
        break;
      }
      p.x = Math.sign(p.x) * (COURT.halfWidth - R);
      const glass = sideGlassHeightAt(p.z);
      if (p.y <= glass) {
        v.x = -v.x * GLASS_RESTITUTION;
        events.push({ t, kind: "glass", p: { ...p } });
      }
      else if (p.y <= sideTopAt(p.z)) {
        v.x = -v.x * MESH_RESTITUTION;
        v.z *= 0.6;
        events.push({ t, kind: "mesh", p: { ...p } });
      }
      else {
        stopped = true;
      }
    }
    samples.push({ t, p: { ...p }, v: { ...v } });
    if (v.y === 0 && Math.hypot(v.x, v.z) < 0.3)
      stopped = true;
  }
  return { samples, events, duration: t };
}
/**
* Launch toward a target with drag: adjust aim (and apex, for lobs) until the
* first bounce lands within 2 cm of the target and the apex matches.
*/
export function planShot(shot, opts = {}) {
  let aim = { ...shot.to };
  let apex = "apex" in shot ? shot.apex : undefined;
  const launch = () => apex !== undefined ? { from: shot.from, to: aim, apex } : { from: shot.from, to: aim, speed: shot.speed };
  for (let i = 0; i < 16; i++) {
    // Plan through the net so a low ball still gives a landing point to correct against.
    const path = simulate(shot.from, launchVelocity(launch()), { ...opts, ignoreNet: true });
    const first = path.events.find((e) => e.kind === "bounce");
    if (!first)
      break;
    const ex = shot.to.x - first.p.x;
    const ez = shot.to.z - first.p.z;
    let done = Math.hypot(ex, ez) < 0.02;
    if (apex !== undefined && "apex" in shot) {
      const top = Math.max(...path.samples.filter((s) => s.t <= first.t).map((s) => s.p.y));
      const da = shot.apex - top;
      apex += da;
      done = done && Math.abs(da) < 0.02;
    }
    if (done)
      break;
    aim = { x: aim.x + ex, z: aim.z + ez };
  }
  return simulate(shot.from, launchVelocity(launch()), opts);
}
/**
* Aim a ball that hits the back wall on the full at a given height (no bounce first).
* Works by aiming at a virtual landing point behind the wall and moving it until the wall contact matches.
*/
export function planWallShot(from, to, wallHeight, apex, opts = {}) {
  const dir = Math.sign(to.z - from.z) || 1;
  let land = { x: to.x, z: to.z + dir * 1.5 };
  let apexParam = apex;
  const velocity = () => launchVelocity({ from, to: land, apex: apexParam });
  for (let i = 0; i < 60; i++) {
    const path = simulate(from, velocity(), { ...opts, ignoreNet: true });
    const wall = path.events.find((e) => (e.kind === "glass" || e.kind === "mesh") && Math.abs(e.p.z) > COURT.halfLength - 0.2);
    if (!wall || path.events[0]?.kind === "bounce") {
      land = { ...land, z: land.z + dir * 0.3 };
      continue;
    }
    const top = Math.max(...path.samples.filter((x) => x.t <= wall.t).map((x) => x.p.y));
    const ea = apex - top;
    const ey = wallHeight - wall.p.y;
    const ex = to.x - wall.p.x;
    if (Math.abs(ey) < 0.03 && Math.abs(ex) < 0.05 && Math.abs(ea) < 0.05)
      break;
    apexParam += ea * 0.8;
    land = { x: land.x + ex, z: land.z + dir * ey * 0.6 };
  }
  return simulate(from, velocity(), opts);
}
/** Index of the sample where a player strikes the ball, or -1 if it never becomes playable. */
/**
 * Play the ball into your own back wall so it flies back over the net (FIP Rule 14.1b).
 * Searches the apex so that the first thing the ball touches on the far side (a bounce, or their
 * wall when `to.z` is at their wall) is as close as possible to `to`.
 */
export function planOwnWallShot(from, wall, to, opts = {}) {
  const farWall = Math.abs(to.z) >= COURT.halfLength - 0.1;
  let best = null;
  for (let apex = wall.height + 0.05; apex <= wall.height + 4; apex += 0.05) {
    const path = planWallShot(from, { x: wall.x, z: wall.z }, wall.height, apex, { ...opts, stopAtNet: false });
    const hit = path.events.find((e) => (e.kind === "glass" || e.kind === "mesh") && Math.sign(e.p.z) === Math.sign(wall.z));
    if (!hit) continue;
    const next = path.events.find((e) => e.t > hit.t && Math.sign(e.p.z) === Math.sign(to.z) && (e.kind === "bounce" || e.kind === "glass"));
    if (!next) continue;
    const kindMiss = farWall !== (next.kind === "glass") ? 3 : 0;
    const err = Math.hypot(next.p.x - to.x, next.p.z - to.z) + kindMiss;
    if (!best || err < best.err) best = { err, apex };
  }
  return planWallShot(from, { x: wall.x, z: wall.z }, wall.height, best ? best.apex : wall.height + 1, opts);
}

export function findHitIndex(path, when) {
  const s = path.samples;
  if (when.kind === "cross") {
    const z = when.z ?? 0;
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1].p.z - z;
      const b = s[i].p.z - z;
      if (a === 0 || Math.sign(a) !== Math.sign(b))
        return i;
    }
    return -1;
  }
  const trigger = when.kind === "afterGlass" ? "glass" : "bounce";
  const ev = path.events.find((e) => e.kind === trigger);
  if (!ev)
    return -1;
  const h = when.height ?? 0.95;
  let i = s.findIndex((x) => x.t >= ev.t);
  // Half-volley: take it just after the bounce, on the way up.
  if (when.kind === "onRise") {
    while (i < s.length - 1 && s[i].v.y > 0 && s[i].p.y < h)
      i++;
    return i;
  }
  // Rise to the top after the contact, then take it on the way down at hitting height.
  while (i < s.length - 1 && s[i].v.y > 0)
    i++;
  while (i < s.length - 1 && s[i].p.y > h)
    i++;
  return i;
}
/** Cut a path at a sample index and rebase time so the cut point is the end. */
export function truncatePath(path, index) {
  const samples = path.samples.slice(0, index + 1);
  const end = samples[samples.length - 1]?.t ?? 0;
  return {
    samples,
    events: path.events.filter((e) => e.t <= end),
    duration: end,
  };
}
