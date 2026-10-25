<script>
  import {
    Layer,
    ThemeZone,
    UserAvatar,
    UserAvatarGroup,
  } from "carbon-components-svelte";
</script>

<div data-testid="overlap">
  <UserAvatarGroup max={3}>
    <UserAvatar backgroundColor="auto" name="Monica" tooltipText="Monica" />
    <UserAvatar
      backgroundColor="auto"
      name="Richard Hendricks"
      tooltipText="Richard Hendricks"
    />
    <UserAvatar
      backgroundColor="auto"
      name="Dinesh Chugtai"
      tooltipText="Dinesh Chugtai"
    />
    <UserAvatar
      backgroundColor="auto"
      name="Bertram Gilfoyle"
      tooltipText="Bertram Gilfoyle"
    />
    <UserAvatar
      backgroundColor="auto"
      name="Jared Dunn"
      tooltipText="Jared Dunn"
    />
  </UserAvatarGroup>
</div>

<div data-testid="spaced">
  <UserAvatarGroup gap={3} max={0}>
    <UserAvatar backgroundColor="auto" name="Monica" />
    <UserAvatar backgroundColor="auto" name="Richard Hendricks" />
  </UserAvatarGroup>
</div>

<div data-testid="cascade">
  <UserAvatarGroup size="lg" max={0}>
    <UserAvatar backgroundColor="auto" name="Monica" tooltipText="Monica" />
    <UserAvatar
      backgroundColor="auto"
      name="Richard Hendricks"
      size="sm"
      tooltipText="Richard Hendricks"
    />
  </UserAvatarGroup>
</div>

<div data-testid="coord">
  <UserAvatarGroup gap={5} max={0}>
    <UserAvatar backgroundColor="auto" name="Alpha" tooltipText="Alpha" />
    <UserAvatar backgroundColor="auto" name="Beta" tooltipText="Beta" />
  </UserAvatarGroup>
</div>

<div data-testid="tighter">
  <UserAvatarGroup gap="-1rem" max={0}>
    <UserAvatar backgroundColor="auto" name="Monica" />
    <UserAvatar backgroundColor="auto" name="Richard Hendricks" />
  </UserAvatarGroup>
</div>

<div data-testid="big">
  <UserAvatarGroup max={1}>
    {#each Array.from({ length: 101 }) as _, index (index)}
      <UserAvatar backgroundColor="auto" name={`User ${index}`} />
    {/each}
  </UserAvatarGroup>
</div>

<div data-testid="stack-first">
  <UserAvatarGroup stackOrder="first" max={2}>
    <UserAvatar backgroundColor="auto" name="Monica" tooltipText="Monica" />
    <UserAvatar
      backgroundColor="auto"
      name="Richard Hendricks"
      tooltipText="Richard Hendricks"
    />
    <UserAvatar
      backgroundColor="auto"
      name="Dinesh Chugtai"
      tooltipText="Dinesh Chugtai"
    />
  </UserAvatarGroup>
</div>

<div data-testid="sizes">
  <UserAvatar size="sm" name="Monica Hall" />
  <UserAvatar size="md" name="Monica Hall" />
  <UserAvatar size="lg" name="Monica Hall" />
  <UserAvatar size="xl" name="Monica Hall" />
</div>

<div data-testid="white">
  <UserAvatar backgroundColor="red" name="Monica Hall" />
  <UserAvatar backgroundColor="cyan" shade="strong" name="Monica Hall" />
</div>

<ThemeZone theme="g100" data-testid="g100">
  <UserAvatar backgroundColor="red" name="Monica Hall" />
  <UserAvatar backgroundColor="cyan" shade="strong" name="Monica Hall" />
</ThemeZone>

<Layer withBackground data-testid="layer">
  <UserAvatarGroup max={0}>
    <UserAvatar backgroundColor="auto" name="Monica" />
    <UserAvatar backgroundColor="auto" name="Richard Hendricks" />
  </UserAvatarGroup>
</Layer>

<div dir="rtl" data-testid="rtl">
  <UserAvatarGroup max={0}>
    <UserAvatar backgroundColor="auto" name="Monica" />
    <UserAvatar backgroundColor="auto" name="Richard Hendricks" />
  </UserAvatarGroup>
</div>
