<script context="module">
  export async function preload({ params }) {
    const res = await this.fetch(`components/${params.slug}.json`);
    const data = await res.json();

    if (res.status === 200) {
      return { data };
    } else {
      this.error(res.status, data.message);
    }
  }
</script>

<script>
  export let data = {};

  import { onMount } from "svelte";

  let component = undefined;

  onMount(async () => {
    try {
      component = await import(`../examples/${data.title}.svelte`);
    } catch (e) {
      console.log(e);
    }
  });
</script>

<svelte:head>
  <title>{data.title}</title>
</svelte:head>

<h1>{data.title}</h1>

{#if component}
  <svelte:component this={component.default} />
{/if}
