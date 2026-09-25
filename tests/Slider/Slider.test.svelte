<script lang="ts">
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";
  import type { ComponentProps } from "svelte";

  export let value = 0;

  export let disabled = false;
  export let readonly = false;
  export let invalid = false;
  export let warn = false;
  export let required = false;
  export let minLabel = "";
  export let maxLabel = "";
  export let formatValue: ((value: number) => string) | undefined = undefined;
  export let hideTextInput = false;
  export let fullWidth = false;
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let marks:
    | boolean
    | ReadonlyArray<{ value: number; label?: string }>
    | undefined = false;
  export let light = false;
  export let hideLabel = false;
  export let labelText = "Test Slider";
  export let name = "";
  export let inputType = "number";
  export let customClass = "";
  export let useSlot = false;
  export let invalidText = "";
  export let warnText = "";
  export let helperText = "";
  export let id: ComponentProps<Slider>["id"] = undefined;
  export let readonlyText: ComponentProps<Slider>["readonlyText"] = undefined;
  export let ariaLabel: ComponentProps<Slider>["aria-label"] = undefined;
  export let selectTextOnFocus = false;
  export let onfocus: ((event: FocusEvent) => void) | undefined = undefined;
  export let onblur: ((event: FocusEvent) => void) | undefined = undefined;
</script>

{#if useSlot}
  <Slider
    aria-label={ariaLabel}
    bind:value
    {id}
    {min}
    {max}
    {step}
    {marks}
    {disabled}
    {readonly}
    {readonlyText}
    {invalid}
    {invalidText}
    {warn}
    {warnText}
    {helperText}
    {required}
    {minLabel}
    {maxLabel}
    {formatValue}
    {hideTextInput}
    {fullWidth}
    {light}
    {hideLabel}
    {name}
    {inputType}
    class={customClass}
    on:change={(e) => {
      console.log("change", e.detail);
    }}
    on:input={(e) => {
      console.log("input", e.detail);
    }}
  >
    <span slot="labelChildren">Slot Label</span>
  </Slider>
{:else}
  <Slider
    aria-label={ariaLabel}
    bind:value
    {labelText}
    {id}
    {min}
    {max}
    {step}
    {marks}
    {disabled}
    {readonly}
    {readonlyText}
    {invalid}
    {invalidText}
    {warn}
    {warnText}
    {helperText}
    {required}
    {minLabel}
    {maxLabel}
    {formatValue}
    {hideTextInput}
    {fullWidth}
    {light}
    {hideLabel}
    {name}
    {inputType}
    {selectTextOnFocus}
    class={customClass}
    on:change={(e) => {
      console.log("change", e.detail);
    }}
    on:input={(e) => {
      console.log("input", e.detail);
    }}
    on:focus={(e) => onfocus?.(e)}
    on:blur={(e) => onblur?.(e)}
  />
{/if}
