import React from 'react';
import { withKnobs, text, select } from "@storybook/addon-knobs";
import { action } from '@storybook/addon-actions';
import { CommandButton, Command, ICommandButton } from '../components/CommandButton';
import "bootstrap/dist/css/bootstrap.min.css";
import { TitleBar } from '../components/TitleBar';

export default {
  title: 'TitleBar',
  component: TitleBar,
  decorators: [withKnobs]
};

const bgColorOptions = [
   'primary',
   'secondary',
   'success',
   'info',
   'warning',
   'danger',
   'light',
   'dark',
   'white',
   'transparent',
]

const command: (label: string) => Command =
  (label: string) =>
    () => new Promise((resolve) => {
      action('Executed: ' + label)();
      resolve();
    });

const menuItems: ICommandButton[] = [
  { label: 'Share', command: command('Share') },
  { label: 'Save', command: command('Save') }
];

export const MainTitleBar: React.FC = () => 
  <TitleBar title={text('Title', 'Main Titlebar')} menuItems={menuItems}
    variant={select('Variant', {light: 'light', dark: 'dark', undefined: undefined}, 'dark')}
    bg={select('bg', bgColorOptions, 'secondary')}
     />;
