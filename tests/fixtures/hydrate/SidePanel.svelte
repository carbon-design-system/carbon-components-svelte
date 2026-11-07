<script>
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import SidePanel from "carbon-components-svelte/SidePanel/SidePanel.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
</script>

<Header platformName="Cloud" />
<SidePanel
  open
  resizable
  currentStep={1}
  labelText="Production"
  titleText="Edit deployment"
  subtitleText="Changes apply on the next deploy."
  {...$$restProps}
>
  <TextInput labelText="Region" />
  <svelte:fragment slot="actions">
    <Button kind="secondary">Cancel</Button>
    <Button>Save</Button>
  </svelte:fragment>
</SidePanel>
