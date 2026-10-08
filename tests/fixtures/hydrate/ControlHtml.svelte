<script>
  // Renders different `{@html}` and a longer list on the client.
  const isClient = typeof window !== "undefined";
  const items = isClient ? [1, 2, 3] : [1, 2];
</script>

<div>{@html isClient ? "<b>client</b>" : "<i>server</i>"}</div>
<ul>
  {#each items as item}
    <li>{item}</li>
  {/each}
</ul>
