<svelte:options accessors />

<script lang="ts">
  import FormGroup from "carbon-components-svelte/FormGroup/FormGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let noMargin: ComponentProps<FormGroup>["noMargin"] = false;
  export let invalid: ComponentProps<FormGroup>["invalid"] = false;
  export let disabled: ComponentProps<FormGroup>["disabled"] = false;
  export let message: ComponentProps<FormGroup>["message"] = false;
  export let messageText: ComponentProps<FormGroup>["messageText"] = "";
  export let legendText: ComponentProps<FormGroup>["legendText"] = "";
  export let legendId: ComponentProps<FormGroup>["legendId"] = "";
  export let slotContent = "";
  export let withNativeInput = false;
  export let onClick: ((event: Event) => void) | undefined = undefined;
  export let onMouseover: ((event: Event) => void) | undefined = undefined;
  export let onMouseenter: ((event: Event) => void) | undefined = undefined;
  export let onMouseleave: ((event: Event) => void) | undefined = undefined;
</script>

<FormGroup
  {noMargin}
  {invalid}
  {disabled}
  {message}
  {messageText}
  {legendText}
  {legendId}
  on:click={(event) => onClick?.(event)}
  on:mouseover={(event) => onMouseover?.(event)}
  on:mouseenter={(event) => onMouseenter?.(event)}
  on:mouseleave={(event) => onMouseleave?.(event)}
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
  {#if withNativeInput}
    <input type="text" aria-label="Nested input" />
  {/if}
  <slot />
</FormGroup>
