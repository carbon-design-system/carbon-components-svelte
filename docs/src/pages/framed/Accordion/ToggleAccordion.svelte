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

  let lastToggled = "None yet";
</script>

<Stack gap={5}>
  <div>Last toggled: <strong>{lastToggled}</strong></div>
  <Accordion>
    {#each items as item}
      <AccordionItem
        title={item.title}
        on:toggle={(e) => {
          const isOpen = e.detail;
          lastToggled = `${item.title} (${isOpen ? "opened" : "closed"})`;
        }}
      >
        <p>{item.description}</p>
      </AccordionItem>
    {/each}
  </Accordion>
</Stack>
