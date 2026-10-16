import * as THREE from "three";
import { COURT } from "../court.js";
import { ballAt, posAt } from "../timeline.js";
import { Ball } from "./ball.js";
import { Character, loadCharacterAssets } from "./character.js";
import { buildCourt, buildEnvironment } from "./court.js";
import { Markers, Tags } from "./markers.js";
import { Player } from "./player.js";
import { buildRacket } from "./racket.js";

const OUTFITS = {
  you: { shirt: "#f4f4f4", shorts: "#1f2a3a", skin: "#d2a07c", hair: "#3a2a1c", band: "#2563eb", rim: "#e8c547" },
  partner: { shirt: "#f4f4f4", shorts: "#1f2a3a", skin: "#c48f6a", hair: "#1e1611", band: "#2563eb", rim: "#60a5fa" },
  opp1: { shirt: "#d2402f", shorts: "#22252b", skin: "#c99673", hair: "#2a1b12", band: "#111827", rim: "#f97316" },
  opp2: { shirt: "#d2402f", shorts: "#22252b", skin: "#b07b58", hair: "#14100c", band: "#111827", rim: "#a3e635" },
};

// Who is who on court. Your partner and one opponent are women, to make mixed doubles look right.
const LOOKS = {
  you: { body: "male", hair: "buzzed", shirt: "#f4f4f4", shorts: "#1f2a3a", band: "#2563eb", rim: "#e8c547", hairTint: "#5b4636" },
  partner: { body: "female", hair: "buns", shirt: "#f4f4f4", shorts: "#1f2a3a", band: "#2563eb", rim: "#60a5fa", hairTint: "#8a6a4a" },
  opp1: { body: "male", hair: "simpleparted", shirt: "#d2402f", shorts: "#22252b", band: "#111827", rim: "#f97316", hairTint: "#3a2a1c" },
  opp2: { body: "female", hair: "long", shirt: "#d2402f", shorts: "#22252b", band: "#111827", rim: "#a3e635", hairTint: "#2a1b12", skinTint: "#f0d6c4" },
};

const ease = (u) => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
};

/**
 * The 3D view: one renderer for the whole visit, refilled for each puzzle.
 * The clock drives everything; `stopAt` pauses it and calls `onStop` once.
 */
export class Stage {
  constructor(container, { onPick }) {
    this.container = container;
    this.onPick = onPick;
    this.clock = { t: 0, playing: false, stopAt: 0, slowLead: 0, onStop: null };
    this.mode = "eyes";
    this.insets = { top: 0, bottom: 0 };
    this.elapsed = 0;

    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(r.domElement);
    this.renderer = r;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#c9cfd6");
    this.scene.environment = buildEnvironment(r);
    this.scene.add(buildCourt());
    this.addLights();

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.05, 80);
    this.camera.position.set(0, COURT.eyeHeight, 8);
    this.look = null;
    this.lastT = -1;

    // Real player models load in the background; until then (or if they fail) the simple figures are used.
    this.assets = null;
    this.assetsReady = loadCharacterAssets()
      .then((a) => (this.assets = a))
      .catch(() => (this.assets = false));

    this.dynamic = new THREE.Group();
    this.scene.add(this.dynamic);
    this.myRacket = buildRacket(OUTFITS.you.rim);
    this.scene.add(this.myRacket);

    this.resize();
    window.addEventListener("resize", () => this.resize());
    r.domElement.addEventListener("click", (e) => this.handleClick(e));
    // Drag with the mouse or a finger to look around.
    this.drag = { yaw: 0, pitch: 0, id: null, x: 0, y: 0, moved: 0 };
    r.domElement.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    r.domElement.addEventListener("pointermove", (e) => this.onPointerMove(e));
    r.domElement.addEventListener("pointerup", (e) => this.onPointerUp(e));
    r.domElement.addEventListener("pointercancel", (e) => this.onPointerUp(e));
    this.last = performance.now();
    r.setAnimationLoop(() => this.frame());
  }

  addLights() {
    this.scene.add(new THREE.HemisphereLight("#f2f6ff", "#59626b", 1.0));
    const sun = new THREE.DirectionalLight("#ffffff", 2.1);
    sun.position.set(2.5, 16, -3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 12, bottom: -12, near: 1, far: 30 });
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0001;
    sun.shadow.normalBias = 0.06;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight("#ffffff", 0.6);
    fill.position.set(-4, 10, 8);
    this.scene.add(fill);
  }

  /** Load a timeline (and option previews). Keeps the clock where it is. */
  show(timeline, previews = null, { turnAround = false } = {}) {
    this.timeline = timeline;
    this.turnAround = turnAround;
    this.dynamic.clear();
    this.players?.forEach((p) => p.dispose?.());
    this.players = ["partner", "opp1", "opp2", "you"].map((id) => {
      const p = this.assets
        ? new Character(id, this.assets, LOOKS[id], timeline, { turnAround: id === "you" || turnAround, firstPerson: id === "you" })
        : new Player(id, OUTFITS[id], timeline, { turnAround: turnAround && id === "you" });
      this.dynamic.add(p.root);
      return p;
    });
    this.ball = new Ball();
    this.dynamic.add(this.ball.group);
    this.tags = new Tags(timeline.tags);
    this.dynamic.add(this.tags.group);
    if (previews) {
      this.markers = new Markers(previews);
      this.markersVisible = false;
    }
    if (this.markers) {
      this.dynamic.add(this.markers.group);
      this.markers.group.visible = this.markersVisible;
    }
  }

  setMarkers(visible, picked = null) {
    this.markersVisible = visible;
    if (!this.markers) return;
    this.markers.group.visible = visible;
    this.markers.setPicked(picked);
  }

  play(from, to, { slowLead = 0, onStop = null } = {}) {
    Object.assign(this.clock, { t: from, stopAt: to, slowLead, onStop, playing: true });
  }

  /** Jump to the planned stop and fire its callback now. */
  skip() {
    const c = this.clock;
    c.t = c.stopAt;
    c.playing = false;
    const cb = c.onStop;
    c.onStop = null;
    cb?.();
  }

  setMode(mode) {
    this.mode = mode;
    this.drag.yaw = 0;
    this.drag.pitch = 0;
  }

  /** Screen space covered by the question card at the top and the panel at the bottom, in pixels. */
  setInsets(top, bottom) {
    this.insets = { top, bottom };
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.size = { width: w, height: h };
    this.renderer.setSize(w, h);
  }

  tick(dt) {
    const c = this.clock;
    if (!c.playing) return;
    const left = c.stopAt - c.t;
    // Ease into slow motion right before a planned stop.
    const rate = c.slowLead > 0 && left < c.slowLead ? 0.25 + 0.75 * (left / c.slowLead) : 1;
    c.t = Math.min(c.stopAt, c.t + Math.min(dt, 1 / 20) * rate);
    if (c.t >= c.stopAt) {
      c.playing = false;
      const cb = c.onStop;
      c.onStop = null;
      cb?.();
    }
  }

  frame() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.elapsed += dt;
    if (!this.timeline || !this.container.offsetParent) return;
    this.tick(dt);
    const t = this.clock.t;
    this.updateCamera(t, dt);
    const me = this.players.find((p) => p.id === "you");
    if (me?.bones) {
      const dir = this.camera.getWorldDirection(new THREE.Vector3());
      me.lookYaw = this.mode === "eyes" ? Math.atan2(dir.x, dir.z) : null;
    }
    for (const p of this.players) {
      if (p.id === "you") {
        if (p.bones) {
          // From your own eyes you see your legs, arms and racket; from behind, the whole player.
          p.setFirstPerson(this.mode === "eyes");
        } else {
          p.root.visible = this.mode === "overview";
        }
      }
      p.update(t, dt);
    }
    this.ball.update(this.timeline, t, this.camera);
    this.tags.update(t, dt);
    if (this.markers && this.markers.group.visible) this.markers.update(this.elapsed, this.camera, this.size);
    this.updateMyRacket(t);
    this.renderer.render(this.scene, this.camera);
  }

  updateCamera(t, dt) {
    const cam = this.camera;
    const { width: w, height: h } = this.size;
    // Lens shift: centre the view in the part of the screen the panels leave free.
    const shift = Math.round(THREE.MathUtils.clamp(this.insets.bottom - this.insets.top, -h * 0.5, h * 0.5));
    const inset = Math.abs(shift);
    if (inset > 0) cam.setViewOffset(w, h + inset, 0, shift > 0 ? inset : 0, w, h);
    else if (cam.view) cam.clearViewOffset();
    // Aim for a natural ~68 degree horizontal view over the visible part, within sensible limits.
    const hfov = THREE.MathUtils.degToRad(68);
    const visibleV = THREE.MathUtils.clamp(2 * Math.atan(Math.tan(hfov / 2) / (w / h)), THREE.MathUtils.degToRad(48), THREE.MathUtils.degToRad(80));
    cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(visibleV / 2) * ((h + inset) / h)));
    cam.aspect = w / h;
    cam.updateProjectionMatrix();

    const g = this.drag;
    const dragging = g.id !== null;
    // From your eyes play turns you back to the ball; the view from behind stays where you put it.
    if (this.mode === "eyes" && this.clock.playing && !dragging) {
      const f = Math.exp(-dt * 2.5);
      g.yaw *= f;
      g.pitch *= f;
    }

    const you = posAt(this.timeline.players.you, t);
    const b = ballAt(this.timeline, t);
    const ball = new THREE.Vector3(b.x, b.y, -b.z);
    let pos;
    let target;
    if (this.mode === "overview") {
      // Orbit round the middle of the court, starting high behind your half.
      target = new THREE.Vector3(0, 0, -1.5);
      const elev = THREE.MathUtils.clamp(Math.atan2(8.5, 20) + g.pitch, 0.05, 1.45);
      const dist = Math.hypot(8.5, 20);
      pos = target.clone().add(new THREE.Vector3(Math.sin(g.yaw) * Math.cos(elev), Math.sin(elev), Math.cos(g.yaw) * Math.cos(elev)).multiplyScalar(dist));
    } else {
      pos = new THREE.Vector3(you.x, COURT.eyeHeight, -you.z);
      // With a real body, the eyes are where the model's eyes are, so looking down shows your own chest and legs.
      const me = this.players?.find((p) => p.id === "you");
      if (me?.bones) {
        const fwd = new THREE.Vector3(Math.sin(me.root.rotation.y), 0, Math.cos(me.root.rotation.y));
        pos = me.bones.neck_01.getWorldPosition(new THREE.Vector3()).add(fwd.multiplyScalar(0.09)).add(new THREE.Vector3(0, 0.16, 0));
      }
      // Your eyes stay on the ball wherever it goes: past you, behind you or down at your feet.
      const dir = ball.clone().sub(pos);
      const flat = Math.hypot(dir.x, dir.z);
      const yaw = Math.atan2(dir.x, -dir.z) + g.yaw;
      const pitch = THREE.MathUtils.clamp(Math.atan2(dir.y, Math.max(0.15, flat)) + g.pitch, -1.4, 1.4);
      target = pos.clone().add(new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(6));
    }
    const jump = Math.abs(t - this.lastT) > 0.5 || this.look === null;
    this.lastT = t;
    cam.position.lerp(pos, jump ? 1 : 1 - Math.exp(-dt * (this.mode === "eyes" || dragging ? 14 : 3)));
    // Turn the head smoothly by rotation, so even a half turn round goes the short way without a jolt.
    const want = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(cam.position, target, cam.up));
    const k = jump ? 1 : 1 - Math.exp(-dt * (this.mode === "overview" && !dragging ? 2.5 : 10));
    if (jump) cam.quaternion.copy(want);
    else cam.quaternion.slerp(want, k);
    this.look = target;
  }

  /** Your own racket at the bottom of the view, in the hand you play with. */
  updateMyRacket(t) {
    const g = this.myRacket;
    // With a real body your racket is in your hand; the floating one is only for the simple figures.
    g.visible = this.mode === "eyes" && !this.assets;
    if (!g.visible) return;
    const track = this.timeline.players.you;
    const hs = track.handSign;
    const swing = track.swings.find((s) => t >= s.t - 0.45 && t <= s.t + 0.5);
    let x = 0.34 * hs;
    let y = -0.68;
    const z = -0.95;
    let pitch = 0.2;
    let yaw = -0.35 * hs;
    let roll = -0.55 * hs;
    if (swing) {
      const side = swing.side === "fore" ? 1 : -1;
      const d = t - swing.t;
      // Back-swing out of view, through the centre at contact, then low and wide.
      const u = d < 0 ? ease((d + 0.45) / 0.45) : 1 + ease(Math.min(1, d / 0.3));
      const back = { x: 0.9 * hs * side, y: -0.6, yaw: -1.1 * hs * side };
      const hit = { x: 0.15 * hs * side, y: swing.style === "lob" ? -0.35 : -0.45, yaw: 0 };
      const follow = { x: -1.0 * hs * side, y: swing.style === "lob" ? -0.3 : -0.55, yaw: 0.9 * hs * side };
      const from = u <= 1 ? back : hit;
      const to = u <= 1 ? hit : follow;
      const k = u <= 1 ? u : u - 1;
      const w = d > 0.3 ? Math.max(0, 1 - (d - 0.3) / 0.2) : 1;
      x += (from.x + (to.x - from.x) * k - x) * w;
      y += (from.y + (to.y - from.y) * k - y) * w;
      yaw += (from.yaw + (to.yaw - from.yaw) * k - yaw) * w;
      pitch += (swing.style === "lob" ? -0.6 : 0.1) * w;
      roll *= 1 - w;
    }
    const cam = this.camera;
    g.position.copy(cam.position).add(new THREE.Vector3(x, y, z).applyQuaternion(cam.quaternion));
    g.quaternion.copy(cam.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll)));
  }

  onPointerDown(e) {
    const g = this.drag;
    if (g.id !== null) return;
    Object.assign(g, { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  onPointerMove(e) {
    const g = this.drag;
    if (e.pointerId !== g.id) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    g.x = e.clientX;
    g.y = e.clientY;
    g.moved += Math.abs(dx) + Math.abs(dy);
    // The court follows the finger: from your eyes a drag across the screen turns you by about the field of view,
    // from behind it swings the camera half way round the court.
    const k = (this.mode === "overview" ? Math.PI : THREE.MathUtils.degToRad(this.camera.fov)) / this.size.height;
    g.yaw -= dx * k;
    g.yaw = Math.atan2(Math.sin(g.yaw), Math.cos(g.yaw));
    g.pitch = THREE.MathUtils.clamp(g.pitch + dy * k, -1.4, 1.4);
  }

  onPointerUp(e) {
    if (e.pointerId === this.drag.id) this.drag.id = null;
  }

  handleClick(e) {
    // A drag is not a tap on an option.
    if (this.drag.moved > 6) return;
    if (!this.markers || !this.markers.group.visible) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = ray.intersectObjects(this.markers.badges(), false)[0];
    if (hit) this.onPick(hit.object.userData.optionId);
  }
}
