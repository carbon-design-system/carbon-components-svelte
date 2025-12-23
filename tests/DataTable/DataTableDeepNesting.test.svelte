<script lang="ts">
  import { DataTable } from "carbon-components-svelte";
  import type {
    DataTableHeader,
    DataTableRow,
  } from "carbon-components-svelte/DataTable/DataTable.svelte";

  // This example showcases type-safe `key` values in headers, done via
  // `PropertyPath<T>`, which infers the type of the key from the object type.

  const headers = [
    {
      key: "id",
      value: "ID",
    },
    {
      key: "level1.name",
      value: "Level 1 (2 levels)",
    },
    {
      key: "level1.level2.level3.name",
      value: "Level 3 (4 levels)",
    },
    // TODO: remove casting after PropertyPath depth extends beyond 2 levels.
  ] as const as ReadonlyArray<DataTableHeader<DataTableRow>>;

  const rows = [
    {
      id: "1",
      level1: {
        name: "Org A",
        level2: {
          name: "Dept A",
          level3: {
            name: "Team A",
            level4: {
              name: "Project A",
              level5: {
                name: "Subproject A",
              },
            },
          },
        },
      },
    },
    {
      id: "2",
      level1: {
        name: "Org B",
        level2: {
          name: "Dept B",
          level3: {
            name: "Team B",
            level4: {
              name: "Project B",
              level5: {
                name: "Subproject B",
              },
            },
          },
        },
      },
    },
    {
      id: "3",
      level1: {
        name: "Org C",
        level2: {
          name: "Dept C",
          level3: {
            name: "Team C",
            level4: {
              name: "Project C",
              level5: {
                name: "Subproject C",
              },
            },
          },
        },
      },
    },
  ];
</script>

<DataTable {headers} {rows} />
