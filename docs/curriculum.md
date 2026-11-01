# Curriculum

8 chapters × 5 levels: four lessons and a boss. Fix-its (something broken to repair) replace one lesson in
chapters 4–8 and carry the classic gotchas. Agreed 2026-10-26; written a chapter at a time, each played before the
next is started.

Checks: **O** output (prints the right thing), **S** state (leaves the files right).

## 1. Getting around
`pwd` `cd` `ls` `cat` `less` `head` `tail`, paths, Tab completion, hidden files

| # | Level | Check | Goal |
|---|---|---|---|
| 1 | Have a look | O | Print `notes.txt` |
| 2 | Down the rabbit hole | O | Print a file four directories deep among similar names (`cd`, relative paths, Tab) |
| 3 | Hidden in plain sight | O | Print the dotfile `ls` doesn't show (`ls -a`) |
| 4 | The end of the log | O | Last 5 lines of a long log (`tail -n`, `head`) |
| B | Treasure hunt | O | Follow clue files through directories (`..`, a hidden file, a clue on the last line of a long file) |

## 2. Files
`mkdir -p` `touch` `cp -r` `mv` `rm` `rmdir`, wildcards, `{a,b}`

| # | Level | Check | Goal |
|---|---|---|---|
| 1 | Scaffolding | S | Build a given project layout (`mkdir -p`, `touch`) |
| 2 | Back it up first | S | Copy files and a folder (`cp -r`, `cp config{,.bak}`) |
| 3 | Tidy downloads | S | Move the `.jpg`s with `*` |
| 4 | Clean slate | S | Delete `draft1`–`draft9`, keep `draft-final` (`?`, `[0-9]`, `rm -r`) |
| B | Moving day | S | Sort a messy folder into images/docs/music by extension, with spaces in names, unknowns left alone |

## 3. Searching
`grep` (`-c -v -i -r -l -n`, `^` `$`), `find` (`-name -type -mtime -size`)

| # | Level | Check | Goal |
|---|---|---|---|
| 1 | Count the errors | O | `grep -c` |
| 2 | Signal from noise | O | A config's settings without comments or blank lines (`grep -v`, `^`) |
| 3 | Where's that TODO? | O | Files under `src/` that mention TODO (`grep -rl`) |
| 4 | Temp files everywhere | S | `find -delete` |
| B | Who broke it? | O | Files changed in the last day that contain a string (`find -mtime` + `grep`) |

## 4. Pipes & redirection
`|` `>` `>>` `2>` `2>&1` `/dev/null` `tee`

| # | Level | Check | Goal |
|---|---|---|---|
| 1 | Save it for later | S | A listing to a file, then add a line (`>`, `>>`) |
| 2 | Quiet please | S | Search past unreadable directories: results in one file, errors discarded |
| 3 | Busiest visitors | O | `sort \| uniq -c` |
| F | Where did my data go? | S | `sort names.txt > names.txt` emptied it: restore from backup, sort properly (`sort -o`) |
| B | Daily report | S | `report.txt` from logs: header, counts, top 3, over several commands |

## 5. Text tools
`sort -t -k` `cut` `tr` `sed` `awk`, `diff` in debriefs

| # | Level | Check | Goal |
|---|---|---|---|
| 1 | By the numbers | O | Sort a CSV by its third column, numerically |
| 2 | Find and replace | S | `http://` → `https://` in place (`sed -i`) |
| 3 | Columns that add up | O | Total the bytes column for 404s only (awk condition + sum) |
| F | Windows got here first | S | `$'\r': command not found`: strip CRLF line endings |
| B | Payroll | O | Pay per department from a CSV, biggest first (awk arrays + `sort`) |

## 6. Variables, quoting & loops
`$(...)`, `'…'` vs `"…"`, `for`, `while read`, `${f%.ext}`, `$((…))`

| # | Level | Check | Goal |
|---|---|---|---|
| 1 | Fill in the blanks | O | "work has N files" with the real count (`$(...)`) |
| 2 | Say exactly this | O | A line with `$`, quotes and `!`, printed exactly (no variant check) |
| 3 | One at a time | S | Rename every `.jpeg` to `.jpg` (`for`, `${f%.jpeg}`, `"$f"`) |
| F | Spaces strike back | S | `for f in $(ls)` mangles names with spaces: fix with a wildcard and quotes |
| B | Batch job | S | A numbered directory per line of `list.txt` (`while read`, `$((i++))`) |

## 7. Scripts
shebang, `chmod +x`, `$1` `"$@"`, `if`/`[ ]`, exit codes, stderr, `set -euo pipefail`

| # | Level | Check | Goal |
|---|---|---|---|
| 1 | Your first script | S | `greet.sh` with `$1` |
| 2 | Run it like a program | S | Shebang, `chmod +x`, `./script`, `~/bin` on `PATH` |
| 3 | Check your inputs | S | Usage message to stderr and exit 1 when the argument is missing (several cases) |
| F | Brittle cleanup | S | Unquoted variables and an unchecked `cd` delete the wrong files: fix, with `set -euo pipefail` |
| B | Backup script | S | `backup.sh <dir>` → `backups/<name>-<date>.tar.gz`, keep the last 3, fail cleanly |

## 8. The system
`ls -l` `chmod`, `ps` `pgrep` `kill`, `du` `sort -h`, `export` `PATH` `alias` `~/.bashrc`

| # | Level | Check | Goal |
|---|---|---|---|
| F | Permission denied | S | A script needs to run, a secrets file should be owner-only (`chmod u+x`, `600`) |
| 2 | Runaway | S | Stop the CPU-eating process, leave the others (`ps`, `pgrep`, `kill`) |
| 3 | Disk full | O | The biggest directory (`du -sh * \| sort -h`) |
| 4 | Make it yours | S | An alias and a `PATH` entry in `~/.bashrc` that work in a new shell |
| B | On call | S | Kill a runaway process filling a log, gzip the log, fix a config's permissions, leave a note |

## Engine work this needs

- ~~Packages: `procps` (real `ps`/`pgrep`), GNU `tar`/`gzip`. (chapters 7–8)~~ Done.
- ~~`~/bin` on `PATH` for new shells once it exists, like most distros.~~ Done. (7.2)
- ~~Setup that starts background processes that outlive it.~~ Done: `setsid cmd </dev/null >/dev/null 2>&1 &`, and a level reset kills them. (8.2, 8.B)
- ~~`~/work` and `/tmp` on tmpfs~~, so `du` sees real sizes (9p doesn't report them). (8.3)
- ~~A clean copy of `.bashrc` at `/usr/local/share/tilde/bashrc`~~ for 8.4 to start from.
- ~~`variants: false` per level. (6.2)~~ Done.
- ~~`anyorder: true` per level, for `find` and `grep -r` output.~~ Done. (3.3, 3.B)
- ~~Dates for time-based checks.~~ Setup uses relative `touch -d '3 hours ago'`, and checks rebuild the files, so ages line up. (3.B, 7.B)

## Out of scope

Networking (`curl`, `ssh`): the guest has no network. A possible bonus chapter: `git`, `jq`, `vim`.
