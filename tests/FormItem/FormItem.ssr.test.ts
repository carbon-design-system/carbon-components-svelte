// @vitest-environment node
import { render } from "svelte/server";
import { renderSSR } from "../utils/ssr";
import FormItemSsrTest from "./FormItemSsr.test.svelte";

describe("FormItem server render", () => {
  const props = { error: "Enter an email" };

  it("renders identical markup for an explicit controlId", () => {
    const html = render(FormItemSsrTest, { props }).body;

    expect(render(FormItemSsrTest, { props }).body).toBe(html);
  });

  it("derives the part ids from controlId", () => {
    const { document } = renderSSR(FormItemSsrTest, props);

    const label = document.querySelector("label");
    expect(label).toHaveAttribute("id", "label-email");
    expect(label).toHaveAttribute("for", "email");
    expect(document.querySelector("input")).toHaveAttribute("id", "email");
    expect(document.getElementById("helper-email")).toHaveTextContent(
      "Use your work email",
    );
    expect(document.getElementById("error-email")).toHaveAttribute(
      "role",
      "alert",
    );
  });
});
