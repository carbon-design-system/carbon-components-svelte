<script>
  import {
    Button,
    Column,
    FilePreview,
    Grid,
    Row,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListRow,
  } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";

  const attachments = [
    {
      id: "inc-2291-log",
      file: new File(
        [
          "2026-11-07T10:15:02Z WARN  checkout  retry 1 of 3 upstream=payments-eu\n2026-11-07T10:15:04Z WARN  checkout  retry 2 of 3 upstream=payments-eu\n2026-11-07T10:15:09Z ERROR checkout  upstream=payments-eu status=503\n",
        ],
        "checkout-2026-11-07.log",
        { type: "text/plain" },
      ),
    },
    {
      id: "inc-2291-latency",
      file: new File(
        [
          "region,p50_ms,p99_ms\nus-east-1,41,180\neu-west-1,52,2210\nap-south-1,63,240\n",
        ],
        "latency-by-region.csv",
        { type: "text/csv" },
      ),
    },
    {
      id: "inc-2291-config",
      file: new File(
        [
          '{"retries":3,"timeoutMs":2000,"upstreams":["payments-eu","payments-us"]}',
        ],
        "checkout-config.json",
        { type: "application/json" },
      ),
    },
    {
      id: "inc-2291-dump",
      file: new File(["PK"], "heap-dump.zip", { type: "application/zip" }),
    },
  ];

  let selectedId = attachments[0].id;
  $: selected = attachments.find((attachment) => attachment.id === selectedId);
</script>

<Grid>
  <Row>
    <Column sm={4} md={3} lg={4}>
      <StructuredList>
        <StructuredListBody>
          {#each attachments as attachment (attachment.id)}
            <StructuredListRow>
              <StructuredListCell>
                <Button
                  kind="ghost"
                  size="sm"
                  aria-pressed={attachment.id === selectedId ? "true" : "false"}
                  on:click={() => (selectedId = attachment.id)}
                >
                  {attachment.file.name}
                </Button>
              </StructuredListCell>
            </StructuredListRow>
          {/each}
        </StructuredListBody>
      </StructuredList>
    </Column>
    <Column sm={4} md={5} lg={12}>
      {#key selectedId}
        <FilePreview file={selected.file} highlight={tokenize} />
      {/key}
    </Column>
  </Row>
</Grid>
