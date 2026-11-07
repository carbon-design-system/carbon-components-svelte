<script>
  import { TextAnnotations } from "carbon-components-svelte";

  const clauses = [
    [
      "1. Term. ",
      "This Agreement begins on the Effective Date and continues for twelve months unless it is ended under clause 4.",
    ],
    [
      "2. Fees. ",
      "The Customer shall pay the Supplier a monthly fee of 4,200 euros within thirty days of invoice. Late payment carries interest at two percent a month.",
    ],
    [
      "3. Liability. ",
      "Neither party is liable for indirect or consequential loss arising from this Agreement, and total liability is capped at the fees paid in the prior year.",
    ],
    [
      "4. Notice. ",
      "Either party may end this Agreement by giving sixty days written notice to the other. Notice takes effect on the day it is received.",
    ],
  ];

  const text = clauses.map((clause) => clause.join("")).join("");

  function review(id, quote, name, body) {
    const start = text.indexOf(quote);
    return {
      id,
      range: { start, end: start + quote.length },
      quote,
      comments: [{ id: `${id}-1`, author: { name }, body }],
    };
  }

  let annotations = [
    review(
      "fee",
      "monthly fee of 4,200 euros",
      "Grace Hopper",
      "Is this fee fixed, or indexed to inflation?",
    ),
    review(
      "cap",
      "total liability is capped at the fees paid in the prior year",
      "Alan Turing",
      "Carve out data breaches from the cap.",
    ),
    review(
      "notice",
      "sixty days written notice",
      "Ada Lovelace",
      "Thirty days is usual for a monthly plan.",
    ),
  ];
</script>

<TextAnnotations
  bind:annotations
  labelText="Master services agreement"
  user={{ id: "ada", name: "Ada Lovelace" }}
>
  {#each clauses as [heading, body]}
    <p><strong>{heading}</strong>{body}</p>
  {/each}
</TextAnnotations>
