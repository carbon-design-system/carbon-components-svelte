<script>
  import { Accordion, AccordionItem, Button } from "carbon-components-svelte";

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

  let open = false;
</script>

<Button kind="ghost" size="field" on:click={() => (open = !open)}>
  {open ? "Collapse" : "Expand"}
  all
</Button>

<Accordion>
  {#each items as item}
    <AccordionItem title={item.title} {open}>
      <p>{item.description}</p>
    </AccordionItem>
  {/each}
</Accordion>
