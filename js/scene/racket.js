import * as THREE from "three";

// Round padel racket within FIP limits (45.5 cm long, 26 cm wide, 38 mm thick).
// Built standing up: the end of the handle is at the origin, the head points up +y.
const LENGTH_HANDLE = 0.14;
const THROAT_TOP = 0.205;
const HEAD_RX = 0.13;
const HEAD_RY = 0.13;
const HEAD_CY = THROAT_TOP + HEAD_RY - 0.012;
const THICK = 0.036;

let cache = null;

function geometries() {
  if (cache) return cache;
  const head = new THREE.Shape();
  head.absellipse(0, HEAD_CY, HEAD_RX, HEAD_RY, 0, Math.PI * 2, false, 0);
  // Holes of about 11 mm in a staggered grid, kept away from the rim.
  for (let r = -5; r <= 5; r++) {
    for (let c = -5; c <= 5; c++) {
      const x = c * 0.022 + (r % 2 ? 0.011 : 0);
      const y = HEAD_CY + r * 0.02;
      if ((x / (HEAD_RX - 0.03)) ** 2 + ((y - HEAD_CY) / (HEAD_RY - 0.03)) ** 2 > 1) continue;
      const hole = new THREE.Path();
      hole.absarc(x, y, 0.0055, 0, Math.PI * 2, true);
      head.holes.push(hole);
    }
  }
  const throat = new THREE.Shape();
  throat.moveTo(-0.022, LENGTH_HANDLE);
  throat.lineTo(0.022, LENGTH_HANDLE);
  throat.lineTo(0.1, THROAT_TOP + 0.02);
  throat.lineTo(-0.1, THROAT_TOP + 0.02);
  throat.closePath();
  const tri = new THREE.Path();
  tri.moveTo(0, LENGTH_HANDLE + 0.025);
  tri.lineTo(-0.045, THROAT_TOP + 0.005);
  tri.lineTo(0.045, THROAT_TOP + 0.005);
  tri.closePath();
  throat.holes.push(tri);
  const opts = { depth: THICK, bevelEnabled: true, bevelSize: 0.005, bevelThickness: 0.005, bevelSegments: 2, curveSegments: 40 };
  const headGeo = new THREE.ExtrudeGeometry(head, opts);
  const throatGeo = new THREE.ExtrudeGeometry(throat, opts);
  headGeo.translate(0, 0, -THICK / 2);
  throatGeo.translate(0, 0, -THICK / 2);
  const handle = new THREE.CylinderGeometry(0.017, 0.016, LENGTH_HANDLE, 12);
  handle.translate(0, LENGTH_HANDLE / 2, 0);
  cache = { headGeo, throatGeo, handle };
  return cache;
}

/** A racket mesh group; `rim` colours the frame. */
export function buildRacket(rim = "#e8c547") {
  const { headGeo, throatGeo, handle } = geometries();
  const face = new THREE.MeshStandardMaterial({ color: "#23262b", roughness: 0.45, metalness: 0.25 });
  const frame = new THREE.MeshStandardMaterial({ color: rim, roughness: 0.4, metalness: 0.2 });
  const grip = new THREE.MeshStandardMaterial({ color: "#f1f1f1", roughness: 0.8 });
  const g = new THREE.Group();
  // Extrude groups: 0 = the flat faces, 1 = the sides (the rim).
  const h = new THREE.Mesh(headGeo, [face, frame]);
  const t = new THREE.Mesh(throatGeo, [face, frame]);
  const hd = new THREE.Mesh(handle, grip);
  for (const m of [h, t, hd]) m.castShadow = true;
  g.add(h, t, hd);
  return g;
}
