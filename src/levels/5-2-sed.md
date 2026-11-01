---
id: find-and-replace
chapter: 5
order: 2
kind: lesson
checks: state
title: Find and replace
---
The website in `site/` still links to `http://` addresses. Change **every** `http://` to `https://` in the `.html` files, by editing the files themselves.

Leave `site/notes.txt` alone: it's a record of what the links used to be.

+++ setup
mkdir site
cat > site/index.html <<'EOF'
<h1>Welcome</h1>
<p>Read the <a href="http://example.com/blog">blog</a> or the <a href="http://example.com/faq">FAQ</a>.</p>
<p>Shop at <a href="https://shop.example.com">our shop</a>.</p>
EOF
cat > site/about.html <<'EOF'
<h1>About</h1>
<p>Photos by <a href="http://photos.example.org">a friend</a>.</p>
<img src="http://example.com/logo.png">
EOF
cat > site/contact.html <<'EOF'
<h1>Contact</h1>
<p>Email us, or use <a href="https://example.com/form">the form</a>.</p>
EOF
printf 'Old links, before the move to https:\nhttp://example.com/blog\nhttp://photos.example.org\n' > site/notes.txt

+++ check
fail=0
for f in index about contact; do
  [ -f site/$f.html ] || { echo "site/$f.html is missing"; fail=1; continue; }
  grep -q 'http://' site/$f.html && { echo "site/$f.html still has $(grep -o 'http://' site/$f.html | wc -l) http:// in it"; fail=1; }
  grep -q 'httpss' site/$f.html && { echo "site/$f.html has httpss in it: an https:// link got changed too"; fail=1; }
done
[ "$(grep -o 'https://' site/index.html 2>/dev/null | wc -l)" = 3 ] || { [ $fail = 0 ] && { echo "site/index.html should have 3 https:// links"; fail=1; }; }
[ "$(grep -c '^http://' site/notes.txt 2>/dev/null)" = 2 ] || { echo "site/notes.txt has changed: it should still say http://"; fail=1; }
exit $fail

+++ solution
sed -i 's|http://|https://|g' site/*.html

+++ tools
- `sed`: edits text as it streams through, line by line. `s/old/new/` replaces text.
- `sed -i`: edits a file in place instead of printing the result

`sed` without `-i` only prints, so you can try things safely. `man sed` is short; `info sed` has examples.

+++ steps
Try it without changing anything. `sed` prints the edited text:

`sed 's/http:/https:/' site/index.html`

Look at the second line: only its first link changed.

---
`s///` replaces the first match on each line. `g` at the end means every match:

`sed 's/http:/https:/g' site/index.html`

---
Happy with it? `-i` writes the changes back, and `*.html` covers all three pages but not `notes.txt`:

`sed -i 's/http:/https:/g' site/*.html`

`grep http: site/*` to see what's left, then press **Check**.

+++ debrief
**Why `http:` and not `http`.** `s/http/https/g` also turns `https://` into `httpss://`, because `https` starts with `http`. Include enough of the pattern to match only what you mean.

**Slashes in the pattern.** `s/http:\/\//https:\/\//g` works, but the backslashes are hard to read. `sed` takes whatever character follows the `s` as its separator, so `s|http://|https://|g` says the same thing.

**Test before `-i`.** Run it without `-i` first, or keep a copy: `sed -i.bak ...` saves each original as `file.bak` before editing it.

**Options worth knowing**

- `sed -n '5,10p' f`: print lines 5 to 10 only
- `sed '/^#/d' f`: delete the lines that match
- `sed 's/old/new/2'`: only the second match on each line
- `s/colou?r/color/` needs `sed -E` for `?`, `+` and `|`

+++ sheet
```bash
sed 's/old/new/' f      # first match per line, printed
sed 's/old/new/g' f     # every match
sed -i 's/old/new/g' f  # edit the file itself
sed -i.bak 's/a/b/g' f  # ...keeping f.bak
sed 's|/usr|/opt|g' f   # any separator after s
sed '/^#/d' f           # delete matching lines
```

+++ tip
Run `sed` without `-i` first: it only prints, so you can see the result before you commit to it.
