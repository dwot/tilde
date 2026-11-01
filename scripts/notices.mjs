// Writes dist/third-party.txt: the licence of every npm package that can end up in the bundle, since the
// minifier drops their notices.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const header = process.argv[2] ?? "";
const dirs = execFileSync("npm", ["ls", "--omit=dev", "--all", "--parseable"], { encoding: "utf8", maxBuffer: 1 << 24 })
  .trim().split("\n").slice(1);

const seen = new Map();
for (const dir of dirs) {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const file = readdirSync(dir).find((f) => /^(licen[cs]e|copying|notice)(\.|$)/i.test(f));
  const text = file ? readFileSync(join(dir, file), "utf8").trim() : `(no licence file in the package; package.json says ${pkg.license})`;
  seen.set(`${pkg.name} ${pkg.version}`, `${pkg.license ?? "unknown"}\n\n${text}`);
}

const out = [...seen].sort(([a], [b]) => a.localeCompare(b)).map(([name, body]) => `${"=".repeat(78)}\n${name}: ${body}\n`);
if (!existsSync("dist")) throw new Error("run after vite build");
writeFileSync("dist/third-party.txt", `${header}${header && "\n\n"}Open source used in this site\n\n${out.join("\n")}`);
