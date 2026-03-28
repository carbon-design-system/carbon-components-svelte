<script lang="ts">
  import { Filename } from "carbon-components-svelte";

  export let onclick: ((e: MouseEvent) => void) | undefined = undefined;
  export let onkeydown: ((e: KeyboardEvent) => void) | undefined = undefined;
</script>

<Filename
  on:click={(e) => onclick?.(e)}
  on:keydown={(e) => onkeydown?.(e)}
  {...$$restProps}
/>
