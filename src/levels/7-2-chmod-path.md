---
id: run-it-like-a-program
chapter: 7
order: 2
kind: lesson
checks: state
title: Run it like a program
---
Make your own command called `hello`. Typing just `hello`, from any directory, should print:

```
Hello from ~/bin!
```

Put it in `~/bin/hello`: no `bash` in front, and no `.sh` on the end.

+++ setup
rm -rf ~/bin

+++ check
f=/home/player/bin/hello
[ -d /home/player/bin ] || { echo "~/bin doesn't exist yet"; exit 1; }
[ -f "$f" ] || { echo "~/bin/hello doesn't exist yet"; exit 1; }
fail=0
head -c 2 "$f" | grep -q '^#!' || { echo "~/bin/hello's first line should say what runs it: #!/bin/bash"; fail=1; }
[ -x "$f" ] || { echo "~/bin/hello isn't executable yet"; fail=1; }
[ $fail = 1 ] && exit 1
# A brand new login shell, somewhere else entirely: does `hello` work there?
got=$(as_player / "cd /tmp && bash -lc hello" 2>&1)
[ "$got" = "Hello from ~/bin!" ] || { echo "In a new shell, hello printed: ${got:-nothing}"; exit 1; }
exit 0

+++ solution
mkdir -p ~/bin
printf '#!/bin/bash\necho "Hello from ~/bin!"\n' > ~/bin/hello
chmod +x ~/bin/hello
source ~/.bashrc

+++ tools
- `#!/bin/bash` as the first line of a script says which program runs it. It's called a *shebang*.
- `chmod +x file` marks a file as something you can run
- `PATH` is the list of directories the shell looks in for commands. `echo $PATH` shows it.
- Here, as on most Linux systems, new shells add `~/bin` to `PATH` if it exists

`type ls` tells you where a command lives.

+++ steps
Make the directory: `mkdir ~/bin`

---
Write the script with `nano ~/bin/hello`:

```bash
#!/bin/bash
echo "Hello from ~/bin!"
```

Save with <kbd>Ctrl</kbd>+<kbd>O</kbd>, <kbd>Enter</kbd>, and quit with <kbd>Ctrl</kbd>+<kbd>X</kbd>.

---
Mark it executable: `chmod +x ~/bin/hello`

Now `~/bin/hello` runs it by its path. `ls -l ~/bin` shows the `x`s.

---
Your shell set up its `PATH` when it started, before `~/bin` existed. Read `~/.bashrc` again so it picks it up:

`source ~/.bashrc`

Then `cd /tmp` and run `hello`. Press **Check**.

+++ debrief
**Three things make a command.** The shebang says what runs the file, the `x` permission lets you run it, and `PATH` lets the shell find it by name. Without `PATH`, you can still run it by its path: `~/bin/hello`, or `./hello` from the directory it's in.

**Why `./`?** The current directory isn't on `PATH`, on purpose: otherwise a file called `ls` in a downloaded folder could run instead of the real one. `./script.sh` says "this one, here".

**Finding commands.** `type hello` or `which hello` shows which file a name runs. If you change a script's name or location, `hash -r` makes bash forget where it found it before.

**Adding to `PATH` yourself.** `export PATH="$HOME/bin:$PATH"` puts `~/bin` first, for this shell and anything it runs. Put that line in `~/.bashrc` to make it permanent.

**`#!/usr/bin/env bash`** is a common alternative shebang: it finds `bash` on `PATH`, which helps on systems where it isn't in `/bin`.

+++ sheet
```bash
#!/bin/bash                 # first line: what runs it
chmod +x script.sh          # make it runnable
./script.sh                 # run it from here
echo $PATH                  # where commands are found
export PATH="$HOME/bin:$PATH"   # add ~/bin
type ls                     # which file a command runs
```

+++ tip
A command is a file with a shebang, the `x` permission, and a home on your `PATH`.
