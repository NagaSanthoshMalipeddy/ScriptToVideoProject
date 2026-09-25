// One-off: simplify the datameet official India boundary (includes PoK + Aksai Chin)
// down to a low-poly outline and write it as src/india/geo/IND.json.
import fs from "node:fs";

const SRC = "src/india/geo/_india_official.geojson";
const OUT = "src/india/geo/IND.json";

const fc = JSON.parse(fs.readFileSync(SRC, "utf8"));

// Collect every polygon's outer ring from the MultiPolygon.
const polys = [];
for (const f of fc.features) {
  const g = f.geometry;
  if (g.type === "Polygon") polys.push(g.coordinates[0]);
  else if (g.type === "MultiPolygon") for (const p of g.coordinates) polys.push(p[0]);
}

const ringArea = (r) => {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] * r[i][1] - r[i][0] * r[j][1]);
  return Math.abs(a / 2);
};

// Ramer–Douglas–Peucker on lon/lat.
const rdp = (pts, eps) => {
  if (pts.length < 3) return pts;
  const d2 = (p, a, b) => {
    const [x, y] = p, [x1, y1] = a, [x2, y2] = b;
    const dx = x2 - x1, dy = y2 - y1;
    const len = dx * dx + dy * dy || 1e-12;
    let t = ((x - x1) * dx + (y - y1) * dy) / len;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t * dx, py = y1 + t * dy;
    return (x - px) ** 2 + (y - py) ** 2;
  };
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  const e2 = eps * eps;
  while (stack.length) {
    const [s, e] = stack.pop();
    let idx = -1, max = 0;
    for (let i = s + 1; i < e; i++) {
      const dd = d2(pts[i], pts[s], pts[e]);
      if (dd > max) { max = dd; idx = i; }
    }
    if (max > e2 && idx !== -1) { keep[idx] = true; stack.push([s, idx], [idx, e]); }
  }
  return pts.filter((_, i) => keep[i]);
};

// Pick the mainland (largest) polygon and simplify it.
polys.sort((a, b) => ringArea(b) - ringArea(a));
let ring = polys[0];
let eps = 0.03;
let simplified = rdp(ring, eps);
while (simplified.length > 320 && eps < 1) { eps *= 1.3; simplified = rdp(ring, eps); }
// Round to 3 decimals to keep the file small.
simplified = simplified.map(([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
if (simplified[0][0] !== simplified[simplified.length - 1][0] || simplified[0][1] !== simplified[simplified.length - 1][1]) {
  simplified.push(simplified[0]);
}

const out = {
  type: "FeatureCollection",
  features: [{ type: "Feature", properties: { name: "India (official)" }, geometry: { type: "Polygon", coordinates: [simplified] } }],
};
fs.writeFileSync(OUT, JSON.stringify(out));
let mnx = 999, mxx = -999, mny = 999, mxy = -999;
for (const [x, y] of simplified) { mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y); }
console.log(`points ${simplified.length}  lon ${mnx.toFixed(2)}..${mxx.toFixed(2)}  lat ${mny.toFixed(2)}..${mxy.toFixed(2)}  eps ${eps.toFixed(3)}`);
