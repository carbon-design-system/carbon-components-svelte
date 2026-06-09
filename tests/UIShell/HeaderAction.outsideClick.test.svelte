<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
  import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";

  export let preventCloseOnClickOutside = false;

  let isOpen = false;
</script>

<Header companyName="Test" platformName="Test">
  <HeaderUtilities>
    <HeaderAction
      bind:isOpen
      {preventCloseOnClickOutside}
      transition={false}
      iconDescription="Switcher"
    >
      <p data-testid="panel-content">Panel content</p>
    </HeaderAction>
  </HeaderUtilities>
</Header>
