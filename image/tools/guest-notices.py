#!/usr/bin/env python3
# Writes third-party.txt for the guest Linux: every package in it, exactly as built, and where its source is.
# usage: guest-notices.py <rootfs> <licenses dir> <out>
import pathlib
import sys

rootfs, licenses, out = map(pathlib.Path, sys.argv[1:])

packages = []
for block in (rootfs / "lib/apk/db/installed").read_text().split("\n\n"):
    fields = dict(line.split(":", 1) for line in block.splitlines() if line[1:2] == ":")
    if "P" in fields:
        packages.append(fields)
packages.sort(key=lambda p: p["P"])

release = (rootfs / "etc/alpine-release").read_text().strip()
lines = [
    "Tilde's guest Linux",
    "===================",
    "",
    f"The Linux that runs in your browser is built from Alpine Linux {release} (i386) packages, listed below.",
    "They keep their own licences; Tilde's use of them doesn't change those.",
    "",
    "Each package's build recipe and patches are in Alpine's aports repository at the commit shown:",
    "  https://gitlab.alpinelinux.org/alpine/aports/-/tree/<commit>",
    "",
    "The exact source of every package, for this build, is attached to its release:",
    "  https://github.com/dwot/tilde/releases",
    "",
    "Boot firmware, prebuilt by the v86 project and unmodified:",
    "  SeaBIOS 1.16.2 and SeaVGABIOS (bios/seabios.bin, bios/vgabios.bin), LGPL-3.0-only",
    "  Binaries: https://github.com/copy/v86/tree/cc37f35c43bf14865d74ad76879ecf9410f69eb1/bios",
    "  Source:   https://www.seabios.org",
    "",
    "Package  Version  Source package  aports commit  Licence",
    "-------",
]
lines += [f'{p["P"]}  {p["V"]}  {p.get("o", p["P"])}  {p.get("c", "?")}  {p.get("L", "?")}' for p in packages]
for path in sorted(licenses.glob("*.txt")):
    lines += ["", "", "=" * 78, path.stem, "=" * 78, "", path.read_text()]
out.write_text("\n".join(lines) + "\n")
