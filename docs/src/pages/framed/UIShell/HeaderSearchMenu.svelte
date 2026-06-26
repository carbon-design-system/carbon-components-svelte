<script>
  import {
    Content,
    FormGroup,
    Header,
    HeaderSearch,
    HeaderUtilities,
    RadioButton,
    RadioButtonGroup,
    SearchMenuGroup,
    SearchMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";

  const docs = [
    { id: "accordion", text: "Accordion", href: "/components/Accordion" },
    { id: "button", text: "Button", href: "/components/Button" },
    { id: "data-table", text: "DataTable", href: "/components/DataTable" },
    { id: "dropdown", text: "Dropdown", href: "/components/Dropdown" },
    { id: "search-menu", text: "SearchMenu", href: "/components/SearchMenu" },
    { id: "header-search", text: "HeaderSearch", href: "/components/UIShell" },
  ];

  let value = "";
  let active = false;
  let size = "sm";
  let events = [];
</script>

<Header companyName="Carbon" platformName="Svelte">
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderUtilities>
    <HeaderSearch
      bind:value
      bind:active
      {size}
      placeholder="Search..."
      on:select={(e) => (events = [{ type: "select", ...e.detail }, ...events])}
      on:submit={(e) => (events = [{ type: "submit", ...e.detail }, ...events])}
      on:close={(e) => (events = [{ type: "close", ...e.detail }, ...events])}
    >
      <svelte:fragment slot="menu">
        <SearchMenuGroup label="Docs">
          {#each docs as doc (doc.id)}
            <SearchMenuItem text={doc.text} href={doc.href} icon={Document} />
          {/each}
        </SearchMenuGroup>

        <SearchMenuGroup divider>
          <SearchMenuItem
            persistent
            iconRight={Launch}
            href="https://www.google.com/search?q={encodeURIComponent(value)}"
          >
            Search "{value}" in <strong>Docs</strong>
          </SearchMenuItem>
        </SearchMenuGroup>
      </svelte:fragment>

      <svelte:fragment slot="noResults">No matching components</svelte:fragment>
    </HeaderSearch>
  </HeaderUtilities>
</Header>

<Content>
  <h1>HeaderSearch (menu slot)</h1>
  <p>
    Open search and type a component name (e.g. "data"). Results fuzzy-match and
    highlight, grouped under a header, with a persistent footer action.
  </p>

  <FormGroup legendText="Menu size">
    <RadioButtonGroup bind:selected={size}>
      <RadioButton value="sm" labelText="Small" />
      <RadioButton value="lg" labelText="Large" />
      <RadioButton value="xl" labelText="Extra large" />
    </RadioButtonGroup>
  </FormGroup>

  <pre>{JSON.stringify(events.slice(0, 5), null, 2)}</pre>
</Content>
