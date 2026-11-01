---
id: mkdir
chapter: 2
order: 1
kind: lesson
checks: state
title: Scaffolding
---
You're starting a blog. Make this layout in `~/work` (the files can be empty):

```
blog/
├── README.md
├── images/
└── posts/
    ├── hello-world.md
    └── drafts/
```

+++ check
fail=0
for d in blog blog/images blog/posts blog/posts/drafts; do
  [ -d "$d" ] || { echo "directory $d/ is missing"; fail=1; }
done
for f in blog/README.md blog/posts/hello-world.md; do
  [ -f "$f" ] || { echo "file $f is missing"; fail=1; }
done
exit $fail

+++ solution
mkdir -p blog/images blog/posts/drafts
touch blog/README.md blog/posts/hello-world.md

+++ tools
- `mkdir`: makes a directory. `mkdir -p` makes every directory along the path, as needed.
- `touch`: makes an empty file (or updates the date on one that exists)

`tree blog` draws what you've built so far. Try `man mkdir`.

+++ steps
Make the deepest directory first: `mkdir -p blog/posts/drafts`

`-p` makes `blog/` and `blog/posts/` on the way. Without it, `mkdir` refuses because `blog/` doesn't exist yet.

---
The other directory: `mkdir blog/images`

---
Now the empty files: `touch blog/README.md blog/posts/hello-world.md`

Most commands take several names at once.

---
Compare with the goal: `tree blog`, then press **Check**.

+++ debrief
**`mkdir -p` never complains.** It makes whatever's missing along the path, and it's fine if a directory already exists. That makes it safe to use in scripts.

**Brace expansion** can build it all in one line:

`mkdir -p blog/{images,posts/drafts}`

The shell turns `blog/{images,posts/drafts}` into `blog/images blog/posts/drafts` before `mkdir` runs. Put `echo` in front to see the result first.

**Options worth knowing**

- `mkdir -v`: print each directory as it's made
- `touch -d '2026-01-01' file`: set a file's date (handy for testing)
- `tree -a`: include hidden files; `tree -d`: directories only

**A gotcha.** `touch notes` makes an empty *file* called `notes`, not a directory. If you meant a directory, `mkdir notes` will now fail because the name is taken.

+++ sheet
```bash
mkdir notes              # make a directory
mkdir -p a/b/c           # ...and every one on the way
touch todo.txt           # make an empty file
mkdir -p blog/{images,posts}  # braces: two at once
tree blog                # draw the layout
```

+++ tip
`echo blog/{images,posts}` shows what braces expand to before you use them for real.
