<script lang="ts">
  import {
    Header,
    HeaderAction,
    HeaderUtilities,
  } from "carbon-components-svelte";

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
