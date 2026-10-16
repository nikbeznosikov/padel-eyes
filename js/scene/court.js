import * as THREE from "three";
import { COURT, netHeightAt } from "../court.js";
import { meshTexture, netTexture, turfTextures } from "./textures.js";

const L = COURT.halfLength;
const W = COURT.halfWidth;
const FRAME = new THREE.MeshStandardMaterial({ color: "#15181b", metalness: 0.5, roughness: 0.45 });

/** The whole court and the indoor hall around it, in three.js world space (your half is +z). */
export function buildCourt() {
  const g = new THREE.Group();
  g.add(hall(), turf(), lines(), net(), walls());
  return g;
}

function turf() {
  const { map, bumpMap } = turfTextures();
  map.repeat.set(COURT.width, COURT.length);
  bumpMap.repeat.set(COURT.width, COURT.length);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(COURT.width, COURT.length),
    new THREE.MeshStandardMaterial({ map, bumpMap, bumpScale: 0.6, roughness: 0.95, metalness: 0 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

function lines() {
  const g = new THREE.Group();
  g.position.y = 0.004;
  const mat = new THREE.MeshStandardMaterial({ color: "#f4f6f8", roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 });
  const s = COURT.serviceLineFromNet;
  for (const z of [s, -s]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(COURT.width, COURT.lineWidth), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.z = z;
    m.receiveShadow = true;
    g.add(m);
  }
  const c = new THREE.Mesh(new THREE.PlaneGeometry(COURT.lineWidth, (s + COURT.centerLineExtension) * 2), mat);
  c.rotation.x = -Math.PI / 2;
  c.receiveShadow = true;
  g.add(c);
  return g;
}

function net() {
  const g = new THREE.Group();
  const segs = 60;
  const mesh = new THREE.PlaneGeometry(COURT.width, 1, segs, 1);
  const tape = new THREE.PlaneGeometry(COURT.width, 1, segs, 1);
  const p = mesh.attributes.position;
  const q = tape.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const top = p.getY(i) > 0;
    const h = netHeightAt(p.getX(i));
    p.setY(i, top ? h - 0.05 : 0.04);
    q.setY(i, top ? h : h - 0.055);
  }
  mesh.computeVertexNormals();
  tape.computeVertexNormals();
  const alpha = netTexture();
  alpha.repeat.set(COURT.width / 0.045, COURT.net.centerHeight / 0.045);
  g.add(new THREE.Mesh(mesh, new THREE.MeshStandardMaterial({ color: "#0d0f10", alphaMap: alpha, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, roughness: 0.9 })));
  const t = new THREE.Mesh(tape, new THREE.MeshStandardMaterial({ color: "#f2f2f2", side: THREE.DoubleSide, roughness: 0.7 }));
  t.castShadow = true;
  g.add(t);
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(COURT.width, 0.04, 0.012), new THREE.MeshStandardMaterial({ color: "#111" }));
  bottom.position.y = 0.02;
  g.add(bottom);
  for (const x of [-W + 0.04, W - 0.04]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, COURT.net.postHeight, 0.08), FRAME);
    post.position.set(x, COURT.net.postHeight / 2, 0);
    post.castShadow = true;
    g.add(post);
  }
  return g;
}

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: "#d9efe9",
  transparent: true,
  opacity: 0.16,
  roughness: 0.03,
  metalness: 0,
  reflectivity: 0.6,
  envMapIntensity: 1.6,
  side: THREE.DoubleSide,
  depthWrite: false,
});
const glassEdge = new THREE.MeshStandardMaterial({ color: "#7fb7a6", transparent: true, opacity: 0.7 });

function glass(x, z, w, h, alongX) {
  const g = new THREE.Group();
  g.position.set(x, h / 2, z);
  g.rotation.y = alongX ? 0 : Math.PI / 2;
  const pane = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, h, 0.012), glassMaterial);
  pane.renderOrder = 2;
  // Green-tinted edge, visible when the panel is seen side on.
  const edge = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.012, 0.013), glassEdge);
  edge.position.y = h / 2 - 0.006;
  g.add(pane, edge);
  return g;
}

function fence(x, y0, y1, z, w, alongX, tex) {
  const h = y1 - y0;
  const t = tex.clone();
  t.repeat.set(w / 0.5, h / 0.5);
  t.needsUpdate = true;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, metalness: 0.5, roughness: 0.5, depthWrite: false }),
  );
  m.position.set(x, y0 + h / 2, z);
  m.rotation.y = alongX ? 0 : Math.PI / 2;
  m.renderOrder = 1;
  return m;
}

function post(x, z, h) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, h, 0.07), FRAME);
  m.position.set(x, h / 2, z);
  m.castShadow = true;
  return m;
}

function rail(x, y, z, w, alongX) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.05), FRAME);
  m.position.set(x, y, z);
  m.rotation.y = alongX ? 0 : Math.PI / 2;
  m.castShadow = true;
  return m;
}

function walls() {
  const g = new THREE.Group();
  const tex = meshTexture(10);
  const S = COURT.side;
  const D = COURT.door;
  const pw = COURT.panelWidth;
  const backPanels = Array.from({ length: COURT.width / pw }, (_, i) => -W + pw / 2 + i * pw);
  const glassStart = L - S.glassLength;
  const sideGlass = Array.from({ length: S.glassLength / pw }, (_, i) => L - pw / 2 - i * pw);
  const meshPosts = Array.from({ length: Math.floor(glassStart / pw) }, (_, i) => (i + 1) * pw).filter((z) => z < glassStart);

  for (const end of [1, -1]) {
    // Back wall: 3 m glass, 1 m mesh above.
    for (const x of backPanels) g.add(glass(x, end * L, pw, COURT.backWall.glassHeight, true));
    g.add(fence(0, COURT.backWall.glassHeight, COURT.backWall.meshTop, end * L, COURT.width, true, tex));
    g.add(rail(0, COURT.backWall.meshTop, end * L, COURT.width, true));
    g.add(rail(0, COURT.backWall.glassHeight, end * L, COURT.width, true));
    for (const x of [...backPanels.map((x) => x - pw / 2), W]) g.add(post(x, end * L, COURT.backWall.meshTop));

    for (const sx of [1, -1]) {
      // Side glass at the end, mesh above it only on the last 2 m.
      for (const z of sideGlass) g.add(glass(sx * W, end * z, pw, S.glassHeight, false));
      g.add(fence(sx * W, S.glassHeight, S.cornerMeshTop, end * (L - S.cornerMeshLength / 2), S.cornerMeshLength, false, tex));
      g.add(rail(sx * W, S.cornerMeshTop, end * (L - S.cornerMeshLength / 2), S.cornerMeshLength, false));
      g.add(rail(sx * W, S.glassHeight, end * (L - S.glassLength / 2), S.glassLength, false));
      g.add(post(sx * W, end * (L - S.cornerMeshLength), S.cornerMeshTop));
      g.add(post(sx * W, end * glassStart, S.meshHeight));
      // Side mesh from the glass to the door.
      const meshLen = glassStart - D.width;
      g.add(fence(sx * W, 0, S.meshHeight, (end * (glassStart + D.width)) / 2, meshLen, false, tex));
      g.add(rail(sx * W, S.meshHeight, (end * (glassStart + D.width)) / 2, meshLen, false));
      for (const z of meshPosts) g.add(post(sx * W, end * z, S.meshHeight));
      // Door opening at the net, mesh above it.
      g.add(fence(sx * W, D.height, S.meshHeight, (end * D.width) / 2, D.width, false, tex));
      g.add(rail(sx * W, D.height, (end * D.width) / 2, D.width, false));
      g.add(post(sx * W, end * D.width, S.meshHeight));
    }
  }
  // Central post between the two doors on each side.
  for (const sx of [1, -1]) g.add(post(sx * W, 0, S.meshHeight));
  return g;
}

/** Indoor club hall: light walls, a darker band, steel trusses and LED panels. */
function hall() {
  const g = new THREE.Group();
  const HX = 14;
  const HZ = 21;
  const HH = 10;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: "#59626b", roughness: 0.92 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.06;
  floor.receiveShadow = true;
  g.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: "#cdd3d9", roughness: 0.9 });
  const bandMat = new THREE.MeshStandardMaterial({ color: "#2d3a46", roughness: 0.9 });
  for (const [x, z, rot, w] of [[0, -HZ, 0, HX * 2], [0, HZ, Math.PI, HX * 2], [-HX, 0, Math.PI / 2, HZ * 2], [HX, 0, -Math.PI / 2, HZ * 2]]) {
    const wall = new THREE.Group();
    wall.position.set(x, 0, z);
    wall.rotation.y = rot;
    const upper = new THREE.Mesh(new THREE.PlaneGeometry(w, HH), wallMat);
    upper.position.y = HH / 2;
    const band = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.5), bandMat);
    band.position.set(0, 0.75, 0.02);
    wall.add(upper, band);
    g.add(wall);
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(HX * 2, HZ * 2), new THREE.MeshStandardMaterial({ color: "#d9dde1", roughness: 0.95 }));
  ceiling.position.y = HH;
  ceiling.rotation.x = Math.PI / 2;
  g.add(ceiling);
  const trussMat = new THREE.MeshStandardMaterial({ color: "#7d868f", metalness: 0.4, roughness: 0.6 });
  for (const z of [-15, -10, -5, 0, 5, 10, 15]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(28, 0.35, 0.18), trussMat);
    t.position.set(0, 9.2, z);
    g.add(t);
  }
  const ledMat = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
  for (const x of [-3.2, 3.2]) {
    for (const z of [-7.5, -2.5, 2.5, 7.5]) {
      const led = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), ledMat);
      led.position.set(x, 8.9, z);
      led.rotation.x = Math.PI / 2;
      g.add(led);
    }
  }
  return g;
}

/** A soft studio-like environment so the glass has something to reflect. */
export function buildEnvironment(renderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color("#9aa5b0");
  const bright = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 4) });
  for (const x of [-3.2, 3.2]) {
    for (const z of [-7.5, -2.5, 2.5, 7.5]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), bright);
      p.position.set(x, 8.9, z);
      p.rotation.x = Math.PI / 2;
      env.add(p);
    }
  }
  const soft = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 1.15, 1.2), side: THREE.DoubleSide });
  for (const [x, z, ry, w] of [[0, -21, 0, 28], [0, 21, Math.PI, 28], [-14, 0, Math.PI / 2, 42], [14, 0, -Math.PI / 2, 42]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 8), soft);
    p.position.set(x, 4, z);
    p.rotation.y = ry;
    env.add(p);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  return tex;
}
