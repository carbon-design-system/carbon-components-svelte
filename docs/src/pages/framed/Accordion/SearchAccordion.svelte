<script>
  import { AccordionSearch } from "carbon-components-svelte";

  const items = [
    {
      id: "billing",
      title: "Billing and invoices",
      description:
        "Manage payment methods, view invoice history, and download receipts for your organization's subscription.",
    },
    {
      id: "api",
      title: "API access",
      description:
        "Generate and manage API keys, set rate limits, and configure webhook endpoints for programmatic access.",
    },
    {
      id: "team",
      title: "Team permissions",
      description:
        "Assign roles and control which team members can view, edit, or administer workspace resources.",
    },
    {
      id: "security",
      title: "Security and audit logs",
      description:
        "Review sign-in activity, enforce multi-factor authentication, and export audit logs.",
      disabled: true,
    },
  ];
</script>

<AccordionSearch {items} labelText="Filter sections" />
