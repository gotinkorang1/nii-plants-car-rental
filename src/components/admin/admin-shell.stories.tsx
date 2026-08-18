import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AdminShell } from "./admin-shell";

const meta = {
  title: "Admin/AdminShell",
  component: AdminShell,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AuthenticatedShell: Story = {
  args: {
    staff: {
      displayName: "Reservations staff",
      email: "staff@niiplantsghana.com",
      role: "administrator",
    },
    children: (
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Storybook preview of the authenticated admin shell.
        </p>
      </div>
    ),
  },
};
