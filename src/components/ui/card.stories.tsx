import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "UI/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Vehicle class</CardTitle>
        <CardDescription>
          Compact sedan, mid-size sedan, SUV, and 4x4 classes for hire in Ghana.
        </CardDescription>
      </CardHeader>
      <CardContent>
        Daily rates appear in Ghana cedis once finance publishes them.
      </CardContent>
    </Card>
  ),
};
