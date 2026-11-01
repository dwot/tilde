/** How much help you've opened on a level: none, the toolbox, or the walkthrough. */
export type Help = 0 | 1 | 2;

/** An unfinished level. Kept until you solve it, so starting over doesn't clear the help you've seen. */
export interface Attempt {
  help: Help;
  /** Walkthrough steps revealed so far. */
  step: number;
}

export interface State {
  /** Best stars per level id (absent = not solved). */
  stars: Record<string, number>;
  attempts: Record<string, Attempt>;
}

export const starsFor = (help: Help) => 3 - help;

const KEY = "tilde:v1";

export function loadState(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { stars: {}, attempts: {}, ...JSON.parse(raw) };
  } catch {
    // private mode or corrupt data: start fresh
  }
  return { stars: {}, attempts: {} };
}

export function saveState(state: State): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable: progress just won't persist
  }
}
