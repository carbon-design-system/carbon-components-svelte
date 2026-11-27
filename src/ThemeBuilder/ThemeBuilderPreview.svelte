<script>
  /**
   * The default preview of `ThemeBuilder`: real components inside a
   * `ThemeZone` that carries the theme's custom properties. Internal to
   * `ThemeBuilder`.
   */

  /**
   * @type {import("../Theme/Theme.svelte").CarbonTheme}
   */
  export let theme;

  /**
   * Specify an id. The ids of the components inside derive from it.
   * @type {string}
   */
  export let id;

  /** The theme's custom properties as inline `style` text. */
  export let style = "";

  import Button from "../Button/Button.svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import DataTable from "../DataTable/DataTable.svelte";
  import Dropdown from "../Dropdown/Dropdown.svelte";
  import Layer from "../Layer/Layer.svelte";
  import Link from "../Link/Link.svelte";
  import InlineNotification from "../Notification/InlineNotification.svelte";
  import Tab from "../Tabs/Tab.svelte";
  import TabContent from "../Tabs/TabContent.svelte";
  import Tabs from "../Tabs/Tabs.svelte";
  import Tag from "../Tag/Tag.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import ThemeZone from "../ThemeZone/ThemeZone.svelte";
  import Toggle from "../Toggle/Toggle.svelte";

  /** @type {import("../DataTable/DataTable.svelte").DataTableHeader[]} */
  const headers = [
    { key: "name", value: "Name" },
    { key: "status", value: "Status" },
    { key: "port", value: "Port" },
  ];

  const rows = [
    { id: "a", name: "Load balancer", status: "Active", port: 80 },
    { id: "b", name: "Database", status: "Pending", port: 5432 },
    { id: "c", name: "Cache", status: "Disabled", port: 6379 },
  ];

  const items = [
    { id: "one", text: "Option one" },
    { id: "two", text: "Option two" },
  ];
</script>

<ThemeZone {theme} {style} class="bx--theme-builder__zone">
  <div class="bx--theme-builder__gallery">
    <section aria-label="Buttons">
      <div class="bx--theme-builder__row">
        <Button size="sm">Primary</Button>
        <Button size="sm" kind="secondary">Secondary</Button>
        <Button size="sm" kind="tertiary">Tertiary</Button>
        <Button size="sm" kind="ghost">Ghost</Button>
        <Button size="sm" kind="danger">Danger</Button>
      </div>
    </section>

    <section aria-label="Text">
      <p>
        Body text with a <Link
          href="#preview"
          on:click={(e) => e.preventDefault()}>link</Link
        >.
      </p>
      <div class="bx--theme-builder__row">
        <Tag id="{id}-tag-red" type="red">Red</Tag>
        <Tag id="{id}-tag-blue" type="blue">Blue</Tag>
        <Tag id="{id}-tag-green" type="green">Green</Tag>
        <Tag id="{id}-tag-gray" type="gray">Gray</Tag>
      </div>
    </section>

    <section aria-label="Form">
      <div class="bx--theme-builder__form">
        <TextInput
          id="{id}-name"
          labelText="Name"
          helperText="Helper text"
          placeholder="Placeholder"
        />
        <Dropdown
          id="{id}-region"
          labelText="Region"
          label="Choose"
          selectedId="one"
          {items}
        />
        <Toggle id="{id}-toggle" labelText="Notifications" toggled size="sm" />
        <Checkbox id="{id}-checkbox" labelText="Checkbox" checked />
      </div>
    </section>

    <section aria-label="Notifications">
      <InlineNotification
        lowContrast
        id="{id}-info"
        kind="info"
        title="Info"
        subtitle="A message."
        hideCloseButton
      />
      <InlineNotification
        lowContrast
        id="{id}-error"
        kind="error"
        title="Error"
        subtitle="Something failed."
        hideCloseButton
      />
    </section>

    <section aria-label="Tabs">
      <Tabs aria-label="Preview tabs">
        <Tab id="{id}-tab-overview" label="Overview" />
        <Tab id="{id}-tab-activity" label="Activity" />
        <svelte:fragment slot="content">
          <TabContent id="{id}-panel-overview">Overview content</TabContent>
          <TabContent id="{id}-panel-activity">Activity content</TabContent>
        </svelte:fragment>
      </Tabs>
    </section>

    <section aria-label="Data table">
      <DataTable id="{id}-table" size="short" {headers} {rows} />
    </section>

    <section aria-label="Nested zone">
      <!-- A zone sets every token from its theme's class, so it drops the
           overrides of the zone around it. Pass the same style to keep them. -->
      <ThemeZone {theme} {style} class="bx--theme-builder__nested">
        <Layer>
          <p>Nested ThemeZone with the style passed down</p>
        </Layer>
      </ThemeZone>
    </section>
  </div>
</ThemeZone>
