<script>
  import { Button, Popconfirm, Tag } from "carbon-components-svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  let log = [];
  /** @param {string} entry */
  const note = (entry) => (log = [...log, entry]);

  let open = false;
  let attempts = 0;
  let tags = ["alpha", "beta", "gamma"];

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const succeed = async () => {
    await wait(150);
    note("deleted");
  };
  const flaky = async () => {
    attempts += 1;
    await wait(150);
    if (attempts === 1) throw new Error("Server said no");
    note("deleted after retry");
  };
</script>

<div style="padding: 4rem 2rem; display: grid; gap: 3rem; justify-items: start">
  <Popconfirm
    data-testid="basic"
    title="Delete this row?"
    description="You can't undo this."
    confirmText="Delete"
    on:confirm={() => note("confirm")}
    on:cancel={({ detail }) => note(`cancel:${detail.trigger}`)}
    on:open={() => note("open")}
    on:close={() => note("close")}
  >
    <Button
      data-testid="basic-trigger"
      kind="danger-ghost"
      size="small"
      iconDescription="Delete row"
      icon={TrashCan}
      iconOnly
    />
  </Popconfirm>

  <Popconfirm
    title="Discard this draft?"
    confirmText="Discard"
    cancelText="Keep editing"
    kind="warning"
    data-testid="warning"
  >
    <Button data-testid="warning-trigger" kind="tertiary" size="small">
      Discard draft
    </Button>
  </Popconfirm>

  <Popconfirm
    title="Make this public?"
    kind="info"
    confirmText="Publish"
    data-testid="info"
  >
    <Button data-testid="info-trigger" size="small">Publish</Button>
  </Popconfirm>

  <Popconfirm
    title="Delete the project?"
    confirmText="Delete"
    confirm={succeed}
    data-testid="async-ok"
  >
    <Button data-testid="async-ok-trigger" kind="danger" size="small">
      Delete (async)
    </Button>
  </Popconfirm>

  <Popconfirm
    title="Delete the project?"
    confirmText="Delete"
    confirm={flaky}
    errorText={(error) => `Couldn't delete: ${error.message}`}
    on:confirm:error={() => note("error")}
    data-testid="async-fail"
  >
    <Button data-testid="async-fail-trigger" kind="danger" size="small">
      Delete (fails once)
    </Button>
  </Popconfirm>

  <div style="display: flex; gap: 0.5rem">
    {#each tags as tag (tag)}
      <Popconfirm
        title="Remove {tag}?"
        confirmText="Remove"
        direction="top"
        on:confirm={() => (tags = tags.filter((t) => t !== tag))}
      >
        <Tag data-testid="tag-{tag}" type="blue">{tag}</Tag>
      </Popconfirm>
    {/each}
  </div>

  <Popconfirm
    bind:open
    title="Controlled"
    confirmText="OK"
    data-testid="controlled"
  >
    <Button data-testid="controlled-trigger" size="small">Controlled</Button>
  </Popconfirm>
  <Button
    data-testid="controlled-open"
    size="small"
    on:click={() => (open = true)}
  >
    Open from outside
  </Button>
  <Button
    data-testid="outside"
    size="small"
    on:click={() => note("outside-clicked")}
  >
    Outside
  </Button>

  <pre data-testid="log">{JSON.stringify(log)}</pre>
</div>
