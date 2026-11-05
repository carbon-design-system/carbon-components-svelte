<script lang="ts">
  import type { ComponentProps } from "svelte";
  import HoverCard from "../../src/HoverCard/HoverCard.svelte";

  export let open = false;
  export let transition: ComponentProps<HoverCard>["transition"] = undefined;
  export let onOutroEnd: () => void = () => {};
</script>

<HoverCard id="hc" bind:open {transition} on:outroend={onOutroEnd}>
  <a slot="trigger" href="/octocat">@octocat</a>
  <p data-testid="body">Body</p>
</HoverCard>
