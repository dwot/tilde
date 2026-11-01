---
id: tail
chapter: 1
order: 4
kind: lesson
checks: output
title: The end of the log
---
The server stopped overnight. Print the **last 5 lines** of `server.log` to see what it said last.

+++ setup
RANDOM=$((VARIANT + 3))
paths=(/ /login /api/items /api/cart /static/app.js)
n=$((180 + VARIANT * 37))
for ((i = 1; i <= n; i++)); do
  printf '03:%02d:%02d INFO GET %s 200 %dms\n' $((i / 60 % 60)) $((i % 60)) "${paths[RANDOM % 5]}" $((RANDOM % 90 + 5))
done > server.log
mem=$((88 + VARIANT * 3))
{
  printf '04:12:40 WARN memory at %d%%\n' "$mem"
  printf '04:12:51 WARN memory at %d%%\n' $((mem + 5))
  printf '04:12:58 ERROR out of memory: killed worker %d\n' $((VARIANT + 2))
  echo "04:12:59 INFO shutting down"
  echo "04:13:00 INFO goodbye"
} >> server.log

+++ solution
tail -n 5 server.log

+++ tools
- `head`: prints the start of a file
- `tail`: prints the end
- `wc -l`: counts a file's lines

Both print 10 lines unless you say otherwise. `man tail` shows how.

+++ steps
See how long it is: `wc -l server.log`

Too long to read with `cat`.

---
Look at the end: `tail server.log` prints the last 10 lines.

---
Just the last 5: `tail -n 5 server.log`, then press **Check**.

+++ debrief
**`-n` picks how many lines**, for both `head` and `tail`. `tail -5` is an older short form that still works.

**Options worth knowing**

- `tail -f app.log`: keep watching and print new lines as they're written. <kbd>Ctrl</kbd>+<kbd>C</kbd> stops it. This is the one you'll use most on a real server.
- `tail -n +100 file`: everything from line 100 onwards
- `head -n 20 file | tail -n 5`: lines 16 to 20 (the `|` sends one command's output to the next: chapter 4)
- `less +G file`: open a long file in `less` already at the end

+++ sheet
```bash
head file.txt           # first 10 lines
head -n 3 file.txt      # first 3
tail -n 5 file.txt      # last 5
tail -f app.log         # follow new lines; Ctrl+C stops
wc -l file.txt          # how many lines
```

+++ tip
On a server, `tail -f` the log in one terminal while you try things in another.
