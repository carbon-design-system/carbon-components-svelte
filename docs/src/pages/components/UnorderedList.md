---
components: ["UnorderedList", "ListItem"]
description: Unordered lists display a bulleted list of items, with support for nesting, links, and expressive typography.
---

<script>
  import { UnorderedList, ListItem, Link } from "carbon-components-svelte";
</script>

## Basic

Create a basic unordered list with list item components. For tree-structured data, consider [RecursiveList](/components/RecursiveList).

<UnorderedList>
  <ListItem>Rotate the service account key at least every 90 days</ListItem>
  <ListItem>Grant the least privilege required for the integration</ListItem>
  <ListItem>Review audit logs weekly for anomalous access</ListItem>
</UnorderedList>

## With links

Add links to list items by wrapping them in link components.

<UnorderedList>
  <ListItem>
    <Link href="#">API reference</Link>
  </ListItem>
  <ListItem>
    <Link href="#">Deployment runbook</Link>
  </ListItem>
  <ListItem>
    <Link href="#">Incident response playbook</Link>
  </ListItem>
</UnorderedList>

## Nested lists

Create hierarchical lists by setting `nested` on a child unordered list component.

<UnorderedList>
  <ListItem>
    Workspace settings
    <UnorderedList nested>
      <ListItem>Billing</ListItem>
      <ListItem>
        Access control
        <UnorderedList nested>
          <ListItem>Role assignments</ListItem>
          <ListItem>SSO configuration</ListItem>
        </UnorderedList>
      </ListItem>
    </UnorderedList>
  </ListItem>
  <ListItem>Audit logs</ListItem>
  <ListItem>API keys</ListItem>
</UnorderedList>

## Expressive styles

Use Carbon's expressive typesetting with `expressive`.

<UnorderedList expressive>
  <ListItem><Link size="lg" href="#">Read the onboarding guide</Link></ListItem>
  <ListItem>Request access to the staging environment</ListItem>
  <ListItem>Schedule a walkthrough with your team lead</ListItem>
</UnorderedList>

## Virtualization

Render thousands of items with [VirtualList](/components/VirtualList). Set `spacerTag` to `"li"` so it renders only the items in view, straight into the list. Wrap the list in a [ScrollGradient](/components/ScrollGradient), pass its `scrollElementRef` as `scrollElement`, and pad the list on the left so the bullets are not clipped. Set `measured` if items can wrap.

<FileSource src="/framed/VirtualList/VirtualListUnorderedList" />
