import { get } from "svelte/store";
import {
  clearAllGroups,
  getGroup,
  type RadioGroup,
  registerRadioButton,
  updateGroupSelection,
} from "../../src/RadioButton/RadioButtonRegistry";

describe("RadioButtonRegistry", () => {
  beforeEach(() => {
    clearAllGroups();
  });

  it("should create a new group on first registration", () => {
    const key = {};
    registerRadioButton("group1", key, false);

    const group = getGroup("group1");
    expect.assert(group);
    expect(group.members.size).toBe(1);
  });

  it("should add members to existing group", () => {
    const key1 = {};
    const key2 = {};
    registerRadioButton("group1", key1, false);
    registerRadioButton("group1", key2, false);

    const group = getGroup("group1");
    expect.assert(group);
    expect(group.members.size).toBe(2);
  });

  it("should set initial selected key when checked=true", () => {
    const key = {};
    registerRadioButton("group1", key, true);

    const group = getGroup("group1");
    expect(group).toBeDefined();
    expect(get((group as RadioGroup).selectedKey)).toBe(key);
  });

  it("should share the same store across group members", () => {
    const key1 = {};
    const key2 = {};
    const { selectedKey: store1 } = registerRadioButton("group1", key1, false);
    const { selectedKey: store2 } = registerRadioButton("group1", key2, false);

    expect(store1).toBe(store2);
  });

  it("should unregister and clean up empty groups", () => {
    const key1 = {};
    const key2 = {};
    const { unregister: unregister1 } = registerRadioButton(
      "group1",
      key1,
      false,
    );
    const { unregister: unregister2 } = registerRadioButton(
      "group1",
      key2,
      false,
    );

    unregister1();
    const group1 = getGroup("group1");
    expect.assert(group1);
    expect(group1.members.size).toBe(1);

    unregister2();
    expect(getGroup("group1")).toBeUndefined();
  });

  it("should update selected key across all subscribers", () => {
    const key1 = {};
    const key2 = {};
    const { selectedKey: store1 } = registerRadioButton("group1", key1, false);
    registerRadioButton("group1", key2, false);

    updateGroupSelection("group1", key2);

    expect(get(store1)).toBe(key2);
  });

  it("should handle multiple independent groups", () => {
    const key1 = {};
    const key2 = {};
    registerRadioButton("group1", key1, true);
    registerRadioButton("group2", key2, true);

    const group1 = getGroup("group1");
    const group2 = getGroup("group2");

    expect.assert(group1);
    expect.assert(group2);

    expect(get(group1.selectedKey)).toBe(key1);
    expect(get(group2.selectedKey)).toBe(key2);

    const newKey = {};
    registerRadioButton("group1", newKey, false);
    updateGroupSelection("group1", newKey);

    expect(get(group1.selectedKey)).toBe(newKey);
    expect(get(group2.selectedKey)).toBe(key2);
  });

  it("should handle re-registration with same key", () => {
    const key = {};
    registerRadioButton("group1", key, false);
    registerRadioButton("group1", key, false);

    const group = getGroup("group1");
    expect.assert(group);
    // Set doesn't add duplicates
    expect(group.members.size).toBe(1);
  });

  it("should not throw when updating non-existent group", () => {
    const key = {};
    expect(() => {
      updateGroupSelection("non-existent", key);
    }).not.toThrow();
  });

  it("should not throw when unregistering from non-existent group", () => {
    const key = {};
    const { unregister } = registerRadioButton("group1", key, false);

    clearAllGroups();

    expect(() => {
      unregister();
    }).not.toThrow();
  });

  it("should reset selectedKey when selected instance is unregistered", () => {
    const key1 = {};
    const key2 = {};
    const { unregister: unregister1 } = registerRadioButton(
      "group1",
      key1,
      true,
    );
    registerRadioButton("group1", key2, false);

    const group = getGroup("group1");
    expect.assert(group);
    expect(get(group.selectedKey)).toBe(key1);

    // Unregister the selected instance
    unregister1();

    // selectedKey should be reset to undefined
    expect(get(group.selectedKey)).toBeUndefined();
  });

  it("should not reset selectedKey when non-selected instance is unregistered", () => {
    const key1 = {};
    const key2 = {};
    registerRadioButton("group1", key1, true);
    const { unregister: unregister2 } = registerRadioButton(
      "group1",
      key2,
      false,
    );

    const group = getGroup("group1");
    expect.assert(group);
    expect(get(group.selectedKey)).toBe(key1);

    // Unregister the non-selected instance
    unregister2();

    // selectedKey should still be key1
    expect(get(group.selectedKey)).toBe(key1);
  });
});
