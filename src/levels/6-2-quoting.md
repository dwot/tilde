---
id: say-exactly-this
chapter: 6
order: 2
kind: lesson
checks: output
variants: false
title: Say exactly this
---
Print this line, **exactly** as it is, every character:

```
It's $5 for "the lot", and $HOME is a variable!
```

+++ solution
echo 'It'\''s $5 for "the lot", and $HOME is a variable!'

+++ tools
- `'single quotes'`: everything inside is kept exactly as typed. There's no way to put a `'` inside them.
- `"double quotes"`: `$` still works inside, so `$HOME` turns into your home directory. `\` in front of a character keeps it as it is.
- Two quoted pieces next to each other join into one word: `'abc'"def"` is `abcdef`

+++ steps
Try double quotes first: `echo "It's $5 for "the lot", and $HOME is a variable!"`

`$5` became nothing, `$HOME` became `/home/player`, and the inner `"` ended the quotes early.

---
In double quotes, a backslash keeps the next character as it is. Escape each `$` and each inner `"`:

`echo "It's \$5 for \"the lot\", and \$HOME is a variable!"`

Press **Check**.

+++ debrief
**Single quotes: nothing happens inside.** That makes them the safest choice whenever you don't need a variable. Their only weakness is the `'` itself. To get one in, end the quotes, add an escaped `\'`, and start again: `'It'\''s'`.

**Double quotes: `$`, `` ` `` and `\` still work.** Everything else, spaces included, stays as it is. Use them around anything with a variable in it.

**And `!`?** In an interactive shell, `!` inside double quotes can recall an earlier command: `!!` is the last one, and `!ls` the last that started with `ls`. A `!` right before the closing quote or a space is left alone, so it was safe here. `set +H` turns the feature off.

**Other ways to do it**

- `echo "It's "'$5 for "the lot", and $HOME is a variable!'`: a double-quoted part, then a single-quoted part.
- `printf '%s\n' "..."` is more predictable than `echo` when text might start with `-`.
- `$'It\'s ...'`: bash's C-style quotes, where `\'`, `\n` and `\t` work.

+++ sheet
```bash
echo '$HOME stays as typed'   # single: nothing expands
echo "$HOME expands"          # double: $ still works
echo "a \$ and a \" inside"   # \ escapes in double quotes
echo 'It'\''s'                # a ' inside single quotes
echo $'tab:\there'            # C-style: \t \n \'
```

+++ tip
Single quotes keep everything as typed. Double quotes still expand `$`. Pick single unless you need a variable.
