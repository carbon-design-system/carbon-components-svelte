import { withKnobs, text, select, boolean, array } from '@storybook/addon-knobs';
import Component from './FileUploader.Story.svelte';

export default { title: 'FileUploader', decorators: [withKnobs] };

const buttonKinds = {
  'Primary (primary)': 'primary',
  'Secondary (secondary)': 'secondary',
  'Danger (danger)': 'danger',
  'Ghost (ghost)': 'ghost',
  'Tertiary (tertiary)': 'tertiary'
};

const filenameStatuses = {
  'Edit (edit)': 'edit',
  'Complete (complete)': 'complete',
  'Uploading (uploading)': 'uploading'
};

export const FileUploaderButton = () => ({
  Component,
  props: {
    story: 'button',
    kind: select('Button kind (kind)', buttonKinds, 'primary'),
    labelText: text('Label text (labelText)', 'Add files'),
    name: text('Form item name: (name)', ''),
    multiple: boolean('Supports multiple files (multiple)', true),
    disabled: boolean('Disabled (disabled)', false),
    disableLabelChanges: boolean(
      'Prevent the label from being replaced with file selected file (disableLabelChanges)',
      false
    ),
    role: text('ARIA role of the button (role)', 'button'),
    tabindex: text('Tab index (tabindex)', '0')
  }
});

FileUploaderButton.story = { name: 'FileUploaderButton' };

export const FileUploader = () => ({
  Component,
  props: {
    story: 'uploader',
    labelTitle: text('The label title (labelTitle)', 'Upload'),
    labelDescription: text(
      'The label description (labelDescription)',
      'only .jpg files at 500mb or less'
    ),
    buttonLabel: text('The button label (buttonLabel)', 'Add files'),
    status: select('Status for file name (status)', filenameStatuses, 'edit'),
    accept: array('Accepted file extensions (accept)', ['.jpg', '.png'], ','),
    name: text('Form item name: (name)', ''),
    multiple: boolean('Supports multiple files (multiple)', true),
    iconDescription: text('Close button icon description (iconDescription)', 'Clear file')
  }
});

FileUploader.story = { name: 'FileUploader' };

export const FileUploaderItem = () => ({
  Component,
  props: {
    story: 'item',
    name: text('Filename (name)', 'README.md'),
    status: select('Status for file name (status)', filenameStatuses, 'edit'),
    iconDescription: text('Close button icon description (iconDescription)', 'Clear file'),
    invalid: boolean('Invalid (invalid)', false),
    errorSubject: text('Error subject (errorSubject)', 'File size exceeds limit'),
    errorBody: text(
      'Error body (errorBody)',
      '500kb max file size. Select a new file and try again.'
    )
  }
});

FileUploaderItem.story = { name: 'FileUploaderItem' };

export const FileUploaderDropContainer = () => ({
  Component,
  props: {
    story: 'drop container',
    labelText: text('Label text (labelText)', 'Drag and drop files here or click to upload'),
    name: text('Form item name (name)', ''),
    multiple: boolean('Supports multiple files (multiple)', true),
    accept: array(
      'Accepted MIME types or file extensions (accept)',
      ['image/jpeg', 'image/png'],
      ','
    ),
    disabled: boolean('Disabled (disabled)', false),
    role: text('ARIA role of the button (role)', ''),
    tabindex: text('Tab index (tabindex)', '0')
  }
});

FileUploaderDropContainer.story = { name: 'FileUploaderDropContainer' };

export const Skeleton = () => ({ Component, props: { story: 'skeleton' } });
