---
id: brittle-cleanup
chapter: 7
order: 4
kind: fix
checks: state
title: Brittle cleanup
---
`clean-cache.sh` empties a cache directory: `bash clean-cache.sh "web cache"` should delete everything inside `web cache/`. But it has two bugs, and together they delete the **wrong files**. Try it, and look at what's left in `~/work`. (**Start over** brings everything back.)

Fix it so that:

- `bash clean-cache.sh "web cache"` empties `web cache/`, and nothing else
- given a directory that doesn't exist, it **stops with an error** and deletes nothing

+++ setup
mkdir -p "web cache/img" cache
for f in a b c; do echo cached > "web cache/$f.html"; echo cached > "cache/$f.tmp"; done
echo cached > "web cache/img/logo.png"
echo "My thesis. Do not lose." > thesis.txt
echo "Passwords hint: the cat's name" > reminders.txt
cat > clean-cache.sh <<'EOF'
#!/bin/bash
# Empty the cache directory named by $1 (cache, if there isn't one).
dir=${1:-cache}
cd $dir
rm -rf *
echo "Emptied $dir"
EOF

+++ check
[ -f clean-cache.sh ] || { echo "clean-cache.sh is gone: running it deleted everything in ~/work, itself included. Start over brings it all back"; exit 1; }
fail=0
fresh() {
  d=$(mktemp -d)
  mkdir -p "$d/web cache/img" "$d/cache"
  for f in a b c; do echo cached > "$d/web cache/$f.html"; echo cached > "$d/cache/$f.tmp"; done
  echo cached > "$d/web cache/img/logo.png"
  echo thesis > "$d/thesis.txt"; echo hint > "$d/reminders.txt"
  cp clean-cache.sh "$d"; chown -R player "$d"
}
safe() { # Everything outside the emptied directory is still there?
  for f in thesis.txt reminders.txt clean-cache.sh; do [ -f "$d/$f" ] || { echo "$1 deleted $f"; fail=1; return; }; done
}

fresh; as_player "$d" 'bash clean-cache.sh "web cache"' >/dev/null 2>&1
safe 'bash clean-cache.sh "web cache"'
[ -d "$d/web cache" ] || { echo "bash clean-cache.sh \"web cache\" deleted web cache/ itself: just empty it"; fail=1; }
[ -n "$(ls -A "$d/web cache" 2>/dev/null)" ] && { echo "bash clean-cache.sh \"web cache\" left files in web cache/"; fail=1; }
[ -f "$d/cache/a.tmp" ] || { echo "bash clean-cache.sh \"web cache\" emptied cache/ too"; fail=1; }
rm -rf "$d"

fresh; as_player "$d" 'bash clean-cache.sh nowhere > out 2> err; echo $? > code'
safe "bash clean-cache.sh nowhere"
[ -f "$d/web cache/a.html" ] && [ -f "$d/cache/a.tmp" ] || { echo "bash clean-cache.sh nowhere deleted cache files"; fail=1; }
[ "$(cat "$d/code" 2>/dev/null)" != 0 ] || { echo "bash clean-cache.sh nowhere should fail (exit with something other than 0), but exited with 0"; fail=1; }
grep -q "Emptied" "$d/out" 2>/dev/null && { echo "bash clean-cache.sh nowhere still said \"Emptied nowhere\""; fail=1; }
rm -rf "$d"

fresh; as_player "$d" 'bash clean-cache.sh' >/dev/null 2>&1
safe "bash clean-cache.sh"
[ -z "$(ls -A "$d/cache" 2>/dev/null)" ] && [ -d "$d/cache" ] || { echo "bash clean-cache.sh, with no argument, should still empty cache/"; fail=1; }
rm -rf "$d"
exit $fail

+++ solution
#!/bin/bash
# Empty the cache directory named by $1 (cache, if there isn't one).
set -euo pipefail
dir=${1:-cache}
cd "$dir"
rm -rf ./*
echo "Emptied $dir"

+++ tools
- `bash -x clean-cache.sh "web cache"` shows each command as it runs, from chapter 6
- `"$dir"`: quotes keep a name with a space in one piece
- `set -e` at the top of a script makes it stop at the first command that fails
- `cd "$dir" || exit 1` stops just there, if `cd` fails

Remember what an unquoted variable does to `web cache`.

+++ steps
Watch it go wrong, with `-x`: `bash -x clean-cache.sh "web cache"`

`cd $dir` became `cd web cache`: two arguments. `cd` failed, the script carried on in `~/work`, and `rm -rf *` emptied that instead. **Start over** to get the files back.

---
Bug one: quote the variable. In `nano clean-cache.sh`, change the `cd` line to:

`cd "$dir"`

---
Bug two: the script ignores the failed `cd`. Add this as the second line, under `#!/bin/bash`:

`set -euo pipefail`

Now any failing command stops the script.

---
Try `bash clean-cache.sh nowhere`: it should fail with an error and delete nothing. Then `bash clean-cache.sh "web cache"` and `ls -A "web cache"`. Press **Check**.

+++ debrief
**Unquoted variables plus an unchecked `cd` is how scripts delete the wrong files.** Either fix alone would have saved the day: the quotes make the `cd` work, and stopping on failure means `rm` never runs in the wrong place.

**`set -euo pipefail`**, often called strict mode:

- `-e`: stop when a command fails
- `-u`: stop when a script uses a variable that was never set, like a typo in `$dirr`. `${1:-cache}` gives a default, so it's fine.
- `-o pipefail`: a pipe fails if any part of it fails, not just the last

`-e` has blind spots: it doesn't stop for commands inside `if` tests or before `&&` and `||`. For something as dangerous as `rm`, an explicit `cd "$dir" || exit 1` is clearer still.

**`rm -rf ./*` rather than `rm -rf *`.** A file named `-r` or `--no-preserve-root` would be read as an option. `./*` makes every name start with `./`.

**Belt and braces.** `rm -rf "$dir"/*` doesn't need the `cd` at all, but if `$dir` were empty, it would become `rm -rf /*`. `set -u` and `${dir:?}` both guard against that: `${dir:?}` stops the script if `dir` is empty.

+++ sheet
```bash
set -euo pipefail    # stop on errors and unset variables
cd "$dir" || exit 1  # stop if cd fails
rm -rf ./*           # ./ so no name looks like an option
"${dir:?}"           # stop if dir is empty
```

+++ tip
Quote every variable, and never let a script carry on after a failed `cd`.
