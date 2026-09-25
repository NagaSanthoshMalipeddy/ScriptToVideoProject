import fs from "node:fs";

const raw = JSON.parse(fs.readFileSync("logos_raw.json", "utf-8"));
const lines = [
  "// Baked brand glyphs (24x24 viewBox paths) from simple-icons. Trademarks belong to their owners.",
  "export const BRAND_GLYPHS: Record<string, { hex: string; path: string }> = {",
];
for (const k of Object.keys(raw)) {
  lines.push(`  ${k}: { hex: "#${raw[k].hex}", path: ${JSON.stringify(raw[k].path)} },`);
}
lines.push("};", "");
fs.writeFileSync("src/cartoon/logos.ts", lines.join("\n"));
console.log("wrote src/cartoon/logos.ts with", Object.keys(raw).join(", "));
