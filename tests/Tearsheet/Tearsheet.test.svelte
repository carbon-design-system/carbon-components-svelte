<svelte:options accessors />

<script lang="ts">
  import Heading from "carbon-components-svelte/Heading/Heading.svelte";
  import Section from "carbon-components-svelte/Heading/Section.svelte";
  import Layer from "carbon-components-svelte/Layer/Layer.svelte";
  import Tearsheet from "carbon-components-svelte/Tearsheet/Tearsheet.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<Tearsheet>;

  export let open = false;
  export let size: Props["size"] = "wide";
  export let titleText: Props["titleText"] = "Create integration";
  export let labelText: Props["labelText"] = undefined;
  export let descriptionText: Props["descriptionText"] = undefined;
  export let hideCloseButton: Props["hideCloseButton"] = undefined;
  export let preventCloseOnClickOutside: boolean | undefined = undefined;
  export let selectorPrimaryFocus: Props["selectorPrimaryFocus"] = undefined;
  export let field = false;
  export let section = false;
  export let onClose: ((trigger: string) => boolean | undefined) | undefined =
    undefined;
</script>

<button type="button" on:click={() => (open = true)}>Open tearsheet</button>
<Section level={section ? 3 : 1} tag="div">
  <Tearsheet
    bind:open
    {size}
    {titleText}
    {labelText}
    {descriptionText}
    {hideCloseButton}
    {preventCloseOnClickOutside}
    {selectorPrimaryFocus}
    on:close={(event) => {
      if (onClose?.(event.detail.trigger) === false) event.preventDefault();
    }}
  >
    {#if field}
      <TextInput labelText="Region" />
    {/if}
    <Heading>Mappings</Heading>
    <Layer><span data-testid="nested-layer">Nested</span></Layer>
  </Tearsheet>
</Section>
