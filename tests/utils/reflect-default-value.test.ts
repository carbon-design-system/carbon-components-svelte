import { reflectDefaultValue } from "../../src/utils/reflect-default-value.js";

describe("reflectDefaultValue", () => {
  const setup = () => {
    document.body.innerHTML = '<form id="f"><input id="i" /></form>';
    const form = document.querySelector<HTMLFormElement>("#f");
    const input = document.querySelector<HTMLInputElement>("#i");
    assert(form);
    assert(input);
    return { form, input };
  };

  it("keeps the value through a form reset", () => {
    const { form, input } = setup();
    reflectDefaultValue(input, 40);

    input.value = "90";
    form.reset();

    expect(input.value).toBe("40");
  });

  it("follows updates", () => {
    const { form, input } = setup();
    const action = reflectDefaultValue(input, 40);

    action.update(70);
    form.reset();

    expect(input.value).toBe("70");
  });

  it("reflects null as empty", () => {
    const { input } = setup();
    reflectDefaultValue(input, null);

    expect(input.getAttribute("value")).toBe("");
  });

  it("leaves the attribute alone for undefined", () => {
    const { input } = setup();
    input.defaultValue = "server";

    reflectDefaultValue(input, undefined);

    expect(input.getAttribute("value")).toBe("server");
  });
});
