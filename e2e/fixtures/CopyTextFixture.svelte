<script>
  import { CopyText } from "carbon-components-svelte";

  const cases = [
    {
      id: "ltr",
      dir: "ltr",
      before: "Use the endpoint",
      after: "for requests.",
    },
    { id: "rtl", dir: "rtl", before: "השתמשו בכתובת", after: "עבור בקשות." },
    // An LTR value followed by LTR text inside an RTL line.
    {
      id: "rtl-mixed",
      dir: "rtl",
      before: "השתמשו בכתובת",
      after: "for requests.",
    },
  ];
</script>

{#each cases as { id, dir, before, after }}
  <p data-testid="sentence-{id}" {dir} style:margin="0 0 24px">
    {before}
    <CopyText text="https://api.acme.io/webhooks/incoming/f8a2c91d"
      >https://api.acme.io/…/f8a2c91d</CopyText
    >
    {after}
  </p>
{/each}
