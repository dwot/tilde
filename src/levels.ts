export type LevelKind = "lesson" | "fix" | "boss";

export const KIND_LABELS: Record<LevelKind, string> = { lesson: "Lesson", fix: "Fix-it", boss: "Boss" };

/** A level's text sections are Markdown; setup, solution and check are bash. */
export interface Level {
  id: string;
  chapter: number;
  /** 1–4 lessons and fix-its, 5 the boss. */
  order: number;
  kind: LevelKind;
  title: string;
  /**
   * output: your last command is rerun, from the directory you ran it in, on fresh copies of the files, and must
   *         print what `solution` prints.
   * state:  `check` runs as root in ~/work once you've done the work; it exits 0 to pass, and any lines it prints
   *         are shown as what's still wrong.
   */
  checks: "output" | "state";
  /** Output checks also try a second set of files (see `setup`), unless that would make no sense for the level. */
  variants: boolean;
  /** Output checks ignore line order, for commands like `find` and `grep -r` whose order depends on the tool. */
  anyOrder: boolean;
  goal: string;
  /**
   * Builds the level's files in ~/work, run as the player. It sees $VARIANT: 0 is the copy you play in; 1 is a
   * second set of files that output checks also run your command on, so hard-coding the answer doesn't pass.
   */
  setup: string;
  solution: string;
  check: string;
  /** Help, stage 1: the commands you'll need. Opening it caps the level at two stars. */
  tools: string;
  /** Help, stage 2: one step at a time. Opening it caps the level at one star. */
  steps: string[];
  /** Shown after solving: why it works, alternatives, options, gotchas. */
  debrief: string;
  /** Cheat sheet entry this level adds once solved (lessons and fix-its): Markdown, usually a code block. */
  sheet: string;
  /** Optional one-line note under the cheat sheet entry. */
  tip: string;
}

export interface Chapter {
  n: number;
  title: string;
  blurb: string;
}

export const chapters: Chapter[] = [
  { n: 1, title: "Getting around", blurb: "Looking at files, moving between directories, and the files ls doesn't show." },
  { n: 2, title: "Files", blurb: "Making, copying, moving and deleting, and wildcards that do it in bulk." },
  { n: 3, title: "Searching", blurb: "grep for what's inside files, find for the files themselves." },
  { n: 4, title: "Pipes & redirection", blurb: "Chaining commands together, and sending output where you want it." },
  { n: 5, title: "Text tools", blurb: "Sorting, cutting, replacing and adding up with sort, sed and awk." },
  { n: 6, title: "Variables, quoting & loops", blurb: "Doing it once for every file, and quoting so spaces don't bite." },
  { n: 7, title: "Scripts", blurb: "Saving commands as programs: arguments, checks and exit codes." },
  { n: 8, title: "The system", blurb: "Permissions, processes, disk space and making the shell your own." },
];

/**
 * Level files: frontmatter (id, chapter, order, kind, checks, title, and optionally `variants: false` and
 * `anyorder: true`), then the
 * goal, then `+++ setup` / `+++ solution` / `+++ check` / `+++ tools` / `+++ steps` / `+++ debrief` / `+++ sheet` /
 * `+++ tip` sections. Steps are separated by `---` lines.
 */
export function parseLevel(src: string): Level {
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(src);
  if (!fm) throw new Error("Level is missing frontmatter");
  const meta: Record<string, string> = {};
  for (const line of fm[1].split("\n")) {
    const m = /^(\w+):\s*(.*)$/.exec(line);
    if (m) meta[m[1]] = m[2].trim();
  }
  const [goal, ...rest] = src.slice(fm[0].length).split(/^\+\+\+ (\w+)[ \t]*$/m);
  const sections: Record<string, string> = {};
  for (let i = 0; i < rest.length; i += 2) sections[rest[i]] = rest[i + 1].trim();

  return {
    id: meta.id,
    chapter: Number(meta.chapter),
    order: Number(meta.order),
    kind: meta.kind === "boss" || meta.kind === "fix" ? meta.kind : "lesson",
    title: meta.title,
    checks: meta.checks === "state" ? "state" : "output",
    variants: meta.variants !== "false",
    anyOrder: meta.anyorder === "true",
    goal: goal.trim(),
    setup: sections.setup ?? ":",
    solution: sections.solution ?? "",
    check: sections.check ?? "",
    tools: sections.tools ?? "",
    steps: (sections.steps ?? "").split(/^---$/m).map((s) => s.trim()).filter(Boolean),
    debrief: sections.debrief ?? "",
    sheet: sections.sheet ?? "",
    tip: sections.tip ?? "",
  };
}

const files = import.meta.glob("./levels/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

/** Every level, in course order. */
export const levels: Level[] = Object.values(files)
  .map(parseLevel)
  .sort((a, b) => a.chapter - b.chapter || a.order - b.order);

export const levelById = (id: string) => levels.find((l) => l.id === id);

/** Levels open in order: each one once the written level before it is solved. */
export function isUnlocked(level: Level, stars: (id: string) => number): boolean {
  const i = levels.indexOf(level);
  return i === 0 || stars(levels[i - 1].id) > 0;
}
