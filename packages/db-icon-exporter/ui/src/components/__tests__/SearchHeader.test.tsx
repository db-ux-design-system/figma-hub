import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../test/test-utils";
import { SearchHeader } from "../SearchHeader";

describe("SearchHeader", () => {
  const defaultProps = {
    versionNumber: "",
    searchTerm: "",
    onVersionChange: vi.fn(),
    onSearchChange: vi.fn(),
  };

  it("should render version and filter inputs", () => {
    render(<SearchHeader {...defaultProps} />);

    expect(screen.getByLabelText(/version/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter icons/i)).toBeInTheDocument();
  });

  it("should display current version value", () => {
    render(<SearchHeader {...defaultProps} versionNumber="1.2.3" />);

    const versionInput = screen.getByLabelText(/version/i) as HTMLInputElement;
    expect(versionInput.value).toBe("1.2.3");
  });

  it("should display current search term", () => {
    render(<SearchHeader {...defaultProps} searchTerm="test-icon" />);

    const searchInput = screen.getByLabelText(
      /filter icons/i,
    ) as HTMLInputElement;
    expect(searchInput.value).toBe("test-icon");
  });

  it("should call onVersionChange when version input changes", async () => {
    const onVersionChange = vi.fn();
    render(
      <SearchHeader {...defaultProps} onVersionChange={onVersionChange} />,
    );

    const versionInput = screen.getByLabelText(/version/i);
    await userEvent.type(versionInput, "1.2.3");

    expect(onVersionChange).toHaveBeenCalled();
  });

  it("should call onSearchChange when filter input changes", async () => {
    const onSearchChange = vi.fn();
    render(<SearchHeader {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByLabelText(/filter icons/i);
    await userEvent.type(searchInput, "test");

    expect(onSearchChange).toHaveBeenCalled();
  });
});
