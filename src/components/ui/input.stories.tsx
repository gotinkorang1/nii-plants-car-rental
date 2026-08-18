import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Input",
  component: Input,
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="pickup-location">Pickup location</Label>
      <Input
        id="pickup-location"
        name="pickupLocation"
        placeholder="Select a location"
      />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        name="email"
        type="email"
        defaultValue="not-an-email"
        aria-invalid
        aria-describedby="email-error"
      />
      <p id="email-error" className="text-sm text-error">
        Enter a valid email address.
      </p>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="disabled-field">Disabled field</Label>
      <Input id="disabled-field" name="disabled" disabled value="Unavailable" />
    </div>
  ),
};
