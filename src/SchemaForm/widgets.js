// @ts-check

import CheckboxGroupWidget from "./widgets/CheckboxGroupWidget.svelte";
import CheckboxWidget from "./widgets/CheckboxWidget.svelte";
import ComboBoxWidget from "./widgets/ComboBoxWidget.svelte";
import DatePickerWidget from "./widgets/DatePickerWidget.svelte";
import DropdownWidget from "./widgets/DropdownWidget.svelte";
import FileWidget from "./widgets/FileWidget.svelte";
import MultiSelectWidget from "./widgets/MultiSelectWidget.svelte";
import NumberWidget from "./widgets/NumberWidget.svelte";
import PasswordWidget from "./widgets/PasswordWidget.svelte";
import PinWidget from "./widgets/PinWidget.svelte";
import RadioWidget from "./widgets/RadioWidget.svelte";
import RangeSliderWidget from "./widgets/RangeSliderWidget.svelte";
import RatingWidget from "./widgets/RatingWidget.svelte";
import SearchWidget from "./widgets/SearchWidget.svelte";
import SelectWidget from "./widgets/SelectWidget.svelte";
import SliderWidget from "./widgets/SliderWidget.svelte";
import TagsWidget from "./widgets/TagsWidget.svelte";
import TextAreaWidget from "./widgets/TextAreaWidget.svelte";
import TextWidget from "./widgets/TextWidget.svelte";
import TimeWidget from "./widgets/TimeWidget.svelte";
import ToggleButtonsWidget from "./widgets/ToggleButtonsWidget.svelte";
import ToggleWidget from "./widgets/ToggleWidget.svelte";

/**
 * The widget for each field `type`. Pass your own map as `widgets` to add a
 * type or to replace one; it is merged over this one.
 * @type {Record<string, import("./create-form.js").WidgetComponent>}
 */
export const defaultWidgets = {
  text: TextWidget,
  email: TextWidget,
  url: TextWidget,
  tel: TextWidget,
  password: PasswordWidget,
  textarea: TextAreaWidget,
  search: SearchWidget,
  number: NumberWidget,
  integer: NumberWidget,
  select: SelectWidget,
  dropdown: DropdownWidget,
  combobox: ComboBoxWidget,
  multiselect: MultiSelectWidget,
  checkbox: CheckboxWidget,
  checkboxes: CheckboxGroupWidget,
  radio: RadioWidget,
  toggle: ToggleWidget,
  togglebuttons: ToggleButtonsWidget,
  date: DatePickerWidget,
  daterange: DatePickerWidget,
  time: TimeWidget,
  slider: SliderWidget,
  rangeslider: RangeSliderWidget,
  file: FileWidget,
  tags: TagsWidget,
  pin: PinWidget,
  rating: RatingWidget,
};
