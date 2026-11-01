---
id: make-it-yours
chapter: 8
order: 4
kind: lesson
checks: state
title: Make it yours
---
Set up your shell, so it stays set up in every **new** shell you open:

- an alias `ll` that runs `ls -lh`
- `~/work/tools` on your `PATH`, so the `wordcount` script in there runs as just `wordcount`

Both go in `~/.bashrc`, which bash runs every time it starts.

+++ setup
cp /usr/local/share/tilde/bashrc ~/.bashrc
mkdir tools
printf '#!/bin/bash\n# Counts the words in the files you give it.\ncat "$@" | wc -w\n' > tools/wordcount
chmod +x tools/wordcount
echo "the quick brown fox" > fox.txt

+++ check
[ -f /home/player/.bashrc ] || { echo "~/.bashrc has gone. Start over puts it back"; exit 1; }
fail=0
# A brand new login shell, as if you'd just opened a terminal.
shell() { as_player / "cd /tmp && bash -lc $(printf %q "$1") 2>/dev/null"; }
a=$(shell 'alias ll')
case "$a" in
  "alias ll='ls -lh'"|"alias ll='ls -hl'"|"alias ll='ls -l -h'"|"alias ll='ls -h -l'") ;;
  "") echo "a new shell has no ll alias"; fail=1 ;;
  *) echo "in a new shell, ll is $a, but should be ls -lh"; fail=1 ;;
esac
p=$(shell 'type -P wordcount')
[ "$p" = /home/player/work/tools/wordcount ] || { echo "a new shell can't find wordcount"; fail=1; }
[ $fail = 0 ] && { n=$(shell 'wordcount ~/work/fox.txt'); [ "$n" = 4 ] || { echo "in a new shell, wordcount ~/work/fox.txt printed: ${n:-nothing}"; fail=1; }; }
h=$(shell 'echo $HISTFILE')
[ "$h" = /var/game/history ] || { echo "~/.bashrc has lost a line the game needs: HISTFILE=/var/game/history. Start over puts it back"; fail=1; }
exit $fail

+++ solution
echo "alias ll='ls -lh'" >> ~/.bashrc
echo 'export PATH="$PATH:$HOME/work/tools"' >> ~/.bashrc
source ~/.bashrc

+++ tools
- `alias name='command'` makes a shortcut. `alias` on its own lists them.
- `export PATH="$PATH:/some/dir"` adds a directory to the end of `PATH`
- `~/.bashrc` runs at the start of every interactive bash
- `source ~/.bashrc` runs it again in the shell you're in, to pick up changes

Anything you type at the prompt lasts only until the shell exits. Lines in `~/.bashrc` come back every time.

+++ steps
Try them out at the prompt first:

`alias ll='ls -lh'`, then `ll`

---
`export PATH="$PATH:$HOME/work/tools"`, then `wordcount fox.txt`

Both work, but only in this shell.

---
Make them stick by adding the same lines to the end of `~/.bashrc`. `>>` adds without touching what's there (single quotes keep `$PATH` from being filled in now):

```bash
echo "alias ll='ls -lh'" >> ~/.bashrc
echo 'export PATH="$PATH:$HOME/work/tools"' >> ~/.bashrc
```

Or `nano ~/.bashrc` and add them at the bottom.

---
`tail -3 ~/.bashrc` to check, then `bash` to start a new shell and try `ll` and `wordcount fox.txt` there. `exit` to leave it. Press **Check**.

+++ debrief
**`~/.bashrc` is just a script** that bash runs when it starts. Aliases, `PATH`, your prompt (`PS1`) and shell options all go there. Have a look at the rest of it: `less ~/.bashrc`.

**Which file?** Login shells (a new terminal on some systems, or `ssh`) read `~/.bash_profile` instead, which usually just runs `~/.bashrc`. Put your settings in `~/.bashrc` and you're covered.

**Aliases versus scripts.** An alias only swaps one word for another as you type. For anything with arguments in the middle, or more than one line, write a function in `~/.bashrc` (`mkcd() { mkdir -p "$1" && cd "$1"; }`) or a script in `~/bin`.

**`$PATH:` at the front or the end?** `$PATH:dir` searches `dir` last, so it can't replace a real command by accident. `dir:$PATH` searches it first, which is what you want when you mean to override one.

**Keep `~/.bashrc` working.** A mistake in it shows up in every new shell. `bash` starts a fresh one to test with, and you can `exit` back if it's broken.

+++ sheet
```bash
alias ll='ls -lh'      # a shortcut (alias: list them)
export PATH="$PATH:$HOME/tools"   # add a directory
echo "..." >> ~/.bashrc   # keep it for new shells
source ~/.bashrc       # reload in this shell
mkcd() { mkdir -p "$1" && cd "$1"; }   # a function
```

+++ tip
What you type lasts until the shell exits. What's in `~/.bashrc` comes back in every new one.
