import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app/app-shell";

const SPLASH_KEY = "nii-plants:splash-seen:v1";

function setMotionPreference(reducedMotion: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reducedMotion && query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    sessionStorage.clear();
    setMotionPreference(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders children immediately and dismisses the first-session splash", async () => {
    render(
      <AppShell>
        <main>Rental content</main>
      </AppShell>,
    );

    expect(screen.getByText("Rental content")).toBeInTheDocument();
    expect(screen.getByTestId("pwa-splash")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByTestId("pwa-splash")).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
    expect(sessionStorage.getItem(SPLASH_KEY)).toBe("1");
  });

  it("does not show the splash when reduced motion is preferred", async () => {
    setMotionPreference(true);

    render(
      <AppShell>
        <main>Rental content</main>
      </AppShell>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId("pwa-splash")).not.toBeInTheDocument();
    });
    expect(sessionStorage.getItem(SPLASH_KEY)).toBe("1");
  });

  it("shows and runs the install prompt when the browser provides it", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    let resolveUserChoice!: (choice: {
      outcome: "accepted" | "dismissed";
    }) => void;
    const userChoice = new Promise<{ outcome: "accepted" | "dismissed" }>(
      (resolve) => {
        resolveUserChoice = resolve;
      },
    );
    const installEvent = new Event("beforeinstallprompt", {
      cancelable: true,
    }) as Event & {
      prompt: typeof prompt;
      userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
    };
    installEvent.prompt = prompt;
    installEvent.userChoice = userChoice;

    render(
      <AppShell>
        <main>Rental content</main>
      </AppShell>,
    );
    fireEvent(window, installEvent);

    const installButton = await screen.findByRole("button", {
      name: "Install Nii Plants",
    });
    expect(installButton).toHaveClass("min-h-11");
    fireEvent.click(installButton);
    expect(prompt).toHaveBeenCalledOnce();

    resolveUserChoice({ outcome: "accepted" });
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Install Nii Plants" }),
      ).not.toBeInTheDocument();
    });
  });

  it("does not render an install control when the browser does not support it", async () => {
    render(
      <AppShell>
        <main>Rental content</main>
      </AppShell>,
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Install Nii Plants" }),
      ).not.toBeInTheDocument();
    });
  });
});
