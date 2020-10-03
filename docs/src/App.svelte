<script>
  import { Router } from "@sveltech/routify";
  import { routes } from "../.routify/routes";
</script>

<style lang="scss" global>
  @import "carbon-components-svelte/css/all";
</style>

<Router routes="{routes}" />
