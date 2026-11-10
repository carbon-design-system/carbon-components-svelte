<script lang="ts">
  import { Box, Link, Stack } from "carbon-components-svelte";
  import ArrowUpRight from "carbon-icons-svelte/lib/ArrowUpRight.svelte";
  import { route } from "../current-route";
  import { editPageUrl, openIssuesUrl, reportIssueUrl } from "../page-links";

  /** The page's name in a new issue's title. */
  export let name: string;
  /** Show the open issues for a component. */
  export let component = false;

  $: file = $route?.file ?? "";
  $: pageUrl = `https://svelte.carbondesignsystem.com${$route?.path ?? ""}`;
</script>

{#if file}
  <Box
    tag="nav"
    aria-label="Contribute to this page"
    marginTop={10}
    paddingTop={6}
    border="subtle"
    borderSide="top"
  >
    <Stack orientation="horizontal" gap={6} wrap="wrap">
      <Link
        icon={ArrowUpRight}
        href={editPageUrl(__PKG_REPO, file)}
        target="_blank"
      >
        Edit this page
      </Link>
      <Link
        icon={ArrowUpRight}
        href={reportIssueUrl(__PKG_REPO, name, pageUrl)}
        target="_blank"
      >
        Report an issue
      </Link>
      {#if component}
        <Link
          icon={ArrowUpRight}
          href={openIssuesUrl(__PKG_REPO, name)}
          target="_blank"
        >
          Open issues
        </Link>
      {/if}
    </Stack>
  </Box>
{/if}
