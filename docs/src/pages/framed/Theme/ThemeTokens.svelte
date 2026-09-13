<script>
  import {
    Button,
    Checkbox,
    InlineNotification,
    Link,
    Stack,
    Tag,
    TextInput,
    Theme,
    Tile,
    Toggle,
  } from "carbon-components-svelte";
</script>

<Theme
  theme="g90"
  tokens={{
    // Interactive elements
    "interactive-01": "#d02670", // Primary button background
    "hover-primary": "#ee5396", // Primary button hover
    "active-primary": "#9f1853", // Primary button active
    "interactive-02": "#6f6f6f", // Secondary button background
    "hover-secondary": "#5e5e5e", // Secondary button hover

    // Links
    "link-01": "#ff6eb3", // Link text color

    // Tags
    "tag-background-blue": "#4a1942", // Tag background
    "tag-color-blue": "#ffb3d9", // Tag text color

    // Form elements
    "field-01": "#2d2d2d", // Input field background
    "ui-01": "#2d2d2d", // Tile background
    focus: "#ff6eb3", // Focus indicator color

    // Text colors
    "text-01": "#ffffff", // Primary text
    "text-02": "#c6c6c6", // Secondary text

    // Notification colors
    "support-04": "#a855f7", // Info notification color
  }}
/>

<Stack gap={5}>
  <div>
    <Button>Save changes</Button>
    <Button kind="secondary">Cancel</Button>
  </div>

  <div>
    <Link href="#example">View audit log</Link>
  </div>

  <div><Tag type="blue">Production</Tag></div>

  <TextInput labelText="Workspace name" placeholder="Enter workspace name..." />

  <Checkbox labelText="Enable two-factor authentication" />

  <Toggle labelText="Maintenance mode" />

  <Tile> <p>Deployment pipeline — 2 builds queued</p> </Tile>

  <InlineNotification
    kind="info"
    title="Sync complete:"
    subtitle="Your workspace data is up to date."
    hideCloseButton
    lowContrast
  />
</Stack>
