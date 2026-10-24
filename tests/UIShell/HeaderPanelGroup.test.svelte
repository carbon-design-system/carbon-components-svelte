<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
  import HeaderPanelGroup from "carbon-components-svelte/UIShell/HeaderPanelGroup.svelte";
  import HeaderPanelLink from "carbon-components-svelte/UIShell/HeaderPanelLink.svelte";
  import HeaderPanelLinks from "carbon-components-svelte/UIShell/HeaderPanelLinks.svelte";
  import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";

  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
</script>

<Header companyName="Test" platformName="Test">
  <HeaderUtilities>
    <HeaderAction
      transition={false}
      iconDescription="Switcher"
      on:close={onClose}
    >
      <HeaderPanelLinks>
        <HeaderPanelGroup label="Resources">
          <HeaderPanelLink href="#docs">Documentation</HeaderPanelLink>
          <HeaderPanelLink href="#status">Status page</HeaderPanelLink>
        </HeaderPanelGroup>
        <HeaderPanelGroup label="Community">
          <HeaderPanelLink href="#github">GitHub</HeaderPanelLink>
          <HeaderPanelLink>Discord</HeaderPanelLink>
        </HeaderPanelGroup>
        <HeaderPanelGroup>
          <svelte:fragment slot="label"><em>Custom</em> label</svelte:fragment>
          <HeaderPanelLink href="#slotted">Slotted</HeaderPanelLink>
        </HeaderPanelGroup>
        <HeaderPanelGroup>
          <HeaderPanelLink href="#plain">Unlabelled</HeaderPanelLink>
        </HeaderPanelGroup>
      </HeaderPanelLinks>
    </HeaderAction>
  </HeaderUtilities>
</Header>
