<script lang="ts">
  import { joinTagSet } from "carbon-components-svelte/TagSet/join-tag-set.js";

  export let label = "Probe";

  let node: HTMLButtonElement;
  const { navigation, overflow, tabindex } = joinTagSet(() => ({
    node,
    label,
    size: "default",
    disabled: false,
    filter: false,
  }));
</script>

<button
  bind:this={node}
  type="button"
  data-navigation={$navigation}
  data-overflow={$overflow}
  tabindex={$tabindex}
>
  {label}
</button>
