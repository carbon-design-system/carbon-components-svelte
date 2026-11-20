<script>
  import { InlineSuggest, TextArea } from "carbon-components-svelte";

  let ref = null;
  let value = "";

  // `scope="line"` completes the line the caret is on, so each new line
  // starts fresh.
  const phrases = [
    "Thank you for your patience.",
    "Thank you for your message.",
    "Please let me know if you have any questions.",
    "Kind regards,",
  ];
</script>

<TextArea
  bind:ref
  bind:value
  labelText="Message"
  helperText="Each line completes on its own. Try “Thank” or “Please” on a new line"
  rows={5}
/>
<InlineSuggest field={ref} source={phrases} scope="line" minLength={3} />
