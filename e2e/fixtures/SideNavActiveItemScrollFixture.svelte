<script>
  import {
    Content,
    Header,
    SideNav,
    SideNavItems,
    SideNavLink,
    SkipToContent,
  } from "carbon-components-svelte";

  const params = new URLSearchParams(window.location.search);
  const activeItemScrollBlock = params.get("block") ?? "nearest";
  const activeItem = `Item ${params.get("active") ?? 35}`;
  const items = Array.from({ length: 40 }, (_, i) => `Item ${i + 1}`);
</script>

<Header companyName="E2E" platformName="SideNav">
  <div slot="skipToContent"><SkipToContent href="#main-content" /></div>
</Header>
<SideNav isOpen fixed {activeItemScrollBlock} ariaLabel="Side navigation">
  <SideNavItems>
    {#each items as text}
      <SideNavLink href="#" {text} isSelected={text === activeItem} />
    {/each}
  </SideNavItems>
</SideNav>
<Content id="main-content">
  <button type="button">In content</button>
</Content>
