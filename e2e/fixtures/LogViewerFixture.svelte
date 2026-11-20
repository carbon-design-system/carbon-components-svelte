<script lang="ts">
  import { LogViewer } from "carbon-components-svelte";

  const params = new URLSearchParams(location.search);
  const count = Number(params.get("lines") ?? 400);
  const longLines = params.has("long");
  const ESC = "\u001b";

  function makeLine(index: number): string {
    const time = `2026-10-27T09:${String(Math.floor(index / 60) % 60).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}.${String((index * 7) % 1000).padStart(3, "0")}Z`;
    if (index % 50 === 7) {
      return `${time} ERROR ${ESC}[31mconnection refused${ESC}[0m to db-${index} https://status.example.com/incidents/${index}`;
    }
    if (index % 25 === 3) {
      return `${time} WARN slow request ${index} took ${index % 900}ms`;
    }
    if (index % 10 === 0) {
      return `${time} INFO ${ESC}[1;32mOK${ESC}[0m ${ESC}[38;5;208mstep ${index}${ESC}[0m ${ESC}[38;2;120;200;255mrgb${ESC}[0m`;
    }
    if (index % 11 === 1) {
      return `${time} DEBUG cache lookup key=session:${index}`;
    }
    return `${time} INFO request ${index} completed`;
  }

  const lines = Array.from({ length: count }, (_, index) => makeLine(index));
  if (longLines) lines.push(`${"x".repeat(20000)} END`);

  let viewer: LogViewer | undefined;
  let follow = true;
  let wrap = params.has("wrap");

  Object.defineProperty(window, "logViewer", {
    configurable: true,
    get: () => viewer,
  });
  Object.defineProperty(window, "makeLogLine", {
    configurable: true,
    value: makeLine,
  });
</script>

<div data-testid="host" style="width: 960px; padding: 1rem">
  <LogViewer
    bind:this={viewer}
    bind:follow
    bind:wrap
    {lines}
    maxLines={Number(params.get("max") ?? 10000)}
    height={params.get("height") ?? "24rem"}
    labelText="Build output"
    timestamps={params.has("time")}
    announce={(params.get("announce") as "off" | "summary" | "lines") ??
      "summary"}
    hideToolbar={params.has("notoolbar")}
    data-testid="viewer"
  />
  <p data-testid="follow">{follow}</p>
</div>
