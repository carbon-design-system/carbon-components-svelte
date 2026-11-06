<script>
  import { Button, gesture, Stack } from "carbon-components-svelte";
  import ArrowDown from "carbon-icons-svelte/lib/ArrowDown.svelte";
  import ArrowUp from "carbon-icons-svelte/lib/ArrowUp.svelte";
  import Draggable from "carbon-icons-svelte/lib/Draggable.svelte";

  let tasks = [
    { id: "a", text: "Review the access request" },
    { id: "b", text: "Rotate the staging keys" },
    { id: "c", text: "Update the on-call schedule" },
    { id: "d", text: "Archive last quarter's reports" },
    { id: "e", text: "Reply to the vendor" },
  ];
  let list;
  let announcement = "";

  let lift = null;
  let liftedId = null;
  let overIndex = -1;
  let offset = 0;

  function move(from, to, how) {
    if (to < 0 || to >= tasks.length || from === to) return;
    const next = [...tasks];
    const [task] = next.splice(from, 1);
    next.splice(to, 0, task);
    tasks = next;
    announcement = `${task.text}, moved to position ${to + 1} of ${tasks.length}${how}`;
  }

  function begin(event) {
    if (lift) return;
    const row = event.startEvent?.target?.closest?.("[data-task]");
    if (!row || !list.contains(row)) return;
    const rows = [...list.querySelectorAll("[data-task]")];
    const from = rows.indexOf(row);
    lift = {
      id: row.dataset.task,
      row,
      from,
      centers: rows.map((item) => {
        const box = item.getBoundingClientRect();
        return box.top + box.height / 2;
      }),
    };
    liftedId = lift.id;
    overIndex = from;
    offset = 0;
    announcement = `${tasks[from].text}, picked up`;
  }

  function track(event) {
    if (!lift) return;
    offset = event.deltaY;
    const center = lift.centers[lift.from] + event.deltaY;
    let nearest = 0;
    for (let i = 1; i < lift.centers.length; i += 1) {
      if (
        Math.abs(lift.centers[i] - center) <
        Math.abs(lift.centers[nearest] - center)
      ) {
        nearest = i;
      }
    }
    overIndex = nearest;
  }

  function drop(commit) {
    if (!lift) return;
    const from = lift.from;
    const over = overIndex;
    lift = null;
    liftedId = null;
    offset = 0;
    overIndex = -1;
    if (commit) move(from, over, "");
    else announcement = "Move cancelled";
  }

  function handleKeydown(event, index) {
    if (!event.altKey) return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      move(index, index - 1, "");
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      move(index, index + 1, "");
    }
  }
</script>

<Stack gap={4}>
  <!-- A finger holds to lift; a mouse or pen drags at once. Either way the
    hold hands off to the pan, and Escape or a cancelled pointer puts the row
    back. -->
  <ul
    bind:this={list}
    class="tasks"
    use:gesture={{
      longPress: { onLongPress: begin, onEnd: () => drop(false) },
      pan: {
        axis: "y",
        touch: "afterLongPress",
        onStart: begin,
        onMove: track,
        onEnd: (event) => drop(!event.cancelled),
      },
    }}
  >
    {#each tasks as task, index (task.id)}
      <!-- The keys bubble up from the focused move button. -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <li
        class="task"
        class:lifted={liftedId === task.id}
        class:target={liftedId !== null &&
          liftedId !== task.id &&
          overIndex === index}
        class:after={lift !== null && overIndex > lift.from}
        data-task={task.id}
        style:transform={liftedId === task.id
          ? `translateY(${offset}px)`
          : null}
        on:keydown={(event) => handleKeydown(event, index)}
      >
        <span class="grip" aria-hidden="true"><Draggable /></span>
        <span class="text">{task.text}</span>
        <Button
          size="small"
          kind="ghost"
          iconOnly
          icon={ArrowUp}
          iconDescription="Move up"
          tooltipPosition="left"
          disabled={index === 0}
          on:click={() => move(index, index - 1, "")}
        />
        <Button
          size="small"
          kind="ghost"
          iconOnly
          icon={ArrowDown}
          iconDescription="Move down"
          tooltipPosition="left"
          disabled={index === tasks.length - 1}
          on:click={() => move(index, index + 1, "")}
        />
      </li>
    {/each}
  </ul>
  <p class="help">
    Press and hold a task, then drag it. A mouse drags right away. Or use the
    move buttons, or press Alt with the up and down arrow keys on a focused
    button.
  </p>
  <div class="visually-hidden" aria-live="polite">{announcement}</div>
</Stack>

<style>
  .tasks {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .task {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--cds-spacing-03);
    padding-inline-start: var(--cds-spacing-05);
    background: var(--cds-layer-01);
    border-block-end: 1px solid var(--cds-border-subtle-01);
    user-select: none;
    -webkit-touch-callout: none;
  }

  .grip {
    display: inline-flex;
    color: var(--cds-icon-secondary);
    cursor: grab;
  }

  .text {
    flex: 1;
    padding-block: var(--cds-spacing-05);
  }

  .lifted {
    z-index: 1;
    background: var(--cds-layer-selected-01);
    outline: 2px dashed var(--cds-focus);
    outline-offset: -2px;
    cursor: grabbing;
  }

  .target {
    box-shadow: inset 0 2px 0 0 var(--cds-focus);
  }

  /* Moving down, the row lands below the one it is over. */
  .target.after {
    box-shadow: inset 0 -2px 0 0 var(--cds-focus);
  }

  .help {
    color: var(--cds-text-secondary);
    font-size: var(--cds-helper-text-01-font-size, 0.75rem);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (forced-colors: active) {
    .lifted {
      outline-color: Highlight;
    }

    .target {
      box-shadow: inset 0 2px 0 0 Highlight;
    }

    .target.after {
      box-shadow: inset 0 -2px 0 0 Highlight;
    }
  }
</style>
