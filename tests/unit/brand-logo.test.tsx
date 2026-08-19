import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandLogo } from "@/components/brand/brand-logo";

describe("BrandLogo", () => {
  it("renders the vector mark with an accessible name", () => {
    render(<BrandLogo />);
    expect(
      screen.getByRole("img", { name: "Nii Plants Car Rentals" }),
    ).toHaveAttribute("src", "/brand/nii-plants-logo.svg");
  });

  it("can be marked decorative when nearby text names the brand", () => {
    const { container } = render(<BrandLogo decorative />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });
});
