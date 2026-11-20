<script lang="ts">
  import { Button, Timeline, TimelineItem } from "carbon-components-svelte";
  import Edit from "carbon-components-svelte/icons/Edit.svelte";

  // A fixed clock and zone keep the days and relative times the same on
  // every machine: Friday 6 November 2026, 15:00 UTC.
  const now = Date.UTC(2026, 10, 6, 15, 0);
  const at = (days: number, hour: number, minute = 0) =>
    Date.UTC(2026, 10, 6 - days, hour, minute);

  const params = new URLSearchParams(window.location.search);
  const count = Number(params.get("count") ?? 0);
  const only = params.get("only");
  const show = (name: string) => !only || only === name;

  const order = [
    {
      id: "ordered",
      time: at(2, 9, 12),
      title: "Ordered",
      status: "success" as const,
    },
    {
      id: "packed",
      time: at(1, 16, 40),
      title: "Packed",
      description: "Packed at the Reno warehouse.",
      status: "success" as const,
    },
    {
      id: "shipped",
      time: at(1, 21, 5),
      title: "Shipped",
      description: "Handed to the carrier. Tracking 1Z 999 AA1 01 2345 6784.",
      status: "success" as const,
    },
    {
      id: "out",
      time: at(0, 14, 30),
      title: "Out for delivery",
      description: "The driver is 4 stops away.",
      status: "pending" as const,
    },
    {
      id: "delivered",
      title: "Delivered",
      description: "Expected today by 8 PM.",
    },
  ];

  const deploys = [
    {
      id: "d1",
      time: at(0, 14, 20),
      title: "Deployed v2.4.1 to production",
      description: "Triggered by Ada Okafor.",
      status: "success" as const,
    },
    {
      id: "d2",
      time: at(0, 11, 5),
      title: "Deploy v2.4.0 failed",
      description: "Health check timed out after 120 s.",
      status: "error" as const,
    },
    {
      id: "d3",
      time: at(0, 11, 2),
      title: "Rolled back to v2.3.9",
      status: "warning" as const,
    },
    {
      id: "d4",
      time: at(1, 17, 45),
      title: "Deployed v2.3.9 to staging",
      status: "info" as const,
    },
    {
      id: "d5",
      time: at(1, 9, 30),
      title: "Comment from Grace Lee",
      description: "Looks good to me.",
      icon: Edit,
    },
    {
      id: "d6",
      time: at(30, 10, 0),
      title: "Deployed v2.3.0",
      status: "success" as const,
    },
    {
      id: "d7",
      time: at(400, 10, 0),
      title: "Deployed v1.0.0",
      status: "success" as const,
    },
  ];

  const changelog = [
    {
      id: "c1",
      time: at(0, 8),
      title: "Added dark mode",
      description: "Follows the system setting.",
    },
    { id: "c2", time: at(1, 8), title: "Fixed the export dialog" },
    { id: "c3", time: at(3, 8), title: "Faster search" },
    { id: "c4", time: at(8, 8), title: "New keyboard shortcuts" },
    { id: "c5", time: at(15, 8), title: "Improved onboarding" },
    { id: "c6", time: at(40, 8), title: "Initial release" },
  ];

  let expanded = false;

  // `?live` leaves the clock to the page, so the relative times tick.
  const live = params.has("live");
  const bigNow = live ? undefined : now;
  const big = Array.from({ length: count }, (_, index) => ({
    id: index,
    time: (live ? Date.now() : now) - index * 90_000,
    title: `Event ${index + 1}`,
    description:
      index % 3 === 0 ? "A longer line of detail for this event." : "",
    status: (["success", "info", "warning", "error"] as const)[index % 4],
  }));
</script>

<div style="padding: 1rem; max-width: 56rem">
  {#if count > 0}
    <div data-testid="big">
      <Timeline
        aria-label="Large history"
        items={big}
        order="desc"
        groupBy={params.get("group") === "none" ? "none" : "day"}
        limit={Number(params.get("limit") ?? Infinity)}
        now={bigNow}
        locale="en-US"
        timeZone="UTC"
      />
    </div>
  {/if}

  {#if count === 0}
    {#if show("order")}
      <h2>Order tracking</h2>
      <div data-testid="order" style="max-width: 24rem">
        <Timeline
          aria-label="Order 1042"
          items={order}
          {now}
          locale="en-US"
          timeZone="UTC"
        />
      </div>
    {/if}

    {#if show("deploys")}
      <h2>Deploy history</h2>
      <div data-testid="deploys" style="max-width: 28rem">
        <Timeline
          aria-label="Deploys"
          items={deploys}
          order="desc"
          groupBy="day"
          {now}
          locale="en-US"
          timeZone="UTC"
        >
          <svelte:fragment slot="content" let:item>
            {#if item.id === "d2"}
              <Button size="sm" kind="tertiary">View log</Button>
            {/if}
          </svelte:fragment>
        </Timeline>
      </div>
    {/if}

    {#if show("changelog")}
      <h2>Changelog</h2>
      <div data-testid="changelog" style="max-width: 24rem">
        <Timeline
          aria-label="Changelog"
          items={changelog}
          order="desc"
          groupBy="day"
          size="sm"
          limit={3}
          bind:expanded
          {now}
          locale="en-US"
          timeZone="UTC"
        />
      </div>
    {/if}

    {#if show("dense")}
      <h2>Dense</h2>
      <div data-testid="dense" style="max-width: 24rem">
        <Timeline
          aria-label="Order 1042, dense"
          items={order}
          size="sm"
          {now}
          locale="en-US"
          timeZone="UTC"
        />
      </div>
    {/if}

    {#if show("alternate")}
      <h2>Alternate</h2>
      <div data-testid="alternate">
        <Timeline
          aria-label="Case history"
          items={order}
          layout="alternate"
          {now}
          locale="en-US"
          timeZone="UTC"
        />
      </div>
    {/if}

    {#if show("composed")}
      <h2>Composed</h2>
      <div data-testid="composed" style="max-width: 24rem">
        <Timeline aria-label="Composed">
          <TimelineItem
            title="Account created"
            time={at(2, 10)}
            timeZone="UTC"
            locale="en-US"
            {now}
          />
          <TimelineItem title="Waiting for review" status="pending">
            <Button size="sm" kind="ghost">Nudge</Button>
          </TimelineItem>
        </Timeline>
      </div>
    {/if}
  {/if}
</div>
