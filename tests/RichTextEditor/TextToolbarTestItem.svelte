<script lang="ts">
  import { getContext, onMount } from "svelte";

  export let label: string;
  export let disabled = false;

  let node: HTMLButtonElement;

  const ctx = getContext<{ register: (n: HTMLElement) => () => void }>(
    "carbon:TextToolbar",
  );

  onMount(() => ctx.register(node));
</script>

<button bind:this={node} type="button" {disabled} data-testid={label}>
  {label}
</button>
