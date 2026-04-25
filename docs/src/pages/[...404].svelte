<script lang="ts">
  import { Column, Content, Grid, Link, Row } from "carbon-components-svelte";
</script>

<svelte:head> <title>404</title> </svelte:head>

<Content style="min-height: calc(100vh - 6rem - 1px);">
  <Grid>
    <Row>
      <Column>
        <h1>404</h1>
        <div>
          Page not found.
          <Link href="/">Return home</Link>
        </div>
      </Column>
    </Row>
  </Grid>
</Content>
