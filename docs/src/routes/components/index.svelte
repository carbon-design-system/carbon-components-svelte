<script context="module">
  export function preload() {
    return this.fetch("components.json")
      .then(r => r.json())
      .then(data => ({ data }));
  }
</script>

<script>
  export let data = [];

  import { UnorderedList, ListItem, Link } from "carbon-components-svelte";
</script>

<svelte:head>
  <title>Components</title>
</svelte:head>

<h1>Components</h1>

<UnorderedList>
  {#each data as data, i (data.title)}
    <ListItem>
      <Link rel="prefetch" href="components/{data.slug}">{data.title}</Link>
    </ListItem>
  {/each}
</UnorderedList>
