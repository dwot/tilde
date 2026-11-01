---
id: save-it-for-later
chapter: 4
order: 1
kind: lesson
checks: state
title: Save it for later
---
Make a file called `contents.txt` that lists what's in `photos/`: the output of `ls photos`, one name per line.

Then add one more line to the **end** of it, without losing the rest:

```
END OF LIST
```

+++ setup
mkdir photos
touch photos/{beach,birthday-cake,cat-asleep,first-snow,garden-party,sunset}.jpg

+++ check
want=$( (ls photos; echo "END OF LIST") )
if [ ! -f contents.txt ]; then echo "contents.txt is missing"; exit 1; fi
have=$(cat contents.txt)
[ "$have" = "$want" ] && exit 0
n=$(wc -l < contents.txt)
if [ "$have" = "END OF LIST" ]; then
  echo "contents.txt only has END OF LIST in it: the listing was replaced. > starts the file again; >> adds to the end"
elif [ "$have" = "$(ls photos)" ]; then
  echo "the listing is there, but END OF LIST isn't on the end yet"
elif ! grep -qx "END OF LIST" contents.txt; then
  echo "contents.txt should end with a line that says exactly END OF LIST"
elif [ "$(tail -n 1 contents.txt)" != "END OF LIST" ]; then
  echo "END OF LIST should be the last line"
else
  echo "contents.txt has $n lines, but should be the 6 names from ls photos and then END OF LIST"
  grep -c "END OF LIST" contents.txt | grep -qx 1 || echo "END OF LIST is in there more than once"
fi
exit 1

+++ solution
ls photos > contents.txt
echo "END OF LIST" >> contents.txt

+++ tools
- `>` after a command sends its output into a file instead of to the screen
- `>>` does the same, but adds to the end of the file
- `echo`: prints its arguments

`cat contents.txt` shows you what you've made so far.

+++ steps
Send the listing into the file: `ls photos > contents.txt`

Nothing appears on screen: the output went into the file. `cat contents.txt` to see it.

---
Add the last line with `>>`, which adds to the end instead of starting the file again:

`echo "END OF LIST" >> contents.txt`

`cat contents.txt` again, then press **Check**.

+++ debrief
**`>` starts over, `>>` adds on.** `>` empties the file before the command even runs, so a second `>` throws away everything that was there. If you typed `>` by mistake, `ls photos > contents.txt` gets the listing back. A real file wouldn't be so easy to rebuild.

**Why `ls` printed one name per line.** When its output goes to a file or another command instead of the screen, `ls` lists one name per line, which is what other tools expect.

**Options worth knowing**

- `> file` on its own, with no command, makes an empty file (or empties one).
- `set -o noclobber` makes `>` refuse to overwrite a file that already exists. `>|` overrides it.
- `cat a.txt b.txt > both.txt` joins files into one.

+++ sheet
```bash
ls > list.txt          # output into a file (replaces it)
echo more >> list.txt  # add to the end of a file
cat a b > both         # join files
> empty.txt            # empty a file, or make one
```

+++ tip
`>` empties the file first, every time. Reach for `>>` when you're adding.
