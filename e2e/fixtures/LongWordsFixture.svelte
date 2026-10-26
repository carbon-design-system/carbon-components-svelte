<script>
  import {
    Accordion,
    AccordionItem,
    Button,
    Checkbox,
    Dropdown,
    InlineNotification,
    Link,
    MultiSelect,
    RadioButton,
    TextInput,
    Tile,
    ToastNotification,
    Toggle,
  } from "carbon-components-svelte";

  const word = "Datenschutzgrundverordnungskonformitätsprüfung";
  const url = "https://api.example.com/v2/organizations/8f14e45fceea167a";
  const regions = [
    { id: "us", text: "US East" },
    { id: "eu", text: "EU West" },
    { id: "ap", text: "Asia Pacific" },
  ];
</script>

<div data-testid="column" style="width: 12rem">
  <TextInput labelText={word} helperText={url} />
  <Checkbox labelText={word} />
  <RadioButton labelText={url} value="a" />
  <Toggle labelText={word} />
  <Accordion><AccordionItem title={word}>Body</AccordionItem></Accordion>
  <Tile>{url}</Tile>
  <p><Link href="/">{url}</Link></p>
  <Button>{word}</Button>
</div>

<!-- Notifications keep an 18rem minimum width. -->
<div data-testid="wide" style="width: 20rem">
  <InlineNotification kind="info" title={word} subtitle={url} hideCloseButton />
  <ToastNotification
    kind="info"
    title={word}
    subtitle={url}
    caption={url}
    hideCloseButton
    timeout={0}
  />
</div>

<!-- Inline controls in a row that shrinks: the filter beside each gives
     way, so each label keeps its words whole and the row stays inside its
     box. -->
<div style="display: grid; gap: 1rem">
  {#each [{ id: "dropdown", label: "Region" }, { id: "multiselect", label: "Regions" }] as { id, label }}
    <div data-testid="rows-{id}" style="display: flex; gap: 1rem; width: 22rem">
      {#if id === "dropdown"}
        <Dropdown
          type="inline"
          labelText={label}
          items={regions}
          selectedId="us"
        />
      {:else}
        <MultiSelect
          type="inline"
          labelText={label}
          placeholder="Choose regions"
          items={regions}
          selectedIds={["us", "eu"]}
        />
      {/if}
      <div style="flex: 1 1 14rem; min-width: 0">
        <TextInput labelText="Filter" hideLabel placeholder="Filter" />
      </div>
    </div>
  {/each}
  <div data-testid="rows-words" style="width: 12rem">
    <Dropdown
      type="inline"
      labelText="A label with several words in it"
      items={regions}
      selectedId="us"
    />
  </div>
</div>
