<script>
  import {
    Button,
    HoverCard,
    Link,
    Stack,
    Tag,
    UserAvatar,
  } from "carbon-components-svelte";

  let following = false;
</script>

<p>
  Deployment approved by
  <HoverCard align="start" aria-label="Profile of Priya Raman">
    <Link slot="trigger" href="#priya">@priya</Link>
    <Stack orientation="horizontal" gap={5}>
      <UserAvatar name="Priya Raman" size="lg" />
      <Stack gap={2}>
        <strong>Priya Raman</strong>
        <span>Platform engineering, Bengaluru</span>
      </Stack>
    </Stack>
    <Tag type="green">On call this week</Tag>
    <Stack orientation="horizontal" gap={3}>
      <Button size="sm" on:click={() => (following = !following)}>
        {following ? "Following" : "Follow"}
      </Button>
      <Button size="sm" kind="tertiary">Send message</Button>
    </Stack>
  </HoverCard>
  on the production cluster.
</p>
