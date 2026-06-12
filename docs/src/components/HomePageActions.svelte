<script lang="ts">
  import { Button, Stack } from "carbon-components-svelte";
  import ArrowRight from "carbon-icons-svelte/lib/ArrowRight.svelte";
  import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
</script>

<Stack orientation="horizontal" gap={4} align="center" wrap="wrap">
  <Button icon={ArrowRight} href="/quick-start">Get started</Button>
  <Button
    kind="tertiary"
    icon={LogoGithub}
    href="https://github.com/carbon-design-system/carbon-components-svelte"
    target="_blank"
  >
    View on GitHub
  </Button>
</Stack>
