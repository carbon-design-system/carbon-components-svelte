<script>
  import * as Carbon from "carbon-components-svelte";
  import Add16 from "carbon-icons-svelte/lib/Add16";
  import TileCard from "./TileCard.svelte";

  let skeleton = false;
  let accordionItemOpen = false;
</script>

<style>
  :global(.component-grid) {
    margin-top: 1.5rem;
  }

  :global(.component-grid .scope:first-of-type) {
    border-top: 1px solid var(--cds-ui-03);
  }

  :global(.scope) {
    border-left: 1px solid var(--cds-ui-03);
  }

  :global(.scope > .bx--col) {
    border-bottom: 1px solid var(--cds-ui-03);
    border-right: 1px solid var(--cds-ui-03);
  }
</style>

<Carbon.Row>
  <Carbon.Column>
    <Carbon.ToggleSmall bind:toggled={skeleton} labelText="Skeleton state" />
  </Carbon.Column>
</Carbon.Row>

<div class="component-grid">

  <Carbon.Row class="scope">
    <Carbon.Column noGutter>
      <TileCard title="Accordion">
        <Carbon.Accordion count={3} {skeleton} open={accordionItemOpen}>
          <Carbon.AccordionItem title="Title 1" bind:open={accordionItemOpen}>
            Content 1
          </Carbon.AccordionItem>
          <Carbon.AccordionItem title="Title 2">Content 2</Carbon.AccordionItem>
          <Carbon.AccordionItem title="Title 3">Content 3</Carbon.AccordionItem>
        </Carbon.Accordion>
      </TileCard>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <TileCard title="Breadcrumb">
        <Carbon.Breadcrumb {skeleton}>
          <Carbon.BreadcrumbItem href="/">Breadcrumb 1</Carbon.BreadcrumbItem>
          <Carbon.BreadcrumbItem href="/">Breadcrumb 2</Carbon.BreadcrumbItem>
          <Carbon.BreadcrumbItem href="/">Breadcrumb 3</Carbon.BreadcrumbItem>
        </Carbon.Breadcrumb>
      </TileCard>
    </Carbon.Column>
  </Carbon.Row>

  <Carbon.Row class="scope">
    <Carbon.Column noGutter>
      <TileCard title="Primary button">
        <Carbon.Button {skeleton}>Primary</Carbon.Button>
      </TileCard>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <TileCard title="Secondary button">
        <Carbon.Button kind="secondary" {skeleton}>Secondary</Carbon.Button>
      </TileCard>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <TileCard title="Tertiary button">
        <Carbon.Button kind="tertiary" {skeleton}>Tertiary</Carbon.Button>
      </TileCard>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <TileCard title="Ghost button">
        <Carbon.Button kind="ghost" {skeleton}>Ghost</Carbon.Button>
      </TileCard>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <TileCard title="Danger button">
        <Carbon.Button kind="danger" {skeleton}>Danger</Carbon.Button>
      </TileCard>
    </Carbon.Column>
  </Carbon.Row>

  <Carbon.Row class="scope">
    <Carbon.Column noGutter>
      <TileCard title="Primary button with icon">
        <Carbon.Button icon={Add16} {skeleton}>With icon</Carbon.Button>
      </TileCard>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <TileCard title="Icon-only buttons">
        <Carbon.Button
          icon={Add16}
          hasIconOnly
          iconDescription="Primary"
          tooltipPosition="bottom"
          tooltipAlignment="center"
          {skeleton} />
        <Carbon.Button
          icon={Add16}
          hasIconOnly
          kind="secondary"
          iconDescription="Secondary"
          tooltipPosition="bottom"
          tooltipAlignment="center"
          {skeleton} />
        <Carbon.Button
          icon={Add16}
          hasIconOnly
          kind="tertiary"
          iconDescription="Tertiary"
          tooltipPosition="bottom"
          tooltipAlignment="center"
          {skeleton} />
        <Carbon.Button
          icon={Add16}
          hasIconOnly
          kind="ghost"
          iconDescription="Ghost"
          tooltipPosition="bottom"
          tooltipAlignment="center"
          {skeleton} />
        <Carbon.Button
          icon={Add16}
          hasIconOnly
          kind="danger"
          iconDescription="Danger"
          tooltipPosition="bottom"
          tooltipAlignment="center"
          {skeleton} />
      </TileCard>
    </Carbon.Column>
  </Carbon.Row>

  <Carbon.Row class="scope">
    <Carbon.Column noGutter>
      <TileCard title="Checkbox">
        <fieldset class="bx--fieldset">
          <legend class="bx--label">Checkbox heading</legend>
          <Carbon.Checkbox {skeleton} labelText="Checkbox label" />
          <Carbon.Checkbox {skeleton} labelText="Checkbox label" />
          <Carbon.Checkbox {skeleton} labelText="Checkbox label" />
        </fieldset>
      </TileCard>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <TileCard title="Indeterminate Checkboox">
        <fieldset class="bx--fieldset">
          <legend class="bx--label">Checkbox heading</legend>
          <Carbon.Checkbox
            indeterminate
            {skeleton}
            labelText="Checkbox label" />
          <Carbon.Checkbox
            indeterminate
            {skeleton}
            labelText="Checkbox label" />
        </fieldset>
      </TileCard>
    </Carbon.Column>
  </Carbon.Row>

  <Carbon.Row class="scope">
    <Carbon.Column noGutter>
      <TileCard title="Inline Code Snippet">
        <Carbon.CodeSnippet type="inline" light {skeleton}>
          {`node -v`}
        </Carbon.CodeSnippet>
      </TileCard>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <TileCard title="Single-line Code Snippet">
        <Carbon.CodeSnippet type="single" light {skeleton}>
          {`tsc -c tsconfig.json`}
        </Carbon.CodeSnippet>
      </TileCard>
    </Carbon.Column>
    <Carbon.Column lg={8} noGutter>
      <TileCard title="Multi-line Code Snippet">
        <Carbon.CodeSnippet type="multi" light {skeleton}>
          {`* {
margin: 0;
padding: 0;
box-sizing: border-box;
}

body {
font-family: "IBM Plex Sans";
lin-height: 1.45;
}

h1 {
font-size: 1rem;
color: #171717; 
}

a {
color: currentColor;
text-decoration: underline;
}`}
        </Carbon.CodeSnippet>
      </TileCard>
    </Carbon.Column>
  </Carbon.Row>
</div>
