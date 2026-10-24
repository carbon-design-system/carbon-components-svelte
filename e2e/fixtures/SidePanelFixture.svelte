<script>
  import { Button, SidePanel, TextInput } from "carbon-components-svelte";

  let open = true;
  let width = undefined;
</script>

<p>Deployments</p>
<span data-testid="width">{width ?? ""}</span>
<SidePanel
  bind:open
  bind:width
  resizable
  includeOverlay
  currentStep={1}
  labelText="Production"
  title="Edit deployment"
  subtitle="Changes apply on the next deploy."
>
  <TextInput labelText="Region" />
  <svelte:fragment slot="actions">
    <Button kind="secondary">Cancel</Button>
    <Button>Save</Button>
  </svelte:fragment>
</SidePanel>
