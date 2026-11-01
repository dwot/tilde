---
id: one-at-a-time
chapter: 6
order: 3
kind: lesson
checks: state
title: One at a time
---
The camera saved its photos in `camera/` as `.jpeg`. Rename **every** `.jpeg` file to end in `.jpg` instead, keeping the rest of each name the same: `IMG 001.jpeg` becomes `IMG 001.jpg`.

Leave the other files alone.

+++ setup
mkdir camera
for n in 001 002 003 004 005; do echo "photo $n" > "camera/IMG $n.jpeg"; done
echo "a beach" > camera/beach.jpeg
echo "not a photo" > camera/jpeg-settings.txt
echo "already right" > camera/cover.jpg

+++ check
fail=0
left=$(find camera -name '*.jpeg')
[ -n "$left" ] && { echo "still .jpeg:"; echo "$left"; fail=1; }
for n in "IMG 001" "IMG 002" "IMG 003" "IMG 004" "IMG 005" beach cover; do
  [ -f "camera/$n.jpg" ] || { echo "camera/$n.jpg is missing"; fail=1; }
done
[ "$(cat "camera/IMG 003.jpg" 2>/dev/null)" = "photo 003" ] || { [ $fail = 0 ] && { echo "camera/IMG 003.jpg isn't the photo it should be"; fail=1; }; }
[ -f camera/jpeg-settings.txt ] || { echo "camera/jpeg-settings.txt was renamed or deleted: it should stay"; fail=1; }
extra=$(find camera -type f ! -name '*.jpg' ! -name jpeg-settings.txt)
[ -n "$extra" ] && { echo "unexpected files:"; echo "$extra"; fail=1; }
exit $fail

+++ solution
for f in camera/*.jpeg; do mv "$f" "${f%.jpeg}.jpg"; done

+++ tools
- `for f in camera/*.jpeg; do ...; done` runs the commands between `do` and `done` once per file, with `$f` set to each name in turn
- `${f%.jpeg}` is `$f` with `.jpeg` taken off the end
- `mv`, from chapter 2

Why not `mv camera/*.jpeg camera/*.jpg`? Try `echo mv camera/*.jpeg camera/*.jpg` to see what that would really run.

+++ steps
Try the loop with `echo` first, so it only prints what it would do:

`for f in camera/*.jpeg; do echo "$f"; done`

---
`${f%.jpeg}` chops `.jpeg` off the end. Add `.jpg` back on:

`for f in camera/*.jpeg; do echo mv "$f" "${f%.jpeg}.jpg"; done`

---
Looks right? Take the `echo` out to do it for real. The quotes matter: `IMG 001.jpeg` has a space in it.

`for f in camera/*.jpeg; do mv "$f" "${f%.jpeg}.jpg"; done`

`ls camera`, then press **Check**.

+++ debrief
**Why one `mv` can't do it.** The shell expands `camera/*.jpg` before `mv` runs, to the `.jpg` files that already exist. `mv` never sees a pattern, so there's nothing for it to "rename to". Renaming many files means one `mv` per file: a loop.

**Quote your variables.** Without quotes, `mv $f ...` with `$f` set to `camera/IMG 001.jpeg` gives `mv` two arguments, `camera/IMG` and `001.jpeg`. `"$f"` keeps it as one. Quoting every variable is the habit that saves you.

**Trimming names**

- `${f%.jpeg}`: remove `.jpeg` from the end
- `${f#camera/}`: remove `camera/` from the start
- `${f%.*}`: remove any extension
- `${f/IMG/photo}`: replace the first `IMG` with `photo`

**Echo first.** Putting `echo` in front of the real command shows you every command the loop would run. Take it out once the list looks right.

**On several lines.** In a script, the same loop reads more easily as:

```bash
for f in camera/*.jpeg; do
  mv "$f" "${f%.jpeg}.jpg"
done
```

+++ sheet
```bash
for f in *.txt; do echo "$f"; done   # once per file
mv "$f" "${f%.jpeg}.jpg"   # .jpeg to .jpg
${f#dir/}                  # remove dir/ from the start
${f%.*}                    # remove the extension
for i in {1..5}; do ...    # 1 to 5
```

+++ tip
Put `echo` in front of the command inside a loop to see what it would do. Always quote `"$f"`.
