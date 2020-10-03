<script>
  import { Router, basepath } from "@sveltech/routify";
  import { routes } from "../.routify/routes";

  $basepath = "/carbon-components-svelte";
</script>

<style lang="scss" global>
  @import "carbon-components-svelte/css/all";
</style>

<Router routes="{routes}" />
