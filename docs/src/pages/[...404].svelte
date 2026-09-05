<script lang="ts">
  import { Content, FullPageError, Link } from "carbon-components-svelte";
</script>

<svelte:head> <title>404</title> </svelte:head>

<Content style="min-height: calc(100vh - 6rem - 1px);">
  <FullPageError kind="404" labelText="Error 404" title="Page not found">
    <Link size="lg" href="/">Return home</Link>
  </FullPageError>
</Content>
