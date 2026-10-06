<script>
  // Renders a different branch on the server and on the client.
  const isClient = typeof window !== "undefined";
</script>

{#if isClient}
  <p>client only</p>
{:else}
  <div><span>server only</span></div>
{/if}
