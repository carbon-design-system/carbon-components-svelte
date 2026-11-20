<script>
  import { TextAnnotations } from "carbon-components-svelte";

  function line(i) {
    const second = String(i).padStart(2, "0");
    if (i === 9 || i === 26 || i === 43) {
      return `2026-11-06T14:02:${second}Z ERROR payment-gateway timeout after 30000 ms (request 7f3a${i})`;
    }
    if (i % 5 === 0) {
      return `2026-11-06T14:02:${second}Z WARN  retrying upstream call, attempt 2 of 3`;
    }
    return `2026-11-06T14:02:${second}Z INFO  handled GET /api/orders in 42 ms`;
  }

  const text = Array.from({ length: 60 }, (_, i) => line(i)).join("\n");

  function note(id, quote, name, body) {
    const start = text.indexOf(quote);
    return {
      id,
      range: { start, end: start + quote.length },
      quote,
      comments: [{ id: `${id}-1`, author: { name }, body }],
    };
  }

  let annotations = [
    note(
      "first",
      "payment-gateway timeout after 30000 ms (request 7f3a9)",
      "Grace Hopper",
      "First timeout. It lines up with the deploy.",
    ),
    note(
      "retry",
      "retrying upstream call, attempt 2 of 3",
      "Alan Turing",
      "Retries hide the failure from the client.",
    ),
  ];
</script>

<div class="bx--type-mono">
  <TextAnnotations
    bind:annotations
    {text}
    height="22rem"
    labelText="checkout-api log"
    user={{ id: "ada", name: "Ada Lovelace" }}
  />
</div>
