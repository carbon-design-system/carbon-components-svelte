<script>
  import { TextAnnotations } from "carbon-components-svelte";

  const text = [
    "[00:00] Dana (support): Thanks for calling. Can you tell me what you are seeing?",
    "[00:08] Priya (customer): The checkout page keeps spinning after I enter my card, and then it says the payment failed.",
    "[00:21] Dana (support): Did you get a confirmation email, or a charge on your statement?",
    "[00:29] Priya (customer): No email, but my bank shows a pending charge of 129 dollars.",
    "[00:40] Dana (support): That is a pending authorization. I will cancel it so the hold is released within two business days.",
  ].join("\n");

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
      "symptom",
      "keeps spinning after I enter my card",
      "Dana",
      "Matches the gateway timeout in INC-4821.",
    ),
    note(
      "charge",
      "a pending charge of 129 dollars",
      "Dana",
      "Duplicate authorization. Cancel it.",
    ),
  ];
</script>

<TextAnnotations
  bind:annotations
  {text}
  labelText="Support call transcript"
  user={{ id: "dana", name: "Dana" }}
/>
