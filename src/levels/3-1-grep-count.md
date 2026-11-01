---
id: grep-count
chapter: 3
order: 1
kind: lesson
checks: output
title: Count the errors
---
`app.log` has one line per request. Print **how many** lines contain `ERROR`, just the number.

+++ setup
levels=(INFO INFO INFO WARN ERROR DEBUG)
RANDOM=$((VARIANT + 7))
for i in $(seq 1 60); do
  printf '2026-10-%02d 12:%02d:%02d %-5s request %d\n' $((RANDOM % 28 + 1)) $((RANDOM % 60)) $((RANDOM % 60)) "${levels[RANDOM % 6]}" "$i"
done > app.log

+++ solution
grep -c ERROR app.log

+++ tools
- `grep`: prints the lines that match a pattern
- `wc`: counts lines, words and bytes

Try `grep --help` (it's long, so `grep --help | less`) or `man wc`.

+++ steps
Look at the matching lines first: `grep ERROR app.log`

---
Now count them instead of printing them: `grep -c ERROR app.log`

`-c` means count. Press **Check**.

+++ debrief
**Counts lines, not matches.** `grep -c` counts matching *lines*, so a line with ERROR on it twice counts once. To count every occurrence, use `grep -o ERROR app.log | wc -l`: `-o` prints each match on its own line.

**The general-purpose way.** `grep ERROR app.log | wc -l` works too. Piping into `wc -l` answers "how many lines?" for any command.

**Options worth knowing**

- `-i`: ignore case, so `error` and `Error` match too
- `-v`: invert, printing the lines that *don't* match
- `-w`: whole words only, so `ERROR` but not `ERRORS`
- `-n`: show line numbers

**A gotcha.** The pattern is a regular expression, so `grep 1.5` also matches `125`. Use `grep -F` to search for the text exactly as written.

+++ sheet
```bash
grep ERROR app.log        # lines that match
grep -c ERROR app.log     # how many lines match
grep -i error app.log     # ignore case
grep -v DEBUG app.log     # lines that don't match
grep -n ERROR app.log     # with line numbers
command | wc -l           # count the lines of any output
```

+++ tip
The pattern is a regular expression: `.` matches any character. `grep -F` searches for the text exactly.
