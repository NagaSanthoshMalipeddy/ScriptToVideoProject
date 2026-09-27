// One-off region builder (Natural Earth 50m) with internationally recognised borders:
// Crimea moved from Russia to Ukraine, and India replaced by the official outline.
// Usage: node pipeline/make_europe.mjs [out.json] [lonMin lonMax latMin latMax]
import fs from "node:fs";

const URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";
const TMP = "pipeline/_ne50.geojson";
const [outArg, ...win] = process.argv.slice(2);
const OUT = outArg ?? "src/warmap/europe.json";
const [lonMin, lonMax, latMin, latMax] = win.length === 4 ? win.map(Number) : [-30, 110, -40, 84];
const WIN = { lonMin, lonMax, latMin, latMax };

if (!fs.existsSync(TMP)) {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  fs.writeFileSync(TMP, Buffer.from(await res.arrayBuffer()));
}
const fc = JSON.parse(fs.readFileSync(TMP, "utf8"));

const rdp = (pts, eps) => {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  const e2 = eps * eps;
  while (stack.length) {
    const [s, e] = stack.pop();
    const [x1, y1] = pts[s], [x2, y2] = pts[e];
    const dx = x2 - x1, dy = y2 - y1, len = dx * dx + dy * dy || 1e-12;
    let idx = -1, max = 0;
    for (let i = s + 1; i < e; i++) {
      const t = Math.max(0, Math.min(1, ((pts[i][0] - x1) * dx + (pts[i][1] - y1) * dy) / len));
      const d = (pts[i][0] - x1 - t * dx) ** 2 + (pts[i][1] - y1 - t * dy) ** 2;
      if (d > max) { max = d; idx = i; }
    }
    if (max > e2 && idx > 0) { keep[idx] = 1; stack.push([s, idx], [idx, e]); }
  }
  return pts.filter((_, i) => keep[i]);
};
const round = (r) => r.map(([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const bbox = (polys) => {
  let a = [999, 999, -999, -999];
  for (const p of polys) for (const [x, y] of p[0]) a = [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)];
  return a;
};
const inWin = (b) => b[2] >= WIN.lonMin && b[0] <= WIN.lonMax && b[3] >= WIN.latMin && b[1] <= WIN.latMax;
const pip = ([px, py], ring) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const simplify = (polys, eps) =>
  polys
    .map((p) => p.slice(0, 1).map((r) => round(rdp(r, eps))))
    .filter((p) => p[0].length >= 4);

let out = [];
let crimea = null;
for (const f of fc.features) {
  const iso = f.properties.ADM0_A3 || f.properties.ISO_A3;
  let polys = polysOf(f.geometry);
  if (!polys.length || !inWin(bbox(polys))) continue;
  if (iso === "RUS") {
    const k = polys.findIndex((p) => pip([34.1, 44.95], p[0]));
    if (k >= 0) {
      crimea = polys[k];
      polys = polys.filter((_, i) => i !== k);
    }
  }
  out.push({ iso, polys });
}
if (!crimea) throw new Error("Crimea polygon not found inside RUS");
out.find((c) => c.iso === "UKR")?.polys.push(crimea);

const EPS = { UKR: 0.01, RUS: 0.03, BLR: 0.01, MDA: 0.01, POL: 0.015, ROU: 0.015, PRK: 0.006, KOR: 0.006, JPN: 0.015 };
const features = out
  .filter((c) => c.iso !== "IND")
  .map((c) => ({ iso: c.iso, geometry: { type: "MultiPolygon", coordinates: simplify(c.polys, EPS[c.iso] ?? 0.04) } }));
const ind = JSON.parse(fs.readFileSync("src/india/geo/IND.json", "utf8")).features[0].geometry;
features.push({ iso: "IND", geometry: ind });
const crimeaRing = round(rdp(crimea[0], 0.01));

fs.mkdirSync(OUT.replace(/[\\/][^\\/]+$/, ""), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ countries: features, crimea: crimeaRing }));
fs.unlinkSync(TMP);
const pts = features.reduce((n, f) => n + JSON.stringify(f.geometry.coordinates).split("],[").length, 0);
console.log(`countries ${features.length}  points ~${pts}  crimea pts ${crimeaRing.length}  size ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
