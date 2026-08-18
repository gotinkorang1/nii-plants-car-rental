import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Book a vehicle",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "View fleet",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Unavailable",
  },
};
