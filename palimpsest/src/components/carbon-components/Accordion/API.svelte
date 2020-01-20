<script>
  import { ComponentAPI } from '../../Component';

  const props = [
    {
      name: 'type',
      type: 'string',
      required: true,
      value: ['inline', 'single', 'multi'],
      defaultValue: { value: 'single' },
      description: `
      <div>
        <strong>Inline</strong> An inline <code>CodeSnippet</code> contains
        </div>
      `
    },
    {
      name: 'light',
      type: 'boolean',
      required: false,
      value: [],
      defaultValue: { value: false },
      description: `
        <div>Light variant</div>
      `
    },
    {
      name: 'code',
      type: 'string',
      required: true,
      value: [],
      defaultValue: { value: undefined },
      description: `
        <div>Light variant</div>
      `
    }
  ];
</script>

<ComponentAPI {props} />
