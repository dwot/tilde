// Plays the course in Chrome: each level's own solution has to solve it, and each trap in scenarios.mjs has to behave.
//   npm test                     every level, against the dev server (run `npm run guest` first)
//   npm test -- on-call disk-full  just those levels
//   npm test -- --site site      against a built site instead
import { spawn } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { Failure, start } from "./lib.mjs";
import { scenarios } from "./scenarios.mjs";

const args = process.argv.slice(2);
const siteAt = args.indexOf("--site");
const site = siteAt >= 0 ? args.splice(siteAt, 2)[1] : null;

const levels = readdirSync("src/levels").filter((f) => f.endsWith(".md")).sort().map((file) => {
  const text = readFileSync(`src/levels/${file}`, "utf8");
  return { id: text.match(/^id: (.+)$/m)[1], solution: text.match(/\n\+\+\+ solution\n([\s\S]*?)\n\+\+\+ /)[1].trim() };
});
const ids = levels.map((l) => l.id);
for (const id of [...args, ...Object.keys(scenarios)]) if (!ids.includes(id)) throw new Error(`no level called ${id}`);
const chosen = args.length ? levels.filter((l) => args.includes(l.id)) : levels;

const port = 5198;
const base = `http://localhost:${port}/`;
const server = site ? serve(site) : spawn("npx", ["vite", "--port", String(port), "--strictPort"], { stdio: "ignore", detached: true });
for (let i = 0; i < 100; i++) {
  if (await fetch(base).then(() => true, () => false)) break;
  await new Promise((r) => setTimeout(r, 200));
}

// Plain files, as the real host sends them: `vite preview` compresses the guest's files and the VM never answers.
function serve(dir) {
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".wasm": "application/wasm", ".json": "application/json" };
  return createServer(async (request, response) => {
    const path = decodeURIComponent(new URL(request.url, base).pathname);
    const file = join(dir, normalize(path.endsWith("/") ? path + "index.html" : path));
    try {
      const body = await readFile(file);
      // On a real connection the snapshot arrives well after a player can open a level.
      if (file.endsWith(".zst")) await new Promise((r) => setTimeout(r, 2000));
      response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  }).listen(port);
}

const failures = [];
async function attempt(t, name, run) {
  const began = Date.now();
  try {
    await run();
    if (t.errors.length) throw new Failure(`page error: ${t.errors.splice(0).join("; ")}`);
    console.log(`ok    ${name} (${((Date.now() - began) / 1000).toFixed(1)}s)`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.log(`FAIL  ${name}: ${error.message}`);
  }
}

const t = await start(base, ids);
for (const level of chosen) {
  // A solution that starts #! is the contents of a script rather than something to type: scenarios.mjs covers those.
  const typeable = !level.solution.startsWith("#!");
  if (typeable) await attempt(t, `${level.id}: solution`, async () => {
    await t.play(level.id);
    await t.reset();
    for (const line of level.solution.split("\n")) await t.type(line);
    await t.solved("its own solution");
  });
  if (scenarios[level.id]) {
    await attempt(t, `${level.id}: traps`, async () => {
      await t.play(level.id);
      await t.reset();
      await scenarios[level.id](t);
    });
  }
}
await t.browser.close();
site ? server.close() : process.kill(-server.pid);

console.log(failures.length ? `\n${failures.length} failed:\n${failures.join("\n")}` : `\nAll ${chosen.length} levels pass.`);
process.exit(failures.length ? 1 : 0);
