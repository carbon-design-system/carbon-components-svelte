<script>
  import * as Carbon from "carbon-components-svelte";
  import Add16 from "carbon-icons-svelte/lib/Add16";

  let skeleton = false;
  let accordionItemOpen = false;
</script>

<style>
  :global(.tile-card) {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 12rem;
  }

  .title {
    font-size: 0.75rem;
  }

  .tile-card__preview {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 0;
  }

  .tile-card__actions {
    display: none;
  }

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
      <Carbon.Tile class="tile-card">
        <div class="title">Accordion</div>
        <div class="tile-card__preview">
          <Carbon.Accordion count={3} {skeleton} open={accordionItemOpen}>
            <Carbon.AccordionItem title="Title 1" bind:open={accordionItemOpen}>
              Content 1
            </Carbon.AccordionItem>
            <Carbon.AccordionItem title="Title 2">
              Content 2
            </Carbon.AccordionItem>
            <Carbon.AccordionItem title="Title 3">
              Content 3
            </Carbon.AccordionItem>
          </Carbon.Accordion>
        </div>
        <div class="tile-card__actions">Actions</div>
      </Carbon.Tile>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <Carbon.Tile class="tile-card">
        <div class="title">Breadcrumb</div>
        <div class="tile-card__preview">
          <Carbon.Breadcrumb {skeleton}>
            <Carbon.BreadcrumbItem href="/">Breadcrumb 1</Carbon.BreadcrumbItem>
            <Carbon.BreadcrumbItem href="/">Breadcrumb 2</Carbon.BreadcrumbItem>
            <Carbon.BreadcrumbItem href="/">Breadcrumb 3</Carbon.BreadcrumbItem>
          </Carbon.Breadcrumb>
        </div>
        <div class="tile-card__actions">Actions</div>
      </Carbon.Tile>
    </Carbon.Column>
  </Carbon.Row>

  <Carbon.Row class="scope">
    <Carbon.Column noGutter>
      <Carbon.Tile class="tile-card">
        <div class="title">Primary button</div>
        <div class="tile-card__preview">
          <Carbon.Button {skeleton}>Primary</Carbon.Button>
        </div>
        <div class="tile-card__actions">Actions</div>
      </Carbon.Tile>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <Carbon.Tile class="tile-card">
        <div class="title">Secondary button</div>
        <div class="tile-card__preview">
          <Carbon.Button kind="secondary" {skeleton}>Secondary</Carbon.Button>
        </div>
        <div class="tile-card__actions">Actions</div>
      </Carbon.Tile>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <Carbon.Tile class="tile-card">
        <div class="title">Tertiary button</div>
        <div class="tile-card__preview">
          <Carbon.Button kind="tertiary" {skeleton}>Tertiary</Carbon.Button>
        </div>
        <div class="tile-card__actions">Actions</div>
      </Carbon.Tile>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <Carbon.Tile class="tile-card">
        <div class="title">Ghost button</div>
        <div class="tile-card__preview">
          <Carbon.Button kind="ghost" {skeleton}>Ghost</Carbon.Button>
        </div>
        <div class="tile-card__actions">Actions</div>
      </Carbon.Tile>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <Carbon.Tile class="tile-card">
        <div class="title">Danger button</div>
        <div class="tile-card__preview">
          <Carbon.Button kind="danger" {skeleton}>Danger</Carbon.Button>
        </div>
        <div class="tile-card__actions">Actions</div>
      </Carbon.Tile>
    </Carbon.Column>
  </Carbon.Row>

  <Carbon.Row class="scope">
    <Carbon.Column noGutter>
      <Carbon.Tile class="tile-card">
        <div class="title">Primary button with icon</div>
        <div class="tile-card__preview">
          <Carbon.Button icon={Add16} {skeleton}>With icon</Carbon.Button>
        </div>
        <div class="tile-card__actions">Actions</div>
      </Carbon.Tile>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <Carbon.Tile class="tile-card">
        <div class="title">Icon-only buttons</div>
        <div class="tile-card__preview">
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
        </div>
        <div class="tile-card__actions">Actions</div>
      </Carbon.Tile>
    </Carbon.Column>
  </Carbon.Row>

  <Carbon.Row class="scope">
    <Carbon.Column noGutter>
      <Carbon.Tile class="tile-card">
        <div class="title">Checkbox</div>
        <div class="tile-card__preview">
          <fieldset class="bx--fieldset">
            <legend class="bx--label">Checkbox heading</legend>
            <Carbon.Checkbox {skeleton} labelText="Checkbox label" />
            <Carbon.Checkbox {skeleton} labelText="Checkbox label" />
            <Carbon.Checkbox {skeleton} labelText="Checkbox label" />
          </fieldset>
        </div>
        <div class="tile-card__actions">Actions</div>
      </Carbon.Tile>
    </Carbon.Column>
    <Carbon.Column noGutter>
      <Carbon.Tile class="tile-card">
        <div class="title">Code Snippet</div>
        <div class="tile-card__preview">
          <Carbon.CodeSnippet type="single" light {skeleton}>
            {`body { margin: 0; padding: 0; }`}
          </Carbon.CodeSnippet>
        </div>
        <div class="tile-card__actions">Actions</div>
      </Carbon.Tile>
    </Carbon.Column>
  </Carbon.Row>
</div>
