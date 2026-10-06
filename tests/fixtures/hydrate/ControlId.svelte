<script>
  // Generates a new random id on the server and again on the client.
  import { uniqueId } from "carbon-components-svelte/utils/unique-id.js";

  const id = uniqueId();
</script>

<label for={id}>Name</label>
<input {id} aria-describedby="{id}-help">
<span id="{id}-help">Help</span>
