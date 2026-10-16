import * as THREE from "three";
import { COURT } from "../court.js";
import { ballAt } from "../timeline.js";
import { glowTexture } from "./textures.js";

const TRAIL = 40;

export class Ball {
  constructor() {
    this.group = new THREE.Group();
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(COURT.ball.radius, 24, 18),
      new THREE.MeshStandardMaterial({ color: "#d8f03c", roughness: 0.95, emissive: "#3a4500", emissiveIntensity: 0.25 }),
    );
    this.mesh.castShadow = true;
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, opacity: 0.55 }));
    this.glow.renderOrder = 5;
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.05, 20), new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.35, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    const colors = new Float32Array(TRAIL * 4);
    for (let i = 0; i < TRAIL; i++) colors.set([0.86, 1, 0.35, (i / TRAIL) ** 2 * 0.8], i * 4);
    g.setAttribute("color", new THREE.BufferAttribute(colors, 4));
    this.trail = new THREE.Line(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }));
    this.group.add(this.mesh, this.glow, this.shadow, this.trail);
  }

  update(timeline, t, camera) {
    const p = ballAt(timeline, t);
    const pos = new THREE.Vector3(p.x, p.y, -p.z);
    this.mesh.position.copy(pos);
    this.mesh.rotation.x += 0.3;
    // Keep the ball readable on a phone: the glow never shrinks below a few pixels.
    const s = Math.max(0.12, camera.position.distanceTo(pos) * 0.018);
    this.glow.position.copy(pos);
    this.glow.scale.setScalar(s);
    this.shadow.position.set(p.x, 0.004, -p.z);
    this.shadow.scale.setScalar(Math.max(0.03, 0.06 - p.y * 0.008) / 0.05);
    this.shadow.material.opacity = Math.max(0.12, 0.5 - p.y * 0.06);
    const attr = this.trail.geometry.getAttribute("position");
    for (let i = 0; i < TRAIL; i++) {
      const q = ballAt(timeline, Math.max(0, t - (TRAIL - 1 - i) * 0.008));
      attr.setXYZ(i, q.x, q.y, -q.z);
    }
    attr.needsUpdate = true;
  }
}
