<script>
  import { TextArea } from "carbon-components-svelte";

  let value = "";
</script>

<TextArea
  data-testid="text-area-comment"
  labelText="Comment"
  placeholder="Enter your comment"
  bind:value
/>
