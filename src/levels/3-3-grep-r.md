---
id: wheres-that-todo
chapter: 3
order: 3
kind: lesson
checks: output
anyorder: true
title: Where's that TODO?
---
Before the release, every `TODO` left in the code has to go. Print the **path of each file under `src/`** that mentions `TODO`, one per line, like `src/lib/net.sh`. Just the paths, not the lines.

+++ setup
mkdir -p src/lib src/ui/widgets notes
todo() { echo "# TODO: $1"; }
if [ "$VARIANT" = 0 ]; then has=(main.sh lib/net.sh ui/widgets/button.sh); else has=(lib/db.sh ui/menu.sh ui/widgets/slider.sh); fi
for f in main.sh lib/net.sh lib/db.sh lib/todo-list.sh ui/menu.sh ui/widgets/button.sh ui/widgets/slider.sh; do
  {
    echo "#!/bin/bash"
    echo "# src/$f"
    for h in "${has[@]}"; do [ "$h" = "$f" ] && todo "handle the error case properly"; done
    echo 'echo "running $0"'
  } > "src/$f"
done
echo "add_item() { echo \"\$1\" >> ~/.todo; }" >> src/lib/todo-list.sh
printf 'TODO before release:\n- remove every TODO from src/\n' > notes/TODO.md

+++ solution
grep -rl TODO src

+++ tools
- `grep -r`: searches every file in a directory, and every directory inside it
- `grep -l`: prints just the names of the files that match, not the matching lines

Check what you get with `grep -r TODO src` before narrowing it down.

+++ steps
Search the whole of `src/`: `grep -r TODO src`

Every match comes with the file it's in, but you only want the file names.

---
`-l` lists the files instead: `grep -rl TODO src`

Press **Check**.

+++ debrief
**Where to start the search.** `grep -rl TODO .` from `~/work` finds `notes/TODO.md` as well. Name the directory you mean.

**Case matters.** `src/lib/todo-list.sh` has `todo` in its name and its code, but no `TODO`. `grep -i` would have listed it.

**Options worth knowing**

- `-n`: line numbers, so `grep -rn TODO src` takes you straight to each one
- `-L`: the opposite of `-l`, files that *don't* match
- `--include='*.sh'`: only search files whose names match
- `-w`: whole words, so `TODO` but not `TODOS`

**About the order.** `grep -r` lists files in the order it finds them on disk, which isn't alphabetical. That's why the check here doesn't care about order. Chapter 4's `sort` puts them in order.

+++ sheet
```bash
grep -r TODO src         # search everything under src
grep -rl TODO src        # just the file names
grep -rn TODO src        # with line numbers
grep -rL TODO src        # files that DON'T match
grep -r TODO --include='*.sh' .   # only .sh files
```

+++ tip
`-r` searches a directory and everything in it. `-l` turns "every match" into "every file".
