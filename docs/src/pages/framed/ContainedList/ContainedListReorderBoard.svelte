<script>
  import {
    applySort,
    Box,
    Button,
    Link,
    sortable,
    Stack,
    Tile,
  } from "carbon-components-svelte";
  import Draggable from "carbon-icons-svelte/lib/Draggable.svelte";

  let columns = {
    todo: [
      { id: "mfa", title: "Enforce MFA for admins" },
      { id: "audit", title: "Export the audit log" },
      { id: "sso", title: "Add SAML single sign-on" },
    ],
    doing: [{ id: "rotate", title: "Rotate API keys" }],
    done: [],
  };
  const titles = { todo: "To do", doing: "In progress", done: "Done" };

  function handleSort(event) {
    columns = applySort(columns, event.detail);
  }
</script>

<Stack orientation="horizontal" gap={5}>
  {#each Object.keys(columns) as name (name)}
    <Box width="16rem" minHeight="12rem">
      <p class="bx--label">{titles[name]}</p>
      <div
        use:sortable={{
          name,
          label: titles[name],
          group: "board",
          itemSelector: ".bx--tile",
          handleSelector: "[data-sortable-handle]",
        }}
        on:sort={handleSort}
      >
        <Stack gap={3}>
          {#each columns[name] as card (card.id)}
            <Tile data-sortable-id={card.id}>
              <Stack orientation="horizontal" gap={3} align="center">
                <Button
                  kind="ghost"
                  size="small"
                  icon={Draggable}
                  iconDescription="Move {card.title}"
                  tooltipPosition="right"
                  data-sortable-handle
                />
                <Link href="#{card.id}">{card.title}</Link>
              </Stack>
            </Tile>
          {/each}
        </Stack>
      </div>
    </Box>
  {/each}
</Stack>
