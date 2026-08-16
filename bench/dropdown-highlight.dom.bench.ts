import { cleanup, fireEvent, render } from "@testing-library/svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import { bench, run } from "mitata";

function buildItems(count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({ id: String(i), text: `Item ${(i * 37) % count}` });
  }
  return items;
}

const items1000 = buildItems(1000);

it("benchmarks Dropdown ArrowDown highlight on a 1000-item menu", async () => {
  bench(
    "ArrowDown highlight, Dropdown 1000 items (not virtualized)",
    function* () {
      const result = render(Dropdown, {
        props: {
          items: items1000,
          selectedId: "0",
          labelText: "Contact",
          virtualize: false,
          open: true,
        },
      });
      const combobox = result.getByRole("combobox");

      yield () => {
        fireEvent.keyDown(combobox, { key: "ArrowDown" });
      };

      cleanup();
    },
  );

  bench("ArrowDown highlight, Dropdown 1000 items (virtualized)", function* () {
    const result = render(Dropdown, {
      props: {
        items: items1000,
        selectedId: "0",
        labelText: "Contact",
        open: true,
      },
    });
    const combobox = result.getByRole("combobox");

    yield () => {
      fireEvent.keyDown(combobox, { key: "ArrowDown" });
    };

    cleanup();
  });

  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 180_000);
