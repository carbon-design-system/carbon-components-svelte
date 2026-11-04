<script lang="ts">
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";
  import ShellBanner from "carbon-components-svelte/UIShell/ShellBanner.svelte";
  import type { ComponentProps } from "svelte";

  export let kind: ComponentProps<ShellBanner>["kind"] = "info";
  export let title: ComponentProps<ShellBanner>["title"] = "Staging";
  export let subtitle: ComponentProps<ShellBanner>["subtitle"] = "";
  export let placement: ComponentProps<ShellBanner>["placement"] = "content";
  export let thin: ComponentProps<ShellBanner>["thin"] = false;
  export let dismissible: ComponentProps<ShellBanner>["dismissible"] = false;
  export let dismissId: ComponentProps<ShellBanner>["dismissId"] = undefined;
  export let announce: ComponentProps<ShellBanner>["announce"] = false;
  export let open = true;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<button type="button">Before</button>
<ShellBanner
  {kind}
  {title}
  {subtitle}
  {placement}
  {thin}
  {dismissible}
  {dismissId}
  {announce}
  bind:open
  data-testid="banner"
  on:close={(event) => onclose?.(event)}
>
  <svelte:fragment slot="actions">
    <NotificationActionButton>Exit</NotificationActionButton>
  </svelte:fragment>
  <p data-testid="extra">Extra</p>
</ShellBanner>
<span data-testid="open">{open}</span>
