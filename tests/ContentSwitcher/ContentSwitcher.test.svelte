<svelte:options accessors />

<script lang="ts">
  import { ContentSwitcher, Switch } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let customClass = "";
  export let switchId: ComponentProps<Switch>["id"] = undefined;
  export let switchRef: ComponentProps<Switch>["ref"] = null;
</script>

<ContentSwitcher
  class={customClass}
  on:change={(e) => {
    console.log("change", e.detail);
  }}
  on:click={() => {
    console.log("click");
  }}
  on:mouseover={() => {
    console.log("mouseover");
  }}
  on:mouseenter={() => {
    console.log("mouseenter");
  }}
  on:mouseleave={() => {
    console.log("mouseleave");
  }}
>
  <Switch text="Option 1" />
  <Switch text="Option 2" id={switchId} bind:ref={switchRef} />
  <Switch text="Option 3" />
</ContentSwitcher>
