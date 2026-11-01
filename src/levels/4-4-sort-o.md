---
id: where-did-my-data-go
chapter: 4
order: 4
kind: fix
checks: state
title: Where did my data go?
---
Somebody wanted `names.txt` in alphabetical order, so they ran:

```bash
sort names.txt > names.txt
```

Now `names.txt` is empty. Luckily there's a copy from yesterday, `names.bak`.

Put the names back in `names.txt`, **sorted**. Leave `names.bak` as it is.

+++ setup
printf '%s\n' Priya Tom Aiko Mateo Zara Olu Bea Kofi Lena Diego Ines Sam > names.bak
: > names.txt

+++ check
want=$(sort names.bak)
fail=0
[ -f names.bak ] || { echo "names.bak has gone: keep the backup"; exit 1; }
[ "$(md5sum < names.bak)" = "$(printf '%s\n' Priya Tom Aiko Mateo Zara Olu Bea Kofi Lena Diego Ines Sam | md5sum)" ] ||
  { echo "names.bak has changed: it should stay as it was"; fail=1; }
if [ ! -f names.txt ]; then echo "names.txt is missing"; fail=1
elif [ ! -s names.txt ]; then echo "names.txt is still empty. Did the same trick empty it again?"; fail=1
elif [ "$(cat names.txt)" != "$want" ]; then
  if [ "$(sort names.txt)" = "$want" ]; then echo "names.txt has all the names, but not in order"
  else echo "names.txt should have the 12 names from names.bak, sorted"; fi
  fail=1
fi
exit $fail

+++ solution
sort names.bak > names.txt

+++ tools
- `sort`: sorts lines, and can write the result into a file itself with `-o`
- `>`, from the first level of this chapter

Before you run anything, work out what went wrong: when does `>` empty the file?

+++ steps
Here's what happened. The shell sets up `> names.txt` *before* it runs `sort`, and setting it up empties the file. By the time `sort` opens `names.txt`, there's nothing left to sort.

---
So read from one file and write to another. The backup is a different file:

`sort names.bak > names.txt`

---
`cat names.txt` to see the result. `cat names.bak` should still show the names in their old order. Press **Check**.

+++ debrief
**Never read and write the same file in one command.** `>` empties its file before the command starts, so `sort f > f`, `grep x f > f` and `cat f > f` all leave you with an empty file. It's an easy way to lose data.

**`sort -o`.** `sort -o names.txt names.txt` *is* safe: `sort` reads everything in first, then writes the file itself. So `cp names.bak names.txt` followed by `sort -o names.txt names.txt` works too.

**For other commands.** Write to a new file, then replace the old one: `grep -v Tom names.txt > tmp && mv tmp names.txt`. The `&&` means "only if the first part worked", so a failed `grep` doesn't clobber anything. Chapter 6 covers `&&`.

**Keep backups.** `cp names.txt names.bak` before an experiment costs nothing.

+++ sheet
```bash
sort f > f              # DON'T: empties f
sort -o f f             # sort a file in place, safely
cmd f > tmp && mv tmp f # rewrite a file with any cmd
```

+++ tip
`>` empties its file before the command runs, so never read from the file you're writing to.
