<script>
  import { TreeView } from "carbon-components-svelte";
  import Email from "carbon-icons-svelte/lib/Email.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  const nodes = [
    {
      id: "inbox",
      text: "Inbox",
      icon: Email,
      badge: 128,
      badgeDescription: "128 unread",
      nodes: [
        {
          id: "work",
          text: "Work",
          icon: Folder,
          badge: 42,
          badgeDescription: "42 unread",
        },
        {
          id: "personal",
          text: "Personal",
          icon: Folder,
          badge: 7,
          badgeDescription: "7 unread",
        },
        { id: "receipts", text: "Receipts", icon: Folder },
      ],
    },
    {
      id: "drafts",
      text: "Drafts",
      icon: Folder,
      badge: 3,
      badgeDescription: "3 drafts",
    },
    {
      id: "trash",
      text: "Trash",
      icon: TrashCan,
      badge: 19,
      badgeDescription: "19 items",
    },
  ];
</script>

<TreeView labelText="Mailboxes" {nodes} expandedIds={["inbox"]} />
