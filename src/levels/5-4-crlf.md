---
id: windows-got-here-first
chapter: 5
order: 4
kind: fix
checks: state
title: Windows got here first
---
A colleague wrote `backup.sh` on Windows and emailed it over. It copies `notes/` into `backup/`, but running it goes wrong:

```
$ bash backup.sh
backup.sh: line 2: $'\r': command not found
```

Fix `backup.sh` so that `bash backup.sh` works. Don't retype it: the commands in it are fine.

+++ setup
mkdir notes
echo "Buy milk" > notes/shopping.txt
echo "Call the plumber" > notes/todo.txt
echo "Ideas for the garden" > notes/garden.txt
printf '%s\r\n' '#!/bin/bash' '' '# Copy every note into backup/' 'mkdir -p backup' 'cp notes/*.txt backup/' 'echo "Backed up $(ls backup | wc -l) notes"' > backup.sh

+++ check
want='#!/bin/bash

# Copy every note into backup/
mkdir -p backup
cp notes/*.txt backup/
echo "Backed up $(ls backup | wc -l) notes"'
[ -f backup.sh ] || { echo "backup.sh is missing"; exit 1; }
[ -s backup.sh ] || { echo "backup.sh is empty. Did a > into the file you were reading empty it?"; exit 1; }
if grep -q $'\r' backup.sh; then
  echo "backup.sh still has $(grep -c $'\r' backup.sh) Windows line endings (\\r) in it"; exit 1
fi
[ "$(cat backup.sh)" = "$want" ] || { echo "backup.sh has changed more than its line endings: only the \\r characters need to go"; exit 1; }
d=$(mktemp -d); cp -r notes "$d"; cp backup.sh "$d"
out=$(cd "$d" && bash backup.sh 2>&1); rm -rf "$d"
[ "$out" = "Backed up 3 notes" ] || { echo "bash backup.sh printed: $out"; exit 1; }
exit 0

+++ solution
sed -i 's/\r$//' backup.sh

+++ tools
- `cat -A`: shows invisible characters. A line ending is `$`, and `^M` is a carriage return, `\r`
- `tr -d`: deletes characters as text streams through it
- `sed -i`, from earlier in this chapter

Remember Where did my data go? from chapter 4.

+++ steps
Look at what's really in the file: `cat -A backup.sh`

Every line ends `^M$`. Windows ends lines with two characters, `\r\n`; Linux uses just `\n`. bash reads the `\r` as part of each command.

---
`sed` can remove a `\r` at the end of each line, in place:

`sed -i 's/\r$//' backup.sh`

---
`cat -A backup.sh` again: no more `^M`. Try `bash backup.sh`, then press **Check**.

+++ debrief
**Carriage returns.** Old typewriters needed two moves to start a new line: return the carriage to the left (`\r`), then feed the paper up a line (`\n`). Windows still writes both; Linux and macOS write only `\n`. bash sees the `\r` as just another character, so `mkdir -p backup` became `mkdir -p backup\r`.

**Other ways to do it**

- `tr -d '\r' < backup.sh > fixed.sh && mv fixed.sh backup.sh`. Not `> backup.sh` directly: that empties it before `tr` reads it.
- `dos2unix backup.sh`, where it's installed. It isn't here.

**Spotting it.** `file backup.sh` says `with CRLF line terminators`. `nano` says `[ Converted from DOS format ]` when it opens one.

**Stop it happening.** Git can convert line endings for you: `git config core.autocrlf input`. Editors have a line-endings setting, often in the status bar.

+++ sheet
```bash
cat -A f                  # show hidden chars (^M is \r)
file f                    # "with CRLF line terminators"?
sed -i 's/\r$//' f        # Windows line endings to Linux
tr -d '\r' < f > f2       # the same, into a new file
tr a-z A-Z                # tr swaps characters
```

+++ tip
`$'\r': command not found` means Windows line endings. `cat -A` shows them as `^M`.
