<script lang="ts">
  import { RadioTile, TileGroup } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<TileGroup>["selected"] = undefined;
  export let ariaDescribedBy: ComponentProps<RadioTile>["aria-describedby"] =
    undefined;
  export let ariaLabelledBy: ComponentProps<RadioTile>["aria-labelledby"] =
    undefined;
</script>

<TileGroup bind:selected>
  <RadioTile
    value="option1"
    aria-describedby={ariaDescribedBy}
    aria-labelledby={ariaLabelledBy}
  >
    Option 1
  </RadioTile>
</TileGroup>

{#if ariaDescribedBy}
  <div id={ariaDescribedBy}>Description for the radio tile</div>
{/if}

{#if ariaLabelledBy}
  <div id={ariaLabelledBy}>Label for the radio tile</div>
{/if}
