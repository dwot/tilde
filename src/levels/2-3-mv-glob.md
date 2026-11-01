---
id: mv-glob
chapter: 2
order: 3
kind: lesson
checks: state
title: Tidy downloads
---
Move every `.jpg` in `downloads/` into `photos/`. Leave everything else where it is.

+++ setup
mkdir downloads photos
for f in "beach day.jpg" cat.jpg receipt.pdf IMG_2041.jpg song.mp3 notes.txt sunset.jpg; do echo "$f" > "downloads/$f"; done

+++ solution
mv downloads/*.jpg photos/

+++ check
fail=0
for f in "beach day.jpg" cat.jpg IMG_2041.jpg sunset.jpg; do
  [ -f "photos/$f" ] || { echo "photos/$f is missing"; fail=1; }
done
n=$(find downloads -name '*.jpg' | wc -l)
[ "$n" -eq 0 ] || { echo "downloads/ still has $n .jpg file(s)"; fail=1; }
for f in receipt.pdf song.mp3 notes.txt; do
  [ -f "downloads/$f" ] || { echo "downloads/$f should have stayed put"; fail=1; }
done
exit $fail

+++ tools
- `mv`: moves files (and renames them)
- `*`: a wildcard. The shell turns `*.jpg` into the name of every file ending in `.jpg` before the command runs.

Try `man mv`. To see what a wildcard matches without doing anything, put `echo` in front: `echo downloads/*`

+++ steps
Preview which files will move: `echo downloads/*.jpg`

You should see four, including `beach day.jpg`.

---
Move them: `mv downloads/*.jpg photos/`

When the last thing you give `mv` is a directory, it moves everything before it into that directory.

---
Make sure: `ls photos downloads`, then press **Check**.

+++ debrief
**The shell expands the wildcard, not `mv`.** `mv` receives a list of filenames. Each match is passed as a separate name, so `beach day.jpg` stays one file even with the space in it. Spaces in names only cause trouble when a name goes through an unquoted variable, which comes up in a later chapter.

**Preview first.** `echo` before a wildcard shows exactly what a command will touch. It's a good habit before `rm`.

**Options worth knowing**

- `mv -i`: ask before overwriting a file that's already there
- `mv -n`: never overwrite
- `mv -v`: print each move as it happens

**Gotchas**

- `*.jpg` doesn't match `PHOTO.JPG`. `*.[jJ][pP][gG]` matches both, or run `shopt -s nocaseglob` first.
- If nothing matches, bash passes `*.jpg` through as it is, and `mv` complains it can't find a file called `*.jpg`.

+++ sheet
```bash
mv old.txt new.txt     # rename
mv *.jpg photos/       # move matches into a directory
echo downloads/*.jpg   # preview what a wildcard matches
mv -i a.txt b.txt      # ask before overwriting
```

+++ tip
The shell expands `*` before the command runs, so `echo` in front shows exactly what will be touched.
