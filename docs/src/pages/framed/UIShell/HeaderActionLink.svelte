<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderActionLink,
    HeaderGlobalAction,
    HeaderUtilities,
    Row,
    SkipToContent,
  } from "carbon-components-svelte";
  import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderUtilities>
    <HeaderActionLink
      href="https://github.com/carbon-design-system/carbon-components-svelte"
      target="_blank"
      icon={LogoGithub}
      aria-label="GitHub repository"
    />
    <HeaderGlobalAction iconDescription="Notifications" icon={Notification} />
  </HeaderUtilities>
</Header>

<Content>
  <Grid>
    <Row>
      <Column> <h1>Dashboard</h1> </Column>
    </Row>
  </Grid>
</Content>
