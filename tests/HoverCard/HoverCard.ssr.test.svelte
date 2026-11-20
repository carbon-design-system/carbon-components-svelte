<script lang="ts">
  import HoverCard from "carbon-components-svelte/HoverCard/HoverCard.svelte";

  export let open = false;
  export let load: (() => Promise<unknown>) | undefined = undefined;
</script>

<HoverCard id="hc" {open} {load}>
  <a slot="trigger" href="/octocat">@octocat</a>
  <p>Card body</p>
</HoverCard>
