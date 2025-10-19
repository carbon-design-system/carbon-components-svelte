<script>
  import {
    Theme,
    Button,
    Link,
    Tag,
    TextInput,
    Checkbox,
    Toggle,
    Tile,
    InlineNotification,
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

<div style="display: flex; flex-direction: column; gap: 1rem;">
  <div>
    <Button>Primary button</Button>
    <Button kind="secondary">Secondary button</Button>
  </div>

  <div>
    <Link href="#example">Themed link</Link>
  </div>

  <div>
    <Tag type="blue">Themed tag</Tag>
  </div>

  <TextInput labelText="Text input" placeholder="Enter text..." />

  <Checkbox labelText="Checkbox with themed focus" />

  <Toggle labelText="Toggle with themed colors" />

  <Tile>
    <p>Tile with themed background</p>
  </Tile>

  <InlineNotification
    kind="info"
    title="Info notification"
    subtitle="With themed colors"
    hideCloseButton
    lowContrast
  />
</div>
