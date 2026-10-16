import * as THREE from "three";
function canvas(size) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  return { c, ctx };
}
// Small deterministic random so textures look the same on every load.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
/** Blue artificial turf with fibres and a little silica sand. One tile covers 1 m. */
export function turfTextures(base = "#1f5fae") {
  const size = 512;
  const color = canvas(size);
  const bump = canvas(size);
  const r = rng(7);
  color.ctx.fillStyle = base;
  color.ctx.fillRect(0, 0, size, size);
  bump.ctx.fillStyle = "#808080";
  bump.ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 9000; i++) {
    const x = r() * size;
    const y = r() * size;
    const len = 3 + r() * 7;
    const ang = -Math.PI / 2 + (r() - 0.5) * 1.2;
    const light = 0.82 + r() * 0.36;
    color.ctx.strokeStyle = shade(base, light);
    color.ctx.globalAlpha = 0.55;
    color.ctx.lineWidth = 1;
    color.ctx.beginPath();
    color.ctx.moveTo(x, y);
    color.ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    color.ctx.stroke();
    const g = Math.floor(100 + r() * 120);
    bump.ctx.strokeStyle = `rgb(${g},${g},${g})`;
    bump.ctx.beginPath();
    bump.ctx.moveTo(x, y);
    bump.ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    bump.ctx.stroke();
  }
  color.ctx.globalAlpha = 1;
  // Sand grains between the fibres.
  for (let i = 0; i < 2500; i++) {
    color.ctx.fillStyle = `rgba(210,190,150,${0.08 + r() * 0.12})`;
    color.ctx.fillRect(r() * size, r() * size, 1.2, 1.2);
  }
  const map = new THREE.CanvasTexture(color.c);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bump.c);
  for (const t of [map, bumpMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
  }
  return { map, bumpMap };
}
/** Square welded wire mesh, one texture tile = `cells` mesh cells. */
export function meshTexture(cells = 10) {
  const size = 256;
  const { c, ctx } = canvas(size);
  ctx.clearRect(0, 0, size, size);
  const step = size / cells;
  ctx.strokeStyle = "rgba(20,22,24,1)";
  ctx.lineWidth = 2.2;
  for (let i = 0; i <= cells; i++) {
    const p = i * step;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
/** Net alpha map: alphaMap reads brightness, so cords are white and holes dark grey (a faint veil). */
export function netTexture() {
  const size = 128;
  const { c, ctx } = canvas(size);
  ctx.fillStyle = "rgb(40,40,40)";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgb(255,255,255)";
  ctx.lineWidth = 12;
  ctx.strokeRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
/** Soft round glow used to keep the ball visible at a distance. */
export function glowTexture() {
  const size = 64;
  const { c, ctx } = canvas(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(235,255,120,0.9)");
  g.addColorStop(0.35, "rgba(220,255,90,0.35)");
  g.addColorStop(1, "rgba(220,255,90,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * k));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * k));
  const b = Math.min(255, Math.round((n & 255) * k));
  return `rgb(${r},${g},${b})`;
}
/** Text label drawn to a canvas: a circle for one letter, a rounded pill otherwise. */
export function labelTexture(text, bg, fg) {
  const h = 96;
  const font = `700 ${Math.round(h * 0.52)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = font;
  const w = text.length === 1 ? h : Math.ceil(probe.measureText(text).width + h * 0.7);
  const { c, ctx } = canvasWH(w, h);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(2, 2, w - 4, h - 4, (h - 4) / 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { texture: t, aspect: w / h };
}
function canvasWH(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d") };
}
