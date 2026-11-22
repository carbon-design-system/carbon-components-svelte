<script lang="ts">
  import { useId } from "carbon-components-svelte/utils/id-scope.js";

  export let name: string | undefined = undefined;
  export let fallbackPrefix: string | undefined = undefined;

  const id = useId(name, fallbackPrefix);
</script>

<i data-testid="probe" {id}></i>
