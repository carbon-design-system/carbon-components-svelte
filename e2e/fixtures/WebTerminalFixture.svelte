<script lang="ts">
  import { WebTerminal } from "carbon-components-svelte";

  const params = new URLSearchParams(location.search);
  const ESC = "\u001b";
  const WHITESPACE = /\s+/;
  const SUM = /^(-?\d+(?:\.\d+)?)([-+*/])(-?\d+(?:\.\d+)?)$/;

  let term: WebTerminal | undefined;
  let follow = true;
  let maximized = false;
  let history: string[] = [];
  let finished = 0;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  function line(index: number): string {
    if (index % 50 === 7) {
      return `${ESC}[31merror${ESC}[0m connection refused to db-${index}`;
    }
    if (index % 10 === 0) {
      return `${ESC}[1;32mOK${ESC}[0m ${ESC}[38;5;208mstep ${index}${ESC}[0m ${ESC}[38;2;120;200;255mrgb${ESC}[0m`;
    }
    return `request ${index} completed in ${index % 900}ms`;
  }

  async function* stream(count: number, perTick: number, delay: number) {
    let n = 0;
    while (n < count) {
      let chunk = "";
      for (let i = 0; i < perTick && n < count; i++) chunk += `${line(n++)}\n`;
      yield chunk;
      await sleep(delay);
    }
  }

  async function* progress(signal: AbortSignal) {
    for (let i = 0; i <= 100; i += 5) {
      if (signal.aborted) return;
      yield `\r${ESC}[2Kdownloading [${"#".repeat(i / 5)}${".".repeat(20 - i / 5)}] ${i}%`;
      await sleep(20);
    }
    yield "\n";
  }

  function colors() {
    const names = [
      "black",
      "red",
      "green",
      "yellow",
      "blue",
      "magenta",
      "cyan",
      "white",
    ];
    const normal = names.map((n, i) => `${ESC}[3${i}m${n}${ESC}[0m`).join(" ");
    const bright = names.map((n, i) => `${ESC}[9${i}m${n}${ESC}[0m`).join(" ");
    const filled = names
      .map(
        (n, i) =>
          `${ESC}[4${i};${i === 0 || i === 7 ? 9 : 3}${i === 0 ? 7 : 0}m ${n} ${ESC}[0m`,
      )
      .join("");
    return [
      normal,
      bright,
      filled,
      `${ESC}[1mbold${ESC}[0m ${ESC}[2mdim${ESC}[0m ${ESC}[3mitalic${ESC}[0m ${ESC}[4munderline${ESC}[0m ${ESC}[9mstrike${ESC}[0m ${ESC}[7minverse${ESC}[0m`,
      `${ESC}[38;5;208m256-color orange${ESC}[0m ${ESC}[38;2;30;60;200mtruecolor navy${ESC}[0m ${ESC}[38;2;255;255;0mtruecolor yellow${ESC}[0m`,
      "",
    ].join("\n");
  }

  function adversarial() {
    return [
      `<img src=x onerror="window.__pwned = true"> <script>window.__pwned = true${"<"}/script>`,
      `${ESC}]8;;javascript:window.__pwned=true${ESC}\\hyperlink text${ESC}]8;;${ESC}\\`,
      `${ESC}[2J${ESC}[H${ESC}[10;10Hcursor movement is dropped${ESC}[?1049h`,
      `${ESC}]0;title${ESC}\\after a window title`,
      `‮right-to-left override is removed`,
      "",
    ].join("\n");
  }

  function execute(
    command: string,
    { signal }: { signal: AbortSignal },
  ): string | AsyncIterable<string> | Promise<never> | void {
    const [name, ...args] = command.trim().split(WHITESPACE);
    switch (name) {
      case "echo":
        return args.join(" ");
      case "calc": {
        const m = args.join("").match(SUM);
        if (!m) throw new Error("usage: calc 1+2");
        const [, a, op, b] = m;
        const x = Number(a);
        const y = Number(b);
        return String({ "+": x + y, "-": x - y, "*": x * y, "/": x / y }[op]);
      }
      case "logs":
        return stream(Number(args[0] ?? 100), Number(args[1] ?? 17), 16);
      case "progress":
        return progress(signal);
      case "colors":
        return colors();
      case "adversarial":
        return adversarial();
      case "flood": {
        const n = Number(args[0] ?? 1000);
        let text = "";
        for (let i = 0; i < n; i++) text += `${line(i)}\n`;
        return text;
      }
      case "hang":
        return new Promise(() => {});
      case "fail":
        throw new Error("exit status 1");
      case undefined:
      case "":
        return;
      default:
        throw new Error(`${name}: command not found`);
    }
  }

  const COMMANDS = [
    "echo",
    "calc",
    "logs",
    "progress",
    "colors",
    "adversarial",
    "flood",
    "hang",
    "fail",
  ];

  function complete(input: string, cursor: number) {
    const before = input.slice(0, cursor);
    if (before.includes(" ")) return [];
    return COMMANDS.filter((c) => c.startsWith(before));
  }

  Object.defineProperty(window, "terminal", {
    configurable: true,
    get: () => term,
  });
  Object.defineProperty(window, "pushLines", {
    configurable: true,
    value: (n: number, perFrame: number) =>
      new Promise<void>((resolve) => {
        let i = 0;
        const pump = () => {
          let chunk = "";
          for (let k = 0; k < perFrame && i < n; k++) chunk += `${line(i++)}\n`;
          term?.write(chunk);
          if (i < n) requestAnimationFrame(pump);
          else resolve();
        };
        requestAnimationFrame(pump);
      }),
  });

  const seed = Number(params.get("lines") ?? 0);
  if (seed > 0) {
    queueMicrotask(() => {
      let text = "";
      for (let i = 0; i < seed; i++) text += `${line(i)}\n`;
      term?.write(text);
    });
  }
</script>

<div data-testid="host" style="max-width: 960px; padding: 1rem">
  <WebTerminal
    bind:this={term}
    bind:follow
    bind:maximized
    bind:history
    {execute}
    {complete}
    theme={(params.get("theme") as
      "g100" | "white" | "g10" | "g90" | "system") ?? "g100"}
    wrap={params.has("wrap")}
    height={params.get("height") ?? "24rem"}
    maxLines={Number(params.get("max") ?? 100000)}
    maximizable
    on:finish={() => (finished += 1)}
    title="Cluster shell"
    labelText="Cluster shell output"
    data-testid="terminal"
  />
  <p data-testid="follow">{follow}</p>
  <p data-testid="finished">{finished}</p>
  <p data-testid="maximized">{maximized}</p>
</div>
