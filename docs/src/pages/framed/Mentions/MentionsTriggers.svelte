<script>
  import { Mentions, TextArea } from "carbon-components-svelte";

  let ref = null;
  let value = "";

  const people = [
    { id: "u-1042", text: "Priya Raman", secondary: "@praman" },
    { id: "u-2290", text: "Marcus Oyelaran", secondary: "@moyelaran" },
    { id: "u-3118", text: "Hannah Lindqvist", secondary: "@hlindqvist" },
  ];

  const tickets = [
    {
      id: "OPS-482",
      text: "OPS-482",
      secondary: "Rotate the database credentials",
    },
    {
      id: "OPS-517",
      text: "OPS-517",
      secondary: "Alert on certificate expiry",
    },
    {
      id: "OPS-533",
      text: "OPS-533",
      secondary: "Move builds to the new runners",
    },
  ];

  const emoji = [
    { id: "tada", text: "tada", insertText: "🎉" },
    { id: "rocket", text: "rocket", insertText: "🚀" },
    { id: "eyes", text: "eyes", insertText: "👀" },
    { id: "thumbsup", text: "+1", insertText: "👍" },
  ];

  const commands = [
    { id: "assign", text: "assign", secondary: "Assign to a teammate" },
    { id: "close", text: "close", secondary: "Close the incident" },
    {
      id: "escalate",
      text: "escalate",
      secondary: "Page the on-call engineer",
    },
  ];
</script>

<TextArea
  bind:ref
  bind:value
  labelText="Incident update"
  helperText="Type @, #, : or / at the start of a line"
  rows={5}
/>
<Mentions
  field={ref}
  triggers={[
    { char: "@", items: people, label: "Teammates" },
    { char: "#", items: tickets, label: "Tickets" },
    {
      char: ":",
      items: emoji,
      format: "plain",
      minQueryLength: 2,
      label: "Emoji",
    },
    {
      char: "/",
      items: commands,
      format: "plain",
      position: "line-start",
      suffix: "",
      label: "Commands",
    },
  ]}
/>
