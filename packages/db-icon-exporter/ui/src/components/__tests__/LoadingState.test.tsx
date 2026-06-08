import { describe, it, expect } from "vitest";
import { render, screen } from "../../test/test-utils";
import { LoadingState } from "../LoadingState";

describe("LoadingState", () => {
  it("should render default loading message", () => {
    render(<LoadingState />);
    expect(screen.getByText(/loading icons/i)).toBeInTheDocument();
  });

  it("should render custom loading message", () => {
    render(<LoadingState message="Exporting icons..." />);
    expect(screen.getByText(/exporting icons/i)).toBeInTheDocument();
  });

  it("should display spinner", () => {
    const { container } = render(<LoadingState />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should have proper styling classes", () => {
    const { container } = render(<LoadingState />);
    const loadingDiv = container.firstChild;
    expect(loadingDiv).toHaveClass("p-fix-md", "flex", "flex-col");
  });
});
