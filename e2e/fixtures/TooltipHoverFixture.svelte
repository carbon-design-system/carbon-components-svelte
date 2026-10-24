<script>
  import {
    Button,
    ContentSwitcher,
    CopyButton,
    OverflowMenu,
    OverflowMenuItem,
    PasswordInput,
    Switch,
    TooltipIcon,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Grid from "carbon-icons-svelte/lib/Grid.svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  let edits = 0;

  // Rows of ghost buttons whose tooltips open toward the next button and
  // cover it. Pressed buttons log here.
  /** @type {Array<{ id: string; portal: boolean; dir: "ltr" | "rtl"; position: "right" | "left" }>} */
  const toolbars = [
    { id: "inline", portal: false, dir: "ltr", position: "right" },
    { id: "portal", portal: true, dir: "ltr", position: "right" },
    { id: "rtl", portal: false, dir: "rtl", position: "left" },
  ];
  /** @type {Record<string, string[]>} */
  let pressed = { inline: [], portal: [], rtl: [] };
  /**
   * @param {string} toolbar
   * @param {string} name
   */
  const press = (toolbar, name) => {
    pressed[toolbar] = [...pressed[toolbar], name];
  };
  const actions = [
    { name: "Add", icon: Add },
    { name: "Delete", icon: TrashCan },
    { name: "Save", icon: Save },
  ];
</script>

<div
  style="padding: 6rem; display: flex; flex-wrap: wrap; gap: 8rem; align-items: center"
>
  <Button
    kind="ghost"
    icon={Edit}
    iconDescription="Edit service"
    on:click={() => edits++}
  />
  <Button
    kind="ghost"
    icon={Copy}
    iconDescription="Duplicate service"
    portalTooltip
  />
  <TooltipIcon tooltipText="Region details" icon={Information} />
  <TooltipIcon tooltipText="Plan details" icon={Information} portalTooltip />
  <CopyButton text="us-east-1" iconDescription="Copy region" />
  <OverflowMenu iconDescription="Service options">
    <OverflowMenuItem text="Restart" />
  </OverflowMenu>
  <ContentSwitcher size="sm">
    <Switch icon={List} text="List view" />
    <Switch icon={Grid} text="Grid view" />
  </ContentSwitcher>
  <PasswordInput labelText="API key" />
  <output data-testid="edits">{edits}</output>
  {#each toolbars as toolbar (toolbar.id)}
    <div data-testid="toolbar-{toolbar.id}" dir={toolbar.dir}>
      <div style="display: flex">
        {#each actions as { name, icon } (name)}
          <Button
            kind="ghost"
            {icon}
            iconDescription={name}
            tooltipPosition={toolbar.position}
            portalTooltip={toolbar.portal}
            on:click={() => press(toolbar.id, name)}
          />
        {/each}
      </div>
      <output data-testid="pressed">{pressed[toolbar.id].join(",")}</output>
    </div>
  {/each}
</div>
