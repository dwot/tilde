// Every trap the course is meant to catch, and the alternative answers it should accept. Level by level, in play order.
// Careful in bash strings: "\\;" in JavaScript is only ";", so B stands in for a backslash.
const B = "\x5c";

export const scenarios = {
  "cat": async (t) => {
    await t.type("cat notes.txt"); await t.solved("1-1");
  },
  "cd": async (t) => {
    await t.type("cd archive/2024/q3/reports"); await t.type("pwd"); await t.type("cat summary.txt");
    await t.solved("1-2 via cd");
  },
  "hidden": async (t) => {
    await t.type("ls"); await t.rejected("1-3 just ls");
    await t.page.click("#btn-tools");
    await t.type("ls -a"); await t.type("cat .note-to-self"); await t.solved("1-3 with toolbox", "★★☆");
  },
  "tail": async (t) => {
    await t.type("tail server.log"); await t.rejected("1-4 ten lines");
    await t.type("tail -n 5 server.log"); await t.solved("1-4");
  },
  "treasure-hunt": async (t) => {
    for (const c of ["cat start.txt", "cd house/attic", "cat box.txt", "cd ../cellar", "ls -a", "cat .whisper", "cd ../../garden", "tail -n 1 diary.txt", "cd shed", "ls", "cat treasure.txt"]) await t.type(c, 700);
    await t.rejected("1-5 decoy");
    await t.type("ls -a"); await t.type("cat .treasure");
    await t.solved("1-5");
  },
  "mkdir": async (t) => {
    await t.type("mkdir blog/posts/drafts");
    await t.rejected("2-1 without -p");
    await t.type("mkdir -p blog/{images,posts/drafts}"); await t.type("touch blog/README.md blog/posts/hello-world.md");
    await t.solved("2-1");
  },
  "cp": async (t) => {
    await t.type("mkdir site-backup"); await t.type("cp -r site site-backup");
    await t.rejected("2-2 copied into existing dir");
    await t.type("rm -r site-backup"); await t.type("cp -r site site-backup"); await t.type("cp config.yml{,.bak}");
    await t.solved("2-2");
  },
  "mv-glob": async (t) => {
    await t.type("mv downloads/*.jpg photos/");
    await t.solved("2-3");
  },
  "rm": async (t) => {
    await t.type("rm essay/draft*.txt"); await t.type("rmdir essay/scratch");
    await t.rejected("2-4 star wildcard");
    await t.reset();
    await t.type("cd essay"); await t.type("echo draft?.txt"); await t.type("rm draft?.txt"); await t.type("rmdir old"); await t.type("rm -r scratch");
    await t.solved("2-4");
  },
  "moving-day": async (t) => {
    await t.type("mkdir images docs music"); await t.type("mv inbox/*.jpg inbox/*.png images/"); await t.type("mv inbox/*.pdf inbox/*.txt docs/"); await t.type("mv inbox/*.mp3 music/");
    await t.rejected("2-5 missed the JPG");
    await t.type("mv inbox/*.JPG images/");
    await t.solved("2-5");
  },
  "grep-count": async (t) => {
    await t.type("grep -c ERROR app.log");
    await t.solved("3-1");
  },
  "signal-from-noise": async (t) => {
    await t.type("grep -v '#' server.conf");
    await t.rejected("3-2 drops the colour");
    await t.type("grep -v '^#' server.conf");
    await t.rejected("3-2 blank lines left");
    await t.type("grep '^[^#]' server.conf");
    await t.solved("3-2 alt");
    await t.reset();
    await t.type("grep -v -e '^#' -e '^$' server.conf");
    await t.solved("3-2");
  },
  "wheres-that-todo": async (t) => {
    await t.type("grep -rl TODO .");
    await t.rejected("3-3 from .");
    await t.type("echo src/main.sh src/lib/net.sh src/ui/widgets/button.sh | tr ' ' '\\n'");
    await t.rejected("3-3 hard-coded");
    await t.type("grep -rl TODO src/");
    await t.solved("3-3 trailing slash");
    await t.reset();
    await t.type("grep -rl TODO src");
    await t.solved("3-3");
  },
  "find-delete": async (t) => {
    await t.type("find project -name '*.tmp' -delete");
    await t.solved("3-4");
  },
  "who-broke-it": async (t) => {
    await t.type("ls -lR app");
    await t.type("grep -rl localhost app");
    await t.rejected("3-5 grep only");
    await t.type("find app -type f -mtime 1 -exec grep -l localhost {} +");
    await t.rejected("3-5 -mtime 1");
    await t.type("grep -l localhost $(find app -type f -mtime -1)");
    await t.rejected("3-5 word splitting");
    await t.type("find app -type f -newermt '24 hours ago' -exec grep -l localhost {} \\;");
    await t.solved("3-5 alt");
    await t.reset();
    await t.type("find app -type f -mtime -1 -exec grep -l localhost {} +");
    await t.solved("3-5");
  },
  "save-it-for-later": async (t) => {
    await t.type("ls photos > contents.txt"); await t.type("echo END OF LIST > contents.txt");
    await t.rejected("4-1 overwrote");
    await t.type("ls photos > contents.txt");
    await t.rejected("4-1 half done");
    await t.type("echo END OF LIST >> contents.txt");
    await t.solved("4-1");
  },
  "quiet-please": async (t) => {
    await t.type("find system -name '*.conf'");
    await t.type("find system -name '*.conf' > found.txt 2>&1");
    await t.rejected("4-2 2>&1");
    await t.type("find system -name '*.conf' > found.txt 2> errors.txt");
    await t.solved("4-2");
  },
  "uniq-count": async (t) => {
    await t.type("cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head -3");
    await t.solved("4-3");
  },
  "where-did-my-data-go": async (t) => {
    await t.type("cp names.bak names.txt"); await t.type("sort names.txt > names.txt");
    await t.rejected("4-4 again");
    await t.type("cp names.bak names.txt");
    await t.rejected("4-4 unsorted");
    await t.type("sort -o names.txt names.txt");
    await t.solved("4-4");
  },
  "daily-report": async (t) => {
    await t.type("cat logs/*.log | cut -d' ' -f5 | sort | uniq -c | sort -rn");
    await t.type("echo 'Daily report' > report.txt"); await t.type("echo -n 'Requests: ' >> report.txt"); await t.type("wc -l logs/*.log >> report.txt");
    await t.rejected("4-5 wc per file");
    await t.type("echo 'Daily report' > report.txt"); await t.type("echo \"Requests: $(cat logs/*.log | wc -l)\" >> report.txt"); await t.type("echo -n 'Errors: ' >> report.txt"); await t.type("grep -c ERROR logs/*.log >> report.txt");
    await t.rejected("4-5 grep per file");
    await t.type("echo 'Daily report' > report.txt"); await t.type("echo \"Requests: $(cat logs/*.log | wc -l)\" >> report.txt"); await t.type("echo -n 'Errors: ' >> report.txt"); await t.type("cat logs/*.log | grep -c ERROR >> report.txt");
    await t.type("echo 'Top pages:' >> report.txt"); await t.type("cat logs/*.log | cut -d' ' -f5 | sort | uniq -c | sort -rn | head -3 | tee -a report.txt");
    await t.type("cat report.txt");
    await t.solved("4-5");
  },
  "by-the-numbers": async (t) => {
    await t.type("sort -t, -k3 -r scores.csv");
    await t.rejected("5-1 no -n");
    await t.type("sort -k3 -rn scores.csv");
    await t.rejected("5-1 no -t");
    await t.type("sort -t, -k3 -rn scores.csv");
    await t.solved("5-1");
  },
  "find-and-replace": async (t) => {
    await t.type("sed -i 's/http/https/g' site/*.html");
    await t.rejected("5-2 httpss");
    await t.reset();
    await t.type("sed -i 's/http:/https:/' site/*");
    await t.rejected("5-2 no g, notes too");
    await t.reset();
    await t.type("sed -i 's|http://|https://|g' site/*.html");
    await t.solved("5-2");
  },
  "columns-that-add-up": async (t) => {
    await t.type("grep 404 access.log | awk '{ t += $10 } END { print t }'");
    await t.rejected("5-3 grep");
    await t.type("awk '$9 == 404 { total += $10 } END { print total }' access.log");
    await t.solved("5-3");
  },
  "windows-got-here-first": async (t) => {
    await t.type("bash backup.sh");
    await t.type(`tr -d '${B}r' < backup.sh > backup.sh`);
    await t.rejected("5-4 emptied");
    await t.reset();
    await t.type(`tr -d '${B}r' < backup.sh > fixed.sh && mv fixed.sh backup.sh`);
    await t.type("rm -rf backup* ; ls");
    await t.rejected("5-4 tr");
    await t.reset();
    await t.type(`sed -i 's/${B}r$//' backup.sh`); await t.type("bash backup.sh");
    await t.solved("5-4");
  },
  "payroll": async (t) => {
    await t.type("cat staff.csv");
    await t.type("awk -F, '{ pay[$2] += $3 } END { for (d in pay) print pay[d], d }' staff.csv | sort -rn");
    await t.rejected("5-5 header");
    await t.type("awk -F, 'NR > 1 { pay[$2] += $3 } END { for (d in pay) print pay[d], d }' staff.csv");
    await t.rejected("5-5 unsorted");
    await t.type("awk -F, 'NR > 1 { pay[$2] += $3 } END { for (d in pay) print pay[d], d }' staff.csv | sort -rn");
    await t.solved("5-5");
  },
  "fill-in-the-blanks": async (t) => {
    await t.type("echo 'photos has $(ls photos | wc -l) files'");
    await t.rejected("6-1 single quotes");
    await t.type("echo photos has 7 files");
    await t.rejected("6-1 hard-coded");
    await t.type("n=$(ls photos | wc -l); echo \"photos has $n files\"");
    await t.solved("6-1 variable");
  },
  "say-exactly-this": async (t) => {
    await t.type(`echo "It's $5 for "the lot", and $HOME is a variable!"`);
    await t.rejected("6-2 naive");
    await t.type(`echo "It's ${B}$5 for ${B}"the lot${B}", and ${B}$HOME is a variable!"`);
    await t.solved("6-2 double");
    await t.type(`echo 'It'${B}''s $5 for "the lot", and $HOME is a variable!'`);
    await t.solved("6-2 single");
  },
  "one-at-a-time": async (t) => {
    await t.type("for f in camera/*.jpeg; do mv $f ${f%.jpeg}.jpg; done");
    await t.rejected("6-3 unquoted");
    await t.reset();
    await t.type('for f in camera/*.jpeg; do mv "$f" "${f%.jpeg}.jpg"; done');
    await t.solved("6-3");
  },
  "spaces-strike-back": async (t) => {
    await t.type("bash -x make-backups.sh 2>&1 | head -12");
    await t.type(`sed -i 's/cp $f $f.bak/cp "$f" "$f.bak"/' make-backups.sh`);
    await t.rejected("6-4 half fixed");
    await t.type(`sed -i 's/for f in $(ls ${B}*.txt); do/for f in *.txt; do/' make-backups.sh`);
    await t.type("cat make-backups.sh; bash make-backups.sh");
    await t.solved("6-4");
  },
  "batch-job": async (t) => {
    await t.type(`for name in $(cat list.txt); do mkdir "projects/$name"; done`);
    await t.rejected("6-5 for split");
    await t.reset();
    await t.type(`i=1; while read -r name; do mkdir -p "projects/$i-$name"; echo "$name" > "projects/$i-$name/notes.txt"; i=$((i + 1)); done < list.txt`);
    await t.rejected("6-5 lost last line");
    await t.reset();
    await t.type("i=1");
    await t.type(`while read -r name || [ -n "$name" ]; do`, 300);
    await t.type(`  mkdir -p "projects/$i-$name"`, 300);
    await t.type(`  echo "$name" > "projects/$i-$name/notes.txt"`, 300);
    await t.type(`  i=$((i + 1))`, 300);
    await t.type(`done < list.txt`);
    await t.type("ls projects");
    await t.solved("6-5");
  },
  "first-script": async (t) => {
    await t.write("greet.sh", ['echo "Hello, $1!"']);
    await t.solved("7-1");
  },
  "run-it-like-a-program": async (t) => {
    await t.type("mkdir ~/bin");
    await t.write("~/bin/hello", ['echo "Hello from ~/bin!"']);
    await t.rejected("7-2 no shebang");
    await t.write("~/bin/hello", ["#!/bin/bash", 'echo "Hello from ~/bin!"']);
    await t.rejected("7-2 not executable");
    await t.type("chmod +x ~/bin/hello");
    await t.type("hello");
    await t.type("source ~/.bashrc; cd /tmp; hello; type hello");
    await t.solved("7-2");
  },
  "check-your-inputs": async (t) => {
    await t.rejected("7-3 untouched");
    await t.write("count-lines.sh", ["#!/bin/bash", "if [ $# -eq 0 ]; then", '  echo "usage: count-lines.sh FILE"', "  exit 1", "fi",
      "if [ ! -f $1 ]; then", '  echo "count-lines.sh: no such file: $1" >&2', "  exit 2", "fi", 'wc -l < "$1"']);
    await t.rejected("7-3 stdout + unquoted");
    await t.write("count-lines.sh", ["#!/bin/bash", "if [ $# -eq 0 ]; then", '  echo "usage: count-lines.sh FILE" >&2', "  exit 1", "fi",
      'if [ ! -f "$1" ]; then', '  echo "count-lines.sh: no such file: $1" >&2', "  exit 2", "fi", 'wc -l < "$1"']);
    await t.solved("7-3");
  },
  "brittle-cleanup": async (t) => {
    await t.type('bash clean-cache.sh "web cache"; ls');
    await t.rejected("7-4 broken");
    await t.reset();
    await t.type(`sed -i 's/cd $dir/cd "$dir"/' clean-cache.sh`);
    await t.rejected("7-4 quoted only");
    await t.type(`sed -i '2i set -euo pipefail' clean-cache.sh`);
    await t.type("cat clean-cache.sh; bash clean-cache.sh nowhere; echo $?");
    await t.solved("7-4");
  },
  "backup-script": async (t) => {
    await t.write("backup.sh", ["#!/bin/bash", "set -euo pipefail", 'name=$(basename "$1")', 'tar -czf "backups/$name-$(date +%F).tar.gz" "$1"',
      "ls backups/*.tar.gz | sort | head -n -3 | while read -r old; do", '  rm "$old"', "done"]);
    await t.rejected("7-5 no checks, deletes photos");
    await t.write("backup.sh", ["#!/bin/bash", "set -euo pipefail", 'if [ $# -ne 1 ] || [ ! -d "$1" ]; then', '  echo "usage: backup.sh DIR" >&2', "  exit 1", "fi",
      'name=$(basename "$1")', 'tar -czf "backups/$name-$(date +%F).tar.gz" "$1"']);
    await t.rejected("7-5 no tidying");
    await t.write("backup.sh", ["#!/bin/bash", "set -euo pipefail", 'if [ $# -ne 1 ] || [ ! -d "$1" ]; then', '  echo "usage: backup.sh DIR" >&2', "  exit 1", "fi",
      'name=$(basename "$1")', 'tar -czf "backups/$name-$(date +%F).tar.gz" "$1"',
      'ls backups/"$name"-*.tar.gz | sort | head -n -3 | while read -r old; do', '  rm "$old"', "done"]);
    await t.type("bash backup.sh docs");
    await t.solved("7-5");
  },
  "permission-denied": async (t) => {
    await t.type("ls -l; ./deploy.sh");
    await t.type("chmod 777 deploy.sh secrets.env");
    await t.rejected("8-1 777");
    await t.type("chmod 755 deploy.sh; chmod 640 secrets.env");
    await t.rejected("8-1 640");
    await t.type("chmod 600 secrets.env");
    await t.solved("8-1");
  },
  "runaway": async (t) => {
    await t.type("pkill sync");
    await t.rejected("8-2 killed wrong one");
    await t.reset();
    await t.type("kill $(pgrep thumbnailer)");
    await t.solved("8-2");
  },
  "disk-full": async (t) => {
    await t.type("ls -lh");
    await t.type("du -sh * | sort -n");
    await t.rejected("8-3 sort -n");
    await t.type("du -sh */ | sort -h");
    await t.rejected("8-3 trailing slash");
    await t.type("du -sh * | sort -h");
    await t.solved("8-3");
  },
  "make-it-yours": async (t) => {
    await t.type("alias ll='ls -lh'; export PATH=\"$PATH:$HOME/work/tools\"; wordcount fox.txt");
    await t.rejected("8-4 only in this shell");
    await t.type("echo \"alias ll='ls -lh'\" >> ~/.bashrc");
    await t.type("echo 'export PATH=\"$PATH:$HOME/work/tools\"' >> ~/.bashrc");
    await t.type("tail -3 ~/.bashrc");
    await t.solved("8-4");
  },
  "on-call": async (t) => {
    await t.type("ps aux | grep app/bin");
    await t.type("gzip app/logs/app.log", 2500); await t.type("ls -l app/logs");
    await t.rejected("8-5 gzip first");
    await t.reset();
    await t.type("pkill -x debug-tracer; gzip app/logs/app.log; chmod 644 app/config.ini");
    await t.type("echo 'Stopped debug-tracer' > handover.txt", 2000);
    await t.type("ls -l app/logs app; pgrep -a -u player");
    await t.solved("8-5");
  },
};
