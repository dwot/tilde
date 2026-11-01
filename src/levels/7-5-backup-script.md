---
id: backup-script
chapter: 7
order: 5
kind: boss
checks: state
title: Backup script
---
Write `backup.sh`. `bash backup.sh docs` should:

1. Pack `docs/` into `backups/docs-YYYY-MM-DD.tar.gz`, with today's date
2. Keep only the **3 newest** `docs-` backups in `backups/`, deleting older ones. Other backups in there, like `photos-...`, aren't its business.

And it should fail cleanly. With no argument, or a directory that doesn't exist, it prints an error on standard error, exits with 1, and changes nothing.

`backups/` already has a few older backups in it. Look at them first.

+++ setup
mkdir -p docs/letters backups
echo "Dear Sam, ..." > docs/letters/sam.txt
echo "Q3: up 4%" > docs/report.txt
echo "Shopping: eggs, flour" > docs/list.txt
for n in 3 5 9 12 20; do touch "backups/docs-$(date -d "$n days ago" +%F).tar.gz"; done
for n in 4 30; do touch "backups/photos-$(date -d "$n days ago" +%F).tar.gz"; done

+++ check
[ -f backup.sh ] || { echo "backup.sh is missing"; exit 1; }
fail=0
today=$(date +%F)
fresh() {
  d=$(mktemp -d); mkdir -p "$d/docs/letters" "$d/backups"
  echo "Dear Sam" > "$d/docs/letters/sam.txt"; echo "Q3" > "$d/docs/report.txt"; echo "eggs" > "$d/docs/list.txt"
  for n in 3 5 9 12 20; do touch "$d/backups/docs-$(date -d "$n days ago" +%F).tar.gz"; done
  for n in 4 30; do touch "$d/backups/photos-$(date -d "$n days ago" +%F).tar.gz"; done
  cp backup.sh "$d"; chown -R player "$d"
  before=$(ls "$d/backups")
}
run() { as_player "$d" "bash backup.sh $1 > out 2> err; echo \$? > code"; code=$(cat "$d/code"); err=$(cat "$d/err"); }

for args in "" nowhere; do
  fresh; run "$args"
  r="bash backup.sh${args:+ $args}"
  [ "$code" = 1 ] || { echo "$r should exit with 1, but exited with $code"; fail=1; }
  [ -n "$err" ] || { echo "$r should print an error on standard error"; fail=1; }
  [ "$(ls "$d/backups")" = "$before" ] || { echo "$r changed backups/: it should change nothing"; fail=1; }
  rm -rf "$d"
done

fresh; run docs
[ "$code" = 0 ] || { echo "bash backup.sh docs exited with $code${err:+ and said: $err}"; fail=1; }
new="$d/backups/docs-$today.tar.gz"
if [ ! -f "$new" ]; then echo "bash backup.sh docs didn't make backups/docs-$today.tar.gz"; fail=1
else
  list=$(tar -tzf "$new" 2>/dev/null) || { echo "backups/docs-$today.tar.gz isn't a .tar.gz file: use tar -czf"; fail=1; }
  for f in report.txt list.txt letters/sam.txt; do
    grep -q "docs/$f\$" <<< "$list" || { [ -n "$list" ] && echo "backups/docs-$today.tar.gz is missing docs/$f"; fail=1; }
  done
fi
keep="docs-$today.tar.gz
docs-$(date -d '3 days ago' +%F).tar.gz
docs-$(date -d '5 days ago' +%F).tar.gz"
have=$(cd "$d/backups" && ls docs-* 2>/dev/null | sort -r)
if [ "$have" != "$keep" ]; then
  n=$(wc -l <<< "$have")
  if [ "$n" -gt 3 ]; then echo "after bash backup.sh docs, backups/ has $n docs- backups: keep only the 3 newest"
  else echo "after bash backup.sh docs, backups/ should keep these docs- backups:"; echo "$keep"; fi
  fail=1
fi
[ "$(cd "$d/backups" && ls photos-* 2>/dev/null | wc -l)" = 2 ] || { echo "bash backup.sh docs deleted photos- backups: only docs- ones are its business"; fail=1; }
rm -rf "$d"
exit $fail

+++ solution
#!/bin/bash
set -euo pipefail
if [ $# -ne 1 ] || [ ! -d "$1" ]; then
  echo "usage: backup.sh DIR (an existing directory)" >&2
  exit 1
fi
name=$(basename "$1")
mkdir -p backups
tar -czf "backups/$name-$(date +%F).tar.gz" "$1"
ls backups/"$name"-*.tar.gz | sort | head -n -3 | while read -r old; do
  rm "$old"
done

+++ tools
Everything from this chapter: `$1`, `$#`, `if [ ]`, `>&2`, `exit`, `set -euo pipefail`. And:

- `tar -czf out.tar.gz dir`: packs `dir` into a compressed archive. `tar -tzf out.tar.gz` lists what's inside.
- `date +%F`: today's date, as `YYYY-MM-DD`
- `basename path`: the last part of a path
- `head -n -3`: every line *except* the last 3

Because the dates are `YYYY-MM-DD`, sorting the names sorts them by date.

+++ steps
Look at what's there: `ls backups`. Then try the pieces: `date +%F`, `basename docs`.

---
Start `backup.sh` in `nano` with the checks:

```bash
#!/bin/bash
set -euo pipefail
if [ $# -ne 1 ] || [ ! -d "$1" ]; then
  echo "usage: backup.sh DIR" >&2
  exit 1
fi
```

---
Then make the archive:

```bash
name=$(basename "$1")
tar -czf "backups/$name-$(date +%F).tar.gz" "$1"
```

Save, run `bash backup.sh docs`, and `ls backups`.

---
Now the tidying. This lists that directory's backups, oldest first, minus the newest 3: exactly the ones to delete.

`ls backups/docs-*.tar.gz | sort | head -n -3`

---
Add it to the script with `$name`, deleting each one:

```bash
ls backups/"$name"-*.tar.gz | sort | head -n -3 | while read -r old; do
  rm "$old"
done
```

**Start over** to get the old backups back, then `bash backup.sh docs`, `ls backups`, and try `bash backup.sh nowhere`. Press **Check**.

+++ debrief
**A real script.** Arguments checked up front, errors to standard error with an exit code, strict mode, and quotes around every variable. That shape works for nearly every script you'll write.

**Dates that sort.** `YYYY-MM-DD` sorts the same as text and as time, which is why `sort | head -n -3` picks the oldest. A name like `26-10-2026` wouldn't.

**Other ways to tidy**

- `ls -t` sorts by modification time, newest first: `ls -t backups/docs-* | tail -n +4 | xargs -r rm`. `xargs` turns lines of input into arguments, and `-r` skips running `rm` if there are none.
- `find backups -name 'docs-*' -mtime +30 -delete` keeps by age instead of by count.

**Running it every night.** `crontab -e` and a line like `0 2 * * * cd ~/work && ./backup.sh docs` runs it at 2am every day. That's beyond what this machine does, but it's where scripts like this end up.

**Restoring.** `tar -xzf backups/docs-2026-10-26.tar.gz` unpacks it into the current directory. `-C somewhere` unpacks it there instead.
