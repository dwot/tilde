---
id: permission-denied
chapter: 8
order: 1
kind: fix
checks: state
title: Permission denied
---
Two things are wrong with the permissions in here:

```
$ ./deploy.sh
-bash: ./deploy.sh: Permission denied
```

- `deploy.sh` should run as `./deploy.sh`
- `secrets.env` holds passwords, but **anyone** on the machine can read it. Only you should be able to read or change it: nobody else at all.

Don't make anything writable by everyone along the way.

+++ setup
printf '#!/bin/bash\necho "Deploying... done."\n' > deploy.sh
printf 'DB_PASSWORD=hunter2\nAPI_KEY=sk-not-a-real-key\n' > secrets.env
chmod 644 deploy.sh secrets.env
echo "Run ./deploy.sh to deploy." > README

+++ check
fail=0
mode() { stat -c %a "$1"; }
[ -f deploy.sh ] && [ -f secrets.env ] || { echo "deploy.sh and secrets.env should both still be here"; exit 1; }
[ $(( 0$(mode deploy.sh) & 0100 )) -ne 0 ] || { echo "deploy.sh isn't executable by you yet (ls -l shows -rw-r--r--)"; fail=1; }
[ $(( 0$(mode deploy.sh) & 0002 )) -eq 0 ] || { echo "deploy.sh is writable by everyone: anyone could change what it does"; fail=1; }
s=$(mode secrets.env)
if [ "$s" != 600 ]; then
  [ $(( 0$s & 0077 )) -ne 0 ] && echo "secrets.env can still be used by others: ls -l shows $(stat -c %A secrets.env)"
  [ $(( 0$s & 0600 )) -ne $(( 0600 )) ] && echo "you need to be able to read and write secrets.env yourself"
  [ $(( 0$s & 0100 )) -ne 0 ] && echo "secrets.env doesn't need to be executable"
  fail=1
fi
[ $fail = 0 ] && { out=$(as_player /home/player/work ./deploy.sh 2>&1); [ "$out" = "Deploying... done." ] || { echo "./deploy.sh printed: $out"; fail=1; }; }
exit $fail

+++ solution
chmod u+x deploy.sh
chmod 600 secrets.env

+++ tools
- `ls -l` shows each file's permissions, like `-rw-r--r--`
- `chmod` changes them, either with letters (`u+x`) or numbers (`600`)

`man chmod` explains both. `ls -l` again after each change shows what happened.

+++ steps
Look at them: `ls -l`

`-rw-r--r--` reads in threes after the first character: **you** (the owner) can `rw`, read and write; your **group** can `r`; and **others**, everyone else, can `r`. There's no `x`, execute, anywhere.

---
Give yourself execute permission on the script: `chmod u+x deploy.sh`

`u` is you, the user who owns it; `g` is the group and `o` is others.

---
Now the secrets. Read and write for you, nothing for anyone else: `rw-------`. In numbers, that's `600`:

`chmod 600 secrets.env`

---
`ls -l` to see the result, try `./deploy.sh`, then press **Check**.

+++ debrief
**Reading permissions.** `-rwxr-x---` is: a file (`d` would be a directory), then `rwx` for the owner, `r-x` for the group, `---` for others.

**The numbers.** Each of the three is a digit: read is 4, write is 2, execute is 1, added up. So `rw-` is 6, `r-x` is 5 and `---` is 0, which makes `rwxr-x---` 750. The ones you'll see most:

- `644` (`rw-r--r--`): ordinary files
- `755` (`rwxr-xr-x`): scripts and programs, and directories
- `600` (`rw-------`): private files, like keys and passwords
- `700` (`rwx------`): private directories

**Avoid 777.** "Everyone can do everything" makes the error go away, and lets anyone on the machine change your script to do something else.

**Directories.** For a directory, `r` lets you list it, `w` lets you add and delete files in it, and `x` lets you go into it. `chmod -R` changes a whole tree, but files and directories usually need different modes: `find dir -type d -exec chmod 755 {} +`.

**Owners.** `chown user:group file` changes who owns a file, and needs root. `sudo` runs a command as root, on machines where you're allowed to.

+++ sheet
```bash
ls -l                  # -rwxr-xr-x: you, group, others
chmod u+x script.sh    # you can run it (u: you)
chmod go-r file        # group and others can't read it
chmod 600 secret       # rw------- (r=4 w=2 x=1)
chmod 755 script.sh    # rwxr-xr-x
```

+++ tip
`r`=4, `w`=2, `x`=1, for you, your group and everyone else. `600` is private, `755` is a program.
