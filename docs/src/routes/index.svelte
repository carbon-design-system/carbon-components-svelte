<script>
  import components from "./components/_components";
  import { Link } from "carbon-components-svelte";
</script>

<h1>Welcome</h1>

{#each components as component}
  <Link href="examples/{component.title}">{component.title}</Link>
{/each}
