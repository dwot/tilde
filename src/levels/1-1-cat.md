---
id: cat
chapter: 1
order: 1
kind: lesson
checks: output
title: Have a look
---
There's a shopping list in this directory. Print what's in `notes.txt`.

+++ setup
words=(apples bread coffee eggs milk rice tea lemons)
RANDOM=$((VARIANT + 1))
{ echo "Shopping list"; for i in 1 2 3 4; do echo "- ${words[RANDOM % 8]}"; done; } > notes.txt
echo "nothing to see here" > old.txt

+++ solution
cat notes.txt

+++ tools
- `ls`: lists the files in a directory
- `cat`: prints a file's contents

Every command has a manual: try `man cat`. Press `q` to leave it.

+++ steps
See what's here: `ls`

You should see `notes.txt` and `old.txt`.

---
Print the list: `cat notes.txt`, then press **Check**.

+++ debrief
`cat` is short for *concatenate*: it prints each file you give it, one after another, so `cat notes.txt old.txt` prints both.

**For longer files**

- `less notes.txt` lets you scroll. Use the arrow keys, `/word` to search, and `q` to quit.
- `head notes.txt` and `tail notes.txt` print the first or last 10 lines.

**Options worth knowing**

- `cat -n`: number the lines
- `cat -A`: show hidden characters (a tab shows as `^I` and each line end as `$`), for when whitespace is acting strangely
- `ls -l`: the long listing, with sizes, dates and permissions
- `ls -a`: also show hidden files, the ones whose names start with `.`

+++ sheet
```bash
ls              # list the files here
ls -l           # ...with sizes, dates and permissions
cat notes.txt   # print a file
less notes.txt  # scroll through a long one (q quits)
```

+++ tip
`man <command>` opens the manual for any command. Inside it, `/word` searches and `q` quits.
