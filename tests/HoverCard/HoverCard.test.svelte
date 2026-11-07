<script lang="ts">
  import type { ComponentProps } from "svelte";
  import HoverCard from "../../src/HoverCard/HoverCard.svelte";

  export let open: ComponentProps<HoverCard>["open"] = false;
  export let openDelay: ComponentProps<HoverCard>["openDelay"] = 500;
  export let closeDelay: ComponentProps<HoverCard>["closeDelay"] = 300;
  export let disabled: ComponentProps<HoverCard>["disabled"] = false;
  export let portalCard: ComponentProps<HoverCard>["portalCard"] = false;
  export let load: ComponentProps<HoverCard>["load"] = undefined;
  export let cacheKey: ComponentProps<HoverCard>["cacheKey"] = undefined;
  export let label: string | undefined = undefined;
  export let onOpen: () => void = () => {};
  export let onClose: () => void = () => {};
</script>

<HoverCard
  id="hc"
  bind:open
  {openDelay}
  {closeDelay}
  {disabled}
  {portalCard}
  {load}
  {cacheKey}
  aria-label={label}
  on:open={onOpen}
  on:close={onClose}
  let:data
>
  <a slot="trigger" href="/octocat">@octocat</a>
  <p data-testid="body">{data ? data.name : "Static"}</p>
  <button type="button" data-testid="first">First</button>
  <button type="button" data-testid="last">Last</button>
</HoverCard>
<a href="/after" data-testid="after">After</a>
