import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app/app-shell";
import { registerServiceWorker } from "@/lib/pwa/register-service-worker";

const SPLASH_KEY = "nii-plants:splash-seen:v1";
const INSTALL_DISMISSED_KEY = "nii-plants:install-dismissed:v1";

function setBrowserState({ reducedMotion = false, installed = false } = {}) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches:
        (reducedMotion && query === "(prefers-reduced-motion: reduce)") ||
        (installed && query === "(display-mode: standalone)"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  Object.defineProperty(navigator, "standalone", {
    configurable: true,
    value: installed,
  });
}

describe("AppShell", () => {
  beforeEach(() => {
    sessionStorage.clear();
    setBrowserState();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete (navigator as Navigator & { standalone?: boolean }).standalone;
  });

  it("renders children immediately and dismisses the first-session splash", async () => {
    render(
      <AppShell>
        <main>Rental content</main>
      </AppShell>,
    );

    expect(screen.getByText("Rental content")).toBeInTheDocument();
    expect(await screen.findByTestId("pwa-splash")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByTestId("pwa-splash")).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
    expect(sessionStorage.getItem(SPLASH_KEY)).toBe("1");
  });

  it("does not show the splash for an existing browser session", async () => {
    sessionStorage.setItem(SPLASH_KEY, "1");

    render(
      <AppShell>
        <main>Rental content</main>
      </AppShell>,
    );

    expect(screen.getByText("Rental content")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId("pwa-splash")).not.toBeInTheDocument();
    });
  });

  it("does not show the splash when reduced motion is preferred", async () => {
    setBrowserState({ reducedMotion: true });

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

  it("suppresses the install affordance when already installed", async () => {
    setBrowserState({ installed: true });
    const installEvent = new Event("beforeinstallprompt", {
      cancelable: true,
    });

    render(
      <AppShell>
        <main>Rental content</main>
      </AppShell>,
    );
    fireEvent(window, installEvent);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Install Nii Plants" }),
      ).not.toBeInTheDocument();
    });
  });

  it("dismisses and remembers the install affordance for the session", async () => {
    const installEvent = new Event("beforeinstallprompt", {
      cancelable: true,
    }) as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
    };
    installEvent.prompt = vi.fn().mockResolvedValue(undefined);
    installEvent.userChoice = Promise.resolve({ outcome: "dismissed" });

    render(
      <AppShell>
        <main>Rental content</main>
      </AppShell>,
    );
    fireEvent(window, installEvent);
    expect(
      await screen.findByRole("button", { name: "Install Nii Plants" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss install prompt" }),
    );
    expect(
      screen.queryByRole("button", { name: "Install Nii Plants" }),
    ).not.toBeInTheDocument();
    expect(sessionStorage.getItem(INSTALL_DISMISSED_KEY)).toBe("1");

    fireEvent(window, installEvent);
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Install Nii Plants" }),
      ).not.toBeInTheDocument();
    });
  });

  it("hides the install control when prompting rejects", async () => {
    const prompt = vi.fn().mockRejectedValue(new Error("prompt unavailable"));
    const installEvent = new Event("beforeinstallprompt", {
      cancelable: true,
    }) as Event & {
      prompt: typeof prompt;
      userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
    };
    installEvent.prompt = prompt;
    installEvent.userChoice = Promise.resolve({ outcome: "dismissed" });

    render(
      <AppShell>
        <main>Rental content</main>
      </AppShell>,
    );
    fireEvent(window, installEvent);
    fireEvent.click(
      await screen.findByRole("button", { name: "Install Nii Plants" }),
    );

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

describe("registerServiceWorker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: undefined,
    });
  });

  it("resolves safely for synchronous and rejected registration failures", async () => {
    const register = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("sync failure");
      })
      .mockRejectedValueOnce(new Error("async failure"));
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { register },
    });

    await expect(registerServiceWorker()).resolves.toBeUndefined();
    await expect(registerServiceWorker()).resolves.toBeUndefined();
    expect(register).toHaveBeenCalledTimes(2);
  });
});
