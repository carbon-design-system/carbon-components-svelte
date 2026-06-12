<script lang="ts">
  import {
    Accordion,
    AccordionItem,
    Box,
    Breadcrumb,
    BreadcrumbItem,
    Column,
    Row,
    Stack,
    Tab,
    TabContent,
    Tabs,
    Tag,
    Text,
    TreeView,
  } from "carbon-components-svelte";

  const treeNodes = [
    {
      id: "workloads",
      text: "Workloads",
      nodes: [
        { id: "deployments", text: "Deployments" },
        { id: "pods", text: "Pods" },
        { id: "jobs", text: "Jobs" },
      ],
    },
    {
      id: "networking",
      text: "Networking",
      nodes: [
        { id: "ingress", text: "Ingress" },
        { id: "services", text: "Services" },
      ],
    },
    { id: "storage", text: "Storage" },
  ];
</script>

<Box fill="layer-01" padding={7}>
  <Stack gap={6}>
    <Breadcrumb noTrailingSlash>
      <BreadcrumbItem href="/">Catalog</BreadcrumbItem>
      <BreadcrumbItem href="/">Compute</BreadcrumbItem>
      <BreadcrumbItem isCurrentPage href="/">checkout-cluster</BreadcrumbItem>
    </Breadcrumb>
    <Tabs>
      <Tab label="Overview" />
      <Tab label="Resources" />
      <Tab label="Activity" />
      <svelte:fragment slot="content">
        <TabContent>
          <Stack gap={5}>
            <Stack orientation="horizontal" gap={3} wrap="wrap">
              <Tag type="green" style="margin: 0">Healthy</Tag>
              <Tag type="blue" style="margin: 0">Kubernetes 1.29</Tag>
              <Tag type="cool-gray" style="margin: 0">us-south</Tag>
            </Stack>
            <Text type="body-long-01" color="secondary" maxWidth="60ch">
              A managed cluster for deploying and scaling containerized
              workloads with built-in observability. 48 pods across 4 nodes,
              99.98% uptime over the last 30 days.
            </Text>
          </Stack>
        </TabContent>
        <TabContent>
          <Row>
            <Column sm={4} md={4} lg={6}>
              <TreeView
                size="compact"
                labelText="Resources"
                nodes={treeNodes}
                expandedIds={["workloads"]}
                activeId="deployments"
                selectedIds={["deployments"]}
              />
            </Column>
            <Column sm={4} md={4} lg={8}>
              <Accordion>
                <AccordionItem open title="Deployments">
                  <Text type="body-long-01" color="secondary">
                    12 deployments, 3 updated in the last hour.
                  </Text>
                </AccordionItem>
                <AccordionItem title="Pods">
                  <Text type="body-long-01" color="secondary">
                    48 pods running across 4 nodes.
                  </Text>
                </AccordionItem>
                <AccordionItem title="Jobs">
                  <Text type="body-long-01" color="secondary">
                    2 scheduled jobs, next run in 14 minutes.
                  </Text>
                </AccordionItem>
              </Accordion>
            </Column>
          </Row>
        </TabContent>
        <TabContent>
          <Stack gap={4}>
            <Stack orientation="horizontal" gap={4} align="baseline">
              <Text tag="span" type="code-01" color="secondary" family="mono">
                14:03
              </Text>
              <Text type="body-short-01" color="primary">
                Deploy of checkout-api completed
              </Text>
            </Stack>
            <Stack orientation="horizontal" gap={4} align="baseline">
              <Text tag="span" type="code-01" color="secondary" family="mono">
                13:41
              </Text>
              <Text type="body-short-01" color="primary">
                Autoscaler added 2 nodes
              </Text>
            </Stack>
            <Stack orientation="horizontal" gap={4} align="baseline">
              <Text tag="span" type="code-01" color="secondary" family="mono">
                11:09
              </Text>
              <Text type="body-short-01" color="primary">
                Certificate renewed for api.checkout.io
              </Text>
            </Stack>
          </Stack>
        </TabContent>
      </svelte:fragment>
    </Tabs>
  </Stack>
</Box>
