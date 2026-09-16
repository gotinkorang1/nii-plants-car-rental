import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

import { PublicHeader } from "@/components/marketing/public-header";
import type { PublicContact } from "@/lib/settings/public-contact";

const contact = {
  businessName: "Nii Plants",
  phone: "+233 20 000 0000",
  whatsapp: "+233 20 000 0000",
  email: "hello@example.com",
  address: "Accra",
  homepageHeadline: "",
  homepageSubheadline: "",
  socialLinks: {},
  reservationPaymentPercent: 25,
  minimumRentalHours: 24,
} satisfies PublicContact;

describe("PublicHeader", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    navigation.pathname = "/";
    document.body.style.overflow = "";
  });

  it("traps mobile navigation and restores focus when Escape closes it", () => {
    render(<PublicHeader contact={contact} />);
    const menuButton = screen.getByRole("button", { name: "Menu" });

    fireEvent.click(menuButton);

    const panel = screen.getByTestId("mobile-menu-panel");
    expect(panel).toHaveAttribute("role", "dialog");
    expect(document.body.style.overflow).toBe("hidden");
    const firstLink = panel.querySelector('a[href="/fleet"]');
    expect(firstLink).not.toBeNull();
    expect(document.activeElement).toBe(firstLink);

    const links = screen.getAllByRole("link");
    const lastFocusable = links[links.length - 1];
    lastFocusable.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(firstLink);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("mobile-menu-panel")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(menuButton);
  });

  it("closes the mobile menu when the route changes", () => {
    const { rerender } = render(<PublicHeader contact={contact} />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByTestId("mobile-menu-panel")).toBeInTheDocument();

    navigation.pathname = "/fleet";
    rerender(<PublicHeader contact={contact} />);

    expect(screen.queryByTestId("mobile-menu-panel")).not.toBeInTheDocument();
  });
});
