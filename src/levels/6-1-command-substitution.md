---
id: fill-in-the-blanks
chapter: 6
order: 1
kind: lesson
checks: output
title: Fill in the blanks
---
Print this sentence, with the **real** number of files in `photos/` where the 7 is:

```
photos has 7 files
```

Don't count them yourself: the check also tries your command on a `photos/` with a different number of files. Do it all in **one command**, because the check reruns your last command on its own.

+++ setup
mkdir photos
n=$((VARIANT ? 12 : 7))
for i in $(seq 1 $n); do touch "photos/img_$i.jpg"; done

+++ solution
echo "photos has $(ls photos | wc -l) files"

+++ tools
- `ls photos | wc -l` counts the files, from chapter 4
- `$( )` runs the command inside it and puts its output in its place, in the middle of another command
- `echo` prints its arguments

`man bash`, and type `/Command Substitution`.

+++ steps
Count them first: `ls photos | wc -l`

---
`$( )` drops a command's output into another command. Try it in an `echo`:

`echo "photos has $(ls photos | wc -l) files"`

Press **Check**.

+++ debrief
**Command substitution.** The shell runs what's inside `$( )` first, then puts its output where it was, with the trailing newline trimmed. You can put it anywhere: `cd $(dirname /etc/ssh/sshd_config)`, `echo "Today is $(date +%A)"`.

**Double quotes, not single.** `"..."` lets `$( )` and `$name` work inside. `'...'` keeps everything exactly as typed, so `echo 'photos has $(ls photos | wc -l) files'` prints the `$(...)` itself. The next level is all about that.

**Variables.** Save a result to use more than once: `n=$(ls photos | wc -l)`, then `echo "photos has $n files"`. No spaces around the `=`. Here that's two commands, so for the check you'd join them with `;`: `n=$(ls photos | wc -l); echo "photos has $n files"`.

**Old style.** You'll see backticks, `` `ls | wc -l` ``, in older scripts. They do the same, but `$( )` nests and is easier to read.

+++ sheet
```bash
echo "Today is $(date +%A)"   # a command's output, inline
n=$(ls | wc -l)               # into a variable
echo "$n files"               # use it (double quotes)
name=Ada; echo "Hi $name"     # no spaces around =
cmd1; cmd2                    # one line, two commands
```

+++ tip
`$( )` works inside double quotes but not single. No spaces around `=` when you set a variable.
