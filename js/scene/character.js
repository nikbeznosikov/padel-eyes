import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { ballAt, posAt } from "../timeline.js";
import { buildRacket } from "./racket.js";

// Quaternius CC0 characters (see assets/characters/LICENSE.txt). Bodies and clips share one skeleton.
const BASE = "assets/characters/";
let assetsPromise = null;

export function loadCharacterAssets() {
  if (assetsPromise) return assetsPromise;
  const loader = new GLTFLoader();
  const load = (f) => loader.loadAsync(BASE + f);
  assetsPromise = Promise.all([
    load("male.glb"),
    load("female.glb"),
    load("hair-simpleparted.glb"),
    load("hair-buzzed.glb"),
    load("hair-long.glb"),
    load("hair-buns.glb"),
    load("animations.glb"),
  ]).then(([male, female, simpleparted, buzzed, long, buns, anims]) => ({
    bodies: { male, female },
    hairs: { simpleparted, buzzed, long, buns },
    clips: Object.fromEntries(anims.animations.map((c) => [c.name, c])),
  }));
  return assetsPromise;
}

const ease = (u) => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
};

// Arm directions for each swing, in the character's own frame: R = its right, F = forward, U = up.
// Each phase gives the upper arm and forearm of the racket arm, the same for the free arm (`offUpper`, `offFore`),
// and `twist` turns the chest (radians).
const R = new THREE.Vector3(-1, 0, 0);
const F = new THREE.Vector3(0, 0, 1);
const U = new THREE.Vector3(0, 1, 0);
const d = (r, f, u) => R.clone().multiplyScalar(r).add(F.clone().multiplyScalar(f)).add(U.clone().multiplyScalar(u)).normalize();

const SWINGS = {
  fore: [
    { upper: d(0.8, -0.5, -0.3), fore: d(0.4, -0.9, 0.1), offUpper: d(0.35, 0.85, -0.25), offFore: d(0.4, 0.9, 0.05), twist: -0.9 },
    { upper: d(0.7, 0.5, -0.4), fore: d(0.3, 1, -0.1), offUpper: d(-0.55, 0.55, -0.55), offFore: d(-0.2, 0.9, -0.1), twist: -0.1 },
    { upper: d(-0.4, 0.8, 0.3), fore: d(-0.9, 0.2, 0.4), offUpper: d(-0.45, 0.35, -0.8), offFore: d(0.2, 0.85, 0.45), twist: 0.7 },
  ],
  back: [
    { upper: d(-0.6, 0.3, -0.2), fore: d(-0.8, -0.4, 0.1), offUpper: d(-0.25, 0.1, -0.95), offFore: d(-0.2, 0.9, 0.1), twist: 1.0 },
    { upper: d(0.2, 0.9, -0.3), fore: d(0.5, 1, 0), offUpper: d(-0.5, -0.55, -0.65), offFore: d(-0.45, -0.7, -0.4), twist: 0.15 },
    { upper: d(0.8, 0.2, 0.4), fore: d(0.7, 0, 0.6), offUpper: d(-0.55, -0.6, -0.55), offFore: d(-0.5, -0.65, -0.3), twist: -0.5 },
  ],
  lob: [
    { upper: d(0.6, -0.6, -0.5), fore: d(0.2, -0.5, -0.8), offUpper: d(-0.45, 0.5, -0.75), offFore: d(0.1, 0.9, 0.3), twist: -0.6 },
    { upper: d(0.6, 0.6, -0.5), fore: d(0.2, 0.8, -0.2), offUpper: d(-0.45, 0.5, -0.75), offFore: d(0.1, 0.9, 0.3), twist: -0.2 },
    { upper: d(0.3, 0.5, 0.8), fore: d(0, 0.3, 1), offUpper: d(-0.5, 0.3, -0.8), offFore: d(-0.1, 0.8, 0.5), twist: 0.2 },
  ],
  volley: [
    { upper: d(0.8, 0.4, -0.1), fore: d(0.4, 0.4, 0.6), offUpper: d(-0.45, 0.55, -0.7), offFore: d(0, 0.95, 0.25), twist: -0.4 },
    { upper: d(0.5, 0.8, -0.1), fore: d(0.1, 1, 0.3), offUpper: d(-0.45, 0.55, -0.7), offFore: d(0, 0.95, 0.25), twist: -0.1 },
    { upper: d(0.2, 0.9, -0.1), fore: d(-0.2, 0.8, 0.1), offUpper: d(-0.45, 0.55, -0.7), offFore: d(0, 0.95, 0.25), twist: 0.15 },
  ],
  // The free arm points up at the ball while you get under it, then pulls down to the chest as you hit.
  overhead: [
    { upper: d(0.6, -0.3, 0.6), fore: d(0, -0.9, 0.3), offUpper: d(-0.15, 0.45, 0.88), offFore: d(-0.05, 0.4, 0.92), twist: -0.8 },
    { upper: d(0.15, 0.2, 1), fore: d(0, 0.4, 1), offUpper: d(-0.35, 0.45, -0.8), offFore: d(0.75, 0.6, 0.2), twist: 0.1 },
    { upper: d(-0.2, 0.8, -0.3), fore: d(-0.3, 0.4, -0.9), offUpper: d(-0.3, 0.3, -0.9), offFore: d(0.6, 0.7, -0.1), twist: 0.6 },
  ],
};
SWINGS.serve = SWINGS.lob;

function swingFor(style, side) {
  if (style === "drive") return SWINGS[side === "fore" ? "fore" : "back"];
  return SWINGS[style] ?? SWINGS.fore;
}

/** Paint shirt, shorts, socks and shoes on the bare base body, by height and width in its bind pose. */
function dressMaterial(material, outfit, marks, firstPerson) {
  const m = material.clone();
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, firstPerson, {
      uShirt: { value: new THREE.Color(outfit.shirt) },
      uShorts: { value: new THREE.Color(outfit.shorts) },
      uShoe: { value: new THREE.Color("#f1f3f5") },
      uSole: { value: new THREE.Color(outfit.band) },
      uSock: { value: new THREE.Color("#f7f7f7") },
      uMarks: { value: new THREE.Vector4(marks.ankle, marks.knee, marks.waist, marks.neck) },
      uSleeve: { value: marks.sleeve },
    });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBind;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBind = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vBind;
uniform vec3 uShirt; uniform vec3 uShorts; uniform vec3 uShoe; uniform vec3 uSole; uniform vec3 uSock;
uniform vec4 uMarks; uniform float uSleeve; uniform float uFirstPerson; uniform float uShoulder;`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
// From your own eyes only legs and arms are drawn: the chest and head would sit right in front of the camera.
if (uFirstPerson > 0.5 && vBind.y > uMarks.z - 0.06 && abs(vBind.x) < uShoulder) discard;
{
  float y = vBind.y; float ax = abs(vBind.x);
  float ankle = uMarks.x, knee = uMarks.y, waist = uMarks.z, neck = uMarks.w;
  vec3 cloth = vec3(-1.0);
  if (y < ankle + 0.035) cloth = y < 0.025 ? uSole : uShoe;
  else if (y < ankle + 0.13) cloth = uSock;
  else if (y > knee + 0.14 && y < waist) cloth = uShorts;
  else if (y >= waist && y < neck && ax < uSleeve) cloth = uShirt;
  if (cloth.x >= 0.0) diffuseColor.rgb = cloth;
}`,
      );
  };
  m.customProgramCacheKey = () => `dress-${outfit.shirt}-${outfit.shorts}-${outfit.band}-fp`;
  return m;
}

/** Body landmarks from the bind pose, so the clothes fit both body types. */
function landmarks(bones) {
  const y = (n) => bones[n].getWorldPosition(new THREE.Vector3()).y;
  const shoulderX = Math.abs(bones.upperarm_r.getWorldPosition(new THREE.Vector3()).x);
  return { ankle: y("foot_r"), knee: y("calf_r"), waist: y("pelvis") + 0.1, neck: y("neck_01") - 0.06, sleeve: shoulderX + 0.13 };
}

/**
 * One player: a skinned body with hair, a racket in the hand and blended idle/run clips.
 * Swings are layered on top by turning the arm bones towards each swing's directions.
 */
export class Character {
  constructor(id, assets, look, timeline, { turnAround = false, firstPerson = false } = {}) {
    this.id = id;
    this.timeline = timeline;
    this.track = timeline.players[id];
    this.turnAround = turnAround;
    this.yaw = null;
    this.baseYaw = this.track.facing === 1 ? Math.PI : 0;
    const mine = id === "you" || id === "partner";
    this.otherSwings = (mine ? ["opp1", "opp2"] : ["you", "partner"]).flatMap((o) => timeline.players[o].swings.map((s) => s.t));

    this.root = new THREE.Group();
    // Left-handers: mirror the whole body, so the right-handed clips play with the left hand.
    this.body = SkeletonUtils.clone(assets.bodies[look.body].scene);
    if (this.track.handSign === -1) this.body.scale.x = -1;
    this.root.add(this.body);

    this.bones = {};
    let skinned = null;
    this.body.traverse((o) => {
      if (o.isBone) this.bones[o.name] = o;
      if (o.isSkinnedMesh && !skinned && o.skeleton.bones.length > 30 && /Super/i.test(o.name)) skinned = o;
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
      }
    });
    this.body.updateMatrixWorld(true);
    const marks = landmarks(this.bones);
    this.fpUniforms = { uFirstPerson: { value: 0 }, uShoulder: { value: marks.sleeve - 0.1 } };
    this.headParts = [];
    this.body.traverse((o) => {
      if (o === skinned) {
        o.material = dressMaterial(o.material, look, marks, this.fpUniforms);
        o.material.color.set(look.skinTint ?? "#ffffff");
      } else if (o.isMesh) {
        this.headParts.push(o);
      }
    });

    // Hair is rigged to the same skeleton: bind it to this body's bones.
    const hairScene = SkeletonUtils.clone(assets.hairs[look.hair].scene);
    hairScene.traverse((o) => {
      if (o.isSkinnedMesh) {
        this.headParts.push(o);
        o.bind(skinned.skeleton, skinned.bindMatrix);
        o.castShadow = true;
        o.frustumCulled = false;
        o.material = o.material.clone();
        o.material.color.set(look.hairTint ?? "#ffffff");
      }
    });
    this.body.add(hairScene);

    this.firstPerson = firstPerson;
    this.lookYaw = null;

    this.racket = buildRacket(look.rim);
    this.bones.hand_r.add(this.racket);

    this.mixer = new THREE.AnimationMixer(this.body);
    const action = (name) => {
      const a = this.mixer.clipAction(assets.clips[name]);
      a.play();
      a.setEffectiveWeight(0);
      return a;
    };
    this.actions = { idle: action("Idle_Loop"), jog: action("Jog_Fwd_Loop"), sprint: action("Sprint_Loop") };
    this.actions.idle.setEffectiveWeight(1);
    this.mixer.update(0);
    this.body.updateMatrixWorld(true);
    this.applyReady(1);
    this.grip();
    this.mixer.update(Math.random());
  }

  /** Draw only legs, arms and racket (your own view) or the whole player. */
  setFirstPerson(on) {
    this.fpUniforms.uFirstPerson.value = on ? 1 : 0;
    for (const m of this.headParts) m.visible = !on;
  }

  /** Set the racket in the hand so that, in the ready position, its head points up and a little forward. */
  grip() {
    const hand = this.bones.hand_r;
    const y = this.worldDir(d(-0.1, 0.5, 0.86));
    const face = this.worldDir(F);
    const z = face.sub(y.clone().multiplyScalar(face.dot(y))).normalize();
    const x = new THREE.Vector3().crossVectors(y, z);
    // The racket's axes in the hand's frame. In a mirrored (left-handed) hand, flip its width axis back: the racket is symmetric.
    const local = hand.matrixWorld.clone().invert().multiply(new THREE.Matrix4().makeBasis(x, y, z));
    if (local.determinant() < 0) local.multiply(new THREE.Matrix4().makeScale(-1, 1, 1));
    this.racket.quaternion.setFromRotationMatrix(local);
    // Hold the handle in the palm, a little below the end of the grip.
    const along = new THREE.Vector3(0, 1, 0).applyQuaternion(this.racket.quaternion);
    this.racket.position.set(0, 0.085, 0.02).addScaledVector(along, -0.07);
  }

  update(t, dt) {
    const track = this.track;
    const p = posAt(track, t);
    const ball = ballAt(this.timeline, t);

    // Split step: a small hop just before the other team hits.
    let hop = 0;
    for (const st of this.otherSwings) {
      const k = t - (st - 0.12);
      if (k > 0 && k < 0.28) hop = Math.max(hop, Math.sin((k / 0.28) * Math.PI) * 0.06);
    }
    this.root.position.set(p.x, hop, -p.z);

    // Face the ball; on a long run, face where you run.
    const want = Math.atan2(ball.x - p.x, -ball.z + p.z);
    let rel = Math.atan2(Math.sin(want - this.baseYaw), Math.cos(want - this.baseYaw));
    const limit = this.turnAround ? Math.PI : 1.25;
    rel = Math.max(-limit, Math.min(limit, rel));
    let target = this.baseYaw + rel;
    const ahead = posAt(track, t + 0.08);
    const behind = posAt(track, Math.max(0, t - 0.08));
    const vx = (ahead.x - behind.x) / 0.16;
    const vz = (ahead.z - behind.z) / 0.16;
    const speed = Math.hypot(vx, vz);
    if (speed > 2.2) target = Math.atan2(vx, -vz);
    if (this.yaw === null) this.yaw = target;
    const diff = Math.atan2(Math.sin(target - this.yaw), Math.cos(target - this.yaw));
    this.yaw = THREE.MathUtils.damp(this.yaw, this.yaw + diff, 7, dt);
    // Seen from your own eyes, your body turns with your head, so the view never ends up inside your shoulder.
    if (this.lookYaw != null) this.yaw = this.lookYaw;
    this.root.rotation.y = this.yaw;

    // Blend stance, jog and sprint by speed, and play the steps at the matching pace.
    const run = THREE.MathUtils.smoothstep(speed, 0.4, 2.2);
    const sprint = THREE.MathUtils.smoothstep(speed, 3.2, 5.0);
    this.actions.idle.setEffectiveWeight(1 - run);
    this.actions.jog.setEffectiveWeight(run * (1 - sprint));
    this.actions.sprint.setEffectiveWeight(run * sprint);
    this.actions.jog.setEffectiveTimeScale(Math.max(0.6, speed / 3.0));
    this.actions.sprint.setEffectiveTimeScale(Math.max(0.6, speed / 5.5));
    this.mixer.update(dt);
    // Ready position while standing: knees bent a little, body a little lower.
    this.body.position.y = -0.035 * (1 - run);
    this.body.updateMatrixWorld(true);
    this.applyReady(1 - run);
    this.applySwing(t);
  }

  /** Padel ready position: racket in front of the chest, the other hand at its throat, knees soft. */
  applyReady(w) {
    if (w <= 0.01) return;
    const L = R.clone().negate();
    // Feet a bit wider than the hips, knees forward over the toes.
    aimBone(this.bones.thigh_l, this.bones.calf_l, this.worldDir(d(-0.16, 0.32, -0.93)), w);
    aimBone(this.bones.calf_l, this.bones.foot_l, this.worldDir(d(-0.04, -0.22, -0.97)), w);
    aimBone(this.bones.thigh_r, this.bones.calf_r, this.worldDir(d(0.16, 0.32, -0.93)), w);
    aimBone(this.bones.calf_r, this.bones.foot_r, this.worldDir(d(0.04, -0.22, -0.97)), w);
    // Hands out in front at chest height, racket head up (a little lower for your own body, so it does not hide the court).
    const low = this.firstPerson ? 0.15 : 0;
    aimBone(this.bones.upperarm_r, this.bones.lowerarm_r, this.worldDir(d(0.35, 0.55 - low, -0.78 - low)), w);
    aimBone(this.bones.lowerarm_r, this.bones.hand_r, this.worldDir(d(-0.1, 0.96, -0.12 - low * 1.5)), w);
    const offUpper = L.clone().multiplyScalar(0.3).add(F.clone().multiplyScalar(0.55)).add(U.clone().multiplyScalar(-0.78)).normalize();
    const offFore = R.clone().multiplyScalar(0.6).add(F.clone().multiplyScalar(0.78)).add(U.clone().multiplyScalar(-0.1)).normalize();
    aimBone(this.bones.upperarm_l, this.bones.lowerarm_l, this.worldDir(offUpper), w);
    aimBone(this.bones.lowerarm_l, this.bones.hand_l, this.worldDir(offFore), w);
  }

  /** Turn both arms and the chest through the back-swing, contact and follow-through. */
  applySwing(t) {
    // An overhead is set up early: you turn and point at the ball while it is still high.
    const lead = (w) => (w.style === "overhead" ? 1.0 : 0.5);
    const s = this.track.swings.find((w) => t >= w.t - lead(w) && t <= w.t + 0.75);
    if (!s) return;
    const keys = swingFor(s.style, s.side);
    const k = t - s.t;
    let a;
    let b;
    let u;
    let weight = 1;
    if (k < -0.18) {
      a = keys[0];
      b = keys[0];
      u = 0;
      weight = ease((k + lead(s)) / (lead(s) - 0.18));
    } else if (k < 0) {
      a = keys[0];
      b = keys[1];
      u = ease((k + 0.18) / 0.18);
    } else if (k < 0.28) {
      a = keys[1];
      b = keys[2];
      u = ease(k / 0.28);
    } else {
      a = keys[2];
      b = keys[2];
      u = 0;
      weight = 1 - ease((k - 0.28) / 0.47);
    }
    const mix = (key) => a[key].clone().lerp(b[key], u).normalize();
    // A mirrored (left-handed) body turns its chest the other way.
    const twist = THREE.MathUtils.lerp(a.twist, b.twist, u) * weight * Math.sign(this.body.scale.x);

    // Chest turn around the body's up axis, split over the spine.
    for (const n of ["spine_01", "spine_02", "spine_03"]) {
      const bone = this.bones[n];
      const q = new THREE.Quaternion().setFromAxisAngle(this.worldDir(U), twist / 3);
      rotateBoneWorld(bone, q);
    }
    aimBone(this.bones.upperarm_r, this.bones.lowerarm_r, this.worldDir(mix("upper")), weight);
    aimBone(this.bones.lowerarm_r, this.bones.hand_r, this.worldDir(mix("fore")), weight);
    // The free arm moves with the swing too, even on the run, instead of pumping like a jogger's.
    aimBone(this.bones.upperarm_l, this.bones.lowerarm_l, this.worldDir(mix("offUpper")), weight);
    aimBone(this.bones.lowerarm_l, this.bones.hand_l, this.worldDir(mix("offFore")), weight);
  }

  worldDir(local) {
    return local.clone().transformDirection(this.body.matrixWorld);
  }

  dispose() {
    this.mixer.stopAllAction();
  }
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _q1 = new THREE.Quaternion();
const _m1 = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();

/** Apply a world-space rotation to a bone, keeping its parent. */
function rotateBoneWorld(bone, q) {
  // The same turn seen from the parent is P^-1 * q * P; this stays right when a left-handed body is mirrored.
  const parent = bone.parent.matrixWorld;
  _m1.copy(parent).invert().multiply(_m2.makeRotationFromQuaternion(q)).multiply(parent);
  bone.quaternion.premultiply(_q1.setFromRotationMatrix(_m1));
  bone.updateMatrixWorld(true);
}

/** Turn a bone so its child sits in `dir` (world space), blended by `weight`. */
function aimBone(bone, child, dir, weight) {
  if (weight <= 0) return;
  bone.getWorldPosition(_a);
  child.getWorldPosition(_b);
  const cur = _b.sub(_a).normalize();
  const delta = new THREE.Quaternion().setFromUnitVectors(cur, dir);
  const before = bone.quaternion.clone();
  rotateBoneWorld(bone, delta);
  if (weight < 1) {
    bone.quaternion.copy(before.slerp(bone.quaternion, weight));
    bone.updateMatrixWorld(true);
  }
}
