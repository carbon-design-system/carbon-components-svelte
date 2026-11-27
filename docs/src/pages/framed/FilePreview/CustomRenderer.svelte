<script>
  import { FilePreview, Stack } from "carbon-components-svelte";

  // A renderer is a component that takes `file` and `options`, and says
  // `ready` when it is showing the file. `load` keeps it out of the bundle
  // until a matching file is previewed.
  const renderers = [
    {
      id: "calendar",
      match: (mime, name) => name.endsWith(".ics") || mime === "text/calendar",
      load: () => import("./IcsRenderer.svelte"),
      maxBytes: 256 * 1024,
    },
  ];

  const invite = new File(
    [
      "BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Capacity review\nDTSTART:20261112T150000Z\nLOCATION:Room 4B\nEND:VEVENT\nEND:VCALENDAR\n",
    ],
    "capacity-review.ics",
    { type: "text/calendar" },
  );
</script>

<Stack gap={6}>
  <FilePreview file={invite} {renderers} />
</Stack>
