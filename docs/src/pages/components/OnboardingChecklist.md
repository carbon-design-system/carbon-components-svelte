---
components: ["OnboardingChecklist", "OnboardingChecklistLauncher"]
description: Onboarding checklists guide new users through their first tasks, with progress, sections, an "All set" state and progress that survives a reload.
keywords: ["getting started", "setup guide", "onboarding", "task list"]
---

## Basic

Pass the tasks to `tasks`. Each task has an `id`, a `title` and, optionally, a `description`, a `section` and a `cta`, the link or button that starts the task. Users check the tasks they finish, and the progress bar and the count follow. Their progress is saved in `localStorage`, so the list is where they left it after a reload.

Tasks with the same `section` are grouped under its heading, in the order the sections first appear.

<FileSource src="/framed/OnboardingChecklist/OnboardingChecklistSetup" />

## Tasks

### Tasks the app detects

Set `completed` to a boolean on a task your app can detect, such as a data source that started sending data. The app then owns the task: it shows a status icon and the text "Completed" or "Not completed" instead of a checkbox, and the user can't check it. Leave `completed` unset for a task the user checks.

A screen reader hears a polite "Completed: Connect a metrics source" when the app completes a task, since nothing else on the page says so.

<FileSource src="/framed/OnboardingChecklist/OnboardingChecklistAppDetected" />

| State | Owner | Kept in |
| :--- | :--- | :--- |
| `completed` on a task | Your app | Your app. The checklist never writes it. |
| A checked task | The user | The checklist store. |
| A skipped task | The user | The checklist store. |
| Minimized, dismissed, "All set" shown | The user | The checklist store. |

### Optional tasks

Set `optional` to `true` to let users skip a task. A skipped task is marked "Skipped" and leaves the count, so "3 of 5 complete" never counts a task the user chose not to do. The Skip button hands focus to "Undo skip", and back.

```svelte
<OnboardingChecklist
  tasks={[
    { id: "invite", title: "Invite your team", optional: true },
  ]}
/>
```

### Call to action

A `cta` with an `href` renders a link. Without one it renders a button. Both fire `action` with the task, and both are described by the task's title, so a page of identical "Start" buttons still tells them apart.

Handle `action` to start the task, such as opening a dialog or a product tour of your own. The checklist doesn't check the task: it doesn't know what finishing means.

```svelte
<OnboardingChecklist
  {tasks}
  on:action={(event) => {
    if (event.detail.id === "source") sourceDialogOpen = true;
  }}
/>
```

## All set

When every task is done, the list collapses to its header, the progress bar gives way to "All set" with a check mark, and a screen reader hears one polite announcement. Reduced motion skips the animation. A user who returns to a finished checklist finds it collapsed and hears nothing: "All set" is remembered.

Handle `complete` to react, such as showing a toast or sending an event. Use the `complete` slot to replace the description under "All set".

Users can open the list again with the title, and the list opens by itself if a task becomes undone. Bind `collapsed` to control it.

## Placement

### Inline

By default the checklist sits in the page flow. Its header is a button that collapses the list, and a button dismisses it for good.

### Floating

Set `floating` to dock the checklist in the bottom inline-end corner. A Minimize button leaves a launcher, and the launcher reads "Getting started, 1 of 3 complete". It opens the checklist and moves focus to its title. The corner follows the writing direction, so it is bottom left under `dir="rtl"`.

Under the medium breakpoint the launcher is a 48px circle with no visible text, so it covers little of a narrow page. Leave room at the end of your page, such as bottom padding, so the last line can scroll clear of it.

<FileSource src="/framed/OnboardingChecklist/OnboardingChecklistFloating" />

`OnboardingChecklistLauncher` is the launcher on its own, for a layout where the checklist opens from somewhere else, such as a header.

A dismissed checklist is gone until you call `store.restore()`, such as from a "Setup guide" item in a help menu. `store.expand()` opens a minimized one.

## Persistence

With no `store`, the checklist keeps its progress in `localStorage` under `carbon:onboarding:` and its `id`. Create the store yourself with `createChecklistStore` to choose where progress lives, to share it, or to read it from your own code.

```svelte
<script>
  import { createChecklistStore, localChecklistStorage, setChecklistStore } from "carbon-components-svelte";

  const store = createChecklistStore({
    storage: localChecklistStorage("acme:setup"),
  });

  // Every checklist below this component uses it.
  setChecklistStore(store);
</script>
```

A storage adapter is `{ read, write, subscribe }`. `read` and `write` may return promises, which is how progress synced with a server plugs in, and `subscribe` reports changes from another tab. The local adapter already does, so a task checked in one tab is checked in the other.

```svelte
const store = createChecklistStore({
  storage: {
    read: () => fetch("/api/setup").then((response) => response.json()),
    write: (snapshot) =>
      fetch("/api/setup", { method: "PUT", body: JSON.stringify(snapshot) }).then(),
  },
  onError: (error) => console.error(error),
});
```

The checklist ignores ids that no task has, so a task you remove in a release leaves nothing behind, and a task you add shows up unchecked.

## Server rendering

The store never reads its storage while it is created, so the server and the first render in the browser print the same markup. The checklist reads the storage once it is mounted. Until then it follows `pending`.

| Strategy | The server prints | New visitor | Returning visitor |
| :--- | :--- | :--- | :--- |
| `pending: "hide"` (default) | Nothing | The checklist appears after hydration | Nothing flashes |
| `pending: "show"` | Every task, unchecked | Nothing moves | The checklist flashes, then updates or goes away |
| `initial` from a cookie | The checklist as the user left it | Nothing moves | Nothing moves |

A floating checklist is fixed to the corner, so none of the strategies shifts the page. An inline one pushes the content below it down by its height once, for the new visitor, under `"hide"`.

Tasks the app detects are props, so the server prints them right in every strategy. For a server-rendered app, store the progress in a cookie, read it on the server and pass it as `initial`.

```ts
// +page.server.ts (SvelteKit)
import { parseChecklistCookie } from "carbon-components-svelte";

export function load({ request }) {
  return { setup: parseChecklistCookie(request.headers.get("cookie")) };
}
```

```svelte
<script>
  import { cookieChecklistStorage, createChecklistStore, OnboardingChecklist } from "carbon-components-svelte";

  export let data;

  const store = createChecklistStore({
    storage: cookieChecklistStorage(),
    initial: data.setup,
  });
</script>

<OnboardingChecklist {tasks} {store} />
```

`parseChecklistCookie` returns `undefined` for a visitor with no cookie, which leaves the store `pending`. The cookie holds task ids and flags, and script can read it, so keep nothing private in it.

## Accessibility

The checklist is a region named by its title, with a heading, and each section is a named group with a heading one level lower. Set `headingLevel` to fit the page outline. Tasks are a list. Progress is a ProgressBar, so it reads "1 of 4 complete".

| Part | Pattern |
| :--- | :--- |
| A task the user owns | A checkbox named by the task's title and described by its description. |
| A task the app owns | An icon and text, "Completed" or "Not completed", with no control. |
| Call to action and Skip | A link or a button, described by the task's title. |
| Header | A button with `aria-expanded` and `aria-controls` that collapses the list. |
| Launcher | A button named "Getting started, 1 of 3 complete", with `aria-expanded="false"` and `aria-controls` pointing at the checklist. |
| Completion | One polite live region, written once. |

Press <DocKbd label="Tab" /> to move through the title, the actions, and each task's checkbox and buttons in reading order. <DocKbd label="Space" /> checks a task, and <DocKbd label="Enter" /> activates a button. Minimizing moves focus to the launcher, opening moves it to the title, and dismissing returns it to where it was before the checklist took it.

| Do | Why |
| :--- | :--- |
| Name each task with a short verb phrase. | The title names the checkbox and every button in its row. |
| Set `completed` only for what your app can detect. | A task the app owns has no checkbox, so the user can't correct a wrong guess. |
| Keep the number of tasks under about ten. | Twenty render and work, but a long list stops reading as a short path to "All set". |
| Leave room at the end of the page for a floating checklist. | The launcher is fixed, so it covers whatever scrolls under it. |
| Don't use `description` for something the user must act on. | It describes the checkbox and is easy to skip. |

## When to use

| Use | When |
| :--- | :--- |
| OnboardingChecklist | A user has a short list of things to do to get value from a product, and the list remembers what they did. |
| ProgressBar | One measured quantity is moving, such as an upload. There are no tasks to check. |
| ProgressIndicator or Stepper | A single flow has ordered steps the user moves through in one sitting, and later steps depend on earlier ones. |
| Accordion | The content is reference text the user opens and reads, with no progress and no memory. |
| InlineNotification | The page reports what the user just did, and nothing is remembered. |
