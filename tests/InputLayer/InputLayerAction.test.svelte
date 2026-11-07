<script lang="ts">
  import { inputLayer } from "carbon-components-svelte/utils/input-layer.js";

  export let value = "is:open";
  export let position: "behind" | "above" = "behind";

  const segments = (text: string) =>
    text
      .split(/(\S+:\S*)/)
      .filter(Boolean)
      .map((run) =>
        run.includes(":") ? { text: run, className: "q" } : { text: run },
      );
</script>

<div style="position: relative">
  <input
    data-testid="field"
    class="bx--text-input"
    bind:value
    use:inputLayer={{ segments, position, value }}
  />
</div>
