// The Linux machine: v86 restored from the snapshot made by image/save-state.mjs.
// serial0 is the player's terminal; serial1 talks to /usr/local/bin/game-agent, which runs bash scripts as root.
import { V86 } from "v86";
import wasmUrl from "v86/build/v86.wasm?url";

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

const toBase64 = (s: string) => btoa(String.fromCharCode(...enc.encode(s)));
const fromBase64 = (s: string) => dec.decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));

/** Single-quote a string for bash. */
export const q = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

export class Machine {
  private emu: V86;
  private agentBuf = "";
  private waiting = new Map<string, (r: RunResult) => void>();
  private nextId = 0;
  private queue: Promise<unknown>;
  private promptWaiters: (() => void)[] = [];
  private tail = "";
  readonly started: Promise<void>;

  constructor(
    onTerminalOutput: (bytes: Uint8Array) => void,
    onDownload?: (e: { file: string; loaded: number; total: number; failed?: boolean }) => void,
  ) {
    this.emu = new V86({
      wasm_path: wasmUrl,
      bios: { url: "v86/seabios.bin" },
      vga_bios: { url: "v86/vgabios.bin" },
      memory_size: 128 * 1024 * 1024,
      vga_memory_size: 2 * 1024 * 1024,
      uart1: true,
      autostart: true,
      disable_keyboard: true,
      disable_mouse: true,
      filesystem: { baseurl: "v86/rootfs/", basefs: "v86/fs.json" },
      initial_state: { url: "v86/state.bin.zst" },
    });

    this.emu.add_listener("download-progress", (e) =>
      onDownload?.({ file: e.file_name, loaded: e.loaded, total: e.lengthComputable ? e.total : 0 }),
    );
    this.emu.add_listener("download-error", (e) => onDownload?.({ file: e.file_name, loaded: 0, total: 0, failed: true }));

    // Bytes arrive one at a time; hand them to the terminal once per frame.
    let pending: number[] = [];
    this.emu.add_listener("serial0-output-byte", (b: number) => {
      if (pending.length === 0) {
        requestAnimationFrame(() => {
          onTerminalOutput(Uint8Array.from(pending));
          pending = [];
        });
      }
      pending.push(b);
      // Readline turns bracketed paste on each time it shows a prompt, so this marks "the shell is listening".
      this.tail = (this.tail + String.fromCharCode(b)).slice(-8);
      if (this.tail.endsWith("\x1b[?2004h")) this.promptWaiters.splice(0).forEach((f) => f());
    });

    this.emu.add_listener("serial1-output-byte", (b: number) => {
      if (b !== 10) {
        this.agentBuf += String.fromCharCode(b);
        return;
      }
      const line = this.agentBuf;
      this.agentBuf = "";
      const m = line.match(/\x1e(\d+) (\d+) (\S*) (\S*)$/);
      if (!m) return;
      this.waiting.get(m[1])?.({ code: Number(m[2]), stdout: fromBase64(m[3]), stderr: fromBase64(m[4]) });
      this.waiting.delete(m[1]);
    });

    this.started = new Promise((resolve) => this.emu.add_listener("emulator-started", () => resolve()));
    // Bytes sent before this are lost, and the lost request would hold up every one behind it.
    this.queue = this.started;
  }

  /** Resolves the next time the player's shell shows a prompt. */
  nextPrompt(): Promise<void> {
    return new Promise((resolve) => this.promptWaiters.push(resolve));
  }

  /** Type into the player's terminal. */
  type(data: string) {
    this.emu.serial_send_bytes(0, enc.encode(data));
  }

  /** Run a bash script as root through the agent. Requests are queued; the agent handles one at a time. */
  run(script: string): Promise<RunResult> {
    const result = this.queue.then(
      () =>
        new Promise<RunResult>((resolve) => {
          const id = String(this.nextId++);
          this.waiting.set(id, resolve);
          this.emu.serial_send_bytes(1, enc.encode(`${id} ${toBase64(script)}\n`));
        }),
    );
    this.queue = result.catch(() => {});
    return result;
  }
}
