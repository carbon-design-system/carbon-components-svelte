<svelte:options accessors />

<script lang="ts">
  import Heading from "carbon-components-svelte/Heading/Heading.svelte";
  import Layer from "carbon-components-svelte/Layer/Layer.svelte";
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import SidePanel from "carbon-components-svelte/SidePanel/SidePanel.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<SidePanel>;

  export let open = false;
  export let title: Props["title"] = "Edit deployment";
  export let subtitle: Props["subtitle"] = undefined;
  export let labelText: Props["labelText"] = undefined;
  export let placement: Props["placement"] = "end";
  export let size: Props["size"] = "md";
  export let slideIn = false;
  export let includeOverlay = false;
  export let preventCloseOnClickOutside: boolean | undefined = undefined;
  export let currentStep = 0;
  export let resizable = false;
  export let width: number | undefined = undefined;
  export let selectorPrimaryFocus: Props["selectorPrimaryFocus"] = undefined;
  export let field = false;
  export let dir: "ltr" | "rtl" = "ltr";
  export let onClose: ((trigger: string) => boolean | undefined) | undefined =
    undefined;
  export let onBack: (() => void) | undefined = undefined;
  export let onResize: ((width: number | undefined) => void) | undefined =
    undefined;
</script>

<LayoutDirection {dir}>
  <button type="button" on:click={() => (open = true)}>Open panel</button>
  <div data-testid="page">Page</div>
  <span data-testid="width">{width ?? ""}</span>
  <SidePanel
    bind:open
    bind:width
    {title}
    {subtitle}
    {labelText}
    {placement}
    {size}
    {slideIn}
    {includeOverlay}
    {preventCloseOnClickOutside}
    {currentStep}
    {resizable}
    {selectorPrimaryFocus}
    selectorPageContent="[data-testid=page]"
    on:close={(event) => {
      if (onClose?.(event.detail.trigger) === false) event.preventDefault();
    }}
    on:back={() => onBack?.()}
    on:resize={(event) => onResize?.(event.detail.width)}
  >
    {#if field}
      <TextInput labelText="Region" />
    {/if}
    <Heading>Instances</Heading>
    <Layer><span data-testid="nested-layer">Nested</span></Layer>
  </SidePanel>
</LayoutDirection>
