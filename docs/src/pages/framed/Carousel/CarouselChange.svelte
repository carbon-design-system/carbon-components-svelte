<script>
  import {
    Carousel,
    CarouselItem,
    Stack,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
  } from "carbon-components-svelte";

  const plans = [
    {
      name: "Lite",
      price: "$0",
      detail: "1 project, 100 build minutes per month, community support.",
    },
    {
      name: "Team",
      price: "$29 per seat",
      detail:
        "Unlimited projects, 3,000 build minutes, preview environments, email support.",
    },
    {
      name: "Enterprise",
      price: "Contact sales",
      detail: "SSO, audit logs, dedicated runners, and a 99.99% uptime SLA.",
    },
  ];

  let events = [];

  function track(e) {
    const { currentIndex, previousIndex, totalViews } = e.detail;
    events = [
      {
        time: new Date().toLocaleTimeString(),
        from: plans[previousIndex].name,
        to: plans[currentIndex].name,
        position: `${currentIndex + 1} of ${totalViews}`,
      },
      ...events,
    ].slice(0, 4);
  }
</script>

<Stack gap={7}>
  <Carousel labelText="Plans" on:change={track}>
    {#each plans as plan}
      <CarouselItem label={plan.name}>
        <Stack gap={3}>
          <h4>{plan.name}</h4>
          <p><strong>{plan.price}</strong></p>
          <p>{plan.detail}</p>
        </Stack>
      </CarouselItem>
    {/each}
  </Carousel>

  <StructuredList condensed>
    <StructuredListHead>
      <StructuredListRow head>
        <StructuredListCell head>Time</StructuredListCell>
        <StructuredListCell head>From</StructuredListCell>
        <StructuredListCell head>To</StructuredListCell>
        <StructuredListCell head>Position</StructuredListCell>
      </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
      {#each events as event}
        <StructuredListRow>
          <StructuredListCell>{event.time}</StructuredListCell>
          <StructuredListCell>{event.from}</StructuredListCell>
          <StructuredListCell>{event.to}</StructuredListCell>
          <StructuredListCell>{event.position}</StructuredListCell>
        </StructuredListRow>
      {:else}
        <StructuredListRow>
          <StructuredListCell
            >Navigate the carousel to log change events.</StructuredListCell
          >
        </StructuredListRow>
      {/each}
    </StructuredListBody>
  </StructuredList>
</Stack>
