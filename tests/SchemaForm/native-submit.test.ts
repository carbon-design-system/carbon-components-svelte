import { render, screen } from "@testing-library/svelte";
import { createForm } from "carbon-components-svelte/SchemaForm/create-form.js";
import { tick } from "svelte";
import AllFields from "./AllFields.test.svelte";

const options = ["a", "b", "c"];

// What a browser posts for each field type, as `[name, value]` pairs. Native
// submission carries strings only: a number is its text, a checked box is
// `on` and an unchecked one is absent, and a list is one entry per item.
const posted: [string, unknown, object | undefined, string[]][] = [
  ["text", "hi", undefined, ["f=hi"]],
  ["password", "pw", undefined, ["f=pw"]],
  ["textarea", "ta", undefined, ["f=ta"]],
  ["search", "q", undefined, ["f=q"]],
  ["number", 7, undefined, ["f=7"]],
  ["slider", 30, undefined, ["f=30"]],
  ["rangeslider", [10, 20], undefined, ["f[0]=10", "f[1]=20"]],
  ["select", "b", { options }, ["f=b"]],
  ["dropdown", "b", { options }, ["f=b"]],
  ["combobox", "b", { options }, ["f=b"]],
  ["multiselect", ["a", "c"], { options }, ["f=a", "f=c"]],
  ["checkbox", true, undefined, ["f=on"]],
  ["checkbox", false, undefined, []],
  ["toggle", true, undefined, ["f=on"]],
  ["radio", "b", { options }, ["f=b"]],
  ["checkboxes", ["a", "c"], { options }, ["f=a", "f=c"]],
  ["togglebuttons", ["a", "c"], { options }, ["f=a", "f=c"]],
  ["tags", ["x", "y"], undefined, ["f=x", "f=y"]],
  ["time", "09:30", undefined, ["f=09:30"]],
  ["rating", 3, undefined, ["f=3"]],
  ["pin", "1234", { maxLength: 4 }, ["f=1234"]],
  ["date", "2026-03-04", undefined, ["f=2026-03-04"]],
  [
    "daterange",
    ["2026-03-04", "2026-03-09"],
    undefined,
    ["f[0]=2026-03-04", "f[1]=2026-03-09"],
  ],
];

describe("native submission", () => {
  it.each(posted)("%s posts %j", async (type, value, config, expected) => {
    const form = createForm({
      fields: [{ name: "f", type, label: "F", ...config }],
    });
    render(AllFields, { form });
    form.setValue("f", value);
    await tick();
    const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
    expect([...data.entries()].map(([k, v]) => `${k}=${v}`)).toEqual(expected);
  });
});
