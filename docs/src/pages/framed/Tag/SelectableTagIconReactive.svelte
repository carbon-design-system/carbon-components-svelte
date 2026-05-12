<script>
  import { SelectableTag } from "carbon-components-svelte";
  import IbmCloud from "carbon-icons-svelte/lib/IbmCloud.svelte";

  let selected = true;
</script>

<SelectableTag bind:selected icon={IbmCloud} on:change>IBM Cloud</SelectableTag>
