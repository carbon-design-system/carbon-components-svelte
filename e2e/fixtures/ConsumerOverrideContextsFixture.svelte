<script>
  import {
    Modal,
    SideNav,
    SideNavItems,
    SideNavLink,
    TextInput,
  } from "carbon-components-svelte";
</script>

<!--
  Components that overlay the page (a modal, a fixed side nav), kept apart
  from ConsumerOverrideFixture so they cannot intercept its pointer tests.
-->
<SideNav ariaLabel="Side navigation" fixed isOpen>
  <SideNavItems>
    <SideNavLink
      class="my-side-link"
      data-testid="side-link"
      href="#one"
      text="One"
    />
  </SideNavItems>
</SideNav>

<Modal open passiveModal modalHeading="Modal">
  <TextInput class="my-input" data-testid="modal-input" labelText="Name" />
</Modal>
