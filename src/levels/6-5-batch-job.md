---
id: batch-job
chapter: 6
order: 5
kind: boss
checks: state
title: Batch job
---
`list.txt` has one project name per line. For each line, make a directory in `projects/`, numbered from 1 in the order of the list:

```
projects/1-Kitchen remodel/
projects/2-garden/
...
```

Inside each one, put a `notes.txt` whose only line is the project's name, exactly as it is in the list.

+++ setup
mkdir projects
printf '%s\n%s\n%s\n%s\n%s' "Kitchen remodel" garden "Book club" "Paint the shed" "Tax return 2026" > list.txt

+++ check
names=("Kitchen remodel" garden "Book club" "Paint the shed" "Tax return 2026")
fail=0
# Directories named after single words of a multi-word line mean the lines were split at spaces.
split=0; extra=()
for d in projects/*/; do
  [ -d "$d" ] || continue
  b=$(basename "$d")
  ok=0
  for i in "${!names[@]}"; do [ "$b" = "$((i + 1))-${names[i]}" ] && ok=1; done
  [ $ok = 1 ] && continue
  extra+=("$b")
  case " Kitchen remodel Book club Paint the shed Tax return 2026 " in *" ${b#*-} "*) split=1 ;; esac
done
[ $split = 1 ] && { echo "projects/ has directories named after single words, like $(printf '%s\n' "${extra[@]}" | grep -m1 '[a-z]'): were the lines split at the spaces?"; fail=1; }
for i in "${!names[@]}"; do
  n=${names[i]}; d="projects/$((i + 1))-$n"
  if [ ! -d "$d" ]; then
    [ $split = 1 ] && continue
    if [ $i = 4 ] && [ $fail = 0 ]; then echo "$d/ is missing: the last line of list.txt got no directory. Look at the end of the file with cat -A list.txt"
    else echo "$d/ is missing"; fi
    fail=1
  elif [ "$(cat "$d/notes.txt" 2>/dev/null)" != "$n" ]; then echo "$d/notes.txt should say: $n"; fail=1
  fi
done
[ $split = 0 ] && for b in "${extra[@]}"; do echo "projects/$b/ shouldn't be there"; fail=1; done
exit $fail

+++ solution
i=1
while read -r name || [ -n "$name" ]; do
  mkdir -p "projects/$i-$name"
  echo "$name" > "projects/$i-$name/notes.txt"
  i=$((i + 1))
done < list.txt

+++ tools
Everything from this chapter:

- `"double quotes"` around every variable
- `$((i + 1))` does arithmetic

And one new loop, for reading a file a line at a time:

```bash
while read -r line; do
  echo "got: $line"
done < list.txt
```

You can type a loop over several lines: bash waits with a `>` prompt until you type `done`.

+++ steps
Read the list a line at a time and print each one:

`while read -r name; do echo "[$name]"; done < list.txt`

Count the lines it printed, then `cat list.txt`. One is missing.

---
`cat -A list.txt` shows why: the last line has no `$`, because there's no newline at the end. `read` reads it, but reports failure, so the loop stops. `|| [ -n "$name" ]` carries on if it read something anyway:

`while read -r name || [ -n "$name" ]; do echo "[$name]"; done < list.txt`

---
Now number them. Set `i=1` first, and add 1 each time round:

`i=1; while read -r name || [ -n "$name" ]; do echo "$i-$name"; i=$((i + 1)); done < list.txt`

---
Swap the `echo` for the real work: make the directory, and write the name into `notes.txt` inside it.

```bash
i=1
while read -r name || [ -n "$name" ]; do
  mkdir -p "projects/$i-$name"
  echo "$name" > "projects/$i-$name/notes.txt"
  i=$((i + 1))
done < list.txt
```

`ls projects`, then press **Check**.

+++ debrief
**`while read` for lines, `for` for words.** `for name in $(cat list.txt)` would give you `Kitchen`, `remodel`, `garden`... split at every space. `while read -r` reads whole lines. `-r` keeps backslashes as they are.

**The missing last line.** Text files should end with a newline, but plenty don't. `read` fills in the variable, then returns failure because it hit the end of the file without a newline, which ends the loop one line early. `|| [ -n "$name" ]` keeps going if there was something to read.

**Arithmetic.** `$((i + 1))` does whole-number maths: `+ - * / %`. Inside it, you don't need `$` on variable names. `((i++))` adds one on its own.

**Making numbers line up.** `printf -v dir '%02d-%s' "$i" "$name"` puts `01-Kitchen remodel` into `$dir`, so the directories sort properly past 9.

**If you got it wrong.** `rm -r projects/*` clears it out, and you can run the loop again. Or **Start over**.
