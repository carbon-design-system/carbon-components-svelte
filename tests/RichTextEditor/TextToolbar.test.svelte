<script lang="ts">
  import TextToolbar from "carbon-components-svelte/RichTextEditor/TextToolbar.svelte";
  import TextToolbarTestItem from "./TextToolbarTestItem.svelte";

  export let disabledSecond = false;
</script>

<TextToolbar aria-label="Formatting">
  <TextToolbarTestItem label="one" />
  <TextToolbarTestItem label="two" disabled={disabledSecond} />
  <TextToolbarTestItem label="three" />
</TextToolbar>
