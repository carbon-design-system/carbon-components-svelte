<script>
  import { Timeline } from "carbon-components-svelte";

  const now = Date.UTC(2026, 10, 6, 15, 0);
  const at = (days, hour, minute = 0) =>
    Date.UTC(2026, 10, 6 - days, hour, minute);

  // The step in progress has `status: "pending"`. The last step has no time
  // yet, so it stays at the end.
  const steps = [
    {
      id: "ordered",
      time: at(2, 9, 12),
      titleText: "Ordered",
      status: "success",
    },
    {
      id: "packed",
      time: at(1, 16, 40),
      titleText: "Packed",
      descriptionText: "Packed at the Reno warehouse.",
      status: "success",
    },
    {
      id: "shipped",
      time: at(1, 21, 5),
      titleText: "Shipped",
      descriptionText:
        "Handed to the carrier. Tracking 1Z 999 AA1 01 2345 6784.",
      status: "success",
    },
    {
      id: "out",
      time: at(0, 14, 30),
      titleText: "Out for delivery",
      descriptionText: "The driver is 4 stops away.",
      status: "pending",
    },
    {
      id: "delivered",
      titleText: "Delivered",
      descriptionText: "Expected today by 8 PM.",
    },
  ];
</script>

<Timeline aria-label="Order 1042" items={steps} {now} timeZone="UTC" />
