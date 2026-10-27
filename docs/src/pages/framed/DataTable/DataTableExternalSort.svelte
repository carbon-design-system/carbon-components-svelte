<script>
  import { DataTable, Pagination } from "carbon-components-svelte";

  // Mock data held by the server. It orders names by code point, so "apple"
  // follows "Zebra", which a client side collator would not do.
  const database = [
    { id: "1", name: "Zebra", port: 8080 },
    { id: "2", name: "apple", port: 80 },
    { id: "3", name: "Banana", port: 443 },
    { id: "4", name: "cherry", port: 3000 },
    { id: "5", name: "Date", port: 22 },
    { id: "6", name: "elderberry", port: 5432 },
  ];

  let rows = [];
  let sortKey = "name";
  let sortDirection = "ascending";
  let page = 1;
  let pageSize = 3;

  // Simulate a request for one sorted page.
  function fetchPage(key, direction, pageNumber, size) {
    const sign = direction === "ascending" ? 1 : -1;
    const sorted = [...database].sort((a, b) =>
      a[key] === b[key] ? 0 : a[key] < b[key] ? -sign : sign,
    );
    return new Promise((resolve) => {
      setTimeout(
        () => resolve(sorted.slice((pageNumber - 1) * size, pageNumber * size)),
        250,
      );
    });
  }

  $: fetchPage(sortKey, sortDirection, page, pageSize).then((next) => {
    rows = next;
  });
</script>

<DataTable
  headers={[
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
  ]}
  {rows}
  sortable
  externalSort
  bind:sortKey
  bind:sortDirection
  on:sort={() => (page = 1)}
/>
<Pagination
  bind:page
  bind:pageSize
  totalItems={database.length}
  pageSizes={[3, 6]}
/>
