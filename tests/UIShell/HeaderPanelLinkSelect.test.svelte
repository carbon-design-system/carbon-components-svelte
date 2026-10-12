<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
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
        <HeaderPanelLink href="#docs">Docs</HeaderPanelLink>
        <HeaderPanelLink>Switch theme</HeaderPanelLink>
        <HeaderPanelLink
          on:click={(e) => {
            e.preventDefault();
          }}
          >Stay open</HeaderPanelLink
        >
      </HeaderPanelLinks>
    </HeaderAction>
  </HeaderUtilities>
</Header>

<HeaderPanelLink>Outside any panel</HeaderPanelLink>
