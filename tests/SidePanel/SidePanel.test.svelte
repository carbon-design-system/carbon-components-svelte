<svelte:options accessors />

<script lang="ts">
  import SidePanel from "carbon-components-svelte/SidePanel/SidePanel.svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let title: ComponentProps<SidePanel>["title"] = "Panel title";
  export let subtitle: ComponentProps<SidePanel>["subtitle"] = undefined;
  export let labelText: ComponentProps<SidePanel>["labelText"] = undefined;
  export let placement: ComponentProps<SidePanel>["placement"] = undefined;
  export let size: ComponentProps<SidePanel>["size"] = undefined;
  export let slideIn = false;
  export let selectorPageContent: ComponentProps<SidePanel>["selectorPageContent"] =
    undefined;
  export let includeOverlay = false;
  export let preventCloseOnClickOutside = false;
  export let hideCloseButton = false;
  export let resizable = false;
  export let currentStep = 0;
  export let condensedActions = false;
  export let transition: ComponentProps<SidePanel>["transition"] = undefined;
  export let ref: ComponentProps<SidePanel>["ref"] = null;
</script>

<button type="button">Launcher</button>

<SidePanel
  bind:open
  bind:ref
  {title}
  {subtitle}
  {labelText}
  {placement}
  {size}
  {slideIn}
  {selectorPageContent}
  {includeOverlay}
  {preventCloseOnClickOutside}
  {hideCloseButton}
  {resizable}
  {currentStep}
  {condensedActions}
  {transition}
  data-testid="side-panel"
  on:close={(event) => console.log("close", event.detail.trigger)}
  on:back={() => console.log("back")}
>
  Body content
  <svelte:fragment slot="decorator">
    <span data-testid="decorator">Decorator</span>
  </svelte:fragment>
</SidePanel>
