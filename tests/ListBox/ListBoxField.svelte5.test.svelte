<svelte:options accessors />

<script lang="ts">
  import { ListBoxField } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let disabled: ComponentProps<ListBoxField>["disabled"] = false;
  export let role: ComponentProps<ListBoxField>["role"] = "combobox";
  export let tabindex: ComponentProps<ListBoxField>["tabindex"] = "-1";
  export let translateWithId: ComponentProps<ListBoxField>["translateWithId"] =
    undefined;
  export let id: ComponentProps<ListBoxField>["id"] = undefined;
  export let ref: ComponentProps<ListBoxField>["ref"] = null;
  export let slotContent = "";
  export let onclick: ((e: MouseEvent) => void) | undefined = undefined;
  export let onmouseover: ((e: MouseEvent) => void) | undefined = undefined;
  export let onmouseenter: ((e: MouseEvent) => void) | undefined = undefined;
  export let onmouseleave: ((e: MouseEvent) => void) | undefined = undefined;
  export let onkeydown: ((e: KeyboardEvent) => void) | undefined = undefined;
  export let onfocus: ((e: FocusEvent) => void) | undefined = undefined;
  export let onblur: ((e: FocusEvent) => void) | undefined = undefined;
</script>

<ListBoxField
  {disabled}
  {role}
  {tabindex}
  {translateWithId}
  {id}
  bind:ref
  {onclick}
  {onmouseover}
  {onmouseenter}
  {onmouseleave}
  {onkeydown}
  {onfocus}
  {onblur}
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
</ListBoxField>
