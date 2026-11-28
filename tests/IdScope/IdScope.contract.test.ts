import { render } from "@testing-library/svelte";
import Contract from "./Contract.test.svelte";
import { DERIVED_IDS } from "./contract";

describe("documented derived ids", () => {
  it.each(Object.entries(DERIVED_IDS))("%s renders %j", (name, ids) => {
    render(Contract, { props: { name } });
    for (const id of ids) {
      expect(document.getElementById(id), `#${id}`).not.toBeNull();
    }
  });
});
