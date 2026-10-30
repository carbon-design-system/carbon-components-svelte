<script>
  import { Button, CommandPalette } from "carbon-components-svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";

  let open = true;

  const items = [
    {
      id: "deploys",
      text: "Deploys",
      description: "Docs › Services",
      href: "#deploys",
      icon: Document,
    },
    {
      id: "env",
      text: "Environment variables",
      description: "Docs › Configuration",
      href: "#environment-variables",
      icon: Document,
    },
    {
      id: "domains",
      text: "Custom domains",
      description: "Docs › Networking",
      href: "#custom-domains",
      icon: Document,
    },
  ];
</script>

<Button on:click={() => (open = true)}>Search docs</Button>

<CommandPalette
  bind:open
  {items}
  placeholder="Search docs"
  labelText="Search docs"
/>
