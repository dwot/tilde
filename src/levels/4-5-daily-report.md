---
id: daily-report
chapter: 4
order: 5
kind: boss
checks: state
title: Daily report
---
The web server writes a log file per server: `logs/web1.log`, `logs/web2.log` and `logs/web3.log`. Each line is one request:

```
2026-10-26 09:14:02 INFO GET /blog 200
```

Your manager wants `report.txt` in `~/work`, laid out exactly like this, but with the real numbers:

```
Daily report
Requests: 210
Errors: 12
Top pages:
     41 /news
     30 /faq
     22 /jobs
```

- **Requests**: lines in all three logs together
- **Errors**: lines with `ERROR` on them, in all three logs together
- **Top pages**: the three busiest pages, busiest first, with counts the way `uniq -c` prints them

Spacing doesn't matter. You'll need more than one command.

+++ setup
mkdir logs
pages=(/ /blog /about /shop /contact /rss.xml /login)
weights=(19 41 30 22 9 6 4)
RANDOM=11
for s in 1 2 3; do
  for p in "${!pages[@]}"; do
    for ((n = 0; n < weights[p] / 3 + s + p % 2; n++)); do
      lvl=INFO; code=200
      ((RANDOM % 9 == 0)) && { lvl=ERROR; code=500; }
      printf '2026-10-26 %02d:%02d:%02d %s GET %s %s\n' $((8 + RANDOM % 10)) $((RANDOM % 60)) $((RANDOM % 60)) $lvl "${pages[p]}" $code
    done
  done | sort > logs/web$s.log
done

+++ check
norm() { sed 's/[[:space:]]\+/ /g; s/^ //; s/ $//' | grep -v '^$'; }
want=$( {
  echo "Daily report"
  echo "Requests: $(cat logs/*.log | wc -l)"
  echo "Errors: $(cat logs/*.log | grep -c ERROR)"
  echo "Top pages:"
  cat logs/*.log | cut -d' ' -f5 | sort | uniq -c | sort -rn | head -3
} | norm)
[ -f report.txt ] || { echo "report.txt is missing"; exit 1; }
have=$(norm < report.txt)
[ "$have" = "$want" ] && exit 0
mapfile -t w <<< "$want"
mapfile -t h <<< "$have"
for i in "${!w[@]}"; do
  if [ "${h[i]}" != "${w[i]}" ]; then
    case "${h[i]}" in
      Requests:*logs*|Requests:*total*) echo "line $((i + 1)): wc -l on several files prints a count per file. Count the lines of all three joined together" ;;
      Errors:*logs/*) echo "line $((i + 1)): grep -c on several files prints a count per file. You want one count for all three" ;;
      "") echo "line $((i + 1)) should be: ${w[i]}" ;;
      *) echo "line $((i + 1)) is \"${h[i]}\", but should be: ${w[i]}" ;;
    esac
    exit 1
  fi
done
echo "report.txt has $((${#h[@]} - ${#w[@]})) more lines than it should, after the top three pages"
exit 1

+++ solution
echo "Daily report" > report.txt
echo -n "Requests: " >> report.txt
cat logs/*.log | wc -l >> report.txt
echo -n "Errors: " >> report.txt
cat logs/*.log | grep -c ERROR >> report.txt
echo "Top pages:" >> report.txt
cat logs/*.log | cut -d' ' -f5 | sort | uniq -c | sort -rn | head -3 >> report.txt

+++ tools
Everything from this chapter:

- `>` and `>>`
- pipes, `sort`, `uniq -c`, `head`, `cut` (the page is field 5)
- `wc -l`, `grep -c`
- `cat` joins files together

And one new trick: `echo -n` prints without a newline at the end, so whatever you add next carries on the same line.

+++ steps
Start the file: `echo "Daily report" > report.txt`

Use `>>` from now on, or you'll start again each time.

---
The label, without ending the line: `echo -n "Requests: " >> report.txt`

---
Count every line in every log. `wc -l logs/*.log` gives a count per file plus a total, so join them first:

`cat logs/*.log | wc -l >> report.txt`

`cat report.txt` to see how it's going.

---
The same for errors. `grep -c` on three files also gives three counts, so:

`echo -n "Errors: " >> report.txt`, then `cat logs/*.log | grep -c ERROR >> report.txt`

---
`echo "Top pages:" >> report.txt`, then the busiest pages, as in Busiest visitors:

`cat logs/*.log | cut -d' ' -f5 | sort | uniq -c | sort -rn | head -3 >> report.txt`

`cat report.txt`, then press **Check**.

+++ debrief
**One file, built up a piece at a time.** `>` once at the start, then `>>` for everything after it. If it goes wrong, the first `>` starts you over.

**Counting across several files.** `wc -l` and `grep -c` count per file when you give them several. Joining the files with `cat` first turns them into one stream, so you get one number. `grep -h ERROR logs/*.log | wc -l` works too: `-h` leaves the file names off.

**Shorter ways**

- `echo "Requests: $(cat logs/*.log | wc -l)" >> report.txt`: `$( )` drops a command's output into the middle of another command. That's *command substitution*, and chapter 6 uses it a lot.
- A group, `{ ...; }`, sends several commands into one file with a single redirection:

```bash
{
  echo "Daily report"
  echo "Requests: $(cat logs/*.log | wc -l)"
} > report.txt
```

**Watching as you go.** `tee` writes to a file *and* the screen: `... | head -3 | tee -a report.txt` shows you the lines it's adding. `-a` appends, like `>>`.
