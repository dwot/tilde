---
id: uniq-count
chapter: 4
order: 3
kind: lesson
checks: output
title: Busiest visitors
---
Each line of `access.log` starts with the visitor's IP address. Print the **three** IPs that show up most, busiest first, each with its count in front (the way `uniq -c` prints it).

+++ setup
ips=(10.0.0.7 192.168.1.20 172.16.4.2 10.0.0.12 192.168.1.5 203.0.113.9)
counts=(14 9 6 4 2 1)
pages=(/ /about /blog /login /rss.xml)
for i in "${!counts[@]}"; do
  ip=${ips[(i + VARIANT * 2) % 6]}
  for ((n = 0; n < counts[i]; n++)); do
    echo "$ip - - [26/Oct/2026:10:$(printf %02d $((n * 4 % 60)))] \"GET ${pages[n % 5]} HTTP/1.1\" 200"
  done
done | shuf --random-source=<(yes $VARIANT) > access.log

+++ solution
cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head -3

+++ tools
You'll chain four commands with pipes (`|`), each one's output feeding the next:

- `cut`: pulls a column out of each line
- `sort`: sorts lines
- `uniq -c`: collapses repeated lines and counts them
- `head`: keeps the first few lines

Try `man uniq` or `cut --help`. In a man page, `/word` searches and `q` quits.

+++ steps
Get just the IPs: `cut -d' ' -f1 access.log`

`-d' '` says fields are separated by spaces, and `-f1` picks the first field.

---
`uniq` only merges duplicates that sit next to each other, so sort first:

`cut -d' ' -f1 access.log | sort`

Press <kbd>↑</kbd> to get your last command back and add to the end of it.

---
Count each IP: add `| uniq -c`. Each line now starts with how many times it appeared.

---
Put the biggest counts first: add `| sort -rn`

`-n` sorts by number (so 14 comes after 9, not before it), and `-r` reverses the order.

---
Keep the top three: add `| head -3`, then press **Check**.

+++ debrief
**Why sort comes first.** `uniq` only compares each line with the one before it, so it needs identical lines next to each other. `sort | uniq -c` is the standard way to count things in the shell.

**Other ways to do it**

- `awk '{print $1}' access.log` does the same job as `cut` here, and copes better with columns separated by more than one space.
- awk can do all the counting itself: `awk '{c[$1]++} END {for (ip in c) print c[ip], ip}' access.log | sort -rn | head -3`

**Options worth knowing**

- `sort -k2`: sort by the second field instead of the whole line
- `sort -u`: sort and drop duplicates in one go (no counts)
- `uniq -d`: show only lines that are repeated
- `head -n 3` is the long form of `head -3`; `tail -3` gives the last three

**A common slip.** `sort -n | tail -3` finds the right three IPs, but lists them smallest first.

+++ sheet
```bash
sort f | uniq -c | sort -rn | head -3   # top 3, counted
cut -d' ' -f1 f        # 1st space-separated field
cut -d, -f2 f.csv      # 2nd comma-separated field
sort -n                # by number (-r reverses)
sort -u                # sorted, without duplicates
```

+++ tip
`uniq` only merges duplicates that are next to each other, so `sort` comes first.
