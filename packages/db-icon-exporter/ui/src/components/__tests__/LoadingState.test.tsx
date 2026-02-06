import { describe, it, expect } from "vitest";
import { render, screen } from "../../test/test-utils";
import { LoadingState } from "../LoadingState";

describe("LoadingState", () => {
  it("should render loading message", () => {
    render(<LoadingState />);
    expect(screen.getByText(/loading icons/i)).toBeInTheDocument();
  });

  it("should have proper styling classes", () => {
    const { container } = render(<LoadingState />);
    const loadingDiv = container.firstChild;
    expect(loadingDiv).toHaveClass(
      "p-fix-md",
      "flex",
      "flex-col",
      "gap-fix-md",
    );
  });
});
