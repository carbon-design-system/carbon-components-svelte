<script lang="ts">
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
</script>

<Tag filter icon={Add}>Icon prop</Tag>

<Tag filter>
  <Add slot="icon" />
  Icon slot
</Tag>

<Tag filter>Plain</Tag>
