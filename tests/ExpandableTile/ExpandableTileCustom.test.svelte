<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";
  import type { ComponentProps } from "svelte";

  export let buttonClicked = false;
  export let linkClicked = false;
  export let tabindex: ComponentProps<ExpandableTile>["tabindex"] = "0";
  export let onFocus: (e: FocusEvent) => void = () => {};
  export let onBlur: (e: FocusEvent) => void = () => {};
</script>

<ExpandableTile
  hasInteractiveContent
  {tabindex}
  tileExpandedLabel="View less"
  tileCollapsedLabel="View more"
  on:focus={onFocus}
  on:blur={onBlur}
>
  <div slot="above">
    <a
      href="/"
      data-testid="test-link"
      on:click|preventDefault|stopPropagation={() => {
        linkClicked = true;
      }}
    >
      Test link
    </a>
    <br><br>
    <Button
      data-testid="test-button"
      on:click={(e) => {
        e.stopPropagation();
        buttonClicked = true;
      }}
    >
      Test button
    </Button>
  </div>
  <div slot="below">Below the fold content here</div>
</ExpandableTile>
