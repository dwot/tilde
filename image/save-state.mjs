// Boots the guest once in node, waits until the player's shell and the game agent are both up, then saves the
// machine's state to public/v86/state.bin. The page restores that instead of booting, so it starts at once.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import url from "node:url";
import { V86 } from "v86";

const dir = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "../public/v86");
const wasm_path = path.join(path.dirname(url.fileURLToPath(import.meta.resolve("v86"))), "v86.wasm");
const t0 = Date.now();

const emulator = new V86({
  wasm_path,
  bios: { url: path.join(dir, "seabios.bin") },
  vga_bios: { url: path.join(dir, "vgabios.bin") },
  memory_size: 128 * 1024 * 1024,
  vga_memory_size: 2 * 1024 * 1024,
  autostart: true,
  uart1: true,
  bzimage_initrd_from_filesystem: true,
  cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable init_on_free=on quiet",
  filesystem: { baseurl: path.join(dir, "rootfs/"), basefs: path.join(dir, "fs.json") },
});

let term = "", agent = "", shellUp = false, agentUp = false, done = false;
emulator.add_listener("serial0-output-byte", (b) => {
  term += String.fromCharCode(b);
  if (!shellUp && term.endsWith("$ ")) { shellUp = true; maybeSave(); }
});
emulator.add_listener("serial1-output-byte", (b) => {
  agent += String.fromCharCode(b);
  if (!agentUp && agent.includes("\x1eready\n")) { agentUp = true; maybeSave(); }
  const m = agent.match(/\x1e(\w+) (\d+) (\S*) (\S*)\n/);
  if (m && m[1] === "probe") {
    console.log(`agent says (exit ${m[2]}): ${Buffer.from(m[3], "base64").toString().trim()}`);
    save();
  }
});

function maybeSave() {
  if (!shellUp || !agentUp) return;
  console.log(`booted in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  // The probe also checks a long request survives the serial line, and that in_work's bind mount works.
  const filler = "#" + "x".repeat(12000) + "\n";
  const script = Buffer.from(filler + "bash --version | head -1; d=$(mktemp -d); echo hi > $d/f; chown -R player $d; in_work $d 'whoami; pwd; cat f'").toString("base64");
  emulator.serial_send_bytes(1, new TextEncoder().encode(`probe ${script}\n`));
}

async function save() {
  if (done) return;
  done = true;
  agent = "";
  // Drop the page cache so the snapshot doesn't carry file contents the 9p loader can fetch on demand.
  const script = Buffer.from("sync; echo 3 > /proc/sys/vm/drop_caches").toString("base64");
  emulator.serial_send_bytes(1, new TextEncoder().encode(`drop ${script}\n`));
  await new Promise((r) => setTimeout(r, 2000));
  const state = await emulator.save_state();
  fs.writeFileSync(path.join(dir, "state.bin"), new Uint8Array(state));
  execFileSync("zstd", ["-19", "-f", "-q", "--rm", path.join(dir, "state.bin")]);
  console.log(`saved state.bin.zst (${(fs.statSync(path.join(dir, "state.bin.zst")).size / 1048576).toFixed(1)} MB)`);
  console.log("--- player terminal so far ---\n" + JSON.stringify(term.slice(-300)));
  emulator.destroy();
  process.exit(0);
}

setTimeout(() => { console.log("timed out\n" + term.slice(-2000) + "\nAGENT:" + JSON.stringify(agent)); process.exit(1); }, 180000);
