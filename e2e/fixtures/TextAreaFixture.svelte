<script>
  import { TextArea } from "carbon-components-svelte";

  let value = "";
</script>

<div class="fixture-container">
  <TextArea
    data-testid="text-area-comment"
    labelText="Comment"
    placeholder="Enter your comment"
    bind:value
  />
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
