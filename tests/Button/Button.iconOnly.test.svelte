<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  // A wrapper that forwards optional text, as a design-system wrapper would.
  export let text = "";
  export let iconOnly: boolean | undefined = undefined;
  export let icon: typeof Add | null = Add;
</script>

<Button data-testid="button" {icon} iconDescription="Add item" {iconOnly}
  >{#if text}
    {text}
  {/if}</Button
>
