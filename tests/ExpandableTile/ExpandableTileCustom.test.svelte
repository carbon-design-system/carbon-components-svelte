<script lang="ts">
  import { Button, ExpandableTile } from "carbon-components-svelte";

  export let buttonClicked = false;
  export let linkClicked = false;
</script>

<ExpandableTile tileExpandedLabel="View less" tileCollapsedLabel="View more">
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
    <br /><br />
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
