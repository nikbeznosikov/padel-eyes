// Court geometry in meters, from the FIP Rules of Padel 2026 ("The Court", "Enclosures").
// Puzzle coordinates: origin at the centre of the net, x across the court (positive = right
// when you face the net from your half), z along the court (negative = your half), y up.

export const COURT = {
  length: 20,
  width: 10,
  halfLength: 10,
  halfWidth: 5,
  serviceLineFromNet: 6.95,
  lineWidth: 0.05,
  // The centre service line runs from the net and a little past the service line.
  centerLineExtension: 0.2,
  net: { centerHeight: 0.88, endHeight: 0.92, postHeight: 1.05 },
  backWall: { glassHeight: 3, meshTop: 4 },
  // Side walls, "Variant 2 Crystal": 4 m of 3 m glass at each end, mesh above the glass only
  // on the last 2 m, mesh to 3 m in the middle 12 m.
  side: { glassLength: 4, glassHeight: 3, cornerMeshLength: 2, cornerMeshTop: 4, meshHeight: 3 },
  // Two openings per side at the net, split by a central post (FIP allows 0.72-1.10 m by 2.0-2.2 m).
  door: { width: 1.0, height: 2.1 },
  panelWidth: 2,
  ball: { radius: 0.0335 },
  eyeHeight: 1.68,
};

/** Net height at a given x, sagging from the ends to the centre. */
export function netHeightAt(x) {
  const t = Math.min(1, Math.abs(x) / COURT.halfWidth);
  return COURT.net.centerHeight + (COURT.net.endHeight - COURT.net.centerHeight) * t * t;
}

/** Glass height of the side wall at a given z (0 where the side wall is mesh only). */
export function sideGlassHeightAt(z) {
  return COURT.halfLength - Math.abs(z) <= COURT.side.glassLength ? COURT.side.glassHeight : 0;
}

/** Top of the whole side enclosure (glass plus mesh) at a given z. */
export function sideTopAt(z) {
  return COURT.halfLength - Math.abs(z) <= COURT.side.cornerMeshLength ? COURT.side.cornerMeshTop : COURT.side.meshHeight;
}

/** True where the side enclosure has a door opening (at the net) below the door height. */
export function isDoorOpening(z, y) {
  return Math.abs(z) <= COURT.door.width && Math.abs(z) > 0.04 && y <= COURT.door.height;
}
