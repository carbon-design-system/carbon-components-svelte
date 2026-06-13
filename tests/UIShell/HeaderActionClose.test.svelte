<script lang="ts">
  import Header from "../../src/UIShell/Header.svelte";
  import HeaderAction from "../../src/UIShell/HeaderAction.svelte";
  import HeaderUtilities from "../../src/UIShell/HeaderUtilities.svelte";

  export let preventCloseOnClickOutside = false;
  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
  export let onOpen: (e: CustomEvent<{ trigger: string }>) => void = () => {};
</script>

<button type="button" data-testid="outside">Outside</button>
<Header companyName="Test" platformName="Test">
  <HeaderUtilities>
    <HeaderAction
      {preventCloseOnClickOutside}
      transition={false}
      iconDescription="Switcher"
      on:open={onOpen}
      on:close={onClose}
    >
      <p data-testid="panel-content">Panel content</p>
    </HeaderAction>
  </HeaderUtilities>
</Header>
