---
id: hidden
chapter: 1
order: 3
kind: lesson
checks: output
title: Hidden in plain sight
---
Someone left you a note in this directory, but `ls` doesn't show it. Find it and print it.

+++ setup
notes=("Water the plants on Thursday." "The spare key is under the blue pot." "Call the dentist back before Friday." "Lunch is in the fridge, top shelf.")
echo "Things to do: nothing yet." > todo.txt
echo "This directory is yours to explore." > readme.txt
mkdir .config
echo "theme=dark" > .config/settings
printf 'Note to self:\n%s\n' "${notes[VARIANT]}" > .note-to-self

+++ solution
cat .note-to-self

+++ tools
- `ls -a`: lists *all* files, including the hidden ones

Any file or directory whose name starts with a dot is hidden from plain `ls`. Read about `-a` in `man ls`.

+++ steps
List everything: `ls -a`

You'll see a few names starting with `.` that plain `ls` left out.

---
Print the note: `cat .note-to-self`, then press **Check**.

Tab completion works on hidden names too: type `cat .n` and press <kbd>Tab</kbd>.

+++ debrief
**Hidden isn't secret.** A leading dot only means "don't list this by default". It keeps settings files out of the way; it doesn't protect anything. Your home directory has some: try `ls -a ~`.

**`.` and `..`** show up in `ls -a` too. They're not files: `.` is this directory and `..` is the one above it. `ls -A` lists hidden files without those two.

**Options worth knowing**

- `ls -la`: hidden files in the long format, with sizes and dates
- `ls -a .config`: hidden directories work like any other

**Dotfiles you'll meet**: `~/.bashrc` (your shell's settings, chapter 8), `.gitignore`, `.env`, and `~/.ssh/`.

+++ sheet
```bash
ls -a          # all files, hidden ones (.name) too
ls -A          # the same, without . and ..
ls -la         # hidden files, long format
cat .env       # a hidden file is still just a file
```

+++ tip
`.` is the directory you're in and `..` is the one above it.
