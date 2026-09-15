import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { VehicleImageFallback } from "./vehicle-image-fallback";

const meta = {
  title: "Fleet/VehicleImageFallback",
  component: VehicleImageFallback,
  args: {
    vehicleClass: "Compact sedan",
  },
  decorators: [
    (Story) => (
      <div className="h-64 w-full max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VehicleImageFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sedan: Story = {};

export const Suv: Story = {
  args: { vehicleClass: "Compact SUV" },
};

export const Offroad: Story = {
  args: { vehicleClass: "4x4" },
};

export const Coach: Story = {
  args: { vehicleClass: "Coach" },
};
