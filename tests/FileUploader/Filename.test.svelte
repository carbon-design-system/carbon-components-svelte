<script lang="ts">
  import { Filename } from "carbon-components-svelte";

  export let onclick: ((e: MouseEvent) => void) | undefined = undefined;
  export let onkeydown: ((e: KeyboardEvent) => void) | undefined = undefined;
</script>

<Filename on:click={onclick} on:keydown={onkeydown} {...$$restProps} />

