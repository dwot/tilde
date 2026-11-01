---
id: by-the-numbers
chapter: 5
order: 1
kind: lesson
checks: output
title: By the numbers
---
`scores.csv` has one player per line: name, team and points, separated by commas. Print the whole file sorted by **points, highest first**.

+++ setup
names=(Ada Bo Cyd Dee Eli Fox Gus Hal Ivy Jo Kim Lou)
teams=(red blue green)
pts=(7 120 45 9 300 18 64 2 85 150 31 5)
for i in "${!names[@]}"; do
  echo "${names[i]},${teams[(i + VARIANT) % 3]},${pts[(i + VARIANT * 5) % 12]}"
done > scores.csv

+++ solution
sort -t, -k3 -rn scores.csv

+++ tools
- `sort -t`: says what separates the fields (a space or tab if you don't say)
- `sort -k`: which field to sort by
- `sort -n` and `-r`, from chapter 4

`man sort`, and look for `--key`.

+++ steps
`sort` has to know where the columns are. `-t,` says they're separated by commas, and `-k3` picks the third:

`sort -t, -k3 scores.csv`

Look at the order. `120` comes before `18`, and `300` before `45`. It's sorting by the characters, like words in a dictionary.

---
`-n` sorts by number, and `-r` puts the biggest first:

`sort -t, -k3 -rn scores.csv`

Press **Check**.

+++ debrief
**Text order versus number order.** Without `-n`, `sort` compares character by character, so `120` comes before `18` because `2` comes before `8`. Numbers sort properly with `-n`.

**`-k3` means "from field 3 to the end of the line".** Here field 3 is the last one, so it doesn't matter. To sort by field 2 only, write `-k2,2`. With several keys, `sort -t, -k2,2 -k3,3rn` sorts by team, then by points within each team. Flags written right after a key, like the `rn` there, apply to that key only.

**Other things `sort` can do**

- `-h`: "human" sizes, so `2K` comes before `1M`
- `-u`: drop duplicate lines
- `-f`: ignore case

**Seeing the differences.** `diff a.txt b.txt` lists the lines that differ between two files. `diff <(sort -t, -k3 scores.csv) <(sort -t, -k3n scores.csv)` compares two commands' output directly.

+++ sheet
```bash
sort -t, -k3 -rn f.csv    # by 3rd column, biggest first
sort -t, -k2,2 f.csv      # by column 2 only
sort -k2,2 -k3,3n f       # by 2, then by 3 as numbers
sort -h                   # sizes like 2K, 1M, 3G
diff a.txt b.txt          # lines that differ
```

+++ tip
`-t` is the separator, `-k` the column. Add `-n` whenever the column holds numbers.
