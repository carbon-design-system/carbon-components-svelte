<script lang="ts">
  import { AILabel, Button, SidePanel } from "carbon-components-svelte";
  import ChevronLeft from "carbon-components-svelte/icons/ChevronLeft.svelte";
  import ChevronRight from "carbon-components-svelte/icons/ChevronRight.svelte";

  const params = new URLSearchParams(location.search);
  // A large panel with footer buttons has 40px header buttons.
  const large = params.has("large");
  let open = true;
</script>

<p>Deployments</p>
{#if large}
  <SidePanel
    bind:open
    size="lg"
    currentStep={1}
    labelText="Production"
    titleText="Edit the deployment settings for the payments reconciliation worker"
  >
    <svelte:fragment slot="headerActions" let:buttonSize>
      <Button
        kind="ghost"
        size={buttonSize}
        icon={ChevronLeft}
        iconDescription="Previous deployment"
      />
      <Button
        kind="ghost"
        size={buttonSize}
        icon={ChevronRight}
        iconDescription="Next deployment"
      />
    </svelte:fragment>
    <p>Body</p>
    <svelte:fragment slot="actions">
      <Button kind="secondary">Cancel</Button>
      <Button>Save</Button>
    </svelte:fragment>
  </SidePanel>
{:else}
  <SidePanel
    bind:open
    labelText="Production"
    titleText="Edit the deployment settings for the payments reconciliation worker"
    subtitleText="Changes apply on the next deploy."
  >
    <svelte:fragment slot="headerActions" let:buttonSize>
      <Button
        kind="ghost"
        size={buttonSize}
        icon={ChevronLeft}
        iconDescription="Previous deployment"
      />
      <Button
        kind="ghost"
        size={buttonSize}
        icon={ChevronRight}
        iconDescription="Next deployment"
      />
    </svelte:fragment>
    <AILabel slot="decorator" />
    <p>Body</p>
  </SidePanel>
{/if}
