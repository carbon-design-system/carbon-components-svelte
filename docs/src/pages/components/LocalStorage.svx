---
components: ["LocalStorage"]
description: Local storage provides a reactive wrapper around the localStorage API; data persists across tabs and survives reloads.
---

<script>
</script>

## Basic

See how the component maintains state across page reloads. Toggle the switch and refresh the page to see the persisted state. Unlike [SessionStorage](/components/SessionStorage), data persists indefinitely and is shared across all tabs of the same origin.

The component listens for the [storage event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event), so changes made in one browser tab are automatically synchronized to other tabs with the same key. Other LocalStorage components with the same key on the same page stay in sync as well. These updates dispatch `on:update` with a payload shaped like `{ prevValue, value }`. When another tab removes the key or clears storage, the bound value resets to undefined so the next local write does not re-persist stale data.

The example below logs both `on:save` and `on:update` as they fire; see [Events](#events) for what each one means.

<FileSource src="/framed/LocalStorage/LocalStorage" />

## Persisting objects and arrays

The bound value can be any JSON-serializable data; objects and arrays are serialized with JSON.stringify. Strings are stored as is, except strings that look like JSON (such as `"123"` or `"true"`), which are JSON-encoded so they read back as strings rather than numbers or booleans. The component compares the serialized form to decide when to write, which has two consequences:

- Reassigning to a new object or array with **identical contents** does not trigger a redundant write.
- **In-place mutations** (for example, changing a nested theme property) persist only when you signal the change to Svelte. Reassign the value (`value = { ...value, theme: "light" }`) or use the self-assignment idiom (`value = value`); a bare mutation alone will not re-render and therefore will not persist.

In this example, the text inputs bind directly to nested properties and the button mutates the object in place. Edit a field and refresh the page to confirm the change is persisted.

<FileSource src="/framed/LocalStorage/LocalStorageObject" />

## Reactive key

The storage key is also reactive — set `key` to switch between contexts, useful for per-user settings.

In this example, each user has their own theme preference stored under a separate key. When you switch users, the component automatically loads that user's saved preference.

Switching keys only hydrates the bound value from storage; it does not dispatch `on:update`. The event log below should stay empty when you change users and only record entries when you change the theme.

<FileSource src="/framed/LocalStorage/LocalStorageReactiveKey" />

## Disabling sync

With sync enabled by default, another tab or another LocalStorage on the page writing the same key updates the bound value and fires `on:update`. Set `sync="off"` to ignore those writes. The component still loads storage on mount and saves your own changes.

Use sync off when each tab should keep separate state: drafts, forms in progress, or a second login tab that should not clobber the first. You can also turn sync off if the app resolves conflicts itself. Sync is reactive, so you can change it at runtime.

```svelte
<LocalStorage key="draft" bind:value sync="off" />
```

## Clear item, clear all

The component provides methods to manage stored data:

| Method       | Description                         |
| ------------ | ----------------------------------- |
| `clearItem`  | Remove a specific key-value pair.   |
| `clearAll`   | Remove all stored data.             |

Use `bind:this` to access these methods. Both also reset the bound value to `undefined` and dispatch [`update`](#update), so there is no need to reset it yourself. The key stays cleared until the value changes again. Other tabs, and other LocalStorage components on the page, reset their bound value for the cleared keys.

In this example, try toggling the switch, refreshing the page, then clearing the storage.

<FileSource src="/framed/LocalStorage/LocalStorageClear" />

## Events

The component dispatches three events: `save`, `update`, and `error`.

### Update

Fires whenever the persisted value changes — after your own `bind:value` write, after `clearItem` or `clearAll`, or when another tab, window or LocalStorage on the page writes the same key while `sync` is `"on"` (the default). The payload is `{ prevValue, value }`.

```svelte
<LocalStorage
  key="dark-mode"
  bind:value
  on:update={({ detail }) => console.log(detail)} // { prevValue, value }
/>
```

### Save

Fires once, when the component mounts, if the key does not already exist in storage — this is the component's own first write to initialize that key. Switching to a different key afterward (see [Reactive key](#reactive-key)) does not dispatch `save`, even if the new key has no stored value yet.

### Error

Fires when a write to storage fails, for example when the storage quota is exceeded or storage access is denied (such as private browsing modes that disable storage). The payload is `{ error }`.

```svelte
<LocalStorage
  key="workspace-settings"
  bind:value
  on:error={({ detail }) => console.error(detail.error)}
/>
```