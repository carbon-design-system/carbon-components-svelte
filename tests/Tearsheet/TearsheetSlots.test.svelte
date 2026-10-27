<svelte:options accessors />

<script lang="ts">
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Tearsheet from "carbon-components-svelte/Tearsheet/Tearsheet.svelte";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<Tearsheet>;

  export let open = true;
  export let size: Props["size"] = "wide";
  export let preventCloseOnClickOutside: boolean | undefined = undefined;
  export let hideCloseButton: Props["hideCloseButton"] = undefined;
  export let influencerPosition: Props["influencerPosition"] = "start";
  export let influencerWidth: Props["influencerWidth"] = "narrow";
</script>

<Tearsheet
  bind:open
  {size}
  {preventCloseOnClickOutside}
  {hideCloseButton}
  {influencerPosition}
  {influencerWidth}
  title="Create integration"
  label="Step 2 of 4"
  description="Connect a data source."
>
  Body
  <nav slot="influencer">Steps</nav>
  <Button slot="headerActions" kind="ghost" size="small">Preview</Button>
  <AILabel slot="decorator" />
  <svelte:fragment slot="actions">
    <Button kind="secondary">Cancel</Button>
    <Button>Next</Button>
  </svelte:fragment>
</Tearsheet>
