<script>
  import { preserveFocusSelection } from "carbon-components-svelte";

  let value = "prod-us-east-1";
</script>

<label class="bx--label" for="cluster-name">Cluster name</label>
<input
  id="cluster-name"
  class="bx--text-input"
  bind:value
  on:focus={(e) => e.currentTarget.select()}
  use:preserveFocusSelection={true}
>
