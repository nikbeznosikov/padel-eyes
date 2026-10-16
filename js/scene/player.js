import * as THREE from "three";
import { ballAt, posAt } from "../timeline.js";
import { buildRacket } from "./racket.js";

// Body proportions for a ~1.80 m player, in meters.
const HIP_H = 0.94;
const THIGH = 0.44;
const SHIN = 0.44;
const TORSO = 0.52;
const UPPER = 0.29;
const FORE = 0.26;

const READY = { torsoYaw: 0, torsoLean: 0.18, armPitch: -0.55, armAbd: 0, elbow: -1.1, offPitch: -0.5, offElbow: -1.2 };
const NET = { torsoYaw: 0, torsoLean: 0.12, armPitch: -0.75, armAbd: 0, elbow: -1.35, offPitch: -0.6, offElbow: -1.3 };

// Swing keyframes: back-swing, contact, follow-through. `hs` flips them for left-handers.
function swingPoses(style, side, hs) {
  const s = side === "fore" ? 1 : -1;
  if (style === "overhead") {
    return [
      { torsoYaw: -hs * 0.8, torsoLean: -0.2, armPitch: -2.7, armAbd: -hs * 0.5, elbow: -2.2, offPitch: -2.6, offElbow: -0.2 },
      { torsoYaw: hs * 0.1, torsoLean: 0.05, armPitch: -2.9, armAbd: -hs * 0.15, elbow: -0.1, offPitch: -1.2, offElbow: -0.8 },
      { torsoYaw: hs * 0.6, torsoLean: 0.35, armPitch: -0.7, armAbd: hs * 0.4, elbow: -0.3, offPitch: -0.4, offElbow: -1.0 },
    ];
  }
  if (style === "lob") {
    return [
      { torsoYaw: -hs * s * 0.7, torsoLean: 0.35, armPitch: 0.5, armAbd: -hs * s * 0.9, elbow: -0.3 },
      { torsoYaw: -hs * s * 0.2, torsoLean: 0.25, armPitch: -0.6, armAbd: -hs * s * 0.5, elbow: -0.2 },
      { torsoYaw: hs * s * 0.2, torsoLean: 0.05, armPitch: -2.4, armAbd: -hs * s * 0.2, elbow: -0.5 },
    ];
  }
  if (style === "volley") {
    return [
      { torsoYaw: -hs * s * 0.4, armPitch: -0.6, armAbd: -hs * s * 0.8, elbow: -1.2 },
      { torsoYaw: -hs * s * 0.1, armPitch: -1.1, armAbd: -hs * s * 0.5, elbow: -0.5 },
      { torsoYaw: hs * s * 0.15, armPitch: -1.2, armAbd: -hs * s * 0.2, elbow: -0.6 },
    ];
  }
  if (style === "serve") {
    return [
      { torsoYaw: -hs * 0.7, torsoLean: 0.3, armPitch: 0.4, armAbd: -hs * 1.0, elbow: -0.4, offPitch: -0.9, offElbow: -0.3 },
      { torsoYaw: -hs * 0.1, torsoLean: 0.25, armPitch: -0.7, armAbd: -hs * 0.6, elbow: -0.2 },
      { torsoYaw: hs * 0.5, torsoLean: 0.1, armPitch: -1.7, armAbd: hs * 0.2, elbow: -0.6 },
    ];
  }
  if (side === "fore") {
    return [
      { torsoYaw: -hs * 0.95, armPitch: 0.25, armAbd: -hs * 1.25, elbow: -0.5 },
      { torsoYaw: -hs * 0.1, armPitch: -0.9, armAbd: -hs * 0.95, elbow: -0.25 },
      { torsoYaw: hs * 0.7, armPitch: -1.8, armAbd: hs * 0.2, elbow: -0.9 },
    ];
  }
  return [
    { torsoYaw: hs * 1.05, armPitch: -0.7, armAbd: hs * 0.75, elbow: -0.9, offPitch: -0.7, offElbow: -1.4 },
    { torsoYaw: hs * 0.15, armPitch: -1.0, armAbd: -hs * 0.65, elbow: -0.2 },
    { torsoYaw: -hs * 0.55, armPitch: -1.6, armAbd: -hs * 1.4, elbow: -0.4 },
  ];
}

const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
};
function blend(a, b, u) {
  const out = { ...a };
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], u);
  return out;
}

function poseAt(base, swings, t, hs) {
  const s = swings.find((w) => t >= w.t - 0.5 && t <= w.t + 0.75);
  if (!s) return base;
  const [back, hit, follow] = swingPoses(s.style, s.side, hs);
  const prep = blend(base, back, 1);
  const contact = blend(prep, hit, 1);
  const end = blend(contact, follow, 1);
  const d = t - s.t;
  if (d < -0.18) return blend(base, back, ease((d + 0.5) / 0.32));
  if (d < 0) return blend(prep, hit, ease((d + 0.18) / 0.18));
  if (d < 0.28) return blend(contact, follow, ease(d / 0.28));
  return blend(end, base, ease((d - 0.28) / 0.47));
}

/** A cylinder that tapers from its top (at the joint) down along -y. */
function limb(rTop, rBottom, length, material) {
  const geo = new THREE.CylinderGeometry(rTop, rBottom, length, 14);
  geo.translate(0, -length / 2, 0);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  return m;
}

function sphere(r, material, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), material);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}

/** Upper body: narrow waist, wider chest, sloped shoulders. */
function torsoGeometry() {
  const pts = [
    [0.0, 0.0], [0.13, 0.0], [0.135, 0.08], [0.145, 0.2], [0.165, 0.32], [0.18, 0.42], [0.178, 0.48], [0.14, 0.53], [0.075, 0.56], [0.0, 0.565],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 28);
}

/** Pelvis and the top of the shorts. */
function pelvisGeometry() {
  const pts = [[0.0, -0.13], [0.14, -0.13], [0.155, -0.06], [0.15, 0.02], [0.135, 0.07], [0.0, 0.07]].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 24);
}

export class Player {
  constructor(id, outfit, timeline, { turnAround = false } = {}) {
    this.id = id;
    this.turnAround = turnAround;
    this.timeline = timeline;
    this.track = timeline.players[id];
    this.yaw = null;
    this.phase = 0;
    const hs = this.track.handSign;
    this.baseYaw = this.track.facing === 1 ? Math.PI : 0;
    const mine = id === "you" || id === "partner";
    const others = mine ? ["opp1", "opp2"] : ["you", "partner"];
    this.otherSwings = others.flatMap((o) => timeline.players[o].swings.map((s) => s.t));

    const mat = {
      shirt: new THREE.MeshStandardMaterial({ color: outfit.shirt, roughness: 0.75 }),
      shorts: new THREE.MeshStandardMaterial({ color: outfit.shorts, roughness: 0.85 }),
      skin: new THREE.MeshStandardMaterial({ color: outfit.skin, roughness: 0.55 }),
      hair: new THREE.MeshStandardMaterial({ color: outfit.hair, roughness: 0.9 }),
      band: new THREE.MeshStandardMaterial({ color: outfit.band, roughness: 0.7 }),
      sock: new THREE.MeshStandardMaterial({ color: "#f5f5f5", roughness: 0.9 }),
      shoe: new THREE.MeshStandardMaterial({ color: "#eef0f2", roughness: 0.55 }),
      sole: new THREE.MeshStandardMaterial({ color: outfit.band, roughness: 0.7 }),
      eye: new THREE.MeshStandardMaterial({ color: "#1b1410", roughness: 0.4 }),
    };

    this.root = new THREE.Group();
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = HIP_H;
    this.root.add(this.pelvis);

    const hips = new THREE.Mesh(pelvisGeometry(), mat.shorts);
    hips.scale.set(1, 1, 0.75);
    hips.castShadow = true;
    this.pelvis.add(hips);

    this.torso = new THREE.Group();
    this.pelvis.add(this.torso);
    const chest = new THREE.Mesh(torsoGeometry(), mat.shirt);
    chest.scale.set(1, 1, 0.7);
    chest.castShadow = true;
    this.torso.add(chest);
    const neck = limb(0.046, 0.052, 0.09, mat.skin);
    neck.position.y = TORSO + 0.12;
    this.torso.add(neck);

    // Head: skull, face details, hair and a headband. The face looks along +z.
    const head = new THREE.Group();
    head.position.y = TORSO + 0.17;
    head.add(sphere(0.1, mat.skin, 0.92, 1.12, 1.02));
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.104, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), mat.hair);
    hair.position.set(0, 0.012, -0.008);
    hair.scale.set(0.95, 1.12, 1.04);
    head.add(hair);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.012, 8, 28), mat.band);
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.06;
    band.scale.set(0.97, 1.07, 1);
    head.add(band);
    for (const ex of [-0.032, 0.032]) {
      const eye = sphere(0.011, mat.eye);
      eye.position.set(ex, 0.0, 0.093);
      head.add(eye);
      const ear = sphere(0.02, mat.skin, 0.5, 1, 0.8);
      ear.position.set(Math.sign(ex) * 0.092, 0.0, 0.0);
      head.add(ear);
    }
    const nose = sphere(0.014, mat.skin, 0.8, 1, 1.2);
    nose.position.set(0, -0.025, 0.103);
    head.add(nose);
    this.torso.add(head);

    // Racket arm is on the player's right for right-handers. The model faces +z, so right is -x.
    const armX = -0.2 * hs;
    const makeArm = (x, withRacket) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(x, TORSO - 0.03, 0);
      shoulder.add(sphere(0.062, mat.shirt, 1, 0.9, 1));
      const sleeve = limb(0.062, 0.054, 0.13, mat.shirt);
      shoulder.add(sleeve);
      shoulder.add(limb(0.043, 0.035, UPPER, mat.skin));
      const elbow = new THREE.Group();
      elbow.position.y = -UPPER;
      elbow.add(sphere(0.035, mat.skin));
      elbow.add(limb(0.034, 0.025, FORE, mat.skin));
      const hand = new THREE.Group();
      hand.position.y = -FORE - 0.03;
      hand.add(sphere(0.034, mat.skin, 0.75, 1.15, 0.55));
      if (withRacket) {
        const racket = buildRacket(outfit.rim);
        racket.rotation.set(0.1, 0, Math.PI);
        racket.position.y = 0.04;
        hand.add(racket);
      }
      elbow.add(hand);
      shoulder.add(elbow);
      this.torso.add(shoulder);
      return { shoulder, elbow };
    };
    const racketArm = makeArm(armX, true);
    const freeArm = makeArm(-armX, false);
    this.arm = racketArm.shoulder;
    this.fore = racketArm.elbow;
    this.off = freeArm.shoulder;
    this.offFore = freeArm.elbow;

    const makeLeg = (x) => {
      const hip = new THREE.Group();
      hip.position.set(x, -0.03, 0);
      hip.add(limb(0.082, 0.074, 0.2, mat.shorts));
      hip.add(limb(0.068, 0.05, THIGH, mat.skin));
      const knee = new THREE.Group();
      knee.position.y = -THIGH;
      knee.add(sphere(0.05, mat.skin));
      knee.add(limb(0.05, 0.034, SHIN, mat.skin));
      const sock = limb(0.037, 0.036, 0.08, mat.sock);
      sock.position.y = -SHIN + 0.1;
      knee.add(sock);
      const shoe = new THREE.Group();
      shoe.position.set(0, -SHIN - 0.025, 0.04);
      const upper = sphere(0.06, mat.shoe, 0.85, 0.6, 2.1);
      upper.position.y = 0.012;
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.022, 0.27), mat.sole);
      sole.position.y = -0.025;
      sole.castShadow = true;
      shoe.add(upper, sole);
      knee.add(shoe);
      hip.add(knee);
      this.pelvis.add(hip);
      return { hip, knee };
    };
    this.legL = makeLeg(0.095);
    this.legR = makeLeg(-0.095);
  }

  update(t, dt) {
    const tl = this.timeline;
    const track = this.track;
    const hs = track.handSign;
    const p = posAt(track, t);
    const ball = ballAt(tl, t);

    // Split step: a small hop just before the other team hits.
    let hop = 0;
    for (const st of this.otherSwings) {
      const d = t - (st - 0.12);
      if (d > 0 && d < 0.28) hop = Math.max(hop, Math.sin((d / 0.28) * Math.PI) * 0.06);
    }
    this.root.position.set(p.x, hop, -p.z);

    // Turn towards the ball within a natural range; on a long run, face where you run.
    const want = Math.atan2(ball.x - p.x, -ball.z + p.z);
    let rel = Math.atan2(Math.sin(want - this.baseYaw), Math.cos(want - this.baseYaw));
    const limit = this.turnAround ? Math.PI : 1.25;
    rel = Math.max(-limit, Math.min(limit, rel));
    let target = this.baseYaw + rel;
    const ahead = posAt(track, t + 0.08);
    const behind = posAt(track, Math.max(0, t - 0.08));
    const vx = (ahead.x - behind.x) / 0.16;
    const vz = (ahead.z - behind.z) / 0.16;
    if (Math.hypot(vx, vz) > 2.2) target = Math.atan2(vx, -vz);
    if (this.yaw === null) this.yaw = target;
    const diff = Math.atan2(Math.sin(target - this.yaw), Math.cos(target - this.yaw));
    this.yaw = THREE.MathUtils.damp(this.yaw, this.yaw + diff, 7, dt);
    this.root.rotation.y = this.yaw;

    const base = Math.abs(p.z) < 4.5 ? NET : READY;
    const a = poseAt(base, track.swings, t, hs);

    // Running gait: about 1.5 strides a second at full speed, like a real sprint.
    const run = Math.min(1, p.speed / 3.5);
    if (run > 0.05) this.phase += dt * (4.5 + p.speed * 1.1);
    const sw = Math.sin(this.phase) * run;
    const crouch = 0.07 * (1 - run * 0.5);
    // A gentle breathing sway while standing.
    const idle = (1 - run) * Math.sin(t * 2.4 + this.baseYaw) * 0.006;

    this.pelvis.position.y = HIP_H - crouch + idle + Math.abs(Math.cos(this.phase)) * 0.025 * run;
    this.torso.rotation.set(a.torsoLean + run * 0.15, a.torsoYaw - sw * 0.12, 0);
    this.arm.rotation.set(a.armPitch + sw * 0.3, 0, a.armAbd);
    this.fore.rotation.set(a.elbow, 0, 0);
    this.off.rotation.set(a.offPitch - sw * 0.6, 0, 0);
    this.offFore.rotation.set(a.offElbow, 0, 0);
    const knee = 0.5 * (1 - run) + 0.25;
    this.legL.hip.rotation.set(-0.33 * (1 - run) - sw * 0.75, 0, 0.06);
    this.legR.hip.rotation.set(-0.33 * (1 - run) + sw * 0.75, 0, -0.06);
    this.legL.knee.rotation.set(knee + Math.max(0, sw) * 0.85, 0, 0);
    this.legR.knee.rotation.set(knee + Math.max(0, -sw) * 0.85, 0, 0);
  }
}
