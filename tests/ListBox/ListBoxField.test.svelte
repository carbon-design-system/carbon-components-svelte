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
  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseover: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseenter: ((event: MouseEvent) => void) | undefined =
    undefined;
  export let onmouseleave: ((event: MouseEvent) => void) | undefined =
    undefined;
  export let onkeydown: ((event: KeyboardEvent) => void) | undefined =
    undefined;
  export let onfocus: ((event: FocusEvent) => void) | undefined = undefined;
  export let onblur: ((event: FocusEvent) => void) | undefined = undefined;
</script>

<ListBoxField
  {disabled}
  {role}
  {tabindex}
  {translateWithId}
  {id}
  bind:ref
  on:click={onclick}
  on:mouseover={onmouseover}
  on:mouseenter={onmouseenter}
  on:mouseleave={onmouseleave}
  on:keydown={onkeydown}
  on:focus={onfocus}
  on:blur={onblur}
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
</ListBoxField>
