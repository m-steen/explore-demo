import React from 'react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from "@storybook/addon-knobs";
import { Button } from '@storybook/react/demo';

export default {
  title: 'Button',
  component: Button,
  decorators: [withKnobs]
};

export const Text: React.FC = () => <Button onClick={action('clicked')}>{text('Label', 'Hello Button')}</Button>;

export const Emoji: React.FC = () => (
  <Button onClick={action('clicked')}>
    <span role="img" aria-label="so cool">
      😀 😎 👍 💯
    </span>
  </Button>
);
