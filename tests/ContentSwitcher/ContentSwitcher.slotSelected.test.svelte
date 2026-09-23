<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";

  export let selectedIndex = 0;
</script>

<ContentSwitcher bind:selectedIndex>
  <Switch text="One" let:selected>
    <span data-testid="slot-one">{selected ? "on" : "off"}</span>
  </Switch>
  <Switch text="Two" let:selected>
    <span data-testid="slot-two">{selected ? "on" : "off"}</span>
  </Switch>
</ContentSwitcher>

<ContentSwitcher>
  <Switch icon={Dashboard} text="Icon one" let:selected>
    <span data-testid="icon-slot-one">{selected ? "on" : "off"}</span>
  </Switch>
  <Switch icon={Dashboard} text="Icon two" let:selected>
    <span data-testid="icon-slot-two">{selected ? "on" : "off"}</span>
  </Switch>
</ContentSwitcher>
