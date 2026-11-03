<script>
  import { PeoplePicker, Stack } from "carbon-components-svelte";

  const directory = [
    { id: "u-1042", name: "Priya Raman", email: "priya.raman@example.com" },
    { id: "u-2290", name: "Marcus Oyelaran", email: "marcus@example.com" },
    { id: "u-3118", name: "Hannah Lindqvist", email: "hannah@example.com" },
  ];

  let value = [];

  // Keep addresses inside the company.
  /** @param {{ name: string; email?: string }} entry */
  function validateEntry({ email }) {
    if (!email) return false;
    return email.endsWith("@example.com") || "Use a company address";
  }
</script>

<Stack gap={5}>
  <PeoplePicker
    bind:value
    items={directory}
    allowEmail
    {validateEntry}
    labelText="Invite"
    helperText="Type an address and press Enter, comma or semicolon, or paste a list"
  />
  <p>
    Paste to try it:
    <code
      >priya.raman@example.com, new.hire@example.com; someone@other.org, nope</code
    >
  </p>
</Stack>
