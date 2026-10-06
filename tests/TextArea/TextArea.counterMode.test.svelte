<script lang="ts">
  import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";

  let counterMode: "character" | "word" = "character";
</script>

<button type="button" on:click={() => (counterMode = "word")}>
  Count words
</button>

<TextArea labelText="Summary" maxCount={10} {counterMode} value="one two" />
