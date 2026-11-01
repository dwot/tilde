---
id: runaway
chapter: 8
order: 2
kind: lesson
checks: state
title: Runaway
---
Everything feels slow. Three background jobs are running on this machine, and one of them is eating all the CPU.

**Stop the one that's using the CPU.** Leave the other two running.

+++ setup
mkdir jobs
printf '#!/bin/bash\n# Rebuilds the search index every few seconds.\nwhile :; do sleep 3; done\n' > jobs/indexer
printf '#!/bin/bash\n# Syncs mail.\nwhile :; do sleep 5; done\n' > jobs/mail-sync
printf '#!/bin/bash\n# Makes thumbnails. Something has gone wrong with it.\nwhile :; do :; done\n' > jobs/thumbnailer
chmod +x jobs/*
for j in indexer mail-sync thumbnailer; do
  if [ $j = thumbnailer ]; then setsid nice -n 19 jobs/$j; else setsid jobs/$j; fi </dev/null >/dev/null 2>&1 &
done

+++ check
fail=0
running() { pgrep -u player -x "$1" >/dev/null; }
running thumbnailer && { echo "thumbnailer is still running, and still using the CPU"; fail=1; }
for j in indexer mail-sync; do running $j || { echo "$j isn't running any more: it was fine. Start over brings it back"; fail=1; }; done
exit $fail

+++ solution
kill $(pgrep thumbnailer)

+++ tools
- `ps aux`: every process on the machine, with how much CPU (`%CPU`) and memory each is using
- `top`: the same, updated live, busiest first. `q` quits.
- `kill PID`: asks the process with that ID number to stop
- `pgrep name`: the PIDs of processes with that name

+++ steps
Look at what's running, busiest first: `top`

The `%CPU` column shows the culprit at the top. Note its name and its PID, the number on the left. Press `q` to quit.

---
`kill` takes a PID. `pgrep` finds the PID from the name:

`pgrep thumbnailer`

---
Stop it: `kill` followed by that number. Or both in one go:

`kill $(pgrep thumbnailer)`

---
Check: `ps aux | grep jobs`. The other two should still be there. Press **Check**.

+++ debrief
**Processes and PIDs.** Every running program is a process with a process ID. `ps aux` lists them all: `a` and `x` include everyone's processes and ones without a terminal, and `u` adds the user and resource columns.

**Signals.** `kill` doesn't kill as such: it sends a *signal*. The default, `TERM`, asks the process to stop and lets it clean up. If it ignores that, `kill -9 PID` (`KILL`) can't be ignored, but the process gets no chance to tidy up, so try plain `kill` first.

**By name.** `pkill thumbnailer` finds and signals in one step. `pgrep -a` shows the full command line too, which helps when several processes share a name. Be careful with patterns: `pkill sync` would also match `mail-sync`.

**Your own jobs.** A command you start with `&` at the end runs in the background of your shell. `jobs` lists them, `fg` brings one back, and `Ctrl+Z` pauses the one in front so `bg` can send it to the background.

**`nice`.** The thumbnailer was started with `nice -n 19`, the lowest priority, which is why your shell still felt usable. `renice` changes a running process's priority.

+++ sheet
```bash
ps aux                 # every process, CPU, memory
top                    # live, busiest first (q quits)
pgrep -a name          # PIDs and commands matching name
kill PID               # ask it to stop
kill -9 PID            # make it stop
pkill name             # by name
cmd &                  # run in the background; jobs, fg
```

+++ tip
`top` or `ps aux` to find it, `kill PID` to stop it. Save `kill -9` for when that doesn't work.
