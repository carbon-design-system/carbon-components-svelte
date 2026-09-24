import { reflectDefaultValue } from "../../src/utils/reflect-default-value.js";

describe("reflectDefaultValue", () => {
  const setup = () => {
    document.body.innerHTML = '<form id="f"><input id="i" /></form>';
    return {
      form: document.getElementById("f") as HTMLFormElement,
      input: document.getElementById("i") as HTMLInputElement,
    };
  };

  test("keeps the value through a form reset", () => {
    const { form, input } = setup();
    reflectDefaultValue(input, 40);

    input.value = "90";
    form.reset();

    expect(input.value).toBe("40");
  });

  test("follows updates", () => {
    const { form, input } = setup();
    const action = reflectDefaultValue(input, 40);

    action.update(70);
    form.reset();

    expect(input.value).toBe("70");
  });

  test("reflects null as empty", () => {
    const { input } = setup();
    reflectDefaultValue(input, null);

    expect(input.getAttribute("value")).toBe("");
  });

  test("leaves the attribute alone for undefined", () => {
    const { input } = setup();
    input.defaultValue = "server";

    reflectDefaultValue(input, undefined);

    expect(input.getAttribute("value")).toBe("server");
  });
});
