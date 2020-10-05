<script>
  import { Content, Grid, Row, Column, Link } from "carbon-components-svelte";
</script>

<style>
  footer {
    background: var(--cds-ui-01);
  }
</style>

<footer class="bx--content">
  <Grid>
    <Row>
      <Column>
        <Link
          href="https://www.vercel.com?utm_source=carbon-components-svelte&utm_campaign=oss"
          target="_blank"
        >
          <img src="/powered-by-vercel.svg" alt="Deploys by Vercel" />
        </Link>
      </Column>
    </Row>
  </Grid>
</footer>
