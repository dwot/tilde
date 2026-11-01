---
id: quiet-please
chapter: 4
order: 2
kind: lesson
checks: state
title: Quiet please
---
Find every file whose name ends in `.conf` anywhere under `system/`.

Some directories in there are locked, and `find` complains about each one it can't open. Keep the two apart:

- `found.txt`: the paths `find` prints, and nothing else
- `errors.txt`: its complaints, and nothing else

+++ setup
mkdir -p system/{net,audio,video,private,backup/old,secrets}
touch system/net/wifi.conf system/net/hosts system/audio/mixer.conf system/video/display.conf \
  system/backup/old/net.conf system/private/keys.conf system/secrets/token.conf system/main.conf
chmod 000 system/private system/secrets

+++ check
fail=0
want='system/audio/mixer.conf
system/backup/old/net.conf
system/main.conf
system/net/wifi.conf
system/video/display.conf'
if [ ! -f found.txt ]; then echo "found.txt is missing"; fail=1
else
  grep -q "Permission denied" found.txt && { echo "found.txt has find's complaints in it: they go to errors.txt"; fail=1; }
  have=$(grep -v "Permission denied" found.txt | sed 's|^\./||' | sort)
  [ "$have" = "$want" ] || { echo "found.txt should list the 5 .conf files find can reach, one per line, like system/main.conf"; fail=1; }
fi
if [ ! -f errors.txt ]; then echo "errors.txt is missing"; fail=1
else
  [ "$(grep -c "Permission denied" errors.txt)" = 2 ] || { echo "errors.txt should have find's two complaints, one for each locked directory"; fail=1; }
  grep -v "Permission denied" errors.txt | grep -q . && { echo "errors.txt has something other than complaints in it"; fail=1; }
fi
exit $fail

+++ solution
find system -name '*.conf' > found.txt 2> errors.txt

+++ tools
- `find -name`, from chapter 3
- Every command has two outputs: *standard output* for results and *standard error* for complaints. `>` only catches the first one.
- `2>` sends standard error into a file

Search for `REDIRECTION` in `man bash` (type `/^REDIRECTION`) for the whole story.

+++ steps
Run the search and look at what comes out: `find system -name '*.conf'`

Results and complaints, mixed together.

---
Send the results to a file: `find system -name '*.conf' > found.txt`

The complaints still appear. They're on a different output, standard error, which `>` doesn't touch.

---
`2>` redirects standard error. Do both at once:

`find system -name '*.conf' > found.txt 2> errors.txt`

`cat` both files, then press **Check**.

+++ debrief
**Two outputs.** Each command has standard output (number 1) and standard error (number 2). `>` is short for `1>`. Keeping them apart means the results file stays clean, however much goes wrong along the way.

**Throwing errors away.** `/dev/null` is a file that discards whatever is written to it. `find system -name '*.conf' 2>/dev/null` shows the results and hides the complaints. It's how you quiet a noisy command, as long as you're sure you don't need its errors.

**Both into one file.** `command > all.txt 2>&1` sends standard error to the same place as standard output. The order matters: `2>&1` means "wherever 1 is going *right now*", so it goes after `> all.txt`. bash also has a shortcut, `&> all.txt`.

**Pipes only carry standard output.** `find ... | grep wifi` filters the results, but the complaints still go straight to the screen. Use `2>&1 |` to send both through the pipe.

+++ sheet
```bash
cmd 2> errors.txt        # complaints into a file
cmd 2>/dev/null          # throw complaints away
cmd > out.txt 2> err.txt # results and complaints apart
cmd > all.txt 2>&1       # both into one file
cmd &> all.txt           # the same, bash's shortcut
```

+++ tip
`>` only catches results. Errors are output number 2: `2>`.
