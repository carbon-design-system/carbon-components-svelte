<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import Layer from "carbon-components-svelte/Layer/Layer.svelte";
  import Portal from "carbon-components-svelte/Portal/Portal.svelte";
  import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";
  import ThemeZone from "carbon-components-svelte/ThemeZone/ThemeZone.svelte";

  export let theme: CarbonTheme = "g100";
  export let innerTheme: CarbonTheme = "white";
  export let tag: keyof HTMLElementTagNameMap = "div";
</script>

<Portal data-testid="portal-outside">Outside</Portal>

<Layer>
  <Layer data-testid="page-layer">
    <ThemeZone
      {theme}
      {tag}
      class="custom"
      data-testid="zone"
      aria-label="Sidebar"
    >
      <Layer data-testid="zone-layer" />
      <Portal data-testid="portal-zone" class="custom-portal">In zone</Portal>
      <Dropdown
        open
        portalMenu
        labelText="Region"
        selectedId="0"
        items={[
          { id: "0", text: "us-east-1" },
          { id: "1", text: "eu-west-1" },
        ]}
      />
      <ThemeZone theme={innerTheme} data-testid="inner-zone">
        <Portal data-testid="portal-inner">In inner zone</Portal>
      </ThemeZone>
    </ThemeZone>
  </Layer>
</Layer>
