<script lang="ts">
  import {
    Button,
    ExpandableTile,
    ImageCompare,
    LanguagePicker,
    OverflowMenu,
    OverflowMenuItem,
    ShellBanner,
    Tearsheet,
  } from "carbon-components-svelte";
</script>

<div data-testid="tile" style="width: 14rem; padding: 1rem;">
  <ExpandableTile>
    <div slot="above">Storage</div>
    <div slot="below">2.4 TB of 5 TB used across 12 buckets.</div>
  </ExpandableTile>
</div>

<div
  data-testid="menu"
  style="position: relative; height: 10rem; padding: 1rem;"
>
  <OverflowMenu open iconDescription="More">
    <OverflowMenuItem text="Edit" />
    <OverflowMenuItem text="Delete" />
  </OverflowMenu>
</div>

<Tearsheet open titleText="Create integration" size="narrow">
  <div data-testid="tearsheet-body" style="height: 120vh">
    A body taller than the window scrolls.
  </div>
  <svelte:fragment slot="actions">
    <Button kind="secondary">Cancel</Button>
    <Button>Next</Button>
  </svelte:fragment>
</Tearsheet>

<ShellBanner
  placement="above-header"
  title="Viewing as jane@acme.com."
  subtitle="This session is read only. Changes you make here are not saved to the production workspace until you exit impersonation and sign in again with your own account."
/>

<div data-testid="language" style="height: 20rem; padding: 1rem;">
  <LanguagePicker
    open
    labelText="Language"
    values={["ar", "en"]}
    portalMenu={false}
  />
</div>

<div data-testid="compare" style="width: 20rem; padding: 1rem;">
  <ImageCompare ratio="2x1" value={30}>
    <div
      slot="before"
      style="width: 100%; height: 100%; background: #e0e0e0;"
    ></div>
    <div
      slot="after"
      style="width: 100%; height: 100%; background: #a7f0ba;"
    ></div>
  </ImageCompare>
</div>
