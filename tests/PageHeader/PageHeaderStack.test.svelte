<script lang="ts">
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import PageHeader from "carbon-components-svelte/PageHeader/PageHeader.svelte";
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
</script>

<Header />
<PageHeader
  sticky
  stickyOffset="stack"
  data-testid="header"
  title="Databases"
/>
<Toolbar sticky stickyOffset="stack" data-testid="toolbar" />
