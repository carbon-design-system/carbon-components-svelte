<script lang="ts">
  import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
</script>

<UserAvatar data-testid="default" />

<UserAvatar data-testid="initials-single" name="Eric" />

<UserAvatar data-testid="initials-multi" name="John Doe" />

<UserAvatar data-testid="initials-override" name="John Doe" initials="XY" />

<UserAvatar
  data-testid="image"
  name="Should Not Show"
  image="https://example.com/photo.jpg"
  imageDescription="A user photo"
/>

<UserAvatar
  data-testid="image-attributes"
  data-avatar-host="true"
  name="Should Not Show"
  image="https://example.com/photo.jpg"
  imageDescription="A user photo"
  imageAttributes={{
    loading: "lazy",
    srcset: "https://example.com/photo.jpg 1x",
    referrerPolicy: "no-referrer",
  }}
/>

<UserAvatar data-testid="icon" name="Should Not Show" icon={Add} />

<UserAvatar data-testid="size-lg" size="lg" name="John Doe" />

<UserAvatar data-testid="color-blue" backgroundColor="blue" name="John Doe" />

<UserAvatar
  data-testid="color-cool-gray"
  backgroundColor="cool-gray"
  name="John Doe"
/>

<UserAvatar data-testid="color-auto" backgroundColor="auto" name="John Doe" />

<UserAvatar data-testid="color-auto-2" backgroundColor="auto" name="John Doe" />

<UserAvatar data-testid="tooltip" name="Jane Roe" tooltipText="Jane Roe" />

<UserAvatar
  data-testid="tooltip-inline"
  name="Jane Roe"
  tooltipText="Jane Roe"
  portalTooltip={false}
/>

<UserAvatar
  data-testid="events"
  name="John Doe"
  on:click={() => console.log("click")}
  on:mouseenter={() => console.log("mouseenter")}
/>

<UserAvatar data-testid="slot" name="John Doe">
  <span>custom content</span>
</UserAvatar>

<UserAvatar data-testid="custom-class" class="my-class" name="John Doe" />

<UserAvatar
  data-testid="tooltip-overflow-marker"
  data-avatar-group-overflow="true"
  name="Jane Roe"
  tooltipText="Jane Roe"
/>

<UserAvatar data-testid="interactive" interactive name="John Doe" />

<UserAvatar data-testid="href" href="/profile" name="John Doe" />

<UserAvatar
  data-testid="href-over-interactive"
  href="/profile"
  interactive
  name="John Doe"
/>

<UserAvatar data-testid="status-online" name="Jane Roe" status="online" />

<UserAvatar data-testid="status-away" name="Jane Roe" status="away" />

<UserAvatar data-testid="status-busy" name="Jane Roe" status="busy" />

<UserAvatar data-testid="status-offline" name="Jane Roe" status="offline" />

<UserAvatar data-testid="badge-slot" name="Jane Roe" status="online">
  <span slot="badge" data-testid="custom-badge">99</span>
</UserAvatar>
