<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let kind: "primary" | "ghost" = "primary";
  export let count: number;

  const dispatch = createEventDispatcher<{ change: { value: string } }>();
</script>

<button type="button" on:click={() => dispatch("change", { value: kind })}>
  {count}
</button>
<slot item={{ text: kind }} />
<slot name="footer" total={count} />
