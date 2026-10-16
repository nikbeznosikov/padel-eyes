import * as THREE from "three";
import { labelTexture } from "./textures.js";

export const OPTION_COLORS = { A: "#ffd84d", B: "#5ee0ff", C: "#ff7ad9" };

/** A label that keeps the same size on screen and draws on top of the scene. */
export function makeLabel(text, bg, fg, height) {
  const { texture, aspect } = labelTexture(text, bg, fg);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false, depthTest: false, depthWrite: false, transparent: true }));
  sp.scale.set(height * aspect, height, 1);
  sp.renderOrder = 10;
  return sp;
}

/** Target rings, flight tubes and A/B/C letters for the options of one puzzle. */
export class Markers {
  constructor(previews) {
    this.group = new THREE.Group();
    this.items = [];
    for (const { option, arc } of previews) {
      if (!option.marker) continue;
      const m = option.marker;
      const color = OPTION_COLORS[option.id];
      const g = new THREE.Group();
      const flat = (mat) => Object.assign(mat, { transparent: true, depthWrite: false, toneMapped: false });
      // The flight, as a thin tube that starts a little away from your racket.
      let tube = null;
      const start = arc[0];
      const far = start ? arc.filter((p) => Math.hypot(p.x - start.x, p.y - start.y, p.z - start.z) > 2.5) : [];
      if (far.length > 1) {
        const curve = new THREE.CatmullRomCurve3(far.map((p) => new THREE.Vector3(p.x, p.y, -p.z)));
        tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(200, far.length * 2), 0.028, 6, false), flat(new THREE.MeshBasicMaterial({ color, opacity: 0.75 })));
        tube.renderOrder = 4;
        g.add(tube);
      }
      const spot = new THREE.Group();
      spot.position.set(m.x, 0.012, -m.z);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 48), flat(new THREE.MeshBasicMaterial({ color, opacity: 0.95 })));
      ring.rotation.x = -Math.PI / 2;
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.45, 48), flat(new THREE.MeshBasicMaterial({ color, opacity: 0.22 })));
      disc.rotation.x = -Math.PI / 2;
      spot.add(ring, disc);
      if (m.kind === "target") {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), flat(new THREE.MeshBasicMaterial({ color, opacity: 0.6 })));
        pin.position.y = 0.55;
        spot.add(pin);
      }
      g.add(spot);
      const badge = makeLabel(option.id, color, "#111", 0.07);
      badge.position.set(m.x, 1.25, -m.z);
      badge.userData.optionId = option.id;
      g.add(badge);
      this.group.add(g);
      this.items.push({ id: option.id, group: g, ring, tube, badge });
    }
  }

  /** Show all options, or only the picked one without its letter and flight. */
  setPicked(id) {
    for (const it of this.items) {
      it.group.visible = id === null || id === it.id;
      it.badge.visible = id === null;
      if (it.tube) it.tube.visible = id === null;
    }
  }

  badges() {
    return this.items.filter((it) => it.badge.visible && it.group.visible).map((it) => it.badge);
  }

  update(elapsed, camera, size) {
    const s = 1 + Math.sin(elapsed * 4) * 0.08;
    for (const it of this.items) it.ring.scale.setScalar(s);
    // Options aimed along one line overlap from your eyes: the nearest keeps its place, farther ones move up.
    const v = new THREE.Vector3();
    const px = (sp) => sp.scale.y * camera.projectionMatrix.elements[5] * (size.height / 2);
    const proj = this.badges()
      .map((sp) => {
        v.copy(sp.position).project(camera);
        return { sp, x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height, s: px(sp) };
      })
      .sort((a, b) => b.y - a.y);
    const placed = [];
    for (const it of proj) {
      let y = it.y;
      for (const p of placed) {
        if (Math.abs(p.x - it.x) < (p.s + it.s) / 2 && Math.abs(p.y - y) < (p.s + it.s) / 2 + 4) y = p.y - (p.s + it.s) / 2 - 4;
      }
      it.sp.center.set(0.5, 0.5 + (y - it.y) / it.s);
      placed.push({ x: it.x, y, s: it.s });
    }
  }
}

/** Short tags over the flight ("LOB") or at ball events ("Fence"), shown while they happen. */
export class Tags {
  constructor(tags) {
    this.group = new THREE.Group();
    this.items = tags.map((tag) => {
      const sp = makeLabel(tag.text, "rgba(110,231,183,0.95)", "#064e3b", 0.034);
      sp.position.set(tag.p.x, tag.p.y + 0.4, -tag.p.z);
      sp.material.opacity = 0;
      this.group.add(sp);
      return { tag, sp };
    });
  }

  update(t, dt) {
    for (const { tag, sp } of this.items) {
      const on = t >= tag.t0 && t <= tag.t1 + 0.6;
      sp.material.opacity = THREE.MathUtils.damp(sp.material.opacity, on ? 1 : 0, 10, dt);
    }
  }
}
