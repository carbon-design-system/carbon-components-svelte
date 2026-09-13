<script>
  import {
    Accordion,
    AccordionItem,
    Button,
    ButtonSet,
  } from "carbon-components-svelte";

  let disabled = false;

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

<ButtonSet>
  <Button size="field" {disabled} on:click={() => (open = !open)}>
    {open ? "Collapse" : "Expand"}
    all
  </Button>
  <Button
    kind="ghost"
    size="field"
    on:click={() => {
      disabled = !disabled;
      if (disabled) {
        open = false;
      }
    }}
  >
    {disabled ? "Enable" : "Disable"}
    all
  </Button>
</ButtonSet>

<Accordion {disabled}>
  {#each items as item}
    <AccordionItem title={item.title} {open}>
      <p>{item.description}</p>
    </AccordionItem>
  {/each}
</Accordion>
