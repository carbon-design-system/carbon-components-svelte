<script>
  export let file;
  export let options;

  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher();
  $: void options;

  onMount(() => dispatch("ready"));
</script>

<p data-testid="custom">{file.name}</p>
