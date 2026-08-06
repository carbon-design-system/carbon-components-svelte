<script>
  import { InlineLoading, MultiSelect } from "carbon-components-svelte";

  let items = [];
  let status = "idle";
  let timeoutId;

  const allRoles = [
    { id: "0", text: "Admin" },
    { id: "1", text: "Editor" },
    { id: "2", text: "Viewer" },
    { id: "3", text: "Approver" },
    { id: "4", text: "Auditor" },
  ];

  async function fetchRoles(query) {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!query) {
      return allRoles;
    }

    return allRoles.filter((item) =>
      item.text.toLowerCase().includes(query.toLowerCase()),
    );
  }

  function handleInput(event) {
    const query = event.currentTarget.value;
    status = "loading";
    items = [];
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      try {
        items = await fetchRoles(query);
        status = items.length ? "idle" : "empty";
      } catch {
        status = "error";
      }
    }, 150);
  }
</script>

<MultiSelect
  filterable
  filterItem={() => true}
  {items}
  labelText="Role"
  placeholder="Search roles..."
  on:input={handleInput}
>
  <svelte:fragment slot="empty">
    {#if status === "loading"}
      <InlineLoading status="active" description="Loading…" />
    {:else if status === "error"}
      Something went wrong
    {:else}
      No matching roles
    {/if}
  </svelte:fragment>
</MultiSelect>
