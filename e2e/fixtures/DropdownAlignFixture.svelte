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
    { key: "portal-start", portalMenu: true },
    // Last, so the rows above leave room for the menu to open upward.
    { key: "inline-start-top", portalMenu: false, direction: "top" },
    { key: "portal-start-top", portalMenu: true, direction: "top" },
  ];
</script>

{#each cases as { key, portalMenu, direction } (key)}
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
      {direction}
    />
  </div>
{/each}
