<svelte:options accessors />

<script lang="ts">
  import ChatButton from "carbon-components-svelte/Chat/ChatButton.svelte";
  import type { ComponentProps } from "svelte";

  export let buttonProps: ComponentProps<ChatButton> = {};
  export let label = "Ask AI";
  export let onClick = (_event: MouseEvent) => {};
  export let onMouseDown = () => {};
  export let onFocus = () => {};
  export let onBlur = () => {};
  export let onMouseOver = () => {};
  export let onMouseEnter = () => {};
  export let onMouseLeave = () => {};
  export let ref: null | HTMLAnchorElement | HTMLButtonElement = null;
</script>

<ChatButton
  bind:ref
  {...buttonProps}
  on:click={onClick}
  on:mousedown={onMouseDown}
  on:focus={onFocus}
  on:blur={onBlur}
  on:mouseover={onMouseOver}
  on:mouseenter={onMouseEnter}
  on:mouseleave={onMouseLeave}
>
  {label}
</ChatButton>
