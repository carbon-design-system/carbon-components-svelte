<svelte:options accessors />

<script lang="ts">
  import WebTerminal from "carbon-components-svelte/WebTerminal/WebTerminal.svelte";
  import type { ComponentProps } from "svelte";

  export let execute: ComponentProps<WebTerminal>["execute"] = undefined;
  export let complete: ComponentProps<WebTerminal>["complete"] = undefined;
  export let history: string[] = [];
  export let value = "";
  export let follow = true;
  export let running = false;
  export let maximized = false;
  export let maximizable = false;
  export let theme: ComponentProps<WebTerminal>["theme"] = "g100";
  export let maxLines = 100000;
  export let announceLines = 5;

  export let term: WebTerminal | undefined = undefined;
  let events: string[] = [];
</script>

<WebTerminal
  bind:this={term}
  bind:history
  bind:value
  bind:follow
  bind:running
  bind:maximized
  {execute}
  {complete}
  {theme}
  {maxLines}
  {maximizable}
  {announceLines}
  prompt="$"
  labelText="Shell output"
  title="Shell"
  on:command={(e) => (events = [...events, `command:${e.detail.command}`])}
  on:finish={(e) =>
    (events = [...events, `finish:${e.detail.status}:${e.detail.lines}`])}
  on:cancel={(e) => (events = [...events, `cancel:${e.detail.command}`])}
  on:clear={() => (events = [...events, "clear"])}
  data-testid="terminal"
/>
<p data-testid="events">{events.join(" ")}</p>
<p data-testid="running">{running}</p>
<p data-testid="history">{JSON.stringify(history)}</p>
<p data-testid="maximized">{maximized}</p>
