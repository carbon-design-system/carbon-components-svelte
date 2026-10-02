<script>
  import { Accordion, AccordionItem, Stack } from "carbon-components-svelte";

  const items = [
    {
      title: "Billing and invoices",
      description:
        "Manage payment methods, view invoice history, and download receipts for your organization's subscription.",
    },
    {
      title: "API access",
      description:
        "Generate and manage API keys, set rate limits, and configure webhook endpoints for programmatic access.",
    },
    {
      title: "Team permissions",
      description:
        "Assign roles and control which team members can view, edit, or administer workspace resources.",
    },
  ];

  let openCount = 0;
</script>

<Stack gap={5}>
  <div>Open sections: <strong>{openCount} of {items.length}</strong></div>
  <Accordion on:toggle:change={(e) => (openCount = e.detail.openCount)}>
    {#each items as item}
      <AccordionItem title={item.title}>
        <p>{item.description}</p>
      </AccordionItem>
    {/each}
  </Accordion>
</Stack>
