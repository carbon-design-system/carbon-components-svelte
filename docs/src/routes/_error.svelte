<script>
  export let status;
  export let error = {};

  import { Link } from "carbon-components-svelte";
</script>

<svelte:head>
  <title>{status}</title>
</svelte:head>

<h1>{status}</h1>

<div>
  {error.message}.
  <Link href=".">Return home</Link>
</div>

{#if process.env.NODE_ENV === 'development' && error.stack}
  <pre>{error.stack}</pre>
{/if}
