<script lang="ts" context="module">
  import { createRouter, Router } from "@roxi/routify";
  import routes from "../.routify/routes.default.js";

  export const router = createRouter({ routes });
</script>

<Router {router} />
