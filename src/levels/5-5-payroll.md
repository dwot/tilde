---
id: payroll
chapter: 5
order: 5
kind: boss
checks: output
title: Payroll
---
`staff.csv` lists everybody in the company: name, department and yearly salary. Its first line is a header.

Finance wants to know what each department costs. Print **one line per department**: the total of its salaries, a space, then the department's name. **Biggest total first**:

```
412000 Engineering
265000 Customer Support
...
```

+++ setup
depts=("Engineering" "Customer Support" "Sales" "Design" "Finance")
first=(Ana Ben Caro Dev Eva Finn Gita Hugo Iris Jun Kai Lea Milo Nia Omar Pia Raj Sol Tess Uri)
RANDOM=$((VARIANT + 3))
echo "name,department,salary" > staff.csv
for i in "${!first[@]}"; do
  d=${depts[(i * 7 + VARIANT) % 5]}
  echo "${first[i]} ${first[(i + 5) % 20]:0:1}.,$d,$(( (RANDOM % 60 + 30) * 1000 + i * 100 ))"
done >> staff.csv

+++ solution
awk -F, 'NR > 1 { pay[$2] += $3 } END { for (d in pay) print pay[d], d }' staff.csv | sort -rn

+++ tools
Everything from this chapter:

- `awk -F,`, fields, patterns, `END`, `NR`
- `sort -n`, `-r`

And one new awk idea: an *array* keyed by text. `pay["Sales"] += 100` keeps a running total for Sales, and `for (d in pay)` goes through every key.

+++ steps
Look at the file: `head -5 staff.csv`. Department is field 2, salary field 3, and the first line is the header.

---
Keep a total per department in an array, skipping line 1, and print them all at the end:

`awk -F, 'NR > 1 { pay[$2] += $3 } END { for (d in pay) print pay[d], d }' staff.csv`

---
`for (d in pay)` goes through the departments in no particular order. Sort the output by number, biggest first: add `| sort -rn`

Press **Check**.

+++ debrief
**Arrays keyed by text.** `pay[$2] += $3` makes a new total the first time it sees a department, and adds to it after that. It's `sort | uniq -c`'s big brother: count, sum or collect anything per key in one pass.

**The header.** Without `NR > 1`, awk adds `salary` (text, so 0) to a department called `department`, and you get an extra `0 department` line at the end.

**Why the total goes first.** `Customer Support` has a space in it, so if the name came first, `sort -k2` would be looking at the wrong word. With the number first, plain `sort -rn` works.

**Other ways to do it**

- `tail -n +2 staff.csv | awk -F, ...`: `tail -n +2` prints from line 2 on.
- Format it nicely: `printf "%8d  %s\n", pay[d], d`.
- One more column is one more array: `n[$2]++` counts heads, and `pay[d] / n[d]` is the average salary.

**Comparing reports.** If you saved last month's as `old.txt`, `diff old.txt <(awk ... | sort -rn)` shows what changed.
