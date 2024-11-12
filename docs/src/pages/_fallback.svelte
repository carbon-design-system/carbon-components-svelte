<script>
  import { Content, Grid, Row, Column, Link } from "carbon-components-svelte";
  import { url, metatags } from "@sveltech/routify";

  metatags.title = "404";
</script>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>404</h1>
        <div>
          Page not found.
          <Link href={$url("/")}>Return home</Link>
        </div>
      </Column>
    </Row>
  </Grid>
</Content>
