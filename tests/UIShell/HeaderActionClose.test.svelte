<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
  import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";
  import Help from "carbon-icons-svelte/lib/Help.svelte";

  export let preventCloseOnClickOutside = false;
  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
  export let customCloseIcon = false;
  export let onOpen: (e: CustomEvent<{ trigger: string }>) => void = () => {};

  $: closeIconProps = customCloseIcon ? { closeIcon: Help } : {};
</script>

<button type="button" data-testid="outside">Outside</button>
<Header companyName="Test" platformName="Test">
  <HeaderUtilities>
    <HeaderAction
      {preventCloseOnClickOutside}
      transition={false}
      iconDescription="Switcher"
      {...closeIconProps}
      on:open={onOpen}
      on:close={onClose}
    >
      <p data-testid="panel-content">Panel content</p>
    </HeaderAction>
  </HeaderUtilities>
</Header>
