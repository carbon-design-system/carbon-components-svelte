import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";

/**
 * The 16-node "Cloud Products" tree (ids 0-15) shared by the TreeView
 * fixtures. A factory, so each fixture gets its own mutable copy.
 */
export function cloudProducts(): TreeNode[] {
  return [
    { id: 0, text: "AI / Machine learning" },
    {
      id: 1,
      text: "Analytics",
      nodes: [
        {
          id: 2,
          text: "IBM Analytics Engine",
          nodes: [
            { id: 3, text: "Apache Spark" },
            { id: 4, text: "Hadoop" },
          ],
        },
        { id: 5, text: "IBM Cloud SQL Query" },
        { id: 6, text: "IBM Db2 Warehouse on Cloud" },
      ],
    },
    {
      id: 7,
      text: "Blockchain",
      nodes: [{ id: 8, text: "IBM Blockchain Platform" }],
    },
    {
      id: 9,
      text: "Databases",
      nodes: [
        { id: 10, text: "IBM Cloud Databases for Elasticsearch" },
        { id: 11, text: "IBM Cloud Databases for Enterprise DB" },
        { id: 12, text: "IBM Cloud Databases for MongoDB" },
        { id: 13, text: "IBM Cloud Databases for PostgreSQL" },
      ],
    },
    {
      id: 14,
      text: "Integration",
      disabled: true,
      nodes: [{ id: 15, text: "IBM API Connect", disabled: true }],
    },
  ];
}

/**
 * `cloudProducts()` without the disabled Integration branch and the MongoDB
 * and PostgreSQL children (ids 0-11). Its expandable ids are exactly 1, 2, 7
 * and 9.
 */
export function cloudProductsSubset(): TreeNode[] {
  const [ai, analytics, blockchain, databases] = cloudProducts();
  return [
    ai,
    analytics,
    blockchain,
    { ...databases, nodes: databases.nodes?.slice(0, 2) },
  ];
}

/** A 5-node chain-and-fork tree, "Level 0" to "Level 3", for `getNode` and `showNode`. */
export function levelNodes(): TreeNode[] {
  return [
    { id: 0, text: "Level 0" },
    {
      id: 1,
      text: "Level 1",
      nodes: [
        {
          id: 2,
          text: "Level 2",
          nodes: [
            { id: 3, text: "Level 3 - Target" },
            { id: 4, text: "Level 3 - Other" },
          ],
        },
      ],
    },
  ];
}
