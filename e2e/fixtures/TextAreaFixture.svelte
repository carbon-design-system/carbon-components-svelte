<script>
  import { TextArea } from "carbon-components-svelte";

  let value = "";
  let atLimitValue = "abcde";
  let emojiValue = "";
  let pasteValue = "";
</script>

<TextArea
  data-testid="text-area-comment"
  labelText="Comment"
  placeholder="Enter your comment"
  bind:value
/>

<TextArea
  data-testid="text-area-at-limit"
  labelText="At limit"
  maxCount={5}
  bind:value={atLimitValue}
/>

<TextArea
  data-testid="text-area-emoji"
  labelText="Emoji"
  maxCount={3}
  bind:value={emojiValue}
/>

<TextArea
  data-testid="text-area-paste"
  labelText="Paste"
  maxCount={3}
  bind:value={pasteValue}
/>
