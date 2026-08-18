import type { Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
    },
    a11y: {
      test: "error",
    },
  },
  decorators: [
    (Story) => (
      <div
        className="bg-background p-6 font-sans text-foreground"
        style={{
          ["--font-interface" as string]: "system-ui, sans-serif",
          ["--font-display" as string]: "Georgia, serif",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
