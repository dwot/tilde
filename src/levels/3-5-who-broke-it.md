---
id: who-broke-it
chapter: 3
order: 5
kind: boss
checks: output
anyorder: true
title: Who broke it?
---
Since yesterday the live site keeps trying to connect to `localhost`, which only works on a developer's laptop. Somebody changed something under `app/` in the **last 24 hours**.

Print the path of every file under `app/` that was **changed in the last 24 hours** and **mentions `localhost`**, one per line, like `app/lib/http.sh`.

Plenty of older files mention `localhost` too. Those have been there for a while and are fine.

+++ setup
mkdir -p app/config app/lib app/tests "app/deploy notes"
w() { printf '%s\n' "${@:3}" > "app/$1"; touch -d "$2" "app/$1"; }
# Old, and fine.
w config/dev.ini "20 days ago" "[db]" "host = localhost" "port = 5432"
w tests/test_db.sh "9 days ago" "#!/bin/bash" "# tests run against a local database" "psql -h localhost -c 'select 1'"
w lib/http.sh "40 days ago" "fetch() { curl -s \"\$1\"; }"
w README.md "60 days ago" "# app" "Run it locally with ./run.sh, then open http://localhost:8000"
# Changed about a day and a half ago: not in the last 24 hours.
w config/cache.ini "36 hours ago" "[cache]" "host = localhost" "size = 64M"
# Changed in the last 24 hours.
w lib/log.sh "5 hours ago" "log() { echo \"\$(date) \$*\" >&2; }"
w config/mail.ini "2 hours ago" "[mail]" "from = noreply@example.com"
if [ "$VARIANT" = 0 ]; then
  w config/prod.ini "3 hours ago" "[db]" "host = localhost   # quick test, put it back!" "port = 5432"
  w "deploy notes/tuesday.txt" "8 hours ago" "Pointed the API at localhost to try a fix. Forgot to undo it?"
  w lib/api.sh "20 hours ago" "API=https://api.example.com"
else
  w config/prod.ini "3 hours ago" "[db]" "host = db.internal" "port = 5432"
  w "deploy notes/tuesday.txt" "8 hours ago" "Deploy went fine."
  w lib/api.sh "20 hours ago" "API=http://localhost:3000   # TODO: change back"
fi

+++ solution
find app -type f -mtime -1 -exec grep -l localhost {} +

+++ tools
Everything from this chapter, plus one new `find` test:

- `find -mtime -1`: changed less than one day ago
- `find -exec`: runs a command on whatever `find` found
- `grep -l`, `grep -r`

`man find` explains `-mtime`. Type `/-mtime` inside it, then read about numbers with `+` and `-` (search for `Numeric arguments`).

+++ steps
Start with *when*. List what changed in the last day: `find app -type f -mtime -1`

`-mtime -1` means "less than 1 day ago". Without the `-` it means something else, and `+1` means "more than".

`ls -lR app` shows when every file was changed, if you want to see the whole picture.

---
Now *what*. `grep -l localhost` would answer that, but it needs those file names. `find` can hand the files it found to another command with `-exec`. `{}` is where the file names go, and `+` ends the command:

`find app -type f -mtime -1 -exec grep -l localhost {} +`

Press **Check**.

+++ debrief
**Two questions, one command.** `find` answers *when*, `grep` answers *what*, and `-exec` joins them. `grep -rl localhost app` alone lists every old file too.

**Why `-1` and not `1`.** `find` rounds ages down to whole days. `-mtime 1` means "exactly 1 day old", that is between 24 and 48 hours, which finds `config/cache.ini`, the one changed a day and a half ago. `-mtime -1` is under a day; `-mtime +7` is over a week.

**The file with a space.** `deploy notes/tuesday.txt` breaks a tempting shortcut, `grep -l localhost $(find app -mtime -1)`: the shell splits `deploy notes` into two words before `grep` sees them. `-exec` hands each name over whole.

**Other ways to do it**

- `find app -type f -newermt '24 hours ago' -exec grep -l localhost {} +`: an exact cut-off instead of whole days.
- `-exec grep -l localhost {} \;` runs `grep` once per file. `+` packs many files into one `grep`, which is faster.
- `find app -mmin -60`: changed in the last hour. `-mmin` counts minutes.

**Then what?** `ls -l` on each one shows who changed it and when, and `git log` (if it's under git) shows the rest of the story.
