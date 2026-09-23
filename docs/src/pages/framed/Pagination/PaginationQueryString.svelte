<script>
  import { Pagination, queryParam } from "carbon-components-svelte";

  const pageSizes = [10, 15, 20];

  // docs-only:start
  // Opt out of this docs site's router, which intercepts history calls.
  const replace = (href) =>
    history.replaceState({ ...history.state, useRoutify: false }, "", href);
  // docs-only:end

  const page = queryParam("page", {
    defaultValue: 1,
    parse: (raw) => {
      const value = Number(raw);
      return Number.isInteger(value) && value >= 1 ? value : undefined;
    },
    // docs-only:start
    replace,
    // docs-only:end
  });

  const pageSize = queryParam("size", {
    defaultValue: pageSizes[0],
    parse: (raw) => pageSizes.find((size) => size === Number(raw)),
    // docs-only:start
    replace,
    // docs-only:end
  });
</script>

<Pagination
  totalItems={102}
  {pageSizes}
  bind:page={$page}
  bind:pageSize={$pageSize}
/>
