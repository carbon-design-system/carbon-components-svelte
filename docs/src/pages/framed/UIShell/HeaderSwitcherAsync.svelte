<script>
  import {
    Button,
    Column,
    Content,
    Grid,
    Header,
    HeaderSwitcher,
    Row,
    SkipToContent,
  } from "carbon-components-svelte";

  const accounts = [
    { id: "acme", text: "Acme Corp", description: "Engineering" },
    { id: "globex", text: "Globex Industries", description: "Sales" },
    { id: "initech", text: "Initech", description: "Platform" },
  ];

  /** @type {typeof accounts} */
  let items = [];
  /** @type {"idle" | "loading" | "success" | "error"} */
  let status = "idle";
  let selectedId = "acme";
  let failNext = true;

  $: active = items.find((item) => item.id === selectedId);

  // Stand-in for a request: the first one fails, so the error row shows.
  function load() {
    status = "loading";
    setTimeout(() => {
      if (failNext) {
        failNext = false;
        status = "error";
      } else {
        items = accounts;
        status = "success";
      }
    }, 1200);
  }

  function reset() {
    items = [];
    status = "idle";
    failNext = true;
  }
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderSwitcher
    text={active?.text ?? "Choose an account"}
    {items}
    {status}
    searchThreshold={0}
    bind:selectedId
    on:open={() => {
      if (status === "idle") load();
    }}
    on:retry={load}
  />
</Header>

<Content>
  <Grid>
    <Row>
      <Column>
        <p>
          The accounts load when the menu first opens. The first request fails.
        </p>
        <Button kind="tertiary" size="small" on:click={reset}>Start over</Button
        >
      </Column>
    </Row>
  </Grid>
</Content>
