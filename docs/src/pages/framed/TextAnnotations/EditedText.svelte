<script>
  import {
    Button,
    Stack,
    Tag,
    TextAnnotations,
  } from "carbon-components-svelte";

  const original = [
    "1. Term. This Agreement begins on the Effective Date and continues for twelve months.",
    "2. Fees. The Customer shall pay the Supplier a monthly fee of 4,200 euros within thirty days of invoice.",
    "3. Liability. Neither party is liable for indirect or consequential loss arising from this Agreement.",
  ];
  const text = original.join("");

  let paragraphs = [...original];

  function annotate(id, quote, name, body) {
    const start = text.indexOf(quote);
    return {
      id,
      range: { start, end: start + quote.length },
      quote,
      prefix: text.slice(Math.max(0, start - 24), start),
      suffix: text.slice(start + quote.length, start + quote.length + 24),
      comments: [{ id: `${id}-1`, author: { name }, body }],
    };
  }

  let annotations = [
    annotate("date", "Effective Date", "Ada Lovelace", "Define this term."),
    annotate(
      "fee",
      "monthly fee of 4,200 euros",
      "Grace Hopper",
      "Fixed or indexed?",
    ),
    annotate(
      "loss",
      "indirect or consequential loss",
      "Alan Turing",
      "Add a carve-out.",
    ),
  ];
  let changes = [];

  function insertClause() {
    paragraphs = [
      "0. Definitions. Capitalized terms are defined in schedule 1.",
      ...paragraphs,
    ];
  }

  function rewordFee() {
    paragraphs = paragraphs.map((paragraph) =>
      paragraph.replace(
        "monthly fee of 4,200 euros",
        "monthly fees of 4,500 euros",
      ),
    );
  }

  function deleteClause() {
    paragraphs = paragraphs.filter((paragraph) => !paragraph.startsWith("3."));
  }

  function reset() {
    paragraphs = [...original];
  }

  function handleReanchor({ detail }) {
    changes = detail.changes;
  }

  function tagType(status) {
    if (status === "orphaned") return "red";
    return status === "fuzzy" ? "purple" : "blue";
  }
</script>

<Stack gap={5}>
  <Stack gap={3} orientation="horizontal">
    <Button size="small" kind="tertiary" on:click={insertClause}>
      Insert a clause above
    </Button>
    <Button size="small" kind="tertiary" on:click={rewordFee}>
      Reword the fee
    </Button>
    <Button size="small" kind="tertiary" on:click={deleteClause}>
      Delete the liability clause
    </Button>
    <Button size="small" kind="ghost" on:click={reset}>Reset</Button>
  </Stack>
  <TextAnnotations
    bind:annotations
    labelText="Draft agreement"
    on:reanchor={handleReanchor}
  >
    {#each paragraphs as paragraph}
      <p>{paragraph}</p>
    {/each}
  </TextAnnotations>
  <Stack gap={3} orientation="horizontal">
    {#each changes as change (change.id)}
      <Tag type={tagType(change.status)}>{change.id}: {change.status}</Tag>
    {/each}
  </Stack>
</Stack>
