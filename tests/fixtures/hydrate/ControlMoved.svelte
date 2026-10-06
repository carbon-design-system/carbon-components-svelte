<script>
  // Moves a server-rendered element to `body` on mount, as `Portal` does.
  import { onMount } from "svelte";

  /** @type {HTMLDivElement | null} */
  let ref = null;

  onMount(() => {
    if (ref) document.body.appendChild(ref);
  });
</script>

<div bind:this={ref} data-moved>
  <p>moved</p>
</div>
<p>stays</p>
