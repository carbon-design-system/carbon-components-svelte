<script lang="ts">
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";

  export let maxWidth: string | undefined = "8rem";
  export let filter = false;
  export let interactive = false;
  export let label =
    "status:active AND region:us-south AND service:cloud-object-storage";
</script>

<Tag {maxWidth} {filter} {interactive} on:close>{label}</Tag>
