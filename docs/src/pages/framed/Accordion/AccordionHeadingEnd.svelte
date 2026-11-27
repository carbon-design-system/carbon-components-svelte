<script>
  import {
    Accordion,
    AccordionItem,
    OverflowMenu,
    OverflowMenuItem,
    Stack,
    Tag,
    Text,
  } from "carbon-components-svelte";

  let lastAction = "None";
</script>

<Stack gap={5}>
  <Text type="body-compact-01">Last action: {lastAction}</Text>
  <Accordion>
    <AccordionItem title="Billing and invoices">
      <Tag slot="headingEnd" type="red" size="sm">2 overdue</Tag>
      <p>
        Manage payment methods, view invoice history, and download receipts for
        your organization's subscription.
      </p>
    </AccordionItem>
    <AccordionItem title="API access">
      <OverflowMenu
        slot="headingEnd"
        flipped
        size="sm"
        iconDescription="API access options"
      >
        <OverflowMenuItem
          text="Rotate keys"
          on:click={() => {
            lastAction = "Rotate API keys";
          }}
        />
        <OverflowMenuItem
          danger
          text="Revoke all keys"
          on:click={() => {
            lastAction = "Revoke all API keys";
          }}
        />
      </OverflowMenu>
      <p>
        Generate and manage API keys, set rate limits, and configure webhook
        endpoints for programmatic access.
      </p>
    </AccordionItem>
    <AccordionItem title="Team permissions">
      <p>
        Assign roles and control which team members can view, edit, or
        administer workspace resources.
      </p>
    </AccordionItem>
  </Accordion>
</Stack>
