<script lang="ts">
  import { FormGroup } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let noMargin: ComponentProps<FormGroup>["noMargin"] = false;
  export let invalid: ComponentProps<FormGroup>["invalid"] = false;
  export let message: ComponentProps<FormGroup>["message"] = false;
  export let messageText: ComponentProps<FormGroup>["messageText"] = "";
  export let legendText: ComponentProps<FormGroup>["legendText"] = "";
  export let legendId: ComponentProps<FormGroup>["legendId"] = "";
  export let slotContent = "";
</script>

<FormGroup
  {noMargin}
  {invalid}
  {message}
  {messageText}
  {legendText}
  {legendId}
  on:click={() => console.log("click")}
  on:mouseover={() => console.log("mouseover")}
  on:mouseenter={() => console.log("mouseenter")}
  on:mouseleave={() => console.log("mouseleave")}
  {...$$restProps}
>
  {#if slotContent}
    {slotContent}
  {/if}
  <slot />
</FormGroup>
