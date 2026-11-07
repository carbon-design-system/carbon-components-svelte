<script>
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import EmptyState from "carbon-components-svelte/EmptyState/EmptyState.svelte";
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";

  const reports = ["Invoices by month", "Spend by service"];

  let query = "";

  $: results = reports.filter((report) =>
    report.toLowerCase().includes(query.trim().toLowerCase()),
  );
</script>

<main>
  <h1>Workspace</h1>
  <h2>Projects</h2>
  <EmptyState
    title="Create your first project"
    subtitle="Projects hold the files, comments and people for one piece of work."
  >
    <Folder slot="illustration" size={32} />
    <Button>Create project</Button>
    <Button kind="ghost">Import files</Button>
  </EmptyState>
  <h2>Billing</h2>
  <EmptyState title="You don't have access to Billing">
    <Folder slot="illustration" size={32} />
    <svelte:fragment slot="subtitleChildren">
      Ask a workspace admin, or <a href="#roles">read about roles</a>.
    </svelte:fragment>
  </EmptyState>
  <EmptyState
    size="sm"
    title="Your bag is empty"
    subtitle="Items you add show up here."
  />
  <h2>Reports</h2>
  <Search bind:value={query} labelText="Search reports" />
  <ul>
    {#each results as report (report)}
      <li>{report}</li>
    {/each}
  </ul>
  <div role="status" data-testid="status">
    {#if results.length === 0}
      <EmptyState
        title="No results for “{query}”"
        subtitle="Check the spelling, or try a shorter, broader term."
      >
        <Button kind="tertiary" on:click={() => (query = "")}>
          Clear search
        </Button>
      </EmptyState>
    {/if}
  </div>
</main>
