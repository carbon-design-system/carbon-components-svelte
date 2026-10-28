<script>
  import {
    ActionBar,
    ActionBarButton,
    ActionBarDivider,
    ActionBarGroup,
  } from "carbon-components-svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Redo from "carbon-icons-svelte/lib/Redo.svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import TextAlignCenter from "carbon-icons-svelte/lib/TextAlignCenter.svelte";
  import TextAlignLeft from "carbon-icons-svelte/lib/TextAlignLeft.svelte";
  import TextAlignRight from "carbon-icons-svelte/lib/TextAlignRight.svelte";
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextItalic from "carbon-icons-svelte/lib/TextItalic.svelte";
  import TextUnderline from "carbon-icons-svelte/lib/TextUnderline.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import Undo from "carbon-icons-svelte/lib/Undo.svelte";

  let bold = false;
  let italic = false;
  let align = "left";
  let clicks = [];
  let overflowCount = 0;
  let exits = 0;

  /** @param {string} name */
  function log(name) {
    clicks = [...clicks, name];
  }
</script>

<div id="basic" style="width: 640px">
  <ActionBar
    labelText="Formatting"
    on:overflow:change={(event) => (overflowCount = event.detail.count)}
    on:exit={() => (exits += 1)}
  >
    <ActionBarGroup labelText="History">
      <ActionBarButton
        labelText="Undo"
        icon={Undo}
        shortcut="mod+z"
        on:click={() => log("undo")}
      />
      <ActionBarButton
        labelText="Redo"
        icon={Redo}
        shortcut="mod+shift+z"
        disabled
        on:click={() => log("redo")}
      />
    </ActionBarGroup>
    <ActionBarDivider />
    <ActionBarGroup labelText="Text style">
      <ActionBarButton
        labelText="Bold"
        icon={TextBold}
        shortcut="mod+b"
        pressed={bold}
        on:click={() => {
          bold = !bold;
          log("bold");
        }}
      />
      <ActionBarButton
        labelText="Italic"
        icon={TextItalic}
        shortcut="mod+i"
        pressed={italic}
        on:click={() => {
          italic = !italic;
          log("italic");
        }}
      />
      <ActionBarButton
        labelText="Underline"
        icon={TextUnderline}
        priority={-1}
        pressed={false}
        on:click={() => log("underline")}
      />
    </ActionBarGroup>
    <ActionBarDivider />
    <ActionBarGroup labelText="Alignment" selection="single" bind:value={align}>
      <ActionBarButton
        labelText="Align left"
        icon={TextAlignLeft}
        value="left"
      />
      <ActionBarButton
        labelText="Align center"
        icon={TextAlignCenter}
        value="center"
      />
      <ActionBarButton
        labelText="Align right"
        icon={TextAlignRight}
        value="right"
      />
    </ActionBarGroup>
    <ActionBarDivider />
    <ActionBarButton
      labelText="Copy"
      icon={Copy}
      on:click={() => log("copy")}
    />
    <ActionBarButton
      labelText="Delete"
      icon={TrashCan}
      kind="danger-ghost"
      on:click={() => log("delete")}
    />
    <ActionBarButton
      labelText="Save"
      icon={Save}
      iconOnly={false}
      pinned
      on:click={() => log("save")}
    />
  </ActionBar>
</div>

<p data-testid="clicks">{clicks.join(",")}</p>
<p data-testid="overflow-count">{overflowCount}</p>
<p data-testid="exits">{exits}</p>
<p data-testid="align">{align}</p>
<p data-testid="bold">{bold}</p>

<!-- Safari tabs to a button only with an explicit tabindex. -->
<button type="button" id="after" tabindex="0">After</button>
