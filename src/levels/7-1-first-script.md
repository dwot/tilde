---
id: first-script
chapter: 7
order: 1
kind: lesson
checks: state
title: Your first script
---
Write a script `greet.sh` that greets whoever its first argument names:

```
$ bash greet.sh Ada
Hello, Ada!
```

+++ check
[ -f greet.sh ] || { echo "There's no greet.sh yet."; exit 1; }
fail=0
for name in Ada "Grace Hopper"; do
  got=$(as_player . "bash greet.sh $(printf %q "$name")" 2>&1)
  [ "$got" = "Hello, $name!" ] || { echo "bash greet.sh $(printf %q "$name") printed: ${got:-nothing}"; fail=1; }
done
exit $fail

+++ solution
echo 'echo "Hello, $1!"' > greet.sh

+++ tools
- `nano greet.sh`: opens an editor. <kbd>Ctrl</kbd>+<kbd>O</kbd> then <kbd>Enter</kbd> saves, and <kbd>Ctrl</kbd>+<kbd>X</kbd> exits.
- `echo`: prints its arguments
- `$1`: inside a script, the first argument it was run with

`help echo` explains bash's built-in commands. `man bash` covers the rest; search it for `Positional Parameters`.

+++ steps
Open the editor: `nano greet.sh`

---
Type one line:

`echo "Hello, $1!"`

When the script runs, `$1` is replaced with its first argument.

---
Save and quit: <kbd>Ctrl</kbd>+<kbd>O</kbd>, <kbd>Enter</kbd>, <kbd>Ctrl</kbd>+<kbd>X</kbd>.

---
Try it: `bash greet.sh Ada`, then `bash greet.sh "Grace Hopper"`. Press **Check**.

+++ debrief
**Arguments.** `$1`, `$2` and so on are the script's arguments, `$#` is how many there are, and `"$@"` is all of them. The quotes in `bash greet.sh "Grace Hopper"` make it one argument; without them it would be two, and `$1` would be just `Grace`.

**Quote your variables.** Writing `"$1"` instead of `$1` keeps a value with spaces in it together. It doesn't change anything for `echo` here, but it does for almost every other command.

**Running it like a program**

1. Make the first line `#!/bin/bash`, which tells the system what should run the file.
2. `chmod +x greet.sh` marks it executable.
3. Now `./greet.sh Ada` works without typing `bash`.

**Other ways to write it**

- `printf 'Hello, %s!\n' "$1"`: `printf` gives you more control over the format than `echo`
- `echo "Hello, ${1:-world}!"` falls back to `world` when no argument is given
- Without an editor: `echo 'echo "Hello, $1!"' > greet.sh`. The single quotes stop `$1` being filled in while you're writing the file.

+++ sheet
```bash
# greet.sh
echo "Hello, $1!"   # $1 is the first argument
```
```bash
bash greet.sh Ada             # run it
bash greet.sh "Grace Hopper"  # one argument
"$@"                          # all the arguments
```

+++ tip
Quote variables (`"$1"`) so values with spaces in them stay in one piece.
