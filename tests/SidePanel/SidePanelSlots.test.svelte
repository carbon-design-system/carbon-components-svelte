<script lang="ts">
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Section from "carbon-components-svelte/Heading/Section.svelte";
  import SidePanel from "carbon-components-svelte/SidePanel/SidePanel.svelte";

  export let open = true;
  export let size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" = "md";
  export let includeOverlay = false;
  export let preventCloseOnClickOutside: boolean | undefined = undefined;
</script>

<Section level={3}>
  <SidePanel
    bind:open
    title="Edit deployment"
    subtitle="Changes apply on the next deploy."
    {size}
    {includeOverlay}
    {preventCloseOnClickOutside}
    {...$$restProps}
  >
    Body
    <Button slot="toolbar" kind="ghost" size="small">Copy settings</Button>
    <AILabel slot="decorator" />
    <svelte:fragment slot="actions">
      <Button kind="secondary">Cancel</Button>
      <Button>Save</Button>
    </svelte:fragment>
  </SidePanel>
</Section>
