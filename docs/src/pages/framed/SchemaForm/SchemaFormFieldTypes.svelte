<script>
  import { SchemaForm } from "carbon-components-svelte";

  const options = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
    { value: "c", label: "Gamma" },
  ];

  const fields = [
    { name: "text", label: "text", helperText: "TextInput" },
    { name: "email", type: "email", label: "email", helperText: "TextInput" },
    { name: "password", type: "password", label: "password" },
    { name: "textarea", type: "textarea", label: "textarea" },
    { name: "search", type: "search", label: "search" },
    { name: "number", type: "number", label: "number", default: 3 },
    { name: "integer", type: "integer", label: "integer", min: 0, max: 10 },
    { name: "select", type: "select", label: "select", options },
    { name: "dropdown", type: "dropdown", label: "dropdown", options },
    { name: "combobox", type: "combobox", label: "combobox", options },
    { name: "multiselect", type: "multiselect", label: "multiselect", options },
    { name: "checkbox", type: "checkbox", label: "checkbox" },
    { name: "toggle", type: "toggle", label: "toggle" },
    { name: "radio", type: "radio", label: "radio", options },
    { name: "checkboxes", type: "checkboxes", label: "checkboxes", options },
    {
      name: "togglebuttons",
      type: "togglebuttons",
      label: "togglebuttons",
      options,
    },
    { name: "date", type: "date", label: "date" },
    { name: "daterange", type: "daterange", label: "daterange" },
    { name: "time", type: "time", label: "time" },
    { name: "slider", type: "slider", label: "slider", default: 40 },
    {
      name: "rangeslider",
      type: "rangeslider",
      label: "rangeslider",
      default: [20, 60],
    },
    { name: "tags", type: "tags", label: "tags" },
    { name: "pin", type: "pin", label: "pin", maxLength: 4 },
    { name: "rating", type: "rating", label: "rating" },
    { name: "file", type: "file", label: "file" },
  ];
</script>

<SchemaForm {fields} hideActions />
