---
id: spaces-strike-back
chapter: 6
order: 4
kind: fix
checks: state
title: Spaces strike back
---
`make-backups.sh` is supposed to make a `.bak` copy of every `.txt` file in `docs/`. It works for most of them, but run it and look:

```
$ bash make-backups.sh
cp: cannot stat 'meeting': No such file or directory
...
```

Fix the script so it backs up **every** `.txt` file, whatever its name. The check runs your script on a fresh copy of `docs/`.

+++ setup
mkdir docs
echo "Agenda" > docs/agenda.txt
echo "Notes from Monday" > "docs/meeting notes.txt"
echo "Q3 numbers" > "docs/q3 report final.txt"
echo "Ideas" > docs/ideas.txt
cat > make-backups.sh <<'EOF'
#!/bin/bash
# Make a .bak copy of every .txt file in docs/
cd docs
for f in $(ls *.txt); do
  cp $f $f.bak
done
echo "Backed up $(ls *.bak | wc -l) files"
EOF

+++ check
[ -f make-backups.sh ] || { echo "make-backups.sh is missing"; exit 1; }
d=$(mktemp -d); mkdir "$d/docs"
echo "Agenda" > "$d/docs/agenda.txt"
echo "Notes from Monday" > "$d/docs/meeting notes.txt"
echo "Q3 numbers" > "$d/docs/q3 report final.txt"
echo "Ideas" > "$d/docs/ideas.txt"
cp make-backups.sh "$d"
out=$(cd "$d" && timeout 10 bash make-backups.sh 2>&1)
fail=0
for f in agenda "meeting notes" "q3 report final" ideas; do
  if [ ! -f "$d/docs/$f.txt.bak" ]; then echo "no backup made of docs/$f.txt"; fail=1
  elif ! cmp -s "$d/docs/$f.txt" "$d/docs/$f.txt.bak"; then echo "docs/$f.txt.bak isn't a copy of docs/$f.txt"; fail=1; fi
done
junk=$(cd "$d/docs" && ls | grep -v '\.txt$' | grep -v '\.txt\.bak$')
[ -n "$junk" ] && { echo "the script also made files it shouldn't:"; echo "$junk"; fail=1; }
[ $fail = 1 ] && [ -n "$out" ] && { echo "it printed:"; echo "$out" | head -5; }
rm -rf "$d"
exit $fail

+++ solution
#!/bin/bash
# Make a .bak copy of every .txt file in docs/
cd docs
for f in *.txt; do
  cp "$f" "$f.bak"
done
echo "Backed up $(ls *.bak | wc -l) files"

+++ tools
- `nano make-backups.sh` edits the script. `Ctrl+O` then `Enter` saves, `Ctrl+X` quits.
- Or `sed -i`, from chapter 5
- `bash -x make-backups.sh` runs it and prints every command, after the shell has expanded it

Two lines are wrong. Running it with `-x` shows you exactly what `cp` was given.

+++ steps
Watch it run: `bash -x make-backups.sh`

The `for` line splits `meeting notes.txt` into `meeting` and `notes.txt`. `$(ls ...)` hands back one long piece of text, and the shell splits it at every space.

---
A wildcard gives whole file names, spaces and all. Open the script with `nano make-backups.sh` and change the `for` line to:

`for f in *.txt; do`

---
The `cp` line splits names again, the same way. Quote both: `cp "$f" "$f.bak"`

Save with `Ctrl+O`, `Enter`, and quit with `Ctrl+X`.

---
Try it: `bash make-backups.sh`, then `ls docs`. Press **Check**.

+++ debrief
**Word splitting.** When an unquoted `$(...)` or `$var` is expanded, the shell splits the result at spaces, tabs and newlines. `$(ls *.txt)` came back as `agenda.txt ideas.txt meeting notes.txt ...`, and the loop got `meeting` and `notes.txt` as separate names.

**Wildcards don't split.** `*.txt` expands to whole file names, however odd. So `for f in *.txt` is right, and `for f in $(ls ...)` is a bug waiting for a file name with a space.

**And quote the variable.** Even with whole names in `$f`, `cp $f $f.bak` splits them again. `"$f"` keeps each name in one piece.

**Debugging scripts.** `bash -x script.sh`, or `set -x` inside a script, prints every command as it runs, after expansion. It's the quickest way to see what a command was really given.

**If a list really does come from a command,** read it a line at a time: `find docs -name '*.txt' | while read -r f; do cp "$f" "$f.bak"; done`. The boss is about `while read`.

+++ sheet
```bash
for f in *.txt; do         # right: whole names
for f in $(ls *.txt); do   # WRONG: splits at spaces
cp "$f" "$f.bak"           # quote every "$var"
bash -x script.sh          # show each command as it runs
```

+++ tip
Never loop over `$(ls)`: use a wildcard, and quote `"$f"`.
