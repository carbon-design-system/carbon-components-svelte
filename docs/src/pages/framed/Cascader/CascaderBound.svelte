<script>
  import { Cascader } from "carbon-components-svelte";

  const nodes = [
    {
      id: "europe",
      text: "Europe",
      nodes: [
        {
          id: "france",
          text: "France",
          nodes: [
            { id: "paris", text: "Paris" },
            { id: "lyon", text: "Lyon" },
          ],
        },
        {
          id: "germany",
          text: "Germany",
          nodes: [
            { id: "berlin", text: "Berlin" },
            { id: "munich", text: "Munich" },
          ],
        },
      ],
    },
    {
      id: "asia",
      text: "Asia",
      nodes: [
        {
          id: "japan",
          text: "Japan",
          nodes: [
            { id: "tokyo", text: "Tokyo" },
            { id: "osaka", text: "Osaka" },
          ],
        },
      ],
    },
  ];

  let value = ["europe", "germany", "munich"];
  let change;
</script>

<Cascader
  labelText="Location"
  label="Choose a city"
  {nodes}
  bind:value
  clearable
  levelLabels={["Region", "Country", "City"]}
  on:change={(event) => (change = event.detail)}
/>
<p>Value: {JSON.stringify(value)}</p>
<p>Text: {change?.text ?? "unchanged"}</p>
<button type="button" on:click={() => (value = ["asia", "japan", "tokyo"])}>
  Set Tokyo
</button>
