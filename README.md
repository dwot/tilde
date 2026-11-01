# Tilde

A calm, level-based course for shell and Linux command-line skills, sibling to Backtick. Each level gives you a
goal and a real bash shell: Linux runs in your browser under [v86](https://github.com/copy/v86), so nothing you type
leaves the page.

## Running it

```bash
npm install
npm run guest   # once, needs docker: builds the Linux guest and its snapshot into public/v86/
npm run dev
```

The `Dockerfile` does all the building, in stages: the guest (32-bit Alpine with bash, the GNU tools and man
pages, with the files in `image/`), flattened into v86's 9p format, then booted once in node
(`image/save-state.mjs`) to save a snapshot, so the page is playable a few seconds after load instead of after a
30-second boot. `npm run guest` exports just those files; a plain `docker build .` makes the whole site, served by
nginx (`deploy/nginx.conf`). `deploy/compose.yaml` runs that locally on port 8080.

## Testing

```bash
npm test                         # every level in Chrome, against the dev server (about 10 minutes)
npm test -- on-call disk-full    # just those levels
npm test -- --site site          # against a built site
```

Each level's `+++ solution` has to solve it, and `tests/scenarios.mjs` plays the traps: wrong answers that must be
rejected, and other right answers that must pass. A solution that starts `#!` is a script's contents, so its level
needs a scenario. Set `CHROME` if Chrome isn't at `/usr/bin/google-chrome`.

## Releasing

Pushing a `v*` tag runs `.github/workflows/release.yml`: it builds once, plays that build, publishes its source
(`image/sources.sh`) as a GitHub release, then deploys the same files to Cloudflare Pages. The release needs the
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.

## How it works

- **serial0** is the player's terminal (xterm.js), a bash login as `player` in `~/work`.
- **serial1** goes to `image/game-agent`, which runs bash scripts as root for the page: building a level's files,
  reading the player's history, running checks. Requests and replies are one base64 line each.
- **Output levels** rerun your last command on fresh copies of the files (bind-mounted at `~/work`, so even
  absolute paths work) and compare it line by line with the reference solution. They also run it on a second set
  of files, so `echo 17` doesn't pass for "count the errors".
- **State levels** run a check script against `~/work` once you've done the work.
- `~/work` and `/tmp` are tmpfs, mounted by the agent at boot: faster than 9p, and `du` sees real sizes there.
  A level's setup can start background processes with `setsid cmd </dev/null >/dev/null 2>&1 &`; resetting a
  level kills everything the player runs.

## Help and stars

Every level starts at ★★★. Help is optional and staged:

- **Toolbox** (caps at ★★): the commands you'll need, and where to read about them (`man`, `--help`).
- **Walkthrough** (caps at ★): the steps, revealed one at a time.
- **Debrief** (always, after solving): why it works, other ways to do it, options worth knowing, gotchas.

Help you've opened stays open until you solve the level, even if you start over.

## Writing levels

The course plan is `docs/curriculum.md`: 8 chapters of 4 lessons (some of them fix-its) and a boss. Levels live in
`src/levels/*.md`; file names are just for sorting, and order comes from the frontmatter. Levels open one after
another, and each solved lesson or fix-it adds its `sheet` to the cheat sheet (`#/sheet`).

```md
---
id: grep-count      # stable: progress is stored by id
chapter: 3
order: 1            # 1–4 lessons and fix-its, 5 the boss
kind: lesson        # lesson | fix | boss
checks: output      # output | state
variants: false     # optional: output checks skip the second set of files
anyorder: true      # optional: output checks ignore line order (find, grep -r)
title: Count the errors
---
The goal, in Markdown.

+++ setup
Bash that builds the files in ~/work, run as the player. $VARIANT is 0 for the copy you play in, 1 for the
second set of files output checks also try.

+++ solution
grep -c ERROR app.log

+++ check
State levels only: bash run as root in ~/work. Exit 0 to pass; lines it prints are shown as what's wrong.

+++ tools
+++ steps
One step per block, separated by --- lines.

+++ debrief
+++ sheet
Cheat sheet entry, usually a bash code block with comments. Keep lines under ~58 characters to fit the card.

+++ tip
Optional one-liner under the cheat sheet entry.
```

Output checks rerun the player's last command from the directory their shell is in, so `cd` then `cat file` works.
