<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderAction,
    HeaderPanelDivider,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderUtilities,
    Row,
    SkipToContent,
  } from "carbon-components-svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let theme = "white";
  let trigger = "none";
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderUtilities>
    <HeaderAction
      icon={Settings}
      iconDescription="Settings"
      on:close={(event) => (trigger = event.detail.trigger)}
    >
      <HeaderPanelLinks>
        <HeaderPanelDivider>Resources</HeaderPanelDivider>
        <HeaderPanelLink
          href="https://cloud.ibm.com/docs"
          target="_blank"
          text="Documentation"
          icon={Launch}
        />
        <HeaderPanelLink
          href="https://cloud.ibm.com/status"
          target="_blank"
          text="Service status and incident history"
          icon={Launch}
        />
        <HeaderPanelDivider>Preferences</HeaderPanelDivider>
        <HeaderPanelLink
          isSelected={theme === "white"}
          text="Light theme"
          on:click={() => (theme = "white")}
        />
        <HeaderPanelLink
          isSelected={theme === "g100"}
          text="Dark theme"
          on:click={() => (theme = "g100")}
        />
      </HeaderPanelLinks>
    </HeaderAction>
  </HeaderUtilities>
</Header>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>Panel items</h1>
        <p>
          Open the settings panel in the top right. The resource links open in a
          new tab; the theme options are buttons.
        </p>
        <p>Theme: {theme}</p>
        <p>Last close trigger: {trigger}</p>
      </Column>
    </Row>
  </Grid>
</Content>
