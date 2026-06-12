<script lang="ts">
  import {
    Box,
    Column,
    InlineNotification,
    ProgressBar,
    ProgressIndicator,
    ProgressStep,
    Row,
    Stack,
    Tag,
    Text,
  } from "carbon-components-svelte";

  const pipelineActivity = [
    { time: "14:02:31", text: "Image pushed to registry", tone: "secondary" },
    { time: "14:02:48", text: "Staging deploy started", tone: "secondary" },
    { time: "14:03:12", text: "3 of 4 regions updated", tone: "primary" },
  ];
</script>

<Box fill="layer-01" padding={7}>
  <Stack gap={7}>
    <Stack
      orientation="horizontal"
      justify="space-between"
      align="center"
      gap={4}
      wrap="wrap"
    >
      <Stack gap={1}>
        <Text tag="h3" type="productive-heading-03" color="primary">
          Deploy · checkout-api
        </Text>
        <Text type="body-short-01" color="secondary">
          main · commit 4f2a9c1 · triggered by ada
        </Text>
      </Stack>
      <Tag type="blue" style="margin: 0">In progress</Tag>
    </Stack>

    <div class="steps-scroll">
      <ProgressIndicator currentIndex={2}>
        <ProgressStep complete label="Build" description="2m 14s" />
        <ProgressStep complete label="Test" description="1m 02s · 318 passed" />
        <ProgressStep
          current
          label="Stage"
          description="Rolling out to staging"
        />
        <ProgressStep label="Production" description="Awaiting approval" />
      </ProgressIndicator>
    </div>

    <Stack gap={3}>
      <Text type="label-01" color="secondary">Staging rollout</Text>
      <ProgressBar
        value={75}
        max={100}
        size="sm"
        labelText="3 of 4 regions updated"
        hideLabel
        helperText="75%"
      />
    </Stack>

    <Row>
      <Column sm={4} md={4} lg={8}>
        <InlineNotification
          lowContrast
          kind="success"
          title="Tests passed:"
          subtitle="318 of 318 checks green."
          hideCloseButton
        />
      </Column>
      <Column sm={4} md={4} lg={8}>
        <InlineNotification
          lowContrast
          kind="warning"
          title="Heads up:"
          subtitle="Production deploy needs a reviewer's approval."
          hideCloseButton
        />
      </Column>
    </Row>

    <Stack gap={3}>
      {#each pipelineActivity as item (item.time)}
        <Stack orientation="horizontal" gap={4} align="baseline">
          <Text tag="span" type="code-01" color="secondary" family="mono">
            {item.time}
          </Text>
          <Text type="body-short-01" color={item.tone}>
            {item.text}
          </Text>
        </Stack>
      {/each}
    </Stack>
  </Stack>
</Box>

<style>
  .steps-scroll {
    overflow-x: auto;
  }
</style>
