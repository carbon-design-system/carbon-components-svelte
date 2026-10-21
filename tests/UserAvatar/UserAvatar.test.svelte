<script lang="ts">
  import UserAvatar from "carbon-components-svelte/UserAvatar/UserAvatar.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  export let onClick = () => {};
  export let onMouseenter = () => {};
  export let onFocus = () => {};
  export let onBlur = () => {};
  export let onKeydown = () => {};
</script>

<UserAvatar data-testid="default" />

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

<UserAvatar
  data-testid="image-name-alt"
  name="Ann One"
  image="https://example.com/photo.jpg"
/>

<UserAvatar
  data-testid="image-attributes-alt"
  name="Ann One"
  image="https://example.com/photo.jpg"
  imageAttributes={{ alt: "Ann at the summit" }}
/>

<UserAvatar
  data-testid="image-decorative"
  image="https://example.com/photo.jpg"
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
  on:click={onClick}
  on:mouseenter={onMouseenter}
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

<UserAvatar
  data-testid="interactive"
  interactive
  name="John Doe"
  on:focus={onFocus}
  on:blur={onBlur}
  on:keydown={onKeydown}
/>

<UserAvatar data-testid="href" href="/profile" name="John Doe" />

<UserAvatar
  data-testid="href-over-interactive"
  href="/profile"
  interactive
  name="John Doe"
/>

<UserAvatar
  data-testid="tooltip-interactive"
  interactive
  name="John Doe"
  tooltipText="John Doe"
/>

<UserAvatar
  data-testid="tooltip-href"
  href="/profile"
  name="John Doe"
  tooltipText="John Doe"
/>

<UserAvatar
  data-testid="aria-label-override"
  interactive
  name="John Doe"
  aria-label="Open profile"
/>
