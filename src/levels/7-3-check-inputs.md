---
id: check-your-inputs
chapter: 7
order: 3
kind: lesson
checks: state
title: Check your inputs
---
`count-lines.sh` prints how many lines a file has: `bash count-lines.sh notes.txt` prints `3`. But give it nothing, or a file that isn't there, and it's no help at all.

Make it check its input first:

| Run as | Prints, on **standard error** | Exit code |
|---|---|---|
| `bash count-lines.sh` | `usage: count-lines.sh FILE` | 1 |
| `bash count-lines.sh nope.txt` | `count-lines.sh: no such file: nope.txt` | 2 |
| `bash count-lines.sh notes.txt` | (nothing; `3` on standard output) | 0 |

File names with spaces in them should work too.

+++ setup
printf 'one\ntwo\nthree\n' > notes.txt
printf 'a\nb\nc\nd\ne\n' > "my notes.txt"
cat > count-lines.sh <<'EOF'
#!/bin/bash
# Prints how many lines a file has.
wc -l < "$1"
EOF

+++ check
[ -f count-lines.sh ] || { echo "count-lines.sh is missing"; exit 1; }
fail=0
try() { # try <want stdout> <want stderr> <want code> <args...>
  local out=$1 err=$2 code=$3; shift 3
  local d; d=$(mktemp -d); cp count-lines.sh notes.txt "my notes.txt" "$d"; chown -R player "$d"
  local args=""; [ $# -gt 0 ] && args=$(printf ' %q' "$@")
  as_player "$d" "bash count-lines.sh$args > out 2> err; echo \$? > code"
  local got_out got_err got_code
  got_out=$(sed 's/^ *//' "$d/out"); got_err=$(cat "$d/err"); got_code=$(cat "$d/code"); rm -rf "$d"
  local run="bash count-lines.sh$args"
  if [ -n "$err" ] && [ -z "$got_err" ] && [ "$got_out" = "$err" ]; then
    echo "$run: the message should go to standard error (>&2), not standard output"; fail=1
  else
    [ "$got_out" = "$out" ] || { echo "$run printed \"$got_out\" on standard output, but should print ${out:-nothing}"; fail=1; }
    [ "$got_err" = "$err" ] || { echo "$run printed \"$got_err\" on standard error, but should print ${err:-nothing}"; fail=1; }
  fi
  [ "$got_code" = "$code" ] || { echo "$run exited with $got_code, but should exit with $code"; fail=1; }
}
try "" "usage: count-lines.sh FILE" 1
try "" "count-lines.sh: no such file: nope.txt" 2 nope.txt
try 3 "" 0 notes.txt
try 5 "" 0 "my notes.txt"
try "" "count-lines.sh: no such file: my nope.txt" 2 "my nope.txt"
exit $fail

+++ solution
#!/bin/bash
# Prints how many lines a file has.
if [ $# -eq 0 ]; then
  echo "usage: count-lines.sh FILE" >&2
  exit 1
fi
if [ ! -f "$1" ]; then
  echo "count-lines.sh: no such file: $1" >&2
  exit 2
fi
wc -l < "$1"

+++ tools
- `if [ test ]; then ... fi` runs commands only when the test passes
- `[ $# -eq 0 ]`: `$#` is how many arguments there are, and `-eq` compares numbers
- `[ ! -f "$1" ]`: `-f` is true for a file that exists; `!` turns it around
- `echo "..." >&2` prints on standard error
- `exit 1` stops the script, with that exit code

`help test` lists every test `[ ]` can do. After running anything, `echo $?` shows its exit code.

+++ steps
See what happens now: `bash count-lines.sh`, then `echo $?` for its exit code.

---
Open it with `nano count-lines.sh`. Before the `wc` line, add the first check:

```bash
if [ $# -eq 0 ]; then
  echo "usage: count-lines.sh FILE" >&2
  exit 1
fi
```

---
Then the second, for a file that isn't there. Quote `"$1"` so names with spaces stay whole:

```bash
if [ ! -f "$1" ]; then
  echo "count-lines.sh: no such file: $1" >&2
  exit 2
fi
```

---
Save and try every row of the table, with `echo $?` after each. `bash count-lines.sh 2>/dev/null` should print nothing at all. Press **Check**.

+++ debrief
**Exit codes.** Every command finishes with a number: 0 for success, anything else for failure. `if`, `&&` and `||` all go by it, so a script that exits 1 when it fails works with them: `count-lines.sh f || echo "didn't work"`.

**Errors on standard error.** Then `count=$(bash count-lines.sh f)` or `... | sort` get only the real output, and the message still reaches the screen.

**Why quote inside `[ ]`?** `[` is a command, and its arguments are split like any other's. `[ ! -f my notes.txt ]` gives it too many arguments: `[: too many arguments`. bash's `[[ ]]` is safer about that, but `"$1"` everywhere is the habit to keep.

**Tests worth knowing**

- `-d dir`: a directory exists; `-e`: anything exists; `-s`: a file isn't empty
- `-z "$s"`: a string is empty; `-n`: it isn't
- `"$a" = "$b"` compares text; `-eq -ne -lt -gt` compare numbers
- `[ ... ] && [ ... ]`: both

**`$0`** is the script's own name as it was run, so `usage: $0 FILE` keeps working if you rename it.

+++ sheet
```bash
if [ $# -eq 0 ]; then ...; fi   # no arguments given
[ -f "$f" ]       # file exists (-d: directory)
[ -z "$s" ]       # string is empty
echo "oops" >&2   # print on standard error
exit 1            # stop, with a failure code
echo $?           # the last command's exit code
```

+++ tip
Errors go to standard error (`>&2`), and a failing script exits with something other than 0.
