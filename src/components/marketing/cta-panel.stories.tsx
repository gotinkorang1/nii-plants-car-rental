import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CtaPanel } from "./cta-panel";

const meta = {
  title: "Marketing/CtaPanel",
  component: CtaPanel,
  args: {
    title: "Ready to hire a car?",
    body: "Check Accra availability or browse published models.",
  },
} satisfies Meta<typeof CtaPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
