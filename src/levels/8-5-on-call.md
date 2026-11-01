---
id: on-call
chapter: 8
order: 5
kind: boss
checks: state
title: On call
---
You're on call, and the alarm has gone off: the disk is filling up fast. Everything is under `app/`.

1. Something is writing to `app/logs/` nonstop. **Stop it**, but leave the `app-server` process running: that's the real app.
2. The log it filled is huge. **Compress it with `gzip`**, so it becomes a `.gz` file and the original goes.
3. While you're there: `app/config.ini` can be changed by **anyone**. Make it so only you can write to it (others can still read it).
4. Leave a note for the next person in `handover.txt`, saying **which process** you stopped, by name.

+++ setup
mkdir -p app/bin app/logs
printf '#!/bin/bash\n# The web app. Leave it be.\nwhile :; do sleep 4; done\n' > app/bin/app-server
cat > app/bin/debug-tracer <<'EOF'
#!/bin/bash
# Temporary debug logging. "I'll turn it off after lunch." (March)
cd "$(dirname "$0")/.."
n=0
while :; do
  for i in 1 2 3 4 5; do echo "$(date +%T) TRACE request $((n += 1)) took ${RANDOM}us, cache=miss, retries=0" >> logs/app.log; done
  sleep 1
done
EOF
chmod +x app/bin/*
for n in $(seq 1 4000); do echo "2026-10-25 TRACE request $n took 731us, cache=miss, retries=0"; done > app/logs/app.log
echo "2026-10-26 server started" > app/logs/server.log
printf '[server]\nport = 8080\nworkers = 4\n' > app/config.ini
chmod 666 app/config.ini
for p in app-server debug-tracer; do setsid app/bin/$p </dev/null >/dev/null 2>&1 & done

+++ check
fail=0
pgrep -u player -x debug-tracer >/dev/null && { echo "something is still writing to app/logs/"; fail=1; }
pgrep -u player -x app-server >/dev/null || { echo "app-server isn't running: it was the real app. Start over brings it back"; fail=1; }
if [ -f app/logs/app.log.gz ]; then
  gzip -t app/logs/app.log.gz 2>/dev/null || { echo "app/logs/app.log.gz isn't a valid gzip file"; fail=1; }
  [ "$(zcat app/logs/app.log.gz 2>/dev/null | wc -l)" -ge 4000 ] || { echo "app/logs/app.log.gz should have all of the log in it"; fail=1; }
  [ -s app/logs/app.log ] && { echo "app/logs/app.log is back: was something still writing to it when you compressed it?"; fail=1; }
else
  echo "app/logs/app.log hasn't been compressed to app/logs/app.log.gz"; fail=1
fi
[ -f app/logs/server.log ] || { echo "app/logs/server.log has gone: only app.log needed compressing"; fail=1; }
if [ -f app/config.ini ]; then
  m=$(stat -c %a app/config.ini)
  [ $(( 0$m & 0022 )) -eq 0 ] || { echo "app/config.ini can still be changed by others: $(stat -c %A app/config.ini)"; fail=1; }
  [ $(( 0$m & 0200 )) -ne 0 ] || { echo "you should still be able to change app/config.ini yourself"; fail=1; }
  [ $(( 0$m & 0004 )) -ne 0 ] || { echo "others should still be able to read app/config.ini"; fail=1; }
else echo "app/config.ini has gone"; fail=1; fi
if [ ! -f handover.txt ]; then echo "there's no handover.txt"; fail=1
elif ! grep -q debug-tracer handover.txt; then echo "handover.txt should say which process you stopped, by name"; fail=1; fi
exit $fail

+++ solution
ps aux
pkill -x debug-tracer
gzip app/logs/app.log
chmod 644 app/config.ini
echo "Stopped debug-tracer: it was filling app/logs/app.log. Log compressed; config.ini no longer world-writable." > handover.txt

+++ tools
Everything from this chapter, and a little from the rest:

- `ps aux`, `pgrep -a`, `kill`, `pkill`
- `ls -l`, `chmod`
- `du -sh`, `ls -lh`
- `gzip file` compresses `file` into `file.gz` and removes the original. `zcat file.gz` reads it.
- `echo ... > file`

+++ steps
Look at what's running: `ps aux`. Two of the processes come from `app/bin/`.

`cat` both scripts in `app/bin` to see what each one does.

---
`debug-tracer` adds lines to `logs/app.log` every second. Stop it, by name: `pkill -x debug-tracer`

`-x` matches the whole name exactly. Check with `pgrep -a -u player`.

---
Now it's stopped, compress the log: `gzip app/logs/app.log`, then `ls -lh app/logs`.

Doing this first wouldn't have worked: the tracer would have started a new `app.log` straight away.

---
`ls -l app/config.ini` shows `-rw-rw-rw-`. Take write away from group and others: `chmod go-w app/config.ini`, or `chmod 644 app/config.ini`.

---
Write the note: `echo "Stopped debug-tracer, which was filling app/logs/app.log" > handover.txt`. Press **Check**.

+++ debrief
**Stop the source first.** Clearing up while something is still writing just gives it a fresh file to fill. Find what's writing, stop it, then clean up.

**Finding the writer.** Here the scripts told you. On a real system, `lsof app/logs/app.log` or `fuser` names the process that has a file open, and `ls -lt` shows which file changed last.

**gzip.** `gzip f` replaces `f` with `f.gz`; `gunzip f.gz` reverses it; `gzip -k` keeps the original. Logs compress very well, often to a tenth of their size or less. On real servers, `logrotate` does this for you on a schedule.

**Deleting a log that's open.** If you `rm` a log while a process still has it open, the space isn't freed until that process closes it, which can leave `df` saying the disk is full when `du` can't find anything big. `: > app.log` (truncating it) frees the space at once.

**The handover.** Writing down what you did, while it's fresh, is the most underrated on-call skill.

**That's the course.** Everything from here is practice: next time you'd reach for a file manager or a spreadsheet, try the terminal first, with the cheat sheet open.
