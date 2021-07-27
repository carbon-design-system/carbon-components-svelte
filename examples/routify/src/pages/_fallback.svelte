<script>
  import { url } from "@roxi/routify";
  import { Row, Column, Link } from "carbon-components-svelte";
</script>

<Row>
  <Column lg="{16}">
    <h1>404</h1>
    <div>
      Page not found.
      <Link inline href="{$url('..')}">Return home</Link>
    </div>
  </Column>
</Row>
