<script>
  import {
    ContentSwitcher,
    FileUploaderButton,
    Modal,
    PasswordInput,
    Switch,
    Tab,
    Tabs,
    ToggleButton,
    ToggleButtonGroup,
  } from "carbon-components-svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Grid from "carbon-icons-svelte/lib/Grid.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextItalic from "carbon-icons-svelte/lib/TextItalic.svelte";
  import Upload from "carbon-icons-svelte/lib/Upload.svelte";

  let open = true;
</script>

<Modal bind:open passiveModal modalHeading="Workspace settings">
  <ContentSwitcher>
    <Switch text="Grid view" icon={Grid} />
    <Switch text="List view" icon={List} />
  </ContentSwitcher>
  <Tabs iconOnly>
    <Tab label="Dashboard" icon={Dashboard} />
    <Tab label="Settings" icon={Settings} />
  </Tabs>
  <ToggleButtonGroup>
    <ToggleButton value="bold" icon={TextBold} iconDescription="Bold" />
    <ToggleButton value="italic" icon={TextItalic} iconDescription="Italic" />
  </ToggleButtonGroup>
  <PasswordInput labelText="API key" />
  <FileUploaderButton
    labelText=""
    icon={Upload}
    iconDescription="Upload files"
  />
</Modal>
