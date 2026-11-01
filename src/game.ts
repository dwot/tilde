// Level setup and checking, on top of the Machine. No DOM here.
import type { Level } from "./levels";
import { q, type Machine } from "./vm";

/** Rebuild the level's files and start a fresh shell; resolves once that shell is at its prompt. */
export async function loadLevel(vm: Machine, level: Level) {
  const prompt = vm.nextPrompt();
  // player-shell waits while /var/game/resetting exists, so the respawned shell starts in the finished ~/work.
  await vm.run(`
touch /var/game/resetting
pkill -KILL -u player
rm -rf /home/player/work
install -d -o player -g player /home/player/work
: > /var/game/history
as_player /home/player/work ${q("VARIANT=0\n" + level.setup)}
rm -f /var/game/resetting`);
  await prompt;
}

/** Tell the guest the terminal's size, and let whatever is running redraw. */
export async function resize(vm: Machine, cols: number, rows: number) {
  await vm.run(`stty -F /dev/ttyS0 cols ${cols} rows ${rows}; pkill -WINCH -u player`);
}

export type Tile = "exact" | "close" | "missing";

export type CheckResult =
  | { kind: "no-command" }
  | { kind: "output"; command: string; dir: string; pass: boolean; tiles: Tile[]; expected: string[]; actual: string[]; extra: number; stderr: string; variantFailed: boolean }
  | { kind: "state"; pass: boolean; problems: string[] };

// The last command in the player's history, skipping ones that only tidy the screen.
const LAST_COMMAND = `awk '
function flush() { if (cmd != "" && cmd !~ /^[[:space:]]*(clear|history|reset)[[:space:]]*$/) last = cmd; cmd = "" }
/^#[0-9]+$/ { flush(); next }
{ cmd = cmd (cmd == "" ? "" : "\\n") $0 }
END { flush(); printf "%s", last }' /var/game/history`;

/**
 * Build the level's files fresh in a scratch dir and run `command` there as the player, as if in ~/work.
 * `dir` is where under ~/work to run it: wherever the player's shell was when they ran it.
 */
function runFresh(vm: Machine, level: Level, variant: number, command: string, dir = "") {
  return vm.run(`
d=$(mktemp -d); chown player:player "$d"
as_player "$d" ${q(`VARIANT=${variant}\n` + level.setup)} >/dev/null 2>&1
in_work "$d" ${q(command)} ${q(dir)}
rc=$?; rm -rf "$d"; exit $rc`);
}

// What the reference solution prints for each level and variant. The files are built the same way every time.
const expectedCache = new Map<string, string[]>();
async function expected(vm: Machine, level: Level, variant: number) {
  const key = `${level.id}:${variant}`;
  if (!expectedCache.has(key)) expectedCache.set(key, outputLines(level, (await runFresh(vm, level, variant, level.solution)).stdout));
  return expectedCache.get(key)!;
}

const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
const lines = (s: string) => {
  const out = stripAnsi(s).split("\n").map((l) => l.trimEnd());
  while (out.length && out[out.length - 1] === "") out.pop();
  return out;
};
const outputLines = (level: Level, s: string) => (level.anyOrder ? lines(s).sort() : lines(s));
// uniq -c pads its counts, and nobody should lose a star over spacing.
const loose = (l: string) => l.trim().replace(/\s+/g, " ");

function compare(expected: string[], actual: string[]) {
  const tiles: Tile[] = expected.map((e, i) =>
    actual[i] === undefined ? "missing" : loose(actual[i]) === loose(e) ? "exact" : "close",
  );
  const extra = Math.max(0, actual.length - expected.length);
  return { tiles, extra, pass: extra === 0 && tiles.every((t) => t === "exact") };
}

export async function check(vm: Machine, level: Level): Promise<CheckResult> {
  if (level.checks === "state") {
    const r = await vm.run(`cd /home/player/work && ${level.check}`);
    return { kind: "state", pass: r.code === 0, problems: lines(r.stdout) };
  }

  // First line: where the player's shell is. The rest: their last command.
  const out = (await vm.run(`player_dir; echo; ${LAST_COMMAND}`)).stdout;
  const dir = out.slice(0, out.indexOf("\n"));
  const command = out.slice(out.indexOf("\n") + 1);
  if (!command.trim()) return { kind: "no-command" };

  const want0 = await expected(vm, level, 0);
  const got0 = await runFresh(vm, level, 0, command, dir);
  const actual = outputLines(level, got0.stdout);
  const main = compare(want0, actual);

  let variantFailed = false;
  if (main.pass && level.variants) {
    const want1 = await expected(vm, level, 1);
    const got1 = outputLines(level, (await runFresh(vm, level, 1, command, dir)).stdout);
    variantFailed = !compare(want1, got1).pass;
  }

  return {
    kind: "output",
    command,
    dir,
    pass: main.pass && !variantFailed,
    tiles: main.tiles,
    expected: want0,
    actual,
    extra: main.extra,
    stderr: stripAnsi(got0.stderr).trim(),
    variantFailed,
  };
}
