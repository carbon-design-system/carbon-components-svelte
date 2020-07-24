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

  import { onMount, getContext } from "svelte";

  const ctx = getContext("navigation");

  let component = undefined;

  onMount(async () => {
    ctx.setTail(data);

    try {
      component = await import(`../examples/${data.title}.svelte`);
    } catch (e) {
      console.error(e);
    }

    return () => {
      ctx.setTail(undefined);
    };
  });
</script>

<style>
  .preview {
    margin-left: -1rem;
    margin-right: -1rem;
    padding: 1rem;
    white-space: nowrap;
    overflow-x: auto;
  }

  :global(.preview > div) {
    margin-bottom: 1rem;
  }

  h1 {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
  }
</style>

<svelte:head>
  <title>{data.title}</title>
</svelte:head>

<h1>{data.title}</h1>
<div class="preview">
  {#if component}
    <svelte:component this={component.default} />
  {/if}
</div>
