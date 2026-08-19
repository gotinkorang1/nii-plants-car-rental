import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

const meta = {
  title: "UI/Accordion",
  component: Accordion,
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: "single",
    collapsible: true,
  },
  render: () => (
    <Accordion type="single" collapsible className="max-w-lg">
      <AccordionItem value="booking">
        <AccordionTrigger>How do I start a self-drive booking?</AccordionTrigger>
        <AccordionContent>
          Choose dates, a pickup location in Accra, and a published model.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="deposit">
        <AccordionTrigger>Is the security deposit part of the rental?</AccordionTrigger>
        <AccordionContent>
          No. The refundable deposit is collected separately at pickup.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
