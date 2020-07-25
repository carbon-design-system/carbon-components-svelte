<script context="module">
  export function preload() {
    return this.fetch("components.json")
      .then((r) => r.json())
      .then((data) => ({ data }));
  }
</script>

<script>
  export let data = [];

  import { getContext, onMount } from "svelte";
  import {
    Row,
    Column,
    UnorderedList,
    ListItem,
    Link,
  } from "carbon-components-svelte";

  const ctx = getContext("navigation");

  let tail = undefined;

  const unsubscribe = ctx.tail.subscribe((value) => {
    tail = value;
  });

  onMount(() => {
    if (tail) {
      ctx.setTail(undefined);
    }

    return () => {
      unsubscribe();
    };
  });
</script>

<svelte:head>
  <title>Components</title>
</svelte:head>

<Row>
  <Column>
    <h1>Components</h1>
    <UnorderedList>
      {#each data as data, i (data.title)}
        <ListItem>
          <Link rel="prefetch" href="components/{data.slug}">{data.title}</Link>
        </ListItem>
      {/each}
    </UnorderedList>
  </Column>
</Row>
