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
</script>

<ListBoxField
  {disabled}
  {role}
  {tabindex}
  {translateWithId}
  {id}
  bind:ref
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:focus
  on:blur
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
</ListBoxField>
