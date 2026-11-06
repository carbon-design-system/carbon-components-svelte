<script>
  import { InlineSuggest, TextArea } from "carbon-components-svelte";

  let ref = null;
  let value = "";

  const replies = [
    "Thanks for reaching out. I will look into this today and get back to you by the end of the day.",
    "Thanks for reaching out. We are sorry about the delay with your order and have issued a refund.",
    "Hi there, could you share the steps to reproduce this so we can investigate?",
  ];

  // For demo purposes only: swap the body for a real `fetch(url, { signal })`
  // to a model. Return what follows `value`, not the whole text. The signal
  // aborts when the user types on, so a slow answer is never shown.
  function complete(value, { signal }) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const text = value.toLowerCase();
        const reply = replies.find((r) => r.toLowerCase().startsWith(text));
        resolve(reply ? reply.slice(value.length) : "");
      }, 400);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }
</script>

<TextArea
  bind:ref
  bind:value
  labelText="Reply"
  helperText="Start with “Thanks for reaching out” or “Hi there”"
  rows={4}
/>
<InlineSuggest field={ref} source={complete} minLength={3} />
