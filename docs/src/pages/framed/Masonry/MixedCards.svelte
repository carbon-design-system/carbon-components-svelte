<script>
  import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardTitle,
    ClickableTile,
    Masonry,
    Stack,
    Tag,
    Text,
    Tile,
  } from "carbon-components-svelte";
</script>

<Masonry columnWidth="16rem">
  <Card>
    <CardHeader>
      <CardTitle>Quarterly report</CardTitle>
    </CardHeader>
    <CardBody>
      Usage grew 12% over the last quarter, led by object storage. Egress cost
      stayed flat after the cache rollout.
    </CardBody>
    <CardFooter>
      <Button kind="ghost" size="sm">View report</Button>
    </CardFooter>
  </Card>
  <ClickableTile href="#runbooks">
    <Text type="heading-compact-01">Runbooks</Text>
  </ClickableTile>
  <Tile>
    <Stack gap={3}>
      <Tag type="green">Healthy</Tag>
      <Text type="heading-compact-01">us-south-2</Text>
      <Text type="body-compact-01">
        All 14 services report healthy. Last incident closed 9 days ago.
      </Text>
    </Stack>
  </Tile>
  <Card>
    <CardHeader>
      <CardTitle>Access requests</CardTitle>
    </CardHeader>
    <CardBody>3 pending review.</CardBody>
  </Card>
  <ClickableTile href="#billing">
    <Stack gap={3}>
      <Text type="heading-compact-01">Billing</Text>
      <Text type="body-compact-01">
        Invoices, payment methods and spending limits for the account.
      </Text>
    </Stack>
  </ClickableTile>
  <Tile>
    <Text type="body-compact-01">Maintenance window: Saturday, 02:00 UTC.</Text>
  </Tile>
</Masonry>
