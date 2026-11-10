<script lang="ts">
  import ActionBar from "carbon-components-svelte/ActionBar/ActionBar.svelte";
  import ActionBarButton from "carbon-components-svelte/ActionBar/ActionBarButton.svelte";
  import ActionBarDivider from "carbon-components-svelte/ActionBar/ActionBarDivider.svelte";
  import ActionBarGroup from "carbon-components-svelte/ActionBar/ActionBarGroup.svelte";
  import ActionBarItem from "carbon-components-svelte/ActionBar/ActionBarItem.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import Undo from "carbon-icons-svelte/lib/Undo.svelte";

  export let orientation: "horizontal" | "vertical" = "horizontal";
  export let preserveFocus = false;
  let clicks: string[] = [];
  let align = "left";
  export let field = false;
  let overflow = 0;
  let exits = 0;

  let bold = false;
  const log = (name: string) => () => {
    clicks = [...clicks, name];
  };
</script>

<button type="button">Before</button>
<ActionBar
  labelText="Formatting"
  {orientation}
  {preserveFocus}
  on:overflow:change={(event) => (overflow = event.detail.count)}
  on:exit={() => (exits += 1)}
>
  <ActionBarButton
    labelText="Undo"
    icon={Undo}
    disabled
    on:click={log("undo")}
  />
  <ActionBarButton
    labelText="Bold"
    icon={Add}
    pressed={bold}
    shortcut="alt+b"
    on:click={() => {
      bold = !bold;
      clicks = [...clicks, "bold"];
    }}
  />
  <ActionBarDivider />
  <ActionBarGroup labelText="Alignment" selection="single" bind:value={align}>
    <ActionBarButton labelText="Left" icon={Copy} value="left" />
    <ActionBarButton labelText="Center" icon={Copy} value="center" />
    <ActionBarButton labelText="Right" icon={Copy} value="right" />
  </ActionBarGroup>
  <ActionBarDivider />
  {#if field}
    <ActionBarItem>
      <TextInput size="sm" labelText="Find" hideLabel value="abc" />
    </ActionBarItem>
  {/if}
  <ActionBarButton
    labelText="Delete"
    icon={TrashCan}
    priority={2}
    on:click={log("delete")}
  />
  <ActionBarButton
    labelText="Save"
    icon={Save}
    iconOnly={false}
    pinned
    on:click={log("save")}
  />
</ActionBar>
<button type="button">After</button>
<output data-testid="clicks">{clicks.join(",")}</output>
<output data-testid="overflow">{overflow}</output>
<output data-testid="exits">{exits}</output>
<output data-testid="align">{align}</output>
