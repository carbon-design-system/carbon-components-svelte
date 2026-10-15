<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import SwitchPanel from "carbon-components-svelte/ContentSwitcher/SwitchPanel.svelte";
  import Add from "carbon-components-svelte/icons/Add.svelte";

  /** Which component gets the rest props. */
  export let under: "switcher" | "switch" | "panel" = "switcher";
  export let iconOnly = false;
</script>

<ContentSwitcher {...under === "switcher" ? $$restProps : {}}>
  <Switch
    text="One"
    icon={iconOnly ? Add : undefined}
    {...under === "switch" ? $$restProps : {}}
  />
  <Switch text="Two" icon={iconOnly ? Add : undefined} />
  <svelte:fragment slot="content">
    <SwitchPanel {...under === "panel" ? $$restProps : {}}>One</SwitchPanel>
    <SwitchPanel>Two</SwitchPanel>
  </svelte:fragment>
</ContentSwitcher>
