<script>
  import { metatags, url } from "@sveltech/routify";
  import { Column, Content, Grid, Link, Row } from "carbon-components-svelte";

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
