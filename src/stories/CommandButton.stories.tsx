import React from 'react';
import { withKnobs, text, select } from "@storybook/addon-knobs";
import { action } from '@storybook/addon-actions';
import { CommandButton, Command } from '../wmf/components/CommandButton';

export default {
  title: 'CommandButton',
  component: CommandButton,
  decorators: [withKnobs]
};

const variantOptions:
( 'primary'
| 'secondary'
| 'success'
| 'danger'
| 'warning'
| 'info'
| 'dark'
| 'light'
| 'link'
| 'outline-primary'
| 'outline-secondary'
| 'outline-success'
| 'outline-danger'
| 'outline-warning'
| 'outline-info'
| 'outline-dark'
| 'outline-light')[] = [
   'primary',
   'secondary',
   'success',
   'danger',
   'warning',
   'info',
   'dark',
   'light',
   'link',
   'outline-primary',
   'outline-secondary',
   'outline-success',
   'outline-danger',
   'outline-warning',
   'outline-info',
   'outline-dark',
   'outline-light',
]

const command: Command = () => new Promise((resolve) => {
  action('Command executed')();
  resolve();
});

export const Text: React.FC = () => 
  <CommandButton label={text('Label', 'Command')} command={command}
    variant={select('Variant', variantOptions , undefined)} />;
