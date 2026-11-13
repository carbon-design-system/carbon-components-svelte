<script>
  import { Dropdown } from "carbon-components-svelte";

  // Short selected label so the inline field is far narrower than the
  // menu's 18rem minimum width.
  const items = [
    { id: "a", text: "A" },
    { id: "b", text: "A much longer option label" },
  ];

  const cases = [
    { key: "inline-start", portalMenu: false },
    { key: "inline-end", portalMenu: false, align: "end" },
    { key: "portal-start", portalMenu: true },
    { key: "portal-end", portalMenu: true, align: "end" },
    // Last, so the rows above leave room for the menu to open upward.
    { key: "inline-start-top", portalMenu: false, direction: "top" },
    {
      key: "inline-end-top",
      portalMenu: false,
      align: "end",
      direction: "top",
    },
    { key: "portal-start-top", portalMenu: true, direction: "top" },
    { key: "portal-end-top", portalMenu: true, align: "end", direction: "top" },
  ];
</script>

{#each cases as { key, portalMenu, align, direction } (key)}
  <!-- Centered in a wide row so the menu has room on either side. -->
  <div style="display: flex; justify-content: center; padding: 1rem">
    <Dropdown
      data-testid={key}
      type="inline"
      labelText={key}
      hideLabel
      selectedId="a"
      {items}
      {portalMenu}
      {align}
      {direction}
    />
  </div>
{/each}

<!-- Near the window's edges: a labelled one, whose menu starts after the
     label, and one against the right edge. -->
<div style="padding: 1rem">
  <Dropdown
    data-testid="edge-labelled"
    type="inline"
    labelText="Contact"
    selectedId="a"
    {items}
    portalMenu={false}
  />
</div>
<div style="display: flex; justify-content: flex-end; padding: 1rem 0.5rem">
  <Dropdown
    data-testid="edge-right"
    type="inline"
    labelText="edge-right"
    hideLabel
    selectedId="a"
    {items}
    portalMenu={false}
  />
</div>
