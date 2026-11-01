---
id: signal-from-noise
chapter: 3
order: 2
kind: lesson
checks: output
title: Signal from noise
---
`server.conf` is mostly comments and blank lines. Print **only the settings**: every line except the comments (lines starting with `#`) and the blank ones.

+++ setup
if [ "$VARIANT" = 0 ]; then
  name=tilde port=8080 color='#3366ff' workers=4 log=/var/log/tilde.log
else
  name=backtick port=9000 color='#ff6600' workers=2 log=/srv/logs/backtick.log
fi
cat > server.conf <<EOF
# server.conf: settings for the $name web server
# Lines starting with # are comments. The server skips them.

# Who we are
name = $name

# Where to listen
port = $port
#port = 80   (needs root, so no)

# How it looks. Colours are written like CSS: #rrggbb
accent = $color

# How hard it works
workers = $workers
timeout = 30

#debug = true
log_file = $log
EOF

+++ solution
grep -v -e '^#' -e '^$' server.conf

+++ tools
- `grep -v`: prints the lines that *don't* match
- `^` in a pattern means "the start of the line", and `$` means "the end of the line"
- `grep -e`: gives `grep` one pattern; use it more than once to match any of several

`man grep` has all three. Type `/-e PATTERNS` inside it to jump there.

+++ steps
Try the obvious one first: `grep -v '#' server.conf`

Look closely. The `accent` setting has gone too, because its colour contains a `#`.

---
You only want lines that *start* with `#`. `^` pins the pattern to the start of the line:

`grep -v '^#' server.conf`

The comments are gone, but the blank lines are still there.

---
An empty line is one where the start is followed straight away by the end: `^$`. Give `grep` both patterns with `-e`:

`grep -v -e '^#' -e '^$' server.conf`

Press **Check**.

+++ debrief
**Anchors.** `^` matches the start of a line and `$` the end, so `^#` means "a `#` that's the first thing on the line", and `^$` means "nothing at all between start and end".

**Quote your patterns.** `'^$'` in single quotes reaches `grep` as written. Without quotes the shell can get to `$` first. Single quotes are the habit to keep.

**Other ways to do it**

- `grep '^[^#]' server.conf`: lines whose first character is anything but `#`. A blank line has no first character, so it's left out too. `[^#]` means "one character that isn't `#`".
- `grep -Ev '^(#|$)' server.conf`: `-E` turns on *extended* patterns, where `|` means "or".
- `grep -v '^#' server.conf | grep -v '^$'`: two filters, one after the other. That's a *pipe*, and chapter 4 is all about them.

**A gotcha.** Real config files often indent their comments, like `    # old value`. To catch those too: `grep -Ev '^\s*(#|$)'`, where `\s*` means "any amount of whitespace".

+++ sheet
```bash
grep '^#' file           # lines starting with #
grep 'end$' file         # lines ending with "end"
grep -v '^$' file        # every line that isn't blank
grep -e cat -e dog file  # lines matching either
grep -E 'cat|dog' file   # the same, with -E's "or"
```

+++ tip
`^` is the start of the line and `$` the end. `[^#]` is any one character except `#`.
