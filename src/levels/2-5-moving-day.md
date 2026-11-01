---
id: moving-day
chapter: 2
order: 5
kind: boss
checks: state
title: Moving day
---
Everything you've downloaded for months is in `inbox/`. Sort it into three new directories in `~/work`:

- `images/` for `.jpg` and `.png` files
- `docs/` for `.pdf` and `.txt` files
- `music/` for `.mp3` files

Anything else stays in `inbox/`. Look carefully: not every file name is as tidy as it should be.

+++ setup
mkdir inbox
for f in "beach day.jpg" cat.png "holiday 2025.JPG" scan-001.png \
         "tax return.pdf" notes.txt "letter to gran.txt" manual.pdf \
         song.mp3 "Road Trip Mix.mp3" "podcast ep 12.mp3" \
         setup.exe archive.zip README; do
  echo "$f" > "inbox/$f"
done

+++ check
fail=0
want() {
  local dir=$1; shift
  for f in "$@"; do [ -f "$dir/$f" ] || { echo "$dir/$f is missing"; fail=1; }; done
}
want images "beach day.jpg" cat.png "holiday 2025.JPG" scan-001.png
want docs "tax return.pdf" notes.txt "letter to gran.txt" manual.pdf
want music song.mp3 "Road Trip Mix.mp3" "podcast ep 12.mp3"
want inbox setup.exe archive.zip README
for d in images docs music inbox; do
  [ -d "$d" ] || continue
  n=$(find "$d" -type f | wc -l)
  case $d in images|docs) want_n=4 ;; music|inbox) want_n=3 ;; esac
  [ "$n" -gt "$want_n" ] && { echo "$d/ has $n files, but should have $want_n"; fail=1; }
done
exit $fail

+++ solution
mkdir images docs music
mv inbox/*.jpg inbox/*.JPG inbox/*.png images/
mv inbox/*.pdf inbox/*.txt docs/
mv inbox/*.mp3 music/

+++ tools
Everything from this chapter:

- `mkdir`, `mv`, `ls`
- `*` and `echo` to preview what it matches
- Optional: braces, `*.{jpg,png}`

+++ steps
Look at what you're dealing with: `ls inbox`

Spot the one that won't match `*.jpg`.

---
Make the three directories: `mkdir images docs music`

---
Preview the images: `echo inbox/*.jpg inbox/*.JPG inbox/*.png`

Wildcards care about capitals, so `holiday 2025.JPG` needs its own `*.JPG`.

---
Move them: `mv inbox/*.jpg inbox/*.JPG inbox/*.png images/`

---
The same for the others: `mv inbox/*.pdf inbox/*.txt docs/` and `mv inbox/*.mp3 music/`

---
`ls inbox` should show only `README`, `archive.zip` and `setup.exe`. Press **Check**.

+++ debrief
**Capitals matter.** `*.jpg` doesn't match `.JPG`. Phones and cameras often save `.JPG`, so it's worth looking with `ls` before you trust a wildcard.

**Shorter with braces**: `mv inbox/*.{jpg,JPG,png} images/` expands to the three wildcards in one go.

**Ignore case for a while**: `shopt -s nocaseglob` makes wildcards ignore capitals until you turn it off with `shopt -u nocaseglob`.

**Spaces were fine.** Each file a wildcard matches reaches `mv` as one name, spaces and all. Spaces only cause trouble when names go through unquoted variables, which comes up in chapter 6.

**When there's nothing to match**, bash passes the pattern on unchanged, and `mv` complains that `inbox/*.flac` doesn't exist. Nothing is harmed, but it's confusing the first time.
