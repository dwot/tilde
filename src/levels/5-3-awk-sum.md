---
id: columns-that-add-up
chapter: 5
order: 3
kind: lesson
checks: output
title: Columns that add up
---
Every line in `access.log` ends with the status code and the number of bytes sent:

```
10.0.0.7 - - [26/Oct/2026:10:04:12 +0000] "GET /blog HTTP/1.1" 200 5120
```

Print the **total bytes** sent for requests with status **404**, as a single number.

+++ setup
pages=(/ /blog /about /404-help /shop /old-page /missing.png)
RANDOM=$((VARIANT + 21))
for i in $(seq 1 80); do
  p=${pages[RANDOM % 7]}
  case $p in /old-page|/missing.png) code=404 ;; *) code=200 ;; esac
  ((RANDOM % 15 == 0)) && code=404
  bytes=$((RANDOM % 9000 + 100))
  ((i == 17)) && bytes=4040
  printf '10.0.0.%d - - [26/Oct/2026:10:%02d:%02d +0000] "GET %s HTTP/1.1" %d %d\n' $((RANDOM % 20)) $((i / 2)) $((RANDOM % 60)) "$p" $code $bytes
done > access.log

+++ solution
awk '$9 == 404 { total += $10 } END { print total }' access.log

+++ tools
- `awk`: splits each line into fields, `$1`, `$2` and so on, and runs a little program on each line
- An awk program is `pattern { action }`: the action runs on lines that match the pattern
- `END { ... }` runs once, after the last line

Try `awk '{ print $9 }' access.log` to see what's in field 9.

+++ steps
Count the fields. Splitting on spaces, the status is field 9 and the bytes are field 10:

`awk '{ print $9, $10 }' access.log`

---
Only the 404s: put a pattern in front of the action.

`awk '$9 == 404 { print $10 }' access.log`

---
Add them up as you go, and print the total at the end:

`awk '$9 == 404 { total += $10 } END { print total }' access.log`

`total` starts at 0 by itself. Press **Check**.

+++ debrief
**Why not `grep 404`?** It matches `404` anywhere on the line: the page `/404-help`, which loads fine, and a response that happened to be 4040 bytes. awk's `$9 == 404` asks about the status column only.

**How awk sees a line.** Fields are split on runs of spaces and tabs, so `$1` is the IP and `$NF` is the last field (`NF` is the number of fields). `-F,` splits on commas instead, for CSV files.

**Patterns worth knowing**

- `$9 >= 500`: comparisons
- `/blog/`: lines matching a regular expression, like grep
- `$7 ~ /^\/blog/`: one field matching
- `NR > 1`: every line but the first (`NR` is the line number), handy for skipping a header

**Making numbers readable.** `END { printf "%.1f MB\n", total / 1048576 }` formats like C's printf.

+++ sheet
```bash
awk '{ print $1, $3 }' f       # fields 1 and 3
awk -F, '{ print $2 }' f.csv   # split on commas
awk '$9 == 404' f              # where field 9 is 404
awk '{ t += $2 } END { print t }' f   # total column 2
awk 'NR > 1' f                 # skip the first line
awk '{ print $NF }' f          # the last field
```

+++ tip
`pattern { action }`: the action runs on matching lines. `END { }` runs once, at the end.
