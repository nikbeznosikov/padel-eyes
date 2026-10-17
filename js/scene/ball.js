import * as THREE from "three";
import { COURT } from "../court.js";
import { ballAt } from "../timeline.js";
import { glowTexture } from "./textures.js";

const TRAIL = 48;
const _side = new THREE.Vector3();
const _toCam = new THREE.Vector3();

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
    // The trail is a ribbon turned to the camera: a plain WebGL line is always one pixel wide.
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL * 2 * 3), 3));
    const colors = new Float32Array(TRAIL * 2 * 4);
    for (let i = 0; i < TRAIL; i++) {
      const a = (i / (TRAIL - 1)) ** 1.5 * 0.9;
      colors.set([0.9, 1, 0.3, a, 0.9, 1, 0.3, a], i * 8);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 4));
    const index = [];
    for (let i = 0; i < TRAIL - 1; i++) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    g.setIndex(index);
    this.points = Array.from({ length: TRAIL }, () => new THREE.Vector3());
    this.trail = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    this.trail.frustumCulled = false;
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
    const pts = this.points;
    for (let i = 0; i < TRAIL; i++) {
      const q = ballAt(timeline, Math.max(0, t - (TRAIL - 1 - i) * 0.008));
      pts[i].set(q.x, q.y, -q.z);
    }
    // As wide as the ball at its head, never thinner than a few pixels far away, fading to a point at the tail.
    const attr = this.trail.geometry.getAttribute("position");
    for (let i = 0; i < TRAIL; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(TRAIL - 1, i + 1)];
      _toCam.subVectors(camera.position, pts[i]);
      const half = Math.max(COURT.ball.radius * 0.9, _toCam.length() * 0.005) * (i / (TRAIL - 1));
      _side.subVectors(b, a).cross(_toCam);
      if (_side.lengthSq() < 1e-12) _side.set(0, 0, 0);
      else _side.normalize().multiplyScalar(half);
      attr.setXYZ(i * 2, pts[i].x + _side.x, pts[i].y + _side.y, pts[i].z + _side.z);
      attr.setXYZ(i * 2 + 1, pts[i].x - _side.x, pts[i].y - _side.y, pts[i].z - _side.z);
    }
    attr.needsUpdate = true;
  }
}
