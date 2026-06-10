<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";

  export let title: string | undefined = undefined;
  export let labelText = "Checkbox label";
</script>

<Checkbox {title} {labelText} data-testid="checkbox-title" />
