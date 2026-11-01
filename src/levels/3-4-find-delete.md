---
id: find-delete
chapter: 3
order: 4
kind: lesson
checks: state
title: Temp files everywhere
---
Something left `.tmp` files all through `project/`, in every subdirectory. Delete all of them, and nothing else.

+++ setup
mkdir -p project/src project/docs/drafts
touch project/README.md project/src/main.sh project/src/cache.tmp project/docs/guide.md \
  "project/docs/drafts/my notes.tmp" project/build.tmp project/docs/drafts/outline.md

+++ solution
find project -name '*.tmp' -delete

+++ check
fail=0
left=$(find project -name '*.tmp')
[ -z "$left" ] || { echo "still here:"; echo "$left"; fail=1; }
for f in README.md src/main.sh docs/guide.md docs/drafts/outline.md; do
  [ -f "project/$f" ] || { echo "project/$f was deleted too"; fail=1; }
done
exit $fail

+++ tools
- `find`: searches a directory and everything inside it, and can match by name, type, size or age
- `find`'s `-name` test takes a wildcard pattern, and `-delete` deletes what it found

`man find` is long: type `/-delete` inside it to jump to the part you need. `tree project` shows the whole layout.

+++ steps
List them first: `find project -name '*.tmp'`

The quotes matter. They stop the shell expanding `*.tmp` itself, so `find` gets the pattern.

---
Once the list looks right, add `-delete` to the end:

`find project -name '*.tmp' -delete`

---
Run the first command again. It should print nothing. Press **Check**.

+++ debrief
**Why `rm project/*.tmp` isn't enough.** A wildcard only matches inside one directory. `find` goes down into every subdirectory.

**Why the quotes.** Without them, if the directory you're in has a `.tmp` file, the shell replaces `*.tmp` with that name before `find` runs, and `find` searches for the wrong thing.

**Other ways to do it**

- `find project -name '*.tmp' -exec rm {} +` runs any command on the results, not just delete.
- `shopt -s globstar` lets `**` match any depth: `rm project/**/*.tmp`

**Options worth knowing**

- `-type f`: files only (`-type d` for directories)
- `-iname`: like `-name`, ignoring case
- `-mtime +7`: changed more than 7 days ago
- `-maxdepth 1`: don't go into subdirectories

**A gotcha.** Put `-delete` last. `find` works through its arguments left to right, so `find project -delete -name '*.tmp'` deletes everything.

+++ sheet
```bash
find . -name '*.tmp'           # by name, at any depth
find . -name '*.tmp' -delete   # ...and delete them
find . -type d                 # directories (f: files)
find . -iname '*.jpg'          # ignoring case
find . -name '*.log' -exec rm {} +   # run any command
```

+++ tip
Run it without `-delete` first and read the list. Quote the pattern so the shell doesn't expand it.
