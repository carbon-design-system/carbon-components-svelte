<script>
  import { metatags, page } from "@sveltech/routify";
  import { Content, Grid } from "carbon-components-svelte";
  import Navigation from "./_navigation.svelte";
  import Theme from "../components/Theme.svelte";
</script>

<Theme persist theme="g10">
  <Navigation />
  <Content style="background: none; padding: 1rem">
    <Grid>
      <slot />
    </Grid>
  </Content>
</Theme>
