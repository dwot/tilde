---
id: treasure-hunt
chapter: 1
order: 5
kind: boss
checks: output
title: Treasure hunt
---
Somebody hid a treasure in this directory and left a trail of clues. Start with `start.txt`, follow the clues, and **print the treasure**.

+++ setup
mkdir -p house/attic house/cellar house/kitchen garden/shed
echo "Clue 1: Go into house/attic and read box.txt." > start.txt
printf 'Old photos, a broken lamp, and a note:\nClue 2: The next clue is in the cellar, hidden. Its name starts with a dot.\n' > house/attic/box.txt
echo "Just a broken lamp." > house/attic/lamp.txt
echo "Jam, from 2019. Best not." > house/cellar/jars.txt
echo "Clue 3: From the cellar, the garden is ../../garden. The LAST line of diary.txt there has your next clue." > house/cellar/.whisper
echo "The kettle's on." > house/kitchen/kettle.txt
weather=(sunny rainy windy foggy cold warm)
chores=("weeded the beds" "fixed the fence" "read in the shed" "picked apples" "fed the birds" "raked leaves")
RANDOM=$((VARIANT + 5))
for day in $(seq 1 240); do
  echo "Day $day: ${weather[RANDOM % 6]}. ${chores[RANDOM % 6]^}."
done > garden/diary.txt
echo "Clue 4: The treasure is in the shed, in a file plain ls won't show you. Print it." >> garden/diary.txt
echo "Nice try, but not this one." > garden/shed/treasure.txt
echo "A rake and three flowerpots." > garden/shed/tools.txt
treasures=("a brass compass" "a jar of gold coins" "a silver pocket watch" "a map to an even bigger treasure")
printf 'You found it: %s!\n' "${treasures[VARIANT]}" > garden/shed/.treasure

+++ solution
cat garden/shed/.treasure

+++ tools
Everything from this chapter:

- `cat`, `ls`, `ls -a`
- `cd`, `cd ..`, `pwd`
- `tail`

+++ steps
Read the first clue: `cat start.txt`

---
Follow it: `cd house/attic`, then `cat box.txt`.

---
Over to the cellar, next door: `cd ../cellar`, then `ls -a` to find the hidden clue, and `cat .whisper`.

---
`cd ../../garden`: up out of `cellar`, up out of `house`, and into `garden`. Then `tail -n 1 diary.txt` for its last line.

---
`cd shed`, `ls -a`, and print the file plain `ls` didn't show: `cat .treasure`. Then press **Check**.

+++ debrief
**Every move in this chapter, in one hunt**: reading files, going into directories and back out with `..`, finding hidden files, and reading just the end of a long file.

**Shortcuts you could have taken**

- `ls -aR` lists everything, everywhere below where you are, hidden files included.
- `find . -name '.*'` lists only the hidden names (`find` is chapter 3).
- `cat garden/shed/.treasure` from `~/work` works without any `cd`, once you know where it is.

**`../../garden`** reads from left to right: up one level, up another, then into `garden`. You can mix `..` and names anywhere in a path, like `../cellar/.whisper`.
