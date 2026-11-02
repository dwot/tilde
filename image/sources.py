#!/usr/bin/env python3
# Collects the source of everything listed in third-party.txt: Alpine's recipe and patches at the exact commit
# each package was built from, plus the upstream files that recipe names, checked against its sha512sums.
# Runs inside image/sources.sh's container, because reading a recipe means running it.
# usage: sources.py <third-party.txt> <out>
import hashlib
import pathlib
import subprocess
import sys
import tarfile
import urllib.parse

ALPINE_BRANCH = "3.21"
DISTFILES = f"https://distfiles.alpinelinux.org/distfiles/v{ALPINE_BRANCH}/"
# Alpine's mirror for the bulk of it: cloning gitlab.alpinelinux.org failed on GitHub's runners. The mirror can lag,
# so a commit it doesn't have yet comes straight from Alpine.
APORTS = "https://github.com/alpinelinux/aports.git"
ALPINE = ("https://git.alpinelinux.org/aports", "https://gitlab.alpinelinux.org/alpine/aports.git")
# Recipes whose files don't ship: linux-firmware-none is an empty package, so its huge source isn't needed.
EMPTY = {"linux-firmware"}
BIOS = ("seabios-rel-1.16.2.tar.gz", "https://github.com/coreboot/seabios/archive/refs/tags/rel-1.16.2.tar.gz")

manifest, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
tree = out / "tilde-sources"
tree.mkdir(parents=True)


def run(*args, **kw):
    result = subprocess.run(args, text=True, capture_output=True, **kw)
    if result.returncode:
        sys.exit(f"{' '.join(args)} failed:\n{result.stderr}")
    return result.stdout


def fetch(urls, dest):
    for url in urls:
        if subprocess.run(["curl", "-fsSL", "--retry", "2", "-m", "900", "-o", str(dest), url]).returncode == 0:
            return True
    dest.unlink(missing_ok=True)
    return False


body = manifest.read_text().split("-------\n", 1)[1].split("\n\n", 1)[0]
wanted = sorted({tuple(line.split("  ")[2:4]) for line in body.splitlines()})

run("git", "clone", "-q", "--filter=blob:none", "--no-checkout", "--single-branch", "--branch", f"{ALPINE_BRANCH}-stable",
    APORTS, "/aports")



def has_commit(commit):
    return subprocess.run(["git", "-C", "/aports", "cat-file", "-e", f"{commit}^{{commit}}"], capture_output=True).returncode == 0


problems = []
for origin, commit in wanted:
    for url in ALPINE:
        if has_commit(commit):
            break
        print(f"{origin}: fetching {commit[:10]} from {url}", flush=True)
        subprocess.run(["git", "-C", "/aports", "fetch", "-q", "--depth=1", url, commit])
    repo = next((r for r in ("main", "community")
                 if subprocess.run(["git", "-C", "/aports", "cat-file", "-e", f"{commit}:{r}/{origin}/APKBUILD"],
                                   capture_output=True).returncode == 0), None)
    if repo is None:
        problems.append(f"{origin} {commit}: recipe not found")
        continue
    dest = tree / "alpine" / f"{origin}-{commit[:10]}"
    dest.mkdir(parents=True)
    archive = subprocess.run(["git", "-C", "/aports", "archive", commit, f"{repo}/{origin}"], check=True, capture_output=True).stdout
    subprocess.run(["tar", "-x", "--strip-components=2", "-C", str(dest)], input=archive, check=True)
    (dest / "ALPINE_COMMIT").write_text(f"{commit}\n{repo}/{origin}\n")

    script = 'CBUILD=i586-alpine-linux-musl CHOST=$CBUILD CARCH=x86; . ./APKBUILD >/dev/null 2>&1; printf "%s\\n" $source; echo ---; printf "%s\\n" "$sha512sums"'
    sources, _, sums = run("bash", "-c", script, cwd=dest).partition("---\n")
    expected = dict(reversed(l.split()) for l in sums.splitlines() if len(l.split()) == 2)
    for entry in () if origin in EMPTY else sources.split():
        name, _, url = entry.rpartition("::")
        if "://" not in url:
            continue
        name = name or urllib.parse.urlsplit(url).path.rsplit("/", 1)[1]
        file = dest / name
        if not fetch([DISTFILES + name, url], file):
            problems.append(f"{origin}: could not download {name} ({url})")
            continue
        digest = hashlib.sha512(file.read_bytes()).hexdigest()
        if expected.get(name) != digest:
            problems.append(f"{origin}: {name} doesn't match the recipe's sha512")
    print(origin, flush=True)

(tree / "bios").mkdir()
if not fetch([BIOS[1]], tree / "bios" / BIOS[0]):
    problems.append(f"could not download {BIOS[0]}")
(tree / "third-party.txt").write_bytes(manifest.read_bytes())
(tree / "README.txt").write_text(
    "Source for the software in Tilde's guest Linux and its boot firmware.\n"
    "alpine/<package>-<commit>/ holds Alpine's recipe, patches and upstream files for one package.\n"
    "third-party.txt lists every binary package and the commit it was built from.\n")
(tree / "PROBLEMS.txt").write_text("".join(p + "\n" for p in problems))

with tarfile.open(out / "tilde-sources.tar", "w") as tar:
    tar.add(tree, arcname="tilde-sources")
print(f"{len(wanted)} packages, {len(problems)} problems")
print(*problems, sep="\n")
sys.exit(1 if problems else 0)
