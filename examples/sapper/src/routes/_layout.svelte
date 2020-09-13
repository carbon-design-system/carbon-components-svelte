<script>
  export let segment = undefined;

  import {
    Content,
    Breadcrumb,
    BreadcrumbItem,
    Grid,
    Row,
    Column,
    Tabs,
    TabContent,
    Tab,
    Select,
    SelectItem,
  } from "carbon-components-svelte";
  import Header from "../components/Header.svelte";
  import Theme from "../components/Theme.svelte";
</script>

<Theme persist theme="g10">
  <Header segment="{segment}" />
  <Content style="background: none; padding: 1rem">
    <Grid>
      <slot />
    </Grid>
  </Content>
</Theme>
