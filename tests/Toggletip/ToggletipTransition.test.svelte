<script lang="ts">
  import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let portalTooltip: boolean | undefined = false;
  export let transition: ComponentProps<Toggletip>["transition"] = undefined;
  export let onOutroEnd: () => void = () => {};
  export let onIntroEnd: () => void = () => {};
</script>

<Toggletip
  bind:open
  {portalTooltip}
  {transition}
  id="tip"
  on:introend={onIntroEnd}
  on:outroend={onOutroEnd}
>
  <p data-testid="content">Content</p>
</Toggletip>
